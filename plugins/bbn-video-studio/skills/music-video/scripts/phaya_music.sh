#!/usr/bin/env bash
# phaya text-to-music over REST (fallback when the phaya MCP connector fails), plus take download/transcode.
#   PHAYA_API_KEY=... phaya_music.sh balance
#   PHAYA_API_KEY=... phaya_music.sh generate <project> "<title>" [f|m] [V5]   # prompt=song/lyrics.txt, style=song/style.txt
#   phaya_music.sh fetch <project> <audio_url> [<audio_url> ...]               # also use after the MCP generate_music
#   PHAYA_SONG_DIR=music ... generate . "<title>"   # short-ex-3d bed: music/lyrics.txt "[Instrumental]" -> instrumental,
#                                                   # prompt = music/caption.txt, style = style.txt or the caption's start
# Takes land in <project>/$PHAYA_SONG_DIR (default song)/take{0,1}.mp3 + .wav. The WAV is the truth: phaya MP3
# headers misreport length. No account/key yet: sign up, top up and copy the API key at https://phaya.io
# Uses curl on purpose: phaya's Cloudflare returns 403 to Python urllib's user agent.
set -euo pipefail
BASE="${PHAYA_BASE:-https://api.phaya.io/api/v1}"
SONG="${PHAYA_SONG_DIR:-song}"
cmd="${1:?balance|generate|fetch}"; shift
# checked here, not inside auth(): a failing $(auth) would not stop curl under set -e
[ "$cmd" = fetch ] || [ -n "${PHAYA_API_KEY:-}" ] || { echo "set PHAYA_API_KEY first (env var only, never a file). No key yet: sign up, top up and copy it at https://phaya.io" >&2; exit 2; }
auth() { echo "Authorization: Bearer $PHAYA_API_KEY"; }
fetch() {
  local dir="$1/$SONG" i=0; shift; mkdir -p "$dir"
  for u in "$@"; do
    curl -sS -m 180 -o "$dir/take$i.mp3" "$u"
    ffmpeg -v error -y -i "$dir/take$i.mp3" -ac 2 -ar 44100 "$dir/take$i.wav"
    echo "take$i: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dir/take$i.wav")s"
    i=$((i + 1))
  done
}
case "$cmd" in
  balance) curl -sS -m 30 "$BASE/user/credits" -H "$(auth)"; echo ;;
  fetch) fetch "$@" ;;
  generate)
    P="${1:?project}"; TITLE="${2:?title}"; GENDER="${3:-f}"; MODEL="${4:-V5}"
    REQ="$(mktemp)"; STATUS="$(mktemp)"
    python3 - "$P/$SONG" "$TITLE" "$GENDER" "$MODEL" "$REQ" <<'PY'
import json, os, sys
d, title, gender, model, out = sys.argv[1:]
read = lambda f: open(f'{d}/{f}', encoding='utf-8').read().strip() if os.path.exists(f'{d}/{f}') else ''
lyrics, caption = read('lyrics.txt'), read('caption.txt')
inst = lyrics.lower() == '[instrumental]'
style = read('style.txt') or caption[:100].rsplit(',', 1)[0]
prompt = (caption or style) if inst else lyrics
assert prompt, f'nothing to send: write {d}/lyrics.txt (or [Instrumental] + caption.txt)'
assert len(prompt) <= 2000, f'prompt is {len(prompt)} chars; phaya/Suno prompt max is 2000 (Thai vowels and tone marks count)'
assert 0 < len(style) <= 100, f'style is {len(style)} chars; need 1-100 (style.txt, or a caption.txt to cut from)'
json.dump({'prompt': prompt, 'style': style, 'title': title, 'model': model, 'vocal_gender': gender,
           'instrumental': inst}, open(out, 'w'), ensure_ascii=False)
PY
    JOB=$(curl -sS -m 60 -X POST "$BASE/text-to-music/generate" -H "$(auth)" -H "Content-Type: application/json" --data-binary @"$REQ" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('job_id') or sys.exit('generate failed: '+json.dumps(d)))")
    echo "job $JOB (3 credits, 2 takes)"
    for _ in $(seq 1 120); do
      curl -sS -m 30 "$BASE/text-to-music/status/$JOB" -H "$(auth)" > "$STATUS"
      st=$(python3 -c "import json; print(json.load(open('$STATUS')).get('status'))")
      [ "$st" = COMPLETED ] || [ "$st" = FAILED ] && break
      sleep 5
    done
    [ "$st" = COMPLETED ] || { cat "$STATUS"; exit 1; }
    URLS=($(python3 -c "import json; print(' '.join(json.load(open('$STATUS'))['audio_urls']))"))
    fetch "$P" "${URLS[@]}"
    rm -f "$REQ" "$STATUS" ;;
  *) echo "unknown command $cmd"; exit 1 ;;
esac

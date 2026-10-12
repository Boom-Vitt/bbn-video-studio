#!/usr/bin/env bash
# phaya text-to-music over REST (fallback when the phaya MCP connector fails), plus take download/transcode.
#   PHAYA_API_KEY=... phaya_music.sh balance
#   PHAYA_API_KEY=... phaya_music.sh generate <project> "<title>" [f|m] [V5]   # prompt=song/lyrics.txt, style=song/style.txt
#   phaya_music.sh fetch <project> <audio_url> [<audio_url> ...]               # also use after the MCP generate_music
# Takes land in <project>/song/take{0,1}.mp3 + .wav. The WAV is the truth: phaya MP3 headers misreport length.
# Uses curl on purpose: phaya's Cloudflare returns 403 to Python urllib's user agent.
set -euo pipefail
BASE="${PHAYA_BASE:-https://api.phaya.io/api/v1}"
cmd="${1:?balance|generate|fetch}"; shift
auth() { : "${PHAYA_API_KEY:?export PHAYA_API_KEY first (never write it to a file)}"; echo "Authorization: Bearer $PHAYA_API_KEY"; }
fetch() {
  local dir="$1/song" i=0; shift; mkdir -p "$dir"
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
    python3 - "$P" "$TITLE" "$GENDER" "$MODEL" "$REQ" <<'PY'
import json, sys
p, title, gender, model, out = sys.argv[1:]
lyrics = open(f'{p}/song/lyrics.txt', encoding='utf-8').read()
style = open(f'{p}/song/style.txt', encoding='utf-8').read().strip()
assert len(lyrics) <= 2000, f'lyrics are {len(lyrics)} chars; phaya/Suno prompt max is 2000 (Thai vowels and tone marks count)'
assert len(style) <= 100, f'style is {len(style)} chars; max 100'
json.dump({'prompt': lyrics, 'style': style, 'title': title, 'model': model, 'vocal_gender': gender,
           'instrumental': False}, open(out, 'w'), ensure_ascii=False)
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

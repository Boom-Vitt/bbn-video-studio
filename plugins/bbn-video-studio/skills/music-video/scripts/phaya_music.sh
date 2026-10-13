#!/usr/bin/env bash
# phaya text-to-music over REST (fallback when the phaya MCP connector fails), plus take download/transcode.
#   phaya_music.sh login      # once: a popup asks for the key (hidden), checks it with phaya, saves it for this user
#   phaya_music.sh logout     # forget the saved key
#   phaya_music.sh balance
#   phaya_music.sh generate <project> "<title>" [f|m] [V5]   # prompt=song/lyrics.txt, style=song/style.txt
#   phaya_music.sh fetch <project> <audio_url> [<audio_url> ...]               # also use after the MCP generate_music
#   PHAYA_SONG_DIR=music ... generate . "<title>"   # short-ex-3d bed: music/lyrics.txt "[Instrumental]" -> instrumental,
#                                                   # prompt = music/caption.txt, style = style.txt or the caption's start
# Takes land in <project>/$PHAYA_SONG_DIR (default song)/take{0,1}.mp3 + .wav. The WAV is the truth: phaya MP3
# headers misreport length. No account/key yet: sign up, top up and copy the API key at https://phaya.io
# Uses curl on purpose: phaya's Cloudflare returns 403 to Python urllib's user agent.
set -euo pipefail
BASE="${PHAYA_BASE:-https://api.phaya.io/api/v1}"
SONG="${PHAYA_SONG_DIR:-song}"
cmd="${1:?login|logout|balance|generate|fetch}"; shift
# The key: $PHAYA_API_KEY when set, else the one `login` saved: macOS Keychain, or on Windows (Git Bash) a file in
# %APPDATA%\bbn-video-studio encrypted for the Windows user (DPAPI). Never in the project, never in the chat.
case "$(uname -s)" in Darwin) OS=mac ;; MINGW*|MSYS*|CYGWIN*) OS=win ;; *) OS=other ;; esac
KC=(-a "$USER" -s bbn-video-studio-phaya)
# PowerShell 5.1 snippet, UTF-16 encoded so Thai text survives the Windows code page; stdin passes through.
# Errors are terminating, so a failed cmdlet makes ps1 fail (pipefail carries it through tr).
ps1() {
  local enc
  enc=$(printf %s '$ErrorActionPreference = "Stop"; ' "$1" | iconv -f UTF-8 -t UTF-16LE | base64 | tr -d '\n') || return
  powershell.exe -NoProfile -EncodedCommand "$enc" | tr -d '\r'
}
WINF='$f = Join-Path $env:APPDATA "bbn-video-studio\phaya.key"; '
ask_key() {
  if [ -t 0 ]; then read -rsp 'phaya API key (from https://phaya.io): ' k; echo >&2; printf %s "$k"; return; fi
  case "$OS" in # no terminal (run by Claude, or a non-technical user): a native popup with a hidden field
    mac) osascript -e 'text returned of (display dialog "วาง phaya API key แล้วกด OK" & return & "ยังไม่มี key: สมัคร เติมเครดิต และคัดลอก key ที่ https://phaya.io" default answer "" with hidden answer with title "bbn-video-studio · phaya" giving up after 300)' ;;
    win) ps1 '$c = Get-Credential -UserName "phaya" -Message "วาง phaya API key ในช่อง Password แล้วกด OK`nยังไม่มี key: สมัคร เติมเครดิต และคัดลอก key ที่ https://phaya.io"; if ($c) { $c.GetNetworkCredential().Password }' ;;
  esac
}
save_key() { # key on stdin, so it never shows up in a process list
  case "$OS" in
    mac) { printf 'add-generic-password -U -a "%s" -s bbn-video-studio-phaya -w "' "$USER"; cat; printf '"\n'; } | security -i >/dev/null
         security find-generic-password "${KC[@]}" >/dev/null 2>&1 ;;
    win) ps1 "$WINF"'New-Item -ItemType Directory -Force -Path (Split-Path $f) | Out-Null; [Console]::In.ReadToEnd().Trim() | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -Path $f' >/dev/null ;;
  esac
}
load_key() {
  case "$OS" in
    mac) security find-generic-password "${KC[@]}" -w 2>/dev/null || true ;;
    win) ps1 "$WINF"'if (Test-Path $f) { (New-Object Net.NetworkCredential("", (Get-Content $f | ConvertTo-SecureString))).Password }' 2>/dev/null || true ;;
  esac
}
status() { printf 'Authorization: Bearer %s\n' "$1" | curl -sS -m 30 -o /dev/null -w '%{http_code}' "$BASE/user/credits" -H @-; }
case "$cmd" in
  login)
    [ "$OS" != other ] || { echo "login saves the key on macOS and Windows; here set PHAYA_API_KEY instead" >&2; exit 2; }
    [ "$OS" != win ] || command -v iconv >/dev/null || { echo "this Git for Windows has no iconv (2.53.x): update Git for Windows, or set PHAYA_API_KEY" >&2; exit 2; }
    KEY=$(ask_key | tr -d '[:space:]') || true
    case "$KEY" in ''|*[\"\\]*) echo "no key entered (cancelled, timed out, or it has quotes/backslashes)" >&2; exit 2 ;; esac
    code=$(status "$KEY"); [ "$code" = 200 ] || { echo "phaya rejected that key (HTTP $code). Copy it again from https://phaya.io" >&2; exit 2; }
    printf %s "$KEY" | save_key || { echo "could not save the key" >&2; exit 1; }
    echo "phaya key OK and saved for this user ($OS); you won't be asked again"; exit 0 ;;
  logout)
    case "$OS" in
      mac) security delete-generic-password "${KC[@]}" >/dev/null 2>&1 && echo "phaya key removed" || echo "no saved phaya key" ;;
      win) ps1 "$WINF"'if (Test-Path $f) { Remove-Item $f; "phaya key removed" } else { "no saved phaya key" }' ;;
      *) echo "nothing saved on this OS" ;;
    esac; exit 0 ;;
esac
KEY="${PHAYA_API_KEY:-}"
[ -n "$KEY" ] || KEY=$(load_key)
[ "$cmd" = fetch ] || [ -n "$KEY" ] || { echo "no phaya key: run 'phaya_music.sh login' (a popup asks once and saves it). No account yet: https://phaya.io" >&2; exit 2; }
auth() { printf 'Authorization: Bearer %s\n' "$KEY"; }   # piped into curl -H @-: the key stays off the command line
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
  balance) auth | curl -sS -m 30 "$BASE/user/credits" -H @-; echo ;;
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
    JOB=$(auth | curl -sS -m 60 -X POST "$BASE/text-to-music/generate" -H @- -H "Content-Type: application/json" --data-binary @"$REQ" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('job_id') or sys.exit('generate failed: '+json.dumps(d)))")
    echo "job $JOB (3 credits, 2 takes)"
    for _ in $(seq 1 120); do
      auth | curl -sS -m 30 "$BASE/text-to-music/status/$JOB" -H @- > "$STATUS"
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

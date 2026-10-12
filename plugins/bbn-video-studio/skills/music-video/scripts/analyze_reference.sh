#!/usr/bin/env bash
# Download a reference music video and extract what you need to study it:
# metadata.txt, ref.mp4, frames/ (1 per 4s), sheets/ (4x5 contact sheets), analysis.json + transcript.txt.
#   analyze_reference.sh <youtube-url> <outdir> [lang]
set -euo pipefail
URL="${1:?url}"; OUT="${2:?outdir}"; LANG_HINT="${3:-}"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${CLAUDE_SONG_VENV:-$HOME/.cache/claude-song-bbn/venv}"
mkdir -p "$OUT/frames" "$OUT/sheets"
cd "$OUT"
yt-dlp --skip-download --print "%(title)s | %(uploader)s | %(duration)ss" --print description "$URL" > metadata.txt 2>/dev/null || true
yt-dlp -q -f "bv*[height<=720]+ba/b[height<=720]" -o "ref.%(ext)s" --merge-output-format mp4 "$URL"
ffmpeg -v error -y -i ref.mp4 -vf "fps=1/4,scale=480:-1" frames/f_%03d.jpg
ffmpeg -v error -y -pattern_type glob -i 'frames/*.jpg' -vf "tile=4x5:padding=4" sheets/sheet_%02d.jpg
ffmpeg -v error -y -i ref.mp4 -vn -ac 1 -ar 16000 ref16k.wav
ffmpeg -v error -y -i ref.mp4 -vn -ac 2 -ar 44100 ref.wav
"$VENV/bin/python" -I "$SKILL/scripts/analyze_reference.py" ref16k.wav ref.wav analysis.json $LANG_HINT 2>&1 | grep -vE "Warning|Fetching" || true
ls sheets

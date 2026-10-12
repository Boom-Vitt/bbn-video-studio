#!/usr/bin/env bash
# Scaffold a music-video project: <dir>/song (lyrics, style, scene map) + <dir>/video (three.js engine).
# Also prepares the shared Python venv (mlx-whisper + librosa) used for alignment.
#   new_project.sh <dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?usage: new_project.sh <dir>}"
VENV="${BBN_VIDEO_VENV:-$HOME/.venvs/bbn-video-studio}"
mkdir -p "$DIR"
[ -e "$DIR/video/package.json" ] && { echo "refusing: $DIR/video already exists"; exit 1; }
cp -R "$SKILL/template/." "$DIR/"
(cd "$DIR/video" && npm install --silent)
if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q mlx-whisper librosa soundfile
fi
echo "project: $DIR"
echo "venv:    $VENV  (use \$VENV/bin/python -I for align.py / clip_check.py)"

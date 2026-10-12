#!/usr/bin/env bash
# Scaffold an explainer-video project: song/ (script, voice, assemble), blender/ (bridge + logos), music/, sfx/, video/ (engine).
#   new_story.sh <dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?usage: new_story.sh <dir>}"
[ -n "$(ls -A "$DIR" 2>/dev/null)" ] && { echo "refusing: $DIR is not empty"; exit 1; }
mkdir -p "$DIR"
cp -R "$SKILL/template/." "$DIR/"
(cd "$DIR/video" && npm install --silent)
echo "project: $DIR — next: song/lyrics.txt, song/scenes.json, ref/logos/*.svg"

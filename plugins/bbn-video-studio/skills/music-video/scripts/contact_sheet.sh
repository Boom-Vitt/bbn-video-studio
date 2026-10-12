#!/usr/bin/env bash
# Review a render at a glance: one frame every N seconds, tiled 4x4. Read the sheets as images.
#   contact_sheet.sh <video.mp4> <outdir> [every_s=4] [start_s=0]
set -euo pipefail
V="${1:?video}"; OUT="${2:?outdir}"; EVERY="${3:-4}"; START="${4:-0}"
rm -rf "$OUT"; mkdir -p "$OUT"
ffmpeg -v error -ss "$START" -i "$V" -vf "fps=1/$EVERY,scale=480:-1" "$OUT/f_%03d.jpg"
ffmpeg -v error -pattern_type glob -i "$OUT/f_*.jpg" -vf "tile=4x4:padding=4" "$OUT/sheet_%02d.jpg"
ls "$OUT"/sheet_*.jpg

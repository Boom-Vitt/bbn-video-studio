#!/usr/bin/env bash
# Check every tool the pipeline needs; prints the fix for anything missing.   scripts/doctor.sh
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PY="${PY:-$HOME/.venvs/blender-explainer/bin/python}"
ok() { printf '  ok   %s\n' "$1"; }
no() { printf '  MISS %s -> %s\n' "$1" "$2"; bad=1; }
bad=0
BV=$("$BLENDER" --version 2>/dev/null | head -1)   # "Blender 5.2.1 LTS"; seq_lib uses the 5.x EEVEE engine id
[ "$(echo "$BV" | awk '{split($2, v, "."); print v[1]}')" -ge 5 ] 2>/dev/null && ok "$BV" || no "Blender 5+" "install from blender.org, or export BLENDER=<path to binary>"
[ -x "$CHROME" ] && ok "Chrome (frame renderer)" || no Chrome "install Google Chrome, or export CHROME=<path to binary>"
command -v node >/dev/null && node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 22 || (a == 22 && b >= 12) ? 0 : 1)' && ok "node $(node -v)" || no "node 22.12+" "brew install node"
command -v ffmpeg >/dev/null && ok ffmpeg || no ffmpeg "brew install ffmpeg"
"$PY" -c 'import voxcpm, mlx_whisper, soundfile, librosa' 2>/dev/null && ok "Python env $PY" || no "Python env" "scripts/setup.sh, then export PY=$PY"
[ -d "${ACESTEP_HOME:-$HOME/ACE-Step-1.5}/.venv" ] && ok "ACE-Step (music, optional)" || echo "  --   ACE-Step not installed (optional, see scripts/setup.sh); use your own music/bed.wav"
exit $bad

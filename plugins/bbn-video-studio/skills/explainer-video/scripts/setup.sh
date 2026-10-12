#!/usr/bin/env bash
# One-time setup: a Python env for the voice (VoxCPM2), the whisper check and the audio scripts.
#   scripts/setup.sh           -> $EXPLAINER_VENV (default ~/.venvs/blender-explainer); then export PY=<venv>/bin/python
# Optional music model (≈ 40 GB of models, heavy on RAM; any licensed bed at music/bed.wav works instead):
#   git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/ACE-Step-1.5 && cd ~/ACE-Step-1.5 && uv sync
#   uv run acestep-download && uv run acestep-download -m acestep-v15-xl-sft && uv run acestep-download -m acestep-5Hz-lm-4B
set -euo pipefail
VENV="${EXPLAINER_VENV:-$HOME/.venvs/blender-explainer}"
command -v uv >/dev/null || { echo "install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
uv venv --allow-existing --python 3.11 "$VENV"
uv pip install --python "$VENV/bin/python" voxcpm mlx-whisper soundfile numpy librosa
printf 'done. add to your shell: export PY=%q\n' "$VENV/bin/python"

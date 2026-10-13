"""Music bed: <dir>/caption.txt + <dir>/lyrics.txt ("[Instrumental]") -> <dir>/take{N}.wav via ACE-Step 1.5 (local, MIT).

Run with ACE-Step's venv:
  "${ACESTEP_HOME:-$HOME/ACE-Step-1.5}"/.venv/bin/python "$SKILL"/scripts/music.py music --bpm 118 --key "D minor" --duration 48 --lang en --seeds 1,2
(run from the project dir; SKILL = this skill's folder)
Uses <song-dir>/caption.txt (rich ACE-Step caption, no BPM/key) when present, else style.txt.
Writes <out-dir>/<prefix>{i}.wav plus a .json sidecar with the exact settings.
"""
import argparse
import json
import os
import shutil
import sys
import time

ACE = os.environ.get("ACESTEP_HOME", os.path.expanduser("~/ACE-Step-1.5"))
sys.path.insert(0, ACE)

from acestep.handler import AceStepHandler  # noqa: E402
from acestep.inference import GenerationConfig, GenerationParams, generate_music  # noqa: E402
from acestep.llm_inference import LLMHandler  # noqa: E402

p = argparse.ArgumentParser()
p.add_argument("song_dir")
p.add_argument("--out-dir")
p.add_argument("--bpm", type=int)
p.add_argument("--key", default="", help='e.g. "E major"; with bpm+timesig+duration the LM skips metadata planning')
p.add_argument("--timesig", default="4")
p.add_argument("--duration", type=float, default=-1)
p.add_argument("--lang", default="th")
p.add_argument("--seeds", default="1,2", help="one take per seed")
p.add_argument("--dit", default="acestep-v15-xl-sft")  # 4B DiT, highest quality
p.add_argument("--lm", default="acestep-5Hz-lm-4B")  # largest planner LM
p.add_argument("--vae", default=None, help="e.g. scragvae (alt decoder)")
p.add_argument("--steps", type=int, default=50)
p.add_argument("--cfg", type=float, default=7.0)
p.add_argument("--shift", type=float, default=3.0)
p.add_argument("--lm-temp", type=float, default=0.85)
p.add_argument("--lm-cfg", type=float, default=2.0)
p.add_argument("--cot-caption", action="store_true", help="let the LM rewrite the caption (off: ours is used verbatim)")
p.add_argument("--prefix", default="take")
a = p.parse_args()

out_dir = a.out_dir or a.song_dir
os.makedirs(out_dir, exist_ok=True)
lyrics = open(os.path.join(a.song_dir, "lyrics.txt"), encoding="utf-8").read()
cap_file = os.path.join(a.song_dir, "caption.txt")
caption = open(cap_file if os.path.exists(cap_file) else os.path.join(a.song_dir, "style.txt"), encoding="utf-8").read().strip()
seeds = [int(s) for s in a.seeds.split(",")]

dit = AceStepHandler()
msg, ok = dit.initialize_service(project_root=ACE, config_path=a.dit, device="auto", offload_to_cpu=False,
                                 **({"vae_checkpoint": a.vae} if a.vae else {}))
if not ok:
    sys.exit(f"DiT init failed: {msg}")
lm = LLMHandler()
msg, ok = lm.initialize(checkpoint_dir=os.path.join(ACE, "checkpoints"), lm_model_path=a.lm,
                        backend="mlx" if sys.platform == "darwin" else "vllm", device="auto", offload_to_cpu=False, dtype=None)
if not ok:
    sys.exit(f"LM init failed: {msg}")

tmp = os.path.join(out_dir, ".acestep_out")
for i, seed in enumerate(seeds):
    t0 = time.time()
    res = generate_music(dit, lm, params=GenerationParams(
        task_type="text2music", thinking=True, caption=caption, lyrics=lyrics, vocal_language=a.lang,
        bpm=a.bpm, keyscale=a.key, timesignature=a.timesig, duration=a.duration,
        inference_steps=a.steps, guidance_scale=a.cfg, shift=a.shift, seed=seed,
        lm_temperature=a.lm_temp, lm_cfg_scale=a.lm_cfg, use_cot_caption=a.cot_caption, use_cot_language=False,
    ), config=GenerationConfig(batch_size=1, use_random_seed=False, seeds=[seed], audio_format="wav"), save_dir=tmp)
    if not res.success:
        sys.exit(f"seed {seed} failed: {res.status_message}")
    out = os.path.join(out_dir, f"{a.prefix}{i}.wav")
    shutil.move(res.audios[0]["path"], out)
    json.dump({**vars(a), "seed": seed, "caption": caption}, open(out[:-4] + ".json", "w"), ensure_ascii=False, indent=1)
    print(f"{out}  seed={seed}  {time.time() - t0:.0f}s", flush=True)
shutil.rmtree(tmp, ignore_errors=True)

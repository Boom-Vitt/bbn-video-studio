---
name: short-ex-3d
description: >-
  Make a vertical (9:16, 1080×1920) 3D explainer short (≈45–90 s, length by content) end to end from Claude Code: hook-first narrated
  script, narrated at natural pace (the owner's consented voice-clone kit when BBN_VOICE_KIT is set, else an open-source
  designed TTS narrator, VoxCPM2 Voice Design), photoreal Blender EEVEE scenes rendered through
  one shared headless Blender bridge, three.js overlays locked to the Blender camera, real 3D brand logos from their
  SVGs, burned-in captions, music bed (user's pick: open-source ACE-Step or phaya API) + SFX, MP4 + post caption in ~/Downloads. Scenes are
  built in parallel by Claude Code subagents. Thai by default. Use for "ทำคลิปสั้นอธิบาย", "ทำวิดีโอ 3D",
  "explainer video", "Blender animation", TikTok/Reels/Shorts explainers.
---

# short-ex-3d

Use this skill for short vertical 3D videos. For chaptered explanations or longer lessons, use the sibling
`long-ex` skill; its timing and output contract are separate from this short-form engine.

Proven on three Thai shorts (~45 s each): a neutral ChatGPT/Claude/Gemini product film, a mascot adventure
("where does your message go?") and a privacy explainer. `examples/` holds the first two (scripts, briefs, worker
specs, Blender scripts, stills) — read them for the quality bar before writing your own.

```
topic ─► script (hook-first, length by content) ─► narrator voice ─► VO lines ─► whisper check ─► assemble ─► cues
                       └─► logos/props (Blender) ─► brief + worker specs ─► parallel subagents (EEVEE plates + three.js)
music bed + SFX mix ─► render ─► contact-sheet check ─► ~/Downloads (.mp4 + .txt caption)
```

## Rules
- Narration, not singing. Copy a reference's storytelling craft, never its content. Every factual claim needs a
  source (keep them in `ref/facts.md`); hedge what the sources hedge.
- Voice: the owner's bbn-voice-clone kit (consented reference) when `BBN_VOICE_KIT` is set, else open-source TTS with a
  *designed* voice. Never clone a real person's voice without their written consent.
- Natural pace, length by content (≈45–90 s; no hard cap). Rushed, clipped narration was rejected by the owner: keep
  `VO_TEMPO` 1.0 and the assembler's natural pauses. Line 1 speaks the hook at t≈0.1 s: no intro, no logo sting. Last line = next-episode teaser +
  "กดติดตาม" (or the language's follow CTA).
- Something to share (repo, tool, template, source) = a comment gate, never "link below / in the description": the
  closing line asks "คอมเมนต์ว่า <KEYWORD> เดี๋ยวส่งให้" (short keyword, shown big on the end card) and the post caption
  repeats the ask with no URL to that resource, sources included; the owner sends it to commenters.
- Photoreal 3D: Blender EEVEE plates + three.js. Blender ONLY through the shared bridge (`blender/bridge.py`): one
  headless Blender per machine, never the Blender app, never one Blender per worker (parallel launches crash GPU
  kernel compiles).
- Brand marks: build them from the official SVG (Wikimedia Commons, needs a User-Agent header), never redraw or
  recolour them; keep comparisons neutral; credit "logos are trademarks of their owners".
- One heavy job at a time: VoxCPM, ACE-Step and full renders each take many GB of RAM. Before starting one:
  `pgrep -fl "music.py|render.mjs|vo.py|design.py"` and wait for anything already running.
- API keys: the phaya `login` popup (macOS Keychain / Windows DPAPI) or env vars; never in project files or chat. Reply in the user's language, short. No commits unless asked.

## 0. Setup (once per machine)
`$SKILL` = this skill's folder (the base directory shown when the skill loads); every other command runs from the
project folder.
```bash
"$SKILL"/scripts/setup.sh     # uv venv with voxcpm, mlx-whisper, soundfile, librosa → prints `export PY=...`
"$SKILL"/scripts/doctor.sh    # Blender 5+, Chrome, node 22.12+, ffmpeg, the Python env, ACE-Step (optional)
```
Tested on Apple Silicon macOS with Blender 5.2 (seq_lib needs 5.x) (mlx-whisper is Apple-only). `$BLENDER` / `$CHROME` override the
default app paths. First voice run downloads VoxCPM2 (~5 GB) from Hugging Face.

## 1. Project
```bash
"$SKILL"/scripts/new_story.sh <dir> && cd <dir>      # copies template/, npm install
```
Layout: `song/` (lyrics.txt, scenes.json, voice/design.py + narrator.wav, myvoice/vo.py, vo/assemble.py), `blender/`
(bridge.py, run.py, seq_lib.py, logos.py, mascot.py), `music/` (caption.txt), `sfx/` (synthesised wavs, mix.py),
`video/` (Vite + three.js 1080×1920 engine: captions, film pass, bloom, seq.ts, render.mjs, cues.mjs), `brief.md`
(worker brief to fill in), `ref/logos/*.svg`.

## 2. Script → `song/lyrics.txt`
5 sections × 2 lines (`[hook] [a] [b] [c] [outro]`; unique lowercase a–z0–9 names, they become the line ids
`hook-1`, `hook-2`, … in vo.py, assemble.py, cues.mjs, scenes.json and mix.py). `*word*` = yellow caption keyword.
- **Length = content, not speed.** Natural pace runs ≈ 9–10 Thai characters per second (lyrics without `*` and
  newlines): ~750 characters ≈ 80 s. Write full, easy sentences (sections may have 2–3 lines); measure after
  assemble. Too thin → add substance (a sourced number, a comparison, what it means for the viewer). Never speed the
  voice up to fit a length.
- **Hook (two lines).** hook-1 names the famous subjects outright + the question, spoken from t≈0.1 s
  ("มาแกะดูแอปชื่อดัง Claude ChatGPT Gemini Cursor และ Antigravity ว่าข้างในจริงๆ ทำมาจากอะไร",
  "มีเงินก้อนนึง ตอนนี้ลงอะไรคุ้มสุด? ทอง พันธบัตร หรือบิตคอยน์"). hook-2 = the most surprising sourced number or
  contrast + the promise ("ทองร่วงกว่าพันดอลลาร์ ส่วนดอกเบี้ยสหรัฐสูงสุดในรอบ 24 ปี ดูตัวเลขจริงกัน"). On screen
  the hook scene is composed at frame 0 (title + every option visible) and each option or number punches in on its
  spoken word (take word times from whisper `word_timestamps=True` on song/vo.wav).
`song/scenes.json` maps each scene id to its first line. Loanwords get a spoken spelling in
`SAY` (vo.py): ChatGPT→แชตจีพีที, Claude→คล็อด, AI→เอไอ; digits are spelled out by `spoken()`.

## 3. Voice (VoxCPM2, Apache-2.0, local)
`song/voice/narrator.wav` is a ready designed narrator (young Thai male tech creator) with its `PROMPT_TEXT` in vo.py.
For a new narrator: edit `DESC` in design.py, `$PY song/voice/design.py` → `cand_*.wav`; listen, and whisper them
(`$PY -c "import mlx_whisper,sys;[print(f,mlx_whisper.transcribe(f,path_or_hf_repo='mlx-community/whisper-large-v3-turbo',language='th')['text']) for f in sys.argv[1:]]" song/voice/cand_*.wav`);
pick clear words, lively pitch, ~5 syl/s; copy it to narrator.wav and set `PROMPT_TEXT` to the words it says.
```bash
$PY song/myvoice/vo.py a              # one wav per line: song/vo/<id>_a.wav   (vo.py a --print: the spoken text)
$PY "$SKILL"/scripts/vocheck.py .     # whisper ratio per line; Latin words lower it, read the transcript
```
The seed is fixed, so a retake needs changed wording and a new take letter: `vo.py b hook-2 outro-1`. Read the
whisper text of every keyword the viewer must repeat (the comment-gate word): a short word glued to the next one can
slur ("แกะแอป" came out "แก่แอป"; "แกะดูแอป" fixed it).
Owner's voice: `export BBN_VOICE_KIT=~/agent-tools/bbn-voice-clone-kit` before vo.py; every line is read by the kit
(OmniVoice) instead of the designed narrator.
Other languages: rewrite `SAY`/`spoken()` (Thai number words) and the `DESC` texts; `VO_LANG=en` for vocheck.

## 4. Assemble + cues
`song/vo/assemble.py` uses each line's latest take at natural pace (`VO_TEMPO` default **1.0**; atempo, pitch kept).
Change it only when the user asks for a speed (`VO_TEMPO=1.1`). `LEAD, SEC_GAP, LINE_GAP, TAIL = 0.1, 0.45, 0.25, 1.5`;
inner pauses over 0.45 s shrink to 0.28 s. Tighter values (0.28→0.16 pauses, 1.30 tempo) sounded clipped and
rushed to the owner.
```bash
$PY song/vo/assemble.py && cd video && node tools/cues.mjs --align ../song/vo.timing.json --endcard 0
```
Write `ref/lines.txt` (per scene: start/end, frame count = ceil(duration × 30) + 1, line local starts) for the
workers. Captions wrap past ~24 Thai chars per phrase: add a space in lyrics.txt at a phrase break and re-run cues
(audio unchanged).

## 5. Bridge, logos and props
```bash
"${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background --factory-startup \
  --python blender/bridge.py > blender/bridge.log 2>&1 &          # wait for "bridge ready" in the log
python3 blender/run.py blender/logos.py -- $PWD preview           # ref/logos/*.svg → video/public/logos/*.glb
```
Logos are not shipped: download each official SVG into `ref/logos/` first (names in `LOGOS`, logos.py). Look at
`video/out/logos_preview.jpg` before anything else. The brands are listed twice: `LOGOS` in logos.py and
`BRAND` in props.ts (the page loads every GLB in it) — edit both together; a story without logos drops
`await loadLogos()` from main.ts. run.py loads seq_lib.py first (eevee, portrait_camera,
key, smooth_keys, render_range, cam_track, pbr, emission, world_fog; colours are 3-tuples), passes CLI args as
`ARGS`, and saves JSON printed between `@@JSON`/`@@END` to `--json-out`. Tracebacks show real file:line. Calls run
one at a time; keep each ≤ ~150 frames. `BLENDER_BRIDGE_PORT` changes the port (default 9878).
Shared three.js props live in `video/src/props.ts` (`logo()`, `BRAND`, `mascot()` from `blender/mascot.py`); add
the story's hero props there before launching workers.
Thai text only in three.js/DOM; Blender can't shape Thai.

## 6. Scenes (parallel Claude Code subagents)
Fill in `brief.md` (story, look, shared set grammar) and one spec per worker in `workers/aN.md` (1–2 scenes each:
set, hero beats at local times, camera moves, what to avoid). Launch every worker in ONE message with the Agent
tool (`run_in_background: true`), prompt: "Read <dir>/brief.md and <dir>/workers/aN.md and follow them. Build
blender/<scene>_seq.py, render its plate, write video/src/scenes/<scene>.ts, check 3 stills, report still paths and
SFX hit times."
Each scene = EEVEE frames `video/public/<scene>/seq/f_####.jpg` + `cam.json` from `cam_track()`, three.js overlays
through `Sequence` / `applyCam` / `bl()` (seq.ts). Engine contract in `video/src/types.ts`: update() is a pure
function of the frame (rng(), not Math.random). Scenes without a file render as a "TODO" placeholder.
Review: tile their stills (`ffmpeg -i a.png -i b.png -i c.png -filter_complex hstack=3 sheet.png`), look, and send
concrete notes with SendMessage to that agent. Small fixes after a worker finishes: edit `blender/<scene>_seq.py`,
re-render only the affected frames, check with `render.mjs --still`.
Keep the bridge alive while workers render (it blocks everyone if it dies):
`while true; do pgrep -f blender/bridge.py >/dev/null || { "${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
--background --factory-startup --python blender/bridge.py >> blender/bridge.log 2>&1 & sleep 40; }; sleep 15; done &`
Review checklist (each caught a real problem): clipped white blobs (emissive panels, hot lights near the floor; the
stage bloom threshold is 0.72 and applies to the Blender plate too — keep white logos, brushed metal and mirror-like
clearcoats under ~0.65 luminance, measure plate frames with numpy, and cap additive opacity spikes),
unreadable text inside glowing rings, beams crossing labels, mirror-like cores reflecting area lights as "eyes",
one brand's mark alone on a neutral end card, badges clipped by the frame edge, frame 0 of a scene not composed.

## 7. Music + mix + render
Music bed: ask the user once and let them pick (never pick for them). Write `music/caption.txt` first (both use it):
1. **Open-source** — ACE-Step 1.5 locally (MIT, free, ~40 GB, install from the plugin README).
2. **phaya API** — paid credits (3 = 2 takes), fast; sign up, top up and copy the API key at **https://phaya.io**,
   then run `"$SKILL"/../music-video/scripts/phaya_music.sh login` once (popup asks for the key, saves it; no env).
   `music/lyrics.txt` = `[Instrumental]` sends an instrumental request (prompt = caption, style = its first ≤100 chars).
3. A licensed track the user supplies, saved as `music/bed.wav` (skip the generate line).
```bash
"${ACESTEP_HOME:-$HOME/ACE-Step-1.5}"/.venv/bin/python "$SKILL"/scripts/music.py music --bpm 118 --key "D minor" --duration 48 --lang en --seeds 1,2   # 1
PHAYA_SONG_DIR=music "$SKILL"/../music-video/scripts/phaya_music.sh generate . "<slug> bed"                                                    # 2
ffmpeg -i music/take0.wav -af loudnorm=I=-18:TP=-2 music/bed.wav
python3 sfx/mix.py                                                  # VO + ducked bed + SFX → video/public/song.mp3
cd video && node tools/render.mjs --jobs 4 --out out/<slug>.mp4
```
Write `music/caption.txt` per story (mood, instruments, "no vocals"). Rewrite the SFX events in mix.py per story:
`at(id, k)` = k-fraction through a line, `hits(scene, (sfx, t, gain), …)` for the workers' scene-local hit times.
Check: frame 0 composed, a contact sheet of the MP4 (`ffmpeg -i x.mp4 -vf fps=1/3,scale=270:-1,tile=6x3 sheet.png`),
loudness ≈ -15 LUFS, no pageerror in the render log.

## 8. Deliver
Film grain makes the master huge; ship a capped copy:
`ffmpeg -i video/out/<slug>.mp4 -c:v libx264 -crf 18 -maxrate 16M -bufsize 32M -preset slow -c:a copy -movflags +faststart
~/Downloads/<slug>_<date>.mp4` + `~/Downloads/<slug>_<date>.txt` (title, description, comment-gate ask, hashtags, sources, credits:
VoxCPM2 Voice Design TTS, Blender + three.js, the music source (ACE-Step / phaya / the track's licence), trademarks note). Stop the bridge:
`pkill -f blender/bridge.py`.

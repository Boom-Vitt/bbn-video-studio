---
name: music-video
description: >-
  Make an original AI music video end to end: write a song (Thai by default, any language works), generate it with
  local ACE-Step 1.5 (free) or phaya/Suno, build a three.js + TypeScript kinetic-typography MV synced to the vocal, render a 1080p MP4 and save it to
  ~/Downloads. It can study a reference music video (YouTube link) and create a "sister" piece that copies its craft
  and structure but never its lyrics, melody, imagery or palette. Use this whenever the user wants to make a song, MV,
  music video, lyric video, satirical/office song, "ทำเพลง", "แต่งเพลง", "ทำ MV", "มิวสิกวิดีโอ", "เพลงล้อเลียน",
  pastes a music-video link and says recreate / mimic / "ทำแบบนี้แต่ไม่เหมือน" / "extract and recreate", or asks for
  another song like รับทราบครับ (Noted) or LGTM. Also use it to re-time, edit scenes of, or re-render an existing
  music-video project (folders song/ + video/ with tools/render.mjs).
---

# music-video

Pipeline proven on "รับทราบครับ (Noted)" (Thai nu-disco, 3:45, 21 scenes); see `examples/noted/cover.jpg` and
`overview.jpg` for the quality bar.

```
reference URL ─► analyze ─► concept + lyrics ─► phaya song (2 takes) ─► align + verify timing
                                   └─► scaffold engine ─► first scene (you) ─► other scenes (workers) ─► render ─► ~/Downloads
```

Lyrics/scenes are keyed to line ids, not seconds, so the video can be built on a 120 BPM placeholder grid while the
song is generating (or blocked) and re-timed afterwards with no scene edits.

## 0. Preflight (one command each, don't over-check)
`yt-dlp`, `ffmpeg`, `node`, Google Chrome, Apple-silicon Python (mlx-whisper). Music: local ACE-Step
(free; install in the plugin README) or phaya: `mcp__claude_ai_phaya__get_balance` needs ≥ 3 credits; if the MCP 401s,
use the REST route in `references/phaya.md`. `$SKILL` = this skill's folder (the base directory shown when it loads).

## 1. Study the reference (when the user gives one)
```bash
scripts/analyze_reference.sh <url> <scratch>/ref [lang]
```
Read `metadata.txt`, `transcript.txt` and every `sheets/sheet_*.jpg`. Write down the section skeleton (function of
each part, its device, timings) and the visual craft (type treatment, UI mockups, 3D props, palette, cutting rhythm).
Tell the user in a few words what you found.

## 2. Concept and lyrics → `references/songwriting.md`
New story, new local hook, same skeleton. Write `song/lyrics.txt` (≤ 2000 chars, section tags) and `song/style.txt`
(≤ 100 chars). Get one sign-off (concept line + chorus preview), then go.

## 3. Song: local ACE-Step or phaya (`references/phaya.md`)
Generate 2 takes as early as possible; keep building while it renders. Takes land in `song/take{0,1}.wav`.
Local (free, one heavy job at a time): `"${ACESTEP_HOME:-$HOME/ACE-Step-1.5}"/.venv/bin/python
"$SKILL"/../explainer-video/scripts/music.py song --bpm <bpm> --key "<key>" --duration <s> --lang th --seeds 1,2`
(reads song/lyrics.txt + song/style.txt). phaya: 3 credits for 2 takes, key only in `PHAYA_API_KEY`.

## 4. Project → `references/engine.md`
```bash
"$SKILL"/scripts/new_project.sh <project-dir>      # copies template/, npm install, shared whisper venv
cd <project-dir>/video && node tools/cues.mjs   # grid timing until the song is aligned
```
Re-theme for this song: `C.accent` + ink/paper tones in `kit.ts` (scenes reference `C.accent`, never a named hue),
mascot pixel map in `mascot.ts` (`#` body, `o` eyes, `*` glowing sparkle pixels), loanwords in `type.ts` KEEP.
Write `song/scenes.json` (→ `references/scenes.md`).

## 5. Scenes → `references/scenes.md`
Write the first scene yourself (title card with the mascot at frame 0, then a fast dive into the song). Fan the rest
out to Claude Code subagents (Agent tool, all launched in one message, `run_in_background: true`) with the brief and spec templates; ask for a draft of every scene first, 2 stills per scene/variant, report in ~15 min; review their stills as tiled
images and send concrete feedback. `examples/noted/scenes/*.ts` show what a finished set looks like — read one or two
for the bar, don't copy their imagery into a new song.

## 6. Timing → `references/timing.md`
Align both takes, pick the better one, verify every line start with clip transcriptions, lock
`song/<take>.timing.json`, `node tools/cues.mjs --align …`. Whisper alone is not good enough on sung Thai.

## 7. Render, check, deliver
```bash
ffmpeg -v error -y -i ../song/<take>.wav -b:a 320k public/song.mp3
node tools/render.mjs --jobs 4 --out out/<slug>-mv_$(date +%F).mp4
scripts/contact_sheet.sh out/<slug>-mv_*.mp4 <scratch>/review      # read every sheet
```
Check: frame 0 fully composed; ~12 frames at known sung moments show the matching line; no pageerror; audio present
(`ffmpeg -i … -af volumedetect -f null -`). Copy to `~/Downloads/` and open it. Give the user the title + a short
description in their language (format in songwriting.md §6). Don't commit unless asked.

## Ground rules
- Mimic craft and structure, never the reference's lyrics, melody, specific imagery or palette.
- Rendering is deterministic: scenes are pure functions of time (see the brief in scenes.md). Anything else flickers
  or differs between parallel render jobs.
- API keys only in env vars; if the user pastes one in chat, use it and remind them to rotate it.
- When something blocks (credits, 401), say it in one line and keep building what doesn't depend on it.

# "<TITLE>" — ≤45 s vertical 3D short (scene-worker brief)

Project: <PROJECT DIR>. The narration is DONE (song/vo.wav; exact line times in video/public/cues.json and
ref/lines.txt). You build scenes only. Code and identifiers in English.

## The film (hook in the first second, follow CTA at the end)
<one line per scene: scene id — what the narration says — what we see>
hook: ...
...
outro: ... + "ตอนหน้า: ... กดติดตามไว้เลย"
`*word*` in a line = yellow caption keyword.

## Look
<the visual idea in 3–6 bullets: hero objects, worlds per scene, colour story, pacing.>
- Photoreal: backgrounds are animated Blender EEVEE renders (volumetric haze + light shafts, coloured rim lights,
  reflections, DOF, motion blur, AgX), with three.js objects locked into the same camera.
- Fast pacing for a short: a camera move or a new element every ~1.5 s, hard cuts between scenes, the hero shown big
  within the first frames of its scene. Labels pop in on the words of the narration.
- Captions are drawn for you (one phrase at a time, lower third, bottom edge y≈1490): keep y 1330–1500 calm/dark.
  TikTok-safe: nothing important above y 150 or below y 1600. Big titles in the top third (y 260–650).
- Real effects only (Blender emission + motion blur, or three.js shader particles/beams inside the matched camera),
  no flat 2D shapes. Thai text only in three.js/DOM (Blender can't shape Thai).
- Real brand marks only from video/public/logos/*.glb (built from the official SVG); never redraw or recolour them.

## Tools (tested)
- Blender ONLY through the shared headless bridge (already running; never launch Blender yourself):
  `python3 blender/run.py blender/<scene>_seq.py [--json-out video/public/<scene>/cam.json] -- <args>`.
  blender/seq_lib.py is loaded first (eevee, portrait_camera, key, smooth_keys, render_range, cam_track, pbr,
  emission, world_fog); args arrive as the list ARGS. EEVEE ≈ 0.3–0.6 s per 1080×1920 frame; ≤ 150 frames per call
  (other workers queue behind you). Frames → video/public/<scene>/seq/f_0000.jpg…, count = ceil(scene duration × 30)
  + 1 (cues.json `scenes`). Test single frames first and look at them.
- three.js: video/src/seq.ts `Sequence` + `applyCam` + `bl()`; `stage.backdrop = seq.texture`, `prepare: f =>
  seq.prepare(f.local)`, update: `seq.set(f.local); applyCam(track, f.local, stage.camera)`. Stage has bloom + film
  grain/vignette. Engine contract: video/src/types.ts (pure functions of the Frame, rng() not Math.random, beats from
  f.lines[i].start). Shared props: video/src/props.ts.
- Stills: `cd video && node tools/render.mjs --still <t> --out out/stills/<scene>_<k>.png` (3 per scene), then look
  at them. Never a full render. Don't edit shared files (main/kit/props/stage/type/types/seq, tools/, song/,
  blender/bridge.py, blender/run.py, blender/seq_lib.py, blender/logos.py) — ask the coordinator.
- Done = report still paths + SFX hit times (scene-local seconds, e.g. "whoosh 1.2, pop 3.4").

## Shared set grammar (every scene must cut together as one film)
<same studio/world rules for all workers: floor, key light, rim colours, fog density, lens range, look.>
- Scene timing and frame counts: ref/lines.txt (local seconds per line; frame = local × 30). Scene starts are hard
  cuts, so frame 0 of every scene is already a composed, lit shot.
- Avoid what failed review before: clipped white blobs (emissive panels, hot lights near the floor), unreadable
  text inside glowing rings, beams crossing labels, mirror-like cores reflecting area lights as "eyes", badges
  clipped by the frame edge.
- Audio is not yours (music bed + SFX are mixed by the coordinator). public/song.mp3 = narration.

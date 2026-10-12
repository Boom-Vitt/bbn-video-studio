# "ข้อความคุณไปไหนมา? คุยกับ AI แล้วข้อมูลเดินทางยังไง" — 45 s vertical 3D short (worker brief)

Project: <project dir>. Thai narration is DONE (designed open-source voice,
song/vo.wav; line times in video/public/cues.json and ref/lines.txt; word-chunk times in ref/words.txt). You build
scenes only. Notes in Thai or English; code and identifiers in English.

## The film (≤ 45 s, hook in the first second, follow CTA at the end) — this episode must be FUN
We follow ONE message on its trip: the user asks an AI "ขอแคปชันขายหมูปิ้งหน่อย". The message is a character —
**น้องข้อความ**, a puffy glossy blue 3D chat bubble with big black eyes, a smile and pink blush. It goes on an
adventure: locked into code → turned into light racing through an undersea fibre cable → chopped into tokens in a
giant data centre → numbers → GPUs guess the reply word by word → the answer types back on the phone → privacy tip
→ next-episode teaser. The previous episode (ai-pick) was a clean neutral product film; the client wanted this one
**more fun**: Pixar-like character acting on top of photoreal sets — squash & stretch, anticipation, eye blinks,
surprised wide eyes, a wink, sweat drop, little bounces on landings, comic timing that lands on the narration
words. Visual jokes are welcome (alien glyphs, a snooping magnifier, a chef chopping a sentence, a smug wrong AI).
Facts stay accurate (TLS lock in transit, fibre light pulses, sub-word tokens → numbers, next-token prediction,
streamed reply, chats may be stored). `*word*` in a line = yellow caption keyword.

## Look: photoreal 3D worlds + a cartoon hero (think Pixar short shot in a real place)
- Hero: `video/public/mascot/mascot.glb` (blender/mascot.py). Three.js: `mascot()` from props.ts (2.5 wide × 1.84 tall,
  facing +z, origin = body centre; nodes `eye_l` `eye_r` (blink = scale.y → 0.1), `smile`, `blush_l` `blush_r`,
  `body`, `tail`). Blender: `bpy.ops.import_scene.gltf(filepath=P + '/video/public/mascot/mascot.glb')` (faces -Y),
  or animate it in three.js on top of your Blender plate (usually better: acting stays editable). Never recolour
  or redesign it; scale/rotate/squash is fine. It appears in every scene, readable (≥ 25 % frame width) in at
  least one beat per line.
- Each scene is a different photoreal place, Blender EEVEE frame sequences with three.js locked to the same camera.
  Shared grammar so the 6 scenes cut as one film: night-time, deep blue/teal base with a warm coral/orange accent
  light (the blue hero pops against it), volumetric haze + light shafts, glossy reflections, DOF (fstop 2–4 on the
  hero), motion blur, AgX Medium High Contrast, lens 28–50 mm, camera always moving (push, orbit, chase), a new
  beat every ~1.5 s, hard cuts with motion matching (exit in the direction the next scene enters).
- Thai text is three.js only (type.ts Typo / canvasPlane / DOM): Blender cannot shape Thai. Text on 3D surfaces =
  canvasPlane inside the matched camera. Big titles in the top third (y 260–650), bold Kanit 800 with glow + depth
  shadow; small labels IBM Plex Sans Thai.
- Captions are drawn for you (one phrase at a time, lower third, bottom edge y≈1490): keep y 1330–1500 calm/dark.
  TikTok-safe: nothing important above y 150 or below y 1600.
- Real effects only (Blender emission + motion blur, three.js shader particles/beams/glyphs inside the camera) — no
  flat 2D stickers. Brand logos are NOT used in this episode (generic "AI").

## Tools (tested)
- Blender ONLY through the shared headless bridge (already running; never launch Blender):
  `python3 blender/run.py blender/<scene>_seq.py
  [--json-out video/public/<scene>/cam.json] -- $PWD <mode> <args>` (pass args unquoted); blender/seq_lib.py is
  prepended (eevee, portrait_camera, key, smooth_keys, render_range, cam_track, pbr, emission, world_fog). pbr/emission colours are 3-tuples. Args in ARGS. EEVEE ≈ 0.3–0.6 s per 1080×1920 frame; ≤ 150 frames
  per call; calls are queued with the other workers. Test 2 single frames first and look at them.
  Frames → video/public/<scene>/seq/f_0000.jpg…, count = frames in ref/lines.txt.
- three.js: video/src/seq.ts `Sequence` + `applyCam` + `bl()`; `stage.backdrop = seq.texture`, `prepare: f =>
  seq.prepare(f.local)`, update: `seq.set(f.local); applyCam(track, f.local, stage.camera)`. Stage has bloom + film
  grain/vignette. Engine contract: video/src/types.ts (pure functions of the Frame, rng() not Math.random, beats
  from f.lines[i].start). Examples of finished scenes (last episode, for the bar and API use, not the imagery):
  <skill dir>/examples/ai-pick/scenes/*.ts and examples/ai-pick/blender/*_seq.py.
- Stills: `cd video && node tools/render.mjs --still <t> --out out/stills/<scene>_<k>.png` (3+ per scene, one per
  beat). Never a full render. Don't edit shared files (main/kit/props/stage/type/types/seq, tools/, song/,
  blender/bridge.py, blender/run.py, blender/seq_lib.py, blender/mascot.py, public/mascot) — ask the coordinator.
- Audio is not yours (music bed + SFX are mixed by the coordinator; tell me the exact local times of your big
  hits — lock snap, chop, pop, whoosh — in your report).
Report when your scenes are done with still paths and SFX hit times.

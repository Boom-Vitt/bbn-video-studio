# Engine (template/video)

```
song/lyrics.txt  style.txt  scenes.json  <take>.timing.json  take*.wav
video/index.html               1920×1080 frame, scaled to the window; #overlay DOM sits above the WebGL canvas
video/src/main.ts              boot, scene manager (auto-registers src/scenes/*.ts by filename), clock, window.__seek
video/src/stage.ts             renderer (preserveDrawingBuffer, NoToneMapping), camera, bloom per theme (dark/paper/red)
video/src/type.ts              global kinetic typography (Intl.Segmenter('th') + KEEP loanwords; (…) → red pen)
video/src/kit.ts               palette C, fonts F, ease/seg/lerp/rng/pulse, el(), canvasTexture/canvasPlane, slate()
video/src/mascot.ts            pixel-map mascot → voxels (mascot, animateMascot) and SVG (mascotSVG)
video/src/types.ts             Frame / SceneDef / SceneCtx contract
video/tools/cues.mjs           lyrics + scene map (+ --align timing) → public/cues.json
video/tools/render.mjs         headless Chrome (puppeteer-core + system Chrome) seeks each frame → ffmpeg; --still t
video/tools/align.py           whisper alignment (see timing.md)
```

## Commands (in video/)
- `npm run dev` then open `/?scene=<id>[&v=1]` to loop one scene, `/?t=63` to start at a time; space = play/pause,
  ←/→ = ±5 s. Plays `public/song.mp3` if present.
- `node tools/cues.mjs [--align ../song/<take>.timing.json]`
- `npm run typecheck`
- `node tools/render.mjs --still 31.5 --out out/x.png`
- `node tools/render.mjs --jobs 4 --out out/<slug>-mv_YYYY-MM-DD.mp4` — ~4 min for a 4 min video on Apple silicon;
  muxes `public/song.mp3` (no -shortest: the end card may run past the audio).

## Make each song look like its own piece
- Palette: edit `C` in kit.ts (accent replaces the reference's signature colour; Noted used yellow vs LGTM's green).
- Mascot: redraw the pixel `MAP` in mascot.ts (`#` body, `o` eyes) and its colour. Noted's is a speech bubble with legs.
- Fonts: kit `F` + the @fontsource imports in main.ts (Kanit / IBM Plex Sans Thai / IBM Plex Mono / Sriracha cover
  Thai display, UI, mono, handwriting). Keep F values single-quoted — they are interpolated into style="…" attributes.
- Loanwords: add the song's transliterated words to `KEEP` in type.ts (ICU splits บอต → บอ|ต… and the line breaks
  mid-word otherwise).

## Gotchas already fixed in the template (don't reintroduce)
- Beat phase before the first beat is negative → `((beat % 1) + 1) % 1` (mascot + pulse).
- The first screenshot after page load can miss the DOM layer → render.mjs takes one throwaway shot per page.
- Bloom (threshold 0.72) washes out white/yellow canvas text; speech bubbles with text belong in DOM, positioned by
  projecting a 3D anchor (`vector.project(camera)`).
- Missing scene files render a labelled placeholder instead of crashing, so you can render before all scenes exist.

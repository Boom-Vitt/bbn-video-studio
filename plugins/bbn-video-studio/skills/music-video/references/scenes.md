# Scenes: map, brief, fan-out, review

## Scene map (`song/scenes.json`)
`[{"scene": "<id>", "from": "<first line id>"}, …]` in song order. A scene runs from its first line (−0.25 s) to the
next scene's first line, so instrumental gaps belong to the preceding scene. Guidelines:
- 1–4 lines per scene, a new scene whenever the lyric's *image* changes (≈ every 4–15 s). ~20 scenes for a 3.5 min song.
- The first scene starts at 0 and owns the title card (see "First frame" below).
- Reuse a scene id for repeated choruses; the reprise gets `ctx.variant = 1` and should differ at a glance.
- Theme per scene: `dark` (default), `paper` (evidence/document moments), `red` (incident/bridge). Alternate to pace
  the video like the reference does.

## First frame = thumbnail
Frame 0 must be fully composed (no fade from black): mascot big and lit, speech bubble with the hook, song title in
huge display type, a red-pen aside. Hold ~1.5 s, then a fast transition (the bot dives through the camera) that lands
in the first scene just before the first sung line. See `examples/noted/scenes/intro-chat.ts`.

## Who builds what
1. Write the first scene yourself — it sets the bar the workers imitate.
2. Fan the rest out, ~3–4 scenes per worker grouped by song section (verse 1 / chorus / verse 2 / bridge+breakdown /
   final+outro). With Orca available (`orca status --json` ready + reachable, running in an Orca terminal): one Run,
   `worker-start --spec "$(cat spec)" --worktree current`, Codex workers with the owner's model/effort, Claude workers
   for the visually trickiest sections; wait with `scripts/orca_inbox.py`. Without Orca: Agent-tool subagents with the
   same spec. Workers may only create their own `src/scenes/<id>.ts`.
3. Review each worker's stills as one tiled image (`ffmpeg … xstack`), send concrete visual feedback, release.
4. Render a full preview, read `scripts/contact_sheet.sh` sheets end to end, fix, re-render.

## Worker brief (write to a file the workers read; fill the {{…}})
```markdown
# "{{TITLE}}" — scene worker brief
Project: {{PROJECT}}/video (Vite + TypeScript + three.js). {{ONE-PARAGRAPH STORY}}. Lyrics: ../song/lyrics.txt.
Scene map: ../song/scenes.json.

## Look (mimic the craft of the reference, not its imagery)
- Reference contact sheets: {{REF}}/sheets/*.jpg. Copy the craft: huge kinetic type over sparse confident UI mockups,
  hairline technical annotations, mono caps slate strips (`slate()`), crisp 3D props, bloom glow on accents,
  beat-synced micro-motion, hard cuts on the beat. Do NOT reuse its specific imagery or palette: {{LIST}}.
- Palette `C` / fonts `F` in src/kit.ts. dark = ink bg, white type, {{ACCENT}} accent; paper = cream, ink, red;
  red = incident. Mascot from src/mascot.ts (voxel `mascot()` + `animateMascot`, DOM `mascotSVG()`) whenever the
  lyric mentions {{BOT WORD}}. No real brands/logos.

## Engine contract
- One file per scene: src/scenes/<id>.ts, `export default { theme, type, create(ctx) { …; return { update(f), dispose? } } } satisfies SceneDef`.
  Auto-registered by filename. Reference implementation: src/scenes/{{FIRST SCENE}}.ts. Types: src/types.ts.
- The global typography layer draws the sung line word by word; `type: {pos, size, width}` places it; keep that region
  clear. `type: false` only if you draw the lyric yourself.
- ctx.root / ctx.dom are scene-owned and auto-disposed. Camera reset on enter (z=10, fov 35 → visible plane ≈ 6.3×3.5).
- DETERMINISM: pure function of the Frame (t, local, p, beat, lines, li, lp). No Math.random (use rng), Date,
  performance.now, timers, rAF, CSS transitions/animations, async loads. Build in create(), mutate in update(); frames
  are rendered by seeking, possibly backwards.
- TIMING: never hardcode seconds; key events to `f.lines[i].start/end`, `f.lp`, `f.p`, beats. Guard missing lines.
- Bloom: bright white/yellow 3D surfaces smear into blobs; keep readable text in DOM or fills below ~#B9BEC9.
- Don't edit shared files (kit, mascot, stage, type, main, types, tools, song, cues) or other scene files; ask the
  coordinator if a shared change is truly needed. No commits, no new packages.

## Verify before worker_done
`npm run typecheck`; ≥3 stills per scene across its window (both variants if reused) via
`npm run still -- <t> --out out/<id>_<k>.png`; no `pageerror:`; LOOK at every PNG and polish; list PNGs in worker_done.
```

## Worker spec (one per worker)
```
TARGET: {{PROJECT}}/video — implement scenes: {{ids}}.
FIRST read {{BRIEF PATH}} and src/scenes/{{FIRST SCENE}}.ts.
OWNERSHIP: only src/scenes/{{ids}}.ts (+ PNGs under out/). Others are writing sibling files concurrently.
ACCEPTANCE: typecheck passes; ≥3 viewed+polished stills per scene; no pageerror; PNG paths in worker_done.
SCENES:
- <id> [<line ids>] "<lyric lines>" (<English gloss>). <theme>. <visual direction: props, what happens on each line,
  counters/labels, how the reprise differs>. Type <pos>.
```
Concrete visual direction per scene is what makes workers good: name the props, what animates on which line, the
on-screen labels (in the song's language), and the joke the image tells.

# Timing: lyrics ↔ vocal

Scenes and typography are keyed to **line ids** (`verse1-3`), never to absolute seconds, so re-timing is just data:
`song/<take>.timing.json` → `node tools/cues.mjs --align <file>` → `video/public/cues.json`.

## Before the song exists
`node tools/cues.mjs` builds a 120 BPM placeholder grid (bars per section in the BARS table). Build and review scenes
on it.

## Auto-align
```bash
$VENV/bin/python -I video/tools/align.py song/take0.wav /tmp/a0.json
$VENV/bin/python -I video/tools/align.py song/take1.wav /tmp/a1.json
```
Prints "% matched directly", tempo and first beat. Prefer the take with the higher direct-match % and a clean section
order. align.py: whisper large-v3-turbo on overlapping 24 s windows, temperature 0, digits → Thai number words,
char-level difflib match, gaps interpolated.

## Known whisper failure modes on sung Thai (why you still verify)
- Hook words come back in Latin ("Rab, sub" for รับทราบ) → lines made only of the hook never match.
- Numbers come back as digits ("92", "LY47") → handled by th_num, but check.
- On a full-length file whisper silently skips whole verses → those lines get evenly interpolated (a run of identical
  durations like 3.58, 3.58, 3.58 is the tell).
- Runs differ if temperature fallback is allowed; align.py pins temperature 0.

## Verify and lock (do this; it's what made the sync tight)
1. Transcribe each section as short clips: `$VENV/bin/python -I scripts/clip_check.py song/take1.wav 0 28 28 28 52 24 …`
   Clip transcriptions are reliable; read off each line's start.
2. Write `song/<take>.timing.json` by hand from those starts:
   `{"duration": <wav s>, "bpm": <from align>, "offset": <first beat>, "lines": [{"id","start","end"}…]}`.
   end = next start − 0.12 s (cap +6.5 s); where an instrumental gap follows, end where the phrase ends.
3. `node tools/cues.mjs --align ../song/<take>.timing.json`. Video length becomes max(audio, last line end + 7 s) so the
   end card always has room.
4. After rendering, sample frames at ~12 known sung moments (one per section) and confirm the on-screen line matches.

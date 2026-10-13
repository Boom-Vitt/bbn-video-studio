# phaya (song generation)

phaya brokers Suno for text-to-music: 3 credits per request, 2 takes, ~1–2 minutes. It is the paid alternative to
open-source ACE-Step; use it only when the user picked it.

## Access (tell the user when they have no account or key)
1. Sign up at **https://phaya.io**, top up credits (≥ 3 per song request).
2. Copy the API key from the phaya.io dashboard.
3. Either connect the phaya connector in Claude (Route 1), or give the key to this session as an env var (Route 2).
   Never write it to a file; if they paste it in chat, warn them to rotate it afterwards.

## Route 1 — MCP (try first)
`mcp__claude_ai_phaya__get_balance` → need ≥ 3 credits. Then `generate_music(prompt=<lyrics>, style=<style>,
title=<title>, model="V5", vocal_gender="f"|"m", negative_tags=…)` and `jobs_wait([job_id])`. Download both
audio URLs with `scripts/phaya_music.sh fetch <project> <url0> <url1>`.

## Route 2 — REST (when the MCP connector fails)
Seen in practice: the claude.ai connector kept answering HTTP 401 "API Key ไม่ถูกต้องหรือถูกระงับ" even after the
user topped up and reconnected, because the running session caches the old key. Ask the user for their phaya API key
(phaya.io dashboard). If they paste it in chat, warn them to rotate it afterwards. Keep it in an env var only, never in
a file:

```bash
export PHAYA_API_KEY='pk_…'
scripts/phaya_music.sh balance
scripts/phaya_music.sh generate <project> "<title>" f V5   # reads song/lyrics.txt + song/style.txt, polls, downloads takes
```

Endpoints (base `https://api.phaya.io/api/v1`, header `Authorization: Bearer <key>`):
`GET /user/credits`, `POST /text-to-music/generate` (prompt, style, title, model V3|V3_5|V4|V5, instrumental,
vocal_gender m|f, negative_tags, style_weight, weirdness_constraint, audio_weight), `GET /text-to-music/status/{job_id}`
→ `status` PENDING|QUEUED|PROCESSING|COMPLETED|FAILED and `audio_urls[]`.
Use curl: Cloudflare returns 403 to Python urllib's default user agent.

## After download
- The MP3s have wrong length headers (soundfile/librosa read 117 s of a 202 s file). `fetch` transcodes each take to
  WAV with ffmpeg; use the WAV for alignment and re-encode `video/public/song.mp3` from it:
  `ffmpeg -i song/take1.wav -b:a 320k video/public/song.mp3`.
- Pick the take by alignment quality (see timing.md), then by ear-proxy: duration, tempo, does the hook land.
- No credits and no key? Don't stall: build the video on the 120 BPM grid (scenes are keyed to lines, not seconds) and
  swap the song in later.

"""Align song/lyrics.txt to a real vocal track -> JSON for `node tools/cues.mjs --align <out>`.

    python tools/align.py public/song.mp3 out/align.json   (needs mlx-whisper + librosa)

Whisper's Thai word boundaries never match ours, so alignment is character-level: lyric chars and transcript chars
(each carrying a time interpolated inside its whisper word) are matched with difflib; every lyric line takes the times
of its first/last matched chars, and unmatched lines are interpolated between their neighbours.
"""
import difflib, json, re, sys
import librosa, mlx_whisper
import numpy as np

NOISE = re.compile(r'[\s()\[\]"\'.,!?…ๆ-]')
DIGITS = 'ศูนย์ หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า'.split()


def th_num(n):
    """0..9999 as Thai words: whisper writes sung numbers as digits, our lyrics spell them out."""
    if n == 0:
        return DIGITS[0]
    out = ''
    for val, name in ((1000, 'พัน'), (100, 'ร้อย')):
        if n >= val:
            out, n = out + DIGITS[n // val] + name, n % val
    t, u = divmod(n, 10)
    if t:
        out += ('' if t == 1 else 'ยี่' if t == 2 else DIGITS[t]) + 'สิบ'
    if u:
        out += 'เอ็ด' if u == 1 and out else DIGITS[u]
    return out


def lyric_lines(path):
    out, sec, n, seen = [], None, 0, {}
    for raw in open(path, encoding='utf-8'):
        s = raw.strip()
        if not s:
            continue
        m = re.fullmatch(r'\[(.+?)\]', s)
        if m:  # same slug rules as tools/cues.mjs
            slug = re.sub(r'[^a-z0-9]', '', m.group(1).split(' - ')[0].lower())
            seen[slug] = seen.get(slug, 0) + 1
            sec, n = (f'{slug}{seen[slug]}' if seen[slug] > 1 else slug), 0
            continue
        n += 1
        out.append({'id': f'{sec}-{n}', 'text': s})
    return out


def timed_chars(audio, win=24.0, hop=20.0):
    # whisper skips whole verses on a long sung file; overlapping windows keep it honest.
    # Each window owns the words whose start falls in its central hop span.
    y = librosa.load(audio, sr=16000, mono=True)[0]
    total = len(y) / 16000
    chars, t0 = [], 0.0
    while t0 < total:
        chunk = y[int(t0 * 16000):int((t0 + win) * 16000)]
        r = mlx_whisper.transcribe(chunk, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='th',
                                   word_timestamps=True, condition_on_previous_text=False, temperature=0.0)
        lo = 0 if t0 == 0 else (win - hop) / 2
        hi = win if t0 + hop >= total else lo + hop
        for seg in r['segments']:
            for w in seg.get('words', []):
                if not lo <= w['start'] < hi:
                    continue
                word = re.sub(r'\d{1,4}', lambda m: th_num(int(m.group())), w['word'])
                cs = NOISE.sub('', word)
                for i, c in enumerate(cs):
                    chars.append((c, t0 + w['start'] + (w['end'] - w['start']) * i / max(1, len(cs))))
        t0 += hop
    return chars


def align(lines, chars, duration):
    lyric, owner = [], []
    for li, l in enumerate(lines):
        for c in NOISE.sub('', l['text']):
            lyric.append(c)
            owner.append(li)
    sm = difflib.SequenceMatcher(None, lyric, [c for c, _ in chars], autojunk=False)
    hit = {}
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            hit.setdefault(owner[a + k], []).append(chars[b + k][1])
    times = [None] * len(lines)
    for li, ts in hit.items():
        if len(ts) >= max(2, 0.25 * sum(o == li for o in owner)):  # ignore lines matched by a stray char or two
            times[li] = (min(ts), max(ts))
    # fill gaps by interpolating between known neighbours, then force monotonic order
    known = [i for i, t in enumerate(times) if t]
    for i, t in enumerate(times):
        if t:
            continue
        prev = max((k for k in known if k < i), default=None)
        nxt = min((k for k in known if k > i), default=None)
        a = times[prev][1] if prev is not None else 0.0
        b = times[nxt][0] if nxt is not None else duration
        lo = prev if prev is not None else -1
        hi = nxt if nxt is not None else len(lines)
        step = (b - a) / (hi - lo)
        times[i] = (a + step * (i - lo - 1) + 0.1, a + step * (i - lo) - 0.1)
    out, last = [], 0.0
    for l, (s, e) in zip(lines, times):
        s = max(s, last)
        e = max(e, s + 0.8) + 0.25  # whisper ends words early; hold the line a beat
        out.append({'id': l['id'], 'start': round(s, 3), 'end': round(e, 3)})
        last = s + 0.05
    for a, b in zip(out, out[1:]):  # never overlap the next line
        a['end'] = min(a['end'], b['start'] - 0.05)
    return out, sum(1 for t in hit if times[t]) / len(lines)


if __name__ == '__main__':
    audio, dst = sys.argv[1], sys.argv[2]
    duration = librosa.get_duration(path=audio)  # soundfile misreports mp3 length
    lines = lyric_lines(__file__.rsplit('/video/', 1)[0] + '/song/lyrics.txt')
    res, coverage = align(lines, timed_chars(audio), duration)
    y, sr = librosa.load(audio, sr=22050, mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    # librosa's tempo is quantized to frame lags (hop 512: 151.999/143.55, 123.05/117.45), so comb-fit the onset
    # envelope on a fine grid around it; a wrong tempo breaks bar-aligned cuts and drifts f.beat by beats per minute.
    hop = 64
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    fr, coarse, best = sr / hop, float(np.atleast_1d(tempo)[0]), (-1.0, 0.0, 0.0)
    for cand in np.arange(coarse - 4, coarse + 4, 0.01):
        p = 60 / cand * fr
        idx = (np.arange(int(p))[:, None] + np.arange(int(len(oenv) / p) - 1)[None, :] * p).astype(int)
        s = oenv[idx].mean(1)
        if s.max() > best[0]: best = (s.max(), cand, s.argmax() / fr)
    bpm, offset = float(best[1]), float(best[2])
    print(f'tempo {bpm:.2f} BPM, first beat {offset:.3f}s')
    json.dump({'duration': duration, 'bpm': round(bpm, 3), 'offset': round(offset, 3), 'lines': res}, open(dst, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(res)} lines, {coverage:.0%} matched directly, {duration:.1f}s -> {dst}')

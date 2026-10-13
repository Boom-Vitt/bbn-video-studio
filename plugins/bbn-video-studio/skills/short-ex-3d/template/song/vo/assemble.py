# Narration VO: trim each song/vo/<id>_<take>.wav to its speech, lay the lines out with the guide's gaps
# -> song/vo.wav + song/vo.timing.json (exact line times, no whisper needed).
#   $PY song/vo/assemble.py [clip_dir]   (each line's latest take: _a, _b, ...)
import glob, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
CLIPS = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else HERE
ids, sec, n = [], None, 0
for raw in open(os.path.join(HERE, '..', 'lyrics.txt')):
    s = raw.strip()
    if m := re.fullmatch(r'\[(\w+)\]', s):
        sec, n = m.group(1).lower(), 0
    elif s:
        n += 1
        ids.append(f'{sec}-{n}')
GAP = {}  # tight: a 45 s short has no pauses
LEAD, SEC_GAP, LINE_GAP, TAIL = 0.1, 0.3, 0.15, 1.5
SR = 48000
TEMPO = 1.13  # pitch-kept speed-up (ffmpeg atempo): raise until the total fits ≤ 45 s
PAUSE_MAX, PAUSE_TO = 0.28, 0.16  # inner silences longer than this shrink to PAUSE_TO seconds


def tighten(y):
    hop = int(0.01 * SR)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(hop * 2) / (hop * 2), 'same'))[::hop]
    quiet = rms < 0.02 * rms.max()
    keep, i = np.ones(len(y), bool), 0
    while i < len(quiet):
        j = i
        while j < len(quiet) and quiet[j]:
            j += 1
        if (j - i) * hop > PAUSE_MAX * SR and i > 0 and j < len(quiet):
            cut = (j - i) * hop - int(PAUSE_TO * SR)
            a = i * hop + int(PAUSE_TO * SR / 2)
            keep[a:a + cut] = False
        i = j + 1
    return y[keep]


def speed(y):
    with tempfile.TemporaryDirectory() as d:
        sf.write(f'{d}/a.wav', y, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{d}/a.wav', '-af', f'atempo={TEMPO}', f'{d}/b.wav'], check=True)
        return sf.read(f'{d}/b.wav')[0]

clips = []
for i in ids:
    y, sr = sf.read(sorted(glob.glob(os.path.join(CLIPS, f'{i}_?.wav')))[-1], always_2d=True)
    y = y.mean(1)
    if sr != SR:
        y = np.interp(np.arange(0, len(y), sr / SR), np.arange(len(y)), y)
    loud = np.flatnonzero(np.abs(y) > 0.03 * np.abs(y).max())
    a, b = max(0, loud[0] - int(0.03 * SR)), min(len(y), loud[-1] + int(0.06 * SR))
    clips.append(speed(tighten(y[a:b])))

t, out, place = LEAD, [], []
for k, (i, c) in enumerate(zip(ids, clips)):
    d = len(c) / SR
    out.append({'id': i, 'start': round(t, 3), 'end': round(t + d, 3)})
    place.append((int(t * SR), c))
    nxt = ids[k + 1].split('-')[0] if k + 1 < len(ids) else None
    t += d + GAP.get(i, SEC_GAP if nxt != i.split('-')[0] else LINE_GAP)
dur = round(out[-1]['end'] + TAIL, 3)
mix = np.zeros(int(dur * SR) + 1)
for s, c in place:
    mix[s:s + len(c)] += c
mix *= 0.89 / np.abs(mix).max()
sf.write(os.path.join(HERE, '..', 'vo.wav'), np.stack([mix, mix], 1), SR)
json.dump({'duration': dur, 'bpm': 120, 'offset': 0, 'lines': out},
          open(os.path.join(HERE, '..', 'vo.timing.json'), 'w'), ensure_ascii=False, indent=1)
for l in out:
    print(l)
print('duration', dur)

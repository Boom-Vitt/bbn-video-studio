# VO + ducked music bed + UI sound design -> video/public/song.mp3. Every SFX is placed relative to the line/scene
# times in video/public/cues.json, so a new VO take or re-timed cues only needs a re-run.
#   python3 sfx/mix.py <vo.wav>          VO over the ducked music bed
#   python3 sfx/mix.py --song <song.wav> a finished song is the whole music+vocal track (no bed)
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
song = '--song' in sys.argv
args = [a for a in sys.argv[1:] if a != '--song']
vo = args[0] if args else ROOT + 'song/vo.wav'
cues = json.load(open(ROOT + 'video/public/cues.json'))
L = {l['id']: l for l in cues['lines']}
S = {s['scene']: s for s in cues['scenes']}
dur = cues['duration']
at = lambda i, k: L[i]['start'] + (L[i]['end'] - L[i]['start']) * k   # k-fraction through a line

ev = []  # (sfx, time, gain)
def hits(scene, *items):  # (sfx, scene-local s, gain) from the workers' reported hit times
    ev.extend((f, S[scene]['start'] + t, g) for f, t, g in items)
for sc in [s for s in S if s != 'hook']:
    ev.append(('whoosh', S[sc]['start'] - 0.2, 0.35))
# hook: each logo lights up as its name is spoken, then the 40 s timer starts
ev += [('blip', at('hook-1', k), 0.45) for k in (0.03, 0.17, 0.33)]
ev += [('swoosh_ring', L['hook-2']['start'], 0.4), ('zap', at('hook-2', 0.5), 0.35)]
# abilities and job chips pop in on their words
ev += [('pop', at('chatgpt-1', k), 0.4) for k in (0.45, 0.65, 0.85)]
ev += [('pop', at('chatgpt-2', k), 0.4) for k in (0.25, 0.45, 0.8)]
ev += [('click', at('claude-1', 0.35), 0.4), ('whoosh_down', at('claude-1', 0.7), 0.35)]
ev += [('pop', at('claude-2', k), 0.4) for k in (0.25, 0.5, 0.8)]
ev += [('pop', at('gemini-1', k), 0.4) for k in (0.42, 0.52, 0.6)] + [('zap', at('gemini-1', 0.8), 0.35)]
ev += [('pop', at('gemini-2', k), 0.4) for k in (0.3, 0.85)]
ev += [('chime', at('outro-1', 0.3), 0.45), ('blip', at('outro-2', 0.3), 0.35), ('click', at('outro-2', 0.88), 0.6),
       ('chime', at('outro-2', 0.92), 0.4)]
def ticks(a, b, seed, g=0.3):
    t, x = a, seed
    while t < b:
        ev.append(('tick', t, g))
        x = (x * 1103515245 + 12345) % 2 ** 31
        t += 0.065 + (x % 1000) / 1000 * 0.06
ticks(at('hook-2', 0.15), at('hook-2', 0.95), 3, 0.18)
ticks(at('outro-2', 0.05), at('outro-2', 0.3), 5, 0.2)   # prompt box typing

files = sorted({e[0] for e in ev})
inp = ['-i', vo] + ([] if song else ['-i', ROOT + 'music/bed.wav']) + sum([['-i', f'{ROOT}sfx/{f}.wav'] for f in files], [])
first = 1 if song else 2  # input index of the first sfx file
fx = []
graph = ([f'[0:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:{dur},afade=t=out:st={dur - 2.2}:d=2.2[main]']
         if song else
         [f'[0:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:{dur},asplit=2[vo][key]',
          # music: bed under the VO, ducked by it, faded at the end
          f'[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.55,apad,atrim=0:{dur},'
          f'afade=t=in:d=0.3,afade=t=out:st={dur - 1.2}:d=1.2[bed]',
          '[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]'])
counts = {f: sum(1 for e in ev if e[0] == f) for f in files}
for j, f in enumerate(files):
    graph.append(f'[{j + first}:a]aresample=48000,aformat=channel_layouts=stereo,asplit={counts[f]}' +
                 ''.join(f'[{f}{k}]' for k in range(counts[f])))
used = {f: 0 for f in files}
for n, (f, t, g) in enumerate(ev):
    k = used[f]; used[f] += 1
    ms = max(0, int(t * 1000))
    graph.append(f'[{f}{k}]volume={g},adelay={ms}|{ms}[e{n}]')
    fx.append(f'[e{n}]')
graph.append(''.join(fx) + f'amix=inputs={len(fx)}:normalize=0,volume={0.55 if song else 0.8}[sfx]')
graph.append(('[main][sfx]amix=inputs=2' if song else '[vo][duck][sfx]amix=inputs=3') +
             ':normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[out]')
out = ROOT + 'video/public/song.mp3'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inp, '-filter_complex', ';'.join(graph), '-map', '[out]', '-ar', '48000',
                '-b:a', '256k', out], check=True)
print(f'{len(ev)} sfx events -> {out}')

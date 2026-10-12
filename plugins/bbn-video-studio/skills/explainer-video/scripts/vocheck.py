# Whisper each VO clip and compare it with the spoken text (char ratio, spaces ignored). Apple Silicon (mlx-whisper).
#   $PY scripts/vocheck.py <project>      [ONLY='hook-1 hook-2'] [VO_LANG=th]
import sys, glob, os, difflib, importlib.util
P = sys.argv[1]
spec = importlib.util.spec_from_file_location('vo', P + '/song/myvoice/vo.py'); vo = importlib.util.module_from_spec(spec)
sys.argv = ['x']; spec.loader.exec_module(vo)
import re, mlx_whisper
ids, sec, n = {}, None, 0
for line in open(P + '/song/lyrics.txt'):
    line = line.strip()
    if m := re.fullmatch(r'\[(\w+)\]', line): sec, n = m.group(1).lower(), 0
    elif line: n += 1; ids[f'{sec}-{n}'] = vo.spoken(line.replace('*', ''))
only = set(os.environ.get('ONLY', '').split()) - {''}
for i, want in ids.items():
    if only and i not in only: continue
    f = sorted(glob.glob(f'{P}/song/vo/{i}_?.wav'))[-1]
    got = mlx_whisper.transcribe(f, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language=os.environ.get('VO_LANG', 'th'))['text']
    a, b = want.replace(' ', ''), got.replace(' ', '')
    r = difflib.SequenceMatcher(None, a, b).ratio()
    print(f'{r:.2f} {os.path.basename(f)} | {got.strip()}', flush=True)

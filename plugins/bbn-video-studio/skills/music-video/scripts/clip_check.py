"""Ground-truth line starts: transcribe short windows of a take and print absolute segment times.
Use it to verify/correct align.py output, section by section (whisper on short clips is far more reliable).
    $VENV/bin/python -I clip_check.py <take.wav> <start_s> <dur_s> [<start_s> <dur_s> ...] [--lang th]
"""
import sys
import librosa, mlx_whisper

args = sys.argv[1:]
lang = 'th'
if '--lang' in args:
    i = args.index('--lang'); lang = args[i + 1]; del args[i:i + 2]
y = librosa.load(args[0], sr=16000, mono=True)[0]
spans = list(zip(map(float, args[1::2]), map(float, args[2::2])))
for a, d in spans:
    r = mlx_whisper.transcribe(y[int(a * 16000):int((a + d) * 16000)], path_or_hf_repo='mlx-community/whisper-large-v3-turbo',
                               language=lang, word_timestamps=True, condition_on_previous_text=False, temperature=0.0)
    for s in r['segments']:
        print(f"{a + s['start']:7.2f}-{a + s['end']:7.2f} {s['text']}")
    print('---')

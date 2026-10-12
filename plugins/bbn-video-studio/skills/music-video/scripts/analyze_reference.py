"""Tempo, key guess, energy curve and a timestamped transcript of a reference song.
    analyze_reference.py <16k.wav> <44k.wav> <out.json> [lang]   -> out.json + transcript.txt next to it
"""
import json, os, sys
import librosa, mlx_whisper, numpy as np

wav16, wav, out = sys.argv[1:4]
lang = sys.argv[4] if len(sys.argv) > 4 else None
y, sr = librosa.load(wav, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
names = 'C C# D D# E F F# G G# A A# B'.split()
rms = librosa.feature.rms(y=y)[0]
t = librosa.times_like(rms, sr=sr)
energy = [(round(float(t[i]), 1), round(float(rms[i:i + 215].mean()), 3)) for i in range(0, len(rms), 215)]  # ~10 s windows
r = mlx_whisper.transcribe(wav16, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', word_timestamps=True,
                           language=lang, temperature=0.0)
segs = [{'start': round(s['start'], 2), 'end': round(s['end'], 2), 'text': s['text'].strip()} for s in r['segments']]
json.dump({'tempo': float(np.atleast_1d(tempo)[0]), 'first_beat': float(librosa.frames_to_time(beats[0], sr=sr)),
           'chroma_top': [names[i] for i in np.argsort(chroma)[::-1][:4]], 'energy': energy, 'segments': segs},
          open(out, 'w'), ensure_ascii=False, indent=1)
with open(os.path.join(os.path.dirname(os.path.abspath(out)), 'transcript.txt'), 'w') as f:
    f.write(f"tempo {float(np.atleast_1d(tempo)[0]):.1f} BPM, likely key notes {[names[i] for i in np.argsort(chroma)[::-1][:4]]}\n")
    f.writelines(f"{s['start']:7.1f} {s['text']}\n" for s in segs)
print('segments:', len(segs))

# Synthesised UI sound design (deterministic): whoosh, swoosh, click, pop, tick, boom, chime. 48 kHz mono wav.
import numpy as np, soundfile as sf
SR = 48000
rng = np.random.default_rng(7)
t = lambda d: np.arange(int(SR * d)) / SR
def norm(x, peak=0.8): return x / (np.abs(x).max() + 1e-9) * peak
def bandsweep(d, f0, f1, q=6.0, swell=0.6):
    n = rng.standard_normal(int(SR * d))
    # time-varying one-pole bandpass via short FFT frames
    out = np.zeros_like(n); win = 1024; hop = 256
    w = np.hanning(win)
    for i in range(0, len(n) - win, hop):
        k = i / max(1, len(n) - win)
        fc = f0 * (f1 / f0) ** k
        spec = np.fft.rfft(n[i:i + win] * w)
        f = np.fft.rfftfreq(win, 1 / SR)
        spec *= np.exp(-((np.log2(f + 1) - np.log2(fc)) ** 2) * q)
        out[i:i + win] += np.fft.irfft(spec) * w
    tt = t(d)[:len(out)]
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    env *= np.where(tt / d < swell, 1, 1)
    return out * env
def save(name, x, peak=0.8): sf.write(f'{name}.wav', norm(x, peak).astype(np.float32), SR)

save('whoosh', bandsweep(0.7, 300, 4000, 3.0), 0.7)
save('whoosh_down', bandsweep(0.6, 3500, 250, 3.0), 0.6)
save('swoosh_ring', bandsweep(0.9, 1200, 9000, 2.0) * 0.8, 0.55)
tt = t(0.012); save('click', np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 600) + rng.standard_normal(len(tt)) * np.exp(-tt * 900) * 0.4, 0.6)
tt = t(0.11); save('pop', np.sin(2 * np.pi * (700 - 3000 * tt) * tt) * np.exp(-tt * 38), 0.6)
tt = t(0.03); save('tick', rng.standard_normal(len(tt)) * np.exp(-tt * 260) * 0.7 + np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 400) * 0.3, 0.35)
tt = t(1.6); save('boom', np.sin(2 * np.pi * (58 - 12 * tt) * tt) * np.exp(-tt * 2.4) + bandsweep(1.6, 900, 120, 2.0) * 0.25, 0.9)
tt = t(1.2); save('chime', sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * (3 + i)) / (i + 1) for i, f in enumerate([1318.5, 1975.5, 2637.0])), 0.4)
tt = t(0.35); save('send', np.sin(2 * np.pi * (500 + 1600 * tt) * tt) * np.exp(-tt * 9) * np.sin(np.pi * np.clip(tt / 0.35, 0, 1)), 0.45)
# mom-photo extras
tt = t(1.4); save('morse', np.sin(2 * np.pi * 760 * tt) * np.isin((tt * 1000 // 1).astype(int) // 1, sum([list(range(a, b)) for a, b in
    [(0, 90), (150, 420), (480, 570), (630, 900), (1000, 1090), (1150, 1240)]], [])) * 1.0, 0.35)
tt = t(0.5); save('blip', np.sin(2 * np.pi * (1800 + 900 * np.sin(2 * np.pi * 9 * tt)) * tt) * np.exp(-tt * 7), 0.3)
tt = t(0.45); save('lock', np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30) + rng.standard_normal(len(tt)) * np.exp(-tt * 60) * 0.5
    + np.sin(2 * np.pi * 2900 * tt) * np.exp(-tt * 45) * 0.4, 0.7)
tt = t(1.8); save('tapestop', np.sin(2 * np.pi * np.cumsum(220 * (1 - tt / 1.8) ** 2) / SR) * (1 - tt / 1.8) + bandsweep(1.8, 2500, 90, 2.0) * 0.5, 0.6)
tt = t(0.9); save('zap', np.sin(2 * np.pi * np.cumsum(300 + 2600 * (tt / 0.9) ** 0.5) / SR) * np.exp(-tt * 3) * 0.6 + bandsweep(0.9, 600, 7000, 2.5) * 0.5, 0.5)
tt = t(3.0); save('rumble', bandsweep(3.0, 60, 140, 1.0) * (1 + 0.3 * np.sin(2 * np.pi * 0.7 * tt[:len(bandsweep(3.0, 60, 140, 1.0))])), 0.6)
print('ok')
# ai-trip extras: cartoon boing + cleaver chop
tt = t(0.5); save('boing', np.sin(2 * np.pi * np.cumsum(260 + 160 * np.exp(-tt * 5) * np.sin(2 * np.pi * 13 * tt)) / SR) * np.exp(-tt * 6), 0.5)
tt = t(0.35); save('chop', np.sin(2 * np.pi * 85 * tt) * np.exp(-tt * 22) + rng.standard_normal(len(tt)) * np.exp(-tt * 90) * 0.6
                   + np.sin(2 * np.pi * 2900 * tt) * np.exp(-tt * 16) * 0.25, 0.8)

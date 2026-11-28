"""Original music bed, composed in code (no samples, nothing downloaded).

  .venv/bin/python tools/music.py   -> out/_work/music.wav (48 kHz stereo) + out/_work/music.json (grid)

Soft marimba + warm pad + light bass, C major, vi-IV-I-V. The tempo is chosen so that bar 13's downbeat lands
exactly where the voice-over ends; that downbeat is the final, gentle C major chord, which rings through the
VO-free ending and fades at 30.000 s. If assets/music/bed.wav exists the mixer uses that instead.
"""
import json, pathlib
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps, N = cfg["format"]["fps"], cfg["format"]["frames"]
SR, T = 48000, N / fps
t_end_vo = cfg["scenes"][-1]["vo"]["end_frame"] / fps          # resolution point
BARS = 12
bar = t_end_vo / BARS
bpm = 240 / bar
beat = bar / 4
rng = np.random.default_rng(5)
L, R = np.zeros(int(T * SR)), np.zeros(int(T * SR))
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)


def put(x, at, gl, gr):
    s = int(round(at * SR)); e = min(len(L), s + len(x))
    if s >= len(L): return
    L[s:e] += x[:e - s] * gl; R[s:e] += x[:e - s] * gr


def marimba(m, vel=1.0, d=1.6):
    f = mid(m); tt = np.arange(int(d * SR)) / SR
    tau = 0.55 * (261.6 / f) ** 0.5
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
    x += 0.22 * np.sin(2 * np.pi * f * 3.93 * tt) * np.exp(-tt / (tau * 0.18))
    x += 0.05 * np.sin(2 * np.pi * f * 9.2 * tt) * np.exp(-tt / 0.02)
    k = int(0.004 * SR); x[:k] *= np.linspace(0, 1, k)
    mallet = lp(rng.standard_normal(int(0.01 * SR)), 2500) * np.exp(-np.arange(int(0.01 * SR)) / (0.002 * SR)) * 0.15
    x[:len(mallet)] += mallet
    return x * vel


def pad(ms, d, att=0.7, rel=1.0, vel=1.0):
    n = int((d + rel) * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / att) * np.where(tt > d, np.exp(-(tt - d) / (rel / 3)), 1)
    l, r = np.zeros(n), np.zeros(n)
    for m in ms:
        for det, side in [(-0.004, 0), (0.004, 1)]:
            f = mid(m) * (1 + det)
            w = sum(np.sin(2 * np.pi * f * h * tt + rng.random() * 6) / h ** 1.3 for h in range(1, 7))
            (l if side == 0 else r)[:] += w
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.35 * tt)
    return lp(l * env * trem, 1600) * vel, lp(r * env * trem, 1600) * vel


def bass(m, vel=1.0, d=0.9):
    f = mid(m); tt = np.arange(int(d * SR)) / SR
    x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.15 * np.sin(6 * np.pi * f * tt)) * np.exp(-tt / 0.3)
    k = int(0.006 * SR); x[:k] *= np.linspace(0, 1, k)
    return x * vel


def hat(vel=1.0):
    d = 0.05; n = int(d * SR)
    x = sosfilt(butter(2, 7000, 'high', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-np.arange(n) / (0.008 * SR))
    return x * vel


# C major: Am - F - C - G, three times; then the final C
prog = [("Am", [57, 60, 64], 45), ("F", [53, 57, 60], 41), ("C", [55, 60, 64], 48), ("G", [55, 59, 62], 43)]
scene_t = [s["timing"]["start_frame"] / fps for s in cfg["scenes"]]
climax0, climax1 = scene_t[5], scene_t[6]
for b in range(BARS):
    name, chord, root = prog[b % 4]
    t0 = b * bar
    pl, pr = pad(chord, bar, vel=0.05 if b < 2 else 0.065)
    put(pl, t0, 1, 0); put(pr, t0, 0, 1)
    if b < 2:   # intro: just two soft marimba notes a bar, curious
        for k, m in enumerate([chord[0] + 12, chord[2] + 12]):
            put(marimba(m, 0.22), t0 + k * 2 * beat, 0.8, 0.6)
        continue
    put(bass(root - 12 + 12, 0.35), t0, 0.7, 0.7); put(bass(root - 12 + 12, 0.25), t0 + 2 * beat, 0.7, 0.7)
    arp = [chord[0], chord[1], chord[2], chord[0] + 12, chord[2], chord[1] + 12, chord[2], None]
    for k, m in enumerate(arp):
        if m is None: continue
        acc = 0.34 if k % 4 == 0 else 0.22
        pan = 0.5 + 0.25 * np.sin(k)
        put(marimba(m + 12, acc), t0 + k * beat / 2, 1 - pan * 0.6, 0.4 + pan * 0.6)
    if b >= 4:
        for k in range(4):
            put(hat(0.05), t0 + k * beat + beat / 2, 0.45, 0.6)
    # a small lift in the climax: a higher melody answers the arpeggio
    if climax0 - bar / 2 <= t0 < climax1:
        mel = [chord[2] + 24, chord[1] + 24, chord[0] + 24]
        for k, m in enumerate(mel):
            put(marimba(m, 0.16, 1.2), t0 + (k * 1.25 + 0.5) * beat, 0.6, 0.8)

# resolution: bar 13 downbeat = end of the voice-over -> a gentle C major chord, rolled, ringing out
tf = BARS * bar
for k, m in enumerate([60, 64, 67, 72, 76]):
    put(marimba(m + 12, 0.30 - k * 0.02, 2.2), tf + k * 0.07, 0.75 - k * 0.07, 0.55 + k * 0.07)
put(bass(36 + 12, 0.35, 1.8), tf, 0.7, 0.7)
pl, pr = pad([48, 55, 60, 64], T - tf, att=0.25, rel=0.01, vel=0.07)
put(pl, tf, 1, 0); put(pr, tf, 0, 1)

# fade the last 0.35 s to silence at exactly 30.000 s
n = len(L); f = int(0.35 * SR)
fade = np.ones(n); fade[-f:] = np.linspace(1, 0, f) ** 2
mix = np.stack([L * fade, R * fade], 1)
mix /= np.abs(mix).max() / 0.8
out = ROOT / "out/_work/music.wav"; out.parent.mkdir(parents=True, exist_ok=True)
sf.write(out, mix.astype(np.float32), SR, subtype="PCM_16")
(ROOT / "out/_work/music.json").write_text(json.dumps({"bpm": round(bpm, 3), "bar_s": round(bar, 4), "bars": BARS,
    "final_chord_s": round(tf, 3), "vo_end_s": round(t_end_vo, 3), "key": "C major", "progression": "Am F C G x3 -> C"}, indent=1))
print(f"music: {bpm:.2f} BPM, bar {bar:.3f} s, final chord at {tf:.3f} s (VO ends {t_end_vo:.3f} s), {T:.3f} s")

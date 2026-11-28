"""Full-film mix: voice on top, music ducked under speech, subtle paper foley.

  .venv/bin/python tools/mix_film.py [events.json]   -> out/_work/mix.wav (48 kHz stereo), out/vo-full.wav

- Voice: the fitted lines (config vo.file) at their start frames, centre.
- Music: assets/music/bed.wav if it exists, else out/_work/music.wav (tools/music.py). About 8 dB under the
  voice between lines, and ducked a further ~11 dB while anyone speaks (80 ms look-ahead, 300 ms release).
- Foley: the page's sound events (out/_work/film/events.json), quiet, lightly panned.
- Master: integrated loudness set to -14 LUFS, then a 4x-oversampled look-ahead limiter at -1.5 dBTP.
"""
import json, pathlib, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, maximum_filter1d
from scipy.signal import resample_poly
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import sfx_paper as fx

ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps, N = cfg["format"]["fps"], cfg["format"]["frames"]
SR = fx.SR
n = int(round(N / fps * SR))
evp = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/_work/film/events.json"
DUCK_DB, MUSIC_DB, FOLEY_DB = 11.0, -8.0, -13.0


def db(x): return 10 ** (x / 20)


def measure(stereo):
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        sf.write(f.name, stereo.astype(np.float32), SR, subtype="FLOAT")
        log = subprocess.run(["ffmpeg", "-v", "info", "-i", f.name, "-af", "ebur128=peak=true", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[0-9.]+) LUFS", log)[-1]), float(re.findall(r"Peak:\s+(-?[0-9.]+) dBFS", log)[-1])


def limit(x, ceil_db=-1.5, look=0.005, rel=0.08):
    """True-peak-aware limiter: gain from the 4x-oversampled peak, applied with look-ahead and smooth release."""
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(1)
    pk = up.reshape(-1, 4).max(1)[:len(x)]
    need = np.minimum(1.0, db(ceil_db) / np.maximum(pk, 1e-9))
    la = int(look * SR)
    g = minimum_filter1d(need, size=2 * la + 1, origin=0)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):                     # instant attack (look-ahead already applied), smooth release
        cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * a
        out[i] = cur
    return x * out[:, None]


# ---------- voice ----------
voice = np.zeros(n)
for sc in cfg["scenes"]:
    y, sr = sf.read(ROOT / sc["vo"]["file"]); assert sr == SR
    if y.ndim > 1: y = y.mean(1)
    s = round(sc["vo"]["start_frame"] / fps * SR)
    e = min(n, s + len(y)); voice[s:e] += y[:e - s]
vrms = np.sqrt(np.mean(voice[np.abs(voice) > 1e-3] ** 2))
voice *= db(-20) / vrms                              # speech RMS at -20 dBFS before mastering

# ---------- music + ducking ----------
own = ROOT / "assets/music/bed.wav"
mp = own if own.exists() else ROOT / "out/_work/music.wav"
m, sr = sf.read(mp); assert sr == SR, f"{mp} must be 48 kHz"
if m.ndim == 1: m = np.stack([m, m], 1)
m = m[:n] if len(m) >= n else np.vstack([m, np.zeros((n - len(m), 2))])
mrms = np.sqrt(np.mean(m[np.abs(m).max(1) > 1e-3] ** 2))
m *= db(-20 + MUSIC_DB) / mrms
# voice activity -> duck envelope (look-ahead 80 ms, attack 60 ms, release 300 ms)
win = int(0.02 * SR)
act = (np.convolve(voice ** 2, np.ones(win) / win, "same") > db(-45) ** 2).astype(float)
act = maximum_filter1d(act, size=int(0.16 * SR), origin=0)
env = np.empty_like(act); cur = 0.0
aa, ar = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.3 * SR))
for i in range(len(act)):
    c = aa if act[i] > cur else ar
    cur = act[i] + (cur - act[i]) * c
    env[i] = cur
duck = db(-DUCK_DB * env)
m *= duck[:, None]

# ---------- foley ----------
fol = np.zeros((n, 2))
rng = np.random.default_rng(3)
def add(x, t, g, pan=0.0):
    s = int(round(t * SR)); e = min(n, s + len(x))
    if s >= n or s < 0: return
    fol[s:e, 0] += x[:e - s] * g * (1 - max(0, pan)); fol[s:e, 1] += x[:e - s] * g * (1 + min(0, pan))
gen = {"pop": lambda e: fx.pop(1, e.get("p", 1)), "slide": lambda e: fx.slide(1), "thud": lambda e: fx.thud(1, e.get("p", 1)),
       "ding": lambda e: fx.ding(1), "scratch": lambda e: fx.scratch(e.get("d", 1)), "click": lambda e: fx.click(1),
       "flip": lambda e: fx.flip(1), "snap": lambda e: fx.snap(1), "tick": lambda e: fx.tick(1),
       "rustle": lambda e: fx.rustle(e.get("d", 3))}
base = {"pop": 0.5, "slide": 0.35, "thud": 0.55, "ding": 0.22, "scratch": 0.2, "click": 0.6, "flip": 0.45, "snap": 0.45, "tick": 0.35, "rustle": 0.12}
events = json.loads(evp.read_text())
for e in events:
    add(gen[e["type"]](e), e["t"], base[e["type"]] * e.get("v", 1.0), float(rng.uniform(-0.25, 0.25)))
frms = np.sqrt(np.mean(fol[np.abs(fol).max(1) > 1e-3] ** 2))
fol *= db(-20 + FOLEY_DB) / frms

# ---------- master ----------
mix = np.stack([voice, voice], 1) * db(-3) + m + fol      # -3 dB per side keeps a centred mono voice at equal power
I, _ = measure(mix)
gain = db(-14.0 - I)
mix *= gain
mix = limit(mix, -1.5)
I2, TP2 = measure(mix)
if abs(I2 + 14) > 0.3:                              # the limiter may shave a little: correct once, limit again
    mix = limit(mix * db(-14.0 - I2), -1.5); I2, TP2 = measure(mix)
out = ROOT / "out/_work/mix.wav"
sf.write(out, mix.astype(np.float32), SR, subtype="FLOAT")
vo_full = voice * db(-3) * gain
sf.write(ROOT / "out/vo-full.wav", vo_full.astype(np.float32), SR, subtype="PCM_24")

# report: how far the voice sits above the music while speaking
sp = env > 0.9
v_db = 20 * np.log10(np.sqrt(np.mean((voice[sp] * db(-3)) ** 2)))
m_db = 20 * np.log10(np.sqrt(np.mean(m[sp] ** 2)))
mo = env < 0.05
m_free = 20 * np.log10(np.sqrt(np.mean(m[mo] ** 2)) + 1e-12)
print(f"music: {mp.relative_to(ROOT)}; foley events: {len(events)}")
duck_applied = -20 * np.log10(np.mean(duck[sp]))
print(f"voice {v_db:.1f} dB, music under speech {m_db:.1f} dB -> voice {v_db - m_db:.1f} dB on top; music ducked {duck_applied:.1f} dB under speech")
print(f"master: {I2:.2f} LUFS integrated, true peak {TP2:.2f} dBTP -> {out.relative_to(ROOT)}; out/vo-full.wav {len(vo_full) / SR:.3f} s")

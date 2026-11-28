"""Procedural paper foley for the paper-cut style (48 kHz mono float). Seeded, so every build sounds the same."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)


def t_(d): return np.arange(int(round(d * SR))) / SR
def noise(d): return rng.standard_normal(int(round(d * SR)))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def norm(x, p=1.0): m = np.abs(x).max(); return x * (p / m) if m > 0 else x


def pop(v=1.0, pitch=1.0):
    """A cut-out landing: dry paper 'pap' + a soft card thump."""
    d = 0.12; tt = t_(d)
    snap = hp(noise(d), 1400) * np.exp(-tt / 0.006)
    crinkle = bp(noise(d), 2500, 7000) * np.exp(-tt / 0.02) * 0.35
    body = np.sin(2 * np.pi * 150 * pitch * tt * (1 - 0.3 * tt / d)) * np.exp(-tt / 0.035) * 0.9
    return norm(snap + crinkle + body) * v


def slide(v=1.0, d=0.38):
    """A sheet sliding across card: band-limited hiss, swelling then easing out."""
    tt = t_(d)
    x = bp(noise(d), 1800, 6500) + 0.4 * bp(noise(d), 500, 1500)
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5 * (1 - 0.5 * tt / d)
    return norm(x * env) * v


def rustle(d, v=1.0):
    """Quiet paper handling bed: slow swells plus sparse crinkles."""
    tt = t_(d)
    n = int(round(d * SR))
    swell = np.interp(tt, np.linspace(0, d, max(4, int(d * 3))), rng.uniform(0.15, 1.0, max(4, int(d * 3))))
    bed = bp(noise(d), 1200, 8000) * swell
    cr = np.zeros(n)
    for s in rng.integers(0, n - 2400, int(d * 9)):
        k = int(rng.integers(300, 1400))
        cr[s:s + k] += hp(noise(k / SR), 2500) * np.exp(-np.arange(k) / (k / 5)) * rng.uniform(0.3, 1)
    fade = np.minimum(1, np.minimum(tt / 0.3, (d - tt) / 0.3))
    return norm(bed * 0.6 + cr) * v * fade


def thud(v=1.0, pitch=1.0):
    """A book landing on a stack: low card thump + page slap."""
    d = 0.25; tt = t_(d)
    low = np.sin(2 * np.pi * 85 * pitch * tt) * np.exp(-tt / 0.06)
    slap = bp(noise(d), 700, 4000) * np.exp(-tt / 0.012) * 0.7
    return norm(low + slap) * v


def ding(v=1.0):
    d = 1.0; tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, a, tau in [(1568, 1, .5), (3136, .3, .25), (2350, .25, .3)])
    return norm(x) * v


def scratch(d=1.0, v=1.0):
    """Pencil on paper: short gritty strokes."""
    tt = t_(d); n = len(tt)
    strokes = (np.sin(2 * np.pi * 7 * tt) > -0.2).astype(float)
    return norm(bp(noise(d), 2500, 9000) * lp(strokes, 40) * np.minimum(1, (d - tt) / 0.05)) * v


def add(buf, x, at, gain=1.0):
    s = int(round(at * SR))
    if s >= len(buf): return
    e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * gain

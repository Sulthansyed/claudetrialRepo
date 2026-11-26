# Misty Ridge — score, foley and voice → out/mix.wav (48 kHz stereo)
# usage: $LIB/.venv/bin/python mix.py   (LIB = the Lemo-Opuscar library; reads events.json, voices/, film.js)
import os, re, json, sys
import numpy as np, soundfile as sf, soxr
from scipy.signal import fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx as X
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add, limit
import pluck as P

E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; N = int(DUR * SR) + SR
rng = np.random.default_rng(5)
BEAT, BAR = .75, 3.0
bar = lambda b, beat=1: (b - 1) * BAR + (beat - 1) * BEAT

# ---------------------------------------------------------------- music
mus = np.zeros((N, 2))
def note(inst, pitch, at, dur=None, vel=.7, pan=0., g=1.):
    add(mus, P.pluck(inst, pitch, dur, vel=vel), at, g, pan)
def pad(pitches, at, d, g=.06, att=1.2, rel=1.4):
    tt = t_(d + rel); x = np.zeros(len(tt))
    for p in pitches:
        f = 440 * 2 ** ((P.midi(p) - 69) / 12)
        for det in (-.12, .1):
            ff = f * 2 ** (det / 12)
            x += np.sin(2 * np.pi * ff * tt) + .25 * np.sin(4 * np.pi * ff * tt) + .08 * np.sin(6 * np.pi * ff * tt)
    e = np.minimum(1, tt / att) * np.where(tt < d, 1, np.exp(-(tt - d) / (rel / 3)))
    y = lp(x * e, 1800)
    add(mus, norm(y) * g, at, 1, -.2); add(mus, norm(y) * g, at + .012, 1, .2)
def glock(pitch, at, vel=.6, pan=0.):
    f = 440 * 2 ** ((P.midi(pitch) - 69) / 12); d = 2.2; tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .7), (2.76, .35, .25), (5.4, .15, .1)])
    add(mus, norm(x) * .2 * vel, at, 1, pan)

CH = {'D': ['D3', 'A3', 'D4', 'F#4'], 'Bm': ['B2', 'F#3', 'B3', 'D4'], 'G': ['G2', 'D3', 'G3', 'B3'], 'A': ['A2', 'E3', 'A3', 'C#4'], 'Em': ['E3', 'G3', 'B3', 'E4']}
KAL = {'D': ['D5', 'F#5', 'A5', 'D6'], 'Bm': ['B4', 'D5', 'F#5', 'B5'], 'G': ['G4', 'B4', 'D5', 'G5'], 'A': ['A4', 'C#5', 'E5', 'A5'], 'Em': ['E5', 'G5', 'B5', 'E6']}
def kal_arp(c, b, dens=8, vel=.55, g=.9):
    seq = [0, 1, 2, 3, 2, 1, 2, 1] if dens == 8 else [0, 2, 1, 3]
    step = BAR / dens
    for i, k in enumerate(seq[:dens]):
        note('kalimba', KAL[c][k], bar(b) + i * step, vel=vel * (1.1 if i == 0 else .9) * (1 + rng.uniform(-.06, .06)), pan=(-.35 + .7 * k / 3), g=g)
def guitar(c, b, vel=.6, g=1.):
    lo, *up = CH[c]
    note('nylon_guitar', lo, bar(b, 1), vel=vel, pan=-.25, g=g); note('nylon_guitar', lo, bar(b, 3), vel=vel * .8, pan=-.25, g=g)
    pat = [up[0], up[1], up[2], up[1], up[0], up[1], up[2], up[1]]
    for i, p in enumerate(pat): note('nylon_guitar', p, bar(b) + i * BAR / 8 + .01, vel=vel * .55, pan=.25, g=g * .9)

# bar 1: no music (paper and the drop). bars 2–3: kalimba + pad
kal_arp('D', 2, 8, .5); pad(CH['D'], bar(2), 3.0)
kal_arp('Bm', 3, 8, .5); pad(CH['Bm'], bar(3), 3.0)
# bars 4–5: the breath — sparse kalimba, glockenspiel on the blossom burst (bar 4 beat 2)
kal_arp('G', 4, 4, .42); pad(CH['G'], bar(4), 3.0, g=.04)
for i, p in enumerate(['D6', 'F#6', 'A6', 'D7']): glock(p, bar(4, 2) + i * .09, .7 - i * .1, -.3 + i * .2)
kal_arp('A', 5, 4, .42); pad(CH['A'], bar(5), 3.0, g=.045)
glock('C#6', bar(5, 3) + .3, .35, .3)                 # the blush
# bars 6–7: guitar enters, kalimba answers with a small line
guitar('D', 6, .62); guitar('G', 7, .6)
for at, p in [(bar(6, 1), 'F#5'), (bar(6, 3), 'E5'), (bar(6, 4), 'D5'), (bar(7, 1), 'B4'), (bar(7, 2) + .375, 'D5'), (bar(7, 3), 'G5')]: note('kalimba', p, at, vel=.6, pan=.15)
# bar 8: brush lifted — silence to beat 3, then a soft pad
pad(CH['Em'], bar(8, 3), 1.5, g=.045, att=1.0)
# bars 9–10: softer guitar + kalimba, resolve on bar 10 beat 3
guitar('G', 9, .45, .8); kal_arp('G', 9, 4, .4, .8); pad(CH['G'], bar(9), 3.0, g=.035)
note('nylon_guitar', 'A2', bar(10, 1), vel=.45, pan=-.25);
for i, p in enumerate(['E3', 'A3', 'C#4']): note('nylon_guitar', p, bar(10, 1) + .02 + i * .03, vel=.35, pan=.2)
note('kalimba', 'E5', bar(10, 2), vel=.4, pan=.1)
for i, p in enumerate(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']): note('nylon_guitar', p, bar(10, 3) + i * .045, dur=None, vel=.5, pan=-.3 + i * .12)
note('kalimba', 'F#5', bar(10, 3) + .3, vel=.45); note('kalimba', 'D6', bar(10, 4) + .1, vel=.35, pan=.3)
pad(CH['D'], bar(10, 3), 1.6, g=.04)
# music only starts at bar 2: clear bar 1, and hard silence 21.0–22.5
mus[:int(bar(2) * SR) - 200] = 0
s0, s1 = int(21.0 * SR), int(22.5 * SR); fade = np.linspace(1, 0, int(.25 * SR))
mus[s0:s0 + len(fade)] *= fade[:, None]; mus[s0 + len(fade):s1] = 0

# ---------------------------------------------------------------- foley
fx = np.zeros((N, 2))
def brush(d=.9, g=.5, pan0=-.5, pan1=.5):
    tt = t_(d); x = bp(noise(d), 1800, 6500) * (.6 + .4 * np.sin(2 * np.pi * 9 * tt) ** 2) * np.sin(np.pi * tt / d) ** 1.5
    x = norm(x) * g; L = np.cos((np.linspace(pan0, pan1, len(x)) + 1) * np.pi / 4); R = np.sin((np.linspace(pan0, pan1, len(x)) + 1) * np.pi / 4)
    return np.stack([x * L, x * R], 1) * 1.414
def addst(buf, st, at, g=1.):
    s = int(at * SR); e = min(len(buf), s + len(st)); buf[s:e] += st[:e - s] * g
def pencil(d=1.0, g=.25):
    tt = t_(d); am = np.abs(lp(noise(d), 25)); am = am / am.max()
    return norm(hp(noise(d), 3000) * am * (rng.random(len(tt)) > .2)) * g * np.minimum(1, tt / .05) * np.minimum(1, (d - tt) / .1)
def plink(f=1250, g=.6):
    d = .5; tt = t_(d); ff = f * (1 - .25 * np.minimum(1, tt / .04))
    return norm(np.sin(2 * np.pi * np.cumsum(ff) / SR) * env_exp(d, .07) + hp(noise(d), 4000) * env_exp(d, .004) * .4) * g
def swell(d, lo, hi, g, curve=1.):
    tt = t_(d); return norm(bp(noise(d), lo, hi)) * np.sin(np.pi * tt / d) ** curve * g
def thud(g=.5):
    d = .25; tt = t_(d)
    return norm(np.sin(2 * np.pi * 140 * tt * (1 - .4 * tt)) * env_exp(d, .03) + bp(noise(d), 800, 3000) * env_exp(d, .01) * .5) * g
def chirp(f0, f1, d, g):
    tt = t_(d); f = np.linspace(f0, f1, len(tt)) * (1 + .03 * np.sin(2 * np.pi * 30 * tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * g
def pour(d=1.0, g=.3):
    tt = t_(d); x = np.zeros(len(tt))
    for k in range(int(d * 22)):
        s = int(rng.uniform(0, d - .06) * SR); f = rng.uniform(500, 1400); dd = .05; u = t_(dd)
        b = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * u / dd)) / SR) * env_exp(dd, .015); x[s:s + len(b)] += b[:len(x) - s] * rng.uniform(.3, 1)
    return norm(x + bp(noise(d), 300, 1500) * .4) * np.sin(np.pi * tt / d) ** .5 * g

for e in E['ev']:
    t, k = e['t'], e['type']
    if k == 'brush': addst(fx, brush(e.get('d', .9), .32 * e.get('g', .6), rng.uniform(-.7, 0), rng.uniform(0, .7)), t)
    elif k == 'pencil': add(fx, pencil(e.get('d', 1.0), .14), t, 1, .35)
    elif k == 'fall': add(fx, swell(1.1, 2500, 7000, .05, 3), t, 1, 0)
    elif k == 'drop': add(fx, plink(1250, .5), t, 1, 0); add(fx, plink(1900, .15), t + .11, 1, .1)
    elif k == 'bloom': add(fx, lp(swell(2.4, 150, 900, .22, 2), 900), t, 1, 0)
    elif k == 'mist': addst(fx, brush(1.4, .22, .6, -.6), t); add(fx, swell(1.6, 200, 1200, .12, 1.5), t, 1, 0)
    elif k == 'burst': addst(fx, brush(.8, .5, -.8, .8), t)
    elif k == 'petals':
        for i in range(12): add(fx, X.step(.08), t + rng.uniform(0, 1.0), 1, rng.uniform(-.6, .6))
    elif k == 'tilt': add(fx, X.whoosh(.9, .08), t, 1, 0)
    elif k == 'creak': add(fx, X.creak(.18), t, 1, -.2); add(fx, X.creak(.12), t + .35, 1, .2)
    elif k == 'cherry':
        for j in range(3): add(fx, thud(.45 - j * .08), t + j * .06, 1, rng.uniform(-.25, .25))
    elif k == 'page': addst(fx, brush(.8, .45, .8, -.8), t); add(fx, X.whoosh(.6, .12), t, 1, 0)
    elif k == 'scatter':
        for i in range(40): add(fx, thud(.06) if i % 3 else X.step(.05), t + rng.uniform(0, .7), 1, rng.uniform(-.7, .7))
    elif k == 'pour': add(fx, pour(1.0, .22), t, 1, 0)
    elif k in ('push', 'pull'): add(fx, X.whoosh(1.4, .07), t, 1, 0)

# ambience: room tone throughout, dawn birds + wind on the slope (J-cut in at 3.5), insects on the drying bed (L-cut into the silence)
amb = np.zeros((N, 2))
room = lp(X.brown(DUR + 1), 400) * .012; add(amb, room, 0, 1, 0)
wind = lp(bp(noise(7.0), 200, 1400), 900); add(amb, norm(wind) * .05 * np.sin(np.pi * t_(7.0) / 7.0), 3.0, 1, -.3)
for i in range(16):
    at = rng.uniform(3.5, 14.5); f = rng.uniform(2800, 4200)
    for j in range(rng.integers(2, 5)): add(amb, chirp(f, f * rng.uniform(1.1, 1.4), .07, .05), at + j * .11, 1, rng.uniform(-.8, .8))
ins_d = 5.0; tt = t_(ins_d); ins = bp(noise(ins_d), 4500, 7500) * (.5 + .5 * np.sin(2 * np.pi * 28 * tt)) * np.minimum(1, tt / .8) * np.minimum(1, (ins_d - tt) / 1.6)
add(amb, norm(ins) * .025, 18.9, 1, .4)

# ---------------------------------------------------------------- voice
VO = [(m[0], float(m[1])) for m in re.findall(r"\['(v\d\d)', ([\d.]+),", open(os.path.join(HERE, 'film.js')).read())]
vo = np.zeros(N)
for vid, at in VO:
    x, sr = sf.read(os.path.join(HERE, 'voices', vid + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR); x = hp(x, 90)
    s = int(at * SR); vo[s:s + len(x)] += x[:N - s]
vo = X.compress(vo, .2, 3.0)
rms = lambda a: np.sqrt(np.mean(a[np.abs(a) > 1e-4] ** 2) + 1e-12)
vr = rms(vo); vo = limit(vo, vr * 3.5); vo = vo / rms(vo) * .1

# duck music under the voice (smoothed envelope, ≈ −4 dB)
act = np.convolve((np.abs(vo) > .01).astype(float), np.ones(int(.3 * SR)) / int(.3 * SR), 'same')
duck = 1 - .38 * np.clip(act * 4, 0, 1)
mr = rms(mus.mean(1)); mus = mus / mr * (.1 / 10 ** (8 / 20))   # voice ≈ 8 dB over the music
mus *= duck[:, None]

# short soft reverb on music and foley
ir_t = t_(1.2); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .28); ir = lp(ir, 5000); ir /= np.abs(ir).sum() ** .5 * 20
def verb(st, wet): return st + wet * np.stack([fftconvolve(st[:, c], ir)[:len(st)] for c in (0, 1)], 1)
mix = verb(mus, .35) + verb(fx, .2) + amb + np.stack([vo, vo], 1) * .707
mix = mix[:int(DUR * SR)]
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix = mix / np.abs(mix).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('mix.wav', round(len(mix) / SR, 2), 's')

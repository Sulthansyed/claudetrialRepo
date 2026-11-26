# RM750 or RM0? — score, foley and voice → out/mix.wav (48 kHz stereo), mixed for phone speakers
# usage: LIB=<lemo-opuscar library> $LIB/.venv/bin/python mix.py   (reads events.json, voices/, film.js)
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
EV = E['ev']; rng = np.random.default_rng(9)
evt = lambda k: [e for e in EV if e['type'] == k]
BEAT = .625; BAR = 4 * BEAT

def hz(m): return 440 * 2 ** ((P.midi(m) - 69) / 12)
# ---------------------------------------------------------------- instruments
def marimba(pitch, vel=.7):
    f = hz(pitch); d = 1.2; tt = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .32), (3.93, .35 * vel, .07), (9.2, .12 * vel, .025)])
    x[:int(.004 * SR)] += hp(noise(.004), 2000) * .3
    return norm(x) * .3 * vel
def woodblock(f=900, vel=.7):
    d = .18; tt = t_(d); x = np.sin(2 * np.pi * f * tt) * env_exp(d, .03) + .5 * np.sin(2 * np.pi * f * 2.7 * tt) * env_exp(d, .012) + bp(noise(d), 1500, 4000) * env_exp(d, .004) * .4
    return norm(x) * .3 * vel
def shaker(vel=.5):
    d = .09; tt = t_(d); return norm(bp(noise(d), 5000, 11000) * np.sin(np.pi * tt / d) ** 3) * .06 * vel

mus = np.zeros((N, 2))
def note(x, at, g=1., pan=0.): add(mus, x, at, g, pan)
def bass(pitch, at, vel=.7):
    x = P.pluck('upright_bass_pizz', pitch, None, vel=vel)
    x = x + .35 * np.tanh(3 * x)          # harmonics so it speaks on small speakers
    note(hp(x, 70), at, .9, -.1)

# sections (bars of 2.5 s)
CH = {'C': ['C3', 'G3'], 'Am': ['A2', 'E3'], 'F': ['F2', 'C3'], 'G': ['G2', 'D3']}
ARP = {'C': ['C5', 'E5', 'G5', 'C6'], 'Am': ['A4', 'C5', 'E5', 'A5'], 'F': ['F4', 'A4', 'C5', 'F5'], 'G': ['G4', 'B4', 'D5', 'G5']}
def groove(t0, t1, chords, arp=True, shake=True, bassline=True, vel=.6):
    b = 0; t = t0
    while t < t1 - .01:
        c = chords[b % len(chords)]
        if bassline: bass(CH[c][0], t, .75); bass(CH[c][1], t + 2 * BEAT, .6)
        for i in range(8):
            u = t + i * BEAT / 2
            if u >= t1: break
            if shake: note(shaker(.9 if i % 2 else .5), u, 1, .3)
            if arp and i % 2 == 0: note(marimba(ARP[c][[0, 2, 1, 3][(i // 2) % 4]], vel), u, .8, -.25 + .5 * ((i // 2) % 4) / 3)
        b += 1; t += BAR
# hook: a little groove, the motif on RM750, the dull woodblock on RM0
groove(0, 5.0, ['C', 'Am'], arp=False, vel=.5)
for i, p in enumerate(['C5', 'E5', 'G5', 'C6']): note(marimba(p, .9), evt('popA')[0]['t'] + i * .07, 1.1, -.2 + i * .12)
pb = evt('popB')[0]['t']; note(woodblock(520, .9), pb); note(woodblock(470, .7), pb + .16)
# curiosity: bass + shaker, then a near-silence before the padlock
groove(5.0, 5.75, ['F'], arp=False)
# conflict: minor, woodblock on each coin into TAX
groove(8.0, 11.2, ['Am', 'F'], arp=False, vel=.45)
for e in evt('coinTax'): note(woodblock(780 - 40 * e['i'], .6), e['t'], 1, .2)
# climax: full groove; one rising marimba note per coin that comes back
groove(11.25, 18.0, ['F', 'G', 'C'], arp=True, vel=.5)
up = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7']
for e in evt('coinBack'): note(marimba(up[e['i']], .75), e['t'], .9, -.3 + .04 * e['i'])
# payoff: motif resolves on the end card
groove(18.0, 20.5, ['F', 'G'], arp=True, vel=.45)
en = evt('bubble')[0]['t']
for i, p in enumerate(['C5', 'E5', 'G5', 'C6', 'E6']): note(marimba(p, .8), en + i * .09, 1, -.2 + i * .1)
bass('C2', en, .8); bass('G2', en + .02, .5)
s0, s1 = int(5.75 * SR), int(6.05 * SR); mus[s0:s1] *= np.linspace(1, 0, s1 - s0)[:, None] ** 2
mus[s1:int(7.9 * SR)] *= .25

# ---------------------------------------------------------------- foley
fx = np.zeros((N, 2))
def coin(f0=3200, g=.4):
    d = .5; tt = t_(d); x = sum(a * np.sin(2 * np.pi * f0 * r * tt) * env_exp(d, tau) for r, a, tau in [(1, 1, .12), (1.48, .6, .09), (2.33, .4, .06)])
    return norm(x + hp(noise(d), 6000) * env_exp(d, .003)) * g
def rattle(g=.35):
    d = .45; out = np.zeros(int(d * SR))
    for k in range(9): c = X.clack(1.6 + rng.random() * .4, .5); s = int(k * .045 * SR); out[s:s + len(c)] += c[:len(out) - s]
    return norm(out) * g
def flip(g=.3):
    d = .25; tt = t_(d); return norm(bp(noise(d), 1200, 5000) * np.sin(np.pi * tt / d) ** .5 * (1 + np.sin(2 * np.pi * 30 * tt))) * g
def rewind(g=.3):
    d = .5; tt = t_(d); f = 2500 - 1800 * tt / d; x = np.sign(np.sin(2 * np.pi * np.cumsum(f / 8) / SR)) * .5
    return norm(bp(x + noise(d) * .2, 800, 5000) * np.sin(np.pi * tt / d)) * g
for e in EV:
    t, k = e['t'], e['type']
    if k == 'whoosh': add(fx, X.whoosh(.55, .14), t, 1, 0)
    elif k == 'pin': add(fx, X.click(1.4, .16), t, 1, .3)
    elif k == 'popA': add(fx, coin(3400, .32), t, 1, -.2)
    elif k == 'popB': add(fx, X.thump(.4, 110), t, 1, .2)
    elif k == 'rewind': add(fx, rewind(.25), t, 1, -.2)
    elif k == 'lock': add(fx, rattle(.4), t, 1, .1)
    elif k == 'coinTax': add(fx, coin(2600 + 120 * e['i'], .22), t - .02, 1, .25)
    elif k == 'buzz': add(fx, norm(bp(np.sign(np.sin(2 * np.pi * 140 * t_(.35))), 300, 3000)) * .12 * np.linspace(1, 0, int(.35 * SR)), t, 1, .2)
    elif k == 'brick': add(fx, X.thump(.5, 150), t, 1, .15); add(fx, X.clack(.9, .2), t, 1, .15)
    elif k == 'lid': add(fx, X.creak(.2), t + .3, 1, .2); add(fx, X.whoosh(.4, .1), t + .3, 1, .2)
    elif k == 'stamp': add(fx, X.thump(.8, 95), t, 1, 0); add(fx, hp(noise(.06), 1500) * env_exp(.06, .01) * .3, t, 1, 0)
    elif k == 'coinBack': add(fx, coin(3000 + 60 * e['i'], .18), t, 1, -.3 + .04 * e['i'])
    elif k == 'thud': add(fx, X.thump(.35, 120), t, 1, -.3)
    elif k == 'flip': add(fx, flip(.3), t, 1, -.3)
    elif k == 'title': add(fx, X.whoosh(.35, .1), t, 1, -.2)
    elif k == 'bubble': add(fx, X.pop(.3), t, 1, 0)
amb = np.zeros((N, 2)); add(amb, lp(X.brown(DUR + 1), 600) * .006, 0, 1, 0)   # faint office hum

# ---------------------------------------------------------------- voice
VO = [(m[0], float(m[1])) for m in re.findall(r"\['(v\d\d)', ([\d.]+),", open(os.path.join(HERE, 'film.js')).read())]
vo = np.zeros(N)
for vid, at in VO:
    x, sr = sf.read(os.path.join(HERE, 'voices', vid + '.wav'), dtype='float64')
    if x.ndim > 1: x = x.mean(1)
    x = hp(soxr.resample(x, sr, SR), 120)
    s = int(at * SR); vo[s:s + len(x)] += x[:N - s]
vo = X.compress(vo, .15, 4.0)
rms = lambda a: np.sqrt(np.mean(a[np.abs(a) > 1e-4] ** 2) + 1e-12)
vo = limit(vo, rms(vo) * 3.0); vo = vo / rms(vo) * .12
# phone presence: a gentle lift around 3 kHz
vo = vo + .25 * bp(vo, 2200, 4500)

act = np.convolve((np.abs(vo) > .01).astype(float), np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
duck = 1 - .6 * np.clip(act * 4, 0, 1)                                # ≈ −8 dB under the voice
mus = np.stack([hp(mus[:, c], 150) for c in (0, 1)], 1)               # nothing a phone can't play
mus = mus / rms(mus.mean(1)) * (.12 / 10 ** (10 / 20)); mus *= duck[:, None]
fx = np.stack([hp(fx[:, c], 180) for c in (0, 1)], 1)
ir_t = t_(.6); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .12); ir = lp(ir, 6000); ir /= np.abs(ir).sum() ** .5 * 25
verb = lambda st, w: st + w * np.stack([fftconvolve(st[:, c], ir)[:len(st)] for c in (0, 1)], 1)
mix = verb(mus, .25) + verb(fx, .12) * 1.1 + amb + np.stack([vo, vo], 1) * .707
mix = mix[:int(DUR * SR)]; fo = int(.5 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = mix / np.abs(mix).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT'); print('mix.wav', round(len(mix) / SR, 2), 's')

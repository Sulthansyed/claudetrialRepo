"""Sound for Merdeka, 1957 (Comic History Cartoon, 9:16): narration + paper-puppet foley on the page's events + the score.

Run from the library root, with LIB pointing at it:
  LIB=$LIB $LIB/.venv/bin/python mix.py --events out/events.json --out out/mix.wav
Writes 48 kHz stereo.

Accents: Britain = tuba + trombone oom-pah; Malaya = hand drums (darbuka doom/tak, standing in for gendang and rebana) and gong.
Beat grid: 120 bpm from 0.3 s (beats at 0.3 + 0.5k). The oom-pah thins under the tugs; a thin violin tremolo holds the
near-silence before the release; the peel is the downbeat where the drums and gong take over; the pin stops everything dead
except the gong's tail; a soft Bb major chord closes the film under the pull back.
"""
import json, os, sys, argparse
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit, click, whoosh, thump, creak, t_, norm, ding

ap = argparse.ArgumentParser(); ap.add_argument('--events', default='out/events.json'); ap.add_argument('--out', default='out/mix.wav')
A = ap.parse_args()
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, A.events)))
DUR = float(D['dur']); EV = D['ev']; N = int(round(DUR * SR))
rng = np.random.default_rng(57)
fx = np.zeros((N, 2)); vo = np.zeros((N, 2))


# ---------------------------------------------------------------- paper and puppet foley (synthesised)
def paper_slap(v=1.0, size=1.0):
    tt = t_(0.45)
    crack = hp(rng.standard_normal(len(tt)), 1800) * np.exp(-tt / 0.006)
    body = bp(rng.standard_normal(len(tt)), 500, 4500) * np.exp(-tt / (0.035 * size))
    knock = np.sin(2 * np.pi * 95 * tt * (1 - .4 * tt)) * np.exp(-tt / (0.06 * size))
    return norm(crack * .9 + body + knock * .8 * size) * v

def crinkle(d, v=1.0, density=0.004):
    n = int(d * SR); x = (rng.random(n) < density) * rng.standard_normal(n) * 3
    x = bp(x, 1500, 7500) + bp(rng.standard_normal(n), 800, 3000) * .08
    return x * np.sin(np.pi * np.arange(n) / n) ** .6 * v

def peel(d, v=1.0):
    """paper coming off the map in one go: a fast, dense crackle that opens into a flutter"""
    n = int(d * SR); tt = np.arange(n) / SR
    dens = 0.25 * np.exp(-tt / (d * .35)) + 0.01
    x = (rng.random(n) < dens) * rng.standard_normal(n) * 2
    x = bp(x, 700, 7000) + bp(rng.standard_normal(n), 900, 3500) * .3 * np.exp(-tt / .08)
    return norm(x * np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .05)) * v

def flutter(d, v=1.0):   # a sheet of paper flapping in the air
    n = int(d * SR); tt = np.arange(n) / SR
    am = .5 + .5 * np.sin(2 * np.pi * 14 * tt) ** 2
    return lp(bp(rng.standard_normal(n), 300, 2500) * am * np.sin(np.pi * tt / d), 3000) * v

def slide_whistle(d, f0, f1, v=1.0):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); ph = np.cumsum(f) / SR * 2 * np.pi
    x = np.sin(ph) + .25 * np.sin(2 * ph) + bp(rng.standard_normal(len(tt)), 1500, 5000) * .05
    return x * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.04) * v

def puff(v=1.0):
    tt = t_(0.32)
    return norm(bp(rng.standard_normal(len(tt)), 400, 2600) * (tt / 0.03).clip(0, 1) * np.exp(-tt / 0.09)) * v

def joint(v=1.0, pitch=1.0): return lp(click(pitch=pitch, v=1.0), 5000) * v

def page_slide(d, v=1.0):
    n = int(d * SR)
    return lp(bp(rng.standard_normal(n), 300, 3000) * np.sin(np.pi * np.arange(n) / n) ** 2, 4000) * v

def metal_ping(v=1.0, f=1900):
    tt = t_(.6)
    return norm(sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / tau) for m, a, tau in [(1, 1, .18), (2.76, .5, .08), (5.4, .3, .04)])) * v

for e in EV:
    t, k, pan = e['t'], e['type'], e.get('pan', 0) * 0.7
    if k == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'vo', e['id'] + '.wav'), dtype='float32')
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr)
        y = hp(y, 90); y = compress(y / (np.abs(y).max() + 1e-9) * .9, thr=.22, ratio=3.0)
        add(vo, y, t, 1.0, 0.0)
        continue
    if k == 'tag': add(fx, paper_slap(.16, .45), t + .2, 1, pan)
    elif k == 'flap':   # the corner lifting and dropping on its own, twice a cycle
        for j in range(int(e['d'] / .4)): add(fx, lp(paper_slap(.05, .3), 3500), t + .2 + j * .4, 1, .3)
        add(fx, crinkle(e['d'], .04, .0015), t, 1, .3)
    elif k == 'hop': add(fx, joint(.10, 0.8 + .1 * e.get('i', 0)), t, 1, pan)
    elif k == 'land': add(fx, lp(paper_slap(.12, .4), 3000), t, 1, pan)
    elif k == 'grab': add(fx, crinkle(.12, .16, .02), t, 1, pan)
    elif k == 'tug': add(fx, crinkle(.25, .22, .012), t, 1, pan); add(fx, creak(.07), t, 1, pan); add(fx, joint(.08, .9), t + .04, 1, pan)
    elif k == 'strain': add(fx, creak(.05), t + .1, 1, pan)
    elif k == 'hold':
        for j in range(int(e['d'] / .3)): add(fx, creak(.04), t + j * .3, 1, 0)
        add(fx, crinkle(e['d'], .06, .003), t, 1, 0)
    elif k == 'puff': add(fx, puff(.16), t, 1, pan)
    elif k == 'release': add(fx, joint(.09, 1.2), t, 1, pan); add(fx, slide_whistle(.22, 900, 600, .03), t, 1, pan)
    elif k == 'peel': add(fx, peel(e['d'], .6), t, 1, pan); add(fx, paper_slap(.3, .6), t, 1, pan)
    elif k == 'fly': add(fx, flutter(e['d'], .14), t, 1, pan); add(fx, lp(whoosh(e['d'], 1), 6000) * .10, t, 1, pan)
    elif k == 'hatoff': add(fx, metal_ping(.06, 1500), t + .02, 1, pan); add(fx, slide_whistle(0.25, 700, 1500, .07), t + .02, 1, pan); add(fx, slide_whistle(0.3, 1500, 520, .06), t + .27, 1, pan)
    elif k == 'hatland': add(fx, paper_slap(.18, .4), t, 1, pan)
    elif k == 'strip': add(fx, lp(whoosh(0.22, 1), 7000) * .08, t, 1, pan); add(fx, hp(crinkle(0.08, 1, 0.02), 2000) * .12, t + .22, 1, pan)
    elif k == 'shout': add(fx, joint(.08, 1.1), t, 1, pan); add(fx, joint(.07, 1.3), t + .15, 1, pan)
    elif k == 'drop': add(fx, lp(whoosh(e['d'], 1), 6000) * .07, t, 1, pan)
    elif k == 'pin': add(fx, thump(.3, 110), t, 1, pan); add(fx, joint(.14, 1.5), t, 1, pan); add(fx, ding(.04), t + .01, 1, pan)
    elif k == 'pageout': add(fx, page_slide(e['d'], .10), t, 1, 0)
room = lp(rng.standard_normal(N), 700, 2) * 0.0035
fx += np.stack([room, np.roll(room, 1171)], 1)

# ---------------------------------------------------------------- score (film seconds; beats at 0.3 + 0.5k; Bb major)
score = []
def ev(t, inst, p, d, v, pan=0.0, g=1.0): score.append((t, inst, p, d, v, pan, g))
B = lambda k: 0.3 + 0.5 * k
CH = {'Bb': (34, [53, 58, 62]), 'F7': (29, [57, 63, 65]), 'Eb': (39, [55, 58, 63])}
def oompah(t, ch, v=1.0, pah=True):
    r, voic = CH[ch]
    ev(t, 'tuba_stac', r, .4, .62 * v, .3, 1.0)
    if pah:
        for i, p in enumerate(voic): ev(t + .5, 'trombone_stac', p, .18, .42 * v, .45 - .1 * i, .8)
# 0-3.3: Britain's oom-pah, a little pompous; Malaya's hops land on rising xylophone notes and a drum tap
ev(0.0, 'snare', 'on', None, .4, .3, .45)
for b, ch in enumerate(['Bb', 'F7', 'Bb', 'F7', 'Bb', 'Eb']): oompah(B(2 * b) - 0.3 if b == 0 else B(2 * b), ch, .9)
for i, t in enumerate([1.8, 2.3, 2.8]):
    ev(t, 'xylophone', [77, 82, 86][i], .3, .5, -.45, .65); ev(t, 'world_perc', 'darbuka_tak', None, .5, -.5, .5)
ev(3.3, 'world_perc', 'darbuka_doom', None, .7, -.3, .7); ev(3.3, 'xylophone', 89, .3, .45, -.3, .5)
# 3.8-6.3: the tugs. The oom-pah thins (no pah), each tug a drum doom + a low trombone groan
oompah(B(7), 'Bb', .7, pah=False); oompah(B(9), 'F7', .6, pah=False); oompah(B(11), 'Bb', .5, pah=False)
for i, t in enumerate([3.8, 4.8, 5.8]):
    ev(t, 'world_perc', 'darbuka_doom', None, .75 + .08 * i, -.25, .8); ev(t + .25, 'world_perc', 'darbuka_tak', None, .5, -.25, .5)
    ev(t, 'trombone', 41 - i, .45, .45, .35, .5)
# 6.3-7.3: near silence: a thin violin tremolo only (Britain's sigh, "and Britain lets go")
ev(6.3, 'violins_trem', 89, 1.0, .2, 0, .35)
# 7.3 the peel: gong and drums take the tune; a bright pentatonic line on glockenspiel and marimba
ev(7.3, 'gong2', 'big', None, .75, 0, .9); ev(7.3, 'gran_cassa', None, None, .7, 0, .8)
for j, (dt, var) in enumerate([(0, 'darbuka_doom'), (.125, 'darbuka_tak'), (.25, 'darbuka_tak'), (.375, 'darbuka_doom')]):
    ev(7.3 + dt, 'world_perc', var, None, .7, -.2 + .1 * j, .7)
for i, p in enumerate([70, 72, 74, 77]): ev(7.3 + i * .11, 'marimba', p, .3, .6, .2, .6)
ev(7.55, 'glockenspiel', 82, .6, .45, .25, .5)
# 7.75 the pin: everything stops dead; only a small gong rings
ev(7.75, 'gong2', 'small', None, .55, -.1, .6)
# 8.3-10: a soft Bb major chord under the pull back, a last bell
for i, p in enumerate([46, 53, 58, 62, 65]): ev(8.3, ['horn', 'horn', 'violas', 'violins', 'violins'][i], p, 1.7, .32, -.2 + .1 * i, .45)
ev(8.8, 'glockenspiel', 89, 1.2, .25, .2, .35); ev(8.8, 'hand_chimes', 82, 1.2, .25, -.2, .3)
used = sorted({e[1] for e in score})
S.seed(57)
music = S.render(score, dur=DUR + 2, master=False)[:N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = S.room(music, size=0.3, mix=0.14)
# the stop at the pin: cut the music dead at 7.75 except the gong (re-rendered alone and added back)
tt = np.arange(N) / SR
cut = np.clip((7.78 - tt) / .03, 0, 1) + np.clip((tt - 8.28) / .05, 0, 1)
gong = S.room(S.render([e for e in score if e[1] == 'gong2' and e[0] >= 7.7], dur=DUR + 2, master=False)[:N], size=.3, mix=.14)
if len(gong) < N: gong = np.pad(gong, ((0, N - len(gong)), (0, 0)))
music = music * np.clip(cut, 0, 1)[:, None] + gong * (1 - np.clip(cut, 0, 1))[:, None]

# ---------------------------------------------------------------- mix: voice on top, music and foley duck under it
env = np.abs(vo).max(1)
k = int(.03 * SR); env = np.convolve(env, np.ones(k) / k, 'same')
act = np.clip(env / (np.percentile(env[env > 1e-4], 50) + 1e-9), 0, 1)
dk = np.zeros(N); a = 0.0; att, rel = np.exp(-1 / (.05 * SR)), np.exp(-1 / (.35 * SR))
for i in range(0, N, 48):
    x = act[i]; a = att * a + (1 - att) * x if x > a else rel * a + (1 - rel) * x; dk[i:i + 48] = a
mid = np.stack([bp(music[:, c], 300, 4000) for c in (0, 1)], 1)
music_d = (music - mid * (1 - 10 ** (-6.5 / 20)) * dk[:, None]) * (1 - (1 - 10 ** (-3 / 20)) * dk[:, None])
fx_d = fx * (1 - (1 - 10 ** (-3 / 20)) * dk[:, None])
speak = dk > .5
vr = np.sqrt((vo[speak] ** 2).mean()); mr = np.sqrt((music_d[speak] ** 2).mean())
mg = (vr / 10 ** (10 / 20)) / (mr + 1e-9)
mix = vo + (music_d + fx_d) * mg * (1 + 0.75 * (1 - dk))[:, None]   # between lines and after the voice, music and foley come up about 5 dB
mix = np.stack([compress(mix[:, 0], thr=0.3, ratio=2.5, att=0.002), compress(mix[:, 1], thr=0.3, ratio=2.5, att=0.002)], 1)
mix *= np.clip((DUR - tt) / 0.6, 0, 1)[:, None]   # the chord rings down over the last 0.6 s
mix *= 0.5 / np.abs(mix).max() * 2.2
mix = np.stack([limit(mix[:, 0], ceil=.8), limit(mix[:, 1], ceil=.8)], 1)
os.makedirs(os.path.dirname(os.path.join(HERE, A.out)), exist_ok=True)
sf.write(os.path.join(HERE, A.out), mix.astype(np.float32), SR)
cr = S.credits(used)
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(cr) if isinstance(cr, list) else str(cr))
print('mix', mix.shape, 'music gain', round(float(mg), 3), 'instruments:', ', '.join(used))

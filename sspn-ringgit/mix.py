"""RM2,000 or RM0? (SSPN) — score, foley and voice → out/mix.wav (48 kHz stereo), mixed for phone speakers.
usage: LIB=<lemo-opuscar library> $LIB/.venv/bin/python mix.py      (reads events.json, voices/)
Score: office-pop at 112 BPM (kit, electric bass, piano, marimba, xylophone, glockenspiel; sampled), written from the
same event list the picture writes, with two real silences (before the whip, before the IF Enter)."""
import json, os, sys
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit

E = json.load(open(os.path.join(HERE, 'events.json')))
EV = E['ev']; DUR = float(E['dur']); N = int(DUR * SR)
rng = np.random.default_rng(2026)
tt = np.arange(N) / SR
rms = lambda x: float(np.sqrt(np.mean(np.square(x)) + 1e-12))
db = lambda x: 20 * np.log10(x + 1e-12)
def smooth(x, sec): k = max(1, int(sec * SR)); return np.convolve(x, np.ones(k) / k, 'same')
evs = lambda kind: [e for e in EV if e['type'] == kind]
first = lambda kind, **kw: next(e['t'] for e in EV if e['type'] == kind and all(e.get(k) == v for k, v in kw.items()))
CUE = {e['name']: e['t'] for e in evs('cue')}
ENT = [e['t'] for e in evs('enter')]           # 0 hook, 1 what-if, 2 IF, 3 band, 4 31 DIS, 5 counter line, 6 end card
WH = [e['t'] for e in evs('whoosh')]           # 0 whip, 1 track down, 2 to the deadline, 3 back up
MERGE = [e['t'] for e in evs('merge')]
UNDO = first('undo'); FINAL = first('ding', final=1)
CELLS = evs('cell'); RINGS = evs('ring')
BAR_END = [max(e['t'] for e in CELLS if e['k'] == k) for k in range(3)]
SWEEP = RINGS[0]['t']

# ---------------- voice ----------------
vo = np.zeros(N); vmask = np.zeros(N)
for e in evs('vo'):
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    i = int(e['t'] * SR); n = min(len(x), N - i); vo[i:i + n] += x[:n]; vmask[i:i + n] = 1
vo = hp(vo, 100)
vo = compress(vo / (np.abs(vo).max() + 1e-9) * 0.9, thr=0.2, ratio=3.5, att=0.003, rel=0.12)
vo = vo + 0.22 * bp(vo, 2000, 4500)            # presence for phone speakers
duck = smooth(np.maximum(vmask, np.roll(vmask, int(0.12 * SR))), 0.15)

# ---------------- score: 112 BPM, C major / A minor ----------------
B = 60 / 112; BAR = 4 * B
sc = []
def n(t, inst, p, d, v, pan=0.0, gain=1.0):
    if 0 <= t < DUR: sc.append((t, inst, p, d, v, pan, gain))
CH = {'C': (36, [60, 64, 67]), 'Am': (33, [57, 60, 64]), 'F': (29, [57, 60, 65]), 'G': (31, [59, 62, 67]),
      'Em': (28, [59, 64, 67]), 'Dm': (26, [57, 62, 65])}
def groove(a, b, prog, kick='half', hats=True, bass=True, stabs=False, mallets=0, vel=1.0):
    t = a; bar = 0
    while t < b - 0.01:
        root, ch = CH[prog[bar % len(prog)]]
        for q in range(4):
            bt = t + q * B
            if bt >= b: break
            if kick == 'four' or (kick == 'half' and q in (0, 2)) or (kick == 'one' and q == 0):
                n(bt, 'drum_kit', 'kick_drum_left', None, .8 * vel, 0, 1.0)
            if kick == 'four' and q in (1, 3): n(bt, 'drum_kit', 'snare_2', None, .45 * vel, -.1, .45)
            if hats: n(bt + B / 2, 'hihat', 'closed', None, .48 * vel, .25, .4)
            if bass and q in (0, 2): n(bt + (B / 2 if q == 2 else 0), 'electric_bass', root + (12 if q == 2 else 0), .3, .72 * vel, 0, .9)
            if mallets:
                for s in range(mallets):
                    u = bt + s * B / mallets
                    if u < b: n(u, 'marimba', ch[(q * mallets + s) % 3] + 12, .12, .38 + .1 * (s == 0), .25, .38)
        if stabs:
            for off in (1.5 * B, 3.5 * B):
                if t + off < b:
                    for p in ch: n(t + off, 'piano', p, .16, .42 * vel, -.15, .4)
        t += BAR; bar += 1

# hook (0–6.1): half-time groove; the Saved flash and the hop to RM2,000 get a marimba figure
groove(0.25, CUE['silence1'], ['C', 'Am', 'F', 'G'], kick='half', vel=.85)
n(ENT[0], 'drum_kit', 'crash_right', None, .55, .3, .45)
for q, p in enumerate([72, 76, 79]): n(ENT[0] + q * .06, 'marimba', p, .4, .62, .3, .55)
hop = first('pop')
for q, p in enumerate([67, 72, 76, 79]): n(hop + q * .06, 'marimba', p, .4, .6, .25, .55)
# curiosity (6.35–9.05): a held low A and a clock; one marimba question figure
c0 = WH[0]; c1 = first('click')
n(c0, 'electric_bass', 33, 2.4, .8, 0, .9); n(c0, 'piano', 45, 2.6, .5, 0, .45)
for q in range(int((c1 - c0) / (B / 2))): n(c0 + q * B / 2 + B / 4, 'hihat', 'closed', None, .4, .25, .32)
for q, p in enumerate([69, 72, 71, 74]): n(c0 + .55 + q * B / 2, 'marimba', p, .25, .45, -.2, .45)
# trap 1 (9.05–14.85): the groove in A minor; a sour piano stab on the red Enter, a falling glockenspiel on ctrl-Z
groove(c1, evs('click')[2]['t'], ['Am', 'F', 'Am', 'Dm'], kick='half', vel=.78)
for p in [57, 60, 63, 66]: n(ENT[1], 'piano', p, .5, .6, 0, .5)
for q, p in enumerate([88, 84, 79, 76]): n(UNDO + q * .07, 'glockenspiel', p, .5, .45, .2, .35)
for p in [57, 60, 64]: n(UNDO + .3, 'piano', p, .8, .4, 0, .4)
# trap 2 (14.85–16.95): thinner, then the second silence; the IF Enter lands alone on a low chord
t2 = evs('click')[2]['t']
groove(t2, CUE['silence2'], ['Am', 'F'], kick='one', hats=True, bass=True, vel=.7)
n(ENT[2], 'drum_kit', 'kick_drum_left', None, .95, 0, 1.0); n(ENT[2], 'electric_bass', 28, 1.0, .85, 0, .9)
for p in [40, 52, 55, 59]: n(ENT[2], 'piano', p, 1.0, .6, 0, .5)
# climax (18.5–25.5): four on the floor + sixteenth marimba while the cells count; crash + ding on 2,000
cl0 = WH[1]
n(cl0, 'drum_kit', 'crash_left', None, .7, -.3, .5)
groove(cl0, SWEEP, ['F', 'G', 'Am', 'C'], kick='four', mallets=4, vel=1.0)
for q in range(6): n(SWEEP - .75 + q * .125, 'drum_kit', 'snare_2', None, .35 + q * .08, -.1, .4)
n(BAR_END[2], 'glockenspiel', 84, 1.2, .55, .2, .45)
# the colour scale: a rising arpeggio, one note per ring, over the groove
n(SWEEP, 'drum_kit', 'crash_right', None, .8, .3, .55)
groove(SWEEP, WH[2], ['F', 'G'], kick='half', vel=.75)
for e in RINGS:
    for q, p in enumerate([72, 76, 79]): n(e['t'] + q * .04, 'xylophone', p + [0, 2, 4, 5, 7, 9, 12][e['n']], .12, .45, -.3 + .1 * e['n'], .38)
# payoff (25.9–32.6): half-time breath, bass pedal; glockenspiel on 31 DIS and on the counter line
groove(WH[2] + .2, WH[3], ['C', 'Am', 'F', 'G'], kick='half', hats=True, vel=.68)
for e in (ENT[4], ENT[5]):
    for q, p in enumerate([84, 88, 91]): n(e + q * .06, 'glockenspiel', p, .8, .5, .2, .4)
n(ENT[4], 'drum_kit', 'crash_left', None, .5, -.3, .4)
# end (32.65–): kit drops; a home chord on the merge, mallets on Enter, one last ding, then it rings out
n(MERGE[1], 'electric_bass', 36, 3.0, .8, 0, .85)
for p in [48, 55, 60, 64, 67, 72]: n(MERGE[1], 'piano', p, 3.8, .55, 0, .48)
for q, p in enumerate([72, 76, 79, 84]): n(ENT[6] + q * .07, 'marimba', p, .7, .58, .3, .5)
n(FINAL, 'glockenspiel', 84, 2.0, .55, .2, .45); n(FINAL, 'piano', 72, 2.0, .4, 0, .4)
S.seed(11)
music = S.render(sc, dur=DUR + 2, master=False)[:N]
music = S.room(music, size=.3, mix=.12)
music = np.stack([hp(music[:, c], 60) for c in (0, 1)], 1)
music = music - 0.37 * np.stack([bp(music[:, 0], 300, 4000), bp(music[:, 1], 300, 4000)], 1)   # room for the voice
music *= (1 - 0.42 * duck)[:, None]
gap = np.ones(N)                                   # two real silences
for a, b in [(CUE['silence1'], WH[0]), (CUE['silence2'], ENT[2])]:
    i0, i1 = int(a * SR), int(b * SR); f = int(.06 * SR); gap[i0:i1] = 0; gap[i0 - f:i0] = np.linspace(1, 0, f)
music *= gap[:, None]

# ---------------- foley: the sheet itself ----------------
fx = np.zeros((N, 2))
def blip(f, d=.03, tau=.008):
    t = X.t_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
def ratchet(): return hp(X.click(1.8, 1), 1500)
def buzz(soft):
    d = .22 if soft else .32; t = X.t_(d); x = np.sign(np.sin(2 * np.pi * (150 if soft else 120) * t)); return bp(x, 250, 2500) * np.exp(-t / (d / 2.5)) * (.5 if soft else .8)
def rasp(d=.32):
    t = X.t_(d); return bp(rng.standard_normal(len(t)), 1800, 6000) * np.sin(np.pi * t / d) * .5
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'key': add(fx, X.click(rng.uniform(.85, 1.2), 1), t, .3, rng.uniform(-.2, .2))
    elif ty == 'enter': add(fx, X.clack(1.0, 1), t, .5 if e.get('big') else .4, 0); add(fx, X.thump(1, 85 if e.get('big') else 95), t, .45 if e.get('big') else .3, 0) if not e.get('soft') else None
    elif ty == 'hop': add(fx, X.click(1.45, 1), t, .18, -.2)
    elif ty == 'blip': add(fx, blip(1400 + 180 * e['n']), t, .12, .1)
    elif ty == 'tick': add(fx, X.click(1.7, 1), t, .22, 0)
    elif ty == 'click': add(fx, X.click(1.25, 1), t, .3, .1)
    elif ty == 'menu': add(fx, X.pop(1), t, .14, .1)
    elif ty == 'ratchet': add(fx, ratchet(), t, .25, -.3 + .2 * e['n'])
    elif ty == 'error': add(fx, buzz(e.get('soft')), t, .12, .15)
    elif ty == 'undo': add(fx, rasp(.25)[::-1].copy(), t, .25, -.1)
    elif ty == 'pop': add(fx, X.pop(1), t, .25, .1)
    elif ty == 'drag': add(fx, rasp(.32), t, .18, .2)
    elif ty == 'cell': add(fx, blip(700 + 1500 * e['q'] / 25 + [0, 40, 80][e['k']], .025, .006), t, .05, -.4 + .4 * e['k'])
    elif ty == 'ding': add(fx, X.ding(1), t, .16 if e.get('final') else .14, .2)
    elif ty == 'ring': add(fx, blip(900 + 160 * e['n'], .05, .015), t, .08, rng.uniform(-.5, .5))
    elif ty == 'merge': add(fx, X.pop(1), t, .3, 0); add(fx, X.thump(1, 120), t, .2, 0)
    elif ty == 'whoosh': add(fx, lp(X.whoosh(.5 if e.get('soft') else .45, 1.0), 3500), t - .08, .18 if e.get('soft') else .28, 0)
room = lp(rng.standard_normal(N), 600, 2) * 0.004                  # a quiet office
fx += np.stack([room, np.roll(room, 997)], 1)
fx = np.stack([hp(fx[:, c], 120) for c in (0, 1)], 1)
fx *= (1 - 0.35 * duck)[:, None]

# ---------------- balance: voice ~10 dB over the music (RMS while speaking) ----------------
spk = vmask > 0
vg = (rms(music[spk].mean(1)) * 10 ** (10 / 20)) / rms(vo[spk])
mix = music + fx + np.stack([vo * vg, vo * vg], 1)
print(f'voice vs music: {db(rms(vo[spk]) * vg) - db(rms(music[spk].mean(1))):.1f} dB;  voice vs foley: {db(rms(vo[spk]) * vg) - db(rms(fx[spk].mean(1))):.1f} dB')
lows = np.stack([lp(mix[:, c], 90) for c in (0, 1)], 1); mix = mix - 0.5 * lows        # phone speakers: less sub-bass
mix = np.stack([limit(compress(mix[:, c], thr=.35, ratio=2.0) * 1.9, ceil=.7, look=.004) for c in (0, 1)], 1)
mix *= np.clip((DUR - tt) / 1.4, 0, 1)[:, None] ** 1.5           # the last chord dies away with the film
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
used = sorted({x[1] for x in sc})
open(os.path.join(HERE, 'out', 'instruments.txt'), 'w').write('\n'.join(S.credits(used)))
print('mix', mix.shape, 'peak', round(float(np.abs(mix).max()), 3), 'instruments', used)

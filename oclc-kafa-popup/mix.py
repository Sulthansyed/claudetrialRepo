"""Score + foley + voice → out/mix.wav (48 kHz stereo). Run with the library's python: "$LIB/.venv/bin/python" mix.py
Reads events.json (export with core/render/events.mjs) and tts/voices/*.wav. Timing constants mirror story.js."""
import os, sys, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add, compress, limit
import sampler as S
S.seed(11); rng = np.random.default_rng(5)

EVJ = json.load(open(os.path.join(HERE, 'events.json'))); DUR = EVJ['dur']; EV = EVJ['ev']
N = int((DUR + .5) * SR)
BEAT, GRID0, MUSIC0 = .575, 10.0, 3.675
b = lambda n: GRID0 + n * BEAT
VO = [('vo1', .2), ('vo2', 3.9), ('vo3', 6.4), ('vo4a', 10.15), ('vo4b', 12.45), ('vo4c', 14.75), ('vo4d', 17.05),
      ('vo5a', 18.7), ('vo5b', 21.99), ('vo5c', 23.88), ('vo5d', 27.5)]

# ---------------- score ----------------
CH = {'C': ['C3', 'E3', 'G3', 'C4'], 'Dm': ['D3', 'F3', 'A3', 'D4'], 'F': ['F3', 'A3', 'C4', 'F4'], 'G': ['G3', 'B3', 'D4', 'G4'],
      'Am': ['A3', 'C4', 'E4', 'A4'], 'Em': ['E3', 'G3', 'B3', 'E4']}
UKE = {k: [p.replace('3', '4').replace('4', '4') for p in v] for k, v in CH.items()}
BASS = {'C': 'C2', 'Dm': 'D2', 'F': 'F2', 'G': 'G2', 'Am': 'A2', 'Em': 'E2'}
ev = []
def strum(t, ch, vel=.55, dn=True):
    notes = ['G4', 'C4', 'E4', 'A4'] if ch == 'C' else [p[:-1] + str(int(p[-1]) + 1) if p[-1] == '3' else p for p in CH[ch]]
    for i, p in enumerate(notes if dn else notes[::-1]): ev.append((t + i * .014, 'ukulele', p, .5, vel * (1 - i * .06), -.25 + i * .12, .8))
def bass(t, ch, vel=.6, d=.45): ev.append((t, 'contrabass_pizz', BASS[ch], d, vel, .0, 1.1))
def glock(t, p, vel=.5, pan=.25, g=.55): ev.append((t, 'glockenspiel', p, .6, vel, pan, g))
def shaker(t, vel=.35): ev.append((t, 'shaker', 'down' if rng.random() < .5 else 'up', None, vel, .35, .35))

# bar layout (4/4, bar = 2.3 s); bars counted from GRID0
def bar_t(k): return GRID0 + k * 4 * BEAT
# curiosity: from Klik's click (beat -11) — a 3-note glock motif + pizz
glock(b(-11), 'G5', .7); glock(b(-10.5), 'C6', .7); glock(b(-10), 'E6', .75)
for n, ch in [(-9, 'C'), (-8, 'C'), (-7, 'F'), (-6, 'G')]: bass(b(n), ch, .45); ev.append((b(n), 'violins_pizz', CH[ch][2].replace('3', '4'), .3, .35, -.2, .5))
# conflict (road, from 6.4): staccato minor colour, woodblock "tick-tock" of waiting
for n in range(-6, -1):
    ch = ['Am', 'Am', 'Em', 'Am', 'Em'][n + 6]
    bass(b(n), ch, .5); ev.append((b(n + .5), 'violins_pizz', CH[ch][1].replace('3', '4'), .25, .4, .2, .45))
    ev.append((b(n), 'woodblock', 'a', None, .35, -.4, .45)); ev.append((b(n + .5), 'woodblock', 'b', None, .25, -.4, .4))
# the click at b(-2) folds the jam; music drops out until page ① lands (b(0) = 10.0)
glock(b(-2), 'E6', .6); glock(b(-1.75), 'G6', .5)
# climax: one bar per page, chords lift C → Dm → F → G, glock melody climbing
MEL = {0: ['C6', 'E6', 'G6', 'E6'], 1: ['D6', 'F6', 'A6', 'F6'], 2: ['F6', 'A6', 'C7', 'A6'], 3: ['G6', 'B6', 'D7', 'B6']}
for k, ch in enumerate(['C', 'Dm', 'F', 'G']):
    t0 = bar_t(k)
    for q in range(4):
        strum(t0 + q * BEAT, ch, .55 if q in (0, 2) else .42, dn=q % 2 == 0); bass(t0 + q * BEAT, ch, .55 if q == 0 else .4, .3)
        for e8 in range(2): shaker(t0 + q * BEAT + e8 * BEAT / 2, .3 if e8 else .4)
    for q, p in enumerate(MEL[k]): glock(t0 + q * BEAT + (BEAT / 2 if q == 3 else 0), p, .45, .3, .45)
# stars: ascending plinks on the half beats (the progress bar fills)
for i, p in enumerate(['C6', 'D6', 'E6', 'G6', 'C7']): glock(b(12.5 + i * .5), p, .75, -.1 + i * .05, .75)
# payoff (home, evening, from 19.2 = bar 4): C F G C, fuller, then thins for the end card at 24.25
for k, ch in enumerate(['C', 'F', 'Am', 'G', 'C']):
    t0 = bar_t(4 + k); full = t0 < 24.0
    for q in range(4):
        if t0 + q * BEAT > 29.5: break
        strum(t0 + q * BEAT, ch, (.5 if q in (0, 2) else .38) * (1 if full else .8), dn=q % 2 == 0)
        if full or q == 0: bass(t0 + q * BEAT, ch, .5 if q == 0 else .35, .35)
        if full: shaker(t0 + q * BEAT, .28)
    if k < 4: glock(t0, CH[ch][3].replace('4', '6').replace('3', '6'), .45, .3, .45); glock(t0 + 2 * BEAT, CH[ch][2].replace('4', '6').replace('3', '6'), .4, .3, .4)
# final chord on bar 8 (28.4), ringing out
ev.append((bar_t(8), 'vibraphone', 'C5', 2.2, .5, -.2, .7)); ev.append((bar_t(8), 'vibraphone', 'E5', 2.2, .45, .2, .6)); ev.append((bar_t(8), 'vibraphone', 'G5', 2.2, .45, 0, .6))
glock(bar_t(8), 'C7', .55, .1, .5)
ev.append((24.2, 'triangle', 'open', None, .45, .4, .5))
music = S.render(ev, dur=N / SR)[:N]
music = music * .55

# ---------------- foley ----------------
fx = np.zeros((N, 2), np.float32)
def crinkle(d=.12, v=1.):
    x = hp(noise(d), 2500) * (rng.random(int(round(d * SR))) < .08) * env_exp(d, d / 3); return norm(bp(x, 2500, 9000) + hp(noise(d), 4000) * env_exp(d, .01) * .3) * v
def swish(d=.6, v=1.):
    tt = t_(d); n = noise(d); out = np.zeros_like(n)
    for i in range(0, len(n), 960):
        hi = min(len(n), i + 960); f = 900 + 3200 * np.sin(np.pi * i / len(n)); out[i:hi] = bp(n[max(0, i - 3000):hi], f * .6, f * 1.4)[-(hi - i):]
    return norm(out * np.sin(np.pi * tt / d) ** 1.5 + crinkle(d, .25)[:len(out)]) * v
def toyhorn(v=1.):
    d = .22; tt = t_(d); f = 420 * (1 + .015 * np.sin(2 * np.pi * 24 * tt))
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .6 + np.sin(2 * np.pi * np.cumsum(f * 1.26) / SR) * .4
    return norm(lp(x, 2400) * np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .04)) * v
def blip(f=1250, v=1.):
    d = .045; tt = t_(d); return np.sign(np.sin(2 * np.pi * f * tt)) * env_exp(d, .015) * .5 * v
def tink(v=1.):
    d = .4; tt = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * tt) * env_exp(d, tau) for f, a, tau in [(3520, 1, .12), (5280, .5, .06)])) * v
def tick(v=1.):
    d = .03; tt = t_(d); return norm(hp(noise(d), 3000) * env_exp(d, .003) + np.sin(2 * np.pi * 3200 * tt) * env_exp(d, .004) * .6) * v
G = dict(creak=.5, thump=.7, pop=.32, page=.55, click=.9, button=.6, honk=.5, fold=.4, slide=.35, ding=.6, hop=.35, land=.45, drop=.4, tink=.35, blip=.18)
for e in EV:
    t, ty = e['t'], e['type']; pan = float(np.clip(rng.normal(0, .25), -.6, .6))
    if ty == 'creak': add(fx, sfx.creak(1) , t, G[ty]); add(fx, sfx.creak(1), t + .2, G[ty] * .7)
    elif ty == 'thump': add(fx, sfx.thump(1, 90), t, G[ty])
    elif ty == 'pop': add(fx, sfx.pop(1) * .6 + np.pad(crinkle(.18, .8), (0, 0))[:len(sfx.pop(1))], t, G[ty], pan)
    elif ty == 'page': add(fx, swish(max(.4, e.get('d', .7)), 1), t, G[ty])
    elif ty == 'click': add(fx, sfx.click(1.25, 1), t, G[ty], .15); add(fx, sfx.pop(.8), t + .01, .25, .15)
    elif ty == 'button': add(fx, sfx.thump(1, 160), t, G[ty] * .6); add(fx, sfx.click(.8, 1), t, G[ty] * .6)
    elif ty == 'honk': add(fx, toyhorn(1), t, G[ty], pan); add(fx, toyhorn(1), t + .28, G[ty] * .9, pan)
    elif ty == 'fold': add(fx, crinkle(.16, 1), t, G[ty], pan); add(fx, sfx.thump(1, 120) * .4, t + .25, G[ty] * .5, pan)
    elif ty == 'slide': add(fx, sfx.whoosh(.45, 1), t, G[ty], -.3)
    elif ty == 'ding': add(fx, sfx.ding(1), t, G[ty], .2); add(fx, sfx.thump(1, 110), t, .35)
    elif ty == 'hop': add(fx, sfx.pop(1.2), t, G[ty])
    elif ty == 'land': add(fx, sfx.step(1), t, G[ty]); add(fx, crinkle(.08, 1), t, .2)
    elif ty == 'drop': add(fx, sfx.whoosh(.35, 1), t, G[ty])
    elif ty == 'tink': add(fx, tink(1), t, G[ty], .2)
    elif ty == 'blip': add(fx, blip(1250 + 80 * (int(t * 100) % 3), 1), t, G[ty], .3)
    elif ty == 'tick':   # the clock races: ticks speed up until the click, then stop (the first silence)
        tt, step_ = .05, .5
        while tt < e['d'] - .45: add(fx, tick(1), tt, .22 + .12 * tt / e['d'], -.2); tt += step_; step_ = max(.11, step_ * .86)
# ambience: room tone everywhere, a distant city bed on the road spread
amb = np.zeros((N, 2), np.float32)
room = lp(sfx.brown(N / SR), 500)[:N]; room = norm(room) * .03; amb[:, 0] += room; amb[:, 1] += np.roll(room, 3000)
cs, ce = 5.6, 9.7; city = norm(bp(noise(ce - cs + .5), 120, 900)) * .05
city *= np.minimum(1, np.minimum(t_(ce - cs + .5) / .4, (ce - cs + .5 - t_(ce - cs + .5)) / .3)); add(amb, city, cs, 1.0)
fx = np.stack([limit(fx[:, 0], .5), limit(fx[:, 1], .5)], 1)

# ---------------- voice ----------------
vo = np.zeros(N, np.float32)
for vid, t in VO:
    a, sr = sf.read(os.path.join(HERE, 'tts', 'voices', vid + '.wav'), dtype='float32')
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR); s = int(t * SR); e = min(N, s + len(a)); vo[s:e] += a[:e - s]
vo = hp(vo, 90); vo = compress(vo, .2, 3); vo = norm(vo, .7)
# duck music under speech (300 ms smoothing)
envv = np.convolve(np.abs(vo) > .02, np.ones(int(.3 * SR)) / int(.3 * SR), 'same'); duck = 1 - .5 * np.clip(envv * 3, 0, 1)
music *= duck[:, None]
voice_rms = np.sqrt(np.mean(vo[np.abs(vo) > .02] ** 2)); mus_rms = np.sqrt(np.mean(music[int(10 * SR):int(19 * SR)] ** 2)) + 1e-9
music *= min(1., voice_rms / mus_rms / 10 ** (10 / 20))   # voice about 10 dB above the music in the busiest section
out = music + fx * .9 + amb
out[:, 0] += vo; out[:, 1] += vo
out = np.stack([limit(out[:, 0], .89), limit(out[:, 1], .89)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
# per-band energy check (low end shouldn't swamp a phone speaker)
spec = np.abs(np.fft.rfft(out.mean(1)[:SR * 28])) ** 2; fr = np.fft.rfftfreq(SR * 28, 1 / SR)
lo, rest = spec[(fr > 20) & (fr < 120)].sum(), spec[(fr >= 120) & (fr < 8000)].sum()
print('mix.wav', round(len(out) / SR, 2), 's · peak', round(float(np.abs(out).max()), 3), '· low/rest dB', round(10 * np.log10(lo / rest), 1))
print(S.credits(sorted({e[1] for e in ev})))

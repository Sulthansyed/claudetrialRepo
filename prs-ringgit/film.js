// RM750 or RM0? — two stacked isometric desks and one locked vault. 1080×1920, a pure function of t.
import { Iso, PAL, tri, hex, mix, clamp, lerp, seg, ss, eo, eio, back, TAU, C30, pin, ring, cutLine, haloText, person, shape } from './engine.js';
const W = 1080, H = 1920;

// ---------- timeline (voice-led: see TREATMENT.md) ----------
export const TL = {
  SAME: .25, POP_A: 1.55, POP_B: 3.35,                   // hook
  REW: 5.0, CAM_V: 5.0, LOCK: 6.05, PRS: 6.2,             // curiosity
  CAM_ALI: 7.9, ALI0: 8.6, SHAKE: 10.55,                  // conflict
  CAM_AIS: 11.15, BRICK: [12.05, 12.675, 13.3], CUT: 13.75, STAMP: 14.3, RET0: 15.0, RET1: 17.2, NOTE: 12.4,   // climax
  OUT: 18.0, CAL: 18.7, TITLE: 19.1, END: 19.65,         // payoff
};
export const DUR = 22.8;
const BEAT = .625;

// voice + subtitles: id, start, duration (voices/dur.json), BM (big), EN (small)
export const VO = [
  ['v01', .1, 4.76, 'Gaji sama. Seorang dapat balik RM750. Seorang lagi RM0.', 'Same salary. One gets RM750 back. One gets RM0.'],
  ['v02', 4.95, 2.946, 'Bezanya? Satu akaun yang ramai tak pernah buka.', 'The difference? One account most people never open.'],
  ['v03', 8.0, 2.962, 'Ali bayar cukai penuh. Dapat balik: RM0.', 'Ali pays full tax. Back: RM0.'],
  ['v04', 11.3, 6.713, 'Aisyah masukkan RM3,000 ke dalam PRS. Jimat sehingga RM750.', 'Aisyah puts RM3,000 into PRS. Tax relief kicks in. Up to RM750 saved.'],
  ['v05', 18.05, 4.505, 'Tarikh akhir: 31 Disember. Nak versi BM penuh? Komen di bawah.', 'Deadline: 31 December. Want the full BM version? Comment below.'],
];
const subWin = i => { const [, s, d] = VO[i], nx = VO[i + 1] ? VO[i + 1][1] - .2 : DUR; return [s - .1, Math.min(nx, Math.max(s + d + .5, s + 1.8))]; };

// ---------- palette ----------
const GROUND = '#F3EEE4', INK = '#26212B';
const AIS = '#2A9D8F', ALI = '#6C88A6', PRSC = '#5A62C8', TAXC = '#E0684F', GOLD = '#E2B044', SAVE = '#3BA55C', WOOD = '#C99A63';

// ---------- world layout ----------
const BA = { x: 0, y: 0 }, BB = { x: 10, y: 10 }, VAULT = { x: 8.7, y: 1.3 }, CAL = { x: 1.0, y: -6.6 };
const coinStack = b => ({ x: b.x - 2.1, y: b.y - 2.1 });
const taxBlock = b => ({ x: b.x + 1.3, y: b.y - 3.2, w: 1.8, h: 2.0 });

// ---------- camera: world centre + log zoom, eased between keyframes ----------
const CAM = {
  wide: { x: 5, y: 5, z: -2.2, k: 58 },
  vault: { x: 8.7, y: 1.3, z: -.2, k: 98 },
  ali: { x: 10.3, y: 9.8, z: -1.6, k: 76 },
  ais: { x: 4.4, y: -.2, z: -1.6, k: 68 },
  out: { x: 5.2, y: 5.2, z: -2.5, k: 42 },
};
const KEYS = [[0, 'wide'], [TL.CAM_V, 'wide'], [TL.CAM_V + .8, 'vault'], [TL.CAM_ALI, 'vault'], [TL.CAM_ALI + .65, 'ali'], [TL.CAM_AIS, 'ali'], [TL.CAM_AIS + .65, 'ais'], [TL.OUT, 'ais'], [TL.OUT + 1.0, 'out']];
function cam(t) {
  let i = 0; while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
  const [t0, a] = KEYS[i], [t1, b] = KEYS[i + 1], A = CAM[a], B = CAM[b], f = eio(seg(t, t0, t1));
  return { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f), z: lerp(A.z, B.z, f), k: Math.exp(lerp(Math.log(A.k), Math.log(B.k), f)) };
}

// ---------- story state ----------
const fmt = n => 'RM' + Math.round(n).toLocaleString('en-US');
function counterA(t) {
  if (t < TL.POP_A) return null;
  if (t < TL.REW) return 750;
  if (t < TL.RET0) return 750 * (1 - eio(seg(t, TL.REW, TL.REW + .45)));
  return Math.floor(nCoinsBack(t) + 1e-6) * 50;
}
const nCoinsBack = t => clamp((t - TL.RET0) / (TL.RET1 - TL.RET0)) * 15;
const counterB = t => t < TL.POP_B ? null : 0;
const focusAli = t => ss(seg(t, TL.CAM_ALI, TL.CAM_ALI + .5)) * (1 - ss(seg(t, TL.CAM_AIS, TL.CAM_AIS + .5)));
const focusAis = t => ss(seg(t, TL.CAM_AIS, TL.CAM_AIS + .5)) * (1 - ss(seg(t, TL.OUT, TL.OUT + .6)));
const lidOff = t => ss(seg(t, TL.CUT + .3, TL.CUT + .65));

// ---------- drawing pieces ----------
function board(I, b, who, t) {
  const hue = who === 'ais' ? AIS : ALI;
  I.box(b.x - 3.5, b.y - 3.5, -1.0, 7, 7, .55, tri('#CFC6B8'), { bias: -60 });
  I.box(b.x - 3.5, b.y - 3.5, -.45, 7, 7, .15, tri(hue), { bias: -59 });
  I.box(b.x - 3.5, b.y - 3.5, -.3, 7, 7, .3, tri('#F7F2E8'), { bias: -58 });
  // desk + monitor + mug
  I.box(b.x - 1.9, b.y - .9, 0, 2.8, 1.25, .85, tri(WOOD));
  I.box(b.x - 1.25, b.y - .7, .85, .9, .14, .62, tri('#3A3442'));
  I.box(b.x - .9, b.y - .62, .85, .2, .2, .12, tri('#3A3442'));
  I.cyl(b.x + .45, b.y - .2, .85, .13, .22, tri('#F7F2E8'), { n: 12 });
  // the person
  I.bill(b.x + .35, b.y + 1.45, 0, g => {
    person(g, { body: hue, h: 2.6, skin: '#B98463', hair: who === 'ali' ? '#2B2226' : null, legs: '#3B3440' });
    if (who === 'ais') { // tudung
      const h = 2.6; g.beginPath(); g.arc(0, -.79 * h, .15 * h, Math.PI * .92, TAU * 1.04); g.lineTo(.2 * h, -.6 * h); g.lineTo(-.2 * h, -.6 * h); g.closePath(); g.fillStyle = hex(mix(AIS, '#231A2C', .35)); g.fill();
      g.beginPath(); g.arc(.02 * h, -.77 * h, .095 * h, -1.3, 1.5); g.fillStyle = '#B98463'; g.fill();
    }
  }, { r: 3 });
  // salary: an identical coin stack on both desks
  const c = coinStack(b), left = who === 'ali' ? 6 - Math.floor(6 * aliSpent(t)) : 6;
  for (let i = 0; i < left; i++) I.cyl(c.x, c.y, i * .13, .5, .11, tri(GOLD), { n: 20 });
  // the tax office
  const T = taxBlock(b);
  I.box(T.x, T.y, 0, T.w, T.w, T.h, tri(TAXC));
  I.box(T.x - .1, T.y - .1, T.h, T.w + .2, T.w + .2, .18, tri('#C4543F'));
  I.box(T.x + .35, T.y + .35, T.h + .18, T.w - .7, T.w - .7, .35, tri(TAXC));
  I.box(T.x - .15, T.y - .15, 0, T.w + .3, T.w + .3, .12, tri('#C4543F'));
  I.text3('TAX', T.x + .25, T.y + T.w + .02, .7, { plane: 'xz', size: .62, weight: 700, tri: tri('#FBF4E6'), face: '#FBF4E6', bias: 4 });
}
function aliSpent(t) { return clamp((t - TL.ALI0) / 1.9); }
function vault(I, t) {
  const v = VAULT, open = lidOff(t);
  I.flat([[v.x - 1.9, v.y - 1.9], [v.x + 1.9, v.y - 1.9], [v.x + 1.9, v.y + 1.9], [v.x - 1.9, v.y + 1.9]], 0, '#E8E1F1');
  I.line3([[v.x - 1.9, v.y - 1.9, .01], [v.x + 1.9, v.y - 1.9, .01], [v.x + 1.9, v.y + 1.9, .01], [v.x - 1.9, v.y + 1.9, .01], [v.x - 1.9, v.y - 1.9, .01]], INK, 2, { dash: [7, 6], layer: 0, depth: -1e4 });
  I.keep = true;
  I.box(v.x - 1.1, v.y - 1.1, 0, 2.2, 2.2, 1.75, tri(PRSC), { bias: -1 });
  if (open < 1) I.box(v.x - 1.15, v.y - 1.15, 1.75 + open * 1.6, 2.3, 2.3, .32, tri(hex(mix(PRSC, '#231A2C', .12))), { bias: 4 });
  if (open > 0) { // the cutaway: hatched rim + inside
    I.add(v.x + v.y + 1.8 + 3, () => {
      const P = (x, y, z) => I.P(x, y, z), z = 1.75;
      const rim = [P(v.x - 1.1, v.y - 1.1, z), P(v.x + 1.1, v.y - 1.1, z), P(v.x + 1.1, v.y + 1.1, z), P(v.x - 1.1, v.y + 1.1, z)];
      I.g.save(); I.g.globalAlpha = ss(seg(t, TL.CUT + .35, TL.CUT + .7));
      I.poly(rim, '#2E2A52'); const n = bricksIn(t);
      for (let i = 0; i < n; i++) { const q = [P(v.x - .8 + i * .55, v.y - .5, z), P(v.x - .4 + i * .55, v.y - .5, z), P(v.x - .4 + i * .55, v.y + .6, z), P(v.x - .8 + i * .55, v.y + .6, z)]; I.poly(q, GOLD); }
      I.g.restore();
    }, 1);
  }
  I.text3('PRS', v.x + 1.11, v.y + .78, .5, { plane: 'yz', size: .78, weight: 700, tri: tri('#FBF4E6'), face: '#FBF4E6', bias: 4 });
  // padlock on the front (+y) face
  const shake = t > TL.LOCK && t < TL.LOCK + .5 ? Math.sin((t - TL.LOCK) * 60) * .05 * (1 - (t - TL.LOCK) / .5) : 0, unl = ss(seg(t, TL.CUT, TL.CUT + .3));
  I.bill(v.x + .05 + shake, v.y + 1.12, .55, g => {
    const s = .42; g.globalAlpha *= 1 - ss(seg(t, TL.CUT + .3, TL.CUT + .6));
    g.lineWidth = .1; g.strokeStyle = '#8A8FA0'; g.beginPath(); g.arc(0, -s * 1.05 - unl * .25, s * .55, Math.PI, TAU); g.lineTo(s * .55, -s * .7 - (unl > 0 ? unl * .25 : 0)); g.moveTo(-s * .55, -s * 1.05 - unl * .25); g.lineTo(-s * .55, -s * .7); g.stroke();
    const T3 = tri(GOLD); g.fillStyle = T3[1]; g.fillRect(-s * .8, -s * .75, s * 1.6, s * 1.2); g.fillStyle = T3[2]; g.fillRect(s * .25, -s * .75, s * .55, s * 1.2); g.fillStyle = T3[0]; g.fillRect(-s * .8, -s * .75, s * 1.6, s * .18);
    g.fillStyle = INK; g.beginPath(); g.arc(0, -s * .2, s * .14, 0, TAU); g.fill(); g.fillRect(-s * .05, -s * .2, s * .1, s * .35);
  }, { r: 1, bias: 3 });
  I.keep = false;
}
const bricksIn = t => TL.BRICK.filter(b => t >= b).length;
// RM1,000 bricks travel from Aisyah's desk into the vault
function bricks(I, t) {
  const c = coinStack(BA), v = VAULT;
  TL.BRICK.forEach((land, i) => {
    const t0 = land - .55, p = seg(t, t0, land); if (p <= 0 || p >= 1) return;
    const e = eio(p), x = lerp(c.x - .2, v.x - .4 + i * .3, e), y = lerp(c.y + .3, v.y, e), z = lerp(1.1, 2.3, e) + Math.sin(Math.PI * e) * 2.2;
    I.keep = true; I.box(x - .45, y - .25, z, .9, .5, .3, tri('#3E9A64'), { bias: 6 }); I.keep = false;
  });
}
// Ali's salary coins up the route into the tax office
function aliCoins(I, t) {
  const c = coinStack(BB), T = taxBlock(BB);
  for (let i = 0; i < 6; i++) {
    const t0 = TL.ALI0 + i * .3125, p = seg(t, t0, t0 + .55); if (p <= 0 || p >= 1) continue;
    const e = eio(p), x = lerp(c.x, T.x + T.w / 2, e), y = lerp(c.y, T.y + T.w / 2, e), z = lerp(.8, T.h + .5, e) + Math.sin(Math.PI * e) * 1.6;
    I.keep = true; I.cyl(x, y, z, .38, .1, tri(GOLD), { n: 16, bias: 5 }); I.keep = false;
  }
}
function routeLine(I, pts, a, o = {}) {
  if (a <= 0) return; const n = pts.length, m = Math.max(1, Math.floor((n - 1) * a)), part = pts.slice(0, m + 1);
  I.line3(part, INK, 2.4, { dash: [9, 7], layer: 2, ...o });
}
const arc3 = (a, b, hgt, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u) + Math.sin(Math.PI * u) * hgt]; });
function calendar(I, t) {
  const c = CAL, rise = back(seg(t, TL.OUT + .2, TL.OUT + .7), 1.6); if (rise <= 0) return;
  const z0 = -3 * (1 - rise);
  I.box(c.x - .9, c.y - .9, z0, 1.8, 1.8, 2.0, tri('#F7F2E8'));
  I.box(c.x - .92, c.y - .92, z0 + 1.6, 1.84, 1.84, .45, tri('#D2463A'));
  const day = t < TL.CAL ? '30' : '31';
  I.text3(day, c.x - .72, c.y + .91, z0 + .35, { plane: 'xz', size: 1.05, weight: 700, tri: tri(INK), face: INK, bias: 4 });
  I.text3('DIS', c.x - .55, c.y + .93, z0 + 1.68, { plane: 'xz', size: .34, weight: 700, tri: tri('#FBF4E6'), face: '#FBF4E6', bias: 4 });
}

// ---------- screen-space furniture ----------
function counter(g, x, y, name, val, col, s, t, popT) {
  haloText(g, name, x + 4, y - 88 * s, { font: `600 ${Math.round(26 * s)}px Jost`, track: 5, haloColor: GROUND });
  if (val === null) { haloText(g, 'RM ?', x, y, { font: `600 ${Math.round(96 * s)}px Jost`, color: '#B9B0A3', haloColor: GROUND }); return; }
  const pop = back(seg(t, popT, popT + .35), 2.6);
  g.save(); g.translate(x, y); g.scale(pop, pop); haloText(g, fmt(val), 0, 0, { font: `700 ${Math.round(96 * s)}px Jost`, color: col, haloColor: GROUND, hw: 10 }); g.restore();
}
function coinIcon(g, x, y, s, lit = 1) {
  const T = lit ? tri(GOLD) : ['#E6DCC8', '#DCD0BA', '#CFC2AA'];
  g.beginPath(); g.ellipse(x, y + s * .12, s * .45, s * .26, 0, 0, TAU); g.fillStyle = T[2]; g.fill();
  g.fillRect(x - s * .45, y, s * .9, s * .12);
  g.beginPath(); g.ellipse(x, y, s * .45, s * .26, 0, 0, TAU); g.fillStyle = T[0]; g.fill();
  g.beginPath(); g.ellipse(x, y, s * .28, s * .15, 0, 0, TAU); g.strokeStyle = T[1]; g.lineWidth = s * .06; g.stroke();
}
function stamp(g, x, y, t) {
  const p = seg(t, TL.STAMP - .18, TL.STAMP); if (p <= 0) return;
  const land = t >= TL.STAMP, sq = land ? 1 + .18 * Math.exp(-(t - TL.STAMP) * 14) * Math.cos((t - TL.STAMP) * 40) : 1, sc = land ? sq : lerp(1.9, 1, ei(p)), a = land ? 1 : p;
  g.save(); g.translate(x, y); g.rotate(-.16); g.scale(sc * .82, (2 - sq) * .82); g.globalAlpha = a;
  g.strokeStyle = SAVE; g.lineWidth = 7; g.beginPath(); g.roundRect(-215, -66, 430, 132, 14); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.roundRect(-200, -52, 400, 104, 8); g.stroke();
  g.fillStyle = SAVE; g.font = '700 58px Jost'; g.textAlign = 'center'; g.letterSpacing = '4px'; g.fillText('TAX RELIEF', 0, 14); g.letterSpacing = '0px';
  g.font = '600 19px Jost'; g.letterSpacing = '5px'; g.fillText('PELEPASAN CUKAI', 0, 42); g.letterSpacing = '0px';
  g.restore();
}
const ei = t => Math.pow(clamp(t), 2.2);
function wrap(g, txt, maxW) {
  const words = txt.split(' '), lines = []; let cur = '';
  for (const w of words) { const c = cur ? cur + ' ' + w : w; if (g.measureText(c).width > maxW && cur) { lines.push(cur); cur = w; } else cur = c; }
  if (cur) lines.push(cur); return lines;
}
function cubeChip(g, x, y, s, col) { const T = tri(col); const P = (a, b, c) => [x + (a - b) * C30 * s, y + ((a + b) * .5 - c) * s]; const f = (pts, c) => { g.beginPath(); pts.forEach((p, i) => { const q = P(...p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.fillStyle = c; g.fill(); }; f([[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], T[1]); f([[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], T[2]); f([[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], T[0]); }
const SUB = { x: 60, w: 880, y: 1395 };
function subLayout(g, bm, en) {
  g.font = '700 50px Jost'; const L1 = wrap(g, bm, SUB.w - 110); g.font = '500 29px Jost'; const L2 = wrap(g, en, SUB.w - 110);
  const h = 34 + L1.length * 58 + 10 + L2.length * 36 + 24; return { L1, L2, h };
}
function subtitles(g, t) {
  VO.forEach(([id, , , bm, en], i) => {
    const [a, b] = subWin(i), f = ss(seg(t, a, a + .2)) * (1 - ss(seg(t, b - .15, b))); if (f <= 0) return;
    const { L1, L2, h } = subLayout(g, bm, en), bd = eo(seg(t, a, a + .25)), wipe = eo(seg(t, a + .1, a + .45));
    g.save(); g.globalAlpha = f;
    g.fillStyle = 'rgba(251,248,241,.96)'; g.beginPath(); g.roundRect(SUB.x, SUB.y, SUB.w, h, 14); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.setLineDash([SUB.w * 2.2 * bd, 4000]); g.beginPath(); g.roundRect(SUB.x, SUB.y, SUB.w, h, 14); g.stroke(); g.setLineDash([]);
    cubeChip(g, SUB.x + 40, SUB.y + 34, 16, i === 3 ? AIS : i === 2 ? ALI : i === 1 ? PRSC : GOLD);
    g.beginPath(); g.rect(SUB.x, SUB.y, (SUB.w) * wipe, h); g.clip();
    g.fillStyle = INK; g.font = '700 50px Jost'; L1.forEach((l, k) => g.fillText(l, SUB.x + 80, SUB.y + 72 + k * 58));
    g.fillStyle = 'rgba(38,33,43,.72)'; g.font = '500 29px Jost'; L2.forEach((l, k) => g.fillText(l, SUB.x + 80, SUB.y + 72 + L1.length * 58 + 4 + k * 36));
    g.restore();
  });
}
function titleCard(g, t) {
  const a = seg(t, TL.TITLE, TL.TITLE + .5); if (a <= 0) return;
  g.save(); const w = eo(a);
  g.beginPath(); g.rect(60, 250, 960 * w, 200); g.clip();
  haloText(g, 'DEADLINE', 64, 312, { font: '600 34px Jost', track: 8, haloColor: GROUND, color: '#D2463A' });
  haloText(g, '31 DEC', 60, 412, { font: '700 112px Jost', track: 2, haloColor: GROUND });
  g.restore();
}
function endCard(g, t) {
  const a = seg(t, TL.END, TL.END + .45); if (a <= 0) return;
  const s = back(a, 1.8) * .86, x = 490, y = 1318;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(251,248,241,.97)'; g.beginPath(); g.roundRect(-430, -70, 860, 140, 70); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  // speech bubble (three-tone, extruded look)
  const T = tri(AIS); g.translate(-345, 0);
  g.fillStyle = T[2]; g.beginPath(); g.roundRect(-38, -30, 80, 58, 16); g.moveTo(-14, 26); g.lineTo(-26, 46); g.lineTo(6, 26); g.fill();
  g.fillStyle = T[0]; g.beginPath(); g.roundRect(-44, -36, 80, 58, 16); g.moveTo(-20, 20); g.lineTo(-32, 40); g.lineTo(0, 20); g.fill();
  g.fillStyle = '#FBF4E6'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-22 + i * 18, -7, 5.5, 0, TAU); g.fill(); }
  g.translate(345, 0);
  haloText(g, 'Nak versi BM penuh?', -260, 18, { font: '700 54px Jost', halo: false });
  g.restore();
}
function channelTag(g) { cubeChip(g, 66, 212, 12, GOLD); haloText(g, 'RINGGIT, EXPLAINED', 96, 222, { font: '600 24px Jost', track: 5, haloColor: GROUND }); }
function dots(g) { g.fillStyle = 'rgba(38,33,43,.07)'; for (let y = 0; y < H; y += 36) for (let x = (y / 36 % 2) * 31; x < W; x += 62) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } }

// ---------- render ----------
let I = null;
export function render(g, t) {
  if (!I) I = new Iso(g, W, H);
  g.fillStyle = GROUND; g.fillRect(0, 0, W, H); dots(g);
  I.cam = cam(t);
  // soft board shadows
  for (const b of [BA, BB]) { const [sx, sy] = I.P(b.x, b.y, -1.6); g.save(); g.filter = `blur(${Math.round(I.cam.k * .4)}px)`; g.fillStyle = 'rgba(60,45,40,.16)'; g.beginPath(); g.ellipse(sx, sy + I.cam.k * 1.2, 6 * C30 * I.cam.k, 3.2 * I.cam.k, 0, 0, TAU); g.fill(); g.restore(); }
  const fa = focusAli(t), fs = focusAis(t);
  I.desat = Math.max(fa, fs) * .85;
  I.keep = fs > 0; board(I, BA, 'ais', t); I.keep = false;
  I.keep = fa > 0; board(I, BB, 'ali', t); I.keep = false;
  vault(I, t);
  if (I.desat > 0 && fs > 0) {} // vault keeps its hue always
  aliCoins(I, t); bricks(I, t); calendar(I, t);
  // route lines (drawn ahead of what moves)
  { const c = coinStack(BB), T = taxBlock(BB); I.keep = true; routeLine(I, arc3([c.x, c.y, .9], [T.x + T.w / 2, T.y + T.w / 2, T.h + .55], 1.6), seg(t, TL.ALI0 - .4, TL.ALI0 + .2) * (1 - seg(t, TL.CAM_AIS, TL.CAM_AIS + .3))); I.keep = false; }
  { const c = coinStack(BA); I.keep = true; routeLine(I, arc3([c.x - .2, c.y + .3, 1.1], [VAULT.x - .1, VAULT.y, 2.3], 2.2), seg(t, TL.BRICK[0] - .9, TL.BRICK[0] - .4) * (1 - seg(t, TL.OUT, TL.OUT + .4))); I.keep = false; }
  I.flush();
  I.desat = 0;
  // overlays
  const s = clamp(I.cam.k / 60, .75, 1.25);
  const vf = ss(seg(t, TL.CAM_V, TL.CAM_V + .4)) * (1 - ss(seg(t, TL.CAM_ALI, TL.CAM_ALI + .4)));
  const cpos = b => { const [x, y] = I.P(b.x - 3.5, b.y + 1.6, 0); return [Math.max(56, x - 20), y - 120 * s]; };
  { const [x, y] = cpos(BA); g.save(); g.globalAlpha = (1 - vf) * (1 - fa * .7); counter(g, x, y, 'AISYAH', counterA(t), SAVE, s, t, t < TL.RET0 ? TL.POP_A : TL.RET0 + Math.floor(nCoinsBack(t)) * (TL.RET1 - TL.RET0) / 15 - .05); g.restore(); }
  { const [x, y] = cpos(BB); const sh = t > TL.SHAKE && t < TL.SHAKE + .5 ? Math.sin((t - TL.SHAKE) * 70) * 14 * (1 - (t - TL.SHAKE) / .5) : 0; g.save(); g.globalAlpha = (1 - vf) * (1 - fs); counter(g, x + sh, y, 'ALI', counterB(t), '#8E8796', s, t, TL.POP_B);
    if (t > TL.SHAKE && t < TL.SHAKE + .6) { /* shake drawn by offsetting a second pass */ }
    g.restore(); }
  // same-salary pins (hook)
  const sp = seg(t, TL.SAME, TL.SAME + 1.1) * (1 - seg(t, TL.REW - .3, TL.REW));
  if (sp > 0) for (const b of [BA, BB]) { const c = coinStack(b); pin(I, c.x, c.y, .85, { title: 'SAME SALARY', dir: 1, up: 60 * s, len: 30, a: sp, ts: Math.round(22 * s) }); }
  // curiosity: ring + PRS pin
  if (t > TL.CAM_V + .5 && t < TL.CAM_ALI + .3) {
    const [vx, vy] = I.P(VAULT.x, VAULT.y, 1.0), a = seg(t, TL.CAM_V + .6, TL.CAM_V + 1.4) * (1 - seg(t, TL.CAM_ALI, TL.CAM_ALI + .3));
    ring(g, vx, vy, 2.2 * I.cam.k, a, t, '?', { ts: 44, ang: -2.3 });
    pin(I, VAULT.x + 1.1, VAULT.y - 1.1, 1.9, { title: 'PRS', num: 'LOCKED', dir: 1, up: 110, len: 40, a: seg(t, TL.PRS, TL.PRS + 1.2) * (1 - seg(t, TL.CAM_ALI, TL.CAM_ALI + .3)), ts: 34, ns: 30 });
  }
  // Ali's counter shake
  // climax: stamp, coins back, note
  if (fs > 0 || t > TL.STAMP) { const TB = taxBlock(BA), [x0s, y0s] = I.P(TB.x + TB.w / 2, TB.y + TB.w, TB.h * .45), x = clamp(x0s, 260, 820), y = y0s; if (t < TL.OUT + .6) { g.save(); g.globalAlpha = 1 - ss(seg(t, TL.OUT, TL.OUT + .5)); stamp(g, x, y, t); g.restore(); } }
  if (t > TL.RET0) {
    const n = nCoinsBack(t), [ax, ay] = cpos(BA), x0 = ax + 4, y0 = ay + 40 * s;
    const T = taxBlock(BA), [tx, ty] = I.P(T.x + T.w / 2, T.y + T.w / 2, T.h);
    for (let i = 0; i < 15; i++) {
      const sx = x0 + (i % 5) * 34 + 17, sy = y0 + Math.floor(i / 5) * 26, land = TL.RET0 + (i + 1) * (TL.RET1 - TL.RET0) / 15, p = seg(t, land - .45, land);
      if (p >= 1) coinIcon(g, sx, sy, 30); else if (p > 0) { const e = eio(p); coinIcon(g, lerp(tx, sx, e), lerp(ty, sy, e) - Math.sin(Math.PI * e) * 120, 30); } else coinIcon(g, sx, sy, 30, 0);
    }
    haloText(g, '1 coin = RM50', x0, y0 + 3 * 26 + 22, { font: '500 21px Jost', track: 1, haloColor: GROUND });
  }
  { const a = seg(t, TL.NOTE, TL.NOTE + .4) * (1 - seg(t, TL.OUT, TL.OUT + .4)); if (a > 0) { g.save(); g.globalAlpha = a; haloText(g, '* Up to RM750 at a 25% tax rate.', 64, 1322, { font: '500 26px Jost', haloColor: GROUND }); haloText(g, '  Your saving depends on your bracket.', 64, 1356, { font: '500 26px Jost', haloColor: GROUND }); g.restore(); } }
  channelTag(g);
  titleCard(g, t); endCard(g, t);
  subtitles(g, t);
}

// ---------- texts for readcheck ----------
export function texts(t) {
  const out = [];
  VO.forEach(([id, , , bm, en], i) => { const [a, b] = subWin(i); if (t > a + .3 && t < b) { out.push({ id: id + '_bm', text: bm, x0: 120, y0: 1400, x1: 940, y1: 1520 }); } });
  if (t > TL.NOTE + .4 && t < TL.OUT) out.push({ id: 'note', text: 'Up to RM750 at a 25% tax rate. Your saving depends on your bracket.', x0: 64, y0: 1300, x1: 900, y1: 1370 });
  if (t > TL.TITLE + .5) out.push({ id: 'title', text: 'DEADLINE 31 DEC', x0: 60, y0: 270, x1: 600, y1: 420 });
  if (t > TL.END + .45) out.push({ id: 'end', text: 'Nak versi BM penuh?', x0: 120, y0: 1258, x1: 860, y1: 1378 });
  return out;
}
// ---------- sound / cue events ----------
export function events() {
  const E = [], e = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
  e(TL.SAME, 'pin'); e(TL.POP_A, 'popA'); e(TL.POP_B, 'popB'); e(TL.REW, 'rewind'); e(TL.CAM_V, 'whoosh'); e(TL.LOCK, 'lock'); e(TL.PRS, 'pin');
  e(TL.CAM_ALI, 'whoosh'); for (let i = 0; i < 6; i++) e(TL.ALI0 + i * .3125 + .55, 'coinTax', { i }); e(TL.SHAKE, 'buzz');
  e(TL.CAM_AIS, 'whoosh'); TL.BRICK.forEach((b, i) => e(b, 'brick', { i })); e(TL.CUT, 'lid'); e(TL.STAMP, 'stamp');
  for (let i = 0; i < 15; i++) e(TL.RET0 + (i + 1) * (TL.RET1 - TL.RET0) / 15, 'coinBack', { i });
  e(TL.OUT, 'whoosh'); e(TL.OUT + .55, 'thud'); e(TL.CAL, 'flip'); e(TL.TITLE, 'title'); e(TL.END, 'bubble');
  return E;
}

// ---------- thumbnail: two piggy banks, RM750 vs a cracked RM0 ----------
function piggy(I, x, y, col, cracked) {
  const T = tri(col);
  for (const [dx, dy] of [[-.9, -.6], [.9, -.6], [-.9, .6], [.9, .6]]) I.cyl(x + dx, y + dy, 0, .32, .7, T, { n: 14 });
  I.sphere(x, y, 1.9, 1.75, T, { bias: 1 });
  I.cyl(x + 1.55, y, 1.75, .55, .45, T, { axis: 'x', n: 18, bias: 2 });
  I.cone(x - .3, y - .95, 3.1, .38, .6, T, { n: 3, bias: 2 }); I.cone(x - .9, y - .3, 3.1, .38, .6, T, { n: 3, bias: 2 });
  I.bill(x - .2, y, 3.55, g => { g.fillStyle = '#3A2A35'; g.beginPath(); g.roundRect(-.55, -.08, 1.1, .16, .08); g.fill(); }, { bias: 3 });
  I.bill(x + 1.0, y + .7, 2.35, g => { g.fillStyle = '#2B1F28'; g.beginPath(); g.arc(0, 0, .09, 0, TAU); g.fill(); }, { bias: 3 });
  if (cracked) I.bill(x, y, 1.9, g => {
    g.strokeStyle = '#2B1F28'; g.lineWidth = .09; g.lineJoin = 'round'; g.beginPath();
    g.moveTo(-.3, -1.6); g.lineTo(.15, -1.0); g.lineTo(-.25, -.5); g.lineTo(.3, .1); g.lineTo(-.1, .6); g.lineTo(.35, 1.2); g.stroke();
    g.beginPath(); g.moveTo(.3, .1); g.lineTo(.85, -.15); g.moveTo(-.25, -.5); g.lineTo(-.8, -.35); g.lineWidth = .06; g.stroke();
  }, { bias: 4 });
}
export function thumb(g) {
  const I2 = new Iso(g, W, H), A = [-2.3, 2.3], B = [2.3, -2.3];
  g.fillStyle = GROUND; g.fillRect(0, 0, W, H); dots(g);
  I2.cam = { x: 0, y: 0, z: -.6, k: 74 };
  I2.keep = true;
  I2.box(A[0] - 2, A[1] - 2, -.6, 4, 4, .6, tri('#F7F2E8'), { bias: -40 });
  piggy(I2, A[0], A[1], '#E9919F', false);
  for (let i = 0; i < 6; i++) I2.cyl(A[0] + .2 + (i % 3) * .55, A[1] + 1.4 + (i > 2 ? .55 : 0), 0, .36, .11, tri(GOLD), { n: 16, bias: 3 });
  I2.cyl(A[0] - .2, A[1], 4.4, .42, .12, tri(GOLD), { n: 16, bias: 5 });
  I2.keep = false;
  I2.box(B[0] - 2, B[1] - 2, -.6, 4, 4, .6, tri('#F7F2E8'), { bias: -40 });
  piggy(I2, B[0], B[1], '#E9919F', true);
  I2.desat = .8; I2.flush(); I2.desat = 0;
  const [cx, cy] = I2.P(B[0] + 1.2, B[1] + 1.8, 0); g.fillStyle = '#CFC6C2'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 30, cy - 12); g.lineTo(cx + 20, cy + 15); g.closePath(); g.fill();
  const [ax, ay] = I2.P(A[0], A[1], 5.4), [bx, by] = I2.P(B[0], B[1], 5.4);
  haloText(g, 'AISYAH', ax, ay - 150, { font: '600 34px Jost', align: 'center', track: 6, haloColor: GROUND });
  haloText(g, 'RM750', ax, ay - 30, { font: '700 118px Jost', align: 'center', color: SAVE, haloColor: GROUND, hw: 12 });
  haloText(g, 'ALI', bx, by - 150, { font: '600 34px Jost', align: 'center', track: 6, haloColor: GROUND });
  haloText(g, 'RM0', bx, by - 30, { font: '700 118px Jost', align: 'center', color: '#8E8796', haloColor: GROUND, hw: 12 });
  haloText(g, 'vs', 540, ay - 50, { font: '500 48px Jost', align: 'center', color: '#8E8796', haloColor: GROUND });
  haloText(g, 'SAME GAJI.', 540, 1290, { font: '700 100px Jost', align: 'center', haloColor: GROUND });
  haloText(g, 'DIFFERENT MOVE.', 540, 1400, { font: '700 100px Jost', align: 'center', color: PRSC, haloColor: GROUND });
  cubeChip(g, 380, 1490, 14, GOLD); haloText(g, 'RINGGIT, EXPLAINED', 410, 1502, { font: '600 28px Jost', track: 5, haloColor: GROUND });
}

// Misty Ridge — a 30 s watercolour film. Classic script after engine.js; everything is a pure function of t.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const DUR = 30; window.DUR = DUR;
const BEAT = .75; // 80 bpm

// id, start, duration (from voices/dur.json), subtitle — mix.py parses these rows: keep the form ['vNN', start, dur,
const VO = [
  ['v01', 1.95, 2.309, 'Every cup begins on one misty hill.'],
  ['v02', 5.95, 2.186, 'My grandfather planted these trees.'],
  ['v03', 10.0, 2.18, 'Each spring, the slope turns white.'],
  ['v04', 13.95, 1.749, 'Then the cherries blush red.'],
  ['v05', 17.45, 2.086, 'Picked by hand. Dried in the sun.'],
  ['v06', 23.3, 1.975, 'So every cup tastes of our hill.'],
];

// palette
const COF = '#6b4226', COF2 = '#9a6a44', COFD = '#4a2c18', SUN = '#e2b07a', CHERRY = '#c8402c', CHERRY2 = '#8f2a1e';
const LEAF = ['#3f5a30', '#4e6e3c', '#2f4a2a', '#56763f'], LEAFL = '#7c9a52', GREEN_CH = '#8ea860';
const SHADE = ['#5f7a5c', '#6b8466', '#4f6b55', '#768e6c'];

// sound / cue events for the mixer
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
window.EV = EV;

// ---------- shared helpers ----------
function washPoly(c, pts, fill, a, passes = 3, jit = 5) {
  for (let p = 0; p < passes; p++) {
    c.beginPath(); pts.forEach(([x, y], i) => { const yy = y + (i % 3 === 0 ? rnd(-jit, jit) : 0); i ? c.lineTo(x, yy) : c.moveTo(x, yy); });
    c.closePath(); c.globalAlpha = a / passes * 1.6; c.fillStyle = fill; c.fill();
  }
  c.globalAlpha = 1;
}
// a pre-jittered blob (unit radius), drawn later at any size without consuming RNG
function blob(n = 28, j = .07) { const P = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = 1 + rnd(-j, j); P.push([Math.cos(a) * r, Math.sin(a) * r]); } return P; }
function fillBlob(c, B, x, y, rx, ry, col, a) {
  const n = B.length, P = i => [x + B[i % n][0] * rx, y + B[i % n][1] * ry], M = i => { const a1 = P(i), b1 = P(i + 1); return [(a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2]; };
  c.beginPath(); let m = M(0); c.moveTo(m[0], m[1]);
  for (let i = 1; i <= n; i++) { const p = P(i), q = M(i); c.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
  c.closePath(); c.fillStyle = rgba(col, a); c.fill();
}
const fade2 = (t, a, b, fi = .5, fo = .5) => ss(seg(t, a, a + fi)) * (1 - ss(seg(t, b - fo, b)));
const wavyR = (ang, k) => 1 + .045 * (vnoise(ang * 2.2 + k) * 2 - 1) + .025 * Math.sin(ang * 7 + k);

function hand(txt, x, y, p, o = {}) {
  if (p <= 0) return;
  ctx.save(); ctx.font = `${o.w || 500} ${o.size || 34}px Caveat`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.beginPath(); ctx.rect(x0 - 6, y - 50, (w + 12) * eo(p), 100); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 12; ctx.fillStyle = rgba(o.col || INK, o.a ?? .9); ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
}
function leader(x0, y0, x1, y1, p, bend = 20, a = .75) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(INK, a); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3, 0, 7); ctx.fillStyle = rgba(INK, a); ctx.fill(); }
}
function mist(t, t0, t1) {
  const c = eio(seg(t, t0, t1)); if (c <= 0) return;
  for (const [lift, a] of [[140, .55], [0, 1]]) {
    const top = 1200 - c * 1500 - lift;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.moveTo(-10, 1100);
    for (let x = -10; x <= W + 40; x += 40) ctx.lineTo(x, top + (vnoise(x * .006 + lift + t0) - .5) * 170 + Math.sin(x * .01 + t) * 12);
    ctx.lineTo(W + 10, 1100); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(PAPER_IMG, 0, 0); ctx.restore();
  }
}

// ======================================================================
// SHOT A (0–9.6): the drop, the bloom, the slope
// ======================================================================
const DSX = 960, DSY = 400;                                  // where the drop lands = the sun, in world and screen
const sA = t => lerp(3.2, 1, eio(seg(t, 1.5, 4.5)));          // pull-back scale
const camXf = monotone([[0, 0], [4.4, 0], [6.6, 560], [8.4, 1000], [9.6, 1090]]);
const Rs = t => t < 1.5 ? 0 : 30 + 2400 * Math.pow(eo(seg(t, 1.5, 4.7)), 1.45);   // reveal radius on screen
const zA = t => 1 + 1.3 * ei(seg(t, 8.3, 9.6));
let HERO_H = [960, 800];
function viewA(par, t) {
  const s = sA(t), z = zA(t), cx = camXf(t) * par, [hx, hy] = HERO_H;
  return { a: s * z, ex: z * (s * (-cx - DSX) + DSX - hx) + hx, ey: z * (s * (-DSY) + DSY - hy) + hy };
}
const LAYS = { far: .2, mid: .45, main: 1, fg: 1.4 };
const yFar = wx => 520 - 55 * fbm(wx / 420 + 2) - 25 * fbm(wx / 130);
const yMid = wx => 610 - 80 * fbm(wx / 520 + 7) - 18 * fbm(wx / 150 + 3);
const yMain = wx => 770 - wx * .055 - 34 * Math.sin(wx / 520 + .6) - 10 * fbm(wx / 120);
const ROWS = [[34, .42], [88, .55], [152, .68], [228, .84], [318, 1.02]];

const LAYC = {}; // pre-painted wash canvases per layer: {cv, x0, y0}
function mkCanvas(x0, y0, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.translate(-x0, -y0); return { cv: c, g, x0, y0 }; }
function buildWashes() {
  // sky: dawn washes, par 0
  const S = LAYC.sky = mkCanvas(-200, -200, 2320, 1100);
  for (let i = 0; i < 9; i++) {
    const y = -150 + i * 70 + rnd(-10, 10), col = mixc('#e3cdb0', '#f1dcc0', i / 8);
    S.g.save(); drawS(S.g, mk(qcurve(-260, y, 2180, y + rnd(-14, 14), rnd(-30, 30), 30), rnd(90, 130), col, { prof: 'even', nb: 7, a: rnd(.3, .45), rough: .15 })); S.g.restore();
  }
  for (let i = 0; i < 3; i++) { const y = 230 + i * 60; drawS(S.g, mk(qcurve(100 + i * 300, y, 900 + i * 380, y + 8, -10, 18), 26, '#d9c2b0', { prof: 'leaf', nb: 6, a: .22 })); }
  // far ridge
  const F = LAYC.far = mkCanvas(-1200, 250, 4200, 1300);
  { const pts = [[-1200, 1550]]; for (let x = -1200; x <= 3000; x += 14) pts.push([x, yFar(x)]); pts.push([3000, 1550]); washPoly(F.g, pts, '#a3b3b4', .55, 3, 4);
    const top = []; for (let x = -1200; x <= 3000; x += 14) top.push([x, yFar(x) + 3]); drawS(F.g, mk(top, 7, '#8799a0', { prof: 'even', nb: 4, a: .35, rough: .3 })); }
  // mid ridge
  const M = LAYC.mid = mkCanvas(-1200, 300, 4400, 1250);
  { const pts = [[-1200, 1550]]; for (let x = -1200; x <= 3200; x += 12) pts.push([x, yMid(x)]); pts.push([3200, 1550]); washPoly(M.g, pts, '#86a08f', .62, 3, 5);
    const top = []; for (let x = -1200; x <= 3200; x += 12) top.push([x, yMid(x) + 4]); drawS(M.g, mk(top, 9, '#5f7d6c', { prof: 'even', nb: 5, a: .4, rough: .3 }));
    const lg = M.g.createLinearGradient(0, 640, 0, 900); lg.addColorStop(0, rgba(PAPER, 0)); lg.addColorStop(1, rgba(PAPER, .55)); M.g.fillStyle = lg; M.g.fillRect(-1200, 640, 4400, 900); }
  // main slope
  const G = LAYC.main = mkCanvas(-1100, 380, 5000, 1250);
  { const pts = [[-1100, 1600]]; for (let x = -1100; x <= 3900; x += 10) pts.push([x, yMain(x)]); pts.push([3900, 1600]); washPoly(G.g, pts, '#a9b98a', .7, 3, 4);
    const top = []; for (let x = -1100; x <= 3900; x += 10) top.push([x, yMain(x) + 3]); drawS(G.g, mk(top, 8, '#6f8d5a', { prof: 'even', nb: 5, a: .45, rough: .3 }));
    // contour rows: darker soil lines the shrubs stand on
    for (const [off, sc] of ROWS) { const r = []; for (let x = -1100; x <= 3900; x += 20) r.push([x, yMain(x) + off + 4 * sc]); drawS(G.g, mk(r, 9 * sc + 3, '#7d8f55', { prof: 'even', nb: 4, a: .32, rough: .35 })); }
    const lg = G.g.createLinearGradient(0, 900, 0, 1250); lg.addColorStop(0, rgba('#8ea860', 0)); lg.addColorStop(1, rgba('#8ea860', .35)); G.g.fillStyle = lg; G.g.fillRect(-1100, 900, 5000, 700); }
}

// plants
function coffeeShrub(sc, o = {}) {
  const S = [], h = rnd(95, 120) * sc, tiers = 6;
  for (let i = 0; i < 2; i++) S.push(mk(qcurve(rnd(-3, 3) * sc, 0, rnd(-5, 5) * sc, -h, rnd(-4, 4), 6), 3.2 * sc, INK2, { prof: 'tip', nb: 0, a: .75 }));
  const leaves = [];
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1), y = -h * (.12 + .8 * f), L = (1 - f * f * .7) * h * .5;
    for (const side of [-1, 1]) {
      const ex = side * L * rnd(.85, 1.1), ey = y + L * rnd(.08, .22);
      S.push(mk(qcurve(0, y, ex, ey, side * rnd(-6, -2) * sc, 6), 2 * sc, INK2, { prof: 'tip', nb: 0, a: .6 }));
      for (let j = 0; j < 4; j++) { const u = .25 + j * .22; leaves.push([ex * u, y + (ey - y) * u - 2 * sc, side]); }
    }
  }
  for (const [x, y, side] of leaves) for (const s of [-1, 1]) {
    const len = rnd(10, 16) * sc * 1.6, a = (side > 0 ? 0 : Math.PI) + s * rnd(.5, 1.1) + (s < 0 ? 0 : .25);
    S.push(mk(polar(x, y, a, len, rnd(-2, 2) * sc, 5), rnd(6, 9) * sc * 1.3, pick(LEAF), { prof: 'leaf', nb: sc > .7 ? 3 : 0, a: rnd(.72, .92), rough: .3 }));
  }
  clump(S, 0, -h * .98, h * .12, 6, LEAF, { l0: 7 * sc, l1: 12 * sc, w0: 6 * sc, w1: 9 * sc, sx: 1, sy: .8 });
  if (o.cherries) for (let i = 0; i < o.cherries; i++) { const [x, y] = pick(leaves); S.push(mk(qcurve(x, y + 2, x + 1.5, y + 4, 0, 3), 4.5 * sc, CHERRY, { prof: 'leaf', nb: 0, a: .85 })); }
  return { S, h };
}
function shadeTree(sc) {
  const S = [], h = rnd(230, 290) * sc;
  const trunk = mk(qcurve(0, 0, rnd(-10, 10), -h * .72, rnd(-12, 12), 8), 12 * sc, '#6b5a4c', { prof: 'trunk', nb: 4, a: .85 }); S.push(trunk, edgeOf(trunk, 1, 2.2 * sc, INK, .6));
  for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i / 3 - .5) * 2.2; S.push(mk(polar(0, -h * .62, a, h * rnd(.3, .42), rnd(-10, 10), 6), 4.5 * sc, INK2, { prof: 'tip', nb: 0, a: .75 })); }
  for (let i = 0; i < 6; i++) clump(S, rnd(-.36, .36) * h, -h * rnd(.8, .98), h * .24, 26, SHADE, { l0: 14 * sc, l1: 26 * sc, w0: 11 * sc, w1: 18 * sc, sx: 1.7, sy: .55 });
  return { S, h };
}
function farTree(sc) {
  const S = [], h = rnd(40, 70) * sc;
  S.push(mk(qcurve(0, 0, rnd(-2, 2), -h * .7, 1, 4), 2.4 * sc, '#4f6b55', { prof: 'tip', nb: 0, a: .55 }));
  clump(S, 0, -h, h * .35, 8, ['#5f7d6c', '#6e8a78', '#56715f'], { l0: 7 * sc, l1: 12 * sc, w0: 6 * sc, w1: 10 * sc, sx: 1.4, sy: .7, a0: .5, a1: .7 });
  return { S, h };
}
const PL = { mid: [], main: [], fg: [] };
let HERO;
function addP(lay, wx, wy, gen, o = {}) { const pl = { lay, wx, wy, ...gen, sway: o.sway ?? .008, ph: rnd(0, 6), hero: o.hero }; if (!o.live) pl.spr = sprite(pl.S); PL[lay].push(pl); return pl; }
function buildPlants() {
  for (let x = -900; x < 3100; x += rnd(36, 70)) addP('mid', x, yMid(x) + 6, farTree(rnd(.7, 1.1)), { sway: .004 });
  for (const x of [120, 820, 1460, 2150, 2800, 3400]) addP('main', x + rnd(-60, 60), yMain(x) + 18, shadeTree(rnd(.85, 1.05)), { sway: .004 });
  ROWS.forEach(([off, sc], k) => {
    for (let x = -1000 + rnd(0, 60); x < 3800; x += (62 + 50 * sc) * rnd(.85, 1.15)) {
      const isHero = k === 3 && !HERO && x > 1580;
      const pl = addP('main', x, yMain(x) + off, coffeeShrub(sc * rnd(.9, 1.1), { cherries: isHero ? 0 : 0 }), { sway: .01, hero: isHero, live: isHero });
      if (isHero) HERO = pl;
    }
  });
  PL.main.sort((a, b) => a.wy - b.wy);
  for (const x of [700, 1500, 2350]) addP('fg', x, 1180, coffeeShrub(2.1), { sway: .006 });
}
const plantXY = (pl, t) => { const v = viewA(LAYS[pl.lay], t); return [v.a * pl.wx + v.ex, v.a * pl.wy + v.ey, v.a]; };
function revealTimes() {
  for (const lay in PL) for (const pl of PL[lay]) {
    pl.tp = 99;
    for (let t = 1.5; t < 9.6; t += 1 / 30) {
      const [x, y, a] = plantXY(pl, t), top = y - pl.h * a * .5;
      if (x < -150 || x > 1760) continue;
      if (Math.hypot(x - DSX, top - DSY) < Rs(t) * .9) { pl.tp = t; break; }
    }
  }
}
function drawPlant(pl, t) {
  const p = seg(t, pl.tp, pl.tp + .85); if (p <= 0) return;
  const [x, y, a] = plantXY(pl, t); if (x < -400 || x > 2300) return;
  const sk = p >= 1 ? pl.sway * (Math.sin(1.15 * t + pl.ph) + .4 * Math.sin(2.7 * t + 2 * pl.ph)) : 0;
  ctx.setTransform(a, 0, sk * a, a, x, y);
  if (p < 1 || !pl.spr) drawList(ctx, pl.S, p); else ctx.drawImage(pl.spr.cv, pl.spr.x0, pl.spr.y0);
}
function clipReveal(t) {
  const R = Rs(t); if (R > 2600) return false;
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) { const g = i / 64 * Math.PI * 2, r = R * wavyR(g, 3); i ? ctx.lineTo(DSX + Math.cos(g) * r, DSY + Math.sin(g) * r) : ctx.moveTo(DSX + Math.cos(g) * r, DSY + Math.sin(g) * r); }
  ctx.closePath(); ctx.clip(); return true;
}
function stainRings(t) {
  const R = Rs(t); if (R <= 0 || t > 4.9) return;
  const fa = 1 - ss(seg(t, 3.4, 4.8));
  for (const [k, f, a, w] of [[3, 1, .55, 7], [9, .78, .25, 4], [5, .56, .18, 3]]) {
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) { const g = i / 72 * Math.PI * 2, r = R * f * wavyR(g, k); i ? ctx.lineTo(DSX + Math.cos(g) * r, DSY + Math.sin(g) * r) : ctx.moveTo(DSX + Math.cos(g) * r, DSY + Math.sin(g) * r); }
    ctx.closePath(); ctx.lineWidth = w; ctx.strokeStyle = rgba(COF2, a * fa); ctx.stroke();
    ctx.lineWidth = w * 3; ctx.strokeStyle = rgba(COF2, a * fa * .18); ctx.stroke();
  }
}
let SUNB, DROP;
function drawLayer(name, t) {
  const L = LAYC[name], v = viewA(LAYS[name] ?? 0, t);
  ctx.setTransform(v.a, 0, 0, v.a, v.ex, v.ey); ctx.drawImage(L.cv, L.x0, L.y0);
}
function drawShotA(t) {
  if (t > 9.75) return;
  // the falling drop
  if (t < 1.5) {
    const p = seg(t, .35, 1.5); if (p <= 0) return;
    const y = lerp(-60, DSY, Math.pow(p, 1.8)), st = 1 + .5 * ei(p);
    ctx.setTransform(1, 0, 0, st, DSX, y); drawS(ctx, DROP, 1); ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }
  ctx.save();
  const clipped = clipReveal(t);
  drawLayer('sky', t);
  // the drop becomes the sun: dark coffee spreading, then paling to a dawn sun
  { const v = viewA(0, t), r = lerp(14, 72, eo(seg(t, 1.5, 2.9))), col = mixc(COF, SUN, ss(seg(t, 2.3, 4.3)));
    ctx.setTransform(v.a, 0, 0, v.a, v.ex, v.ey);
    fillBlob(ctx, SUNB, DSX, DSY, r * 1.04, r, col, .55); fillBlob(ctx, SUNB, DSX + 2, DSY - 1, r * .9, r * .88, col, .35);
    ctx.lineWidth = 3; ctx.strokeStyle = rgba(mixc(COFD, '#c89060', ss(seg(t, 2.3, 4.3))), .35); ctx.beginPath(); SUNB.forEach(([u, w], i) => i ? ctx.lineTo(DSX + u * r, DSY + w * r) : ctx.moveTo(DSX + u * r, DSY + w * r)); ctx.closePath(); ctx.stroke(); }
  drawLayer('far', t);
  drawLayer('mid', t); for (const pl of PL.mid) drawPlant(pl, t);
  drawLayer('main', t); for (const pl of PL.main) drawPlant(pl, t);
  for (const pl of PL.fg) drawPlant(pl, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  { const g = ctx.createLinearGradient(0, 850, 0, 1080); g.addColorStop(0, rgba(PAPER, 0)); g.addColorStop(.55, rgba(PAPER, .72)); g.addColorStop(1, rgba(PAPER, .9)); ctx.fillStyle = g; ctx.fillRect(0, 850, W, 230); }
  ctx.restore();
  if (clipped) stainRings(t);
  // title, top-left
  const ft = fade2(t, 3.4, 8.6, .3, .5);
  if (ft > 0) {
    ctx.save(); ctx.globalAlpha = ft; ctx.textBaseline = 'alphabetic';
    ctx.font = '500 58px "Cormorant Garamond"'; const w = ctx.measureText('Misty Ridge').width;
    ctx.save(); ctx.beginPath(); ctx.rect(110, 90, (w + 30) * eio(seg(t, 3.4, 4.6)), 90); ctx.clip();
    ctx.shadowColor = rgba(PAPER, .9); ctx.shadowBlur = 14; ctx.fillStyle = INK; ctx.fillText('Misty Ridge', 120, 160); ctx.restore();
    ctx.font = '400 17px "IBM Plex Mono"'; ctx.letterSpacing = '4px'; ctx.fillStyle = rgba(INK, .78 * ss(seg(t, 4.2, 5.0)));
    ctx.fillText('COFFEE FARM · 1,450 M', 123, 200); ctx.letterSpacing = '0px';
    withSeed(31, () => drawS(ctx, mk(qcurve(120, 222, 300, 220, -2, 10), 7, COF2, { prof: 'even', nb: 3, a: .7 }), seg(t, 4.4, 5.0)));
    ctx.restore();
  }
  // note on the hero shrub
  if (HERO && t > 5.8) {
    const f = 1 - ss(seg(t, 8.9, 9.3)); const [x, y, a] = plantXY(HERO, t); const tx = x + 30 * a, ty = y - HERO.h * a * .95;
    ctx.save(); ctx.globalAlpha = f; leader(tx + 120, ty - 150, tx + 8, ty - 6, seg(t, 5.8, 6.4), 22); hand('arabica', tx + 128, ty - 176, seg(t, 6.1, 7.0), { size: 50, w: 600 }); ctx.restore();
  }
  mist(t, 9.0, 9.7);
}

// ======================================================================
// SHOTS B + C (9.4–18.9): one tall sheet: the branch above, the basket below
// ======================================================================
const TILT = 760;
const tiltB = t => TILT * eio(seg(t, 14.8, 15.7));
const zB = t => 1.08 + .12 * eio(seg(t, 9.4, 14.8));
let BR, BLEAVES = [], CLUST = [], BASKET, HEAP = [], DROPS = [];
function buildBranch() {
  const pts = qcurve(-120, 720, 1760, 420, -110, 40);
  const st = mk(pts, 36, '#6b5444', { prof: 'trunk', nb: 7, a: .9, rough: .18 });
  BR = { S: [st, edgeOf(st, 1, 3, INK, .7), edgeOf(st, -1, 1.6, INK, .35)] };
  const at = f => pts[Math.round(f * (pts.length - 1))];
  const nodes = [.1, .23, .36, .49, .62, .75, .88];
  nodes.forEach((f, k) => {
    const [x, y] = at(f), L = 270 * (1 - .3 * f);
    for (const side of [-1, 1]) {
      const ang = -.18 + side * rnd(.75, 1.2) + (side > 0 ? .3 : -.1), Lf = L * rnd(.78, .95), ex = x + Math.cos(ang) * Lf, ey = y + Math.sin(ang) * Lf;
      const lf = mk(qcurve(x, y, ex, ey, side * rnd(24, 46), 14), rnd(100, 118) * (1 - .2 * f), pick(LEAF), { prof: 'leaf', nb: 8, a: .8, rough: .14 });
      BLEAVES.push({ k, S: [mk(qcurve(x + 6, y + 8, ex + 6, ey + 10, side * rnd(24, 46), 14), rnd(96, 110) * (1 - .2 * f), '#2f4a2a', { prof: 'leaf', nb: 4, a: .35, rough: .2 })] });
      const vein = mk(qcurve(x, y, ex, ey, side * rnd(20, 40) * .9, 12), 2.2, INK2, { prof: 'tip', nb: 0, a: .45 });
      const hi = mk(qcurve(lerp(x, ex, .2), lerp(y, ey, .2) - 8, lerp(x, ex, .75), lerp(y, ey, .75) - 6, side * 10, 8), 16, LEAFL, { prof: 'leaf', nb: 3, a: .45 });
      BLEAVES.push({ k, S: [lf, vein, hi] });
    }
    const n = 10 + Math.floor(rnd(0, 4));
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(6, 50), cx = x + Math.cos(a) * r * 1.25, cy = y + Math.sin(a) * r * .75 + 4;
      const pet = [], rot = rnd(0, 1.3), ps = rnd(1.15, 1.45);
      for (let j = 0; j < 5; j++) { const g = rot + j / 5 * Math.PI * 2; pet.push(mk(polar(0, 0, g, 24 * ps, rnd(-3, 3), 5), 13 * ps, '#f8f2e6', { prof: 'leaf', nb: 0, a: .96, rough: .2 })); pet.push(mk(polar(Math.cos(g) * 2, Math.sin(g) * 2 + 1.5, g, 24 * ps, rnd(-3, 3), 5), 14 * ps, '#bdb49c', { prof: 'leaf', nb: 0, a: .32, rough: .25 })); }
      CLUST.push({ x: cx, y: cy, k, pet, tb: 9.75 + (k / 6) * .35 + rnd(0, .3), fall: rnd(0, .5), dx: rnd(-60, 60), rot: rnd(-1, 1), tg: 12.0 + k * .08 + rnd(0, .35), tr: 13.7 + k * .08 + rnd(0, .35), rr: rnd(18, 23), B: blob(24, .06) });
    }
  });
  // basket (sheet coordinates, below the branch)
  const bx = 960, by = 1300, S = [];
  const bodyL = [[bx - 230, by - 80], [bx - 200, by + 60], [bx - 150, by + 120], [bx + 150, by + 120], [bx + 200, by + 60], [bx + 230, by - 80]];
  for (let r = 0; r < 8; r++) {
    const f = r / 7, y = by - 70 + f * 185, hw = lerp(228, 160, f * f);
    S.push(mk(qcurve(bx - hw, y, bx + hw, y + 2, 26 + f * 10, 22), 19, pick(['#b08850', '#9c7542', '#c09a5e']), { prof: 'even', nb: 6, a: .7, rough: .25 }));
  }
  for (let i = 0; i <= 10; i++) { const u = i / 10 - .5; S.push(mk(qcurve(bx + u * 450, by - 78, bx + u * 310, by + 118, 6, 10), 3, '#6b5134', { prof: 'even', nb: 0, a: .5 })); }
  const rim = []; for (let i = 0; i <= 40; i++) { const g = Math.PI + i / 40 * Math.PI; rim.push([bx + Math.cos(g) * 232, by - 82 + Math.sin(g) * 46]); }
  S.push(mk(rim, 16, '#8a6a40', { prof: 'even', nb: 6, a: .8 }));
  const rim2 = []; for (let i = 0; i <= 40; i++) { const g = i / 40 * Math.PI; rim2.push([bx - Math.cos(g) * 232, by - 82 + Math.sin(g) * 46]); }
  S.push(mk(rim2, 18, '#9c7542', { prof: 'even', nb: 6, a: .85 }));
  S.push(edgeOf(S[S.length - 1], 1, 2.4, INK, .55));
  BASKET = { S, bodyL, bx, by };
  // the heap of ripe cherries inside the rim: four layers, one per landing
  for (let l = 0; l < 5; l++) for (let i = 0; i < 16; i++) {
    const a = rnd(0, Math.PI * 2), r = Math.sqrt(rnd()) * (200 - l * 18);
    HEAP.push({ l, x: bx + Math.cos(a) * r, y: by - 84 + Math.sin(a) * r * .2 - l * 9, r: rnd(13, 17), B: blob(20, .07), c: pick([CHERRY, '#b8392a', '#cf4a30']) });
  }
  HEAP.sort((a, b) => a.y - b.y);
  // handfuls falling from the branch above: land on the beat
  [15.75, 16.5, 17.25, 18.0].forEach((land, i) => { for (let j = 0; j < 3; j++) DROPS.push({ land: land + j * .06, x: bx + rnd(-120, 120), x0: bx + rnd(-260, 260), r: rnd(14, 17), B: blob(20, .07), l: i + 1 }); ev(land, 'cherry', { n: i }); });
}
function cherry(x, y, r, B, col, a = 1) {
  fillBlob(ctx, B, x, y, r, r * .94, col, .82 * a);
  fillBlob(ctx, B, x + r * .18, y + r * .2, r * .78, r * .7, mixc(col, '#3a1810', .45), .35 * a);
  ctx.beginPath(); ctx.ellipse(x - r * .35, y - r * .38, r * .22, r * .14, -.6, 0, 7); ctx.fillStyle = rgba(PAPER, .75 * a); ctx.fill();
}
function drawShotBC(t) {
  if (t < 9.3 || t > 19.6) return;
  const z = zB(t), ty = tiltB(t);
  ctx.setTransform(z, 0, 0, z, 1000 * (1 - z), 520 * (1 - z) - ty);
  // branch, leaves
  drawList(ctx, BR.S, seg(t, 9.35, 10.05));
  for (const L of BLEAVES) drawList(ctx, L.S, seg(t, 9.55 + L.k * .11, 10.25 + L.k * .11));
  // blossom → fall → green cherries → red
  for (const C of CLUST) {
    const g = eo(seg(t, C.tg, C.tg + .8));
    if (g > 0) { const col = mixc(GREEN_CH, CHERRY, ss(seg(t, C.tr, C.tr + .9))); cherry(C.x, C.y, C.rr * (.3 + .7 * g), C.B, col, ss(seg(t, C.tg, C.tg + .3))); }
    const ob = eo(seg(t, C.tb, C.tb + .35)); if (ob <= 0) continue;
    const fl = seg(t, 11.6 + C.fall, 12.7 + C.fall); if (fl >= 1) continue;
    ctx.save(); ctx.translate(C.x + C.dx * ei(fl), C.y + 330 * ei(fl)); ctx.rotate(C.rot * fl * 3); ctx.scale(ob * (1 - .3 * fl), ob * (1 - .3 * fl));
    const al = 1 - ss(seg(fl, .4, 1));
    for (let i = 0; i < C.pet.length; i += 2) { drawS(ctx, C.pet[i + 1], 1, null, al); }
    for (let i = 0; i < C.pet.length; i += 2) { drawS(ctx, C.pet[i], 1, null, al); }
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fillStyle = rgba('#d6a94e', .85 * al); ctx.fill();
    ctx.restore();
  }
  // blossom note
  { const f = fade2(t, 10.3, 14.75, .2, .4); if (f > 0) { ctx.save(); ctx.globalAlpha = f; leader(1230, 210, 1090, 395, seg(t, 10.3, 10.9), -20); hand('coffee blossom · smells of jasmine', 1150, 180, seg(t, 10.55, 11.6), { size: 38 }); ctx.restore(); } }
  // basket and the harvest
  if (t > 15.0) {
    const BS = 1.3; ctx.translate(BASKET.bx, BASKET.by); ctx.scale(BS, BS); ctx.translate(-BASKET.bx, -BASKET.by);
    drawList(ctx, BASKET.S.slice(0, 8 + 11), seg(t, 15.05, 15.8));
    const nL = DROPS.filter(d => t >= d.land + .02 && d.j === undefined).length;
    const lv = 1 + [15.75, 16.5, 17.25, 18.0].filter(x => t >= x + .02).length;
    const hp = seg(t, 15.4, 15.8);
    for (const c of HEAP) if (c.l < lv && (c.l > 0 || hp > 0)) cherry(c.x, c.y, c.r, c.B, c.c, c.l ? 1 : hp);
    drawList(ctx, BASKET.S.slice(19), seg(t, 15.3, 15.9));
    for (const d of DROPS) {
      const p = seg(t, d.land - .55, d.land); if (p <= 0 || p >= 1) continue;
      const y = lerp(BASKET.by + (ty - 80 - BASKET.by) / BS, BASKET.by - 110 - d.l * 9, ei(p)), x = lerp(d.x0, d.x, p);
      cherry(x, y, d.r, d.B, CHERRY);
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ======================================================================
// SHOT D (18.75–21.4): a new sheet slides over: the drying bed
// ======================================================================
let BED, BEDCH = [], DSUN;
function buildBed() {
  const S = [], q = [[330, 560], [1590, 560], [1760, 770], [160, 770]];
  const quad = (u, v) => [lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), lerp(lerp(q[0][1], q[1][1], u), lerp(q[3][1], q[2][1], u), v)];
  for (const [x, y0, y1] of [[230, 770, 990], [1690, 770, 990], [420, 560, 720], [1500, 560, 720]]) S.push(mk(qcurve(x, y0, x + rnd(-4, 4), y1, 2, 8), 14, '#7a5c3e', { prof: 'even', nb: 4, a: .85 }));
  const top = []; for (let i = 0; i <= 8; i++) top.push(quad(i / 8, 0)); const front = []; for (let i = 0; i <= 8; i++) front.push(quad(i / 8, 1));
  S.push(mk(top, 12, '#8a6a46', { prof: 'even', nb: 5, a: .8 })); S.push(mk([quad(0, 0), quad(0, .5), quad(0, 1)], 12, '#8a6a46', { prof: 'even', nb: 5, a: .8 })); S.push(mk([quad(1, 0), quad(1, .5), quad(1, 1)], 12, '#8a6a46', { prof: 'even', nb: 5, a: .8 }));
  S.push(mk(front, 20, '#7a5c3e', { prof: 'even', nb: 6, a: .9 })); S.push(edgeOf(S[S.length - 1], 1, 2.4, INK, .6));
  for (let i = 1; i < 12; i++) S.push(mk([quad(i / 12, 0), quad(i / 12, 1)], 1.6, '#5c4a38', { prof: 'even', nb: 0, a: .3 }));
  for (let i = 1; i < 5; i++) S.push(mk([quad(0, i / 5), quad(1, i / 5)], 1.6, '#5c4a38', { prof: 'even', nb: 0, a: .3 }));
  BED = { S, quad, q, wash: [quad(0, 0), quad(.5, 0), quad(1, 0), quad(1, .5), quad(1, 1), quad(.5, 1), quad(0, 1), quad(0, .5)] };
  for (let i = 0; i < 700; i++) { const u = rnd(.03, .97), v = rnd(.06, .94), [x, y] = quad(u, v), sc = lerp(.8, 1.15, v); BEDCH.push({ x, y, s: mk(qcurve(x - 7 * sc, y, x + 7 * sc, y + rnd(-1.5, 1.5), 1.5, 3), rnd(15, 19) * sc, CHERRY, { prof: 'leaf', nb: 0, a: .88 }), c: pick([CHERRY, '#b5402a', '#c94f2e']), t0: 19.75 + u * .45 + rnd(0, .25) }); }
  DSUN = blob(30, .06);
}
function drawShotD(t, X) {
  ctx.setTransform(1, 0, 0, 1, X, 0);
  if (X > 0) { const g = ctx.createLinearGradient(-40, 0, 0, 0); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,.22)'); ctx.fillStyle = g; ctx.fillRect(-40, 0, 40, H); }
  ctx.drawImage(PAPER_IMG, 0, 0);
  const sp = eo(seg(t, 19.35, 19.95)); if (sp > 0) { fillBlob(ctx, DSUN, 1600, 220, 86 * sp, 84 * sp, SUN, .5); fillBlob(ctx, DSUN, 1603, 218, 74 * sp, 72 * sp, SUN, .3); }
  const dry = ss(seg(t, 20.2, 21.4));
  { const wp = ss(seg(t, 19.25, 19.8)); if (wp > 0) { ctx.beginPath(); BED.wash.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = rgba('#c9b089', .38 * wp); ctx.fill(); } }
  drawList(ctx, BED.S, seg(t, 19.2, 19.95));
  for (const c of BEDCH) { const p = seg(t, c.t0, c.t0 + .25); if (p > 0) drawS(ctx, c.s, p, mixc(c.c, '#7a3b22', dry * .8)); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ======================================================================
// SHOT E (21–30): the cup holds the hill
// ======================================================================
let CUP = {};
function ellipsePts(cx, cy, rx, ry, a0, a1, n = 40) { const P = []; for (let i = 0; i <= n; i++) { const g = lerp(a0, a1, i / n); P.push([cx + Math.cos(g) * rx, cy + Math.sin(g) * ry]); } return P; }
function buildCup() {
  const cx = 960, ry = 470;
  CUP.saucer = [mk(ellipsePts(cx, 790, 430, 96, Math.PI * 1.05, Math.PI * 1.95, 40), 10, '#cbbfa8', { prof: 'even', nb: 5, a: .5 }), mk(ellipsePts(cx, 792, 430, 96, Math.PI * .02, Math.PI * .98, 40), 14, '#b3a68e', { prof: 'even', nb: 6, a: .65 })];
  CUP.saucer.push(edgeOf(CUP.saucer[1], 1, 2.4, INK, .55));
  CUP.saucerB = blob(40, .015);
  const body = [];
  for (let i = 0; i <= 20; i++) { const f = i / 20; body.push([cx - lerp(250, 165, Math.pow(f, 1.6)), ry + f * 300]); }
  for (let i = 20; i >= 0; i--) { const f = i / 20; body.push([cx + lerp(250, 165, Math.pow(f, 1.6)), ry + f * 300]); }
  CUP.body = body;
  const left = body.slice(0, 21), right = body.slice(21).reverse();
  CUP.edges = [mk(left, 4, INK2, { prof: 'even', nb: 0, a: .7 }), mk(right, 5, INK2, { prof: 'even', nb: 0, a: .75 }), mk(ellipsePts(cx, ry + 300, 165, 26, Math.PI * .05, Math.PI * .95, 20), 4, INK2, { prof: 'even', nb: 0, a: .6 })];
  CUP.shade = [mk(qcurve(cx + 170, ry + 30, cx + 120, ry + 285, -20, 14), 90, '#c4b8a2', { prof: 'leaf', nb: 6, a: .45 }), mk(qcurve(cx - 230, ry + 40, cx - 170, ry + 280, 14, 12), 26, '#d6ccba', { prof: 'leaf', nb: 4, a: .35 })];
  const hd = qctrl(cx + 238, ry + 60, cx + 400, ry + 80, cx + 205, ry + 215, 20);
  CUP.handle = [mk(hd, 24, '#d3c7b2', { prof: 'even', nb: 5, a: .75 })]; CUP.handle.push(edgeOf(CUP.handle[0], 1, 3, INK2, .7), edgeOf(CUP.handle[0], -1, 2.2, INK2, .5));
  CUP.rim = [mk(ellipsePts(cx, ry, 250, 70, Math.PI, Math.PI * 2, 40), 4, INK2, { prof: 'even', nb: 0, a: .75 }), mk(ellipsePts(cx, ry, 250, 70, 0, Math.PI, 40), 7, '#cfc3ad', { prof: 'even', nb: 3, a: .7 }), mk(ellipsePts(cx, ry + 2, 250, 70, 0, Math.PI, 40), 3.5, INK2, { prof: 'even', nb: 0, a: .7 })];
  CUP.cof = blob(40, .012);
  // the hill reflected in the coffee
  const rid = []; for (let i = 0; i <= 24; i++) { const x = cx - 230 + i * 19; rid.push([x, ry - 4 - 22 * fbm(i * .35 + 2) + (i - 12) * .9]); }
  const rid2 = []; for (let i = 0; i <= 24; i++) { const x = cx - 230 + i * 19; rid2.push([x, ry + 18 - 14 * fbm(i * .4 + 7) - (i - 12) * 1.4]); }
  CUP.hills = [[{ P: rid, t0: 24.3 }, '#6e4a2e', .85], [{ P: rid2, t0: 24.7 }, '#3e2414', .9]];
  CUP.refl = [mk(rid, 5, '#5a3820', { prof: 'even', nb: 3, a: .6 }), mk(rid2, 5, '#2e1a0e', { prof: 'even', nb: 3, a: .6 })];
  for (let k = 0; k < 5; k++) { const y0 = ry + 34 + k * 5, row = []; for (let i = 0; i <= 12; i++) row.push([cx - 200 + i * 34, y0 + (i - 6) * 1.2 + rnd(-1, 1)]); CUP.refl.push(mk(row, 3, '#7a5a3a', { prof: 'even', nb: 0, a: .5 })); }
  CUP.rsun = blob(20, .06);
  CUP.under = mk(qcurve(790, 1000, 1130, 996, -3, 20), 9, COF2, { prof: 'even', nb: 4, a: .75 });
}
const zE = t => 1 + .6 * eio(seg(t, 23.8, 25.2)) - .68 * eio(seg(t, 25.7, 26.9));
const cE = t => [960, lerp(560, 480, ss(seg(t, 23.6, 25.0)))];
function drawShotE(t) {
  if (t < 22.3) return;
  const z = zE(t), [ox, oy] = cE(t); ctx.setTransform(z, 0, 0, z, ox * (1 - z), oy * (1 - z));
  const cx = 960, ry = 470;
  const sp = seg(t, 22.5, 23.0); if (sp > 0) { fillBlob(ctx, CUP.saucerB, cx, 792, 430 * eo(sp), 96 * eo(sp), '#e2d8c6', .55); }
  drawList(ctx, CUP.saucer, seg(t, 22.55, 23.1));
  const bp = ss(seg(t, 22.7, 23.3)); if (bp > 0) { ctx.beginPath(); CUP.body.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = rgba('#ece4d4', .85 * bp); ctx.fill(); }
  drawList(ctx, CUP.shade, seg(t, 22.8, 23.4));
  drawList(ctx, CUP.edges, seg(t, 22.75, 23.45));
  drawList(ctx, CUP.handle, seg(t, 23.1, 23.6));
  drawList(ctx, CUP.rim, seg(t, 23.2, 23.75));
  const cp = eo(seg(t, 23.4, 24.1));
  if (cp > 0) {
    fillBlob(ctx, CUP.cof, cx, ry + 6, 226 * cp, 56 * cp, COF, .9); fillBlob(ctx, CUP.cof, cx + 4, ry + 9, 210 * cp, 48 * cp, COFD, .35);
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, ry + 6, 222 * cp, 54 * cp, 0, 0, 7); ctx.clip();
    const rp = seg(t, 24.2, 25.6);
    const sr = eo(seg(t, 24.0, 24.6)); if (sr > 0) { fillBlob(ctx, CUP.rsun, cx + 40, ry - 22, 30 * sr, 12 * sr, '#c9925c', .45); fillBlob(ctx, CUP.rsun, cx + 40, ry - 22, 22 * sr, 8 * sr, SUN, .8); }
    { const hp = ss(seg(t, 24.0, 24.8)); if (hp > 0) { ctx.beginPath(); ctx.ellipse(cx, ry + 6, 222, 54, 0, 0, 7); ctx.fillStyle = rgba('#c2946a', .8 * hp); ctx.fill(); } }
    for (const [L, col, a] of CUP.hills) { const hp = ss(seg(t, L.t0, L.t0 + .8)); if (hp <= 0) continue; ctx.beginPath(); ctx.moveTo(L.P[0][0], ry + 80); L.P.forEach(([x, y]) => ctx.lineTo(x, y + (1 - hp) * 40)); ctx.lineTo(L.P[L.P.length - 1][0], ry + 80); ctx.closePath(); ctx.fillStyle = rgba(col, a * hp); ctx.fill(); }
    drawList(ctx, CUP.refl, rp);
    ctx.beginPath(); ctx.ellipse(cx - 120, ry - 8, 60, 6, -.05, 0, 7); ctx.fillStyle = rgba(PAPER, .28 * ss(seg(t, 24.6, 25.4))); ctx.fill();
    ctx.restore();
  }
  // steam
  for (let i = 0; i < 3; i++) {
    const p = seg(t, 24.1 + i * .35, 25.7 + i * .35); if (p <= 0) continue;
    const pts = []; for (let k = 0; k <= 18; k++) { const y = ry - 30 - k * 14; pts.push([cx - 80 + i * 80 + 16 * Math.sin(k * .45 + t * 1.6 + i * 2) * (k / 18 + .3), y]); }
    withSeed(400 + i, () => drawS(ctx, mk(pts, 10, '#b9ad9c', { prof: 'leaf', nb: 3, a: .32 }), p));
  }
  // end note: the last stroke stops mid-way
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  hand('Misty Ridge Farm · since 1987', 960, 955, seg(t, 26.85, 27.9), { size: 52, align: 'center', w: 600 });
  drawS(ctx, CUP.under, .62 * eo(seg(t, 28.6, 29.2)));
}

// ---------- subtitles ----------
function wrap(txt, maxW) {
  if (ctx.measureText(txt).width <= maxW) return [txt];
  const words = txt.split(' '); let best = null;
  for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width); if (!best || m < best[0]) best = [m, a, b]; }
  return [best[1], best[2]];
}
const subOn = (s, d, txt) => [s - .15, s - .15 + Math.max(1.8, d + .9, txt.length / 15 + 1.55)];  // reading time: letters ÷ 15 + 1.5 s
function drawSubs(t) {
  for (const [, s, d, en] of VO) {
    const [a, b] = subOn(s, d, en), f = fade2(t, a, b, .25, .35); if (f <= 0) continue;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = f; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = rgba(PAPER, 1); ctx.shadowBlur = 18; ctx.font = 'italic 500 38px "Cormorant Garamond"';
    const lines = wrap(en, 1400), y0 = lines.length > 1 ? 990 : 1020;
    for (let k = 0; k < 2; k++) { ctx.fillStyle = rgba(INK, .86); lines.forEach((ln, i) => ctx.fillText(ln, 960, y0 + i * 40)); }
    ctx.restore();
  }
}
// every text visible at t, for readcheck
window.TEXTS = t => {
  const out = [];
  if (t > 3.4 && t < 8.6) out.push({ id: 'title', text: 'Misty Ridge', x0: 120, y0: 110, x1: 420, y1: 170 }, { id: 'title2', text: 'COFFEE FARM · 1,450 M', x0: 120, y0: 182, x1: 470, y1: 206 });
  if (HERO && t > 6.1 && t < 9.1) { const [x, y, a] = plantXY(HERO, t); const tx = x + 30 * a + 128, ty = y - HERO.h * a * .95 - 176; out.push({ id: 'arabica', text: 'arabica', x0: tx, y0: ty - 25, x1: tx + 140, y1: ty + 25 }); }
  if (t > 10.55 && t < 14.75) out.push({ id: 'blossom', text: 'coffee blossom · smells of jasmine', x0: 1150, y0: 160, x1: 1700, y1: 200 });
  if (t > 26.85) out.push({ id: 'end', text: 'Misty Ridge Farm · since 1987', x0: 640, y0: 925, x1: 1280, y1: 985 });
  for (const [id, s, d, en] of VO) { const [a, b] = subOn(s, d, en); if (t > a && t < b) out.push({ id, text: en, x0: 300, y0: 990, x1: 1620, y1: 1030 }); }
  return out;
};

// ---------- main render ----------
let PAPER_IMG;
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
  ctx.drawImage(PAPER_IMG, 0, 0);
  const X = 1920 * (1 - eio(seg(t, 18.75, 19.5)));
  if (t < 19.5) { drawShotA(t); drawShotBC(t); }
  if (t > 18.75 && t < 22.5) drawShotD(t, X);
  if (t > 21.0) mist(t, 21.0, 22.4);
  drawShotE(t);
  drawSubs(t);
}
window.render = render;

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['500 58px "Cormorant Garamond"', 'italic 500 38px "Cormorant Garamond"', '500 34px Caveat', '600 50px Caveat', '400 17px "IBM Plex Mono"'].map(f => document.fonts.load(f, 'Aa')));
  withSeed(11, buildWashes);
  withSeed(12, buildPlants);
  HERO_H = (() => { const v = viewA(1, 8.3); return [v.a * HERO.wx + v.ex, v.a * (HERO.wy - HERO.h * .5) + v.ey]; })();
  revealTimes();
  withSeed(13, buildBranch); withSeed(14, buildBed); withSeed(15, buildCup);
  SUNB = withSeed(16, () => blob(36, .05));
  DROP = withSeed(17, () => mk([[0, 0], [0, -14], [0, -30], [0, -46]], 30, COF, { prof: 'tip', nb: 0, a: .92, rough: .05 }));
  // sound cues
  ev(.4, 'fall'); ev(1.5, 'drop'); ev(1.55, 'bloom'); ev(3.4, 'pencil', { d: 1.2 }); ev(6.1, 'pencil', { d: .9 });
  for (const [a, g] of [[2.2, .6], [3.0, .7], [3.9, .8], [5.0, .6], [6.2, .7], [7.4, .6], [8.4, .5]]) ev(a, 'brush', { g });
  ev(9.0, 'mist'); ev(9.35, 'brush', { g: .9 }); ev(9.75, 'burst'); ev(10.55, 'pencil', { d: 1.0 }); ev(11.6, 'petals'); ev(12.0, 'brush', { g: .5 }); ev(13.4, 'brush', { g: .4 });
  ev(14.8, 'tilt'); ev(15.05, 'creak'); ev(15.1, 'brush', { g: .7 }); ev(18.75, 'page'); ev(19.2, 'brush', { g: .8 }); ev(19.75, 'scatter');
  ev(21.0, 'mist'); ev(22.5, 'brush', { g: .9 }); ev(23.1, 'brush', { g: .6 }); ev(23.4, 'pour'); ev(24.2, 'brush', { g: .5 }); ev(23.8, 'push'); ev(25.7, 'pull'); ev(26.85, 'pencil', { d: 1.1 }); ev(28.6, 'brush', { g: .6, d: .6 });
  EV.sort((a, b) => a.t - b.t);
  window.READY = true;
})();

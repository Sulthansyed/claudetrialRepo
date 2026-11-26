// Storyboard: one story timeline, two style renderers (?style=wc | ff). Pure function of t.
const CV = document.getElementById('c'), X = CV.getContext('2d');
const VW = 1080, VH = 1920, DUR = 25;
const STYLE = new URLSearchParams(location.search).get('style') || 'wc';
const SERIF = '"Liberation Serif","DejaVu Serif",serif', SANS = 'Inter,sans-serif';

// ---------- story timeline (shared) ----------
function story(t) {
  const hook = t < 3, s = {};
  s.clock = t < 3 ? 8 + 4 * ss(seg(t, .4, 2.8)) : t < 21 ? 12 : 12 + 6 * ss(seg(t, 21, 23.4));
  s.clockBig = t < 3.4 ? 1 - ss(seg(t, 2.8, 3.4)) : 0;
  s.clockBigEnd = ss(seg(t, 21, 21.6)) * (1 - ss(seg(t, 23.6, 24.2)));
  let a = 1; // overall
  if (t < 3) a = 1 - ss(seg(t, .5, 2.8)); else if (t < 8) a = ss(seg(t, 3, 3.8)); else a = 1;
  s.pct = [a, a, a];
  s.split = ss(seg(t, 4.2, 5.8)) * (1 - ss(seg(t, 21.8, 22.4)) * 0);   // blob → bands
  if (t >= 8) {
    s.pct = [1 - eo(seg(t, 9, 11)), 1 - .45 * ss(seg(t, 10.8, 14)), 1 - .7 * ss(seg(t, 11, 14))];
    s.slide = ss(seg(t, 11, 14));
  } else s.slide = 0;
  if (t >= 14) { // climax: stays low, then payoff rebuilds
    s.pct = [.0, .5, .35];
    if (t >= 21) { const r = ss(seg(t, 21, 23.2)); s.pct = [lerp(0, .95, r), lerp(.5, .92, r), lerp(.35, .9, r)]; s.slide = 0; }
  }
  s.scale = 1 - .52 * ss(seg(t, 14, 14.7)) + .52 * ss(seg(t, 21, 21.8));
  s.cy = lerp(780, 470, ss(seg(t, 14, 14.7)) - ss(seg(t, 21, 21.8)));
  s.bottle = 1 - ss(seg(t, 14, 14.6)) + ss(seg(t, 21, 21.8));  // hidden during fixes
  s.bottle = clamp(s.bottle) * (1 - ss(seg(t, 23.4, 24)));
  s.sun = ss(seg(t, 8.2, 9)) * (1 - ss(seg(t, 14, 14.6)));
  s.skin = ss(seg(t, 9.5, 10.5)) * (1 - ss(seg(t, 14, 14.6)));
  s.fix = [0, 1, 2].map(i => ss(seg(t, 14.5 + i * 2.3, 15.2 + i * 2.3)) * (1 - ss(seg(t, 21, 21.5))));
  s.hookText = ss(seg(t, 0.1, .6)) * (1 - ss(seg(t, 2.8, 3.2)));
  s.endCard = ss(seg(t, 23.4, 24.2));
  s.labels = ss(seg(t, 5.8, 6.6)) * (1 - ss(seg(t, 14, 14.4)));
  s.tag = t < 3 ? 'WHY?' : '';
  return s;
}
const CAPS = [[.3, 2.9, 'RM300 perfume… gone by lunch?'], [3.3, 7.8, 'Every perfume has three layers: top, heart and base.'],
  [8.3, 13.8, 'In Malaysian heat, the top notes burn off fast. And dry skin? Nothing to hold on to.'],
  [14.2, 20.8, 'Fix it: moisturise first. Spray pulse points and your clothes. And never rub your wrists.'],
  [21.2, 24.6, 'Now it lasts till evening. Comment your perfume, I’ll tell you if it lasts.']];

// ---------- shared geometry ----------
const CX = 540;
function bottlePolys(cx, cy, k) { // [ [x,y]… ] closed polylines: body, neck, cap
  const r = (x0, y0, x1, y1, c) => { const o = []; const q = (a, b, s, e) => { for (let i = 0; i <= 6; i++) { const t = s + (e - s) * i / 6; o.push([a + c * Math.cos(t), b + c * Math.sin(t)]); } };
    q(x1 - c, y0 + c, -Math.PI / 2, 0); q(x1 - c, y1 - c, 0, Math.PI / 2); q(x0 + c, y1 - c, Math.PI / 2, Math.PI); q(x0 + c, y0 + c, Math.PI, Math.PI * 1.5); o.push(o[0]); return o; };
  const S = p => p.map(([x, y]) => [cx + x * k, cy + y * k]);
  return { body: S(r(-100, -40, 100, 150, 30)), neck: S(r(-28, -78, 28, -38, 6)), cap: S(r(-44, -150, 44, -82, 14)), label: S(r(-62, 20, 62, 100, 8)) };
}
function ptsOnPath(pl, step) { const o = []; let carry = 0; for (let i = 0; i < pl.length - 1; i++) { const [a, b] = pl[i], [c, d] = pl[i + 1], L = Math.hypot(c - a, d - b); let s = carry; while (s < L) { o.push([a + (c - a) * s / L, b + (d - b) * s / L]); s += step; } carry = s - L; } return o; }
function wrapText(c, text, maxW) { const w = text.split(' '), lines = []; let cur = ''; for (const x of w) { const n = cur ? cur + ' ' + x : x; if (c.measureText(n).width > maxW && cur) { lines.push(cur); cur = x; } else cur = n; } lines.push(cur); return lines; }
function captionAt(t) { for (const [a, b, s] of CAPS) if (t >= a && t <= b) return [s, Math.min(1, (t - a) / .25, (b - t) / .25)]; return null; }
function iconStroke(c, kind, x, y, k, col, lw) {
  c.save(); c.translate(x, y); c.scale(k, k); c.strokeStyle = col; c.lineWidth = lw / k; c.lineCap = c.lineJoin = 'round'; c.beginPath();
  if (kind === 0) { c.roundRect(-34, -14, 68, 46, 10); c.moveTo(-40, -14); c.lineTo(40, -14); c.moveTo(-44, -30); c.roundRect(-40, -34, 80, 20, 6); c.moveTo(-14, 6); c.bezierCurveTo(-4, -2, 4, 14, 14, 6); } // jar
  else if (kind === 1) { c.moveTo(-34, -30); c.lineTo(-14, -38); c.quadraticCurveTo(0, -24, 14, -38); c.lineTo(34, -30); c.lineTo(44, -4); c.lineTo(28, 2); c.lineTo(28, 40); c.lineTo(-28, 40); c.lineTo(-28, 2); c.lineTo(-44, -4); c.closePath(); c.moveTo(6, -14); c.arc(0, -14, 6, 0, 7); } // shirt + pulse dot
  else { c.roundRect(-40, -8, 80, 26, 13); c.moveTo(-26, -26); c.lineTo(-6, -40); c.moveTo(-6, -26); c.lineTo(14, -40); c.moveTo(14, -26); c.lineTo(34, -40); c.moveTo(-46, -46); c.lineTo(46, 30); c.moveTo(46, -46); c.lineTo(-46, 30); } // wrist, rub arrows, X
  c.stroke(); c.restore();
}
function drawClock(c, x, y, r, h, col, face, hand, lw) {
  c.save(); c.translate(x, y); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = face; c.fill(); c.lineWidth = lw; c.strokeStyle = col; c.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(Math.sin(a) * r * .82, -Math.cos(a) * r * .82); c.lineTo(Math.sin(a) * r * .92, -Math.cos(a) * r * .92); c.lineWidth = lw * .6; c.stroke(); }
  const ha = (h % 12) / 12 * Math.PI * 2, ma = h * Math.PI * 2; c.lineCap = 'round'; c.strokeStyle = hand;
  c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ha) * r * .5, -Math.cos(ha) * r * .5); c.stroke();
  c.lineWidth = lw; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ma) * r * .75, -Math.cos(ma) * r * .75); c.stroke(); c.restore();
}
const hourLabel = h => { const hh = Math.floor(h), m = hh % 12 || 12; return m + (hh < 12 || hh === 24 ? ' AM' : ' PM'); };

// cloud particles: layer index by v, blob→band blend. Shared model, per-style draw.
const NP = 1800, PT = []; withSeed(7, () => { for (let i = 0; i < NP; i++) PT.push({ u: rnd(), v: rnd(), h: rnd(), r: rnd(), ph: rnd(0, 6.28), z: rnd() }); });
function cloudPos(p, st, t) {
  const L = Math.min(2, Math.floor(p.v * 3)), vv = p.v * 3 - L; // vv in layer
  // blob: elliptical, v maps down the ellipse
  const ang = p.u * 6.283 * 3.1 + p.v * 9, rad = Math.sqrt(p.z) * .5, bx = Math.cos(ang) * rad * 700, by = (p.v - .5) * 520 + Math.sin(ang) * rad * 90;
  // bands: three stacked wide bars
  const gap = 70 * st.split, bY = (L - 1) * (150 + gap) + (vv - .5) * 130, bX = (p.u - .5) * 640 * (1 - .1 * L);
  const k = st.split;
  let x = lerp(bx, bX, k), y = lerp(by, bY, k);
  const slide = L > 0 ? st.slide * (240 + 220 * p.h) * (L === 2 ? 1.25 : .8) : 0;
  x += slide + Math.sin(t * .9 + p.ph) * 14; y += Math.cos(t * 1.1 + p.ph) * 10 + (L === 0 ? -st.slide * 0 : 0) + (L > 0 ? st.slide * 70 * p.h : 0);
  return [CX + x * st.scale, st.cy + y * st.scale, L];
}

// =========================================================
// Style A — Watercolor Brush: warm paper, translucent washes, ink edges, hand notes, neon as bright "glow ink"
// =========================================================
const PAPERC = '#f1e9da', PINK = '#ff2d8a', TEAL = '#10c6c0';
let paperSprite;
function paper() {
  if (paperSprite) return paperSprite; const c = document.createElement('canvas'); c.width = VW; c.height = VH; const g = c.getContext('2d');
  g.fillStyle = PAPERC; g.fillRect(0, 0, VW, VH); withSeed(3, () => {
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${200 + rnd(0, 30) | 0},${180 + rnd(0, 30) | 0},${150 + rnd(0, 30) | 0},${rnd(.012, .028)})`; g.beginPath(); g.ellipse(rnd(0, VW), rnd(0, VH), rnd(60, 260), rnd(60, 260), 0, 0, 7); g.fill(); }
    for (let i = 0; i < 2600; i++) { g.strokeStyle = `rgba(120,100,80,${rnd(.03, .08)})`; g.lineWidth = rnd(.4, 1.1); const x = rnd(0, VW), y = rnd(0, VH); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rnd(-8, 8), y + rnd(-8, 8), x + rnd(-18, 18), y + rnd(-18, 18)); g.stroke(); }
  });
  const v = g.createRadialGradient(VW / 2, VH / 2, 500, VW / 2, VH / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,60,30,.07)'); g.fillStyle = v; g.fillRect(0, 0, VW, VH);
  return paperSprite = c;
}
function wash(c, poly, col, a) { for (let pass = 0; pass < 3; pass++) withSeed(100 + pass, () => { c.beginPath(); poly.forEach(([x, y], i) => { const jx = x + rnd(-4, 4), jy = y + rnd(-4, 4); i ? c.lineTo(jx, jy) : c.moveTo(jx, jy); }); c.closePath(); c.fillStyle = rgba(col, a / 3 * 1.3); c.fill(); }); }
function neonA(c, text, x, y, size, col, a) {
  c.save(); c.globalAlpha = a; c.font = `800 ${size}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = size * .22; c.strokeStyle = 'rgba(241,233,218,.55)'; c.lineJoin = 'round'; c.strokeText(text, x, y);   // paper halo keeps it readable
  c.shadowColor = col; c.shadowBlur = size * .55; c.fillStyle = col; c.fillText(text, x, y); c.shadowBlur = size * .2; c.fillText(text, x, y); c.shadowBlur = 0; c.restore();
}
function noteA(c, text, x, y, size, a, align = 'center', col = INK) { c.save(); c.globalAlpha = a; c.font = `italic ${size}px ${SERIF}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(text, x, y); c.restore(); }
function renderA(t) {
  const s = story(t), c = X; c.drawImage(paper(), 0, 0);
  // cloud as translucent watercolour dabs
  const layCol = ['#e8c35a', '#e58a8a', '#8a6fb0'], pc = 1;
  const arr = PT.map(p => [p, ...cloudPos(p, s, t)]);
  for (const [p, x, y, L] of arr) { const al = clamp((s.pct[L] - p.h) * 6); if (al <= 0) continue; const r = (22 + 34 * p.r) * s.scale; c.fillStyle = rgba(layCol[L], .07 * al * 1.0); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); if (p.r > .6) { c.fillStyle = rgba(layCol[L], .12 * al); c.beginPath(); c.arc(x, y, r * .45, 0, 7); c.fill(); } }
  // layer labels (hand notes + leader)
  const names = ['TOP', 'HEART', 'BASE'];
  if (s.labels > 0 && t < 14.4) for (let L = 0; L < 3; L++) { const gap = 70 * s.split, yy = s.cy + (L - 1) * (150 + gap) * s.scale; const a = s.labels * (L === 0 ? clamp(s.pct[0] + .25) : 1); c.save(); c.globalAlpha = a; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(190, yy); c.lineTo(230, yy); c.stroke(); c.restore(); noteA(c, names[L], 40, yy, 40, a, 'left'); }
  // sun
  if (s.sun > 0) { const sx = 830, sy = 330 + (1 - s.sun) * -80; c.save(); c.globalAlpha = s.sun; const g = c.createRadialGradient(sx, sy, 20, sx, sy, 190); g.addColorStop(0, 'rgba(255,160,40,.5)'); g.addColorStop(1, 'rgba(255,160,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 190, 0, 7); c.fill();
    wash(c, Array.from({ length: 24 }, (_, i) => [sx + Math.cos(i / 24 * 6.283) * 78, sy + Math.sin(i / 24 * 6.283) * 78]), '#f0902a', .9);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + t * .15; c.strokeStyle = rgba('#e0761a', .75); c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx + Math.cos(a) * 102, sy + Math.sin(a) * 102); c.lineTo(sx + Math.cos(a) * (136 + 12 * Math.sin(t * 3 + i)), sy + Math.sin(a) * (136 + 12 * Math.sin(t * 3 + i))); c.stroke(); }
    c.restore(); neonA(c, '32°C', sx, sy + 2, 62, '#ff7a1a', s.sun); }
  // dry skin strip
  if (s.skin > 0) { c.save(); c.globalAlpha = s.skin; const y0 = 1130; wash(c, [[90, y0], [990, y0 - 6], [990, y0 + 150], [90, y0 + 156]], '#d9b48c', .85); withSeed(9, () => { c.strokeStyle = rgba(INK2, .5); c.lineWidth = 1.6; for (let i = 0; i < 70; i++) { const x = rnd(110, 970), y = rnd(y0 + 8, y0 + 140); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rnd(-26, 26), y + rnd(-14, 14)); c.lineTo(x + rnd(-26, 26), y + rnd(-14, 24)); c.stroke(); } }); c.restore(); noteA(c, 'dry skin · nothing to hold on to', CX, y0 + 190, 30, s.skin * .9); }
  // bottle
  if (s.bottle > 0) { const by = s.skin > 0 ? 1010 : 1195, B = bottlePolys(CX, by, .95); c.save(); c.globalAlpha = s.bottle; wash(c, B.body, '#e7a7b6', .8); wash(c, B.cap, '#c9a35a', .9); wash(c, B.neck, '#cfc4b0', .7); wash(c, B.label, '#f6efe0', .9);
    for (const k of ['body', 'neck', 'cap', 'label']) c.restore(), c.save(), (c.globalAlpha = s.bottle), drawS(c, mk(B[k], k === 'label' ? 3 : 6, INK, { prof: 'even', nb: 0, a: .85, rough: .3 }), 1);
    c.restore(); }
  // clock
  const h = s.clock; const big = Math.max(s.clockBig, s.clockBigEnd);
  { const r = lerp(58, 125, big), x = lerp(150, CX, big), y = lerp(205, 640, big); const hasChip = t > 3.2 && t < 24.4 || big > 0; if (t < 3.4 || hasChip) { drawClock(c, x, y, r, h, INK, rgba('#fbf6ea', .9), INK, 3 + 3 * big);
    noteA(c, hourLabel(h) + (t < 3.4 ? '' : ''), x, y + r + 30, 26 + 22 * big, 1, 'center'); if (big > .2 || t > 3.4) noteA(c, 'scent ' + Math.round(100 * (s.pct[0] + s.pct[1] + s.pct[2]) / 3) + '%', x, y + r + 70 + 20 * big, 24 + 12 * big, big > .2 ? .9 : .75, 'center', t > 21 ? '#1c8f6a' : INK); } }
  // hook text
  if (s.hookText > 0) { neonA(c, 'RM300 PERFUME…', CX, 330, 78, PINK, s.hookText); neonA(c, 'GONE BY LUNCH?', CX, 430, 92, TEAL, s.hookText); }
  // fix cards
  const fx = [['① Moisturise first', 'a thin layer of lotion grips the scent'], ['② Pulse points + clothes', 'wrists, neck, inner elbows, a shirt'], ['③ Don’t rub your wrists', 'rubbing crushes the top notes']];
  for (let i = 0; i < 3; i++) { const f = s.fix[i]; if (f <= 0) continue; const y = 760 + i * 250, sc = .85 + .15 * back(f, 2); c.save(); c.translate(CX, y); c.scale(sc, sc); c.globalAlpha = clamp(f * 1.6);
    wash(c, [[-440, -95], [440, -100], [445, 95], [-435, 100]].map(([a, b]) => [a, b]), ['#bfe0d4', '#f4c9cf', '#cfd3ee'][i], .75);
    c.restore(); c.save(); c.translate(CX, y); c.scale(sc, sc); c.globalAlpha = clamp(f * 1.6); iconStroke(c, i, -330, 0, 1.55, INK, 4.5);
    c.font = `italic 600 46px ${SERIF}`; c.fillStyle = INK; c.textBaseline = 'middle'; c.fillText(fx[i][0], -230, -22); c.font = `italic 28px ${SERIF}`; c.fillStyle = INK2; c.fillText(fx[i][1], -228, 34); c.restore(); }
  if (s.endCard > 0) { neonA(c, 'Comment your', CX, 1235, 64, PINK, s.endCard); neonA(c, 'perfume 👇', CX, 1325, 84, TEAL, s.endCard); }
  const cap = captionAt(t); if (cap) { c.save(); c.globalAlpha = cap[1]; c.font = `italic 36px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const L = wrapText(c, cap[0], 820); L.forEach((l, i) => { const y = 1440 + (i - (L.length - 1) / 2) * 46; c.lineWidth = 9; c.strokeStyle = 'rgba(241,233,218,.9)'; c.lineJoin = 'round'; c.strokeText(l, CX, y); c.fillStyle = 'rgba(43,37,32,.88)'; c.fillText(l, CX, y); }); c.restore(); }
}

// =========================================================
// Style B — Firefly Pointillism: soft warm points of light on black; neon = brightest points
// =========================================================
const GLOW = {}; function glowSprite(col, r) { const k = col + r; if (GLOW[k]) return GLOW[k]; const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r); const [R, G, B] = hex2rgb(col); gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(.18, `rgba(${R},${G},${B},.95)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return GLOW[k] = c; }
function dot(c, x, y, r, col, a) { if (a <= 0) return; c.globalAlpha = a; c.drawImage(glowSprite(col, 32), x - r, y - r, r * 2, r * 2); }
function neonB(c, text, x, y, size, col, a) { c.save(); c.globalAlpha = a; c.font = `700 ${size}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = col; c.shadowBlur = size * .9; c.fillStyle = col; c.fillText(text, x, y); c.shadowBlur = size * .35; c.fillText(text, x, y); c.shadowBlur = 0; c.fillStyle = '#fff'; c.globalAlpha = a * .8; c.fillText(text, x, y); c.restore(); }
function noteB(c, text, x, y, size, a, align = 'center', col = '#f0e2b8') { c.save(); c.globalAlpha = a; c.font = `italic ${size}px ${SERIF}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(text, x, y); c.restore(); }
function renderB(t) {
  const s = story(t), c = X; const bg = c.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#050708'); bg.addColorStop(1, '#0a0709'); c.fillStyle = bg; c.fillRect(0, 0, VW, VH);
  c.globalCompositeOperation = 'lighter';
  const cols = ['#f5e0a0', '#f0a35e', '#c27ab8'];
  withSeed(55, () => { for (let i = 0; i < 70; i++) dot(c, rnd(0, VW), rnd(0, VH), rnd(4, 14), '#8a9a80', .15 + .1 * Math.sin(t * 1.5 + i)); }); // ambient fireflies
  for (const p of PT) { const [x, y, L] = cloudPos(p, s, t); const al = clamp((s.pct[L] - p.h) * 6); if (al > 0) dot(c, x, y, (8 + 20 * p.r * p.r) * s.scale, cols[L], al * (.45 + .4 * p.z)); }
  // bottle: dotted outline
  if (s.bottle > 0) { const by = s.skin > 0 ? 1010 : 1195, B = bottlePolys(CX, by, .95); let n = 0; for (const k of ['body', 'neck', 'cap', 'label']) for (const [x, y] of ptsOnPath(B[k], 9)) { n++; dot(c, x, y, k === 'label' ? 7 : 11, k === 'cap' ? '#f5e0a0' : '#ffd9c0', s.bottle * (.65 + .3 * Math.sin(t * 2 + n))); }
    for (let i = 0; i < 160; i++) { const p = PT[i], x = CX + (p.u - .5) * 170, y = by + (p.v - .1) * 170; dot(c, x, y, 6, '#ffb89a', s.bottle * .22); } }
  // sun
  if (s.sun > 0) { const sx = 830, sy = 330 - (1 - s.sun) * 80; for (let i = 0; i < 120; i++) { const a = i / 120 * 6.283, rr = 70 + (i % 3) * 8; dot(c, sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, 10, '#ffb347', s.sun * .9); } for (let i = 0; i < 34; i++) { const a = i / 34 * 6.283 + t * .2, rr = 105 + 30 * Math.abs(Math.sin(t * 2 + i)); dot(c, sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, 9, '#ff8a3a', s.sun * .8); } dot(c, sx, sy, 190, '#ff9a3a', s.sun * .35); }
  // skin: dotted horizon with cracks
  if (s.skin > 0) { const y0 = 1130; withSeed(11, () => { for (let i = 0; i < 260; i++) dot(c, rnd(90, 990), y0 + rnd(0, 150), rnd(5, 10), '#b98c6a', s.skin * rnd(.2, .55)); for (let i = 0; i < 30; i++) { const x = rnd(110, 970), y = rnd(y0 + 10, y0 + 140); for (let k = 0; k < 5; k++) dot(c, x + k * 8, y + Math.sin(k * 2 + i) * 9, 5, '#e9c9a6', s.skin * .7); } }); }
  // clock (dots on a ring)
  { const big = Math.max(s.clockBig, s.clockBigEnd), r = lerp(58, 125, big), x = lerp(150, CX, big), y = lerp(205, 640, big); if (t < 3.4 || t > 3.2 && t < 24.4) { for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; dot(c, x + Math.sin(a) * r, y - Math.cos(a) * r, i % 4 === 0 ? 11 : 6, '#f5e0a0', .9); } const ha = (s.clock % 12) / 12 * 6.283, ma = s.clock * 6.283; for (let k = 1; k <= 6; k++) { dot(c, x + Math.sin(ha) * r * .5 * k / 6, y - Math.cos(ha) * r * .5 * k / 6, 11, '#fff2c8', .95); dot(c, x + Math.sin(ma) * r * .78 * k / 6, y - Math.cos(ma) * r * .78 * k / 6, 8, '#ffc9a0', .9); } } }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  { const big = Math.max(s.clockBig, s.clockBigEnd), r = lerp(58, 125, big), x = lerp(150, CX, big), y = lerp(205, 640, big); if (t < 3.4 || t > 3.2 && t < 24.4) { noteB(c, hourLabel(s.clock), x, y + r + 34, 26 + 22 * big, 1); if (big > .2 || t > 3.4) noteB(c, 'scent ' + Math.round(100 * (s.pct[0] + s.pct[1] + s.pct[2]) / 3) + '%', x, y + r + 70 + 20 * big, 24 + 12 * big, .85, 'center', t > 21 ? '#bfffd8' : '#f0e2b8'); } }
  if (s.labels > 0) { const names = ['TOP', 'HEART', 'BASE']; for (let L = 0; L < 3; L++) { const gap = 70 * s.split, yy = s.cy + (L - 1) * (150 + gap) * s.scale; const a = s.labels * (L === 0 ? clamp(s.pct[0] + .25) : 1); noteB(c, names[L], 40, yy, 40, a, 'left', cols[L]); } }
  if (s.hookText > 0) { neonB(c, 'RM300 PERFUME…', CX, 330, 74, '#ff4fa3', s.hookText); neonB(c, 'GONE BY LUNCH?', CX, 430, 88, '#3be8e0', s.hookText); }
  if (s.sun > .5) neonB(c, '32°C', 830, 335, 56, '#ffb347', s.sun);
  const fx = [['① Moisturise first', 'a thin layer of lotion grips the scent'], ['② Pulse points + clothes', 'wrists, neck, inner elbows, a shirt'], ['③ Don’t rub your wrists', 'rubbing crushes the top notes']], fc = ['#3be8e0', '#ff4fa3', '#ffd36a'];
  for (let i = 0; i < 3; i++) { const f = s.fix[i]; if (f <= 0) continue; const y = 760 + i * 250, sc = .85 + .15 * back(f, 2); c.save(); c.translate(CX, y); c.scale(sc, sc); c.globalAlpha = clamp(f * 1.6);
    c.shadowColor = fc[i]; c.shadowBlur = 24; c.strokeStyle = fc[i]; c.lineWidth = 3; c.beginPath(); c.roundRect(-440, -95, 880, 190, 40); c.stroke(); c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.04)'; c.fill();
    c.shadowColor = fc[i]; c.shadowBlur = 16; iconStroke(c, i, -330, 0, 1.55, fc[i], 4.5); c.shadowBlur = 0;
    c.font = `italic 600 46px ${SERIF}`; c.fillStyle = '#fbf3da'; c.textBaseline = 'middle'; c.fillText(fx[i][0], -230, -22); c.font = `italic 28px ${SERIF}`; c.fillStyle = '#d6c79e'; c.fillText(fx[i][1], -228, 34); c.restore(); }
  if (s.endCard > 0) { neonB(c, 'Comment your', CX, 1235, 62, '#ff4fa3', s.endCard); neonB(c, 'perfume 👇', CX, 1325, 82, '#3be8e0', s.endCard); }
  const cap = captionAt(t); if (cap) { c.save(); c.globalAlpha = cap[1]; c.font = `italic 36px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const L = wrapText(c, cap[0], 820); L.forEach((l, i) => { const y = 1440 + (i - (L.length - 1) / 2) * 46; c.fillStyle = 'rgba(0,0,0,.55)'; c.shadowColor = 'rgba(0,0,0,.9)'; c.shadowBlur = 14; c.fillStyle = 'rgba(250,240,215,.95)'; c.fillText(l, CX, y); }); c.restore(); }
}
const back = (t, s = 1.7) => { t = clamp(t); const u = t - 1; return u * u * ((s + 1) * u + s) + 1; };
window.DUR = DUR;
window.render = t => { X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; withSeed(1, () => STYLE === 'ff' ? renderB(t) : renderA(t)); };
document.fonts.ready.then(() => { window.READY = true; });

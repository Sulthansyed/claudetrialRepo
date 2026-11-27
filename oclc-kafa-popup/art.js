// All cut-paper art for "KAFA Satu Klik": characters (redrawn per pose), props, page art.
// No Arabic, Jawi or Quran text anywhere: books are plain covers, pages blank.
import { mulberry, TAU, clamp, lerp } from './lib.js';
import { cv, finishCut, sh, blob, smoothClosed, smoothOpen, crescent, INK, rr } from './paper.js';

export const LW = 9, LW2 = 5;
export const PPM = 5200;            // px per metre for static props

export function cut(wm, hm, draw, o = {}) {
  const pad = o.pad ?? 30, w = Math.ceil(wm * PPM) + pad * 2, h = Math.ceil(hm * PPM) + pad * 2;
  const c = cv(w, h), x = c.getContext('2d'); x.translate(pad, pad);
  draw(x, w - pad * 2, h - pad * 2);
  const out = o.raw ? c : finishCut(c, o.border ?? 14, o);
  return { c: out, w: w / PPM, h: h / PPM, ax: o.ax ?? .5, ay: o.ay ?? 1 - pad / h, pad };
}

// ---------- shared face parts ----------
function eye(x, ex, ey, p, s = 1) {
  const { blink = 0, eyes = 'open', look = [0, 0] } = p;
  x.lineCap = 'round'; x.strokeStyle = INK;
  if (eyes === 'happy') { x.beginPath(); x.moveTo(ex - 22 * s, ey + 6 * s); x.quadraticCurveTo(ex, ey - 30 * s, ex + 22 * s, ey + 6 * s); x.lineWidth = 9 * s; x.stroke(); return; }
  if (eyes === 'closed' || blink > .8) { x.beginPath(); x.moveTo(ex - 20 * s, ey + 2 * s); x.quadraticCurveTo(ex, ey + 14 * s, ex + 20 * s, ey + 2 * s); x.lineWidth = 8 * s; x.stroke(); return; }
  const big = eyes === 'wide' ? 1.2 : 1, ry = 30 * s * big * (1 - blink * .85), rx = 17 * s * big;
  const cx = ex + look[0] * 7 * s, cy = ey + look[1] * 8 * s;
  x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fillStyle = INK; x.fill();
  if (ry > 10 * s) { x.beginPath(); x.ellipse(cx - 5 * s, cy - ry * .4, 6 * s * big, 9 * s * big, -.2, 0, TAU); x.fillStyle = '#fff'; x.fill(); }
}
function brows(x, cx, cy, gap, kind, s = 1) {
  x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 7 * s;
  for (const side of [-1, 1]) {
    const ox = cx + side * gap, inner = ox - side * 20 * s, outer = ox + side * 20 * s;
    x.beginPath();
    if (kind === 'worried') { x.moveTo(outer, cy + 6 * s); x.quadraticCurveTo(ox, cy, inner, cy - 12 * s); }
    else if (kind === 'up') { x.moveTo(outer, cy + 2 * s); x.quadraticCurveTo(ox, cy - 14 * s, inner, cy - 2 * s); }
    else { x.moveTo(outer, cy + 2 * s); x.quadraticCurveTo(ox, cy - 6 * s, inner, cy + 1 * s); }
    x.stroke();
  }
}
function mouth(x, mx, my, kind, s = 1, open = 0) {
  x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 8 * s;
  if (kind === 'smile') { x.beginPath(); x.moveTo(mx - 26 * s, my - 4 * s); x.quadraticCurveTo(mx, my + 24 * s, mx + 26 * s, my - 4 * s); x.stroke(); }
  else if (kind === 'worried') { x.beginPath(); x.moveTo(mx - 20 * s, my + 6 * s); x.quadraticCurveTo(mx - 8 * s, my - 4 * s, mx, my + 2 * s); x.quadraticCurveTo(mx + 8 * s, my + 8 * s, mx + 20 * s, my - 2 * s); x.lineWidth = 6.5 * s; x.stroke(); }
  else if (kind === 'frown') { x.beginPath(); x.moveTo(mx - 24 * s, my + 12 * s); x.quadraticCurveTo(mx, my - 12 * s, mx + 24 * s, my + 12 * s); x.lineWidth = 7.5 * s; x.stroke(); }
  else if (kind === 'flat') { x.beginPath(); x.moveTo(mx - 18 * s, my + 2 * s); x.lineTo(mx + 18 * s, my + 2 * s); x.lineWidth = 6.5 * s; x.stroke(); }
  else if (kind === 'o') { x.beginPath(); x.ellipse(mx, my + 4 * s, 11 * s, 14 * s, 0, 0, TAU); sh(x, '#8a2a2a', 6 * s); }
  else { // open / grin / talk
    const h = (kind === 'grin' ? 26 : 34) * s * (kind === 'talk' ? (.35 + .65 * open) : 1);
    x.beginPath(); x.moveTo(mx - 30 * s, my - 6 * s); x.quadraticCurveTo(mx, my + h * 1.6, mx + 30 * s, my - 6 * s); x.closePath(); sh(x, '#8a2a2a', 6 * s);
    if (h > 18 * s) { x.save(); x.clip(); x.beginPath(); x.ellipse(mx, my + h * 1.05, 16 * s, 10 * s, 0, 0, TAU); x.fillStyle = '#e8737a'; x.fill(); x.restore(); }
  }
}
function cheeks(x, cx, cy, gap, s = 1) { x.fillStyle = 'rgba(255,110,120,.38)'; for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * gap, cy, 24 * s, 14 * s, 0, 0, TAU); x.fill(); } }

// ---------- Woman in tudung + baju kurung (mum, ustazah) ----------
export const WOM_W = 1000, WOM_H = 1500, WOM_FOOT = 1440;
export const MUM_COL = { tud: '#ee8fa8', tudS: '#cf6d89', baju: '#f2be45', bajuS: '#d39d2b', kain: '#de9f37', kainS: '#c08425', dot: '#fff0c8', skin: '#f3c9a1', skinS: '#dfa97e', shoe: '#7a4a2f' };
export const UST_COL = { tud: '#b9a0ea', tudS: '#9479cf', baju: '#46b49a', bajuS: '#2f9580', kain: '#3a9e88', kainS: '#2b7f6c', dot: '#dff7ee', skin: '#efc49b', skinS: '#d9a477', shoe: '#5a3a2a' };

function womanArm(x, sx, sy, ang, side, C) {
  if (ang === 'ear') { // upper arm out and down, forearm up so the hand cups the ear
    const ex = sx + 120, ey = sy + 190, hx = sx - 10, hy = sy - 200;
    const seg2 = (ax, ay, bx, by) => { const a = Math.atan2(by - ay, bx - ax) - Math.PI / 2, l = Math.hypot(bx - ax, by - ay); x.save(); x.translate(ax, ay); x.rotate(a); rr(x, -40, -20, 80, l + 30, 38); sh(x, C.baju, LW2 + 1); x.restore(); };
    seg2(sx, sy, ex, ey); seg2(ex, ey, hx, hy);
    x.beginPath(); x.ellipse(hx, hy, 44, 52, -.3, 0, TAU); sh(x, C.skin, LW2 + 1);
    return;
  }
  x.save(); x.translate(sx, sy); x.rotate(-ang * side);
  rr(x, -42, -20, 84, 330, 40); crescent(x, () => rr(x, -42, -20, 84, 330, 40), C.bajuS, side * 14, 0, C.baju); rr(x, -42, -20, 84, 330, 40); sh(x, null, LW2 + 1);
  x.beginPath(); x.arc(0, 330, 40, 0, TAU); sh(x, C.skin, LW2 + 1);
  x.restore();
}
export function drawWoman(x, p = {}, C = MUM_COL) {
  x.clearRect(0, 0, WOM_W, WOM_H);
  const { armL = .16, armR = .16, brow = 'neutral', mouthK = 'smile', talk = 0, tilt = 0, ear = false } = p;
  x.save(); x.translate(500, WOM_FOOT); x.rotate(tilt); x.translate(-500, -WOM_FOOT);
  // shoes
  for (const d of [-1, 1]) { blob(x, 500 + d * 70, 1418, 62, 26, .03, 3 + d); sh(x, C.shoe, LW2); }
  // kain (long skirt)
  const kain = () => { x.beginPath(); x.moveTo(335, 980); x.lineTo(665, 980); x.quadraticCurveTo(700, 1200, 712, 1402); x.quadraticCurveTo(500, 1424, 288, 1402); x.quadraticCurveTo(300, 1200, 335, 980); x.closePath(); };
  crescent(x, kain, C.kainS, 26, 0, C.kain); kain(); sh(x, null, LW);
  { const R = mulberry(5); x.save(); kain(); x.clip(); x.fillStyle = C.dot; for (let i = 0; i < 26; i++) { const px = 300 + R() * 400, py = 1000 + R() * 390; x.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.ellipse(px + Math.cos(a) * 9, py + Math.sin(a) * 9, 7, 5, a, 0, TAU); } x.globalAlpha = .55; x.fill(); } x.restore(); x.globalAlpha = 1; }
  // arms (behind the tunic edge)
  womanArm(x, 322, 650, armL, -1, C); if (!ear) womanArm(x, 678, 650, armR, 1, C);
  // baju kurung (long tunic to the knees)
  const baju = () => { x.beginPath(); x.moveTo(390, 600); x.lineTo(610, 600); x.quadraticCurveTo(690, 640, 700, 760); x.lineTo(728, 1160); x.quadraticCurveTo(500, 1196, 272, 1160); x.lineTo(300, 760); x.quadraticCurveTo(310, 640, 390, 600); x.closePath(); };
  crescent(x, baju, C.bajuS, 30, 0, C.baju); baju(); sh(x, null, LW);
  x.strokeStyle = C.bajuS; x.lineWidth = LW2; x.beginPath(); x.moveTo(330, 1100); x.quadraticCurveTo(500, 1128, 670, 1100); x.stroke();
  // tudung: head + cape over the shoulders, ending in a soft point on the chest
  const tud = () => { x.beginPath(); x.moveTo(500, 225); x.bezierCurveTo(640, 225, 712, 330, 706, 470); x.bezierCurveTo(704, 560, 760, 640, 750, 720); x.quadraticCurveTo(640, 800, 500, 880); x.quadraticCurveTo(360, 800, 250, 720); x.bezierCurveTo(240, 640, 296, 560, 294, 470); x.bezierCurveTo(288, 330, 360, 225, 500, 225); x.closePath(); };
  crescent(x, tud, C.tudS, 34, 18, C.tud); tud(); sh(x, null, LW + 1);
  // soft fold lines in the cape
  x.strokeStyle = C.tudS; x.lineWidth = LW2; x.lineCap = 'round';
  x.beginPath(); x.moveTo(330, 640); x.quadraticCurveTo(400, 720, 470, 800); x.moveTo(670, 640); x.quadraticCurveTo(600, 720, 530, 800); x.stroke();
  // face opening
  const face = () => { x.beginPath(); x.ellipse(500, 455, 128, 150, 0, 0, TAU); };
  crescent(x, face, C.skinS, 18, 14, C.skin); face(); sh(x, null, LW2 + 1);
  // inner band of the tudung around the face
  x.beginPath(); x.ellipse(500, 452, 140, 162, 0, Math.PI * 1.05, Math.PI * 1.95); x.strokeStyle = C.tudS; x.lineWidth = 12; x.stroke();
  x.beginPath(); x.arc(500, 616, 13, 0, TAU); sh(x, '#ffd766', 4);
  if (ear) womanArm(x, 690, 650, 'ear', 1, C);
  // features
  if (p.sweat != null) { // a sweat drop sliding down the temple
    const sx = 612, sy = 372 + p.sweat * 46;
    x.beginPath(); x.moveTo(sx, sy - 34); x.bezierCurveTo(sx + 6, sy - 14, sx + 22, sy + 4, sx + 18, sy + 18); x.arc(sx, sy + 16, 18, 0, Math.PI); x.bezierCurveTo(sx - 22, sy + 4, sx - 6, sy - 14, sx, sy - 34); x.closePath(); sh(x, '#8fd6f5', 5);
    x.beginPath(); x.ellipse(sx - 6, sy + 8, 4, 8, -.3, 0, TAU); x.fillStyle = '#fff'; x.fill();
  }
  cheeks(x, 500, 505, 78);
  brows(x, 500, 400, 50, brow);
  eye(x, 452, 450, p); eye(x, 548, 450, p);
  x.beginPath(); x.moveTo(500, 470); x.quadraticCurveTo(492, 492, 504, 496); x.lineWidth = 5; x.strokeStyle = C.skinS; x.stroke();
  mouth(x, 500, 532, mouthK, 1, talk);
  x.restore();
}

// ---------- Boy in songkok + baju Melayu ----------
export const BOY_W = 800, BOY_H = 1150, BOY_FOOT = 1100;
const BOY = { skin: '#eebf93', skinS: '#d79f6f', baju: '#63b8ec', bajuS: '#3f92c9', samp: '#2f9b72', sampS: '#227a58', gold: '#f2c94c', song: '#283464', songS: '#1a2246', shoe: '#3a2a24' };
function boyArm(x, sx, sy, ang, side, hold) {
  x.save(); x.translate(sx, sy); x.rotate(-ang * side);
  rr(x, -32, -14, 64, 240, 30); crescent(x, () => rr(x, -32, -14, 64, 240, 30), BOY.bajuS, side * 10, 0, BOY.baju); rr(x, -32, -14, 64, 240, 30); sh(x, null, LW2 + 1);
  x.beginPath(); x.arc(0, 244, 31, 0, TAU); sh(x, BOY.skin, LW2 + 1);
  x.restore();
}
export function drawBoy(x, p = {}) {
  x.clearRect(0, 0, BOY_W, BOY_H);
  const { armL = .12, armR = .12, brow = 'neutral', mouthK = 'smile', talk = 0, book = false } = p;
  // legs (seluar)
  for (const d of [-1, 1]) { rr(x, 400 + d * 62 - 44, 840, 88, 230, 30); sh(x, BOY.baju, LW2 + 1); blob(x, 400 + d * 70, 1076, 56, 24, .03, 7 + d); sh(x, BOY.shoe, LW2); }
  boyArm(x, 268, 566, armL, -1); boyArm(x, 532, 566, armR, 1);
  if (!book) { /* arms drawn behind the body when down */ }
  // baju Melayu
  const baju = () => { x.beginPath(); x.moveTo(318, 530); x.lineTo(482, 530); x.quadraticCurveTo(548, 560, 552, 650); x.lineTo(560, 880); x.quadraticCurveTo(400, 900, 240, 880); x.lineTo(248, 650); x.quadraticCurveTo(252, 560, 318, 530); x.closePath(); };
  crescent(x, baju, BOY.bajuS, 24, 0, BOY.baju); baju(); sh(x, null, LW);
  // collar + buttons
  rr(x, 366, 516, 68, 40, 12); sh(x, BOY.baju, LW2);
  x.fillStyle = '#fff6d8'; for (const yy of [590, 632, 674]) { x.beginPath(); x.arc(400, yy, 9, 0, TAU); x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); }
  // samping (sarong at the waist)
  const samp = () => { x.beginPath(); x.moveTo(246, 742); x.quadraticCurveTo(400, 722, 554, 742); x.lineTo(566, 902); x.quadraticCurveTo(400, 930, 234, 902); x.closePath(); };
  crescent(x, samp, BOY.sampS, 20, 0, BOY.samp); samp(); sh(x, null, LW);
  x.save(); samp(); x.clip(); x.strokeStyle = BOY.gold; x.lineWidth = 6; x.globalAlpha = .85;
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(230 + i * 44, 720); x.lineTo(230 + i * 44, 940); x.stroke(); }
  for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(220, 760 + j * 44); x.lineTo(580, 760 + j * 44); x.stroke(); } x.restore(); x.globalAlpha = 1;
  // hands holding a plain closed book (no writing on it)
  if (book) {
    x.save(); x.translate(400, 700); x.rotate(-.06);
    rr(x, -110, -78, 220, 150, 12); sh(x, '#3d7fd0', LW); rr(x, -96, -66, 192, 126, 8); sh(x, null, 4, '#2a5ea8');
    rr(x, -110, 60, 220, 18, 4); sh(x, '#f5eedc', 4);
    x.restore();
    for (const d of [-1, 1]) { x.beginPath(); x.arc(400 + d * 118, 712, 30, 0, TAU); sh(x, BOY.skin, LW2 + 1); }
  }
  // head
  for (const d of [-1, 1]) { x.beginPath(); x.ellipse(400 + d * 148, 372, 28, 36, 0, 0, TAU); sh(x, BOY.skin, LW2); }
  const head = () => { x.beginPath(); x.ellipse(400, 360, 150, 156, 0, 0, TAU); };
  crescent(x, head, BOY.skinS, 22, 18, BOY.skin); head(); sh(x, null, LW + 1);
  // hair under the songkok
  x.beginPath(); x.moveTo(262, 300); x.quadraticCurveTo(270, 250, 320, 236); x.lineTo(480, 236); x.quadraticCurveTo(530, 250, 538, 300); x.quadraticCurveTo(500, 268, 400, 266); x.quadraticCurveTo(300, 268, 262, 300); x.closePath(); sh(x, '#2b1d18', LW2);
  // songkok
  const song = () => { x.beginPath(); x.moveTo(268, 262); x.quadraticCurveTo(400, 286, 532, 262); x.lineTo(518, 140); x.quadraticCurveTo(400, 124, 282, 140); x.closePath(); };
  crescent(x, song, BOY.songS, 22, 0, BOY.song); song(); sh(x, null, LW);
  x.beginPath(); x.ellipse(400, 140, 118, 18, 0, 0, TAU); sh(x, '#36447a', LW2);
  x.beginPath(); x.moveTo(316, 168); x.quadraticCurveTo(330, 210, 324, 248); x.lineWidth = 9; x.strokeStyle = 'rgba(255,255,255,.22)'; x.stroke();
  cheeks(x, 400, 418, 86, .9);
  brows(x, 400, 318, 52, brow, .9);
  eye(x, 350, 360, p, .95); eye(x, 450, 360, p, .95);
  mouth(x, 400, 440, mouthK, .9, talk);
}

// ---------- Klik: teal/navy cube, screen face, cursor antenna ----------
export const KLIK_W = 900, KLIK_H = 1020;
const K = { top: '#8fe6dc', topS: '#6fd0c6', front: '#1fb3a6', frontS: '#14968b', side: '#1f3c6e', sideS: '#162c52', scr: '#0f2340', glow: '#9ff6ff' };
export function cursorPath(x, tx, ty, s = 1, rot = 0) {
  const pts = [[0, 0], [0, 128], [32, 98], [56, 148], [78, 138], [54, 90], [94, 90]];
  x.beginPath(); pts.forEach(([a, b], i) => { const ca = Math.cos(rot), sa = Math.sin(rot), X = tx + (a * ca - b * sa) * s, Y = ty + (a * sa + b * ca) * s; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath();
}
export function drawKlik(x, p = {}) {
  x.clearRect(0, 0, KLIK_W, KLIK_H);
  const { press = 0, armL = 0, armR = 0, eyesK = 'open', mouthK = 'smile', blink = 0, talk = 0 } = p;
  const ox = 0, oy = 0;
  // antenna (shrinks when the cursor clicks)
  const tipY = lerp(70, 128, press);
  x.beginPath(); x.moveTo(452, 330); x.quadraticCurveTo(470, 250, 452, tipY + 110); x.lineWidth = 14; x.strokeStyle = INK; x.lineCap = 'round'; x.stroke();
  x.beginPath(); x.arc(452, 330, 20, 0, TAU); sh(x, K.side, LW2);
  cursorPath(x, 418, tipY, 1.05, -.12); sh(x, '#ffffff', LW);
  if (press > .5) { x.strokeStyle = '#ffd23f'; x.lineWidth = 10; for (let i = 0; i < 5; i++) { const a = -2.6 + i * .5, r0 = 70, r1 = 110; x.beginPath(); x.moveTo(418 + Math.cos(a) * r0, tipY + Math.sin(a) * r0); x.lineTo(418 + Math.cos(a) * r1, tipY + Math.sin(a) * r1); x.stroke(); } }
  // arms (stubby, navy)
  const arm = (sx, sy, ang, side) => { x.save(); x.translate(sx, sy); x.rotate(ang * side); rr(x, -30, -24, 150, 52, 26); sh(x, K.side, LW2 + 1); x.beginPath(); x.arc(150, 2, 34, 0, TAU); sh(x, K.top, LW2 + 1); x.restore(); };
  x.save(); x.translate(205, 640); x.scale(-1, 1); x.translate(-205, -640); arm(205, 640, -armL, 1); x.restore();
  arm(705, 600, -armR, 1);
  // cube faces
  const top = () => { x.beginPath(); x.moveTo(200, 400); x.lineTo(600, 400); x.lineTo(705, 300); x.lineTo(305, 300); x.closePath(); };
  const side = () => { x.beginPath(); x.moveTo(600, 400); x.lineTo(705, 300); x.lineTo(705, 690); x.lineTo(600, 800); x.closePath(); };
  const front = () => { x.beginPath(); x.roundRect(200, 400, 400, 400, 18); };
  crescent(x, top, K.topS, 0, 14, K.top); top(); sh(x, null, LW);
  crescent(x, side, K.sideS, 14, 0, K.side); side(); sh(x, null, LW);
  crescent(x, front, K.frontS, 20, 18, K.front); front(); sh(x, null, LW + 1);
  // screen
  x.beginPath(); x.roundRect(238, 440, 324, 300, 30); sh(x, K.scr, LW2 + 1);
  x.save(); x.beginPath(); x.roundRect(238, 440, 324, 300, 30); x.clip();
  const g = x.createRadialGradient(400, 560, 10, 400, 590, 230); g.addColorStop(0, 'rgba(80,220,255,.28)'); g.addColorStop(1, 'rgba(80,220,255,0)'); x.fillStyle = g; x.fillRect(238, 440, 324, 300);
  x.beginPath(); x.moveTo(270, 470); x.lineTo(330, 470); x.lineTo(270, 560); x.closePath(); x.fillStyle = 'rgba(255,255,255,.12)'; x.fill();
  x.restore();
  // face on the screen
  const fc = K.glow; x.fillStyle = fc; x.strokeStyle = fc; x.lineCap = 'round';
  for (const ex of [340, 460]) {
    if (eyesK === 'happy') { x.beginPath(); x.moveTo(ex - 26, 580); x.quadraticCurveTo(ex, 540, ex + 26, 580); x.lineWidth = 13; x.stroke(); }
    else if (blink > .8) { x.beginPath(); x.moveTo(ex - 24, 572); x.lineTo(ex + 24, 572); x.lineWidth = 12; x.stroke(); }
    else { x.beginPath(); x.ellipse(ex, 568, 22, 34 * (1 - blink * .85), 0, 0, TAU); x.fill(); }
  }
  if (mouthK === 'open' || mouthK === 'talk') { const h = mouthK === 'talk' ? 14 + 22 * talk : 34; x.beginPath(); x.moveTo(360, 640); x.quadraticCurveTo(400, 640 + h * 1.8, 440, 640); x.closePath(); x.fill(); }
  else { x.beginPath(); x.moveTo(352, 640); x.quadraticCurveTo(400, 690, 448, 640); x.lineWidth = 12; x.stroke(); }
  x.fillStyle = 'rgba(255,140,170,.5)'; for (const cx of [300, 500]) { x.beginPath(); x.ellipse(cx, 630, 20, 11, 0, 0, TAU); x.fill(); }
}

// ---------- props ----------
export function clockFace(rm) {
  return cut(rm * 2, rm * 2, (x, W, H) => {
    const c = W / 2, r = W / 2 - 6;
    x.beginPath(); x.arc(c, c, r, 0, TAU); sh(x, '#e8413a', LW);
    x.beginPath(); x.arc(c, c, r * .82, 0, TAU); sh(x, '#fffaf0', LW2);
    x.strokeStyle = INK; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = r * (i % 3 ? .68 : .6), r1 = r * .76; x.lineWidth = i % 3 ? 6 : 11; x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); x.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); x.stroke(); }
    x.beginPath(); x.ellipse(c - r * .45, c - r * .5, r * .18, r * .08, -.7, 0, TAU); x.fillStyle = 'rgba(255,255,255,.45)'; x.fill();
  }, { ax: .5, ay: .5 });
}
// a clock hand; pivot at the bottom-centre of the card
export function clockHand(lm, wm, col) {
  return cut(wm, lm, (x, W, H) => { x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W, H - W * .5); x.arc(W / 2, H - W / 2, W / 2, 0, Math.PI); x.closePath(); sh(x, col, LW2); }, { pad: 16, border: 6, ay: 1 - (16 + wm * PPM * .5) / (lm * PPM + 32) });
}
export function sofa(wm) {
  return cut(wm, wm * .5, (x, W, H) => {
    const back = () => { x.beginPath(); x.roundRect(W * .08, H * .05, W * .84, H * .55, 40); };
    crescent(x, back, '#3d8f8a', 0, 26, '#56aaa3'); back(); sh(x, null, LW);
    for (const d of [0, 1]) { const arm = () => { x.beginPath(); x.roundRect(d ? W * .84 : 0, H * .32, W * .16, H * .5, 40); }; crescent(x, arm, '#3d8f8a', 0, 20, '#4f9f99'); arm(); sh(x, null, LW); }
    const seat = () => { x.beginPath(); x.roundRect(W * .12, H * .52, W * .76, H * .3, 26); }; crescent(x, seat, '#3d8f8a', 0, 18, '#62b6ae'); seat(); sh(x, null, LW);
    x.beginPath(); x.roundRect(W * .2, H * .2, W * .22, H * .26, 30); sh(x, '#f6c445', LW2 + 1);
    x.beginPath(); x.roundRect(W * .58, H * .2, W * .22, H * .26, 30); sh(x, '#ee8fa8', LW2 + 1);
    for (const px of [.16, .82]) { rr(x, W * px - 12, H * .8, 24, H * .18, 6); sh(x, '#8d5a31', LW2); }
  });
}
export function plant(hm, seed = 1) {
  return cut(hm * .7, hm, (x, W, H) => {
    const R = mulberry(seed);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * .36 + (R() - .5) * .1, l = H * (.45 + R() * .2), bx = W / 2, by = H * .66, ex = bx + Math.cos(a) * l * .8, ey = by + Math.sin(a) * l;
      x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + Math.cos(a) * l * .3, by + Math.sin(a) * l * .5, ex, ey); x.lineWidth = 6; x.strokeStyle = '#3f7d3a'; x.stroke();
      const leaf = () => { x.beginPath(); x.ellipse(ex, ey, W * .13, W * .075, a, 0, TAU); }; crescent(x, leaf, '#3d9a4c', 8, 8, '#5cbf5c'); leaf(); sh(x, null, LW2);
    }
    const pot = () => { x.beginPath(); x.moveTo(W * .25, H * .64); x.lineTo(W * .75, H * .64); x.lineTo(W * .68, H); x.lineTo(W * .32, H); x.closePath(); };
    crescent(x, pot, '#c9612e', 14, 0, '#e8823e'); pot(); sh(x, null, LW);
  });
}
export function sideTable(wm) {
  return cut(wm, wm * .9, (x, W, H) => {
    rr(x, W * .1, H * .38, W * .8, H * .1, 8); sh(x, '#c98a52', LW);
    for (const px of [.2, .8]) { rr(x, W * px - 12, H * .46, 24, H * .54, 6); sh(x, '#a8733f', LW2); }
    // a stack of plain books (no writing)
    const cols = ['#3d7fd0', '#e8413a', '#46b49a'];
    cols.forEach((c, i) => { rr(x, W * (.24 + i * .02), H * (.29 - i * .08), W * .5, H * .08, 6); sh(x, c, LW2); });
  });
}
export function car(wm, col, shade, o = {}) {
  return cut(wm, wm * .55, (x, W, H) => {
    const body = () => { x.beginPath(); x.moveTo(W * .04, H * .82); x.lineTo(W * .02, H * .55); x.quadraticCurveTo(W * .04, H * .42, W * .18, H * .4); x.lineTo(W * .28, H * .12); x.quadraticCurveTo(W * .32, H * .04, W * .42, H * .04); x.lineTo(W * .7, H * .04); x.quadraticCurveTo(W * .78, H * .04, W * .82, H * .14); x.lineTo(W * .92, H * .4); x.quadraticCurveTo(W * .99, H * .44, W * .98, H * .6); x.lineTo(W * .96, H * .82); x.closePath(); };
    crescent(x, body, shade, 0, 22, col); body(); sh(x, null, LW);
    // windows
    const wins = [[.32, .14, .22, .26], [.57, .14, .2, .26]];
    wins.forEach(([a, b, c, d], i) => { x.beginPath(); x.roundRect(W * a, H * b, W * c, H * d, 14); sh(x, '#cdeefa', LW2); });
    if (o.family) {
      // mum (driver, tudung) in the front window, boy (songkok) in the back
      const fw = wins[0], bw = wins[1];
      x.save(); x.beginPath(); x.roundRect(W * fw[0], H * fw[1], W * fw[2], H * fw[3], 14); x.clip();
      const mx = W * (fw[0] + fw[2] * .5), my = H * (fw[1] + fw[3] * .62);
      x.beginPath(); x.ellipse(mx, my + 18, 64, 80, 0, 0, TAU); sh(x, '#ee8fa8', LW2); x.beginPath(); x.ellipse(mx, my + 12, 40, 50, 0, 0, TAU); sh(x, '#f3c9a1', 4);
      brows(x, mx, my - 6, 18, 'worried', .45); eye(x, mx - 16, my + 8, { eyes: 'open', look: [-.6, 0] }, .45); eye(x, mx + 16, my + 8, { eyes: 'open', look: [-.6, 0] }, .45); mouth(x, mx, my + 34, 'worried', .5);
      x.restore();
      x.save(); x.beginPath(); x.roundRect(W * bw[0], H * bw[1], W * bw[2], H * bw[3], 14); x.clip();
      const bx = W * (bw[0] + bw[2] * .5), by = H * (bw[1] + bw[3] * .7);
      x.beginPath(); x.arc(bx, by + 6, 42, 0, TAU); sh(x, '#eebf93', 4); x.beginPath(); x.moveTo(bx - 38, by - 18); x.lineTo(bx + 38, by - 18); x.lineTo(bx + 34, by - 52); x.lineTo(bx - 34, by - 52); x.closePath(); sh(x, '#283464', 4);
      eye(x, bx - 14, by + 4, { eyes: 'closed' }, .4); eye(x, bx + 14, by + 4, { eyes: 'closed' }, .4); mouth(x, bx, by + 24, 'flat', .45);
      x.restore();
    }
    x.strokeStyle = shade; x.lineWidth = LW2; x.beginPath(); x.moveTo(W * .55, H * .44); x.lineTo(W * .55, H * .78); x.stroke();
    x.beginPath(); x.roundRect(W * .9, H * .5, W * .07, H * .08, 6); sh(x, '#ff5a4a', 4);
    x.beginPath(); x.roundRect(W * .03, H * .5, W * .05, H * .08, 6); sh(x, '#fff3a8', 4);
    for (const px of [.24, .76]) { x.beginPath(); x.arc(W * px, H * .82, H * .16, 0, TAU); sh(x, '#3a3a44', LW); x.beginPath(); x.arc(W * px, H * .82, H * .07, 0, TAU); sh(x, '#c9c2b0', LW2); }
  });
}
export function trafficLight(hm) {
  return cut(hm * .32, hm, (x, W, H) => {
    rr(x, W / 2 - 10, H * .45, 20, H * .55, 6); sh(x, '#5a5a66', LW2);
    x.beginPath(); x.roundRect(W * .05, 0, W * .9, H * .5, 24); sh(x, '#3a3a44', LW);
    ['#ff4a3a', '#6a5a2a', '#2a4a34'].forEach((c, i) => { x.beginPath(); x.arc(W / 2, H * (.09 + i * .155), W * .3, 0, TAU); sh(x, c, LW2); });
    x.beginPath(); x.arc(W / 2 - W * .1, H * .07, W * .08, 0, TAU); x.fillStyle = 'rgba(255,255,255,.6)'; x.fill();
  });
}
export function honk(wm, text = 'PON!') {
  return cut(wm, wm * .6, (x, W, H) => {
    x.beginPath(); const n = 14; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, r = i % 2 ? .36 : .5; x.lineTo(W / 2 + Math.cos(a) * W * r, H / 2 + Math.sin(a) * H * r); } x.closePath(); sh(x, '#ffe14d', LW);
    x.font = `${Math.round(H * .34)}px "Lilita One"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#e8413a'; x.fillText(text, W / 2, H / 2 + 4); x.lineWidth = 4; x.strokeStyle = INK; x.strokeText(text, W / 2, H / 2 + 4);
  });
}
// generic chat app icon: green round bubble with a white phone handset
export function chatIcon(wm) {
  return cut(wm, wm * 1.0, (x, W, H) => {
    const c = W / 2, r = W * .42;
    const bub = () => { x.beginPath(); x.arc(c, H * .46, r, .2 * Math.PI, 2.62 * Math.PI); x.lineTo(c - r * 1.02, H * .96); x.closePath(); };
    crescent(x, bub, '#1f9e55', 18, 18, '#2fc46a'); bub(); sh(x, null, LW + 2);
    x.beginPath(); x.arc(c, H * .46, r * .74, 0, TAU); x.lineWidth = 18; x.strokeStyle = '#fff'; x.stroke();
    // phone handset: a thick bent bar with an ear pad (top-left) and a mouth pad (bottom-right)
    x.save(); x.translate(c, H * .46); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-r * .3, -r * .3); x.bezierCurveTo(-r * .5, r * .05, -r * .05, r * .5, r * .3, r * .3); x.lineWidth = r * .2; x.stroke();
    for (const [px, py, rot] of [[-r * .26, -r * .3, -.75], [r * .3, r * .26, -.75]]) { x.save(); x.translate(px, py); x.rotate(rot); x.beginPath(); x.roundRect(-r * .2, -r * .1, r * .4, r * .2, r * .09); x.fill(); x.restore(); }
    x.restore();
  });
}
export function pillButton(wm, text, col = '#e8413a', shade = '#c22f28') {
  return cut(wm, wm * .34, (x, W, H) => {
    const b = () => { x.beginPath(); x.roundRect(0, 0, W, H, H / 2); }; crescent(x, b, shade, 0, 14, col); b(); sh(x, null, LW);
    x.font = `${Math.round(H * .52)}px "Lilita One"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fffaf0'; x.fillText(text, W / 2, H * .5 + 3);
  });
}
// tiny kid face for the class grid (boy: songkok, girl: tudung)
function kidFace(x, cx, cy, s, girl, tud = '#ee8fa8', skin = '#eebf93') {
  if (girl) { x.beginPath(); x.ellipse(cx, cy + 10 * s, 64 * s, 78 * s, 0, 0, TAU); sh(x, tud, 4); x.beginPath(); x.ellipse(cx, cy + 6 * s, 40 * s, 48 * s, 0, 0, TAU); sh(x, skin, 3); }
  else { x.beginPath(); x.arc(cx, cy + 8 * s, 46 * s, 0, TAU); sh(x, skin, 4); x.beginPath(); x.moveTo(cx - 44 * s, cy - 12 * s); x.lineTo(cx + 44 * s, cy - 12 * s); x.lineTo(cx + 38 * s, cy - 54 * s); x.lineTo(cx - 38 * s, cy - 54 * s); x.closePath(); sh(x, '#283464', 4); }
  eye(x, cx - 15 * s, cy + 4 * s, { eyes: 'happy' }, .42 * s); eye(x, cx + 15 * s, cy + 4 * s, { eyes: 'happy' }, .42 * s); mouth(x, cx, cy + 26 * s, 'smile', .5 * s);
  x.fillStyle = 'rgba(255,110,120,.35)'; for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * 26 * s, cy + 18 * s, 9 * s, 5 * s, 0, 0, TAU); x.fill(); }
}
// laptop screen card (hinged at the bottom): a small group class
export function laptopScreen(wm) {
  return cut(wm, wm * .68, (x, W, H) => {
    x.beginPath(); x.roundRect(0, 0, W, H, 26); sh(x, '#2a3346', LW);
    x.beginPath(); x.roundRect(W * .05, H * .07, W * .9, H * .86, 12); sh(x, '#e9f3ff', LW2);
    const tw = W * .9 / 3, th = H * .86 / 2, cols = ['#d9ccff', '#ffe3ef', '#d8f5e9', '#fff2c2', '#d6ecff', '#ffe0c8'];
    const who = [['t'], ['b'], ['g', '#b9a0ea'], ['b'], ['g', '#7fcfe8'], ['k']];
    for (let i = 0; i < 6; i++) {
      const cx = W * .05 + (i % 3 + .5) * tw, cy = H * .07 + (((i / 3) | 0) + .5) * th;
      x.beginPath(); x.roundRect(cx - tw / 2 + 6, cy - th / 2 + 6, tw - 12, th - 12, 10); x.fillStyle = cols[i]; x.fill();
      const w = who[i][0];
      if (w === 't') { kidFace(x, cx, cy + 6, 1.05, true, '#b9a0ea', '#efc49b'); x.beginPath(); x.roundRect(cx - tw / 2 + 6, cy - th / 2 + 6, tw - 12, th - 12, 10); x.lineWidth = 8; x.strokeStyle = '#ffcf3f'; x.stroke(); }
      else if (w === 'k') { // Klik's tile
        x.beginPath(); x.roundRect(cx - 38, cy - 34, 76, 76, 10); sh(x, '#1fb3a6', 4); x.beginPath(); x.roundRect(cx - 28, cy - 24, 56, 50, 8); sh(x, '#0f2340', 3);
        x.fillStyle = '#9ff6ff'; for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * 11, cy - 4, 5, 8, 0, 0, TAU); x.fill(); }
      }
      else kidFace(x, cx, cy + 8, .95, w === 'g', who[i][1]);
    }
    x.beginPath(); x.arc(W / 2, H * .035, 6, 0, TAU); x.fillStyle = '#7a8296'; x.fill();
  }, { ay: .97 });
}
export function laptopBase(wm) {
  return cut(wm * 1.06, wm * .5, (x, W, H) => {
    x.beginPath(); x.roundRect(0, 0, W, H, 22); sh(x, '#c9d2e0', LW);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { x.beginPath(); x.roundRect(W * .08 + c * W * .085, H * .1 + r * H * .13, W * .07, H * .1, 5); x.fillStyle = '#8f9ab0'; x.fill(); }
    x.beginPath(); x.roundRect(W * .35, H * .68, W * .3, H * .22, 10); x.fillStyle = '#aeb8ca'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
  }, { ay: .5 });
}
// tablet showing the ustazah listening, hand at her ear
export function tablet(wm) {
  const it = cut(wm, wm * .8, (x, W, H) => {
    x.beginPath(); x.roundRect(0, 0, W, H, 34); sh(x, '#2a3346', LW);
    x.beginPath(); x.roundRect(W * .05, H * .06, W * .9, H * .84, 16); sh(x, '#e6f7f1', LW2);
    x.save(); x.beginPath(); x.roundRect(W * .05, H * .06, W * .9, H * .84, 16); x.clip();
    const s = (H * .84) / 1050, c = cv(WOM_W, WOM_H); drawWoman(c.getContext('2d'), { ear: true, brow: 'up', mouthK: 'smile', look: [.5, 0] }, UST_COL);
    x.drawImage(c, W / 2 - WOM_W * s * .5, H * .1, WOM_W * s, WOM_H * s);
    x.restore();
    // sound waves near her ear
    x.strokeStyle = '#2fc46a'; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { x.lineWidth = 9; x.beginPath(); x.arc(W * .8, H * .36, 40 + i * 34, -.7, .7); x.stroke(); }
  });
  return it;
}
export function tickBadge(rm) {
  return cut(rm * 2, rm * 2, (x, W, H) => {
    const c = W / 2, r = W / 2 - 8;
    const b = () => { x.beginPath(); x.arc(c, c, r, 0, TAU); }; crescent(x, b, '#1f9e55', 14, 14, '#2fc46a'); b(); sh(x, null, LW + 2);
    x.beginPath(); x.moveTo(c - r * .45, c + r * .02); x.lineTo(c - r * .12, c + r * .36); x.lineTo(c + r * .5, c - r * .34); x.lineWidth = r * .24; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
  }, { ax: .5, ay: .5 });
}
export function starShape(x, cx, cy, r, inner = .45) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr2 = i % 2 ? r * inner : r; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); }
export function star(rm, col = '#ffd23f', shade = '#f0a81e') {
  return cut(rm * 2, rm * 2, (x, W, H) => { const f = () => starShape(x, W / 2, H / 2 + 4, W / 2 - 6, .48); crescent(x, f, shade, 8, 10, col); f(); sh(x, null, LW); }, { ax: .5, ay: .5, border: 10 });
}
// progress bar frame on legs, with five empty star slots
// progress bar on two posts; the bar body sits at the top (body height = wm * .176), posts run down to the page
export function barFrame(wm, hm = wm * .42) {
  return cut(wm, hm, (x, W, H) => {
    const bh = W * .176, by = W * .021;
    for (const px of [.12, .88]) { rr(x, W * px - 10, by + bh * .5, 20, H - by - bh * .5, 6); sh(x, '#8d5a31', LW2); }
    x.beginPath(); x.roundRect(0, by, W, bh, bh / 2); sh(x, '#fffaf0', LW + 1);
    x.beginPath(); x.roundRect(W * .04, by + bh * .167, W * .92, bh * .667, bh * .333); sh(x, '#efe4cf', LW2);
  });
}
export function barFill(wm, hm) {
  return cut(wm, hm, (x, W, H) => { x.beginPath(); x.roundRect(0, 0, W, H, H / 2); sh(x, '#ff9a2e', LW2); x.beginPath(); x.roundRect(W * .02, H * .12, W * .96, H * .26, H * .13); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); }, { ax: 0, ay: .5, border: 6, pad: 14 });
}
// end-card sign: OCLC wordmark + WhatsApp number
// end-card sign: the official OCLC logo (on a white panel, unaltered) + WhatsApp number
export const LOGO_CROP = [150, 180, 955, 895];   // x, y, w, h of the logo artwork inside oclc-logo.png (trims the empty margin)
export function endSign(wm, logo) {
  return cut(wm, wm * .98, (x, W, H) => {
    const b = () => { x.beginPath(); x.roundRect(0, 0, W, H, 40); }; crescent(x, b, '#e9dcc0', 0, 24, '#fffaf0'); b(); sh(x, null, LW + 2);
    x.beginPath(); x.roundRect(W * .04, H * .035, W * .92, H * .93, 30); x.lineWidth = 6; x.strokeStyle = '#1fb3a6'; x.setLineDash([22, 14]); x.stroke(); x.setLineDash([]);
    const pw = W * .66, ph = pw * LOGO_CROP[3] / LOGO_CROP[2] * 1.06, px = (W - pw) / 2, py = H * .07;
    x.beginPath(); x.roundRect(px, py, pw, ph, 22); x.fillStyle = '#ffffff'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#d8ccb2'; x.stroke();
    const lw = pw * .9, lh = lw * LOGO_CROP[3] / LOGO_CROP[2];
    x.drawImage(logo, LOGO_CROP[0], LOGO_CROP[1], LOGO_CROP[2], LOGO_CROP[3], (W - lw) / 2, py + (ph - lh) / 2, lw, lh);
    const wy = py + ph + H * .05, wh = H * .2;
    x.beginPath(); x.roundRect(W * .07, wy, W * .86, wh, wh / 2); sh(x, '#2fc46a', LW);
    x.font = `700 ${Math.round(wh * .5)}px Fredoka`; x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = Math.round(wh * .5); while (x.measureText('WhatsApp: +60 19-823 0383').width > W * .82) { fs -= 2; x.font = `700 ${fs}px Fredoka`; }
    x.lineWidth = 8; x.strokeStyle = '#1b7a42'; x.lineJoin = 'round'; x.strokeText('WhatsApp: +60 19-823 0383', W / 2, wy + wh / 2 + 2); x.fillText('WhatsApp: +60 19-823 0383', W / 2, wy + wh / 2 + 2);
  }, { ax: .5, ay: 0 });
}
export function slitMark(wm) { return cut(wm, wm * .08, (x, W, H) => { x.beginPath(); x.ellipse(W / 2, H / 2, W / 2 - 4, H / 2 - 2, 0, 0, TAU); x.fillStyle = 'rgba(58,42,36,.55)'; x.fill(); }, { raw: true, ay: .5 }); }

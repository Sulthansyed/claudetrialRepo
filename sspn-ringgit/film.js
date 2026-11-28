// RM2,000 or RM0? (SSPN) — Spreadsheet Film, 1080×1920. One sheet; render(t) is a pure function of t.
// The shell is drawn in screen space and never zooms; everything in the sheet goes through X()/Y().
const W = 1080, H = 1920;
export const DUR = 39.8;

// ---------------- helpers ----------------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3), ss = t => t * t * (3 - 2 * t);
const hash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t)).toString(16).padStart(2, '0')).join(''); };
const pop = (t, t0, d = .22, amt = .3) => t >= t0 && t < t0 + d ? 1 + amt * (1 - (t - t0) / d) : 1;
const typed = (s, t, a, b) => t < a ? '' : t >= b ? s : s.slice(0, Math.floor(seg(t, a, b) * s.length + 1e-6));
const fmt = n => n.toLocaleString('en-US');

// ---------------- palette (five working hues + ink + shell) ----------------
const INK = '#17120a', LIME = '#b8f25a', LIME_INK = '#2c4a00', RED = '#e8382d', AMBER = '#ffb21f', AMBER_INK = '#a86a00';
const SKY = '#4fb3e8', SKY_INK = '#17689a', INDIGO = '#2a2f6c', NOTE = '#fff8c4';
const SCALE = ['#b8f25a', '#e6f9bd', '#9fdc6e', '#ddf3d3', '#8fd0b0', '#d6eef0', '#8fc9e6'];   // banded: dark/light alternating, lime → sky
const UI = "'Inter', sans-serif";

// ---------------- shell geometry (screen px, fixed) ----------------
const TITLE_H = 76, TOOL_H = 74, FBAR_H = 114, ROWH_W = 66, TABS_H = 56, STAT_H = 60;
const FBAR_Y = TITLE_H + TOOL_H, SHEET_B = H - TABS_H - STAT_H;
const SAFE_R = W - 140, NOTE_X = 80, NOTE_Y = 1290, NOTE_H = 122;
const FIT = w => (SAFE_R - 22 - ROWH_W) / w;                  // zoom that fits a width of columns left of the safe edge

// ---------------- the sheet model ----------------
const NC = 40, NR = 140, CW = 64, RH = 22;
const BASE_W = [92, 96, 84, 92, 84, 56, 150];                 // A Parent, B Beneficiary, C Deposited, D Withdrawn, E Relief, F Band, G Saved
const ROWH = { 1: 26, 2: 52, 3: 20, 4: 36, 5: 80, 6: 80, 8: 30, 9: 30, 10: 30, 11: 30, 12: 36, 13: 36, 14: 36, 16: 36, 44: 32, 45: 40, 48: 30, 49: 30, 50: 30, 51: 30, 52: 30, 53: 30, 54: 30, 55: 30 };  // by row number
const RY = new Float64Array(NR + 2); { let y = 0; for (let j = 0; j <= NR; j++) { RY[j] = y; y += ROWH[j + 1] || RH; } RY[NR + 1] = y; }
const rowY = j => RY[clamp(j, 0, NR + 1)], rowYf = r => { const j = Math.floor(r); return rowY(j) + (r - j) * (rowY(j + 1) - rowY(j)); };
const colName = i => String.fromCharCode(65 + i);
const R = (c0, c1, r0, r1) => [c0, c1, r0 - 1, r1 - 1];       // merged range: columns 0-based, rows given by row number
const M = {
  TITLE: R(0, 6, 2, 2), CARD: R(0, 6, 8, 11), FOOT: R(0, 6, 12, 14),
  BTITLE: R(0, 6, 16, 16), BLBL: R(0, 1, 44, 44), VLBL: R(0, 1, 45, 45), UNIT: R(5, 6, 41, 42),
  DIS: R(0, 6, 48, 53), DIS2: R(0, 6, 54, 55),
};
const HDR_ROW = 3, ROW_A = 4, ROW_B = 5;                      // 0-based: header row 4, Aisyah row 5, Ali row 6
const BAND_ROW = 43, VAL_ROW = 44, BAR_BASE = 42;             // 0-based: band % row 44, saved row 45, bars sit on row 43
const BARS = [{ c: 2, n: 11, pct: '11%', val: 880, col: SKY }, { c: 3, n: 19, pct: '19%', val: 1520, col: SKY }, { c: 4, n: 25, pct: '25%', val: 2000, col: LIME }];

// ---------------- timeline (voice-led; see TREATMENT.md §6–7) ----------------
export const VO = [['v01', .15], ['v02', 6.35], ['v03', 9.05], ['v04', 14.85], ['v05', 21.4], ['v06', 26.0], ['v07', 35.2]];
export const TL = {
  flash0: .25, hopC6: 1.10, hopG5: 3.0,
  cut1: 6.10, whip0: 6.35, whip1: 6.8, fold1: 6.9, fold2: 7.4, hidMsg: 7.9,
  rcD: 9.2, unD: 9.5, selD: 10.5, typD0: 11.15, typD1: 11.45, entD: 12.3, recE: 12.42, recG: 12.55, undo: 14.55,
  rcB: 14.95, unB: 15.2, selfR: 15.6, selE: 15.72, fx0: 15.78, fx1: 17.38, cut2: 16.95, entE: 17.45, recG6: 17.58,
  down0: 18.5, down1: 19.3, btitle: 19.35, band0: 19.5, f5a: 19.85, f5b: 20.3, ent5: 20.55, unit: 21.0,
  dragD0: 21.25, dragD1: 21.55, dragE0: 22.45, dragE1: 22.8, sweep: 23.95, pull1: 25.5,       // v05 "two thousand" lands on 22.8
  dis0: 25.9, dis1: 26.6, merge1: 26.65, typDis0: 27.25, typDis1: 27.55, entDis: 27.7, typSub0: 29.55, typSub1: 30.85, entSub: 30.95,
  up0: 34.3, up1: 35.1, card0: 35.2, typCard0: 35.4, typCard1: 36.25, entCard: 36.35, foot: 35.55, ding: 36.95,
};
TL.bar = [TL.ent5 + .1, TL.dragD1 + .1, TL.dragE1 + .1];
const BAR_DT = [.04, .035, .036];
const UNW = .55;                                              // a column takes 0.55 s to open

// ---------------- strings ----------------
const FX_SAVED = [['=', INK], ['Relief', SKY_INK], ['*', INK], ['Band', AMBER_INK]];
const FX_IF = [['=IF(', INK], ['Beneficiary', AMBER_INK], ['="Self",0,', INK], ['\n', INK], ['MIN(', INK], ['Deposited', SKY_INK], ['-', INK], ['Withdrawn', INDIGO], [',8000))', INK]];
const FX_BAND = c => [['=8000*', INK], [colName(c) + (BAND_ROW + 1), SKY_INK]];
const S_DIS = '31 DIS', S_SUB = 'Bukan di kaunter? Bayar sebelum 25 Dis', S_CARD = 'Nak versi BM penuh? Komen di bawah.';
const FOOT = ['Untuk YA 2026', 'Jimat bergantung pada kadar cukai', 'Bukan nasihat kewangan / Not financial advice'];
const flat = P => P.flatMap(([s, c]) => s === '\n' ? [['\n', c]] : [...s].map(ch => [ch, c]));
const typedParts = (P, t, a, b) => { const L = flat(P), n = L.filter(x => x[0] !== '\n').length; if (t >= b) return L; let k = Math.floor(seg(t, a, b) * n + 1e-6), o = []; for (const x of L) { if (x[0] === '\n') { if (k > 0) o.push(x); continue; } if (k-- <= 0) break; o.push(x); } return o; };
const nameDone = (P, name, t, a, b) => { const L = flat(P).filter(x => x[0] !== '\n'); const s = L.map(x => x[0]).join(''), end = s.indexOf(name) + name.length; return t >= a + (b - a) * end / L.length; };

// subtitle cards: [line, first word index, BM, EN]
const CARDS = [
  ['v01', 0, 'Dua ibu bapa. Simpan RM8,000 yang sama.', 'Two parents. Same RM8,000 saved.'],
  ['v01', 7, 'Seorang jimat cukai sehingga RM2,000.', 'One saves up to RM2,000 in tax.'],
  ['v02', 0, 'Bezanya tersembunyi dalam dua lajur.', 'The difference is hiding in two columns.'],
  ['v03', 0, 'Perangkap pertama: keluarkan wang', 'Trap one: withdraw'],
  ['v03', 3, 'pada tahun yang sama, termasuk dividen,', 'in the same year, even your dividends,'],
  ['v03', 10, 'pelepasan anda berkurang.', 'and your relief shrinks.'],
  ['v04', 0, 'Perangkap kedua: SSPN atas nama sendiri,', 'Trap two: an SSPN in your own name'],
  ['v04', 8, 'pelepasan sifar.', 'gets zero relief.'],
  ['v05', 0, 'Buat dengan betul, jimat sehingga', 'Do it right, and you save up to'],
  ['v05', 8, 'RM2,000, ikut kadar cukai anda.', 'RM2,000, depending on your tax band.'],
  ['v06', 0, 'Wang mesti sampai ke PTPTN', 'The money must reach PTPTN'],
  ['v06', 5, 'sebelum 31 Disember.', 'by 31 December.'],
  ['v06', 8, 'Bukan di kaunter?', 'Not paying at a counter?'],
  ['v06', 13, 'Bayar sebelum 25 Disember.', 'Pay by the 25th.'],
  ['v07', 0, 'Nak versi BM penuh? Komen di bawah.', 'Want a full BM version? Comment below.'],
];
export let SUBS = [];                                         // [{t0, t1, bm, en}]
export const EV = [];

export function init(words, durs) {
  const start = Object.fromEntries(VO);
  SUBS = CARDS.map(([id, w, bm, en]) => ({ id, bm, en, t0: start[id] + Math.max(-.1, w === 0 ? -.1 : words[id][w][1] - .05) }));
  SUBS.forEach((s, k) => {
    const lineEnd = start[s.id] + durs[s.id], nx = SUBS[k + 1];
    const sameLine = nx && nx.id === s.id;
    s.t1 = sameLine ? nx.t0 : Math.min(nx ? nx.t0 - .15 : DUR - .3, Math.max(lineEnd + .5, s.t0 + 1.8));
  });
  buildEvents();
}

// ---------------- column layout (hidden B and D open during the film) ----------------
const CX = new Float64Array(NC + 2), CWs = new Float64Array(NC + 1);
const openB = t => eio(seg(t, TL.unB, TL.unB + UNW)), openD = t => eio(seg(t, TL.unD, TL.unD + UNW));
function layout(t) {
  let x = 0;
  for (let i = 0; i <= NC; i++) { let w = i < 7 ? BASE_W[i] : CW; if (i === 1) w *= openB(t); if (i === 3) w *= openD(t); CWs[i] = w; CX[i] = x; x += w; }
  CX[NC + 1] = x;
}
const colX = i => i <= NC ? CX[Math.max(0, i)] : CX[NC] + (i - NC) * CW;
const colW = i => i < NC ? CWs[Math.max(0, i)] : CW;
const colXf = c => { const i = Math.floor(c); return colX(i) + (c - i) * colW(i); };

// ---------------- camera: keys in [column, row] units, log zoom; the sheet can't scroll above row 1 or left of A ----------------
const midRow = (a, b) => (a + b) / 2;
const W_HOOK = BASE_W[0] + BASE_W[2] + BASE_W[4] + BASE_W[5] + BASE_W[6], W_D = W_HOOK + BASE_W[3], W_ALL = W_D + BASE_W[1];
const Z_HOOK = FIT(W_HOOK), Z_D = FIT(W_D), Z_ALL = FIT(W_ALL);
const FOOT_PX = 31;                                            // footnote size on screen at the end zoom
const CK = [
  { t: 0, at: [0, 0], z: Z_HOOK },
  { t: TL.whip0, at: [0, 0], z: Z_HOOK },
  { t: TL.whip1, at: [0, 0], z: 3.05, e: 'eio' },             // whip to the headers
  { t: TL.unD, at: [0, 0], z: 3.05 },
  { t: TL.unD + UNW, at: [0, 0], z: Z_D, e: 'eio' },         // ride the reflow as Withdrawn opens
  { t: TL.unB, at: [0, 0], z: Z_D },
  { t: TL.unB + UNW, at: [0, 0], z: Z_ALL, e: 'eio' },         // and again for Beneficiary
  { t: TL.down0, at: [0, 0], z: Z_ALL },
  { t: TL.down1, at: [3.5, midRow(15, 45)], z: Z_ALL * .95, e: 'eio' },   // track down to the band table
  { t: TL.sweep, at: [3.5, midRow(15, 45)], z: Z_ALL, e: 'ss' },     // slow push while the cells count
  { t: TL.pull1, at: [4.5, 40.5], z: 0.78, e: 'eio' },              // pull out with the colour scale
  { t: TL.dis0, at: [4.5, 40.5], z: 0.78 },
  { t: TL.dis1, at: [3.5, midRow(47, 55)], z: Z_ALL, e: 'eio' },     // drop and push into the merged stage
  { t: TL.up0, at: [3.5, midRow(47, 55)], z: Z_ALL, e: 'ss' },
  { t: TL.up1, at: [0, 0], z: Z_ALL, e: 'eio' },                     // back up to the two rows
  { t: DUR, at: [0, 0], z: Z_ALL },
];
const EASE = { eio, ss, eo, lin: x => x };
let CAM, HDR, SHEET_Y, VCX, VCY, VW, VH;
function camera(t) {
  let q = 0; while (q < CK.length - 2 && t >= CK[q + 1].t) q++;
  const A = CK[q], B = CK[q + 1], u = (EASE[B.e] || EASE.lin)(seg(t, A.t, B.t));
  const z = Math.exp(lerp(Math.log(A.z), Math.log(B.z), u));
  return { x: lerp(colXf(A.at[0]), colXf(B.at[0]), u), y: lerp(rowYf(A.at[1]), rowYf(B.at[1]), u), z };
}
function setup(t) {
  layout(t); CAM = camera(t);
  HDR = Math.round(36 * clamp(Math.sqrt(CAM.z), 1, 1.3));
  SHEET_Y = FBAR_Y + FBAR_H + HDR; VW = W - ROWH_W; VH = SHEET_B - SHEET_Y;
  VCX = (ROWH_W + SAFE_R) / 2; VCY = (SHEET_Y + NOTE_Y - 20) / 2;   // frame the subject left of the safe edge and above the note
  CAM.x = Math.max(CAM.x, (VCX - ROWH_W) / CAM.z); CAM.y = Math.max(CAM.y, (VCY - SHEET_Y) / CAM.z);
}
const X = wx => VCX + (wx - CAM.x) * CAM.z, Y = wy => VCY + (wy - CAM.y) * CAM.z;
const XC = i => Math.round(X(colX(i))), YR = j => Math.round(Y(rowY(j)));
const crect = (c0, c1, r0, r1) => { const x = XC(c0), y = YR(r0); return [x, y, XC(c1 + 1) - x, YR(r1 + 1) - y]; };
const mrect = k => crect(...M[k]);

// ---------------- drawing primitives ----------------
let g;
const rect = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
function text(s, x, y, font, col, align = 'left', base = 'middle') { g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); }
const line = (x1, y1, x2, y2, col, w = 1) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
const tw = (s, font) => { g.font = font; return g.measureText(s).width; };
function tri(x, y, s, col, dir = 'down') { g.fillStyle = col; g.beginPath(); if (dir === 'down') { g.moveTo(x - s, y - s / 2); g.lineTo(x + s, y - s / 2); g.lineTo(x, y + s / 2); } else if (dir === 'up') { g.moveTo(x - s, y + s / 2); g.lineTo(x + s, y + s / 2); g.lineTo(x, y - s / 2); } else if (dir === 'left') { g.moveTo(x + s / 2, y - s); g.lineTo(x + s / 2, y + s); g.lineTo(x - s / 2, y); } else { g.moveTo(x - s / 2, y - s); g.lineTo(x - s / 2, y + s); g.lineTo(x + s / 2, y); } g.fill(); }
function cellBox(x, y, w, h, fill, border = INK, lw = 1.5) { rect(x, y, w, h, fill); g.lineWidth = lw; g.strokeStyle = border; g.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw); }
function refBox(x, y, w, h, col, lw = 3) { g.lineWidth = lw; g.strokeStyle = col; g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = col; for (const [a, b] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) g.fillRect(a - 4, b - 4, 8, 8); }

// ---------------- the story state ----------------
const whatIf = t => t >= TL.entD && t < TL.undo;                 // Aisyah's withdrawal what-if
function cellAt(i, j, t) {    // → {v, fill, ink, size, weight, align, flash} for content cells, else null
  const fl = t0 => t >= t0 && t - t0 < .12 ? (1 - (t - t0) / .12) * .85 : 0;
  if (j === HDR_ROW && i < 7) return { v: ['Parent', 'Beneficiary', 'Deposited', 'Withdrawn', 'Relief', 'Band', 'Saved'][i], size: 12.5, weight: 700, ink: '#3a3a34', align: i === 0 || i === 1 ? 'left' : 'right', hdr: 1 };
  if (j === ROW_A || j === ROW_B) {
    const a = j === ROW_A;
    switch (i) {
      case 0: return { v: a ? 'Aisyah' : 'Ali', size: 20, weight: 700, ink: INK, align: 'left' };
      case 1: { const self = !a; return { v: a ? 'Child' : 'Self', size: 20, weight: 600, ink: self && t >= TL.selfR ? '#fff' : INK, fill: self && t >= TL.selfR ? RED : null, align: 'left', flash: self ? fl(TL.selfR) : 0 }; }
      case 2: return { v: '8,000', size: 20, weight: 600, ink: INK, align: 'right' };
      case 3: { const w = a && whatIf(t); return { v: w ? '3,000' : '0', size: 20, weight: w ? 700 : 600, ink: w ? '#fff' : INK, fill: w ? RED : null, align: 'right', flash: a ? fl(TL.entD) + fl(TL.undo) : 0, editing: a && t >= TL.typD0 && t < TL.entD }; }
      case 4: {
        if (a) { const w = whatIf(t) && t >= TL.recE; return { v: w ? '5,000' : '8,000', size: 20, weight: 700, ink: w ? AMBER_INK : INK, fill: w ? '#fff1cf' : null, align: 'right', flash: fl(TL.recE) + fl(TL.undo + .05), p: w ? pop(t, TL.recE) : 1 }; }
        const on = t >= TL.entE; return { v: '0', size: 20, weight: 700, ink: on ? '#fff' : INK, fill: on ? RED : null, align: 'right', flash: fl(TL.entE), p: pop(t, TL.entE), editing: t >= TL.fx0 && t < TL.entE };
      }
      case 5: return { v: '25%', size: 20, weight: 600, ink: INK, align: 'right' };
      case 6: {
        if (a) { const w = whatIf(t) && t >= TL.recG; return { v: w ? 'RM1,250' : 'RM2,000', size: 28, weight: 800, ink: w ? '#5a3a00' : LIME_INK, fill: w ? AMBER : LIME, align: 'right', flash: fl(TL.flash0) + fl(TL.recG) + fl(TL.undo + .1), p: pop(t, TL.flash0) * pop(t, TL.hopG5, .25, .3) * pop(t, TL.recG) * pop(t, TL.undo + .1) }; }
        return { v: 'RM0', size: 28, weight: 800, ink: '#fff', fill: RED, align: 'right', flash: fl(TL.flash0) + fl(TL.recG6), p: pop(t, TL.flash0) * pop(t, TL.recG6) };
      }
    }
  }
  if (j === BAND_ROW && i >= 2 && i <= 4 && t >= TL.band0 + (i - 2) * .14) return { v: BARS[i - 2].pct, size: 20, weight: 800, ink: INK, align: 'center', flash: fl(TL.band0 + (i - 2) * .14), p: pop(t, TL.band0 + (i - 2) * .14) };
  if (j === VAL_ROW && i >= 2 && i <= 4) {
    const t0 = [TL.ent5, TL.dragD1, TL.dragE1][i - 2];
    if (t >= t0) { const b = BARS[i - 2]; return { v: fmt(b.val), size: 23, weight: 800, ink: i === 4 ? LIME_INK : INK, fill: i === 4 ? LIME : '#e3f3fb', align: 'center', flash: fl(t0), p: pop(t, t0, .22, .3) }; }
    if (i === 2 && t >= TL.f5a && t < TL.ent5) return { v: '', editing: true };
  }
  if (i >= 2 && i <= 4 && j <= BAR_BASE && j > BAR_BASE - 25) {           // a count drawn as cells: 1 cell = RM80
    const b = BARS[i - 2], q = BAR_BASE - j, t0 = TL.bar[i - 2] + q * BAR_DT[i - 2];
    if (q < b.n && t >= t0) return { v: '80', size: 11, weight: 500, ink: i === 4 ? LIME_INK : '#0e3a56', fill: b.col, align: 'center', flash: fl(t0), bar: 1 };
  }
  return null;
}
const inBandBlock = (i, j) => i >= 2 && i <= 4 && j >= 16 && j <= VAL_ROW;
function sweepAt(i, j, t) {     // banded colour scale from the 2,000 cell (E45), only below row 13
  if (t < TL.sweep || j < 14 || inBandBlock(i, j)) return null;
  const d = Math.max(Math.abs(i - 4) * 1.15, Math.abs(j - VAL_ROW) * .55);
  const tr = TL.sweep + d * .045 + hash(i, j) * .03; if (t < tr) return null;
  const s = Math.min(SCALE.length - 1, Math.floor(d / 2.6));
  return { fill: SCALE[s], v: String(2000 - s * 250), tr, step: s };
}

// ---------------- selection (the hero) ----------------
function selection(t) {   // → {box:[c0,c1,r0,r1], editing, drag}
  const cell = (c, r) => [c, c, r, r];
  if (t < TL.hopC6) return { box: cell(2, ROW_A) };
  if (t < TL.hopG5) return { box: cell(2, ROW_B) };
  if (t < TL.whip0) return { box: cell(6, ROW_A) };
  if (t < TL.selD) return { box: null };
  if (t < TL.unB) return { box: cell(3, ROW_A), editing: t >= TL.typD0 && t < TL.entD };
  if (t < TL.selfR) return { box: null };
  if (t < TL.selE) return { box: cell(1, ROW_B) };
  if (t < TL.down0) return { box: cell(4, ROW_B), editing: t >= TL.fx0 && t < TL.entE };
  if (t < TL.f5a - .2) return { box: [2, 4, BAND_ROW, BAND_ROW] };
  if (t < TL.dragD0) return { box: cell(2, VAL_ROW), editing: t < TL.ent5 };
  if (t < TL.dragD1) return { box: [2, seg(t, TL.dragD0, TL.dragD1) > .5 ? 3 : 2, VAL_ROW, VAL_ROW], drag: [2, 3] };
  if (t < TL.dragE0) return { box: cell(3, VAL_ROW) };
  if (t < TL.dragE1) return { box: [3, seg(t, TL.dragE0, TL.dragE1) > .5 ? 4 : 3, VAL_ROW, VAL_ROW], drag: [3, 4] };
  if (t < TL.dis0 + .4) return { box: cell(4, VAL_ROW) };
  if (t < TL.typSub0 - .15) return { box: M.DIS, editing: t < TL.entDis };
  if (t < TL.up0) return { box: M.DIS2, editing: t < TL.entSub };
  if (t < TL.card0) return { box: null };
  return { box: M.CARD, editing: t < TL.entCard };
}

// ---------------- sheet ----------------
function drawSheet(t) {
  const z = CAM.z;
  g.save(); g.beginPath(); g.rect(ROWH_W, SHEET_Y, VW, VH); g.clip();
  rect(ROWH_W, SHEET_Y, VW, VH, '#ffffff');
  const xl = CAM.x - (VCX - ROWH_W) / z, xr = CAM.x + (W - VCX) / z, yt = CAM.y - (VCY - SHEET_Y) / z, yb = CAM.y + (SHEET_B - VCY) / z;
  let i0 = 0; while (i0 < NC && colX(i0 + 1) < xl) i0++;
  let j0 = 0; while (j0 < NR && rowY(j0 + 1) < yt) j0++;
  const light = new Path2D(), dark = new Path2D(), showVal = 11 * z >= 6.5;
  for (let i = i0; i <= NC && colX(i) < xr; i++) {
    const cw = colW(i); if (cw < .5) continue;
    const x = XC(i), w = XC(i + 1) - x, full = i < 7 ? BASE_W[i] : CW;
    for (let j = j0; j <= NR && rowY(j) < yb; j++) {
      const y = YR(j), h = YR(j + 1) - y;
      const C = cellAt(i, j, t);
      let painted = false;
      if (C && C.fill) { rect(x, y, w, h, C.fill); painted = true; }
      else if (!C || C.hdr || !C.v) {
        const S = sweepAt(i, j, t);
        if (S) { rect(x, y, w, h, S.fill); painted = true; if (t - S.tr < .12) rect(x, y, w, h, `rgba(255,255,255,${(1 - (t - S.tr) / .12) * .6})`); if (showVal && !C) text(S.v, x + w / 2, y + h / 2 + .5, `500 ${11 * z}px ${UI}`, 'rgba(23,18,10,0.28)', 'center'); }
      }
      if (C && C.flash > 0) rect(x, y, w, h, `rgba(255,255,255,${Math.min(.85, C.flash)})`);
      if (C && C.editing) rect(x, y, w, h, '#ffffff');
      const p = painted ? dark : light; p.moveTo(x + w + .5, y); p.lineTo(x + w + .5, y + h); p.moveTo(x, y + h + .5); p.lineTo(x + w, y + h + .5);
      if (C && C.v && !C.editing) {
        let s = C.v, fs = C.size * z * (C.p || 1);
        if (C.bar && !showVal) continue;
        if (cw < full - .5) { s = w < 14 * z ? (w > 8 ? '#' : '') : w < full * z * .6 ? '##' : s; }   // a column opening shows #, ##, then the value
        const f = `${C.weight} ${fs}px ${UI}`, pad = 10 * z;
        const tx = C.align === 'left' ? x + pad : C.align === 'right' ? x + w - pad : x + w / 2;
        g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
        const hash_ = s.startsWith('#');
        text(s, hash_ ? x + w / 2 : tx, y + h / 2 + fs * .04, f, C.ink, hash_ ? 'center' : C.align);
        g.restore();
      }
    }
  }
  g.lineWidth = 1; g.strokeStyle = '#dad9d3'; g.stroke(light); g.strokeStyle = 'rgba(6,4,18,0.42)'; g.stroke(dark);
  // header row of the table: a heavier rule under it; folded columns leave a darker seam in the sheet
  const [hx0, hy0, hw0, hh0] = crect(0, 6, HDR_ROW, HDR_ROW); line(hx0, hy0 + hh0 - 1, hx0 + hw0, hy0 + hh0 - 1, INK, 2);
  for (const i of [1, 3]) if (colW(i) < 1.5) { const x = XC(i) + .5; line(x, SHEET_Y, x, SHEET_B, 'rgba(40,40,40,0.22)', 1); }
  drawMerged(t); drawRefs(t); drawSelection(t);
  g.restore();
}

function drawMerged(t) {
  const z = CAM.z;
  { const [x, y, w, h] = mrect('TITLE'); rect(x, y, w, h, '#ffffff');
    const f = `800 ${26 * z}px ${UI}`; text('SSPN 2026', x + 10 * z, y + h / 2 + 1, f, INK);
    text('· Jimat cukai / tax saved (RM)', x + 10 * z + tw('SSPN 2026', f) + 10 * z, y + h / 2 + 2, `600 ${15 * z}px ${UI}`, '#6a6a64'); }
  if (t >= TL.btitle) { const [x, y, w, h] = mrect('BTITLE'), k = eo(seg(t, TL.btitle, TL.btitle + .3));
    cellBox(x, y, w * k, h, '#ffffff', INK, 1.5);
    if (k > .6) { const f = `800 ${18 * z}px ${UI}`; text('Pelepasan RM8,000 × kadar cukai', x + 12 * z, y + h / 2 + 1, f, INK); text('relief × tax band', x + w - 12 * z, y + h / 2 + 1, `600 ${12 * z}px ${UI}`, '#7a7a74', 'right'); } }
  if (t >= TL.band0) {
    for (const [k, a, b] of [['BLBL', 'Kadar cukai', 'band'], ['VLBL', 'Jimat (RM)', 'saved']]) { const [x, y, w, h] = mrect(k); cellBox(x, y, w, h, '#f4f3ee', '#b9b8b2', 1);
      text(a, x + 10 * z, y + h / 2 + 1, `700 ${15 * z}px ${UI}`, INK); text(b, x + w - 8 * z, y + h / 2 + 1, `500 ${11 * z}px ${UI}`, '#7a7a74', 'right'); }
  }
  if (t >= TL.unit) { const [x, y, w, h] = mrect('UNIT'), k = eo(seg(t, TL.unit, TL.unit + .25));
    cellBox(x, y, w, h * k, '#ffffff', INK, 1.5);
    if (k > .7) { rect(x + 10 * z, y + h / 2 - 7 * z, 22 * z, 14 * z, LIME); g.strokeStyle = 'rgba(6,4,18,0.42)'; g.lineWidth = 1; g.strokeRect(x + 10 * z, y + h / 2 - 7 * z, 22 * z, 14 * z);
      text('1 sel = RM80', x + 40 * z, y + h / 2 + 1, `800 ${16 * z}px ${UI}`, INK); } }
  if (t >= TL.dis1 - .1) {   // merged cell as stage: the deadline
    const [x, y, w, h] = mrect('DIS'), km = eio(seg(t, TL.dis1 - .1, TL.merge1 + .2));
    if (t >= TL.merge1) cellBox(x + w * (1 - km) / 2, y + h * (1 - km) / 2, w * km, h * km, '#ffffff', INK, 2.5);
    const s = typed(S_DIS, t, TL.typDis0, TL.typDis1), f = `800 ${104 * z * pop(t, TL.entDis, .22, .12)}px ${UI}`;
    if (s) text(s, x + w / 2, y + h / 2 + 6 * z, f, INK, 'center');
    if (t >= TL.entDis) text('tarikh akhir · deadline', x + w / 2, y + h - 18 * z, `600 ${15 * z}px ${UI}`, '#6a6a64', 'center');
    if (t >= TL.typSub0 - .1) {
      const [x2, y2, w2, h2] = mrect('DIS2'), k2 = eo(seg(t, TL.typSub0 - .1, TL.typSub0 + .15));
      cellBox(x2, y2, w2, h2 * k2, '#ffffff', INK, 2);
      const s2 = typed(S_SUB, t, TL.typSub0, TL.typSub1), f2 = `700 ${21 * z}px ${UI}`;
      const cut = s2.indexOf('25 Dis'); const head = cut >= 0 ? s2.slice(0, cut) : s2;
      const wFull = tw(S_SUB, f2), tx0 = x2 + (w2 - wFull) / 2;
      text(head, tx0, y2 + h2 / 2 + 1, f2, INK);
      if (cut >= 0) { const tail = s2.slice(cut), tx1 = tx0 + tw(head, f2); rect(tx1 - 4 * z, y2 + h2 * .2, tw(tail, f2) + 8 * z, h2 * .6, t >= TL.entSub ? AMBER : '#ffffff'); text(tail, tx1, y2 + h2 / 2 + 1, f2, INK); }
    }
  }
  if (t >= TL.card0) {      // end card under the two rows
    const [x, y, w, h] = mrect('CARD'), km = eio(seg(t, TL.card0, TL.card0 + .35));
    cellBox(x + w * (1 - km) / 2, y + h * (1 - km) / 2, w * km, h * km, '#ffffff', INK, 2.5);
    const s = typed(S_CARD, t, TL.typCard0, TL.typCard1), f = `800 ${29 * z * pop(t, TL.entCard, .22, .1)}px ${UI}`;
    if (s) text(s, x + 16 * z, y + h * .42, f, INK);
    if (t >= TL.entCard) { const k = eo(seg(t, TL.entCard, TL.entCard + .3)); g.globalAlpha = k; text('Want a full BM version? Comment below.', x + 16 * z, y + h * .76, `600 ${15 * z}px ${UI}`, '#5a5a54'); g.globalAlpha = 1; }
  }
  if (t >= TL.foot) { const [x, y, w, h] = mrect('FOOT'), k = eo(seg(t, TL.foot, TL.foot + .3)); g.globalAlpha = k;   // footnote: ≥ 30 px at the end zoom
    cellBox(x, y, w, h, '#f6f5f0', '#b9b8b2', 1); FOOT.forEach((s, n) => text(s, x + 16 * z, y + h * (n + .5) / 3 + 1, `600 ${FOOT_PX / Z_ALL * z}px ${UI}`, '#2a2a26')); g.globalAlpha = 1; }
}

function drawRefs(t) {
  if (t >= TL.fx0 && t < TL.entE + .05) {
    for (const [name, c, col] of [['Beneficiary', 1, AMBER], ['Deposited', 2, SKY], ['Withdrawn', 3, INDIGO]])
      if (nameDone(FX_IF, name, t, TL.fx0, TL.fx1)) { const [x, y, w, h] = crect(c, c, ROW_A, ROW_B); refBox(x, y, w, h, col); }
  }
  if (t >= TL.f5a && t < TL.ent5 + .05 && nameDone(FX_BAND(2), 'C44', t, TL.f5a, TL.f5b)) { const [x, y, w, h] = crect(2, 2, BAND_ROW, BAND_ROW); refBox(x, y, w, h, SKY); }
}

function drawSelection(t) {
  const S = selection(t); if (!S.box) return;
  const [c0, c1, r0, r1] = S.box, x = XC(c0), y = YR(r0), w = XC(c1 + 1) - x, h = YR(r1 + 1) - y;
  if (S.drag) {   // fill handle drag: a dashed preview over the target
    const [a, b] = S.drag, [dx, dy, dw, dh] = crect(a, b, r0, r1);
    g.setLineDash([6, 5]); g.lineWidth = 2.5; g.strokeStyle = INK; g.strokeRect(dx, dy, dw, dh); g.setLineDash([]);
  }
  const lw = 4; g.lineWidth = lw; g.strokeStyle = INK; g.strokeRect(x - lw / 2, y - lw / 2, w + lw, h + lw);
  const o = lw + 3; g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.strokeRect(x - o, y - o, w + 2 * o, h + 2 * o);
  g.setLineDash([8, 6]); g.lineDashOffset = -t * 60; g.strokeStyle = AMBER; g.strokeRect(x - o, y - o, w + 2 * o, h + 2 * o); g.setLineDash([]);
  const hs = 13; rect(x + w - hs / 2 + 1, y + h - hs / 2 + 1, hs, hs, INK); g.strokeStyle = AMBER; g.lineWidth = 2; g.strokeRect(x + w - hs / 2 + 1, y + h - hs / 2 + 1, hs, hs);
  if (S.editing) {    // in-cell editing: the typed text (short entries) and a blinking caret
    const z = CAM.z, f = `700 ${18 * z}px ${UI}`; let s = '';
    if (t >= TL.typD0 && t < TL.entD) s = typed('3000', t, TL.typD0, TL.typD1);
    const tx = x + 10 * z; if (s) text(s, tx, y + h / 2, f, INK);
    if (Math.floor(t * 8) % 2 === 0 && !(S.box === M.DIS || S.box === M.DIS2 || S.box === M.CARD)) rect(tx + tw(s, f) + 3, y + h * .25, 3, h * .5, INK);
  }
}

// ---------------- headers (shell, grows a little with zoom) ----------------
function drawHeaders(t) {
  const z = CAM.z, S = selection(t), top = SHEET_Y - HDR;
  rect(0, top, W, HDR, '#ecebe6');
  g.save(); g.beginPath(); g.rect(ROWH_W, top, VW, HDR); g.clip();
  const xl = CAM.x - (VCX - ROWH_W) / z, xr = CAM.x + (W - VCX) / z;
  let i0 = 0; while (i0 < NC && colX(i0 + 1) < xl) i0++;
  const fsz = Math.min(26, 18 * Math.sqrt(Math.max(1, z * .75)));
  const clue = Math.max(seg(t, TL.fold1, TL.fold1 + .2) * (1 - seg(t, TL.fold1 + .35, TL.fold1 + .6)), seg(t, TL.fold2, TL.fold2 + .2)) * (1 - seg(t, TL.unD, TL.unD + .3));
  const clueB = Math.max(clue, seg(t, TL.fold2, TL.fold2 + .2)) * (1 - seg(t, TL.unB, TL.unB + .3));
  for (let i = i0; colX(i) < xr && i < NC + 20; i++) {
    const x = XC(i), w = XC(i + 1) - x, on = S.box && i >= S.box[0] && i <= S.box[1];
    if (w >= 1) {
      if (on) rect(x, top, w, HDR, '#ffd98a');
      if (w > 18) text(colName(i), x + w / 2, top + HDR / 2 + 1, `${on ? 700 : 500} ${fsz}px ${UI}`, on ? INK : '#55554f', 'center');
      line(x + .5, top + 5, x + .5, SHEET_Y, '#c4c3bc');
    }
    if ((i === 1 || i === 3) && colW(i) < 1.5) {   // folded column: the double line is the clue
      const k = i === 1 ? clueB : clue, col = mix('#5b5b55', RED, k), lw = 1.4 + k * 2;
      line(x - 2.5, top + 3, x - 2.5, SHEET_Y - 1, col, lw); line(x + 3.5, top + 3, x + 3.5, SHEET_Y - 1, col, lw);
      if (k > .05) { g.globalAlpha = k; g.strokeStyle = RED; g.lineWidth = 3; g.beginPath(); g.ellipse(x + .5, top + HDR / 2, 30, HDR / 2 + 6, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
    }
  }
  g.restore();
  line(0, SHEET_Y - .5, W, SHEET_Y - .5, '#9a9a94');
  rect(0, SHEET_Y, ROWH_W, VH, '#ecebe6');
  g.save(); g.beginPath(); g.rect(0, SHEET_Y, ROWH_W, VH); g.clip();
  const yt = CAM.y - (VCY - SHEET_Y) / z, yb = CAM.y + (SHEET_B - VCY) / z;
  let j0 = 0; while (j0 < NR && rowY(j0 + 1) < yt) j0++;
  for (let j = j0; j <= NR && rowY(j) < yb; j++) {
    const y = YR(j), h = YR(j + 1) - y, on = S.box && j >= S.box[2] && j <= S.box[3];
    if (on) rect(0, y, ROWH_W, h, '#ffd98a');
    if (h > 11) text(String(j + 1), ROWH_W - 9, y + h / 2 + 1, `${on ? 700 : 500} ${Math.min(fsz * .9, h - 2)}px ${UI}`, on ? INK : '#5a5a54', 'right');
    line(6, y + .5, ROWH_W, y + .5, '#cfcec8');
  }
  g.restore();
  line(ROWH_W - .5, top, ROWH_W - .5, SHEET_B, '#9a9a94');
  rect(0, top, ROWH_W, HDR, '#e0dfd9'); g.fillStyle = '#a8a8a2'; g.beginPath(); g.moveTo(ROWH_W - 7, SHEET_Y - 7); g.lineTo(ROWH_W - 7, SHEET_Y - HDR + 9); g.lineTo(ROWH_W - HDR + 9, SHEET_Y - 7); g.fill();
}

// ---------------- formula bar content ----------------
function formulaLine(t) {   // → {name, parts, caret, after}
  const S = selection(t), ref = b => b ? colName(b[0]) + (b[2] + 1) : '';
  if (t < TL.hopG5) return { name: ref(S.box), parts: [['8000', INK]] };
  if (t < TL.whip0) return { name: 'G5', parts: FX_SAVED, after: '= 2,000' };
  if (t < TL.rcD) return { name: 'A1', parts: [] };
  if (t < TL.selD) return { name: 'C:E', parts: [] };
  if (t < TL.typD0) return { name: 'D5', parts: [['0', INK]] };
  if (t < TL.entD) return { name: 'D5', parts: [[typed('3000', t, TL.typD0, TL.typD1), INK]], caret: true };
  if (t < TL.undo) return { name: 'D5', parts: [['3000', RED]], after: 'what-if' };
  if (t < TL.rcB) return { name: 'D5', parts: [['0', INK]], after: t < TL.undo + 1 ? 'undo' : '' };
  if (t < TL.selE) return { name: t < TL.selfR ? 'A:C' : 'B6', parts: t < TL.selfR ? [] : [['Self', INK]] };
  if (t < TL.entE) return { name: 'E6', parts: typedParts(FX_IF, t, TL.fx0, TL.fx1), caret: t >= TL.fx0 };
  if (t < TL.down0) return { name: 'E6', parts: flat(FX_IF), after: '= 0' };
  if (t < TL.f5a) return { name: 'C44:E44', parts: t >= TL.band0 ? [['11%', INK]] : [] };
  if (t < TL.ent5) return { name: 'C45', parts: typedParts(FX_BAND(2), t, TL.f5a, TL.f5b), caret: true };
  if (t < TL.dragD1) return { name: 'C45', parts: FX_BAND(2), after: '= 880' };
  if (t < TL.dragE1) return { name: 'D45', parts: FX_BAND(3), after: '= 1,520' };
  if (t < TL.dis1) return { name: 'E45', parts: FX_BAND(4), after: '= 2,000' };
  if (t < TL.typSub0 - .15) return { name: 'A48', parts: [[typed(S_DIS, t, TL.typDis0, TL.typDis1), INK]], caret: t < TL.entDis };
  if (t < TL.up0) return { name: 'A54', parts: [[typed(S_SUB, t, TL.typSub0, TL.typSub1), INK]], caret: t < TL.entSub };
  if (t < TL.card0) return { name: '', parts: [] };
  return { name: 'A8', parts: [[typed(S_CARD, t, TL.typCard0, TL.typCard1), INK]], caret: t < TL.entCard };
}

// ---------------- shell ----------------
function appIcon(x, y, s) { rect(x, y, s, s, INK); const q = s / 3, cols = [LIME, RED, SKY, AMBER, LIME, INDIGO, '#dfe6f3', LIME, RED]; for (let n = 0; n < 9; n++) rect(x + (n % 3) * q + 1.5, y + Math.floor(n / 3) * q + 1.5, q - 3, q - 3, cols[n]); }
function arrowU(x, y, flip, col) { g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.strokeStyle = col; g.lineWidth = 2.6; g.beginPath(); g.arc(1, 3, 9, Math.PI * 1.05, Math.PI * 1.95, false); g.stroke(); tri(-8, 1.5, 5, col, 'down'); g.restore(); }
function drawChrome(t) {
  rect(0, 0, W, TITLE_H, '#dcdbd5');
  for (let n = 0; n < 3; n++) { g.fillStyle = '#c6c5bf'; g.beginPath(); g.arc(30 + n * 28, TITLE_H / 2, 9, 0, 7); g.fill(); }
  appIcon(W / 2 - 150, TITLE_H / 2 - 13, 26); text('SSPN_2026.xlsx', W / 2 - 112, TITLE_H / 2 + 1, `600 25px ${UI}`, '#2a2a26');
  text('Disimpan', W - 24, TITLE_H / 2 + 1, `500 19px ${UI}`, '#7a7a74', 'right');
  line(0, TITLE_H - .5, W, TITLE_H - .5, '#b5b4ae');
  const ty = TITLE_H; rect(0, ty, W, TOOL_H, '#f1f0eb');
  let x = 18; const m = ty + TOOL_H / 2;
  const btn = (w, draw, pressed) => { if (pressed) { rect(x, ty + 10, w, TOOL_H - 20, '#ffe2a3'); g.strokeStyle = '#c9a24f'; g.lineWidth = 1; g.strokeRect(x + .5, ty + 10.5, w - 1, TOOL_H - 21); } draw(x); x += w + 6; };
  const sep = () => { line(x + 3.5, ty + 16, x + 3.5, ty + TOOL_H - 16, '#c8c7c1'); x += 14; };
  const undoOn = t >= TL.undo - .05 && t < TL.undo + .25;
  btn(42, a => arrowU(a + 21, m, false, '#444'), undoOn); btn(42, a => arrowU(a + 21, m, true, '#444')); sep();
  btn(40, a => text('B', a + 20, m + 1, `800 24px ${UI}`, '#222', 'center')); btn(40, a => text('I', a + 20, m + 1, `italic 500 24px ${UI}`, '#222', 'center')); sep();
  btn(40, a => text('%', a + 20, m + 1, `600 24px ${UI}`, '#222', 'center')); btn(40, a => text('Σ', a + 20, m + 1, `600 26px ${UI}`, '#222', 'center')); sep();
  const mergeOn = (t >= TL.merge1 - .05 && t < TL.merge1 + .3) || (t >= TL.card0 - .05 && t < TL.card0 + .3);
  btn(118, a => { g.strokeStyle = '#333'; g.lineWidth = 1.6; g.strokeRect(a + 10.5, m - 11.5, 30, 23); line(a + 16, m, a + 35, m, '#333', 1.6); tri(a + 18, m, 4, '#333', 'left'); tri(a + 33, m, 4, '#333', 'right'); text('Merge', a + 50, m + 1, `500 20px ${UI}`, '#222'); }, mergeOn); sep();
  const cfOn = (t >= TL.entD && t < TL.entD + .4) || (t >= TL.entE && t < TL.entE + .4) || (t >= TL.sweep && t < TL.pull1);
  btn(300, a => { [LIME, RED, AMBER, SKY, INDIGO].forEach((c, n) => rect(a + 10 + n * 8, m - 12, 8, 24, c)); text('Format bersyarat', a + 62, m + 1, `500 20px ${UI}`, '#222'); tri(a + 284, m, 5, '#666'); }, cfOn);
  line(0, ty + TOOL_H - .5, W, ty + TOOL_H - .5, '#c8c7c1');

  // formula bar: name box, ✕ ✓ fx, a two-line box (the film's dialogue)
  const fy = FBAR_Y; rect(0, fy, W, FBAR_H, '#f8f7f3');
  const F = formulaLine(t);
  rect(14, fy + 14, 150, 48, '#fff'); g.strokeStyle = '#b3b2ac'; g.lineWidth = 1; g.strokeRect(14.5, fy + 14.5, 149, 47);
  text(F.name || '', 28, fy + 39, `700 23px ${UI}`, INK); tri(148, fy + 39, 5, '#777');
  const cm = fy + 39; g.strokeStyle = '#b03030'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(180, cm - 8); g.lineTo(196, cm + 8); g.moveTo(196, cm - 8); g.lineTo(180, cm + 8); g.stroke();
  g.strokeStyle = '#2a7a3a'; g.beginPath(); g.moveTo(208, cm); g.lineTo(215, cm + 7); g.lineTo(229, cm - 8); g.stroke();
  text('fx', 214, fy + 86, `italic 700 24px ${UI}`, '#333', 'center');
  const bx = 246; rect(bx, fy + 8, W - bx - 12, FBAR_H - 16, '#fff'); g.strokeStyle = '#b3b2ac'; g.strokeRect(bx + .5, fy + 8.5, W - bx - 13, FBAR_H - 17);
  const ff = `600 33px ${UI}`; let fx = bx + 16, ly = fy + 37;
  for (const [s, col] of F.parts) { if (s === '\n') { fx = bx + 16 + tw('=IF(', ff); ly += 44; continue; } text(s, fx, ly, ff, col); fx += tw(s, ff); }
  if (F.caret && Math.floor(t * 8) % 2 === 0) rect(fx + 3, ly - 19, 3, 38, INK);
  if (F.after) text(F.after, fx + 22, ly + 1, `600 26px ${UI}`, '#8a8a84');
  line(0, fy + FBAR_H - .5, W, fy + FBAR_H - .5, '#b5b4ae');

  // sheet tabs + status bar
  const by = SHEET_B; rect(0, by, W, TABS_H, '#e5e4de'); line(0, by + .5, W, by + .5, '#9a9a94');
  tri(24, by + TABS_H / 2, 7, '#888', 'left'); tri(50, by + TABS_H / 2, 7, '#888', 'right');
  let tx = 76;
  for (const [name, on] of [['SSPN 2026', true], ['Nota', false], ['+', false]]) {
    const f = `${on ? 700 : 500} 21px ${UI}`, w = tw(name, f) + 40;
    if (on) { rect(tx, by, w, TABS_H - 4, '#fff'); line(tx, by + TABS_H - 4, tx + w, by + TABS_H - 4, AMBER, 4); }
    text(name, tx + w / 2, by + TABS_H / 2, f, on ? INK : '#555', 'center'); line(tx + w + .5, by + 10, tx + w + .5, by + TABS_H - 10, '#b5b4ae'); tx += w;
  }
  const sy = by + TABS_H, sm = sy + STAT_H / 2 + 1; rect(0, sy, W, STAT_H, INK);
  let mode = 'Ready', msg = '';
  const nBar = k => { const t0 = TL.bar[k]; return t < t0 ? 0 : Math.min(BARS[k].n, Math.floor((t - t0) / BAR_DT[k]) + 1); };
  if (t < TL.whip0) msg = 'Aisyah RM2,000  ·  Ali RM0';
  else if (t < TL.rcD) msg = t >= TL.hidMsg ? '2 lajur tersembunyi · 2 hidden columns' : '';
  else if (t < TL.selD) { mode = 'Recalc'; msg = 'Unhide: Withdrawn'; }
  else if (t < TL.entD) { mode = t >= TL.typD0 ? 'Edit' : 'Ready'; }
  else if (t < TL.undo) msg = 'What-if: Withdrawn 3,000 → Relief 5,000';
  else if (t < TL.rcB) msg = 'Buat asal · Undo';
  else if (t < TL.selE) { mode = 'Recalc'; msg = 'Unhide: Beneficiary'; }
  else if (t < TL.entE) mode = t >= TL.fx0 ? 'Edit' : 'Ready';
  else if (t < TL.down0) msg = 'Beneficiary = "Self"  →  Relief 0';
  else if (t < TL.ent5) mode = t >= TL.f5a ? 'Edit' : 'Ready';
  else if (t < TL.sweep) { mode = 'Recalc'; const k = t >= TL.bar[2] ? 2 : t >= TL.bar[1] ? 1 : 0; msg = `Kiraan · Count  ${nBar(k)}  ·  1 sel = RM80`; }
  else if (t < TL.pull1 + .2) { mode = 'Recalc'; msg = 'Colour scale from E45'; }
  else if (t < TL.dis1) msg = '';
  else if (t < TL.entDis) { mode = t >= TL.typDis0 ? 'Edit' : 'Ready'; msg = t < TL.typDis0 ? 'Merge A48:G53' : ''; }
  else if (t < TL.typSub0) msg = '';
  else if (t < TL.entSub) mode = 'Edit';
  else if (t < TL.card0) msg = '';
  else if (t < TL.entCard) { mode = t >= TL.typCard0 ? 'Edit' : 'Ready'; msg = t < TL.typCard0 ? 'Merge A8:G11' : ''; }
  rect(0, sy, 110, STAT_H, mode === 'Recalc' ? AMBER : mode === 'Ready' ? INK : '#3a3326');
  text(mode, 55, sm, `700 19px ${UI}`, mode === 'Recalc' ? INK : '#fff', 'center');
  text(msg, 128, sm, `500 20px ${UI}`, 'rgba(255,255,255,0.86)');
  const zx = W - 300, zk = clamp((Math.log(CAM.z) - Math.log(.4)) / (Math.log(3.2) - Math.log(.4)));
  line(zx + 20, sm, zx + 190, sm, 'rgba(255,255,255,0.4)', 3); rect(zx + 20 + 170 * zk - 5, sy + 16, 10, STAT_H - 32, AMBER);
  text(Math.round(CAM.z * 100) + '%', W - 22, sm, `700 20px ${UI}`, '#fff', 'right');
}

// ---------------- cursor + context menu (screen space) ----------------
const foldX = i => XC(i), hdrMid = () => SHEET_Y - HDR / 2;
const MENU = ['Cut', 'Copy', 'Paste', '—', 'Insert', 'Delete', 'Hide', 'Unhide'];
function menuAt(t) { for (const [rc, un, col] of [[TL.rcD, TL.unD, 3], [TL.rcB, TL.unB, 1]]) if (t >= rc && t < un + .1) return { rc, un, x: foldX(col) + 8, y: hdrMid() + 8 }; return null; }
function drawMenu(t) {
  const Mn = menuAt(t); if (!Mn) return;
  const k = eo(seg(t, Mn.rc, Mn.rc + .1)), w = 280, ih = 46, h = MENU.length * ih + 14;
  g.save(); g.globalAlpha = k;
  rect(Mn.x, Mn.y, w, h * (.6 + .4 * k), '#fbfbf9'); g.strokeStyle = '#8f8e88'; g.lineWidth = 1.5; g.strokeRect(Mn.x + .5, Mn.y + .5, w - 1, h * (.6 + .4 * k) - 1);
  MENU.forEach((s, n) => {
    const iy = Mn.y + 7 + n * ih;
    if (s === '—') { line(Mn.x + 14, iy + ih / 2, Mn.x + w - 14, iy + ih / 2, '#d0cfc9'); return; }
    const hi = s === 'Unhide' && t >= Mn.rc + .18;
    if (hi) rect(Mn.x + 5, iy, w - 10, ih, t >= Mn.un - .02 ? AMBER : '#ffe2a3');
    text(s, Mn.x + 24, iy + ih / 2 + 1, `${hi ? 700 : 500} 25px ${UI}`, hi ? INK : '#333');
  });
  g.restore();
}
function cursorAt(t) {   // → {x, y, kind, down}
  const cellC = (c, r) => [X(colXf(c)), Y(rowYf(r))];
  const menuItem = (col, un) => [foldX(col) + 8 + 120, hdrMid() + 8 + 7 + 7 * 46 + 23];
  const K = [
    [0, () => cellC(2.88, ROW_A + .85), 'cross'], [TL.hopC6 - .25, () => cellC(2.88, ROW_A + .85), 'cross'], [TL.hopC6, () => cellC(2.88, ROW_B + .85), 'cross'],
    [TL.hopG5 - .3, () => cellC(2.88, ROW_B + .85), 'cross'], [TL.hopG5, () => cellC(6.25, ROW_A + .9), 'cross'], [TL.whip0, () => cellC(6.25, ROW_A + .9), 'cross'],
    [TL.rcD - .05, () => [foldX(3), hdrMid()], 'arrow'], [TL.rcD + .18, () => menuItem(3), 'arrow'], [TL.unD, () => menuItem(3), 'arrow'],
    [TL.selD, () => cellC(3.85, ROW_A + .85), 'cross'], [TL.entD - .05, () => cellC(3.85, ROW_A + .85), 'cross'], [TL.entD + .3, () => cellC(3.6, ROW_B + 1.6), 'cross'], [TL.undo + .2, () => cellC(3.6, ROW_B + 1.6), 'cross'],
    [TL.rcB - .05, () => [foldX(1), hdrMid()], 'arrow'], [TL.rcB + .18, () => menuItem(1), 'arrow'], [TL.unB, () => menuItem(1), 'arrow'],
    [TL.selfR, () => cellC(1.85, ROW_B + .85), 'cross'], [TL.selE, () => cellC(4.85, ROW_B + .85), 'cross'], [TL.entE - .05, () => cellC(4.85, ROW_B + .85), 'cross'], [TL.entE + .3, () => cellC(4.6, ROW_B + 2.2), 'cross'], [TL.down0, () => cellC(4.6, ROW_B + 2.2), 'cross'],
    [TL.f5a - .2, () => cellC(2.85, VAL_ROW + .85), 'cross'], [TL.dragD0 - .2, () => cellC(2.99, VAL_ROW + .98), 'cross'],
    [TL.dragD0, () => cellC(2.99, VAL_ROW + .98), 'plus'], [TL.dragD1, () => cellC(3.99, VAL_ROW + .98), 'plus'], [TL.dragE0, () => cellC(3.99, VAL_ROW + .98), 'plus'], [TL.dragE1, () => cellC(4.99, VAL_ROW + .98), 'plus'],
    [TL.dragE1 + .6, () => cellC(5.6, VAL_ROW + 1.6), 'cross'],
  ];
  if (t > K[K.length - 1][0] + .5) return null;
  let q = 0; while (q < K.length - 2 && t > K[q + 1][0]) q++;
  const A = K[q], B = K[q + 1], u = eio(seg(t, A[0], B[0])), a = A[1](), b = B[1]();
  const down = [TL.rcD, TL.unD, TL.rcB, TL.unB, TL.selD, TL.selfR, TL.selE].some(tc => t >= tc && t < tc + .12) || (t >= TL.dragD0 && t < TL.dragD1) || (t >= TL.dragE0 && t < TL.dragE1);
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), kind: t < B[0] ? B[2] : A[2], down };
}
function drawCursor(t) {
  const C = cursorAt(t); if (!C) return;
  g.save(); g.translate(C.x, C.y); const s = C.down ? .86 : 1; g.scale(s * 1.4, s * 1.4);
  if (C.kind === 'cross') { g.fillStyle = INK; g.fillRect(-15, -5.5, 30, 11); g.fillRect(-5.5, -15, 11, 30); g.fillStyle = '#fff'; g.fillRect(-13, -3.5, 26, 7); g.fillRect(-3.5, -13, 7, 26); }
  else if (C.kind === 'plus') { g.fillStyle = INK; g.fillRect(-11, -1.75, 22, 3.5); g.fillRect(-1.75, -11, 3.5, 22); }
  else { g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 26); g.lineTo(7, 20); g.lineTo(12, 31); g.lineTo(17, 29); g.lineTo(12, 18); g.lineTo(21, 18); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
  g.restore();
}

// ---------------- subtitles: a cell comment, lower left ----------------
const SUB_BM = `700 37px ${UI}`, SUB_EN = `500 25px ${UI}`;
function drawSubs(t) {
  const L = SUBS.find(s => t >= s.t0 && t < s.t1); if (!L) return;
  const k = Math.min(seg(t, L.t0, L.t0 + .1), 1 - seg(t, L.t1 - .08, L.t1));
  const w = Math.max(tw(L.bm, SUB_BM), tw(L.en, SUB_EN)) + 48, x = NOTE_X, y = NOTE_Y;
  g.save(); g.globalAlpha = k;
  rect(x, y, w, NOTE_H, NOTE); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, NOTE_H - 2);
  g.fillStyle = RED; g.beginPath(); g.moveTo(x + w - 18, y + 2); g.lineTo(x + w - 2, y + 2); g.lineTo(x + w - 2, y + 18); g.fill();
  text(L.bm, x + 24, y + 46, SUB_BM, INK); text(L.en, x + 24, y + 92, SUB_EN, '#3a3a34');
  g.restore();
}
export const subWidth = s => Math.max(tw(s.bm, SUB_BM), tw(s.en, SUB_EN)) + 48;

// ---------------- render ----------------
export function render(ctx, t, opt = {}) {
  g = ctx; setup(t);
  rect(0, 0, W, H, '#1a1a1a');
  drawSheet(t); drawHeaders(t); drawChrome(t); drawMenu(t); drawCursor(t);
  if (!opt.nosub) drawSubs(t);
}
// thumbnail: the same cell language, drawn big; every piece of text sits inside the centre 1080×1440 (y 240–1680)
export function thumb(ctx) {
  g = ctx; const cw = 180, ch = 60, x0 = -30, y0 = 0;
  rect(0, 0, W, H, '#ffffff');
  const light = new Path2D(), dark = new Path2D();
  for (let i = 0; i * cw + x0 < W; i++) for (let j = 0; j * ch < H; j++) {
    const x = x0 + i * cw, y = y0 + j * ch, d = Math.max(Math.abs(i - 2.7) * 1.1, Math.abs(j - 16) * .5);
    const edge = j < 4 || j > 28;                                 // colour-scale bands top and bottom, white in the middle
    if (edge) { rect(x, y, cw, ch, SCALE[Math.min(SCALE.length - 1, Math.floor(d / 2.2))]); dark.rect(x + .5, y + .5, cw, ch); } else light.rect(x + .5, y + .5, cw, ch);
  }
  g.lineWidth = 1.5; g.strokeStyle = '#dad9d3'; g.stroke(light); g.strokeStyle = 'rgba(6,4,18,0.35)'; g.stroke(dark);
  const L = 60, Wd = W - 2 * L;
  // merged title cell
  cellBox(L, 300, Wd, 150, '#ffffff', INK, 4);
  text('SSPN · sebelum 31 Dis', W / 2, 377, `800 78px ${UI}`, INK, 'center');
  // the two results
  const cell = (y, fill, label, v, ink, sub) => {
    rect(L, y, Wd, 330, fill); g.lineWidth = 2; g.strokeStyle = 'rgba(6,4,18,0.55)'; g.strokeRect(L + 1, y + 1, Wd - 2, 328);
    text(label, L + 36, y + 50, `700 44px ${UI}`, ink); text(sub, L + Wd - 36, y + 50, `600 34px ${UI}`, ink, 'right');
    text(v, W / 2, y + 196, `800 178px ${UI}`, ink, 'center');
  };
  cell(520, LIME, 'Aisyah', 'RM2,000', LIME_INK, 'Child');
  cell(900, RED, 'Ali', 'RM0', '#ffffff', 'Self');
  // the hero selection on the winner
  const lw = 8; g.lineWidth = lw; g.strokeStyle = INK; g.strokeRect(L - lw / 2, 520 - lw / 2, Wd + lw, 330 + lw);
  g.setLineDash([16, 12]); g.lineWidth = 4; g.strokeStyle = AMBER; g.strokeRect(L - 16, 520 - 16, Wd + 32, 362); g.setLineDash([]);
  rect(L + Wd - 12, 520 + 330 - 12, 26, 26, INK); g.strokeStyle = AMBER; g.lineWidth = 4; g.strokeRect(L + Wd - 12, 520 + 330 - 12, 26, 26);
  // a formula bar strip, the film's question
  cellBox(L, 1300, Wd, 110, '#f8f7f3', '#9a9a94', 2);
  text('fx', L + 40, 1356, `italic 700 40px ${UI}`, '#333', 'center');
  const f = `600 40px ${UI}`; let fx = L + 90;
  for (const [s, c] of [['=IF(', INK], ['Beneficiary', AMBER_INK], ['="Self",0,…)', INK]]) { text(s, fx, 1356, f, c); fx += tw(s, f); }
  text('Sama RM8,000. Kenapa beza?', W / 2, 1500, `800 60px ${UI}`, INK, 'center');
  text('Same RM8,000. Why the difference?', W / 2, 1572, `600 38px ${UI}`, '#3a3a34', 'center');
}

// ---------------- events for the mix ----------------
function buildEvents() {
  EV.length = 0;
  const add = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });
  const keys = (n, a, b) => { for (let q = 0; q < n; q++) add(a + (b - a) * q / n, 'key'); };
  add(TL.flash0, 'enter', { soft: 1 }); add(TL.flash0, 'blip', { n: 0 }); add(TL.flash0 + .03, 'blip', { n: 1 });
  add(TL.hopC6, 'hop'); add(TL.hopG5, 'hop'); add(TL.hopG5, 'pop');
  add(TL.cut1, 'cue', { name: 'silence1' }); add(TL.whip0, 'whoosh'); add(TL.fold1, 'tick'); add(TL.fold2, 'tick'); add(TL.hidMsg, 'pop');
  for (const [rc, un] of [[TL.rcD, TL.unD], [TL.rcB, TL.unB]]) { add(rc, 'click'); add(rc + .03, 'menu'); add(un, 'click'); for (let q = 0; q < 4; q++) add(un + .05 + q * UNW / 4, 'ratchet', { n: q }); }
  add(TL.selD, 'hop'); keys(4, TL.typD0, TL.typD1); add(TL.entD, 'enter'); add(TL.entD + .02, 'error'); add(TL.recE, 'blip', { n: 2 }); add(TL.recG, 'blip', { n: 1 });
  add(TL.undo, 'undo');
  add(TL.selfR, 'error', { soft: 1 }); add(TL.selE, 'hop'); keys(flat(FX_IF).filter(x => x[0] !== '\n').length, TL.fx0, TL.fx1);
  add(TL.cut2, 'cue', { name: 'silence2' }); add(TL.entE, 'enter', { big: 1 }); add(TL.entE + .02, 'error'); add(TL.recG6, 'blip', { n: 0 });
  add(TL.down0, 'whoosh', { soft: 1 }); add(TL.btitle, 'pop'); for (let q = 0; q < 3; q++) add(TL.band0 + q * .14, 'blip', { n: q + 3 });
  keys(9, TL.f5a, TL.f5b); add(TL.ent5, 'enter'); add(TL.unit, 'pop');
  add(TL.dragD0, 'drag'); add(TL.dragD1, 'click'); add(TL.dragE0, 'drag'); add(TL.dragE1, 'click');
  BARS.forEach((b, k) => { for (let q = 0; q < b.n; q++) add(TL.bar[k] + q * BAR_DT[k], 'cell', { k, q, n: b.n }); add(TL.bar[k] + (b.n - 1) * BAR_DT[k], k === 2 ? 'ding' : 'pop'); });
  for (let s = 0; s < SCALE.length; s++) add(TL.sweep + s * 2.6 * .045, 'ring', { n: s });
  add(TL.dis0, 'whoosh'); add(TL.merge1, 'merge'); keys(S_DIS.length, TL.typDis0, TL.typDis1); add(TL.entDis, 'enter', { big: 1 });
  keys(S_SUB.length, TL.typSub0, TL.typSub1); add(TL.entSub, 'enter');
  add(TL.up0, 'whoosh'); add(TL.card0, 'merge'); keys(S_CARD.length, TL.typCard0, TL.typCard1); add(TL.entCard, 'enter'); add(TL.foot, 'pop'); add(TL.ding, 'ding', { final: 1 });
  for (const [id, s] of VO) add(s, 'vo', { id });
  EV.sort((a, b) => a.t - b.t);
}

// ---------------- reading-time check: texts the viewer is meant to read (merged cells, the key numbers) ----------------
export function texts(t) {
  setup(t); const out = [], put = (id, s, b) => { const [x, y, w, h] = b; out.push({ id, text: s, x0: x, y0: y, x1: x + w, y1: y + h }); };
  put('saveA', whatIf(t) && t >= TL.recG ? 'RM1,250' : 'RM2,000', crect(6, 6, ROW_A, ROW_A)); put('saveB', 'RM0', crect(6, 6, ROW_B, ROW_B));
  if (t >= TL.btitle + .3) put('btitle', 'Pelepasan RM8,000 × kadar cukai', mrect('BTITLE'));
  BARS.forEach((b, k) => { const t0 = [TL.ent5, TL.dragD1, TL.dragE1][k]; if (t >= t0) put('val' + k, fmt(b.val), crect(b.c, b.c, VAL_ROW, VAL_ROW)); });
  if (t >= TL.unit + .25) put('unit', '1 sel = RM80', mrect('UNIT'));
  if (t >= TL.entDis) put('dis', '31 DIS', mrect('DIS'));
  if (t >= TL.typSub1) put('dis2', S_SUB, mrect('DIS2'));
  if (t >= TL.typCard1) put('card', S_CARD, mrect('CARD'));
  if (t >= TL.foot + .3) out.push({ ...(([x, y, w, h]) => ({ x0: x, y0: y, x1: x + w, y1: y + h }))(mrect('FOOT')), id: 'foot', text: FOOT.join(' '), pass: true });   // fine print: held ≥ 2 s, not timed for a full read
  return out;
}

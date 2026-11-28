// UPKK 2027 film: every frame is a pure function of time. Scenes read config/upkk-2027.json.
// Characters step at 12 fps (pose sampled at floor(t*12)/12); camera, text and paper props move every frame.
import { compose } from '../characters/lib/rig.js';
import { paperDefs, piece } from '../characters/lib/paper.js';

// ---------- small helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inOut = (k) => (k = clamp(k), k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const outCubic = (k) => 1 - (1 - clamp(k)) ** 3;
const backOut = (k, s = 2.2) => (k = clamp(k), 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2);
const stepT = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// paper "pop": 0 before t0, overshoot, settle. Stepped like a hand-moved cut-out.
const popK = (t, t0, d = 0.3) => (t < t0 ? 0 : backOut(stepT(t - t0) / d, 2.6));
// slide in from an offset, smooth (text and cards move every frame)
const slideK = (t, t0, d = 0.45) => outCubic((t - t0) / d);

export function createFilm({ brand, cfg, C, rigs, measure }) {
  const W = cfg.format.width, H = cfg.format.height, FPS = cfg.format.fps;
  const SZ = cfg.safe_zone;
  const CX = (SZ.x0 + SZ.x1) / 2; // centre of the safe zone, not of the frame (keeps clear of the right-hand buttons)
  const SAFE_W = SZ.x1 - SZ.x0;
  const contact = brand.contact;
  const fill = (s) => s.replace('{whatsapp_display}', contact.whatsapp_display).replace('{website}', contact.website);
  const scenes = cfg.scenes.map((s) => ({ ...s, t0: s.timing.start_frame / FPS, t1: s.timing.end_frame / FPS }));
  const byId = Object.fromEntries(scenes.map((s) => [s.id, s]));
  const txt = (id, role, k = 0) => fill(byId[id].on_screen_text.filter((x) => x.role === role)[k].text);

  // ---------- type ----------
  const FONT = (w, s) => `${w} ${s}px Montserrat`;
  // largest size <= max that fits maxW, wrapping at spaces if even min does not fit on one line
  function fit(text, { max, min, maxW = SAFE_W - 24, weight = 800 }) {
    for (let s = max; s >= min; s -= 2) if (measure(text, FONT(weight, s)) <= maxW) return { size: s, lines: [text] };
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (measure(next, FONT(weight, min)) <= maxW || !cur) cur = next; else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    let size = min;
    for (let s = max; s >= min; s -= 2) if (lines.every((l) => measure(l, FONT(weight, s)) <= maxW)) { size = s; break; }
    return { size, lines };
  }
  // essential text: navy (or given colour), lifted paper letters. data-essential feeds the safe-zone check.
  const T = (s, x, y, { size, weight = 800, fill: f = C.navy, anchor = 'middle', ls = 0, lift = true } = {}) => {
    const t = `<text data-essential="text" x="${x}" y="${y}" font-family="Montserrat" font-size="${size}" font-weight="${weight}" fill="${f}" text-anchor="${anchor}" letter-spacing="${ls}">${esc(s)}</text>`;
    return lift ? `<g filter="url(#pp-lift)">${t}</g>` : t;
  };
  const block = (text, x, y, opt) => {
    const f = fit(text, opt);
    const lh = f.size * (opt.lh || 1.08);
    return { svg: f.lines.map((l, i) => T(l, x, y + i * lh, { ...opt, size: f.size })).join(''), h: lh * f.lines.length, size: f.size, lines: f.lines };
  };
  // navy pill badge with cream letters
  const badge = (s, x, y, size = 48) => {
    const w = measure(s, FONT(800, size)) + size * 1.3, h = size * 1.7;
    return piece(`<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.navy}"/>`) +
      T(s, x, y + size * 0.36, { size, fill: C.cream, ls: 2, lift: false });
  };
  const at = (svg, x, y, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${svg}</g>`;
  const fig = (rig, pose, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#pp-drop)">${compose(rig, pose).svg}</g>`;
  const logo = (x, y, size) => `<image data-essential="logo" href="../assets/oclc-logo.png" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  const layer = (svg) => `<g filter="url(#pp-drop)">${svg}</g>`;
  const noProps = (p) => ({ ...p, props: [] });
  const P = rigs.poses;

  // ---------- set pieces ----------
  const desk = () =>
    piece(`<rect x="90" y="1240" width="900" height="190" rx="14" fill="${C.kraft}"/>`) +
    piece(`<rect x="70" y="1418" width="940" height="34" rx="10" fill="${C.kraft_deep}"/>`) +
    piece(`<rect x="110" y="1452" width="860" height="300" rx="8" fill="${C.kraft_deep}"/>`) +
    piece(`<rect x="370" y="1500" width="340" height="110" rx="10" fill="${C.kraft}"/>`) +
    piece(`<rect x="505" y="1546" width="70" height="16" rx="8" fill="${C.navy}"/>`);
  const lines = (x0, x1, ys) => ys.map((y) => `<path d="M${x0},${y} L${x1},${y}" stroke="#C8D0DE" stroke-width="2.4" stroke-linecap="round"/>`).join('');
  // open Jawi workbook: real Jawi as live text (joins correctly); the other page has plain lines only
  const workbook = () =>
    piece(`<rect x="330" y="1268" width="420" height="136" rx="8" fill="${C.teal}"/>`) +
    piece(`<rect x="342" y="1276" width="194" height="120" rx="4" fill="${C.white_card}"/><rect x="544" y="1276" width="194" height="120" rx="4" fill="${C.white_card}"/>` +
      lines(566, 716, [1306, 1330, 1354, 1378])) +
    `<text class="jawi" x="439" y="1352" font-family="Noto Naskh Arabic" font-size="62" font-weight="700" fill="${C.navy}" text-anchor="middle" direction="rtl">${byId.hook.jawi[0]}</text>`;
  const cup = () =>
    piece(`<rect x="826" y="1170" width="14" height="110" rx="4" fill="${C.gold}" transform="rotate(-10 833 1280)"/>`) +
    piece(`<rect x="852" y="1160" width="14" height="120" rx="4" fill="${C.navy}" transform="rotate(8 859 1280)"/>`) +
    piece(`<path d="M800,1222 L900,1222 L890,1320 Q888,1330 878,1330 L822,1330 Q812,1330 810,1320 Z" fill="${C.teal}"/>`);
  const deskStack = () =>
    piece(`<rect x="130" y="1296" width="150" height="30" rx="5" fill="${C.navy}"/>`) +
    piece(`<rect x="140" y="1266" width="132" height="30" rx="5" fill="${C.baju_teal_deep}"/>`) +
    piece(`<rect x="134" y="1238" width="140" height="28" rx="5" fill="${C.white_card}" stroke="${C.navy}" stroke-width="2.4"/>`);
  const shelf = () =>
    piece(`<rect x="70" y="520" width="250" height="20" rx="4" fill="${C.kraft_deep}"/>`) +
    piece(`<rect x="96" y="418" width="34" height="102" rx="4" fill="${C.teal}"/>`) +
    piece(`<rect x="134" y="436" width="30" height="84" rx="4" fill="${C.navy}"/>`) +
    piece(`<rect x="168" y="408" width="36" height="112" rx="4" fill="${C.white_card}" stroke="${C.navy}" stroke-width="2.4"/>`);
  const disc = (cx, cy, r) => piece(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#E3F2EF"/>`);
  const qmark = (navy = true) => rigs.boy.props[navy ? 'qmark' : 'qmarkTeal'].svg;
  const star = () => rigs.boy.props.star.svg;
  const book = (w, h, fillC, band, label, labelFill, size = 50) =>
    piece(`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="8" fill="${fillC}"${fillC === C.white_card ? ` stroke="${C.navy}" stroke-width="3"` : ''}/>` +
      `<rect x="${-w / 2 + 22}" y="${-h}" width="12" height="${h}" fill="${band}"/><rect x="${w / 2 - 34}" y="${-h}" width="12" height="${h}" fill="${band}"/>`) +
    (label ? T(label, 0, -h / 2 + size * 0.36, { size, fill: labelFill, weight: 800 }) : '');
  // school-holiday calendar: rings + an empty grid. No month, no dates.
  const calendar = (w, h, ticks = false, tickK = 1) => {
    const g = [];
    const cols = 7, rows = 4, pad = 26, top = 92;
    const cw = (w - pad * 2) / cols, ch = (h - top - pad) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      g.push(`<rect x="${pad + c * cw + 5}" y="${top + r * ch + 5}" width="${cw - 10}" height="${ch - 10}" rx="6" fill="${C.cream}"/>`);
    }
    const tk = [];
    if (ticks) {
      let n = 0;
      for (let r = 0; r < rows; r++) for (const c of [1, 3, 5]) {
        if (n++ >= Math.round(12 * tickK)) continue;
        const x = pad + c * cw + cw / 2, y = top + r * ch + ch / 2;
        tk.push(`<path d="M${x - 14},${y} l9,10 l18,-20" fill="none" stroke="${C.gold}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
    }
    return piece(`<rect x="0" y="0" width="${w}" height="${h}" rx="16" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>` +
      `<rect x="0" y="0" width="${w}" height="70" rx="16" fill="${C.teal}"/><rect x="0" y="40" width="${w}" height="30" fill="${C.teal}"/>`) +
      piece(`<rect x="${w * 0.28 - 8}" y="-18" width="16" height="46" rx="8" fill="${C.navy}"/><rect x="${w * 0.72 - 8}" y="-18" width="16" height="46" rx="8" fill="${C.navy}"/>`, { small: true }) +
      piece(g.join(''), { small: true, lift: false }) + tk.map((s) => piece(s, { small: true })).join('');
  };

  // ======================= scenes =======================
  // each returns { cam:{s,fx,fy,dx,dy}, world, ui }  (lt = local time, D = scene length)
  const S = {};

  S.hook = (lt, D) => {
    const ts = stepT(lt);
    const scratch = Math.floor(ts * 12) % 4 < 2 ? 0 : 1;
    const pose = { ...noProps(P.boy.confused) };
    pose.reach = { armL: { ...P.boy.confused.reach.armL, hand: 158 + scratch * 14 } };
    pose.rot = { ...P.boy.confused.rot, head: -12 + (Math.floor(ts * 12) % 8 < 4 ? 0 : 1.5) };
    const qs = [[0.35, 250, 760, 1.8, -14, true], [0.75, 800, 720, 1.9, 12, true], [1.15, 870, 860, 1.3, 22, false]];
    const marks = qs.map(([t0, x, y, s, r, navy]) => {
      const k = popK(lt, t0);
      const bob = Math.sin(stepT(lt) * 5 + x) * 6 * (k > 0 ? 1 : 0);
      return k > 0 ? at(piece(qmark(navy)), x, y + bob, s * k, r) : '';
    }).join('');
    const world =
      layer(disc(560, 900, 330)) +
      layer(piece(`<rect x="378" y="1010" width="324" height="300" rx="34" fill="${C.kraft_deep}"/>`)) +
      fig(rigs.boy, pose, 540, 1280 + 194 * 1.6, 1.6) +
      layer(desk() + workbook() + cup() + deskStack() + at(piece(rigs.boy.props.pencil.svg), 196, 1428, 1.3, -6)) +
      layer(marks);
    const l1 = block(txt('hook', 'headline', 0), CX, 300, { max: 84, min: 64 });
    const k1 = slideK(lt, 0.15), k2 = popK(lt, 0.55, 0.32);
    const l2 = block(txt('hook', 'headline', 1), CX, 300 + l1.h + 112, { max: 150, min: 64 });
    const ulw = measure(l2.lines[0], FONT(800, l2.size)) * outCubic((lt - 1.0) / 0.4);
    const ui =
      `<g transform="translate(0 ${(1 - k1) * -60})" opacity="${k1 > 0 ? 1 : 0}">${l1.svg}</g>` +
      (k2 > 0 ? `<g transform="translate(${CX} ${300 + l1.h + 70}) scale(${k2}) translate(${-CX} ${-(300 + l1.h + 70)})">${l2.svg}</g>` : '') +
      (ulw > 1 ? piece(`<rect x="${CX - ulw / 2}" y="${300 + l1.h + 140}" width="${ulw}" height="12" rx="6" fill="${C.gold}"/>`, { small: true }) : '');
    return { cam: { s: lerp(1, 1.1, inOut(lt / D)), fx: 540, fy: 1060 }, world, ui,
      events: [...qs.map(([t0]) => ({ t: t0, type: 'pop' })), { t: 0.15, type: 'slide' }, { t: 0.55, type: 'pop', v: 0.8 }, { t: 1.0, type: 'slide', v: 0.5 }] };
  };

  S.curiosity = (lt, D) => {
    const kKlik = outCubic((lt - 0.1) / 0.6);
    const klikPose = lt > 0.9 ? noProps(P.klik.tap) : noProps(P.klik.neutral);
    if (lt > 0.9 && lt < 1.3) klikPose.props = P.klik.tap.props;
    const fold = clamp((lt - 1.3) / 1.2);
    const books = [[C.teal, C.navy], [C.navy, C.teal]].map(([f, b], i) => {
      const k = popK(lt, 2.0 + i * 0.35);
      return k > 0 ? at(book(230, 64, f, b), 545, 1590 - i * 66, k, i ? 2 : -1.5) : '';
    }).join('');
    // the calendar's pages flip up and fold away, and two books drop out of it: "2 pilihan"
    const cy0 = 1250 + fold * 160;
    const cal = fold < 1 ? at(calendar(300, 300), 390, cy0) : '';
    const flip = Math.floor(stepT(lt - 1.3) * 12) % 3; // a fresh page every few steps
    const page = fold > 0 && fold < 1 ? `<g transform="translate(390 ${cy0}) scale(1 ${1 - ((fold * 3) % 1)})">` +
      piece(`<rect x="0" y="0" width="300" height="300" rx="16" fill="${[C.white_card, C.cream, C.white_card][flip]}" stroke="${C.navy}" stroke-width="3"/>`) + `</g>` : '';
    const boyPose = lt > 2.2 ? noProps(P.boy.excited) : noProps(P.boy.neutral);
    if (lt > 2.6) klikPose.expr = 'happy';
    const world =
      layer(disc(540, 1290, 380)) +
      fig(rigs.boy, boyPose, 250, 1610, 1.22) +
      layer(cal + page + books) +
      fig(rigs.klik, klikPose, lerp(1200, 805, kKlik), 1620, 1.3);
    const kl = popK(lt, 0.4, 0.35);
    const lsz = 168, ly = 208;
    const h = block(txt('curiosity', 'headline'), CX, 466, { max: 80, min: 64, lh: 1.04 });
    const sub = block(txt('curiosity', 'subhead'), CX, 466 + h.h + 2, { max: 54, min: 44, weight: 700 });
    const kh = slideK(lt, 0.7), ks = slideK(lt, 1.0), kb = popK(lt, 2.4, 0.32);
    const by = 466 + h.h + sub.h + 40;
    const ui =
      (kl > 0 ? `<g transform="translate(${CX} ${ly + lsz / 2}) scale(${kl}) translate(${-CX} ${-(ly + lsz / 2)})">${logo(CX - lsz / 2, ly, lsz)}</g>` : '') +
      (kh > 0 ? `<g transform="translate(${(1 - kh) * -80} 0)">${h.svg}</g>` : '') +
      (ks > 0 ? `<g transform="translate(${(1 - ks) * 80} 0)">${sub.svg}</g>` : '') +
      (kb > 0 ? `<g transform="translate(${CX} ${by}) scale(${kb}) translate(${-CX} ${-by})">${badge(txt('curiosity', 'badge'), CX, by, 52)}</g>` : '');
    return { cam: { s: lerp(1.08, 1, inOut(lt / D)), fx: 540, fy: 1100 }, world, ui };
  };

  S['programme-1'] = (lt, D) => {
    const ts = stepT(lt);
    const pose = noProps(P.boy.writing);
    const wiggle = Math.floor(ts * 12) % 3;
    pose.reach = { ...P.boy.writing.reach, armL: { ...P.boy.writing.reach.armL, to: [-6 + wiggle * 4, -276 + (wiggle % 2) * 3] } };
    pose.props = P.boy.writing.props;
    const cards = byId['programme-1'].jawi.map((w, i) => {
      const k = slideK(lt, 0.9 + i * 0.55, 0.4);
      const y = 690 + i * 205;
      return k > 0 ? at(piece(`<rect x="-150" y="-80" width="300" height="160" rx="16" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        `<text class="jawi" x="0" y="26" font-family="Noto Naskh Arabic" font-size="80" font-weight="700" fill="${C.navy}" text-anchor="middle" direction="rtl" data-essential="text">${w}</text>`,
        lerp(1150, 770, k), y, 1, lerp(8, i % 2 ? 2 : -2, k)) : '';
    }).join('');
    const world = layer(disc(330, 1080, 300)) + fig(rigs.boy, pose, 300, 1510, 1.35) + layer(cards);
    const b = badge(txt('programme-1', 'badge'), CX, 270, 48);
    const h = block(txt('programme-1', 'headline'), CX, 410, { max: 84, min: 64 });
    const body = block(txt('programme-1', 'body'), CX, 410 + h.h + 14, { max: 52, min: 44, weight: 700 });
    const kb = popK(lt, 0.1), kh = slideK(lt, 0.3), kd = slideK(lt, 0.6);
    const ui = (kb > 0 ? `<g transform="translate(${CX} 270) scale(${kb}) translate(${-CX} -270)">${b}</g>` : '') +
      (kh > 0 ? `<g transform="translate(0 ${(1 - kh) * -50})">${h.svg}</g>` : '') +
      (kd > 0 ? `<g transform="translate(0 ${(1 - kd) * 40})">${body.svg}</g>` : '');
    return { cam: { s: 1.02, fx: 540, fy: 1000, dx: lerp(30, -15, inOut(lt / D)) }, world, ui };
  };

  S['programme-2'] = (lt, D) => {
    const spines = byId['programme-2'].on_screen_text.filter((x) => x.role === 'spine').map((x) => x.text);
    const style = [[C.teal, C.navy, C.navy], [C.navy, C.kurung_line, C.cream], [C.white_card, C.teal, C.navy], [C.baju_teal_deep, C.navy, C.navy], [C.kraft, C.navy, C.navy]];
    const widths = [560, 520, 500, 540, 520], offs = [0, -14, 10, -6, 12];
    const bh = 108;
    const books = spines.map((s, i) => {
      const t0 = 0.55 + i * 0.62;
      if (lt < t0) return '';
      const k = clamp((lt - t0) / 0.32);
      const drop = k < 1 ? -(1 - k * k) * 700 : -Math.abs(Math.sin(Math.min(1, (lt - t0 - 0.32) / 0.3) * Math.PI)) * 22 * (1 - clamp((lt - t0 - 0.32) / 0.3));
      const [f, band, lf] = style[i];
      return at(book(widths[i], bh - 6, f, band, s, lf, 52), 650 + offs[i], 1500 - i * bh + drop, 1, i % 2 ? 0.8 : -0.8);
    }).join('');
    const world = layer(disc(640, 1180, 330)) + fig(rigs.girl, noProps(P.girl.neutral), 210, 1500, 1.12) + layer(books);
    const b = badge(txt('programme-2', 'badge'), CX, 270, 48);
    const h = block(txt('programme-2', 'headline'), CX, 410, { max: 84, min: 64 });
    const kb = popK(lt, 0.1), kh = slideK(lt, 0.3);
    const ui = (kb > 0 ? `<g transform="translate(${CX} 270) scale(${kb}) translate(${-CX} -270)">${b}</g>` : '') +
      (kh > 0 ? `<g transform="translate(0 ${(1 - kh) * -50})">${h.svg}</g>` : '');
    return { cam: { s: 1, fx: 540, fy: 1000, dy: lerp(50, 0, inOut(lt / D)) }, world, ui,
      events: spines.map((_, i) => ({ t: 0.55 + i * 0.62 + 0.32, type: 'thud', v: 0.8, p: 1 + i * 0.06 })) };
  };

  S.structure = (lt, D) => {
    const stats = byId.structure.on_screen_text.filter((x) => x.role === 'stat').map((x) => x.text);
    const look = [[C.white_card, C.navy], [C.teal, C.navy], [C.navy, C.cream], [C.white_card, C.navy]];
    const cw = 420, ch = 250, gx = 28, gy = 26;
    const cards = stats.map((s, i) => {
      const t0 = 0.25 + i * 0.5;
      const k = popK(lt, t0, 0.3);
      if (k <= 0) return '';
      const x = SZ.x0 + (i % 2) * (cw + gx), y = 222 + Math.floor(i / 2) * (ch + gy);
      const [bg, fg] = look[i];
      const m = s.match(/^(\S+)\s+(.*)$/);
      const big = m[1], rest = m[2];
      const r = fit(rest, { max: 48, min: 44, maxW: cw - 50, weight: 800 });
      const two = r.lines.length > 1;
      const restSvg = r.lines.map((l, j) => T(l, cw / 2, (two ? 160 : 186) + j * r.size * 1.06, { size: r.size, fill: fg, lift: false })).join('');
      return `<g transform="translate(${x + cw / 2} ${y + ch / 2}) scale(${k}) translate(${-cw / 2} ${-ch / 2})">` +
        piece(`<rect x="0" y="0" width="${cw}" height="${ch}" rx="22" fill="${bg}"${bg === C.white_card ? ` stroke="${C.navy}" stroke-width="3"` : ''}/>`) +
        T(big, cw / 2, two ? 106 : 124, { size: 112, fill: fg, lift: false }) + restSvg + `</g>`;
    }).join('');
    // laptop with a small virtual class: six tiles, each a paper-cut kid
    const kl = slideK(lt, 0.6, 0.5);
    const heads = [0, 1, 2, 3, 4, 5].map((i) => {
      const who = i % 2 ? rigs.girl : rigs.boy;
      const x = 32 + (i % 3) * 118, y = 30 + Math.floor(i / 3) * 112;
      const ex = ['happy', 'neutral', 'excited', 'happy', 'neutral', 'happy'][i];
      return `<rect x="${x}" y="${y}" width="108" height="102" rx="10" fill="${i % 2 ? '#E3F2EF' : C.cream}"/>` +
        `<g transform="translate(${x + 54} ${y + 100 + 330 * 0.27}) scale(0.27)">${compose(who, { expr: ex }, { only: 'head' }).svg}</g>`;
    }).join('');
    const laptop = piece(`<rect x="0" y="0" width="420" height="290" rx="20" fill="${C.navy}"/>`) +
      piece(`<rect x="14" y="16" width="392" height="258" rx="10" fill="${C.klik_screen}"/>`, { small: true }) +
      `<g transform="translate(14 16)"><clipPath id="scr"><rect x="0" y="0" width="392" height="258" rx="10"/></clipPath><g clip-path="url(#scr)">${heads}</g></g>` +
      piece(`<path d="M-30,290 L450,290 L470,326 Q472,334 462,334 L-42,334 Q-52,334 -50,326 Z" fill="${C.kurung_line}"/>`);
    const kc = slideK(lt, 0.45, 0.5);
    const world = layer(
      at(calendar(380, 470, true, clamp((lt - 1.2) / 2.2)), lerp(-420, 88, kc), 850) +
      at(laptop, lerp(1200, 508, kl), 1060, 1));
    return { cam: { s: lerp(1, 1.04, inOut(lt / D)), fx: 540, fy: 1100 }, world, ui: cards,
      events: stats.map((_, i) => ({ t: 0.25 + i * 0.5, type: 'thud', v: 0.7 })) };
  };

  S.climax = (lt, D) => {
    const ts = stepT(lt);
    const happy = lt > 1.5;
    const pose = noProps(P.boy.writing);
    pose.expr = happy ? 'happy' : 'confused';
    // word written right to left (Jawi): reveal from the right edge, pencil tip rides the edge
    const NBS = 1.3, wx0 = -62, wx1 = -2;                 // left page, notebook-local x range for the word
    const rk = clamp((stepT(lt) - 0.3) / 1.1);
    const edge = lerp(wx1, wx0, rk);                       // notebook-local x of the pencil tip
    const tipX = edge * NBS, tipY = -262 + 10 * NBS;       // torso space
    const jig = Math.floor(ts * 12) % 2 ? 3 : -2;
    pose.reach = { armL: { to: [tipX - 22, tipY - 24 + (rk < 1 ? jig : 0)], bend: 'out', hand: -40 },
      armR: { to: [92, -204], bend: 'down', hand: -20 } };
    pose.var = { handL: 'grip', handR: 'fist' };
    const word = `<text class="jawi" x="-32" y="14" font-family="Noto Naskh Arabic" font-size="34" font-weight="700" fill="${C.navy}" text-anchor="middle" direction="rtl" data-essential="text">${byId.climax.jawi[0]}</text>`;
    const nb = `<g transform="scale(${NBS})">${rigs.boy.props.notebook.svg}` +
      (rk > 0 ? `<clipPath id="wr"><rect x="${edge}" y="-40" width="${wx1 - edge + 4}" height="80"/></clipPath><g clip-path="url(#wr)">${word}</g>` : '') + `</g>`;
    pose.props = [{ use: { svg: nb, fx: 'none' }, parent: 'torso', at: [0, -262], z: 35 },
      { use: 'pencil', parent: 'torso', at: [tipX, tipY], rot: -135, scale: 0.85, z: 38.5 }];
    const labels = byId.climax.on_screen_text.map((x) => x.text);
    const icons = [
      // digital worksheet: a tablet with lines
      piece(`<rect x="-46" y="-58" width="92" height="116" rx="12" fill="${C.navy}"/><rect x="-38" y="-48" width="76" height="92" rx="6" fill="#E3F2EF"/>`) + lines(-28, 28, [-30, -14, 2, 18].map(String)),
      // test paper with a pencil mark
      piece(`<path d="M-40,-58 L26,-58 L42,-42 L42,58 L-40,58 Z" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) + lines(-28, 28, ['-30', '-12', '6', '24']),
      // progress report: bars, no numbers
      piece(`<rect x="-44" y="-58" width="88" height="116" rx="8" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        [0, 1, 2].map((j) => piece(`<rect x="${-30 + j * 24}" y="${40 - (30 + j * 24) * clamp((lt - 1.6 - j * 0.15) / 0.5)}" width="16" height="${(30 + j * 24) * clamp((lt - 1.6 - j * 0.15) / 0.5)}" fill="${[C.baju_teal_deep, C.teal, C.navy][j]}"/>`, { small: true })).join(''),
    ];
    const cardH = 150, cw = SAFE_W;
    const cards = labels.map((s, i) => {
      const k = slideK(lt, 0.25 + i * 0.4, 0.45);
      if (k <= 0) return '';
      const y = 222 + i * (cardH + 16);
      const r = fit(s, { max: 50, min: 44, maxW: cw - 210, weight: 700 });
      const lab = r.lines.map((l, j) => T(l, 170, cardH / 2 + r.size * 0.36 + (j - (r.lines.length - 1) / 2) * r.size * 1.08, { size: r.size, weight: 700, anchor: 'start', lift: false })).join('');
      const tick = i === 2 && lt > 2.2 ? piece(`<path d="M-26,0 l17,19 l36,-40" fill="none" stroke="${C.gold}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`, { small: true }) : '';
      return `<g transform="translate(${lerp(W + 40, SZ.x0, k)} ${y})">` +
        piece(`<rect x="0" y="0" width="${cw}" height="${cardH}" rx="22" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        at(icons[i], 90, cardH / 2) + lab + (tick ? at(tick, cw - 70, cardH / 2, popK(lt, 2.2, 0.3)) : '') + `</g>`;
    }).join('');
    const world = layer(disc(520, 1180, 320)) + fig(rigs.boy, pose, 520, 1525, 1.28);
    return { cam: { s: lerp(1, 1.06, inOut(lt / D)), fx: 520, fy: 1150 }, world, ui: cards,
      events: [{ t: 0.3, type: 'scratch', d: 1.1 }, { t: 1.5, type: 'pop' }, { t: 2.2, type: 'ding' }] };
  };

  S.payoff = (lt, D) => {
    const kk = popK(lt, 0.2, 0.35);
    const world =
      layer(disc(540, 1010, 340)) +
      fig(rigs.boy, noProps(P.boy.books), 250, 1290, 0.98) +
      fig(rigs.girl, noProps(P.girl.books), 500, 1290, 0.98) +
      (kk > 0 ? fig(rigs.klik, noProps(P.klik.whatsapp), 790, 1300 - (1 - kk) * 80, 0.98) : '');
    const lsz = 190, ly = 210;
    const h = block(txt('payoff', 'headline'), CX, 500, { max: 92, min: 64 });
    const sub = block(txt('payoff', 'subhead'), CX, 500 + h.h + 2, { max: 56, min: 44, weight: 700 });
    const wa = txt('payoff', 'contact', 0), web = txt('payoff', 'contact', 1);
    const card = piece(`<rect x="${SZ.x0 + 10}" y="1338" width="${SAFE_W - 20}" height="188" rx="26" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
      T(wa, CX, 1418, { size: fit(wa, { max: 60, min: 44, maxW: SAFE_W - 80 }).size, lift: false }) +
      T(web, CX, 1486, { size: fit(web, { max: 48, min: 44, maxW: SAFE_W - 80, weight: 700 }).size, weight: 700, lift: false });
    const kl = popK(lt, 0.05, 0.35), kh = popK(lt, 0.35, 0.3), ks = slideK(lt, 0.7), kc = slideK(lt, 1.0, 0.5);
    const ui =
      (kl > 0 ? `<g transform="translate(${CX} ${ly + lsz / 2}) scale(${kl}) translate(${-CX} ${-(ly + lsz / 2)})">${logo(CX - lsz / 2, ly, lsz)}</g>` : '') +
      (kh > 0 ? `<g transform="translate(${CX} 530) scale(${kh}) translate(${-CX} -530)">${h.svg}</g>` : '') +
      (ks > 0 ? `<g transform="translate(0 ${(1 - ks) * 30})">${sub.svg}</g>` : '') +
      (kc > 0 ? `<g transform="translate(0 ${(1 - kc) * 260})">${card}</g>` : '');
    return { cam: { s: lerp(1.03, 1, inOut(lt / D)), fx: 540, fy: 1000 }, world, ui };
  };

  // ======================= frame =======================
  const defs = paperDefs({ ink: C.navy });
  const bg = `<rect width="${W}" height="${H}" fill="${C.cream}" filter="url(#pp-card)"/>`;
  function sceneAt(t) {
    const i = Math.max(0, scenes.findIndex((s) => t >= s.t0 && t < s.t1));
    return t >= scenes[scenes.length - 1].t1 ? scenes.length - 1 : i;
  }
  function frame(t, { safe = false } = {}) {
    const sc = scenes[sceneAt(t)];
    const lt = t - sc.t0, D = sc.t1 - sc.t0;
    const r = S[sc.id](lt, D);
    const c = { s: 1, fx: 540, fy: 960, dx: 0, dy: 0, ...r.cam };
    const cam = `translate(${c.fx + c.dx} ${c.fy + c.dy}) scale(${c.s}) translate(${-c.fx} ${-c.fy})`;
    const overlay = safe ?
      `<path fill-rule="evenodd" d="M0,0 H${W} V${H} H0 Z M${SZ.x0},${SZ.y0} V${SZ.y1} H${SZ.x1} V${SZ.y0} Z" fill="#E0242B" opacity="0.16"/>` +
      `<rect x="${SZ.x0}" y="${SZ.y0}" width="${SZ.x1 - SZ.x0}" height="${SZ.y1 - SZ.y0}" fill="none" stroke="#E0242B" stroke-width="5"/>` +
      `<text x="${SZ.x0 + 10}" y="${SZ.y0 - 14}" font-family="Montserrat" font-weight="700" font-size="30" fill="#E0242B">SAFE ZONE ${SZ.x0}–${SZ.x1} × ${SZ.y0}–${SZ.y1}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${bg}` +
      `<g class="world" transform="${cam}">${r.world}</g><g class="ui">${r.ui}</g>${overlay}</svg>`;
  }
  // sound events in film time (for the mixer)
  const events = [];
  for (const sc of scenes) {
    const r = S[sc.id](sc.t1 - sc.t0 - 0.01, sc.t1 - sc.t0);
    for (const e of r.events || []) events.push({ ...e, t: +(sc.t0 + e.t).toFixed(3), scene: sc.id });
  }
  return { W, H, FPS, DUR: cfg.format.frames / FPS, scenes, frame, events, sceneAt };
}

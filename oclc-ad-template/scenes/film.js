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
// Motion rule: characters and paper props step at 12 fps; camera, text, cards and logo move every frame.
// popK: a stepped paper pop (props). popS: the same overshoot, smooth (text, logo, badges).
const popK = (t, t0, d = 0.3) => (t < t0 ? 0 : backOut(stepT(t - t0) / d, 2.6));
const popS = (t, t0, d = 0.32) => (t < t0 ? 0 : backOut((t - t0) / d, 1.8));
// slideK: smooth slide with a small overshoot (text and cards)
const slideK = (t, t0, d = 0.42) => (t < t0 ? 0 : backOut((t - t0) / d, 1.15));

export function createFilm({ brand, cfg, C, rigs, measure, words = {} }) {
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

  // ======================= cues =======================
  // cue(scene, beat): when the VO word mapped to that beat starts (scene-local s). The beat -> word map is
  // config scenes[].cues (word in vo_tts_text spelling, lower case; "u" = the U of "U P K K"). Word times come
  // from out/vo-words.json (tools/words.py). A beat whose word is not in the VO is reported in missingCues.
  const missingCues = new Set();
  const cue = (id, beat, n = 0, fb = 0.3) => {
    const w = (byId[id].cues || {})[beat] ?? beat;
    const hits = (words[id] || []).filter((x) => x.w === w);
    if (!hits[n]) { missingCues.add(`${id}.${beat} -> "${w}"`); return fb; }
    return hits[n].t0;
  };
  const voEnd = (id) => (byId[id].vo.end_frame - byId[id].timing.start_frame) / FPS;
  const bob = (ts, amp = 1.5, per = 1.0) => (Math.floor(ts / (per / 2)) % 2 ? amp : 0);      // two-position idle, stepped
  const floatY = (ts, amp = 9, hz = 0.55) => Math.round(Math.sin(ts * hz * 2 * Math.PI) * amp); // Klik hover, stepped via ts
  const popAt = (k, cx, cy, svg) => (k > 0 ? `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${svg}</g>` : '');

  // ======================= scenes =======================
  // each returns { cam:{s,fx,fy,dx,dy}, world, ui, events }  (lt = scene-local time, D = scene length)
  const S = {};

  S.hook = (lt, D) => {
    const id = 'hook', ts = stepT(lt);
    const scratch = Math.floor(ts * 12) % 4 < 2 ? 0 : 1;
    const pose = noProps(P.boy.confused);
    pose.reach = { armL: { ...P.boy.confused.reach.armL, hand: 158 + scratch * 14 } };
    pose.rot = { ...P.boy.confused.rot, head: -12 + (Math.floor(ts * 12) % 8 < 4 ? 0 : 1.5) };
    const qt = [cue(id, 'qmark_1'), cue(id, 'headline_2') + 0.2, cue(id, 'qmark_3')];
    const qs = [[qt[0], 250, 760, 1.8, -14, true], [qt[1], 800, 720, 1.9, 12, true], [qt[2], 870, 860, 1.3, 22, false]];
    const marks = qs.map(([t0, x, y, s, r, navy]) => {
      const k = popK(lt, t0);
      return k > 0 ? at(piece(qmark(navy)), x, y + (Math.floor((ts + x) * 2) % 2 ? 5 : -3), s * k, r) : '';
    }).join('');
    const world =
      layer(disc(560, 900, 330)) +
      layer(piece(`<rect x="378" y="1010" width="324" height="300" rx="34" fill="${C.kraft_deep}"/>`)) +
      fig(rigs.boy, pose, 540, 1280 + 194 * 1.6, 1.6) +
      layer(desk() + workbook() + cup() + deskStack() + at(piece(rigs.boy.props.pencil.svg), 196, 1428, 1.3, -6)) +
      layer(marks);
    const t1 = cue(id, 'headline_1') - 0.08, t2 = cue(id, 'headline_2') - 0.08, t3 = cue(id, 'underline');
    const l1 = block(txt(id, 'headline', 0), CX, 300, { max: 84, min: 64 });
    const y2 = 300 + l1.h + 112;
    const l2 = block(txt(id, 'headline', 1), CX, y2, { max: 150, min: 64 });
    const k1 = slideK(lt, t1), k2 = popS(lt, t2);
    const ulw = measure(l2.lines[0], FONT(800, l2.size)) * outCubic((lt - t3) / 0.4);
    const ui =
      (k1 > 0 ? `<g transform="translate(0 ${(1 - k1) * -70})">${l1.svg}</g>` : '') +
      popAt(k2, CX, y2 - 42, l2.svg) +
      (ulw > 1 ? piece(`<rect x="${CX - ulw / 2}" y="${y2 + 28}" width="${ulw}" height="12" rx="6" fill="${C.gold}"/>`, { small: true }) : '');
    return { cam: { s: lerp(1, 1.1, inOut(lt / D)), fx: 540, fy: 1060 }, world, ui,
      events: [{ t: 0, type: 'rustle', d: D + 0.3 }, ...qt.map((t) => ({ t, type: 'pop', v: 0.7 })),
        { t: t1, type: 'slide', v: 0.6 }, { t: t2, type: 'pop', v: 0.5, p: 1.2 }] };
  };

  S.curiosity = (lt, D) => {
    const id = 'curiosity', ts = stepT(lt);
    const tFlip = [cue(id, 'headline_flip_1'), cue(id, 'flip_2'), cue(id, 'subhead_flip_3')];
    const tClick = cue(id, 'klik_click_logo') - 0.12, tLogo = cue(id, 'klik_click_logo');
    const tFold = cue(id, 'fold_books_badge') - 0.3, tBooks = cue(id, 'fold_books_badge') - 0.05, tExcite = cue(id, 'boy_excited');
    // Klik drifts in (stepped), hovers, taps its antenna on "OCLC"
    const inK = outCubic(stepT(lt - 0.05) / 0.6);
    const tapping = lt >= tClick - 0.1 && lt < tClick + 0.35;
    const klikPose = noProps(tapping ? P.klik.tap : P.klik.neutral);
    if (tapping && lt >= tClick) klikPose.props = P.klik.tap.props;
    if (lt >= tClick + 0.35) klikPose.expr = 'happy';
    klikPose.off = { ...(klikPose.off || {}), float: [0, floatY(ts)] };
    // calendar: three page flips (one per spoken phrase), then it folds down and two books drop out: "2 pilihan"
    const W0 = 300, cx0 = 390, cy0 = 1250;
    const fold = clamp(stepT(lt - tFold) / 0.25);
    const flips = tFlip.map((t0) => clamp(stepT(lt - t0) / 0.25));
    const flipping = flips.findIndex((k) => k > 0 && k < 1);
    const cal = fold < 1 ? `<g transform="translate(${cx0} ${cy0 + fold * 300}) scale(1 ${1 - fold})">${calendar(W0, 300)}` +
      (flipping >= 0 ? `<g transform="scale(1 ${1 - flips[flipping]})">` + piece(`<rect x="0" y="0" width="${W0}" height="300" rx="16" fill="${flipping % 2 ? C.cream : C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) + `</g>` : '') +
      `</g>` : '';
    const books = [[C.teal, C.navy], [C.navy, C.teal]].map(([f, b], i) => {
      const k = popK(lt, tBooks + i * 0.16);
      return k > 0 ? at(book(230, 64, f, b), 545, 1590 - i * 66, k, i ? 2 : -1.5) : '';
    }).join('');
    const excited = lt >= tExcite;
    const boyPose = noProps(excited ? P.boy.excited : P.boy.confused);
    if (excited) boyPose.props = P.boy.excited.props.filter((p) => p.use === 'star').map((p) => ({ ...p, scale: (p.scale || 1) * popK(lt, tExcite, 0.25) }));
    else boyPose.off = { hips: [0, bob(ts)] };
    const world =
      layer(disc(540, 1290, 380)) +
      fig(rigs.boy, boyPose, 250, 1610, 1.22) +
      layer(cal + books) +
      fig(rigs.klik, klikPose, lerp(1200, 805, inK), 1620, 1.3);
    const lsz = 224, ly = 214;                       // logo >= 220 px wide, square, never stretched; 14 px clear of the safe-zone top
    const hy = ly + lsz + 92;
    const h = block(txt(id, 'headline'), CX, hy, { max: 80, min: 64, lh: 1.04 });
    const sub = block(txt(id, 'subhead'), CX, hy + h.h + 2, { max: 54, min: 44, weight: 700 });
    const by = hy + h.h + sub.h + 40;
    const kl = popS(lt, tLogo), kh = slideK(lt, tFlip[0] - 0.08), ks = slideK(lt, tFlip[2] - 0.05), kb = popS(lt, tBooks);
    const ui =
      popAt(kl, CX, ly + lsz / 2, logo(CX - lsz / 2, ly, lsz)) +
      (kh > 0 ? `<g transform="translate(${(1 - kh) * -90} 0)">${h.svg}</g>` : '') +
      (ks > 0 ? `<g transform="translate(${(1 - ks) * 90} 0)">${sub.svg}</g>` : '') +
      popAt(kb, CX, by, badge(txt(id, 'badge'), CX, by, 52));
    return { cam: { s: lerp(1.08, 1, inOut(lt / D)), fx: 540, fy: 1100 }, world, ui,
      events: [{ t: 0.05, type: 'slide', v: 0.35 }, ...tFlip.map((t) => ({ t, type: 'flip' })), { t: tClick, type: 'click' },
        { t: tLogo, type: 'pop', v: 0.5, p: 1.3 }, { t: tFold, type: 'snap' }, { t: tBooks, type: 'thud', v: 0.5, p: 1.1 },
        { t: tBooks + 0.16, type: 'thud', v: 0.45, p: 1.2 }, { t: tExcite, type: 'pop', v: 0.5 }] };
  };

  S['programme-1'] = (lt, D) => {
    const id = 'programme-1', ts = stepT(lt);
    const pose = noProps(P.boy.writing);
    const wiggle = Math.floor(ts * 12) % 3;
    pose.reach = { ...P.boy.writing.reach, armL: { ...P.boy.writing.reach.armL, to: [-6 + wiggle * 4, -276 + (wiggle % 2) * 3] } };
    pose.props = P.boy.writing.props;
    const tc = ['card_1', 'card_2', 'card_3'].map((w) => cue(id, w) - 0.1);
    const cards = byId[id].jawi.map((w, i) => {
      const k = slideK(lt, tc[i], 0.4);
      const y = 690 + i * 205;
      return k > 0 ? at(piece(`<rect x="-150" y="-80" width="300" height="160" rx="16" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        `<text class="jawi" x="0" y="26" font-family="Noto Naskh Arabic" font-size="80" font-weight="700" fill="${C.navy}" text-anchor="middle" direction="rtl" data-essential="text">${w}</text>`,
        lerp(1150, 730, k), y, 1, lerp(8, i % 2 ? 2 : -2, clamp(k))) : '';
    }).join('');
    const world = layer(disc(330, 1080, 300)) + fig(rigs.boy, pose, 300, 1510, 1.35) + layer(cards);
    const b = badge(txt(id, 'badge'), CX, 270, 48);
    const h = block(txt(id, 'headline'), CX, 410, { max: 84, min: 64 });
    const body = block(txt(id, 'body'), CX, 410 + h.h + 14, { max: 52, min: 44, weight: 700 });
    const kb = popS(lt, 0.12), kh = slideK(lt, cue(id, 'headline') - 0.08), kd = slideK(lt, tc[0]);
    const ui = popAt(kb, CX, 270, b) +
      (kh > 0 ? `<g transform="translate(0 ${(1 - kh) * -50})">${h.svg}</g>` : '') +
      (kd > 0 ? `<g transform="translate(0 ${(1 - kd) * 40})">${body.svg}</g>` : '');
    return { cam: { s: 1.02, fx: 540, fy: 1000, dx: lerp(30, -15, inOut(lt / D)) }, world, ui,
      events: [{ t: 0.12, type: 'pop', v: 0.4, p: 1.2 }, ...tc.map((t) => ({ t, type: 'slide', v: 0.45 })),
        ...tc.map((t) => ({ t: t + 0.3, type: 'snap', v: 0.5 })), { t: 0.4, type: 'scratch', d: 2.6, v: 0.6 }] };
  };

  S['programme-2'] = (lt, D) => {
    const id = 'programme-2', ts = stepT(lt);
    const spines = byId[id].on_screen_text.filter((x) => x.role === 'spine').map((x) => x.text);
    const land = ['book_1', 'book_2', 'book_3', 'book_4', 'book_5'].map((w) => cue(id, w) + 0.02);
    const style = [[C.teal, C.navy, C.navy], [C.navy, C.kurung_line, C.cream], [C.white_card, C.teal, C.navy], [C.baju_teal_deep, C.navy, C.navy], [C.kraft, C.navy, C.navy]];
    const widths = [520, 490, 470, 500, 490], offs = [0, -14, 10, -6, 12];
    const bh = 108, FALL = 0.28;
    const books = spines.map((s, i) => {
      const t0 = land[i] - FALL;
      if (lt < t0) return '';
      const u = stepT(lt - t0);                                   // stepped drop, then a small bounce
      const drop = u < FALL ? -(1 - (u / FALL) ** 2) * 760 : -Math.sin(clamp((u - FALL) / 0.25) * Math.PI) * 18;
      const [f, band, lf] = style[i];
      return at(book(widths[i], bh - 6, f, band, s, lf, 52), 610 + offs[i], 1500 - i * bh + drop, 1, i % 2 ? 0.8 : -0.8);
    }).join('');
    const girlPose = noProps(P.girl.neutral);
    if (lt >= cue(id, 'girl_smiles')) girlPose.expr = 'happy';
    girlPose.off = { hips: [0, bob(ts)] };
    const world = layer(disc(600, 1180, 330)) + fig(rigs.girl, girlPose, 210, 1500, 1.12) + layer(books);
    const b = badge(txt(id, 'badge'), CX, 270, 48);
    const h = block(txt(id, 'headline'), CX, 410, { max: 84, min: 64 });
    const kb = popS(lt, 0.12), kh = slideK(lt, cue(id, 'headline') - 0.08);
    const ui = popAt(kb, CX, 270, b) + (kh > 0 ? `<g transform="translate(0 ${(1 - kh) * -50})">${h.svg}</g>` : '');
    return { cam: { s: 1, fx: 540, fy: 1000, dy: lerp(50, 0, inOut(lt / D)) }, world, ui,
      events: [{ t: 0.12, type: 'pop', v: 0.4, p: 1.2 }, ...land.map((t, i) => ({ t, type: 'thud', v: 0.7, p: 1 + i * 0.06 }))] };
  };

  S.structure = (lt, D) => {
    const id = 'structure', ts = stepT(lt);
    const stats = byId[id].on_screen_text.filter((x) => x.role === 'stat').map((x) => x.text);
    const tCard = [cue(id, 'card_1') - 0.08, cue(id, 'card_2') - 0.08, cue(id, 'card_3_ticks_end') + 0.3, cue(id, 'card_4_laptop') - 0.08];
    const look = [[C.white_card, C.navy], [C.teal, C.navy], [C.navy, C.cream], [C.white_card, C.navy]];
    const cw = 420, ch = 250, gx = 28, gy = 26;
    const cards = stats.map((s, i) => {
      const k = popS(lt, tCard[i], 0.3);
      if (k <= 0) return '';
      const x = SZ.x0 + (i % 2) * (cw + gx), y = 222 + Math.floor(i / 2) * (ch + gy);
      const [bg, fg] = look[i];
      const m = s.match(/^(\S+)\s+(.*)$/);
      const r = fit(m[2], { max: 48, min: 44, maxW: cw - 50, weight: 800 });
      const two = r.lines.length > 1;
      const restSvg = r.lines.map((l, j) => T(l, cw / 2, (two ? 160 : 186) + j * r.size * 1.06, { size: r.size, fill: fg, lift: false })).join('');
      return `<g transform="translate(${x + cw / 2} ${y + ch / 2}) scale(${k}) translate(${-cw / 2} ${-ch / 2})">` +
        piece(`<rect x="0" y="0" width="${cw}" height="${ch}" rx="22" fill="${bg}"${bg === C.white_card ? ` stroke="${C.navy}" stroke-width="3"` : ''}/>`) +
        T(m[1], cw / 2, two ? 106 : 124, { size: 112, fill: fg, lift: false }) + restSvg + `</g>`;
    }).join('');
    // laptop with a small virtual class: six paper-cut kids pop in one by one (stepped)
    const tLap = cue(id, 'card_4_laptop') - 0.25;
    const kl = outCubic(stepT(lt - tLap) / 0.45);
    const heads = [0, 1, 2, 3, 4, 5].map((i) => {
      const kk = popK(lt, tLap + 0.35 + i * 0.09, 0.25);
      if (kk <= 0) return '';
      const who = i % 2 ? rigs.girl : rigs.boy;
      const x = 32 + (i % 3) * 118, y = 30 + Math.floor(i / 3) * 112;
      const ex = ['happy', 'neutral', 'excited', 'happy', 'neutral', 'happy'][i];
      return `<g transform="translate(${x + 54} ${y + 51}) scale(${kk}) translate(${-x - 54} ${-y - 51})"><rect x="${x}" y="${y}" width="108" height="102" rx="10" fill="${i % 2 ? '#E3F2EF' : C.cream}"/>` +
        `<g transform="translate(${x + 54} ${y + 100 + 330 * 0.27}) scale(0.27)">${compose(who, { expr: ex }, { only: 'head' }).svg}</g></g>`;
    }).join('');
    const laptop = piece(`<rect x="0" y="0" width="420" height="290" rx="20" fill="${C.navy}"/>`) +
      piece(`<rect x="14" y="16" width="392" height="258" rx="10" fill="${C.klik_screen}"/>`, { small: true }) +
      `<g transform="translate(14 16)"><clipPath id="scr"><rect x="0" y="0" width="392" height="258" rx="10"/></clipPath><g clip-path="url(#scr)">${heads}</g></g>` +
      piece(`<path d="M-30,290 L450,290 L470,326 Q472,334 462,334 L-42,334 Q-52,334 -50,326 Z" fill="${C.kurung_line}"/>`);
    const kc = outCubic(stepT(lt - 0.05) / 0.45);
    const tTick0 = cue(id, 'ticks_start'), tTick1 = cue(id, 'card_3_ticks_end') + 0.5;
    const world = layer(
      at(calendar(380, 470, true, clamp(stepT(lt - tTick0) / (tTick1 - tTick0))), lerp(-420, 88, kc), 850) +
      (lt >= tLap ? at(laptop, lerp(1200, 508, kl), 1060, 1) : ''));
    return { cam: { s: lerp(1, 1.04, inOut(lt / D)), fx: 540, fy: 1100 }, world, ui: cards,
      events: [{ t: 0.05, type: 'slide', v: 0.4 }, ...tCard.map((t) => ({ t, type: 'thud', v: 0.45, p: 1.15 })),
        ...[0, 1, 2, 3].map((w) => ({ t: tTick0 + (tTick1 - tTick0) * (w + 1) / 4, type: 'tick', v: 0.35 })),
        { t: tLap, type: 'slide', v: 0.4 }, { t: tLap + 0.35, type: 'click', v: 0.45 }] };
  };

  S.climax = (lt, D) => {
    const id = 'climax', ts = stepT(lt);
    const W0 = 0.15, W1 = 1.0;                                 // writes the word, then smiles
    const happy = lt >= W1 + 0.05;
    const pose = noProps(P.boy.writing);
    pose.expr = happy ? 'happy' : 'confused';
    // the right-hand page spans notebook-local x 2..63 (fold at 0); the word is centred on it with clear margins
    const NBS = 1.4, WFS = 28, PCX = 33.5;
    const ww = measure(byId[id].jawi[0], `700 ${WFS}px "Noto Naskh Arabic"`);
    const wx0 = PCX - ww / 2 - 1, wx1 = PCX + ww / 2 + 1;
    const rk = clamp((stepT(lt) - W0) / (W1 - W0));          // written right to left (Jawi), stepped
    const lift = clamp((stepT(lt) - W1 - 0.05) / 0.3);        // then the pencil lifts back to the left page
    const edge = lerp(wx1, wx0, rk);
    const tipX = lerp(edge, -30, inOut(lift)) * NBS, tipY = -262 + lerp(10, 26, inOut(lift)) * NBS;
    const jig = rk > 0 && rk < 1 && Math.floor(ts * 12) % 2 ? 3 : 0;
    pose.reach = { armL: { to: [tipX - 22, tipY - 24 + jig], bend: 'out', hand: -40 },
      armR: { to: [108, -252], bend: 'out', hand: -70 } };
    pose.var = { handL: 'grip', handR: 'fist' };
    pose.z = { armLoR: 34, handR: 34.5 };   // the holding hand is behind the notebook, fist showing past its right edge
    if (happy) { const u = stepT(lt - W1 - 0.05); pose.off = { hips: [0, u < 0.25 ? -10 : 0] }; }   // a little hop of joy
    const word = `<text class="jawi" x="${PCX}" y="12" font-family="Noto Naskh Arabic" font-size="${WFS}" font-weight="700" fill="${C.navy}" text-anchor="middle" direction="rtl" data-essential="text" data-check="jawi-word">${byId[id].jawi[0]}</text>`;
    const nb = `<g transform="scale(${NBS})">${rigs.boy.props.notebook.svg}<rect data-check="fold" x="-2" y="-43" width="4" height="86" fill="none"/>` +
      (rk > 0 ? `<clipPath id="wr"><rect x="${edge}" y="-40" width="${wx1 - edge + 4}" height="80"/></clipPath><g clip-path="url(#wr)">${word}</g>` : '') + `</g>`;
    pose.props = [{ use: { svg: nb, fx: 'none' }, parent: 'torso', at: [0, -262], z: 35 },
      { use: 'pencil', parent: 'torso', at: [tipX, tipY], rot: -135, scale: 0.85, z: 38.5 }];
    const labels = byId[id].on_screen_text.map((x) => x.text);
    const tCard = [cue(id, 'card_1') - 0.1, cue(id, 'card_2') - 0.1, cue(id, 'card_3') - 0.1];
    const tBars = tCard[2] + 0.3, tTick = cue(id, 'gold_tick') + 0.25;
    const icons = [
      piece(`<rect x="-46" y="-58" width="92" height="116" rx="12" fill="${C.navy}"/><rect x="-38" y="-48" width="76" height="92" rx="6" fill="#E3F2EF"/>`) + lines(-28, 28, [-30, -14, 2, 18].map(String)),
      piece(`<path d="M-40,-58 L26,-58 L42,-42 L42,58 L-40,58 Z" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) + lines(-28, 28, ['-30', '-12', '6', '24']),
      // progress report: bars, no numbers; they rise in paper steps
      piece(`<rect x="-44" y="-58" width="88" height="116" rx="8" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        [0, 1, 2].map((j) => { const k = clamp(stepT(lt - tBars - j * 0.12) / 0.4); const hh = (30 + j * 24) * k;
          return hh > 0 ? piece(`<rect x="${-30 + j * 24}" y="${40 - hh}" width="16" height="${hh}" fill="${[C.baju_teal_deep, C.teal, C.navy][j]}"/>`, { small: true }) : ''; }).join(''),
    ];
    const cardH = 150, cw = SAFE_W;
    const cards = labels.map((s, i) => {
      const k = slideK(lt, tCard[i], 0.42);
      if (k <= 0) return '';
      const y = 222 + i * (cardH + 16);
      const r = fit(s, { max: 50, min: 44, maxW: cw - 210, weight: 700 });
      const lab = r.lines.map((l, j) => T(l, 170, cardH / 2 + r.size * 0.36 + (j - (r.lines.length - 1) / 2) * r.size * 1.08, { size: r.size, weight: 700, anchor: 'start', lift: false })).join('');
      const tk = i === 2 ? popK(lt, tTick, 0.3) : 0;
      const tick = tk > 0 ? at(piece(`<path d="M-26,0 l17,19 l36,-40" fill="none" stroke="${C.gold}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`, { small: true }), cw - 70, cardH / 2, tk) : '';
      return `<g transform="translate(${lerp(W + 40, SZ.x0, k)} ${y})">` +
        piece(`<rect x="0" y="0" width="${cw}" height="${cardH}" rx="22" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
        at(icons[i], 90, cardH / 2) + lab + tick + `</g>`;
    }).join('');
    const world = layer(disc(520, 1180, 320)) + fig(rigs.boy, pose, 520, 1525, 1.28);
    return { cam: { s: lerp(1, 1.06, inOut(lt / D)), fx: 520, fy: 1150 }, world, ui: cards,
      events: [{ t: W0, type: 'scratch', d: W1 - W0, v: 0.8 }, { t: W1 + 0.05, type: 'pop', v: 0.55, p: 1.25 },
        ...tCard.map((t) => ({ t, type: 'slide', v: 0.4 })), { t: tTick, type: 'ding', v: 0.8 }] };
  };

  S.payoff = (lt, D) => {
    const id = 'payoff';
    const still = voEnd(id) + 0.02;                     // from here the end card holds completely still
    const lc = Math.min(lt, still), ts = stepT(lc);
    const kk = outCubic(stepT(lc - 0.15) / 0.5);
    const boy = noProps(P.boy.books), girl = noProps(P.girl.books), kl0 = noProps(P.klik.whatsapp);
    boy.off = { hips: [0, bob(ts)] }; girl.off = { hips: [0, bob(ts + 0.5)] };
    kl0.off = { ...(kl0.off || {}), float: [0, (P.klik.whatsapp.off?.float?.[1] || 0) + floatY(ts, 7)] };
    const world =
      layer(disc(540, 1010, 340)) +
      fig(rigs.boy, boy, 250, 1290, 0.98) +
      fig(rigs.girl, girl, 500, 1290, 0.98) +
      (kk > 0 ? fig(rigs.klik, kl0, lerp(1180, 790, kk), 1300, 0.98) : '');
    const lsz = 304, ly = 216;                       // logo >= 300 px wide, square, never stretched; 16 px clear of the safe-zone top
    const hy = ly + lsz + 76;
    const h = block(txt(id, 'headline'), CX, hy, { max: 92, min: 64 });
    const sub = block(txt(id, 'subhead'), CX, hy + h.h + 2, { max: 56, min: 44, weight: 700 });
    const wa = txt(id, 'contact', 0), web = txt(id, 'contact', 1);
    const card = piece(`<rect x="${SZ.x0 + 10}" y="1338" width="${SAFE_W - 20}" height="188" rx="26" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3"/>`) +
      T(wa, CX, 1418, { size: fit(wa, { max: 60, min: 44, maxW: SAFE_W - 80 }).size, lift: false }) +
      T(web, CX, 1486, { size: fit(web, { max: 48, min: 44, maxW: SAFE_W - 80, weight: 700 }).size, weight: 700, lift: false });
    const tH = cue(id, 'headline') - 0.08, tS = cue(id, 'subhead') - 0.08, tC = cue(id, 'contact') - 0.12;
    const kL = popS(lc, 0.08, 0.36), kh = popS(lc, tH), ks = slideK(lc, tS), kc = slideK(lc, tC, 0.5);
    const ui =
      popAt(kL, CX, ly + lsz / 2, logo(CX - lsz / 2, ly, lsz)) +
      popAt(kh, CX, hy - 24, h.svg) +
      (ks > 0 ? `<g transform="translate(0 ${(1 - ks) * 30})">${sub.svg}</g>` : '') +
      (kc > 0 ? `<g transform="translate(0 ${(1 - kc) * 260})">${card}</g>` : '');
    return { cam: { s: lerp(1.03, 1, inOut(lc / still)), fx: 540, fy: 1000 }, world, ui,
      events: [{ t: 0.08, type: 'pop', v: 0.45, p: 1.3 }, { t: 0.15, type: 'slide', v: 0.3 }, { t: tH, type: 'pop', v: 0.4, p: 1.15 },
        { t: tC, type: 'slide', v: 0.45 }] };
  };

  // ======================= frame =======================
  // One transition everywhere: the next scene is a fresh sheet of card sliding in from the right over the last
  // one (TR frames, eased), which is pushed a little to the left. Camera, text and sheets move every frame.
  const TR = 9;
  const defs = paperDefs({ ink: C.navy }) +
    `<defs><filter id="pp-edge" x="-200%" y="-5%" width="500%" height="110%"><feGaussianBlur stdDeviation="16"/></filter></defs>`;
  const bg = `<rect width="${W}" height="${H}" fill="${C.cream}" filter="url(#pp-card)"/>`;
  function sceneAt(t) {
    const f = Math.round(t * FPS);
    for (let i = scenes.length - 1; i >= 0; i--) if (f >= scenes[i].timing.start_frame) return i;
    return 0;
  }
  function sheet(i, t) {
    const sc = scenes[i], lt = t - sc.t0, D = sc.t1 - sc.t0;
    const r = S[sc.id](lt, D);
    const c = { s: 1, fx: 540, fy: 960, dx: 0, dy: 0, ...r.cam };
    const cam = `translate(${c.fx + c.dx} ${c.fy + c.dy}) scale(${c.s}) translate(${-c.fx} ${-c.fy})`;
    return `${bg}<g class="world" transform="${cam}">${r.world}</g><g class="ui">${r.ui}</g>`;
  }
  function frame(t, { safe = false } = {}) {
    const i = sceneAt(t), f = Math.round(t * FPS), fin = f - scenes[i].timing.start_frame;
    let body;
    if (i > 0 && fin < TR) {
      const k = inOut((fin + 1) / (TR + 1));
      const x = W * (1 - k);
      body = `<g transform="translate(${-0.22 * W * k} 0)">${sheet(i - 1, t)}</g>` +
        `<rect x="${x - 36}" y="0" width="40" height="${H}" fill="${C.navy}" opacity="0.28" filter="url(#pp-edge)"/>` +
        `<g transform="translate(${x} 0)">${sheet(i, t)}</g>`;
    } else body = sheet(i, t);
    const overlay = safe ?
      `<path fill-rule="evenodd" d="M0,0 H${W} V${H} H0 Z M${SZ.x0},${SZ.y0} V${SZ.y1} H${SZ.x1} V${SZ.y0} Z" fill="#E0242B" opacity="0.16"/>` +
      `<rect x="${SZ.x0}" y="${SZ.y0}" width="${SZ.x1 - SZ.x0}" height="${SZ.y1 - SZ.y0}" fill="none" stroke="#E0242B" stroke-width="5"/>` +
      `<text x="${SZ.x0 + 10}" y="${SZ.y0 - 14}" font-family="Montserrat" font-weight="700" font-size="30" fill="#E0242B">SAFE ZONE ${SZ.x0}–${SZ.x1} × ${SZ.y0}–${SZ.y1}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${body}${overlay}</svg>`;
  }

  // Cover image (TikTok crops covers to 3:4, so all text stays inside y 240-1680)
  function thumbnail(spec) {
    const pose = noProps(P.boy.confused);
    const marks = [[250, 1000, 1.8, -14, true], [820, 960, 1.9, 12, true], [880, 1100, 1.3, 22, false]]
      .map(([x, y, s, r, navy]) => at(piece(qmark(navy)), x, y, s, r)).join('');
    const world = `<g transform="translate(0 260)">` + layer(disc(560, 900, 330)) +
      layer(piece(`<rect x="378" y="1010" width="324" height="300" rx="34" fill="${C.kraft_deep}"/>`)) +
      fig(rigs.boy, pose, 540, 1280 + 194 * 1.6, 1.6) +
      layer(desk() + workbook() + cup() + deskStack() + at(piece(rigs.boy.props.pencil.svg), 196, 1428, 1.3, -6)) + layer(marks) + `</g>`;
    const lsz = 220, ly = 262;
    const big = block(spec.title, 540, 640, { max: 170, min: 120, maxW: 900 });
    const ulw = measure(big.lines[0], FONT(800, big.size));
    const sub = block(spec.subtitle, 540, 640 + 116, { max: 64, min: 56, maxW: 900 });
    const ui = logo(540 - lsz / 2, ly, lsz) + big.svg +
      piece(`<rect x="${540 - ulw / 2}" y="${640 + 30}" width="${ulw}" height="14" rx="7" fill="${C.gold}"/>`, { small: true }) + sub.svg;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${bg}${world}<g class="ui">${ui}</g></svg>`;
  }

  // sound events in film time (for the mixer)
  const events = [];
  for (const sc of scenes) {
    const r = S[sc.id](0, sc.t1 - sc.t0);
    for (const e of r.events || []) events.push({ ...e, t: +(sc.t0 + e.t).toFixed(3), scene: sc.id });
  }
  events.sort((a, b) => a.t - b.t);
  return { W, H, FPS, DUR: cfg.format.frames / FPS, scenes, frame, events, sceneAt, thumbnail, TR, missingCues: [...missingCues] };
}

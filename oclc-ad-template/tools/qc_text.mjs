// Frame-by-frame text QC over the whole film (layout only, no screenshots).
//   node tools/qc_text.mjs  -> out/qc/text.json, printed summary
// For every essential text: how long it is actually readable (inside the frame and not covered, e.g. by the
// incoming sheet), its settled margin to the safe-zone edges, and frames where motion takes it outside the zone.
import fs from 'node:fs';
import path from 'node:path';
import { openPage, ROOT } from './page.mjs';

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/upkk-2027.json'), 'utf8'));
const { width: W, height: H, fps: FPS, frames: N } = cfg.format;
const Z = cfg.safe_zone;
const { pg, close } = await openPage('scenes/film.html', W, H);
const per = await pg.evaluate(async ({ N, FPS, W, H, Z }) => {
  const out = [];
  for (let f = 0; f < N; f++) {
    window.render(f / FPS);
    const items = [];
    for (const el of document.querySelectorAll('[data-essential]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      const inFrame = r.left >= 0 && r.right <= W && r.top >= 0 && r.bottom <= H;
      let covered = false;
      if (inFrame) {
        const top = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
        covered = !(top === el || el.contains(top) || (top && top.closest && top.closest('[data-essential]') === el) || el.tagName === 'image' && top && top.tagName === 'image');
      }
      const m = Math.min(r.left - Z.x0, Z.x1 - r.right, r.top - Z.y0, Z.y1 - r.bottom);
      items.push({ k: el.dataset.essential === 'logo' ? 'LOGO' : el.textContent, v: inFrame && !covered, m: Math.round(m * 10) / 10, w: r.width, h: r.height });
    }
    out.push(items);
  }
  return out;
}, { N, FPS, W, H, Z });
await close();

const scenes = cfg.scenes.map((s) => ({ id: s.id, f0: s.timing.start_frame, f1: s.timing.end_frame }));
const sceneOf = (f) => scenes.filter((s) => f >= s.f0).pop().id;
const TR = 9;
// a logo seen during a transition belongs to the nearest scene (this one or earlier) that has a logo
const logoScene = (f) => { const i = scenes.findLastIndex((s) => f >= s.f0); for (let k = i; k >= 0; k--) if (cfg.scenes[k].logo) return scenes[k].id; return scenes[i].id; };
const inTransition = (f) => scenes.some((s, i) => i > 0 && f >= s.f0 && f < s.f0 + TR);
const stats = new Map();
per.forEach((items, f) => {
  for (const it of items) {
    const key = it.k === 'LOGO' ? 'LOGO (' + logoScene(f) + ')' : it.k;
    if (!stats.has(key)) stats.set(key, { text: key, visible: 0, first: null, last: null, settled: null, outsideMotion: 0, aspect: [] });
    const s = stats.get(key);
    if (it.v) { s.visible++; if (s.first === null) s.first = f; s.last = f; }
    if (it.v && it.m < 0) s.outsideMotion++;
    if (it.v && !inTransition(f)) s.settled = it.m;        // last settled frame wins = final layout
    if (key.startsWith('LOGO') && it.v) s.aspect.push(Math.abs(it.w - it.h));
  }
});
const rows = [...stats.values()].map((s) => ({ ...s, seconds: +(s.visible / FPS).toFixed(2), scene: s.first !== null ? sceneOf(s.first) : '-',
  logoMaxSkewPx: s.aspect.length ? +Math.max(...s.aspect).toFixed(2) : undefined, aspect: undefined }));
fs.mkdirSync(path.join(ROOT, 'out/qc'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out/qc/text.json'), JSON.stringify(rows, null, 1));
let bad = 0;
for (const r of rows) {
  const short = !r.text.startsWith('LOGO') && r.seconds < 1.2, touch = r.settled !== null && r.settled < 4;
  if (short || touch || (r.logoMaxSkewPx > 0.5)) bad++;
  console.log(`${r.scene.padEnd(12)} ${String(r.seconds).padStart(5)}s  margin ${String(r.settled).padStart(5)}px  ` +
    `${r.outsideMotion ? `(${r.outsideMotion} motion frames outside) ` : ''}${short ? 'SHORT ' : ''}${touch ? 'TOUCHES EDGE ' : ''}${r.text}`);
}
console.log(bad ? `${bad} problem(s)` : 'all text readable >= 1.2 s, none touches the safe-zone edge, logo square');

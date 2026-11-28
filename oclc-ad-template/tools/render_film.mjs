// Render every frame of the film to PNG with several headless browsers in parallel.
//   node tools/render_film.mjs [workers=3]  -> out/_work/film/00000.png ... + events.json
import fs from 'node:fs';
import path from 'node:path';
import { openPage, ROOT } from './page.mjs';

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/upkk-2027.json'), 'utf8'));
const { width: W, height: H, fps: FPS, frames: N } = cfg.format;
const workers = +(process.argv[2] || 3);
const dir = path.join(ROOT, 'out/_work/film');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now();
let done = 0;
await Promise.all([...Array(workers).keys()].map(async (w) => {
  const { pg, close } = await openPage('scenes/film.html', W, H);
  if (w === 0) {
    fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(await pg.evaluate(() => window.EV), null, 1));
    const miss = await pg.evaluate(() => window.CUE_MISSING);
    if (miss.length) console.warn('WARNING: these beats wait for words that are not in the voice-over (they fall back to 0.3 s):\n  ' + miss.join('\n  ') + '\n  -> fix scenes[].cues in config/upkk-2027.json');
  }
  for (let f = w; f < N; f += workers) {
    await pg.evaluate((t) => window.render(t), f / FPS);
    await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await pg.screenshot({ path: path.join(dir, `${String(f).padStart(5, '0')}.png`), clip: { x: 0, y: 0, width: W, height: H } });
    if (++done % 100 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await close();
}));
const n = fs.readdirSync(dir).filter((f) => /^\d{5}\.png$/.test(f)).length;
if (n !== N) { console.error(`expected ${N} frames, got ${n}`); process.exit(1); }
console.log(`${n} frames -> out/_work/film in ${((Date.now() - t0) / 1000).toFixed(0)} s`);

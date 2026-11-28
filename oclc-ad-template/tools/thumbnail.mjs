// Cover image: out/thumbnail.jpg (1080 x 1920). All text and the logo must sit inside y 240-1680,
// the centre 1080 x 1440 that TikTok keeps when it crops covers to 3:4 in the profile grid.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openPage, ROOT } from './page.mjs';

const SPEC = { title: 'UPKK 2027?', subtitle: '2 PROGRAM CUTI SEKOLAH' };
const Y0 = 240, Y1 = 1680, X0 = 40, X1 = 1040;
const { pg, close } = await openPage('scenes/film.html', 1080, 1920);
await pg.evaluate((s) => window.renderThumbnail(s), SPEC);
await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const boxes = await pg.evaluate(() => [...document.querySelectorAll('.ui [data-essential]')].map((e) => {
  const r = e.getBoundingClientRect(); return { what: e.dataset.essential, text: e.textContent, box: [r.left, r.top, r.right, r.bottom].map(Math.round) };
}));
const png = path.join(ROOT, 'out/_work/thumbnail.png');
fs.mkdirSync(path.dirname(png), { recursive: true });
await pg.screenshot({ path: png, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
await close();
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', '2', path.join(ROOT, 'out/thumbnail.jpg')]);
let bad = 0;
for (const b of boxes) {
  const ok = b.box[1] >= Y0 && b.box[3] <= Y1 && b.box[0] >= X0 && b.box[2] <= X1;
  if (!ok) bad++;
  console.log(`${ok ? 'inside ' : 'OUTSIDE'} ${b.what.padEnd(5)} ${JSON.stringify(b.box)} ${b.text || ''}`);
}
console.log(bad ? `${bad} element(s) outside the 3:4 crop (y ${Y0}-${Y1})` : `thumbnail: all text and the logo inside the 3:4 crop (y ${Y0}-${Y1}) -> out/thumbnail.jpg`);
process.exitCode = bad ? 1 : 0;

// PNG preview frames and thumbnail.png at 1080×1920: node preview.mjs (LIB defaults to ~/lemo-opuscar)
import fs from 'fs'; import path from 'path'; import os from 'os'; import { fileURLToPath, pathToFileURL } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), LIB = process.env.LIB || path.join(os.homedir(), 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const SHOTS = [['preview_beat1_0.5s.png', .5], ['preview_beat3_12.8s.png', 12.8], ['preview_beat5_23.9s.png', 23.9]];
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: '', warnings: true });
// facts for qc.py: the Saved boxes on frame 0, and every subtitle card's note width (the note may not pass x = 940)
const qc = await page.evaluate(() => (window.render(0), { boxes: window.TEXTS(0).filter(b => b.id.startsWith('save')), subs: window.FILM.SUBS.map(s => ({ bm: s.bm, en: s.en, t0: s.t0, t1: s.t1, w: window.FILM.subWidth(s) })) }));
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true }); fs.writeFileSync(path.join(HERE, 'out/qc_page.json'), JSON.stringify(qc, null, 1));
for (const [f, t] of SHOTS) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(HERE, f), type: 'png' }); console.log(f); }
await browser.close();
{ const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: 'thumb=1', warnings: true });
  await page.evaluate(() => window.render(0)); await page.screenshot({ path: path.join(HERE, 'thumbnail.png'), type: 'png' }); console.log('thumbnail.png'); await browser.close(); }
closeServer();

// PNG preview frames at 1080×1920: node preview.mjs (LIB defaults to ~/lemo-opuscar)
import path from 'path'; import os from 'os'; import { fileURLToPath, pathToFileURL } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), LIB = process.env.LIB || path.join(os.homedir(), 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const SHOTS = [['preview_beat1_0.5s.png', .5], ['preview_beat3_12.8s.png', 12.8], ['preview_beat5_27.0s.png', 27.0]];
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: '', warnings: true });
for (const [f, t] of SHOTS) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(HERE, f), type: 'png' }); console.log(f); }
await browser.close(); closeServer();

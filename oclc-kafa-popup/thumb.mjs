// Thumbnail PNG: Klik bursting out of the open book + "KAFA? SATU KLIK JE!".  LIB=<library> node thumb.mjs
import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), LIB = process.env.LIB || path.join(process.env.HOME, 'lemo-opuscar');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: 'thumb=1' });
await page.evaluate(() => window.render(4.5));
await page.screenshot({ path: path.join(HERE, 'thumbnail.png'), type: 'png' });
await browser.close(); closeServer(); console.log('thumbnail.png');

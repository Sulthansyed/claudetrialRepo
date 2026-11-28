// Render a page of this project to PNG with headless Chromium.
//   node tools/render.mjs sheet/character-sheet.html out/character-sheet.png 4800 3300
// The page sets window.READY = true once fonts and images are in.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [page = 'sheet/character-sheet.html', out = 'out/character-sheet.png', w = '4800', h = '3300', scale = '1'] = process.argv.slice(2);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${page}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
const pg = await ctx.newPage();
const errors = [];
pg.on('pageerror', (e) => errors.push(e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await pg.goto(url);
try { await pg.waitForFunction(() => window.READY === true, null, { timeout: 60000 }); }
catch (e) { console.error('page never set READY', errors); process.exitCode = 1; }
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
fs.mkdirSync(path.dirname(path.resolve(ROOT, out)), { recursive: true });
await pg.screenshot({ path: path.resolve(ROOT, out), clip: { x: 0, y: 0, width: +w, height: +h } });
console.log('wrote', out);
await browser.close();
server.close();

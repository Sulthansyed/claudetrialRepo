// Stills and frame sequences from scenes/film.html.
//   node tools/frames.mjs keyframes            -> out/frames/scene-N.png, out/frames-safezone/scene-N.png, safe-zone + type-size report
//   node tools/frames.mjs seq <t0> <t1> <dir>  -> <dir>/00000.png ... at the film fps (frame-exact)
import fs from 'node:fs';
import path from 'node:path';
import { openPage, ROOT } from './page.mjs';

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/upkk-2027.json'), 'utf8'));
const { width: W, height: H, fps: FPS } = cfg.format;
const [cmd, ...args] = process.argv.slice(2);
const { pg, close } = await openPage('scenes/film.html', W, H);
const shot = async (t, file, safe = false) => {
  await pg.evaluate(([t, safe]) => window.render(t, { safe }), [t, safe]);
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await pg.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
};

if (cmd === 'keyframes') {
  const scenes = await pg.evaluate(() => window.SCENES);
  let problems = 0;
  for (const [i, s] of scenes.entries()) {
    const t = Math.max(s.t0, s.t1 - 0.3); // settled: everything has landed
    await shot(t, path.join(ROOT, `out/frames/scene-${i + 1}.png`));
    const bad = await pg.evaluate(() => window.checkSafe());
    const sizes = await pg.evaluate(() => window.textSizes());
    await shot(t, path.join(ROOT, `out/frames-safezone/scene-${i + 1}.png`), true);
    const minPx = Math.min(...sizes.map((x) => x.size));
    // every on-screen text from the config must appear on screen (wrapped lines joined with a space)
    const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/brand.json'), 'utf8'));
    const shown = ' ' + sizes.map((x) => x.text).join(' ') + ' ';
    for (const o of cfg.scenes[i].on_screen_text) {
      const want = o.text.replace('{whatsapp_display}', brand.contact.whatsapp_display).replace('{website}', brand.contact.website);
      if (!shown.includes(' ' + want + ' ')) { problems++; console.log('   MISSING TEXT', JSON.stringify(want)); }
    }
    console.log(`scene ${i + 1} ${s.id.padEnd(12)} t=${t.toFixed(2)}s  texts=${sizes.length}  smallest=${minPx}px  outside safe zone: ${bad.length}`);
    for (const b of bad) { problems++; console.log('   OUTSIDE', JSON.stringify(b)); }
    for (const x of sizes) console.log(`   ${String(x.size).padStart(3)}px  ${x.text}`);
  }
  console.log(problems ? `${problems} essential element(s) outside the safe zone` : 'all essential text and logos inside the safe zone');
} else if (cmd === 'seq') {
  const [t0, t1, dir] = [+args[0], +args[1], path.resolve(ROOT, args[2])];
  fs.rmSync(dir, { recursive: true, force: true });
  const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS);
  for (let f = f0; f < f1; f++) await shot(f / FPS, path.join(dir, `${String(f - f0).padStart(5, '0')}.png`));
  const ev = await pg.evaluate(() => window.EV);
  fs.writeFileSync(path.join(dir, 'events.json'), JSON.stringify(ev.filter((e) => e.t >= t0 && e.t < t1).map((e) => ({ ...e, t: e.t - t0 })), null, 1));
  console.log(`${f1 - f0} frames -> ${path.relative(ROOT, dir)}`);
}
await close();

// Write the reusable SVG rigs from the rig sources:
//   characters/<name>/rig.svg                 every part at rest, one <g> per part (+ hidden variants),
//                                             with data-parent / data-pivot / data-z for any animation tool
//   characters/<name>/poses/<pose>.svg        each approved pose, composed
//   characters/<name>/expressions/<e>.svg     the kids' heads, per expression
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expand, compose, svgDoc } from '../characters/lib/rig.js';
import { paperDefs } from '../characters/lib/paper.js';
import { poses, expressionsShown } from '../characters/poses.js';
import boy from '../characters/boy/rig.js';
import girl from '../characters/girl/rig.js';
import klik from '../characters/klik/rig.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/brand.json'), 'utf8'));
const C = { ...brand.illustration_palette };
for (const [k, v] of Object.entries(brand.colors)) C[k] = v.hex;
const defs = paperDefs({ ink: C.navy });
const write = (rel, s) => { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); return rel; };

for (const make of [boy, girl, klik]) {
  const rig = expand(make(C));
  const dir = `characters/${rig.name}`;
  // rig.svg: parts at rest, not composed; variants included, hidden except the default
  const parts = [...rig.parts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0)).map((p) => {
    const attrs = `id="${p.id}" data-parent="${p.parent || ''}" data-pivot="${p.pivot.join(',')}" data-z="${p.z ?? 0}" data-fx="${p.fx || 'n'}"`;
    const fx = (s) => (p.fx === 'none' ? s : `<g filter="url(#${p.fx === 's' ? 'pp-tex-s' : 'pp-tex'})">${s}</g>`);
    if (p.variants) {
      const v = Object.entries(p.variants).map(([k, s]) =>
        `<g id="${p.id}--${k}" data-variant="${k}"${k === p.def ? '' : ' display="none"'}>${fx(s)}</g>`).join('');
      return `<g ${attrs} data-default="${p.def}">${v}</g>`;
    }
    return p.svg ? `<g ${attrs}>${fx(p.svg)}</g>` : `<g ${attrs}/>`;
  });
  const [x, y, w, h] = rig.view;
  write(`${dir}/rig.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">` +
    `<!-- ${rig.name}: separate-part rig at rest. Source of truth: rig.js. Units: feet at y=0. L/R = screen side. -->${defs}` +
    `${parts.join('\n')}</svg>`);
  const done = [];
  for (const [k, pose] of Object.entries(poses[rig.name])) {
    done.push(write(`${dir}/poses/${k}.svg`, svgDoc(compose(rig, pose).svg, rig.view, defs)));
  }
  if (rig.name !== 'klik') {
    for (const e of expressionsShown) {
      done.push(write(`${dir}/expressions/${e}.svg`, svgDoc(compose(rig, { expr: e }, { only: 'head' }).svg, [-140, -600, 280, 290], defs)));
    }
  }
  console.log(`${rig.name}: ${rig.parts.length} parts, ${done.length} files`);
}

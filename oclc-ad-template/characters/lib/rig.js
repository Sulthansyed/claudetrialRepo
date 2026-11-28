// Separate-part 2D rig for paper-cut characters. No DOM: runs in the browser and in Node.
//
// A rig is { name, view:[x,y,w,h], parts:[...], chains:{...}, expressions:{...}, props:{...} }.
// Every part is drawn in ONE shared rest coordinate system (feet at y=0, y up is negative).
//   { id, parent, pivot:[x,y], z, svg | variants:{name:svg}, def:'variant', fx:'n'|'s'|'none', pair:true }
// pair:true on an ...L part creates its mirror ...R (L/R = side as seen on screen).
//
// A pose only moves and swaps parts, so a character is identical in every pose:
//   { expr:'happy',                       // face preset from rig.expressions
//     rot:{ id: deg },                    // about the part's pivot; for L/R pairs, + = outward / up on both sides
//     off:{ id:[dx,dy] },                 // offset in parent space (dx mirrored for R parts)
//     scale:{ id:[sx,sy] }, var:{ id:'variant' }, z:{ id:n }, hide:[id],
//     reach:{ armL:{ to:[x,y], bend:'out'|'in'|'up'|'down' } },   // two-bone IK, target in character space
//     props:[{ use:'books', parent:'torso', at:[x,y], rot, scale, z }] }

const D = Math.PI / 180;
const mul = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const T = (x, y) => [1, 0, 0, 1, x, y];
const R = (d) => { const c = Math.cos(d * D), s = Math.sin(d * D); return [c, s, -s, c, 0, 0]; };
const S = (x, y = x) => [x, 0, 0, y, 0, 0];
const I = [1, 0, 0, 1, 0, 0];
const ap = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const inv = (m) => { const d = m[0] * m[3] - m[1] * m[2];
  return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; };
const ang = ([x, y]) => Math.atan2(y, x) / D;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = ([x, y]) => Math.hypot(x, y);
const fmt = (m) => `matrix(${m.map((v) => +v.toFixed(4)).join(' ')})`;
const mirrorId = (id) => id.replace(/L$/, 'R');
const mirrorSvg = (s) => `<g transform="scale(-1 1)">${s}</g>`;

export function expand(rig) {
  if (rig._expanded) return rig;
  const parts = [];
  for (const p of rig.parts) {
    parts.push(p);
    if (p.pair) {
      const q = { ...p, id: mirrorId(p.id), mirrored: true, pair: false,
        parent: p.parent && /L$/.test(p.parent) ? mirrorId(p.parent) : p.parent,
        pivot: [-p.pivot[0], p.pivot[1]] };
      if (p.svg) q.svg = mirrorSvg(p.svg);
      if (p.variants) q.variants = Object.fromEntries(Object.entries(p.variants).map(([k, v]) => [k, mirrorSvg(v)]));
      parts.push(q);
    }
  }
  // parents before children
  const seen = new Set(), out = [];
  const visit = (p) => { if (seen.has(p.id)) return; if (p.parent) visit(parts.find((x) => x.id === p.parent)); seen.add(p.id); out.push(p); };
  parts.forEach(visit);
  return { ...rig, parts: out, _expanded: true };
}

function mergePose(rig, pose) {
  const e = (pose.expr && rig.expressions?.[pose.expr]) || {};
  const r = rig.rest || {};
  const m = (k) => ({ ...(r[k] || {}), ...(e[k] || {}), ...(pose[k] || {}) });
  return { ...pose, rot: m('rot'), off: m('off'), scale: m('scale'), var: m('var'), z: m('z'),
    hide: [...(r.hide || []), ...(pose.hide || [])] };
}

function solveIK(rig, byId, M, chain, spec, rawRot) {
  const [upId, loId, handId] = rig.chains[chain];
  const up = byId[upId], lo = byId[loId], hand = byId[handId];
  const Mp = M[up.parent] || I;
  const tgt = ap(inv(Mp), spec.to);
  const Sx = up.pivot, E0 = lo.pivot, W0 = hand.pivot;
  const a = len(sub(E0, Sx)), b = len(sub(W0, E0));
  let d = len(sub(tgt, Sx));
  d = Math.min(Math.max(d, Math.abs(a - b) + 0.5), a + b - 0.01);
  const phi = ang(sub(tgt, Sx));
  const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d)) / D;
  const cands = [1, -1].map((sg) => {
    const ud = phi + sg * alpha;
    const E = [Sx[0] + a * Math.cos(ud * D), Sx[1] + a * Math.sin(ud * D)];
    const th1 = ud - ang(sub(E0, Sx));
    const th2 = ang(sub(tgt, E)) - ang(sub(W0, E0)) - th1;
    return { E, th1, th2 };
  });
  const side = Math.sign(Sx[0]) || 1;
  const score = { out: (c) => c.E[0] * side, in: (c) => -c.E[0] * side, down: (c) => c.E[1], up: (c) => -c.E[1] }[spec.bend || 'out'];
  const best = score(cands[0]) >= score(cands[1]) ? cands[0] : cands[1];
  rawRot[upId] = best.th1;
  rawRot[loId] = best.th2;
  if (spec.hand != null) rawRot[handId] = (hand.mirrored ? -1 : 1) * spec.hand;
}

// Returns { svg, parts } where svg is a <g> (no defs; add paperDefs() once per document).
export function compose(rigIn, poseIn = {}, opts = {}) {
  const rig = expand(rigIn);
  const pose = mergePose(rig, poseIn);
  const byId = Object.fromEntries(rig.parts.map((p) => [p.id, p]));
  const M = {}, rawRot = {};
  for (const p of rig.parts) {
    const sgn = p.mirrored ? -1 : 1;
    if (rawRot[p.id] == null) rawRot[p.id] = sgn * (pose.rot[p.id] || 0);
    // IK: solve when we reach the first bone of a chain
    for (const [chain, spec] of Object.entries(pose.reach || {})) {
      if (rig.chains?.[chain]?.[0] === p.id) solveIK(rig, byId, M, chain, spec, rawRot);
    }
    const off = pose.off[p.id] || [0, 0];
    const sc = pose.scale[p.id] || [1, 1];
    const local = [T(off[0] * sgn, off[1]), T(...p.pivot), R(rawRot[p.id]), S(sc[0], sc[1]), T(-p.pivot[0], -p.pivot[1])].reduce(mul);
    M[p.id] = mul(M[p.parent] || I, local);
  }
  // subtree filter (e.g. only:'head' for expression sheets)
  const inTree = (id) => { for (let q = byId[id]; q; q = byId[q.parent]) if (q.id === opts.only) return true; return false; };
  const items = [];
  rig.parts.forEach((p, i) => {
    if (pose.hide.includes(p.id)) return;
    if (opts.only && !inTree(p.id)) return;
    let svg = p.svg;
    if (p.variants) svg = p.variants[pose.var[p.id] || p.def] ?? p.variants[p.def];
    if (!svg) return;
    items.push({ id: p.id, z: pose.z[p.id] ?? p.z ?? 0, i, m: M[p.id], svg, fx: p.fx || 'n' });
  });
  (pose.props || []).forEach((pr, k) => {
    if (opts.only && !inTree(pr.parent)) return;
    const def = typeof pr.use === 'string' ? rig.props?.[pr.use] : pr.use;
    if (!def) throw new Error(`unknown prop ${pr.use}`);
    const m = [M[pr.parent] || I, T(...(pr.at || [0, 0])), R(pr.rot || 0), S(...(Array.isArray(pr.scale) ? pr.scale : [pr.scale || 1]))].reduce(mul);
    items.push({ id: `prop-${pr.use}-${k}`, z: pr.z ?? 100, i: 1000 + k, m, svg: def.svg ?? def, fx: def.fx || 'n' });
  });
  items.sort((a, b) => a.z - b.z || a.i - b.i);
  const body = items.map(({ id, m, svg, fx }) => {
    const tex = fx === 'none' ? svg : `<g filter="url(#${fx === 's' ? 'pp-tex-s' : 'pp-tex'})">${svg}</g>`;
    const inner = `<g transform="${fmt(m)}">${tex}</g>`;
    return fx === 'none' ? `<g data-part="${id}">${inner}</g>` : `<g data-part="${id}" filter="url(#pp-lift)">${inner}</g>`;
  }).join('\n');
  return { svg: `<g class="rig rig-${rig.name}">${body}</g>`, matrices: M };
}

// Where a part's rest point ends up in character space for a pose (for placing effects, speech marks, etc.).
export function locate(rig, pose, partId, pt) {
  const { matrices } = compose(rig, pose);
  return ap(matrices[partId], pt || expand(rig).parts.find((p) => p.id === partId).pivot);
}

// A standalone .svg document (for the exported rig and pose files).
export function svgDoc(inner, view, defs, bg) {
  const [x, y, w, h] = view;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${defs}` +
    (bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>` : '') +
    `<g filter="url(#pp-drop)">${inner}</g></svg>`;
}

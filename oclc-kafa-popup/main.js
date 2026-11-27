// "KAFA Satu Klik" — OCLC, 30 s vertical. Scene, spreads, choreography, camera, captions, render(t).
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, seg, ss, eio, eo, back, spring, TAU, mulberry, track } from './lib.js';
import * as A from './art.js';
import { cv, paperFill, finishCut, GRAIN, INK, smoothOpen } from './paper.js';
import { makeBook, texOf, BW, BD, PG } from './book.js';
import { cutMesh, blobShadow, thread } from './cutmesh.js';
import { makePost } from './post.js';
import { DUR, OPEN, TURNS, RISE, FOLD, T, CAPS, BUB, VO, MUSIC0, BEAT, BAR, GRID0 } from './story.js';

const Q = new URLSearchParams(location.search), THUMB = Q.has('thumb');
const W = innerWidth || 1080, H = innerHeight || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const OX = ov.getContext('2d');
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(34, W / H, .004, 30);
const post = makePost(renderer, scene, cam, W, H);

// ---------- assets ----------
await Promise.all(['500 40px Fredoka', '600 40px Fredoka', '700 40px Fredoka', '40px "Lilita One"'].map(f => document.fonts.load(f, 'Aa')));
const hdr = await new RGBELoader().loadAsync('assets/lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.background = hdr; scene.backgroundBlurriness = .25;
scene.backgroundRotation.set(0, 2.3, 0); scene.environmentRotation.set(0, 2.3, 0);
const tl = new THREE.TextureLoader();
const wt = n => { const t = tl.load(`assets/walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 8; return t; };
const wdiff = wt('diff'); wdiff.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wdiff, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#c9a88a', envMapIntensity: .8 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);
{ // a real teacup beside the book
  const m = (await new GLTFLoader().loadAsync('assets/tea_set_01/tea_set_01.gltf')).scene, dead = [];
  m.traverse(o => { if (!o.name.startsWith('tea_set_01_')) return; if (o.name === 'tea_set_01_cup_small_01' || o.name === 'tea_set_01_saucer_circular_04') { o.position.x = .31; o.position.z = .40; if (o.name.includes('cup')) o.position.y += .012; } else dead.push(o); });
  dead.forEach(o => o.parent && o.parent.remove(o)); m.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); scene.add(m);
}

// ---------- the book ----------
function cover() {
  const w = 2048, h = Math.round(2048 * BD / BW), c = cv(w, h), x = c.getContext('2d'), m = cv(w, h), y = m.getContext('2d');
  x.fillStyle = '#17606e'; x.fillRect(0, 0, w, h); const R = mulberry(3);
  for (let i = 0; i < h; i += 3) { x.fillStyle = `rgba(0,0,0,${.05 + R() * .07})`; x.fillRect(0, i, w, 1.2); }
  for (let i = 0; i < w; i += 3) { x.fillStyle = `rgba(255,255,255,${.02 + R() * .04})`; x.fillRect(i, 0, 1.2, h); }
  y.fillStyle = 'rgb(0,235,0)'; y.fillRect(0, 0, w, h);
  const both = fn => { x.save(); fn(x, '#e0b456'); x.restore(); y.save(); fn(y, 'rgb(0,90,255)'); y.restore(); };
  both((k, col) => { k.strokeStyle = col; k.lineWidth = 10; k.strokeRect(90, 90, w - 180, h - 180); k.lineWidth = 8; k.strokeRect(w * .5 - 330, 150, 660, h - 300); k.fillStyle = col; k.textAlign = 'center';
    for (const [cx, cy] of [[w * .5 - 330, 150], [w * .5 + 330, 150], [w * .5 - 330, h - 150], [w * .5 + 330, h - 150]]) { k.beginPath(); k.arc(cx, cy, 22, 0, Math.PI * 2); k.fill(); } });
  // title: bright cream, matte (not foil), with a subtle dark shadow
  x.save(); x.textAlign = 'center'; x.fillStyle = '#FFF3D6'; x.shadowColor = 'rgba(10,20,24,.55)'; x.shadowBlur = 18; x.shadowOffsetX = 0; x.shadowOffsetY = 8;
  x.font = '200px "Lilita One"'; x.fillText('KAFA', w * .5, h * .74); x.font = '112px "Lilita One"'; x.fillText('Satu Klik', w * .5, h * .855); x.restore();
  const kc = cv(A.KLIK_W, A.KLIK_H); A.drawKlik(kc.getContext('2d'), { eyesK: 'happy', mouthK: 'open', armR: 2.3, armL: .5 }); const kw = 520; x.drawImage(finishCut(kc, 16), w * .5 - kw / 2, h * .13, kw, kw * A.KLIK_H / A.KLIK_W);
  return { c, m };
}
const book = makeBook(cover()); scene.add(book.root);

// ---------- page art: 7 spreads ----------
const PW = 2048, PH = Math.round(2048 * BD / BW);
const gx = xm => (xm / BW + .5) * PW, gz = zm => zm / BD * PH, sy = ym => (1 - ym / BD) * PH;
function page(fn) { const c = cv(PW, PH), x = c.getContext('2d'); fn(x); x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PW, PH); x.restore(); return c; }
function grad(x, stops, x0 = 0, y0 = 0, x1 = 0, y1 = PH) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, PW, PH); }
function dots(x, seed, n, cols, r0 = 6, r1 = 12) { const R = mulberry(seed); for (let i = 0; i < n; i++) { x.beginPath(); x.arc(R() * PW, R() * PH, r0 + R() * (r1 - r0), 0, TAU); x.fillStyle = cols[(R() * cols.length) | 0]; x.fill(); } }
function stripes(x, n = 9, a = .07) { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * .5})`; x.fillRect(0, PH * i / n, PW, PH / n); } }
function homeWall(x, evening) {
  grad(x, evening ? [[0, '#ffc79a'], [1, '#ffe0c0']] : [[0, '#ffd9b8'], [1, '#ffeedd']]);
  x.fillStyle = evening ? '#f3a878' : '#f6c49c'; x.fillRect(0, sy(.065), PW, PH); x.fillStyle = 'rgba(58,42,36,.5)'; x.fillRect(0, sy(.065) - 6, PW, 12);
  // window
  const wx0 = gx(-.17), wx1 = gx(-.035), wy0 = sy(.27), wy1 = sy(.12);
  const sk = x.createLinearGradient(0, wy0, 0, wy1); if (evening) { sk.addColorStop(0, '#ff9a6a'); sk.addColorStop(1, '#ffd38a'); } else { sk.addColorStop(0, '#7cc6ef'); sk.addColorStop(1, '#d4f0fa'); }
  x.fillStyle = sk; x.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  x.fillStyle = evening ? '#3a7a64' : '#5fae6a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(wx0 + (i + .5) * (wx1 - wx0) / 4, wy1, 90, 70, 0, Math.PI, 0); x.fill(); }
  if (evening) { x.beginPath(); x.arc(wx0 + (wx1 - wx0) * .7, wy0 + (wy1 - wy0) * .62, 46, 0, TAU); x.fillStyle = '#fff1b0'; x.fill(); }
  x.lineWidth = 22; x.strokeStyle = '#fffaf0'; x.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0); x.beginPath(); x.moveTo((wx0 + wx1) / 2, wy0); x.lineTo((wx0 + wx1) / 2, wy1); x.stroke();
  x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(wx0 - 11, wy0 - 11, wx1 - wx0 + 22, wy1 - wy0 + 22);
  for (const [cx, d] of [[wx0 - 40, 1], [wx1 + 40, -1]]) { x.beginPath(); x.moveTo(cx - 50, wy0 - 40); x.lineTo(cx + 50, wy0 - 40); x.quadraticCurveTo(cx + 20 * d, (wy0 + wy1) / 2, cx + 40, wy1 + 30); x.lineTo(cx - 40, wy1 + 30); x.quadraticCurveTo(cx - 20 * d, (wy0 + wy1) / 2, cx - 50, wy0 - 40); x.closePath(); x.fillStyle = '#2f9b8f'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
  // shelf with plain books
  x.fillStyle = '#c98a52'; x.fillRect(gx(.06), sy(.21), gx(.18) - gx(.06), 22); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(gx(.06), sy(.21), gx(.18) - gx(.06), 22);
  ['#3d7fd0', '#e8413a', '#46b49a', '#ffd23f', '#b9a0ea', '#3d7fd0'].forEach((c, i) => { const bx = gx(.07) + i * 46, hh = 90 + (i % 3) * 18; x.fillStyle = c; x.fillRect(bx, sy(.21) - hh, 38, hh); x.strokeRect(bx, sy(.21) - hh, 38, hh); });
  // a framed flower picture
  const fx0 = gx(.08), fy0 = sy(.165); x.fillStyle = '#fffaf0'; x.fillRect(fx0, fy0, 200, 150); x.strokeRect(fx0, fy0, 200, 150);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; x.beginPath(); x.ellipse(fx0 + 100 + Math.cos(a) * 26, fy0 + 70 + Math.sin(a) * 26, 22, 14, a, 0, TAU); x.fillStyle = '#ee8fa8'; x.fill(); } x.beginPath(); x.arc(fx0 + 100, fy0 + 70, 14, 0, TAU); x.fillStyle = '#ffd23f'; x.fill();
}
function homeFloor(x) {
  grad(x, [[0, '#d9a877'], [1, '#e8bd8e']]);
  x.strokeStyle = 'rgba(120,70,40,.35)'; x.lineWidth = 5; for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(0, PH * i / 14); x.lineTo(PW, PH * i / 14); x.stroke(); }
  const R = mulberry(4); for (let i = 0; i < 14; i++) { const yy = PH * i / 14, o = R() * 400; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(o + k * 420, yy); x.lineTo(o + k * 420, yy + PH / 14); x.stroke(); } }
  x.beginPath(); x.ellipse(gx(0), gz(.17), 720, 230, 0, 0, TAU); x.fillStyle = '#2f9b8f'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
  x.beginPath(); x.ellipse(gx(0), gz(.17), 640, 190, 0, 0, TAU); x.lineWidth = 10; x.strokeStyle = '#fffaf0'; x.stroke();
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, px = gx(0) + Math.cos(a) * 520, py = gz(.17) + Math.sin(a) * 150; x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillStyle = i % 2 ? '#ffd23f' : '#ee8fa8'; x.fillRect(-16, -16, 32, 32); x.restore(); }
}
const P = [];
P.push({ sky: page(x => homeWall(x, false)), ground: page(homeFloor) });
P.push({ // road
  sky: page(x => {
    grad(x, [[0, '#a9d4ee'], [1, '#e4f2f6']]);
    const R = mulberry(12);
    for (const [col, h0, h1, wl] of [['#b9cbe0', .12, .22, 120], ['#94adc8', .07, .16, 150]]) for (let px = -40; px < PW; px += wl + R() * 60) {
      const bh = PH * (h0 + R() * (h1 - h0)); x.fillStyle = col; x.fillRect(px, PH - bh - sy(.3) * 0 - (PH - sy(0)), wl, bh);
      x.fillStyle = 'rgba(255,240,170,.75)'; for (let wy = PH - bh + 30; wy < PH - 40; wy += 46) for (let wx = px + 18; wx < px + wl - 24; wx += 34) if (R() < .6) x.fillRect(wx, wy, 16, 22);
    }
    x.fillStyle = '#fffaf0'; for (let i = 0; i < 5; i++) { const cx = R() * PW, cy = PH * (.12 + R() * .3); for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(cx + k * 60, cy - Math.sin(k) * 20, 70, 42, 0, 0, TAU); x.fill(); } }
  }),
  ground: page(x => {
    x.fillStyle = '#c9c2b0'; x.fillRect(0, 0, PW, gz(.06)); x.fillStyle = '#7c8696'; x.fillRect(0, gz(.06), PW, gz(.24) - gz(.06)); x.fillStyle = '#8fcf6e'; x.fillRect(0, gz(.24), PW, PH);
    x.fillStyle = '#fff'; for (const zz of [.06, .24]) x.fillRect(0, gz(zz) - 8, PW, 16);
    x.fillStyle = '#ffd23f'; for (let px = 0; px < PW; px += 200) x.fillRect(px, gz(.142) - 9, 120, 18);
  }),
});
const flat = (c0, c1, seed, dcol) => ({ sky: page(x => { grad(x, [[0, c0], [1, c1]]); const R = mulberry(seed); for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(R() * PW, R() * PH * .8, 60 + R() * 140, 0, TAU); x.fillStyle = 'rgba(255,255,255,.28)'; x.fill(); } dots(x, seed + 1, 60, dcol, 6, 12); }), ground: null });
P.push(flat('#bfeccb', '#effbe9', 21, ['#ffffff', '#ffd23f'])); P[2].ground = page(x => { grad(x, [[0, '#7fd18e'], [1, '#98dea2']]); stripes(x); dots(x, 23, 140, ['#ffffff', '#ffd23f', '#ff9ec1']); });
P.push(flat('#ddd0ff', '#f6f0ff', 31, ['#ffffff', '#ffd23f'])); P[3].ground = page(x => { grad(x, [[0, '#bda7ef'], [1, '#d1c1f7']]); stripes(x); dots(x, 33, 120, ['#ffffff', '#ffe066']); });
P.push(flat('#c3efe6', '#ecfbf6', 41, ['#ffffff', '#ffd23f'])); P[4].ground = page(x => { grad(x, [[0, '#6fd2bb'], [1, '#8adfca']]); stripes(x); dots(x, 43, 120, ['#ffffff', '#ffd23f']); });
P.push({ sky: page(x => { grad(x, [[0, '#ffd66b'], [1, '#fff1c4']]); x.save(); x.translate(PW / 2, PH * .45); for (let i = 0; i < 18; i++) { x.rotate(TAU / 18); x.beginPath(); x.moveTo(0, 0); x.lineTo(1600, -140); x.lineTo(1600, 140); x.closePath(); x.fillStyle = i % 2 ? 'rgba(255,255,255,.22)' : 'rgba(255,170,40,.10)'; x.fill(); } x.restore(); dots(x, 51, 70, ['#ffffff', '#ff9a2e']); }), ground: page(x => { grad(x, [[0, '#ffc23f'], [1, '#ffd466']]); stripes(x); dots(x, 53, 120, ['#ffffff', '#e8413a']); }) });
P.push({ sky: page(x => homeWall(x, true)), ground: P[0].ground });
const SP = P.map(p => ({ sky: texOf(p.sky), ground: texOf(p.ground) }));

// ---------- pop-up pieces ----------
const POPS = [];
function popper(spread, obj, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.add(obj); (o.parent || book.stage).add(g);
  const r = { g, m: obj, spread, d: o.d ?? z * .7, dir: o.dir ?? (z > .17 ? -1 : 1), sway: o.sway || 0, ph: x * 40, t0: o.t0, fold: o.fold, keep: o.keep };
  POPS.push(r); return r;
}
const cm = (item, o) => cutMesh(item, o);
function riseOf(r, t) {
  const t0 = (r.t0 ?? RISE[r.spread]) + r.d, tf = (r.fold ?? FOLD[r.spread]) + r.d * .4;
  return Math.min(back(seg(t, t0, t0 + .5), 1.7), 1 - ss(seg(t, tf, tf + .32)));
}
// spread 0 + 6: home
const homeSet = (s, ev) => {
  popper(s, cm(A.sofa(.13)), .07, 0, .045);
  popper(s, cm(A.plant(.095, 2 + s)), -.1, 0, .04, { sway: .02 });
  popper(s, cm(A.sideTable(.05)), -.085, 0, .1);
};
homeSet(0); homeSet(6);
// clocks hang on strings from the top of the backdrop
function hangingClock(s) {
  const g = new THREE.Group(), face = cm(A.clockFace(.03)), mh = cm(A.clockHand(.024, .005, '#1f3c6e')), hh = cm(A.clockHand(.016, .006, '#e8413a'));
  mh.position.z = .0012; hh.position.z = .0018; g.add(face, mh, hh);
  for (const dx of [-.018, .018]) { const th = thread(.2); th.position.set(dx, .024, -.001); g.add(th); }
  g.position.set(-.02, .1, .02); book.sky.add(g); return { g, mh, hh, s };
}
const CLK = [hangingClock(0), hangingClock(6)];
const slit = cm(A.slitMark(.034)); slit.rotation.x = -Math.PI / 2; slit.position.set(.03, .0006, .2); book.stage.add(slit);
// spread 1: road
const CARS = [];
for (const [x, z, col, sh, fam] of [[-.075, .1, '#3d7fd0', '#2a5ea8'], [.02, .1, '#ffd23f', '#e0aa1e'], [.105, .1, '#46b49a', '#2f9580'], [-.1, .175, '#fffaf0', '#d9cfbd'], [.0, .178, '#e8413a', '#c22f28', true], [.1, .175, '#ff9a2e', '#e07818']]) {
  const r = popper(1, cm(A.car(fam ? .085 : .072, col, sh, { family: fam })), x, 0, z, { dir: -1 }); r.car = true; r.x0 = x; r.fam = fam; CARS.push(r);
}
popper(1, cm(A.trafficLight(.075)), -.13, 0, .045);
const HONK = [[6.95, -.075, .1], [7.5, .0, .178], [8.05, .02, .1]].map(([t0, x, z]) => { const m = cm(A.honk(.034)); m.position.set(x + .02, .045, z + .002); m.visible = false; book.stage.add(m); return { t0, m }; });
// spread 2: ① chat app icon + "Daftar" button
popper(2, cm(A.chatIcon(.08)), -.012, 0, .05);
const BTN = popper(2, cm(A.pillButton(.06, 'DAFTAR')), -.01, 0, .112);
// spread 3: ② laptop with a small-group class
const base = cm(A.laptopBase(.09)); base.rotation.x = -Math.PI / 2; const baseG = new THREE.Group(); baseG.add(base); baseG.position.set(.022, .0008, .118); book.stage.add(baseG);
const LAP = popper(3, cm(A.laptopScreen(.09)), .022, .0008, .095, { dir: -1, d: .05 });
// spread 4: ③ tablet with the ustazah listening + tick
popper(4, cm(A.tablet(.1)), -.024, 0, .055);
const TICK = cm(A.tickBadge(.019)); TICK.position.set(.03, .096, .07); TICK.visible = false; book.stage.add(TICK);
// spread 5: ④ progress bar + stars
const PBAR = popper(5, cm(A.barFrame(0.07, 0.082)), 0, 0, .07);
const FILL = cm(A.barFill(0.0644, 0.0082)); const fillG = new THREE.Group(); fillG.add(FILL); fillG.position.set(-0.0322, 0.0744, .0016); PBAR.m.add(fillG);
const STARS = [0, 1, 2, 3, 4].map(i => { const m = cm(A.star(.0052)); m.position.set(-0.0258 + i * 0.0129, 0.0744, .004); m.visible = false; PBAR.m.add(m); return m; });
// end-card sign
const LOGO = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'oclc-logo.png'; });
const SIGN = new THREE.Group(); { const s = cm(A.endSign(.13, LOGO)); SIGN.add(s); for (const dx of [-.05, .05]) { const th = thread(.2); th.position.set(dx, 0, -.001); SIGN.add(th); } }
SIGN.position.set(0, .262, .03); SIGN.visible = false; book.sky.add(SIGN);

// ---------- characters (flat cards redrawn per quantized pose) ----------
function actor(draw, cw, ch, foot, hm, col) {
  const c = cv(cw, ch), scratch = cv(cw, ch), tex = texOf(c);
  const item = { c, w: hm * cw / ch, h: hm, ax: .5, ay: foot / ch };
  const mesh = cutMesh(item, { tex }); const body = new THREE.Group(); body.add(mesh); const root = new THREE.Group(); root.add(body);
  const shadow = blobShadow(hm * .3, .4); let key = '';
  return {
    root, body, shadow, hm,
    pose(p) {
      const k = JSON.stringify(p, (kk, v) => typeof v === 'number' ? Math.round(v * 24) / 24 : v); if (k === key) return; key = k;
      draw(scratch.getContext('2d'), p, col); const f = finishCut(scratch, 16);
      const x = c.getContext('2d'); x.clearRect(0, 0, cw, ch); x.drawImage(f, 0, 0); tex.needsUpdate = true;
    },
    head(v = new THREE.Vector3()) { return v.set(0, hm * .98, 0).applyMatrix4(body.matrixWorld); },
  };
}
const mkMum = c => actor(A.drawWoman, A.WOM_W, A.WOM_H, A.WOM_FOOT, .058, c);
const mkBoy = () => actor(A.drawBoy, A.BOY_W, A.BOY_H, A.BOY_FOOT, .042);
const mkKlik = () => actor(A.drawKlik, A.KLIK_W, A.KLIK_H, A.KLIK_H, .046);
const CAST = [
  { a: mkMum(A.MUM_COL), s: 0, x: -.02, z: .15, t0: T.mumPop },
  { a: mkBoy(), s: 3, x: -.05, z: .125 },
  { a: mkBoy(), s: 4, x: .044, z: .125 },
  { a: mkBoy(), s: 5, x: 0, z: .12 },
  { a: mkMum(A.MUM_COL), s: 6, x: -.018, z: .15, d: .05 },
  { a: mkBoy(), s: 6, x: .019, z: .155, d: .1 },
];
for (const c of CAST) { const r = popper(c.s, c.a.root, c.x, 0, c.z, { t0: c.t0, d: c.d ?? .08 }); c.r = r; book.stage.add(c.a.shadow); c.a.shadow.position.set(c.x, .0005, c.z); }
const klik = mkKlik(); book.stage.add(klik.root, klik.shadow);

// ---------- choreography ----------
const blinkAt = (t, o = 0) => { const p = (t + o) % 3.3; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; };
const wave = (t, a = 2.5) => a + Math.sin(t * 11) * .35;
function castPose(c, t) {
  const p = { blink: blinkAt(t, c.x * 10) };
  if (c.s === 0) { // stressed mum, then curious, then relieved
    if (t < T.klikPop) Object.assign(p, { brow: 'worried', mouthK: 'frown', look: [.3, -1], armR: .25 + .08 * Math.sin(t * 7), armL: .3 + .08 * Math.sin(t * 6), sweat: Math.round(((t * .9) % 1) * 8) / 8 });
    else if (t < T.klikPop + .6) Object.assign(p, { eyes: 'wide', mouthK: 'o', brow: 'up', look: [.9, .5] });
    else Object.assign(p, { eyes: 'open', mouthK: 'open', brow: 'up', look: [.8, .3], armR: 1.2 });
  } else if (c.s === 3) Object.assign(p, { mouthK: 'open', eyes: 'happy', armR: wave(t, 2.5) });
  else if (c.s === 4) Object.assign(p, { book: true, mouthK: 'talk', talk: Math.abs(Math.sin(t * 9.5)), eyes: t > T.tick ? 'happy' : 'open', look: [-.5, -.2] });
  else if (c.s === 5) Object.assign(p, { mouthK: 'open', eyes: 'happy', armL: t > T.jump - .2 ? 2.7 : 1.3, armR: t > T.jump - .2 ? 2.7 : 1.3 });
  else if (c.s === 6) Object.assign(p, c.a.hm > .05 ? { mouthK: 'smile', eyes: t > 21 ? 'happy' : 'open', brow: 'up', armR: .5 } : { mouthK: 'open', eyes: 'happy', armR: t > T.wave ? wave(t, 2.6) : .3 });
  return p;
}
function castY(c, t) {
  if (c.s === 5) { const k = seg(t, T.jump, T.jump + .45); return 4 * .022 * k * (1 - k); }
  return 0;
}
function klikState(t) {
  const S = { vis: false, x: .035, y: 0, z: .2, s: 1, p: { blink: blinkAt(t, 1.7), eyesK: 'open', mouthK: 'smile', armL: .3, armR: .3, press: 0 } }, p = S.p;
  const bob = (a = .0022) => Math.sin(t * 3.1) * a;
  const click = t0 => { const k = seg(t, t0 - .05, t0 + .18); return k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; };
  if (t >= T.klikPop - .02 && t < TURNS[0][0]) {
    S.vis = true; S.x = .03; S.z = .2;
    const up = back(seg(t, T.klikPop, T.klikPop + .42), 1.8), dn = ss(seg(t, T.klikHide, T.klikHide + .3));
    S.y = lerp(-.05, .014, up) - dn * .07 + bob() * up; p.press = click(T.klikPop + .05);
    p.eyesK = t > T.klikPop + .25 ? 'happy' : 'open'; p.mouthK = t > T.klikPop + .2 && t < 5.1 ? 'open' : 'smile'; p.armR = t > T.klikPop + .5 ? wave(t, 2.2) : .8; p.armL = .6;
  } else if (t >= T.klikRoadIn && t < TURNS[1][0] + .05) {
    S.vis = true; const k = eo(seg(t, T.klikRoadIn, T.klikRoadIn + .9));
    S.x = lerp(.2, .042, k); S.y = .055 + bob(); S.z = .2; p.press = click(T.click1); p.eyesK = t > T.click1 ? 'happy' : 'open'; p.armR = t > T.click1 + .3 ? wave(t, 2) : .5;
    S.s = 1 - ss(seg(t, TURNS[1][0] - .2, TURNS[1][0]));
  } else if (t >= TURNS[1][1] - .2 && t < TURNS[2][0] + .1) {
    S.vis = true; S.s = back(seg(t, TURNS[1][1] - .2, TURNS[1][1] + .2), 1.8) * (1 - ss(seg(t, TURNS[2][0] - .25, TURNS[2][0])));
    S.x = .04; S.z = .13; S.y = .045 + bob() - Math.sin(seg(t, T.press - .15, T.press + .2) * Math.PI) * .006; p.press = click(T.press); p.eyesK = t > T.press ? 'happy' : 'open'; p.armL = 1.2;
  } else if (t >= T.klikBack) {
    S.vis = true; S.s = back(seg(t, T.klikBack, T.klikBack + .4), 1.8);
    const e = eio(seg(t, T.endFold, T.endFold + 1.0));
    S.x = lerp(.02, .0, e); S.y = lerp(.066, .052, e) + bob(); S.z = lerp(.11, .16, e); p.eyesK = 'happy'; p.mouthK = 'open'; p.armR = t > T.wave ? wave(t, 2.6) : .4; p.armL = t > T.endFold + 1 ? 1.4 : .4;
  }
  return S;
}

// ---------- camera: [t, pos xyz, target xyz, fov, aperture, focus override] ----------
const SH = [[
  [0.0, 0, .43, .235, 0, .0, .15, 34, 1.2],
  [0.55, 0, .26, .5, -.01, .05, .12, 34, 1.4],
  [1.3, -.02, .072, .36, -.02, .058, .13, 32, 2.1],
  [3.1, -.02, .07, .335, -.02, .057, .13, 32, 2.2],
  [3.675, -.005, .1, .44, 0, .045, .14, 34, 2.2],
  [5.5, 0, .105, .45, 0, .045, .14, 34, 2.2],
  [6.5, 0, .25, .5, 0, .03, .14, 34, 1.8],
  [9.5, .01, .23, .48, .0, .03, .14, 34, 1.8],
  [10.35, 0, .27, .45, 0, .04, .09, 34, 1.7],
  [11.9, 0, .25, .41, 0, .04, .09, 34, 1.9],
  [12.65, 0, .27, .45, 0, .04, .09, 34, 1.7],
  [14.2, 0, .25, .41, 0, .04, .09, 34, 1.9],
  [14.95, 0, .27, .45, 0, .04, .09, 34, 1.7],
  [16.5, 0, .25, .41, 0, .04, .09, 34, 1.9],
  [17.25, 0, .08, .315, 0, .056, .1, 34, 2.0],
  [18.75, 0, .08, .305, 0, .056, .1, 34, 2.0],
  [19.75, 0, .07, .38, 0, .05, .135, 32, 2.1],
  [23.6, 0, .072, .37, 0, .05, .135, 32, 2.1],
  [24.6, 0, .15, .55, 0, .09, .1, 33, 1.6],
  [25.25, 0, .15, .67, 0, .12, .07, 33, 1.3],
  [30.5, 0, .148, .655, 0, .12, .07, 33, 1.3],
]];
const SHOTS = SH.map(keys => ({ t0: keys[0][0], f: track(keys.map(k => [k[0], k.slice(1, 9)])) }));
const THUMB_CAM = { pos: new THREE.Vector3(.0, .3, .66), tgt: new THREE.Vector3(.005, .085, .13), fov: 34, aper: 1.0 };
function camAt(t) { if (THUMB) return { pos: THUMB_CAM.pos.clone(), tgt: THUMB_CAM.tgt.clone(), fov: THUMB_CAM.fov, aper: THUMB_CAM.aper }; let s = SHOTS[0]; for (const S of SHOTS) if (t >= S.t0) s = S; const v = s.f(t); return { pos: new THREE.Vector3(v[0], v[1], v[2]), tgt: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6], aper: v[7] }; }

// ---------- lights ----------
const sun = new THREE.DirectionalLight('#fff3e0', 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.00008; sun.shadow.normalBias = .0003; sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, { left: -.3, right: .3, top: .3, bottom: -.3, near: .1, far: 3 }); sun.position.set(-.35, .6, .8); sun.target.position.set(0, .05, .12); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#dbeeff', '#caa27a', .55); scene.add(hemi);

// ---------- sound events ----------
const EV = [];
EV.push({ t: OPEN[0], type: 'creak' }, { t: OPEN[1] - .05, type: 'thump' });
for (const r of POPS) EV.push({ t: (r.t0 ?? RISE[r.spread]) + r.d + .08, type: 'pop', s: r.spread });
for (const [a, b] of TURNS) EV.push({ t: a, type: 'page', d: b - a });
EV.push({ t: T.klikPop + .05, type: 'click' }, { t: T.click1, type: 'click' }, { t: T.press, type: 'click' }, { t: T.press + .03, type: 'button' });
for (const h of HONK) EV.push({ t: h.t0, type: 'honk' });
for (const r of CARS) EV.push({ t: carFoldT(r), type: 'fold' }, { t: carFoldT(r) + .3, type: 'slide' });
EV.push({ t: T.tick, type: 'ding' }); T.stars.forEach((s, i) => EV.push({ t: s, type: 'star', i })); EV.push({ t: T.jump, type: 'hop' }, { t: T.jump + .45, type: 'land' });
EV.push({ t: T.signDrop, type: 'drop' }, { t: T.signDrop + .35, type: 'tink' }, { t: T.signDrop + .6, type: 'tink' });
for (let i = 0; i < 5; i++) EV.push({ t: BUB[0].t0 + .1 + i * .07, type: 'blip', who: 'klik' });
EV.push({ t: 0, type: 'tick', d: T.klikPop });
EV.sort((a, b) => a.t - b.t);
function carFoldT(r) { return T.carsFold + (r.g.position.z > .14 ? .14 : 0) + (r.x0 + .12) * .5; }
window.EV = EV; window.DUR = DUR;

// ---------- 2D overlay: captions, bubble, thumbnail ----------
const CAP_Y = Math.round(H * .715), CAP_X = Math.round(W * .477), CAP_W = Math.round(W * .8);
function wrap(ctx, text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (ctx.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; } if (cur) lines.push(cur); return lines; }
function outlined(ctx, text, x, y, fill, stroke, lw) { ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y); }
function drawCaps(t) {
  CAPS.forEach((c, i) => {
    const prev = CAPS[i - 1], next = CAPS[i + 1];
    const joinIn = prev && c.t0 - prev.t1 < .3, joinOut = next && next.t0 - c.t1 < .3;   // abutting captions cut, never cross-fade
    const a = Math.min(joinIn ? (t >= c.t0 ? 1 : 0) : seg(t, c.t0 - .15, c.t0 + .05), joinOut ? (t < c.t1 ? 1 : 0) : 1 - seg(t, c.t1 - .05, c.t1 + .15)); if (a <= 0) return;
    OX.save(); OX.globalAlpha = a; OX.font = `600 ${Math.round(W * .058)}px Fredoka`; OX.textAlign = 'center'; OX.textBaseline = 'middle';
    const lines = wrap(OX, c.text, CAP_W), lh = W * .072, y0 = CAP_Y - (lines.length - 1) * lh / 2;
    const pw = Math.max(...lines.map(l => OX.measureText(l).width)) + W * .07, ph = lines.length * lh + W * .035;
    OX.beginPath(); OX.roundRect(CAP_X - pw / 2, CAP_Y - ph / 2, pw, ph, Math.min(ph / 2, W * .05)); OX.fillStyle = 'rgba(18,12,8,.6)'; OX.fill();
    OX.fillStyle = '#ffffff'; lines.forEach((l, i) => OX.fillText(l, CAP_X, y0 + i * lh + W * .003));
    OX.restore();
  });
}
const tmpV = new THREE.Vector3();
function toScreen(v) { const p = v.clone().project(cam); if (p.z > 1) return null; return [(p.x * .5 + .5) * W, (-p.y * .5 + .5) * H]; }
let bubBox = null;
function drawBubble(t, anchor) {
  bubBox = null;
  for (const b of BUB) {
    if (t < b.t0 || t > b.t1 + .2 || !anchor) continue;
    const k = back(seg(t, b.t0, b.t0 + .25), 2), out = 1 - seg(t, b.t1, b.t1 + .2); if (k * out <= 0) continue;
    const n = Math.min(b.text.length, Math.floor((t - b.t0 - .1) * 30) + 1), txt = b.text.slice(0, Math.max(0, n));
    const bw = W * .26, bh = W * .13, bx = clamp(anchor[0] - W * .06, bw / 2 + 24, W - bw / 2 - 24), by = anchor[1] - W * .17;
    OX.save(); OX.translate(bx, by); OX.scale(k * out, k * out);
    OX.beginPath(); OX.roundRect(-bw / 2, -bh / 2, bw, bh, bh * .4); OX.moveTo(-bw * .2, bh * .4); OX.lineTo(anchor[0] - bx, anchor[1] - by); OX.lineTo(-bw * .02, bh * .45);
    OX.fillStyle = '#fffdf7'; OX.shadowColor = 'rgba(30,18,10,.3)'; OX.shadowBlur = 12; OX.shadowOffsetY = 5; OX.fill(); OX.shadowColor = 'transparent'; OX.lineWidth = 6; OX.strokeStyle = INK; OX.stroke();
    OX.font = `${Math.round(W * .07)}px "Lilita One"`; OX.textAlign = 'center'; OX.textBaseline = 'middle'; OX.fillStyle = '#1fb3a6'; OX.fillText(txt, 0, 4);
    OX.restore(); bubBox = [bx - bw / 2, by - bh / 2, bx + bw / 2, by + bh / 2];
  }
}
function drawThumb() {
  OX.save(); OX.textAlign = 'center'; OX.textBaseline = 'middle';
  const lines = [['KAFA?', .17, '#ffd23f'], ['SATU KLIK JE!', .115, '#ffffff']]; let y = H * .14;
  for (const [s, sz, col] of lines) { OX.font = `${Math.round(W * sz)}px "Lilita One"`; OX.shadowColor = 'rgba(20,10,5,.5)'; OX.shadowBlur = 20; OX.shadowOffsetY = 8; outlined(OX, s, W / 2, y, col, '#fffdf7', W * .045); OX.shadowColor = 'transparent'; outlined(OX, s, W / 2, y, col, '#3a2a24', W * .022); OX.fillStyle = col; OX.fillText(s, W / 2, y); y += W * sz * 1.05; }
  OX.restore();
}

// ---------- readable on-screen text for readcheck ----------
let LAST_T = 0;
function boxOf(obj, w, h, ax = .5, ay = 0) {
  const pts = [[-ax * w, ay ? 0 : 0], [w * (1 - ax), 0], [-ax * w, -h], [w * (1 - ax), -h]].map(([a, b]) => toScreen(new THREE.Vector3(a, b, 0).applyMatrix4(obj.matrixWorld))).filter(Boolean);
  if (!pts.length) return null; const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
window.TEXTS = t => {
  window.render(t); const out = [];
  if (bubBox) out.push({ id: 'bubble', text: 'klik!', x0: bubBox[0], y0: bubBox[1], x1: bubBox[2], y1: bubBox[3] });
  if (SIGN.visible && t > T.signDrop + .9) { const b = boxOf(SIGN.children[0], .13, .1274); if (b) out.push({ id: 'sign', text: 'OCLC One Click Learning Centre WhatsApp: +60 19-823 0383', x0: Math.max(0, b[0]), y0: Math.max(0, b[1]), x1: Math.min(W, b[2]), y1: Math.min(H, b[3]) }); }
  for (const h of HONK) if (h.m.visible) out.push({ id: 'honk' + h.t0, text: 'PON!', x0: 0, y0: 0, x1: 1, y1: 1, pass: true });
  if (BTN.g.visible) out.push({ id: 'btn', text: 'DAFTAR', x0: 0, y0: 0, x1: 1, y1: 1, pass: true });
  return out;
};

// ---------- render ----------
window.render = function (t) {
  LAST_T = t;
  book.setOpen(Math.PI / 2 * eio(seg(t, OPEN[0], OPEN[1])) + Math.sin(seg(t, OPEN[1] - .1, OPEN[1] + .45) * Math.PI) * -.035);
  let spread = 0; for (let i = 0; i < TURNS.length; i++) if (t >= TURNS[i][0]) spread = i + 1;
  let turning = -1; for (let i = 0; i < TURNS.length; i++) if (t >= TURNS[i][0] && t < TURNS[i][1]) turning = i;
  book.groundMat.map = SP[spread].ground; book.groundMat.needsUpdate = true;
  book.backMat.map = turning >= 0 ? SP[turning].sky : SP[spread].sky; book.backMat.needsUpdate = true;
  if (turning >= 0) {
    const lf = book.leafFront.material, lb = book.leafBack.material;
    lf.map = lf.emissiveMap = SP[turning].ground; lb.map = lb.emissiveMap = SP[turning + 1].sky; lf.needsUpdate = lb.needsUpdate = true;
    book.setLeaf(eio(seg(t, TURNS[turning][0], TURNS[turning][1])));
  } else book.setLeaf(0);
  // pop-ups
  for (const r of POPS) {
    let k = riseOf(r, t);
    if (r.car) { // cars: rise, then fold flat backward and slide off the page
      const tf = carFoldT(r), f = ss(seg(t, tf, tf + .28)), sl = ss(seg(t, tf + .25, tf + .75));
      k = Math.min(back(seg(t, RISE[1] + r.d, RISE[1] + r.d + .5), 1.7), 1 - f);
      r.g.position.x = r.x0 - sl * .42; if (t > tf + .75) k = 0;
      r.g.rotation.z = t < tf ? Math.sin(t * 18 + r.x0 * 30) * .006 * (t > 6.8 ? 1 : 0) : 0;
      r.g.visible = (t > RISE[1] && t < tf + .75); r.g.rotation.x = r.dir * (Math.PI / 2) * (1 - k); if (k <= .002 && f >= 1) r.g.rotation.x = -Math.PI / 2 + .0001;
      if (t >= tf + .25) { r.g.visible = r.g.position.x > -.3; r.g.rotation.x = -Math.PI / 2 + .02; r.g.position.y = .0012; }
      continue;
    }
    r.g.visible = k > .002; if (!r.g.visible) continue;
    r.g.rotation.x = r.dir * (Math.PI / 2) * (1 - k);
    if (r.sway) r.m.rotation.z = Math.sin(t * 1.6 + r.ph) * r.sway * k;
  }
  // clocks on strings
  for (const C of CLK) {
    const t0 = C.s === 0 ? .35 : TURNS[5][1] - .2, tf = C.s === 0 ? FOLD[0] : T.endFold, drop = t > t0 ? 1 - spring(t - t0, 6, .35) : 1;
    C.g.visible = t > t0 && t < tf + .6 && (C.s === 0 ? t < TURNS[0][1] : t > TURNS[5][0]);
    C.g.position.y = .1 + drop * .2 + ss(seg(t, tf, tf + .5)) * .2; C.g.rotation.z = Math.sin((t - t0) * 3) * .05 * Math.exp(-(t - t0) * 1.2);
    if (C.s === 0) { const ang = -(t * t) * 1.1 - t * 2; C.mh.rotation.z = ang; C.hh.rotation.z = ang / 12 - 1; }
    else { C.mh.rotation.z = 0; C.hh.rotation.z = -Math.PI * 2 * 5 / 12; }
  }
  slit.visible = t > 3.5 && t < TURNS[0][0];
  for (const h of HONK) { const k = seg(t, h.t0, h.t0 + .55); h.m.visible = k > 0 && k < 1; const s = back(seg(t, h.t0, h.t0 + .15), 2) * (1 - ss(seg(t, h.t0 + .4, h.t0 + .55))); h.m.scale.setScalar(Math.max(s, .001)); h.m.rotation.z = Math.sin(t * 30) * .08; }
  BTN.m.scale.y = 1 - .32 * Math.sin(seg(t, T.press, T.press + .25) * Math.PI);
  baseG.visible = t > TURNS[2][0] + .3 && t < TURNS[3][0];
  { const k = back(seg(t, T.tick, T.tick + .35), 2.2); TICK.visible = t > T.tick && t < TURNS[4][0]; TICK.scale.setScalar(Math.max(k, .001)); TICK.rotation.z = (1 - k) * .6; }
  fillG.visible = true;
  { let pr = 0; T.stars.forEach((s0, i) => { pr = Math.max(pr, ((i + 1) / 5) * eo(seg(t, s0 - .25, s0))); const m = STARS[i], k = back(seg(t, s0, s0 + .3), 2.4); m.visible = t > s0; m.scale.setScalar(Math.max(k, .001)); m.rotation.z = (1 - k) * 1.2; }); FILL.scale.x = Math.max(pr, .001); }
  { const k = t - T.signDrop; SIGN.visible = k > 0; SIGN.position.y = .262 + (k > 0 ? (1 - spring(k, 5, .38)) * .22 : .22); SIGN.rotation.z = k > 0 ? Math.sin(k * 4.2) * .06 * Math.exp(-k * 1.4) : 0; }
  // cast
  for (const c of CAST) { if (!c.r.g.visible) { c.a.shadow.visible = false; continue; } c.a.pose(castPose(c, t)); c.a.body.position.y = castY(c, t); c.a.shadow.visible = true; c.a.shadow.scale.setScalar(riseOf(c.r, t)); }
  const ks = klikState(t); klik.root.visible = klik.shadow.visible = ks.vis && ks.s > .002;
  if (THUMB) { ks.x = .012; ks.y = .012; ks.z = .21; ks.s = 2.3; ks.p.eyesK = 'happy'; ks.p.mouthK = 'open'; ks.p.armR = 2.4; ks.p.armL = 1.6; }
  if (klik.root.visible) { klik.pose(ks.p); klik.root.position.set(ks.x, ks.y, ks.z); klik.root.scale.setScalar(ks.s); klik.shadow.position.set(ks.x, .0005, ks.z); klik.shadow.scale.setScalar(ks.s * clamp(1 - Math.max(0, ks.y) * 10, .3, 1)); klik.shadow.visible = ks.y > -.01; }
  // light: warmer for the evening payoff
  const eve = seg(t, TURNS[5][0], TURNS[5][1]);
  sun.color.set('#fff3e0').lerp(new THREE.Color('#ffd2a0'), eve); sun.intensity = 2.4 - eve * .2;
  scene.environmentIntensity = .4; scene.backgroundIntensity = .75;
  // camera
  const C = camAt(t); cam.position.copy(C.pos); cam.fov = C.fov; cam.lookAt(C.tgt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  let focus = C.pos.distanceTo(C.tgt);
  const toW = (x, y, z) => new THREE.Vector3(x, y + PG, z);
  if (THUMB) focus = C.pos.distanceTo(toW(.018, .05, .2));
  else if (t > 1 && t < 6) { const dm = C.pos.distanceTo(toW(-.02, .045, .15)), dk = C.pos.distanceTo(toW(.03, .03, .2)); focus = lerp(dm, dk, ss(seg(t, T.klikPop + .1, T.klikPop + .6))); }
  if (t > T.endFold + .3) focus = C.pos.distanceTo(new THREE.Vector3(0, .2, .03));
  post.dof.focus = focus; post.dof.aper = C.aper; post.dof.maxCoc = 12;
  post.vig.uniforms.warm.value = .12 + eve * .08; post.bloom.strength = .2;
  scene.updateMatrixWorld(true); post.composer.render();
  // overlay
  OX.clearRect(0, 0, W, H);
  if (!THUMB) drawBubble(t, klik.root.visible ? toScreen(klik.head(tmpV)) : null);
  if (THUMB) drawThumb(); else drawCaps(t);
  if (t > DUR - .6) { OX.fillStyle = `rgba(0,0,0,${seg(t, DUR - .6, DUR) * .0})`; OX.fillRect(0, 0, W, H); }
};
window.render(0);
window.READY = true;

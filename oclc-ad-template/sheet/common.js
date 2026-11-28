// Shared by the sheet pages: brand colours, fonts, figure placement.
import { paperDefs } from '../characters/lib/paper.js';
import { compose } from '../characters/lib/rig.js';

export async function loadBrand() {
  const brand = await (await fetch('../config/brand.json')).json();
  const C = { ...brand.illustration_palette };
  for (const [k, v] of Object.entries(brand.colors)) C[k] = v.hex;
  return { brand, C };
}

export const fontCSS = `
@font-face{font-family:'Montserrat';font-weight:400;src:url(../assets/fonts/montserrat-latin-400-normal.woff2) format('woff2')}
@font-face{font-family:'Montserrat';font-weight:700;src:url(../assets/fonts/montserrat-latin-700-normal.woff2) format('woff2')}
@font-face{font-family:'Montserrat';font-weight:800;src:url(../assets/fonts/montserrat-latin-800-normal.woff2) format('woff2')}
@font-face{font-family:'Noto Naskh Arabic';font-weight:400;src:url(../assets/fonts/noto-naskh-arabic-arabic-400-normal.woff2) format('woff2')}
@font-face{font-family:'Noto Naskh Arabic';font-weight:700;src:url(../assets/fonts/noto-naskh-arabic-arabic-700-normal.woff2) format('woff2')}`;

export async function fontsReady(samples) {
  for (const s of samples) await document.fonts.load(s);
  await document.fonts.ready;
  const missing = samples.filter((s) => !document.fonts.check(s));
  if (missing.length) throw new Error('fonts not loaded: ' + missing.join(', '));
}

// A character placed with its feet at (x, y), lifted off the card below.
export function fig(rig, pose, x, y, s, opts = {}) {
  const { svg } = compose(rig, pose, opts);
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#pp-drop)">${svg}</g>`;
}

export { paperDefs };

export async function imagesReady(root) {
  await Promise.all([...root.querySelectorAll('image')].map((im) => new Promise((ok, bad) => {
    const i = new Image(); i.onload = ok; i.onerror = () => bad(new Error('image failed ' + im.getAttribute('href'))); i.src = im.getAttribute('href');
  })));
}

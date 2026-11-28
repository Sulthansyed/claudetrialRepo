// Klik: OCLC's mascot, redrawn in cut paper from assets/klik-character-sheet.png.
// A floating teal cube with a navy screen face and a cursor on a curved antenna.
// Same units as the kids (ground at y=0), so line-ups need no rescaling.
import { props } from '../lib/props.js';

export default function klik(C) {
  const cy = -333; // screen centre
  const glow = (d, w, fill = false) =>
    `<path d="${d}" fill="${fill ? C.klik_glow_halo : 'none'}" stroke="${C.klik_glow_halo}" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="${fill ? C.klik_glow : 'none'}" stroke="${C.klik_glow}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ring = (x, y, r) => `M${x - r},${y} A${r},${r} 0 1,0 ${x + r},${y} A${r},${r} 0 1,0 ${x - r},${y} Z`;
  const face = {
    neutral: glow(ring(-44, cy - 10, 19), 7) + glow(ring(44, cy - 10, 19), 7) + glow(`M-12,${cy + 34} L12,${cy + 34}`, 7),
    happy: glow(`M-64,${cy - 2} Q-44,${cy - 30} -24,${cy - 2}`, 7) + glow(`M24,${cy - 2} Q44,${cy - 30} 64,${cy - 2}`, 7) +
      glow(`M-17,${cy + 20} L17,${cy + 20} Q17,${cy + 42} 0,${cy + 42} Q-17,${cy + 42} -17,${cy + 20} Z`, 4, true),
    tap: glow(`M-60,${cy - 26} L-36,${cy - 11} L-60,${cy + 4}`, 7) + glow(`M60,${cy - 26} L36,${cy - 11} L60,${cy + 4}`, 7) +
      glow(`M-13,${cy + 30} Q0,${cy + 40} 13,${cy + 30}`, 7),
    // WhatsApp-style chat bubble with handset, drawn in Klik's screen glow
    whatsapp: glow(`M-27,${cy + 31} A42,42 0 1,1 -9,${cy + 41} L-40,${cy + 50} Z`, 7) +
      `<g transform="translate(0 ${cy}) rotate(8)">` +
      glow('M-15,-17 C-21,-10 -20,0 -11,11 C-1,22 9,24 16,18', 8) +
      `<rect x="-24" y="-24" width="13" height="19" rx="5" transform="rotate(-38 -17 -14)" fill="${C.klik_glow}"/>` +
      `<rect x="11" y="10" width="19" height="13" rx="5" transform="rotate(-38 20 16)" fill="${C.klik_glow}"/></g>`,
  };
  return {
    name: 'klik', height: 546, view: [-260, -700, 520, 720],
    parts: [
      { id: 'shadow', pivot: [0, -8], z: 0, fx: 'none', svg: `<ellipse cx="0" cy="-8" rx="92" ry="12" fill="${C.navy}" opacity="0.13"/>` },
      { id: 'float', pivot: [0, cy] },
      { id: 'antenna', parent: 'float', pivot: [0, -434], z: 4, svg:
        `<path d="M0,-436 C0,-466 8,-484 26,-497" fill="none" stroke="${C.klik_bezel}" stroke-width="12" stroke-linecap="round"/>` +
        `<ellipse cx="0" cy="-432" rx="27" ry="15" fill="${C.klik_bezel}"/>` },
      { id: 'cursor', parent: 'antenna', pivot: [26, -497], z: 5, svg:
        `<path d="M0,0 L0,46 L11.5,35 L19.5,52.5 L28,48.5 L20,31.5 L35,31.5 Z" transform="translate(20 -545) rotate(-10)" fill="${C.white_card}" stroke="${C.navy}" stroke-width="3.6" stroke-linejoin="round"/>` },
      { id: 'bodyBack', parent: 'float', pivot: [0, cy], z: 9, svg: `<rect x="-112" y="-424" width="224" height="200" rx="50" fill="${C.klik_teal_deep}"/>` },
      { id: 'body', parent: 'float', pivot: [0, cy], z: 10, svg:
        `<rect x="-112" y="-432" width="224" height="196" rx="50" fill="${C.klik_teal}"/>` +
        `<path d="M-70,-424 L70,-424" fill="none" stroke="${C.klik_teal_light}" stroke-width="5" stroke-linecap="round"/>` },
      { id: 'bezel', parent: 'float', pivot: [0, cy], z: 20, svg: `<rect x="-89" y="-410" width="178" height="154" rx="31" fill="${C.klik_bezel}"/>` },
      { id: 'screen', parent: 'float', pivot: [0, cy], z: 21, svg: `<rect x="-79" y="-401" width="158" height="136" rx="24" fill="${C.klik_screen}"/>` },
      { id: 'face', parent: 'float', pivot: [0, cy], z: 30, variants: face, def: 'neutral', fx: 's' },
    ],
    expressions: {
      neutral: { var: { face: 'neutral' } }, happy: { var: { face: 'happy' } },
      tap: { var: { face: 'tap' } }, whatsapp: { var: { face: 'whatsapp' } },
    },
    props: props(C),
  };
}

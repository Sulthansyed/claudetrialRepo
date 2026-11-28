// Paper props shared by all characters and scenes. Each is drawn around its own origin.
import { piece } from './paper.js';

export function props(C) {
  const st = (c, w) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const book = (x, y, w, h, fill, band, deco) => piece(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}"/>` +
    `<rect x="${x + 10}" y="${y}" width="6" height="${h}" fill="${band}"/><rect x="${x + w - 16}" y="${y}" width="6" height="${h}" fill="${band}"/>` + (deco || ''));
  return {
    // three books held flat against the chest, spines to camera
    books: { fx: 'none', svg:
      book(-66, 8, 132, 28, C.teal, C.navy, `<rect x="-26" y="20" width="52" height="4" rx="2" fill="${C.gold}"/>`) +
      book(-60, -16, 120, 25, C.navy, C.kurung_line, `<rect x="-24" y="-9" width="48" height="11" rx="2" fill="${C.cream}"/>`) +
      book(-56, -38, 112, 23, C.white_card, C.teal, `<rect x="-56" y="-38" width="112" height="23" rx="4" ${st(C.navy, 2.4)}/>`) },
    // pencil, tip at the origin pointing left
    pencil: { fx: 'n', svg:
      `<path d="M0,0 L18,-7 L18,7 Z" fill="${C.kraft}"/><path d="M0,0 L6,-2.4 L6,2.4 Z" fill="${C.navy}"/>` +
      `<rect x="18" y="-7" width="62" height="14" fill="${C.gold}"/><rect x="18" y="-2" width="62" height="3" fill="#D9A93C"/>` +
      `<rect x="80" y="-7.5" width="8" height="15" fill="${C.hijab_fold}"/><rect x="88" y="-7" width="12" height="14" rx="4" fill="${C.terracotta}"/>` },
    // open exercise book held up, page lines
    notebook: { fx: 'none', svg: piece(
      `<rect x="-68" y="-48" width="136" height="96" rx="6" fill="${C.teal}"/>`) + piece(
      `<rect x="-63" y="-43" width="61" height="86" rx="3" fill="${C.white_card}"/><rect x="2" y="-43" width="61" height="86" rx="3" fill="${C.white_card}"/>` +
      [-26, -12, 2, 16, 30].map((y) => `<path d="M-55,${y} L-10,${y} M10,${y} L55,${y}" ${st('#C8D0DE', 2)}/>`).join('')) },
    // a cut-paper question mark
    qmark: { fx: 'n', svg: `<path d="M-15,-16 C-15,-36 15,-36 15,-16 C15,-2 0,0 0,14" ${st(C.navy, 10)}/><circle cx="0" cy="32" r="7" fill="${C.navy}"/>` },
    qmarkTeal: { fx: 'n', svg: `<path d="M-15,-16 C-15,-36 15,-36 15,-16 C15,-2 0,0 0,14" ${st(C.teal, 10)}/><circle cx="0" cy="32" r="7" fill="${C.teal}"/>` },
    // small gold star (highlight only)
    star: { fx: 's', svg: `<path d="M0,-18 L5,-6 L18,-5 L8,3 L11,16 L0,9 L-11,16 L-8,3 L-18,-5 L-5,-6 Z" fill="${C.gold}" stroke="${C.gold}" stroke-width="2" stroke-linejoin="round"/>` },
    // the "click" burst at Klik's cursor tip
    burst: { fx: 's', svg: [[-30, -22], [-6, -36], [-36, 4]].map(([x, y]) => `<path d="M${x * 0.45},${y * 0.45} L${x},${y}" ${st(C.gold, 6)}/>`).join('') },
  };
}

// Paper-cut finish as SVG filters. Works in the browser and in exported .svg files.
//
//   pp-tex    per piece, in the piece's own space (moves with it): hand-cut edge wobble + paper grain.
//             Fixed seeds, so a piece looks the same in every pose and every frame.
//   pp-tex-s  same, gentler edge, for small face pieces (eyes, mouths, buttons).
//   pp-lift   per piece, in character space (light stays top-left whatever the piece's rotation):
//             light cut rim upper-left, dark cut rim lower-right, tight soft shadow on the layer below.
//   pp-drop   per character or set layer: the wider shadow that lifts it off the background card.
//   pp-card   background cards: grain only, straight edges.

export function paperDefs({ ink = '#0D2047' } = {}) {
  return `<defs>
<filter id="pp-tex" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="s"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="3" seed="3" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0.55 0 0 0 0.225  0.55 0 0 0 0.225  0.55 0 0 0 0.225  0 0 0 0 1" result="g"/>
  <feBlend in="g" in2="s" mode="soft-light" result="b"/>
  <feComposite in="b" in2="s" operator="in"/>
</filter>
<filter id="pp-tex-s" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="5" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="s"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.9 0.55" numOctaves="2" seed="3" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0.4 0 0 0 0.3  0.4 0 0 0 0.3  0.4 0 0 0 0.3  0 0 0 0 1" result="g"/>
  <feBlend in="g" in2="s" mode="soft-light" result="b"/>
  <feComposite in="b" in2="s" operator="in"/>
</filter>
<filter id="pp-lift" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feOffset in="SourceAlpha" dx="1.5" dy="1.5" result="o1"/>
  <feComposite in="SourceGraphic" in2="o1" operator="out" result="e1"/>
  <feFlood flood-color="#FFFFFF" flood-opacity="0.55"/>
  <feComposite in2="e1" operator="in" result="hi"/>
  <feOffset in="SourceAlpha" dx="-1.5" dy="-1.5" result="o2"/>
  <feComposite in="SourceGraphic" in2="o2" operator="out" result="e2"/>
  <feFlood flood-color="${ink}" flood-opacity="0.35"/>
  <feComposite in2="e2" operator="in" result="lo"/>
  <feGaussianBlur in="SourceAlpha" stdDeviation="2.6"/>
  <feOffset dx="2.2" dy="3.6" result="sb"/>
  <feFlood flood-color="${ink}" flood-opacity="0.30"/>
  <feComposite in2="sb" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="hi"/><feMergeNode in="lo"/></feMerge>
</filter>
<filter id="pp-drop" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="7"/>
  <feOffset dx="8" dy="13" result="sb"/>
  <feFlood flood-color="${ink}" flood-opacity="0.20"/>
  <feComposite in2="sb" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="pp-card" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.8 0.5" numOctaves="3" seed="21" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0.45 0 0 0 0.275  0.45 0 0 0 0.275  0.45 0 0 0 0.275  0 0 0 0 1" result="g"/>
  <feBlend in="g" in2="SourceGraphic" mode="soft-light" result="b"/>
  <feComposite in="b" in2="SourceGraphic" operator="in"/>
</filter>
</defs>`;
}

// Wrap any SVG markup as one paper piece (props, set pieces, text cut-outs).
export function piece(svg, { small = false, lift = true } = {}) {
  const t = `<g filter="url(#${small ? 'pp-tex-s' : 'pp-tex'})">${svg}</g>`;
  return lift ? `<g filter="url(#pp-lift)">${t}</g>` : t;
}

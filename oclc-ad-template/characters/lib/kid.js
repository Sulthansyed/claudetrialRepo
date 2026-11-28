// Shared 10-year-old kid rig: one face style, one body, two wardrobes (boy / girl).
// Units: feet at y=0, about 575 units tall. L/R = screen side. See ../README for the part list.

const capsule = (cx, y0, y1, w) => `M${cx - w / 2},${y0 + w / 2} A${w / 2},${w / 2} 0 0 1 ${cx + w / 2},${y0 + w / 2} L${cx + w / 2},${y1 - w / 2} A${w / 2},${w / 2} 0 0 1 ${cx - w / 2},${y1 - w / 2} Z`;

export function kidParts(C, kind) {
  const girl = kind === 'girl';
  const sleeve = girl ? C.kurung : C.baju_teal;
  const sleeveDeep = girl ? C.kurung_line : C.baju_teal_deep;
  const stroke = (c, w) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const inset = girl ? (d) => `<path d="${d}" ${stroke(C.kurung_line, 2.6)} transform="translate(0 0)"/>` : () => '';

  // ---------- face (identical for both) ----------
  const eye = {
    dot: `<circle cx="-34" cy="-430" r="10" fill="${C.navy}"/><circle cx="-30.5" cy="-433.5" r="3.2" fill="${C.white_card}"/>`,
    wide: `<circle cx="-34" cy="-432" r="12.5" fill="${C.navy}"/><circle cx="-30" cy="-436.5" r="4.2" fill="${C.white_card}"/><circle cx="-38.5" cy="-427" r="1.8" fill="${C.white_card}"/>`,
    happy: `<path d="M-48,-424 Q-34,-445 -20,-424" ${stroke(C.navy, 6.5)}/>`,
    down: `<circle cx="-34" cy="-424" r="9.5" fill="${C.navy}"/><circle cx="-31" cy="-427" r="2.8" fill="${C.white_card}"/>`,
    closed: `<path d="M-47,-429 Q-34,-421 -21,-429" ${stroke(C.navy, 6)}/>`,
  };
  const mouth = {
    neutral: `<path d="M-12,-388 Q0,-384 12,-388" ${stroke(C.navy, 5.5)}/>`,
    smile: `<path d="M-21,-393 Q0,-372 21,-393" ${stroke(C.navy, 5.5)}/>`,
    smirk: `<path d="M-20,-391 Q2,-377 22,-397" ${stroke(C.navy, 5.5)}/>`,
    wavy: `<path d="M-20,-385 Q-14,-393 -7,-387 Q0,-381 7,-387 Q14,-393 20,-387" ${stroke(C.navy, 5)}/>`,
    o: `<ellipse cx="0" cy="-386" rx="7" ry="9" fill="${C.navy}"/>`,
    smileOpen: `<path d="M-19,-395 C-6,-393 6,-393 19,-395 C17,-377 8,-371 0,-371 C-8,-371 -17,-377 -19,-395 Z" fill="${C.navy}"/>` +
      `<path d="M-9,-376 C-4,-382 4,-382 9,-376 C6,-372 -6,-372 -9,-376 Z" fill="${C.terracotta}"/>`,
    grin: `<path d="M-25,-397 C-12,-394 12,-394 25,-397 C23,-370 11,-361 0,-361 C-11,-361 -23,-370 -25,-397 Z" fill="${C.navy}"/>` +
      `<path d="M-19,-395 L19,-395 L17,-388 Q0,-386 -17,-388 Z" fill="${C.white_card}"/>` +
      `<path d="M-12,-369 C-6,-378 6,-378 12,-369 C8,-363 -8,-363 -12,-369 Z" fill="${C.terracotta}"/>`,
  };
  const brow = `<path d="M-53,-467 C-45,-476 -28,-477 -19,-471 L-20,-462 C-29,-467 -44,-467 -52,-459 Z" fill="${C.hair}"/>`;
  const cheeks = `<ellipse cx="-55" cy="-399" rx="13" ry="8" fill="${C.terracotta}"/><ellipse cx="55" cy="-399" rx="13" ry="8" fill="${C.terracotta}"/>`;
  const nose = `<path d="M-5,-411 Q0,-405 5,-411" ${stroke(C.skin_shade, 3.6)}/>`;

  // ---------- head ----------
  const boyHead =
    `<circle cx="-90" cy="-428" r="17" fill="${C.skin}"/><path d="M-94,-436 Q-100,-428 -93,-420" ${stroke(C.skin_shade, 3.2)}/>` +
    `<circle cx="90" cy="-428" r="17" fill="${C.skin}"/><path d="M94,-436 Q100,-428 93,-420" ${stroke(C.skin_shade, 3.2)}/>` +
    `<ellipse cx="0" cy="-430" rx="92" ry="86" fill="${C.skin}"/>` +
    // hair band under the songkok, with short sideburns
    `<path d="M-88,-452 C-92,-478 -84,-497 -70,-500 L70,-500 C84,-497 92,-478 88,-452 L82,-454 C80,-468 72,-476 56,-479 C30,-486 -30,-486 -56,-479 C-72,-476 -80,-468 -82,-454 Z" fill="${C.hair}"/>` +
    nose;
  const songkok =
    `<path d="M-80,-486 L-72,-565 Q-71,-575 -61,-576 L61,-576 Q71,-575 72,-565 L80,-486 Q0,-478 -80,-486 Z" fill="${C.navy}"/>` +
    `<path d="M-61,-576 L61,-576 Q70,-575 71.5,-567 Q0,-562 -71.5,-567 Q-70,-575 -61,-576 Z" fill="${C.songkok_top}"/>`;

  const girlFace = `<ellipse cx="0" cy="-424" rx="77" ry="83" fill="${C.skin}"/>` + nose;
  // inner cap (anak tudung): its own paper piece, covers the whole hairline so no hair shows
  const innerCap = `<path d="M-76,-446 C-80,-548 80,-548 76,-446 C58,-476 32,-486 0,-487 C-32,-486 -58,-476 -74,-452 Z" fill="${C.inner_cap}"/>`;
  // girl's brows: smaller strips sitting just below the cap
  const girlBrow = `<path d="M-47,-463 C-41,-471 -28,-472 -21,-467 L-22,-459 C-29,-463 -41,-463 -46,-456 Z" fill="${C.hair}"/>`;
  const hood =
    `<path fill-rule="evenodd" d="M0,-554 C76,-554 118,-505 118,-432 C118,-378 102,-345 76,-328 L-76,-328 C-102,-345 -118,-378 -118,-432 C-118,-505 -76,-554 0,-554 Z ` +
    `M-71,-424 A71,79 0 1,0 71,-424 A71,79 0 1,0 -71,-424 Z" fill="${C.hijab}" stroke="${C.navy}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M-96,-470 C-104,-430 -100,-384 -84,-352" ${stroke(C.hijab_fold, 3.4)}/>` +
    `<path d="M96,-470 C104,-430 100,-384 84,-352" ${stroke(C.hijab_fold, 3.4)}/>`;
  const drape =
    `<path d="M-95,-372 C-106,-334 -110,-304 -99,-285 C-70,-261 -34,-252 0,-250 C34,-252 70,-261 99,-285 C110,-304 106,-334 95,-372 Z" fill="${C.hijab}" stroke="${C.navy}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M-70,-304 C-48,-286 -24,-280 0,-279" ${stroke(C.hijab_fold, 3.4)}/>` +
    `<path d="M70,-304 C48,-286 24,-280 0,-279" ${stroke(C.hijab_fold, 3.4)}/>`;

  // ---------- body ----------
  const boyTorso =
    `<rect x="-17" y="-374" width="34" height="36" rx="8" fill="${C.skin_shade}"/>` +
    `<path d="M-58,-350 C-74,-350 -82,-340 -82,-322 L-88,-206 C-88,-198 -84,-194 -76,-194 L76,-194 C84,-194 88,-198 88,-206 L82,-322 C82,-340 74,-350 58,-350 Z" fill="${C.baju_teal}"/>` +
    `<path d="M-27,-364 L27,-364 L25,-345 Q0,-339 -25,-345 Z" fill="${C.baju_teal}"/>` +
    `<path d="M0,-363 L0,-343" ${stroke(C.baju_teal_line, 2.4)}/>` +
    `<rect x="-6.5" y="-345" width="13" height="62" rx="3" fill="${C.baju_teal_deep}"/>` +
    [-332, -314, -296].map((y) => `<circle cx="0" cy="${y}" r="3.8" fill="${C.white_card}"/>`).join('') +
    `<path d="M30,-324 L60,-324 L60,-303 Q45,-299 30,-303 Z" fill="${C.baju_teal_deep}"/>` +
    `<rect x="-70" y="-252" width="34" height="5" rx="2.5" fill="${C.baju_teal_line}"/><rect x="36" y="-252" width="34" height="5" rx="2.5" fill="${C.baju_teal_line}"/>`;
  const girlTorso =
    `<path d="M-56,-350 C-72,-350 -80,-340 -82,-322 L-98,-158 C-98,-150 -94,-146 -86,-146 L86,-146 C94,-146 98,-150 98,-158 L82,-322 C80,-340 72,-350 56,-350 Z" fill="${C.kurung}"/>` +
    `<path d="M-91,-161 L91,-161" ${stroke(C.kurung_line, 2.6)}/>`;
  const skirt =
    `<path d="M-66,-212 L66,-212 L82,-32 C83,-25 79,-22 73,-22 L-73,-22 C-79,-22 -83,-25 -82,-32 Z" fill="${C.kurung_deep}"/>` +
    `<path d="M-76,-38 L76,-38" ${stroke(C.kurung_line, 2.6)}/>` +
    `<path d="M50,-140 C54,-110 58,-80 60,-46" ${stroke(C.kurung_line, 2.6)}/>`;

  const boyLeg =
    `<path d="M-53,-226 L-5,-226 L-9,-40 L-49,-40 Z" fill="${C.baju_teal_deep}"/>` +
    `<path d="M-50,-52 L-8.5,-52 L-8.5,-39 L-50,-39 Z" fill="${C.baju_teal_line}"/>` +
    `<path d="M-55,-42 C-59,-14 -51,0 -35,0 L-13,0 C-4,0 -2,-16 -6,-42 Z" fill="${C.navy}"/>`;
  const girlShoe =
    `<path d="M-57,-36 C-61,-11 -53,0 -37,0 L-12,0 C-4,0 -2,-15 -6,-36 Z" fill="${C.white_card}" stroke="${C.navy}" stroke-width="2.6" stroke-linejoin="round"/>`;

  // ---------- arms (screen-left; R is mirrored) ----------
  const upD = capsule(-64, -347, -248, 34);
  const loD = capsule(-66, -279, -191, 30);
  const armUp = `<path d="${upD}" fill="${sleeve}"/>` + (girl ? `<path d="${capsule(-64, -342, -253, 24)}" ${stroke(C.kurung_line, 2.4)}/>` : '');
  const armLo = `<path d="${loD}" fill="${sleeve}"/>` + (girl ? `<path d="${capsule(-66, -274, -200, 20)}" ${stroke(C.kurung_line, 2.4)}/>` : '') +
    `<rect x="-82" y="-207" width="32" height="14" rx="6" fill="${sleeveDeep}"/>`;
  const hand = {
    open: `<path d="M-81,-202 C-84,-179 -78,-163 -66,-162 C-53,-162 -49,-177 -52,-202 Z" fill="${C.skin}"/>` +
      `<ellipse cx="-49" cy="-191" rx="7" ry="11.5" transform="rotate(-24 -49 -191)" fill="${C.skin}"/>`,
    fist: `<circle cx="-66" cy="-184" r="17" fill="${C.skin}"/><path d="M-75,-178 Q-66,-173 -57,-178" ${stroke(C.skin_shade, 3)}/>`,
    grip: `<circle cx="-66" cy="-185" r="16" fill="${C.skin}"/><ellipse cx="-53" cy="-190" rx="7" ry="10" transform="rotate(-30 -53 -190)" fill="${C.skin}"/>`,
  };

  const P = [
    { id: 'hips', pivot: [0, -212] },
    { id: 'legL', parent: 'hips', pivot: girl ? [-30, -30] : [-28, -215], z: girl ? 6 : 10, pair: true, svg: girl ? girlShoe : boyLeg },
    ...(girl ? [{ id: 'skirt', parent: 'hips', pivot: [0, -212], z: 8, svg: skirt }] : []),
    { id: 'torso', parent: 'hips', pivot: [0, -212], z: 20, svg: girl ? girlTorso : boyTorso },
    { id: 'head', parent: 'torso', pivot: [0, -345], z: 50, svg: girl ? girlFace : boyHead },
    girl ? { id: 'hood', parent: 'head', pivot: [0, -430], z: 53, svg: hood } : { id: 'songkok', parent: 'head', pivot: [0, -490], z: 56, svg: songkok },
    ...(girl ? [{ id: 'drape', parent: 'torso', pivot: [0, -340], z: 36, svg: drape }] : []),
    { id: 'cheeks', parent: 'head', pivot: [0, -400], z: 54, svg: cheeks, fx: 's' },
    { id: 'eyeL', parent: 'head', pivot: [-34, -430], z: 57, pair: true, variants: eye, def: 'dot', fx: 's' },
    ...(girl ? [{ id: 'cap', parent: 'head', pivot: [0, -480], z: 52, svg: innerCap }] : []),
    { id: 'browL', parent: 'head', pivot: girl ? [-34, -463] : [-36, -468], z: 58, pair: true, svg: girl ? girlBrow : brow, fx: 's' },
    { id: 'mouth', parent: 'head', pivot: [0, -388], z: 57, variants: mouth, def: 'neutral', fx: 's' },
    { id: 'armUpL', parent: 'torso', pivot: [-64, -330], z: 30, pair: true, svg: armUp },
    { id: 'armLoL', parent: 'armUpL', pivot: [-66, -263], z: 38, pair: true, svg: armLo },
    { id: 'handL', parent: 'armLoL', pivot: [-66, -199], z: 39, pair: true, variants: hand, def: 'open' },
  ];
  return P;
}

export const kidExpressions = {
  neutral: { var: { eyeL: 'dot', eyeR: 'dot', mouth: 'neutral' } },
  confused: { var: { eyeL: 'dot', eyeR: 'dot', mouth: 'wavy' },
    rot: { browL: -10, browR: 16, head: -5 }, off: { browL: [0, -10], browR: [0, 3] } },
  happy: { var: { eyeL: 'happy', eyeR: 'happy', mouth: 'smileOpen' }, rot: { browL: 4, browR: 4 }, off: { browL: [0, -6], browR: [0, -6] } },
  excited: { var: { eyeL: 'wide', eyeR: 'wide', mouth: 'grin' }, rot: { browL: -6, browR: -6 }, off: { browL: [0, -13], browR: [0, -13] } },
  confident: { var: { eyeL: 'dot', eyeR: 'dot', mouth: 'smirk' }, rot: { browL: 7, browR: 3 }, off: { browL: [0, -2], browR: [0, -4] } },
  focused: { var: { eyeL: 'down', eyeR: 'down', mouth: 'neutral' }, rot: { browL: 9, browR: 9 }, off: { browL: [0, 4], browR: [0, 4] } },
};

// The girl's brows sit just below her inner cap, so they lift less (they must stay clear of the cap edge).
export function kidExpressionsFor(kind) {
  if (kind !== 'girl') return kidExpressions;
  const k = 0.6;
  return Object.fromEntries(Object.entries(kidExpressions).map(([name, e]) => {
    const off = { ...(e.off || {}) };
    for (const b of ['browL', 'browR']) if (off[b]) off[b] = [off[b][0], off[b][1] < 0 ? off[b][1] * k : off[b][1]];
    return [name, { ...e, off }];
  }));
}

export const kidChains = { armL: ['armUpL', 'armLoL', 'handL'], armR: ['armUpR', 'armLoR', 'handR'] };
export const kidRest = { rot: { armUpL: 5, armUpR: 5 } };

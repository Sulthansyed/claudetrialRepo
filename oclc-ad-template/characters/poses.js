// Poses for Step 1. A pose only moves parts and swaps face pieces (see lib/rig.js for the format).
// Angles: for L/R pairs, + = outward / up. reach targets are in character space (feet at y=0).

export const poses = {
  boy: {
    neutral: { expr: 'neutral' },
    confused: {
      expr: 'confused',
      rot: { head: -12, torso: -3 },
      reach: { armL: { to: [-112, -446], bend: 'out', hand: 165 } },
      var: { handL: 'open' },
      z: { armLoL: 60, handL: 61 },
      props: [
        { use: 'qmark', parent: 'head', at: [96, -604], rot: 12, scale: 1.25, z: 70 },
        { use: 'qmarkTeal', parent: 'head', at: [150, -540], rot: 22, scale: 0.85, z: 70 },
      ],
    },
    excited: {
      expr: 'excited',
      off: { hips: [0, -22] },
      rot: { legL: 9, legR: 9 },
      reach: { armL: { to: [-150, -560], bend: 'out' }, armR: { to: [150, -560], bend: 'out' } },
      var: { handL: 'fist', handR: 'fist' },
      props: [
        { use: 'star', parent: 'torso', at: [-205, -600], rot: -10, z: 70 },
        { use: 'star', parent: 'torso', at: [212, -585], rot: 14, scale: 0.75, z: 70 },
        { use: 'star', parent: 'torso', at: [-170, -470], scale: 0.55, z: 70 },
      ],
    },
    writing: {
      expr: 'focused',
      rot: { head: 3 },
      off: { head: [0, 5] },
      reach: { armR: { to: [46, -238], bend: 'down', hand: 10 }, armL: { to: [-6, -276], bend: 'down', hand: -30 } },
      var: { handL: 'grip', handR: 'open' },
      props: [
        { use: 'notebook', parent: 'torso', at: [10, -262], z: 35 },
        { use: 'pencil', parent: 'torso', at: [-22, -244], rot: -62, scale: 0.85, z: 38.5 },
      ],
    },
    books: {
      expr: 'confident',
      rot: { head: 3 },
      reach: { armL: { to: [-60, -236], bend: 'down', hand: -60 }, armR: { to: [60, -236], bend: 'down', hand: -60 } },
      var: { handL: 'fist', handR: 'fist' },
      props: [{ use: 'books', parent: 'torso', at: [0, -244], z: 37 }],
    },
  },
  girl: {
    neutral: { expr: 'neutral', rot: { head: 2 } },
    excited: {
      expr: 'excited',
      off: { hips: [0, -20] },
      rot: { head: -4 },
      reach: { armL: { to: [-176, -540], bend: 'out', hand: 10 }, armR: { to: [104, -360], bend: 'out' } },
      var: { handL: 'open', handR: 'fist' },
      z: { armLoL: 60, handL: 61, armLoR: 60, handR: 61 },
      props: [
        { use: 'star', parent: 'torso', at: [-200, -610], rot: 10, z: 70 },
        { use: 'star', parent: 'torso', at: [170, -560], rot: -12, scale: 0.7, z: 70 },
      ],
    },
    books: {
      expr: 'confident',
      rot: { head: -3 },
      reach: { armL: { to: [-60, -236], bend: 'down', hand: -60 }, armR: { to: [60, -236], bend: 'down', hand: -60 } },
      var: { handL: 'fist', handR: 'fist' },
      props: [{ use: 'books', parent: 'torso', at: [0, -244], z: 37 }],
    },
  },
  klik: {
    neutral: { expr: 'neutral' },
    tap: {
      expr: 'tap',
      scale: { float: [1.03, 0.96] },
      rot: { antenna: 16, cursor: 14 },
      off: { cursor: [0, 8] },
      props: [{ use: 'burst', parent: 'cursor', at: [16, -548], scale: 1.1, z: 6 }],
    },
    happy: { expr: 'happy', off: { float: [0, -22] }, rot: { float: -6 } },
    whatsapp: { expr: 'whatsapp', off: { float: [0, -10] }, rot: { float: 4 } },
  },
};

export const expressionsShown = ['neutral', 'confused', 'happy', 'excited'];

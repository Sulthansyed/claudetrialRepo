// Timeline: the single source of truth for picture, captions and sound events.
// 104.35 bpm in 4/4: beat = 0.575 s, bar = 2.3 s = one climax page. Grid origin: page ① lands at 10.0 s.
// Music enters on Klik's click (3.675 s = 11 beats before 10.0).
export const BEAT = .575, BAR = BEAT * 4, GRID0 = 10.0, MUSIC0 = 3.675, BPM = 60 / BEAT;
export const DUR = 30.5;

// book opening and page turns: [leaf starts lifting, leaf lands]
export const OPEN = [0.0, 0.5];
export const TURNS = [
  [5.65, 6.4],     // home → road
  [9.65, 10.35],   // road → ① WhatsApp       (lands on 10.0)
  [11.95, 12.65],  // ① → ② laptop class      (12.3)
  [14.25, 14.95],  // ② → ③ teacher listens ✓ (14.6)
  [16.55, 17.25],  // ③ → ④ stars fill        (16.9)
  [18.85, 19.55],  // ④ → home, evening        (19.2)
];
// spread index → when its pieces rise / fold
export const RISE = [0.3, ...TURNS.map(t => t[1] - .38)];
export const FOLD = [...TURNS.map(t => t[0] - .12), 24.25];

const b = n => GRID0 + n * BEAT;
export const T = {
  mumPop: 1.05, klikPop: b(-11), klikHide: 5.35,
  klikRoadIn: 7.45, click1: b(-2), carsFold: b(-2) + .05,
  press: b(1.5), tick: b(9), stars: [b(12.5), b(13), b(13.5), b(14), b(14.5)], jump: 18.2,
  klikBack: 19.55, wave: 20.5, endFold: 24.25, signDrop: b(25),
};

// Voice-over (Malay). Times are estimates until the real recording's word timings replace them.
export const VO = [
  { id: 'vo1', t: 0.2 }, { id: 'vo2', t: 3.9 }, { id: 'vo3', t: 6.4 },
  { id: 'vo4a', t: 10.15 }, { id: 'vo4b', t: 12.45 }, { id: 'vo4c', t: 14.75 }, { id: 'vo4d', t: 17.05 },
  { id: 'vo5a', t: 18.7 }, { id: 'vo5b', t: 21.99 }, { id: 'vo5c', t: 23.88 }, { id: 'vo5d', t: 27.5 },
];
// Burned-in captions (Malay only).
export const CAPS = [
  { t0: 0.15, t1: 3.45, text: 'Anak nak belajar KAFA… tapi mak ayah sibuk?' },
  { t0: 3.85, t1: 6.35, text: 'Sebenarnya, cukup satu klik.' },
  { t0: 6.35, t1: 10.0, text: 'Tak perlu hantar. Tak perlu tunggu dalam jem.' },
  { t0: 10.1, t1: 12.2, text: 'Daftar di WhatsApp.' },
  { t0: 12.4, t1: 14.5, text: 'Masuk kelas.' },
  { t0: 14.7, t1: 16.8, text: 'Guru semak hafazan.' },
  { t0: 17.0, t1: 18.6, text: 'Anak maju!' },
  { t0: 18.6, t1: 21.89, text: 'Jom join kelas online KAFA OCLC.' },
  { t0: 21.89, t1: 23.78, text: 'Kelas berkumpulan kecil.' },
  { t0: 23.78, t1: 27.4, text: 'Guru KAFA yang akan mengajar dan semak hafazan anak-anak.' },
  { t0: 27.4, t1: 30.4, text: 'Mudah, berkesan dan menyeronokkan :)' },
];
// typed speech bubbles in the paper world
export const BUB = [{ who: 'klik', t0: 3.78, t1: 5.2, text: 'klik!' }];

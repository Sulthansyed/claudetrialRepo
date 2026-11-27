// Timeline: the single source of truth for picture, captions and sound events.
// 144 bpm in 3/4: beat = 0.41667 s, bar = 1.25 s. Music enters on Klik's click (3.75 s = bar 1).
export const BPM = 144, BEAT = 60 / BPM, BAR = BEAT * 3, MUSIC0 = 3.75;
export const DUR = 30.0;

// book opening and page turns: [leaf starts lifting, leaf lands]
export const OPEN = [0.0, 0.75];
export const TURNS = [
  [5.75, 6.5],    // home → road
  [9.7, 10.4],    // road → ① WhatsApp
  [12.2, 12.9],   // ① → ② small group on a laptop
  [14.7, 15.4],   // ② → ③ teacher listening ✓
  [17.2, 17.9],   // ③ → ④ stars fill
  [19.7, 20.4],   // ④ → home (evening, calm)
];
// spread index → when its pieces rise / fold
export const RISE = [0.45, ...TURNS.map(t => t[1] - .38)];
export const FOLD = [...TURNS.map(t => t[0] - .12), 25.5];

export const T = {
  mumPop: 1.05, klikPop: 3.75, klikHide: 5.4,
  klikRoadIn: 7.55, click1: 8.75, carsFold: 8.8, carsGone: 9.6,
  press: 11.0, tick: 15.83, stars: [17.92, 18.33, 18.75, 19.17, 19.38], jump: 18.95,
  wave: 21.25, endFold: 25.5, signDrop: 25.6,
};

// Voice-over (Malay). Times are estimates until the real recording's word timings replace them.
export const VO = [
  { id: 'vo1', t: 0.25, text: 'Anak nak belajar KAFA… tapi mak ayah sibuk?' },
  { id: 'vo2', t: 4.0, text: 'Sebenarnya, cukup satu klik.' },
  { id: 'vo3', t: 6.3, text: 'Tak perlu hantar. Tak perlu tunggu dalam jem.' },
  { id: 'vo4', t: 10.2, text: 'Daftar di WhatsApp. Masuk kelas. Guru semak hafazan. Anak maju!' },
  { id: 'vo5', t: 20.3, text: 'Jom join kelas online KAFA OCLC. Kelas berkumpulan kecil. Guru KAFA yang akan mengajar dan semak hafazan anak-anak. Mudah, berkesan dan menyeronokkan :)' },
];
// Burned-in captions (Malay only). Each held ≥ max(1.8 s, speech + 0.6 s).
export const CAPS = [
  { t0: 0.25, t1: 3.45, text: 'Anak nak belajar KAFA… tapi mak ayah sibuk?' },
  { t0: 3.95, t1: 5.85, text: 'Sebenarnya, cukup satu klik.' },
  { t0: 6.3, t1: 9.6, text: 'Tak perlu hantar. Tak perlu tunggu dalam jem.' },
  { t0: 10.2, t1: 12.2, text: 'Daftar di WhatsApp.' },
  { t0: 12.7, t1: 14.7, text: 'Masuk kelas.' },
  { t0: 15.2, t1: 17.2, text: 'Guru semak hafazan.' },
  { t0: 17.7, t1: 19.7, text: 'Anak maju!' },
  { t0: 20.3, t1: 22.45, text: 'Jom join kelas online KAFA OCLC.' },
  { t0: 22.45, t1: 24.3, text: 'Kelas berkumpulan kecil.' },
  { t0: 24.3, t1: 27.3, text: 'Guru KAFA yang akan mengajar dan semak hafazan anak-anak.' },
  { t0: 27.3, t1: 29.85, text: 'Mudah, berkesan dan menyeronokkan :)' },
];
// typed speech bubbles in the paper world
export const BUB = [{ who: 'klik', t0: 3.85, t1: 5.3, text: 'klik!' }];

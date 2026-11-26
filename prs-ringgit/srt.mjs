// writes out/srt_cues.json from the VO table in film.js (BM line, then English); windows match the on-screen cards
import fs from 'fs';
const here = process.argv[2] || '.', src = fs.readFileSync(here + '/film.js', 'utf8');
const DUR = +src.match(/export const DUR = ([\d.]+)/)[1];
const VO = [...src.matchAll(/\['(v\d\d)', ([\d.]+), ([\d.]+), '([^']+)', '([^']+)'\]/g)].map(m => [m[1], +m[2], +m[3], m[4], m[5]]);
const cues = VO.map(([, s, d, bm, en], i) => { const nx = VO[i + 1] ? VO[i + 1][1] - .2 : DUR; return { t0: +(s - .1).toFixed(2), t1: +Math.min(nx, Math.max(s + d + .5, s + 1.8)).toFixed(2), text: bm + '\n' + en }; });
fs.mkdirSync(here + '/out', { recursive: true }); fs.writeFileSync(here + '/out/srt_cues.json', JSON.stringify(cues)); console.log('cues', cues.length);

// writes out/srt_cues.json from the same subtitle cards the page draws (BM line on top, English under it)
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const here = path.resolve(process.argv[2] || '.');
const film = await import(pathToFileURL(path.join(here, 'film.js')).href);
film.init(JSON.parse(fs.readFileSync(path.join(here, 'voices/words.json'))), JSON.parse(fs.readFileSync(path.join(here, 'voices/dur.json'))));
const cues = film.SUBS.map(s => ({ t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), text: s.bm + '\n' + s.en }));
fs.mkdirSync(path.join(here, 'out'), { recursive: true }); fs.writeFileSync(path.join(here, 'out/srt_cues.json'), JSON.stringify(cues, null, 1));
console.log('cues', cues.length, 'shortest', Math.min(...cues.map(c => c.t1 - c.t0)).toFixed(2) + ' s');

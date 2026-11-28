const cv = document.getElementById('c'), g = cv.getContext('2d');
for (const w of [400, 500, 600, 700, 800]) await document.fonts.load(`${w} 40px Inter`, 'RM2,000 Aa%');
const words = await (await fetch('voices/words.json')).json(), durs = await (await fetch('voices/dur.json')).json();
const film = await import('./film.js');
film.init(words, durs);
const Q = new URLSearchParams(location.search);
window.DUR = film.DUR; window.EV = film.EV; window.TEXTS = film.texts;
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); Q.has('thumb') ? film.thumb(g) : film.render(g, t, { nosub: Q.has('nosub') }); };
window.READY = true;

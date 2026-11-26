const cv = document.getElementById('c'), g = cv.getContext('2d');
for (const w of [400, 500, 600, 700]) await document.fonts.load(`${w} 40px Jost`, 'RM750 Aa');
const film = await import('./film.js');
window.DUR = film.DUR; window.EV = film.events(); window.TEXTS = film.texts;
const THUMB = new URLSearchParams(location.search).has('thumb');
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); THUMB ? film.thumb(g) : film.render(g, t); };
window.READY = true;

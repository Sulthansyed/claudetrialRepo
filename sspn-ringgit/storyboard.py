# storyboard sheet: one panel per beat, rendered with the real drawing code (stills/t_<t>.jpg), captioned
# make the stills first: node core/render/still.mjs <this folder> 0.5 7.6 12.8 17.9 27.0 31.8 38.6 --size 1080x1920 --out <this folder>/stills
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda w, s: ImageFont.truetype(os.path.join(HERE, 'fonts', f'Inter-{w}.woff2'), s)
SH = [
  ('0.5', '1 · HOOK · 0–6.2 s', 'Locked wide on the two rows. RM2,000', 'lime vs RM0 red from frame 0.'),
  ('7.6', '2 · CURIOSITY · 6.2–9.0 s', 'Whip to the headers: A C E… skip;', 'red double lines mark the folds.'),
  ('12.8', '3 · TRAP 1 · 9.0–14.8 s', 'Unhide Withdrawn. What-if 3,000 (red):', 'Relief 5,000, Saved RM1,250. Then ctrl-Z.'),
  ('17.9', '4 · TRAP 2 · 14.8–18.9 s', 'Unhide Beneficiary: Ali = Self. IF', 'formula typed; Relief 0, Saved RM0.'),
  ('27.0', '5 · CLIMAX · 18.9–29.2 s', '=8000*C44 filled right: 880 / 1,520 /', '2,000, counted as cells (1 sel = RM80).'),
  ('31.8', '6 · PAYOFF · 29.2–36.1 s', 'Merged cell as stage: 31 DIS, then', '"Bukan di kaunter? … 25 Dis".'),
  ('38.6', '7 · END · 36.1–41.0 s', 'Back up to the two rows, all columns', 'open; end card + footnote.'),
]
w, cols, gap = 330, 4, 18; h = w * 1920 // 1080; cap = 96
rows = (len(SH) + cols - 1) // cols
S = Image.new('RGB', (cols * w + (cols + 1) * gap, rows * (h + cap + gap) + 80), (241, 240, 235)); d = ImageDraw.Draw(S)
d.text((gap, 22), 'RM2,000 or RM0? (SSPN)  ·  storyboard  ·  Spreadsheet Film  ·  1080×1920  ·  41.0 s', fill=(23, 18, 10), font=F('Bold', 28))
for k, (t, h1, l1, l2) in enumerate(SH):
    im = Image.open(os.path.join(HERE, 'stills', f't_{t}.jpg')).convert('RGB').resize((w, h), Image.LANCZOS)
    x = gap + (k % cols) * (w + gap); y = 80 + (k // cols) * (h + cap + gap)
    S.paste(im, (x, y)); d.rectangle([x, y, x + w - 1, y + h - 1], outline=(23, 18, 10))
    d.text((x, y + h + 10), f'{h1}   t={t}s', fill=(23, 18, 10), font=F('Bold', 17))
    d.text((x, y + h + 40), l1, fill=(80, 78, 72), font=F('Medium', 15)); d.text((x, y + h + 62), l2, fill=(80, 78, 72), font=F('Medium', 15))
# last cell: the palette / rules key
x = gap + 3 * (w + gap); y = 80 + (h + cap + gap)
d.text((x, y), 'Colour rules', fill=(23, 18, 10), font=F('Bold', 20))
for n, (c, s) in enumerate([('#b8f25a', 'lime: full relief / saving'), ('#e8382d', 'red: a trap fired (0, Self, withdrawal)'), ('#ffb21f', 'amber: reduced; Beneficiary ref'), ('#4fb3e8', 'sky: Deposited ref; 11% / 19% bars'), ('#2a2f6c', 'indigo: Withdrawn ref')]):
    d.rectangle([x, y + 40 + n * 34, x + 40, y + 60 + n * 34], fill=c, outline=(23, 18, 10)); d.text((x + 52, y + 40 + n * 34), s, fill=(40, 38, 34), font=F('Medium', 15))
d.text((x, y + 230), 'Subtitles: cell-comment note, lower left;', fill=(40, 38, 34), font=F('Medium', 15))
d.text((x, y + 252), 'BM 37 px on top, English 25 px under,', fill=(40, 38, 34), font=F('Medium', 15))
d.text((x, y + 274), 'one line each, never wrapped.', fill=(40, 38, 34), font=F('Medium', 15))
d.text((x, y + 310), 'Safe: key numbers left of x 940,', fill=(40, 38, 34), font=F('Medium', 15))
d.text((x, y + 332), 'above the note (y < 1270).', fill=(40, 38, 34), font=F('Medium', 15))
S.save(os.path.join(HERE, 'storyboard.jpg'), quality=90); print('storyboard.jpg', S.size)

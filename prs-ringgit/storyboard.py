# storyboard sheet: key shots rendered with the real drawing code, captioned (python storyboard.py)
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(HERE, 'fonts', 'jost0.woff2')
SH = [
  ('1.0', '1 · HOOK · 0–5 s', 'Wide, locked. Two identical desks,', 'same salary. Counters wait: RM ?'),
  ('3.9', '1 · HOOK', 'Counters pop: Aisyah RM750,', 'then Ali RM0 (VO line 1).'),
  ('6.6', '2 · CURIOSITY · 5–8 s', 'Slide + push to the PRS vault.', 'Padlock rattles, "?" ring, pin LOCKED.'),
  ('9.6', '3 · CONFLICT · 8–11.3 s', 'Pan to Ali; the rest greys out.', 'Salary coins arc into TAX. RM0 shakes.'),
  ('12.6', '4 · CLIMAX · 11.3–18 s', 'Pan to Aisyah. RM1,000 bricks fly', 'into the vault, one per beat.'),
  ('15.0', '4 · CLIMAX', 'Vault cutaway (3 bricks inside).', 'TAX RELIEF stamp lands on the tax office.'),
  ('17.6', '4 · CLIMAX', '15 coins (RM50 each) fly back;', 'counter climbs to RM750. Footnote on.'),
  ('21.5', '5 · PAYOFF · 18–22.8 s', 'Log pull-out: both boards, 31 DIS', 'calendar, DEADLINE 31 DEC, end card.'),
]
w, cols = 360, 4; h = w * 1920 // 1080; cap = 92
S = Image.new('RGB', (cols * w + (cols + 1) * 16, 2 * (h + cap) + 3 * 16 + 70), (243, 238, 228)); d = ImageDraw.Draw(S)
try: f1, f2, f3 = ImageFont.truetype(F, 22), ImageFont.truetype(F, 17), ImageFont.truetype(F, 30)
except Exception: f1 = f2 = f3 = ImageFont.load_default()
d.text((16, 18), 'RM750 or RM0?  ·  storyboard  ·  Isometric Infographic  ·  1080×1920  ·  22.8 s', fill=(38, 33, 43), font=f3)
for k, (t, h1, l1, l2) in enumerate(SH):
    im = Image.open(os.path.join(HERE, 'stills', f't_{t}.jpg')).convert('RGB').resize((w, h))
    x = 16 + (k % cols) * (w + 16); y = 70 + (k // cols) * (h + cap + 16)
    S.paste(im, (x, y)); d.rectangle([x, y, x + w - 1, y + h - 1], outline=(38, 33, 43))
    d.text((x, y + h + 8), f'{h1}   t={t}s', fill=(38, 33, 43), font=f1); d.text((x, y + h + 38), l1, fill=(80, 74, 86), font=f2); d.text((x, y + h + 60), l2, fill=(80, 74, 86), font=f2)
S.save(os.path.join(HERE, 'storyboard.jpg'), quality=90); print('storyboard.jpg', S.size)

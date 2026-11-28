"""QC contact sheet: one frame per second (30 frames, at t = k + 0.5 s) in a 6 x 5 grid, each with its timecode.
  .venv/bin/python tools/contact_sheet.py [frames_dir] [out.png]"""
import json, pathlib, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
frames = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out/_work/film"
out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out/qc/contact-sheet.png"
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps, N = cfg["format"]["fps"], cfg["format"]["frames"]
scene = lambda f: [s["id"] for s in cfg["scenes"] if f >= s["timing"]["start_frame"]][-1]
cols, rows, tw, th, lab, pad = 6, 5, 300, 533, 54, 14
sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), (248, 245, 236))
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype(str(next(pathlib.Path("/usr/share/fonts").rglob("DejaVuSansMono-Bold.ttf"))), 22)
small = ImageFont.truetype(str(next(pathlib.Path("/usr/share/fonts").rglob("DejaVuSansMono.ttf"))), 17)
for k in range(cols * rows):
    f = min(N - 1, round((k + 0.5) * fps))
    im = Image.open(frames / f"{f:05d}.png").convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = pad + (k % cols) * (tw + pad), pad + (k // cols) * (th + lab + pad)
    sheet.paste(im, (x, y))
    tc = f"{f // fps // 3600:02d}:{f // fps // 60 % 60:02d}:{f // fps % 60:02d}:{f % fps:02d}"
    d.text((x + 4, y + th + 4), tc, fill=(13, 32, 71), font=font)
    d.text((x + 4, y + th + 30), f"f{f}  {scene(f)}", fill=(59, 74, 107), font=small)
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print(f"wrote {out} {sheet.size}")

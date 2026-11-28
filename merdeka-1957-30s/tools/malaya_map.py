"""Builds malaya.json, the printed map's data: python3 tools/malaya_map.py <path to world-atlas 2.0.2 countries-50m.json>.

world-atlas 2.0.2 (Natural Earth 1:50m admin-0, public domain; ISC) can be fetched with `npm pack world-atlas@2.0.2`.
Keeps the countries in frame, clips them to a box around the Malay Peninsula (95–108°E, 3°S–12°N) and writes plain
lon/lat polygons. Malaysia is split: only its polygons west of 105°E (Peninsular Malaysia = the Federation of Malaya's
1957 extent) are kept, as "Malaya". China is not in or near this box.
"""
import json, pathlib, sys

BOX = (95.0, -3.0, 108.0, 12.0)
KEEP = ["Malaysia", "Thailand", "Indonesia", "Singapore", "Myanmar", "Cambodia", "Vietnam"]
OUT = pathlib.Path(__file__).resolve().parent.parent / "malaya.json"


def clip(ring, x0, y0, x1, y1):
    def cut(pts, inside, inter):
        out = []
        for i, p in enumerate(pts):
            q = pts[i - 1]
            if inside(p):
                if not inside(q): out.append(inter(q, p))
                out.append(p)
            elif inside(q): out.append(inter(q, p))
        return out
    ax = lambda x: (lambda a, b: [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])])
    ay = lambda y: (lambda a, b: [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y])
    pts = ring[:-1]
    for inside, inter in ((lambda p: p[0] >= x0, ax(x0)), (lambda p: p[0] <= x1, ax(x1)),
                          (lambda p: p[1] >= y0, ay(y0)), (lambda p: p[1] <= y1, ay(y1))):
        if not pts: break
        pts = cut(pts, inside, inter)
    return [[round(x, 4), round(y, 4)] for x, y in pts] if len(pts) >= 3 else None


topo = json.load(open(sys.argv[1]))
(sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append([x * sx + tx, y * sy + ty])
    arcs.append(pts)
def ring(idx):
    pts = []
    for i in idx:
        a = arcs[~i][::-1] if i < 0 else arcs[i]
        pts += a[1:] if pts else a
    return pts
out = {}
for g in topo["objects"]["countries"]["geometries"]:
    name = g["properties"]["name"]
    if name not in KEEP: continue
    polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]
    res = []
    for p in polys:
        rings = [ring(r) for r in p]
        if name == "Malaysia" and max(x for x, _ in rings[0]) > 105: continue
        cr = [c for c in (clip(r, *BOX) for r in rings) if c]
        if cr: res.append(cr)
    if res: out["Malaya" if name == "Malaysia" else name] = res
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print({k: len(v) for k, v in out.items()}, OUT.stat().st_size, "bytes")

"""Mix one stretch of the film: fitted VO lines + paper foley from the page's events.
  .venv/bin/python tools/mix_scene.py <t0> <t1> <events.json> <out.wav>
Voice sits ~10 dB above the foley; the paper bed ducks under the voice. Loudness is set later by mux.sh (-14 LUFS)."""
import json, pathlib, sys
import numpy as np
import soundfile as sf
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import sfx_paper as fx

ROOT = pathlib.Path(__file__).resolve().parent.parent
t0, t1, evp, outp = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3], sys.argv[4]
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps = cfg["format"]["fps"]
n = int(round((t1 - t0) * fx.SR))
voice, foley = np.zeros(n), np.zeros(n)

for sc in cfg["scenes"]:
    v = sc["vo"]; vs = v["start_frame"] / fps
    if vs >= t1 or v["end_frame"] / fps <= t0: continue
    y, sr = sf.read(ROOT / v["file"]); assert sr == fx.SR
    fx.add(voice, y, vs - t0)

# paper bed, ducked under the voice
bed = fx.rustle(t1 - t0, 1.0)
env = np.abs(voice); k = int(0.08 * fx.SR)
env = np.convolve(env, np.ones(k) / k, mode="same")
duck = 1 - 0.6 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
foley += bed * duck * 0.10

for e in json.loads(pathlib.Path(evp).read_text()):
    g = e.get("v", 1.0)
    if e["type"] == "pop": fx.add(foley, fx.pop(1.0, e.get("p", 1.0)), e["t"], 0.55 * g)
    elif e["type"] == "slide": fx.add(foley, fx.slide(1.0), e["t"], 0.35 * g)
    elif e["type"] == "thud": fx.add(foley, fx.thud(1.0, e.get("p", 1.0)), e["t"], 0.6 * g)
    elif e["type"] == "ding": fx.add(foley, fx.ding(1.0), e["t"], 0.35 * g)
    elif e["type"] == "scratch": fx.add(foley, fx.scratch(e.get("d", 1.0)), e["t"], 0.2 * g)

rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1
voice *= 0.25 / rms(voice)
foley *= (0.25 / 3.16) / rms(foley)        # foley about 10 dB under the voice
mix = voice + foley
mix *= 0.9 / max(1e-9, np.abs(mix).max())
sf.write(outp, mix.astype(np.float32), fx.SR, subtype="PCM_16")
print(f"mix {t1 - t0:.3f}s -> {outp}")

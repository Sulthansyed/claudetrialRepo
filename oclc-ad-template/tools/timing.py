"""Timing map: narration drives the cut.

  .venv/bin/python tools/timing.py

1. Reads out/vo-scratch/NN.wav (raw lines, as measured).
2. Fits them: long pauses inside a line are tightened (sentence breaks -> 0.35 s, comma pauses -> 0.22 s),
   then the smallest tempo increase that makes 30 s work is applied (pitch kept, never above vo.max_speedup).
   Fitted lines go to out/vo-scratch/fit/NN.wav. Raw files are not touched.
3. Scene = lead-in + VO + breath; spare time spread evenly, last scene >= vo.min_last_scene_s.
   If it still does not fit, lead-in and breath shrink (not below 0.15 / 0.2 s); if that fails, it stops
   and names the lines that are too long.
4. Writes frames into config/upkk-2027.json, out/subtitles-draft.srt and out/timing.json, prints the table.
"""
import json, pathlib, re, subprocess, sys
import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = ROOT / "config/upkk-2027.json"
cfg = json.loads(CFG.read_text())
fps, total_f = cfg["format"]["fps"], cfg["format"]["frames"]
V = cfg["vo"]
src, fit_dir = ROOT / V["scratch_dir"], ROOT / V["scratch_dir"] / "fit"
fit_dir.mkdir(parents=True, exist_ok=True)
n = len(cfg["scenes"])
SENT, COMMA = 0.35, 0.22


def silences(path):
    log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-af", "silencedetect=noise=-40dB:d=0.12",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
    return list(zip(st, en))


def tighten(path):
    y, sr = sf.read(path)
    keep, cur = [], 0
    for a, b in silences(path):
        d = b - a
        if d < 0.3:
            continue
        tgt = SENT if d > 0.7 else COMMA
        mid = (a + b) / 2
        a2, b2 = int((mid - tgt / 2) * sr), int((mid + tgt / 2) * sr)
        cut0, cut1 = int(a * sr) + int(0.05 * sr), int(b * sr) - int(0.05 * sr)
        # keep 50 ms of the natural tail and onset, remove the middle down to the target length
        remove = (cut1 - cut0) - int((tgt - 0.1) * sr)
        if remove <= 0:
            continue
        m0 = (cut0 + cut1 - remove) // 2
        keep.append(y[cur:m0]); cur = m0 + remove
    keep.append(y[cur:])
    return np.concatenate(keep), sr


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode())


raw = [dur(src / f"{i + 1:02d}.wav") for i in range(n)]
tight = []
for i in range(n):
    y, sr = tighten(src / f"{i + 1:02d}.wav")
    sf.write(fit_dir / f"_tight{i + 1:02d}.wav", y, sr, subtype="PCM_16")
    tight.append(len(y) / sr)

T = total_f / fps
lead, breath = V["lead_in_s"], V["breath_s"]
need = lambda f, l, b: sum(t / f for t in tight) + n * (l + b)
tempo = 1.0
if need(1.0, lead, breath) > T:
    tempo = min(V["max_speedup"], sum(tight) / (T - n * (lead + breath)))
    tempo = max(tempo, 1.0)
    while need(tempo, lead, breath) > T and (lead > 0.15 or breath > 0.2):
        lead, breath = max(0.15, lead - 0.01), max(0.2, breath - 0.01)
if need(tempo, lead, breath) > T:
    over = need(tempo, lead, breath) - T
    share = T / n
    worst = sorted(range(n), key=lambda i: tight[i] / tempo + lead + breath - share, reverse=True)
    sys.exit(f"VO does not fit 30 s even at {tempo:.2f}x with {lead:.2f}/{breath:.2f} s padding: "
             f"{over:.2f} s over. Longest lines: " + ", ".join(f"{i + 1:02d} ({raw[i]:.2f} s)" for i in worst[:3]))

fitted = []
for i in range(n):
    out = fit_dir / f"{i + 1:02d}.wav"
    af = f"atempo={tempo:.4f}" if tempo > 1.0001 else "anull"
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", str(fit_dir / f"_tight{i + 1:02d}.wav"), "-af", af,
                           "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(out)])
    (fit_dir / f"_tight{i + 1:02d}.wav").unlink()
    fitted.append(dur(out))

# scene lengths, spare spread evenly, last scene >= min
L = [lead + d + breath for d in fitted]
spare = T - sum(L)
L = [x + spare / n for x in L]
short = V["min_last_scene_s"] - L[-1]
if short > 0:
    L[-1] += short
    L[:-1] = [x - short / (n - 1) for x in L[:-1]]
# to frames, cumulative rounding, exactly total_f
edges = [0]
acc = 0.0
for x in L[:-1]:
    acc += x
    edges.append(round(acc * fps))
edges.append(total_f)

rows, cues = [], []
for i, sc in enumerate(cfg["scenes"]):
    s0, s1 = edges[i], edges[i + 1]
    v0 = s0 + round(lead * fps)
    v1 = v0 + int(np.ceil(fitted[i] * fps))
    assert v1 <= s1, f"line {i + 1} overruns its scene"
    sc["timing"] = {"start_frame": s0, "end_frame": s1, "frames": s1 - s0,
                    "start_s": round(s0 / fps, 3), "end_s": round(s1 / fps, 3)}
    sc["vo"] = {"file": f"{V['scratch_dir']}/fit/{i + 1:02d}.wav", "raw_file": f"{V['scratch_dir']}/{i + 1:02d}.wav",
                "raw_s": round(raw[i], 3), "fitted_s": round(fitted[i], 3), "tempo": round(tempo, 4),
                "start_frame": v0, "end_frame": v1}
    t1 = min(s1, v1 + round(0.5 * fps))
    cues.append((v0 / fps, t1 / fps, sc["vo_text"]))
    rows.append((i + 1, sc["id"], s0, s1, (s1 - s0) / fps, raw[i], fitted[i], (s1 - s0) / fps - fitted[i]))

cfg["vo"]["fit"] = {"tempo": round(tempo, 4), "lead_s": round(lead, 3), "breath_s": round(breath, 3),
                    "pauses": f"sentence {SENT}s, comma {COMMA}s"}
CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")


def ts(t):
    ms = round(t * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


(ROOT / "out/subtitles-draft.srt").write_text(
    "\n".join(f"{k + 1}\n{ts(a)} --> {ts(b)}\n{t}\n" for k, (a, b, t) in enumerate(cues)), encoding="utf-8")
(ROOT / "out/timing.json").write_text(json.dumps([{"scene": r[0], "id": r[1], "start_frame": r[2], "end_frame": r[3]} for r in rows], indent=1))

print(f"fit: pauses tightened (sentence {SENT}s, comma {COMMA}s), tempo {tempo:.3f}x, lead {lead:.2f}s, breath {breath:.2f}s")
print(f"{'#':>2} {'scene':<12} {'start':>14} {'end':>14} {'VO raw':>7} {'VO fit':>7} {'gap':>6}")
for i, sid, s0, s1, L_, r, f, g in rows:
    print(f"{i:>2} {sid:<12} {s0:>4}f {s0 / fps:6.3f}s  {s1:>4}f {s1 / fps:6.3f}s  {r:6.3f}s {f:6.3f}s {g:5.2f}s")
print(f"total frames: {edges[-1]} = {edges[-1] / fps:.3f} s")

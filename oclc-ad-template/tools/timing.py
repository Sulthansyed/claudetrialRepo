"""Timing map: narration drives the cut.

  .venv/bin/python tools/timing.py

1. Reads out/vo-scratch/NN.wav (raw lines, as measured).
2. Fits them, gentlest first: lines as recorded; if they do not fit with near-target padding, long pauses
   inside lines are shortened (vo.tighten_pauses "auto"; sentence breaks -> 0.5 s, comma pauses -> 0.3 s);
   only then a tempo increase, never above vo.max_speedup (1.0 = never). Speech itself is never altered.
   Fitted lines go to out/vo-scratch/fit/NN.wav. Raw files are not touched.
3. Scene = lead-in + VO + breath; the last scene ends with vo.end_hold_s of no voice (music resolution).
   Spare time spread evenly, last scene >= vo.min_last_scene_s.
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
SENT, COMMA = 0.5, 0.3


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
T = total_f / fps
lead, breath = V["lead_in_s"], V["breath_s"]
hold = V.get("end_hold_s", breath)
# the last scene's breath is the voice-free ending
need = lambda f, l, b: sum(t / f for t in tight) + n * l + (n - 1) * b + max(b, hold)
NEAR = 0.85   # padding may shrink to 85 % of target before pauses are touched
tp = V.get("tighten_pauses", "auto")
tight = raw[:]
tightened = tp is True or (tp == "auto" and need(1.0, lead * NEAR, breath * NEAR) > T)
for i in range(n):
    if tightened:
        y, sr = tighten(src / f"{i + 1:02d}.wav")
    else:
        y, sr = sf.read(src / f"{i + 1:02d}.wav")
    sf.write(fit_dir / f"_tight{i + 1:02d}.wav", y, sr, subtype="PCM_16")
    tight[i] = len(y) / sr
tempo = 1.0
if need(1.0, lead, breath) > T:
    room = T - (n * lead + (n - 1) * breath + max(breath, hold))
    tempo = max(1.0, min(V["max_speedup"], sum(tight) / room)) if room > 0 else V["max_speedup"]
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

# scene lengths, spare spread evenly, last scene >= min, last scene ends with the voice-free hold
L = [lead + d + breath for d in fitted]
L[-1] = lead + fitted[-1] + max(breath, hold)
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
    if i == n - 1:
        assert s1 - v1 >= round(hold * fps), "end hold too short"
    cues.append((v0 / fps, t1 / fps, sc["vo_text"]))
    rows.append((i + 1, sc["id"], s0, s1, (s1 - s0) / fps, raw[i], fitted[i], (s1 - s0) / fps - fitted[i]))

cfg["vo"]["fit"] = {"tempo": round(tempo, 4), "lead_s": round(lead, 3), "breath_s": round(breath, 3),
                    "pauses": f"shortened: sentence {SENT}s, comma {COMMA}s" if tightened else "as recorded",
                    "end_hold_s": round((edges[-1] - cfg["scenes"][-1]["vo"]["end_frame"]) / fps, 3)}
CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")


def ts(t):
    ms = round(t * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


(ROOT / "out/subtitles-draft.srt").write_text(
    "\n".join(f"{k + 1}\n{ts(a)} --> {ts(b)}\n{t}\n" for k, (a, b, t) in enumerate(cues)), encoding="utf-8")
(ROOT / "out/timing.json").write_text(json.dumps([{"scene": r[0], "id": r[1], "start_frame": r[2], "end_frame": r[3]} for r in rows], indent=1))

print(f"fit: tempo {tempo:.3f}x (speech untouched), pauses {'shortened to sentence ' + str(SENT) + 's / comma ' + str(COMMA) + 's' if tightened else 'as recorded'}, "
      f"lead {lead:.2f}s, breath {breath:.2f}s, VO-free ending {cfg['vo']['fit']['end_hold_s']:.2f}s")
print(f"{'#':>2} {'scene':<12} {'start':>14} {'end':>14} {'VO raw':>7} {'VO fit':>7} {'gap':>6}")
for i, sid, s0, s1, L_, r, f, g in rows:
    print(f"{i:>2} {sid:<12} {s0:>4}f {s0 / fps:6.3f}s  {s1:>4}f {s1 / fps:6.3f}s  {r:6.3f}s {f:6.3f}s {g:5.2f}s")
print(f"total frames: {edges[-1]} = {edges[-1] / fps:.3f} s")

"""Estimate when each word of the voice-over starts, so on-screen text can land on the word it matches.

  .venv/bin/python tools/words.py     -> out/vo-words.json  { scene_id: [ {w, t0, t1}, ... ] }  (scene-local seconds)

Works for any recording (scratch TTS or the real voice): each fitted line is split at its pauses
(silencedetect), the pieces are matched to the phrases of vo_tts_text (split at , . ! ?), and inside a
phrase the time is shared out by syllables (vowel groups; a spelled letter such as the "U" of "U P K K" counts as one).
If the number of pauses does not match the punctuation, the whole line is shared out by syllables.
Scenes refer to words by their vo_tts_text spelling (lower case), e.g. cue "u" = the U of "U P K K".
"""
import json, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps = cfg["format"]["fps"]


def speech_segments(path):
    log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-af", "silencedetect=noise=-40dB:d=0.15",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]))
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
    segs, cur = [], 0.0
    for a, b in zip(st, en):
        if a - cur > 0.05: segs.append((cur, a))
        cur = b
    if dur - cur > 0.05: segs.append((cur, dur))
    return segs


def syl(tok):
    if len(tok) == 1 and tok.isalpha(): return 1
    return max(1, len(re.findall(r"[aeiou]+", tok.lower())))


def spread(tokens, a, b):
    w = [syl(t) for t in tokens]; tot = sum(w); out, t = [], a
    for tok, k in zip(tokens, w):
        d = (b - a) * k / tot
        out.append({"w": tok.lower(), "t0": round(t, 3), "t1": round(t + d, 3)}); t += d
    return out


res, report = {}, []
for sc in cfg["scenes"]:
    v = sc["vo"]
    off = (v["start_frame"] - sc["timing"]["start_frame"]) / fps
    phrases = [p.split() for p in re.split(r"[,.!?]", sc["vo_tts_text"]) if p.strip()]
    phrases = [[re.sub(r"[^\w]", "", t) for t in p] for p in phrases]
    segs = speech_segments(ROOT / v["file"])
    words = []
    if len(segs) == len(phrases):
        for p, (a, b) in zip(phrases, segs): words += spread(p, a, b)
        how = f"{len(segs)} phrases matched to pauses"
    else:
        words = spread([t for p in phrases for t in p], segs[0][0], segs[-1][1])
        how = f"pauses ({len(segs)}) != phrases ({len(phrases)}): whole line by syllables"
    for x in words: x["t0"] = round(x["t0"] + off, 3); x["t1"] = round(x["t1"] + off, 3)
    res[sc["id"]] = words
    report.append(f"{sc['id']:<12} {how}: " + " ".join(f"{x['w']}@{x['t0']:.2f}" for x in words))
(ROOT / "out/vo-words.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print("\n".join(report))

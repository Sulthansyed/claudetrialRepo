"""QC report for the final film -> out/qc/report.txt (and printed).

  .venv/bin/python tools/qc_report.py [approved_ref]

Checks: duration and frame count (ffprobe), stream format, loudness (ebur128: integrated LUFS, true peak),
colour round trip (decoded MP4 vs source PNG frames), text timing and safe-zone margins (out/qc/text.json from
tools/qc_text.mjs), logo aspect, VO-free ending, and that nothing locked changed since the approved Step 2
commit: character rigs, brand config, scene order, on-screen text, VO lines and every Jawi word (against the
signed check sheet's code points).
"""
import json, pathlib, re, subprocess, sys
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = sys.argv[1] if len(sys.argv) > 1 else "8322a10"   # Step 2, approved
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
fps, N, W, H = cfg["format"]["fps"], cfg["format"]["frames"], cfg["format"]["width"], cfg["format"]["height"]
mp4 = ROOT / "out/oclc-upkk-2027.mp4"
frames = ROOT / "out/_work/film"
lines, fails = [], []
say = lines.append
def check(ok, msg):
    say(("PASS  " if ok else "FAIL  ") + msg)
    if not ok: fails.append(msg)
run = lambda c: subprocess.run(c, capture_output=True, text=True, check=True).stdout

say("OCLC UPKK 2027: QC report")
say("=" * 60)
# ---------- format ----------
v = json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
    "stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,color_range,color_space,color_primaries,color_transfer",
    "-show_entries", "format=duration", "-of", "json", str(mp4)]))
a = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels,duration",
    "-of", "json", str(mp4)]))["streams"][0]
vs, dur = v["streams"][0], float(v["format"]["duration"])
say(f"file      {mp4.relative_to(ROOT)}  ({mp4.stat().st_size / 1e6:.1f} MB)")
say(f"video     {vs['codec_name']} {vs['width']}x{vs['height']} {vs['pix_fmt']} {vs['r_frame_rate']} fps, "
    f"range={vs['color_range']} matrix={vs['color_space']} primaries={vs['color_primaries']} trc={vs['color_transfer']}")
say(f"audio     {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} ch, {float(a['duration']):.3f} s")
check(int(vs["nb_read_frames"]) == N, f"frame count {vs['nb_read_frames']} (need {N})")
check(abs(dur - N / fps) < 0.0005, f"duration {dur:.3f} s (need {N / fps:.3f} s)")
check((vs["codec_name"], vs["width"], vs["height"], vs["pix_fmt"], vs["r_frame_rate"]) == ("h264", W, H, "yuv420p", f"{fps}/1"),
      "H.264 1080x1920 yuv420p 30 fps")
check((vs["color_range"], vs["color_space"]) == ("tv", "bt709"), "bt709 limited range, tagged")
check((a["codec_name"], a["sample_rate"], a["channels"]) == ("aac", "48000", 2), "AAC 48 kHz stereo")

# ---------- loudness ----------
log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(mp4), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[0-9.]+) LUFS", log)[-1]); TP = float(re.findall(r"Peak:\s+(-?[0-9.]+) dBFS", log)[-1])
LRA = float(re.findall(r"LRA:\s+(-?[0-9.]+) LU", log)[-1])
check(abs(I + 14) <= 0.5, f"loudness {I:.1f} LUFS integrated (target -14)")
check(TP <= -1.0, f"true peak {TP:.1f} dBTP (limit -1.0)")
say(f"          loudness range {LRA:.1f} LU")

# ---------- colour ----------
worst, report = 0, []
for k in [0, 450, N - 1]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"select=eq(n\\,{k}),scale=in_range=tv:in_color_matrix=bt709:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24",
                          "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    dec = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(int)
    src = np.asarray(Image.open(frames / f"{k:05d}.png").convert("RGB")).astype(int)
    for (x, y) in [(30, 30), (W - 160, 30), (30, H - 30), (W - 30, H - 30)]:
        d = int(np.abs(dec[y, x] - src[y, x]).max()); worst = max(worst, d)
    report.append(f"f{k}: png {tuple(int(c) for c in src[30, 30])} mp4 {tuple(int(c) for c in dec[30, 30])}, frame mean |diff| {np.abs(dec - src).mean():.2f}")
check(worst <= 3, f"colour: cream background matches the PNG within ±3 (worst {worst})")
for r in report: say("          " + r)

# ---------- timing ----------
vo_end = cfg["scenes"][-1]["vo"]["end_frame"]
check((N - vo_end) / fps >= 1.8 - 1e-6, f"VO-free ending {(N - vo_end) / fps:.2f} s (need >= 1.8 s)")
check(all(s["vo"]["tempo"] == 1.0 for s in cfg["scenes"]), f"voice at 1.0x ({cfg['vo']['fit']['pauses']})")
say("          scene        frames      start     end")
for s in cfg["scenes"]:
    t = s["timing"]; say(f"          {s['id']:<12} {t['start_frame']:>3}-{t['end_frame']:<3}  {t['start_s']:6.3f}s {t['end_s']:6.3f}s")

# ---------- text ----------
tq = json.loads((ROOT / "out/qc/text.json").read_text())
short = [r for r in tq if not r["text"].startswith("LOGO") and r["seconds"] < 1.2]
touch = [r for r in tq if r["settled"] is not None and r["settled"] < 4]
check(not short, f"every text readable >= 1.2 s (shortest: {min((r for r in tq if not r['text'].startswith('LOGO')), key=lambda r: r['seconds'])['text']} "
      f"{min(r['seconds'] for r in tq if not r['text'].startswith('LOGO')):.2f} s)")
check(not touch, "no text touches the safe-zone edge in its settled position")
say("          text touching the safe-zone edge (settled margin < 4 px): " + (", ".join(r["text"] for r in touch) or "none"))
say("          closest settled margins: " + ", ".join(f"{r['text']} {r['settled']}px" for r in sorted([r for r in tq if r['settled'] is not None], key=lambda r: r['settled'])[:5]))
moving = [r for r in tq if r["outsideMotion"]]
say(f"          {len(moving)} items pass outside the zone only while sliding/popping in or out (entrance overshoot, transitions)")
logos = [r for r in tq if r["text"].startswith("LOGO")]
check(all((r.get("logoMaxSkewPx") or 0) <= 0.5 for r in logos), "logo square (undistorted) in every scene: " +
      ", ".join(f"{r['text']} skew {r.get('logoMaxSkewPx')}px" for r in logos))

# ---------- locked ----------
def at_ref(p):
    return subprocess.run(["git", "-C", str(ROOT), "show", f"{REF}:oclc-ad-template/{p}"], capture_output=True, text=True, check=True).stdout
same_rigs = subprocess.run(["git", "-C", str(ROOT), "diff", "--quiet", REF, "--", "characters", "config/brand.json"]).returncode == 0
check(same_rigs, f"characters/ and config/brand.json identical to the approved commit {REF}")
old = json.loads(at_ref("config/upkk-2027.json"))
key = lambda c: [(s["id"], s["on_screen_text"], s["vo_text"], s.get("jawi")) for s in c["scenes"]]
check(key(old) == key(cfg), "scene order, on-screen text, VO lines and scene Jawi identical to the approved commit")
signed = json.loads((ROOT / "sheet/jawi-words.json").read_text())
cps = lambda w: [f"U+{ord(c):04X}" for c in w]
check([(w["rumi"], w["jawi"]) for w in cfg["jawi_words"]] == [(w["rumi"], w["jawi"]) for w in signed] and
      all(cps(w["jawi"]) == [l["cp"] for l in w["letters"]] for w in signed),
      "Jawi words identical to the signed sheet: " + "; ".join(f"{w['rumi']} {' '.join(l['cp'] for l in w['letters'])}" for w in signed))
film_arabic = sorted({r["text"] for r in tq if re.search(r"[\u0600-\u06FF]", r["text"])})
check(set(film_arabic) <= {w["jawi"] for w in signed}, f"only signed Jawi words appear in the film ({len(film_arabic)} distinct)")
brand = json.loads((ROOT / "config/brand.json").read_text())
txt_all = " ".join(r["text"] for r in tq)
nums = re.findall(r"\d[\d\-–]*", txt_all)
check(re.findall(r"\d{3}-\d{3} \d{4}", txt_all) == [brand["contact"]["whatsapp_display"]], "only the brand WhatsApp number appears")
say(f"          all numbers on screen: {' '.join(sorted(set(nums)))} (UPKK 2027, programme numbers, 4/3/12/6–8, the brand WhatsApp)")

say("=" * 60)
say(f"{'ALL CHECKS PASS' if not fails else str(len(fails)) + ' CHECK(S) FAILED'}")
(ROOT / "out/qc").mkdir(parents=True, exist_ok=True)
(ROOT / "out/qc/report.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
sys.exit(1 if fails else 0)

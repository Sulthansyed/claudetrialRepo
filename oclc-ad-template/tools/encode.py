"""Encode PNG frames + a mix into a delivery MP4, with exactly one colour conversion, then verify it.

  .venv/bin/python tools/encode.py <frames_dir> <mix.wav> <out.mp4> [fps] [--mastered]

Video: RGB PNG -> bt709 limited-range yuv420p ONCE (scale filter, accurate rounding), tagged bt709/tv
       in both the container and the H.264 stream, so players convert back with the same matrix.
Audio: AAC 48 kHz stereo. Two-pass loudnorm to -14 LUFS / -1.5 dBTP first, unless --mastered (the mix is
       already at -14 LUFS with a true-peak limiter, e.g. tools/mix_film.py). The video stream is copied at mux.
Check: decodes frames back to RGB (bt709, limited range) and compares sampled pixels with the source PNGs.
       Fails if any sample differs by more than 3 in any channel. Prints the measured loudness.
"""
import json, pathlib, re, subprocess, sys
import numpy as np
import soundfile as sf

args = [a for a in sys.argv[1:] if not a.startswith("--")]
MASTERED = "--mastered" in sys.argv
frames, mix, out = map(pathlib.Path, args[:3])
fps = int(args[3]) if len(args) > 3 else 30
work = out.parent / "_work" / (out.stem + "-encode")
work.mkdir(parents=True, exist_ok=True)
pngs = sorted(frames.glob("[0-9]*.png"))
n = len(pngs)
from PIL import Image
W, H = Image.open(pngs[0]).size
TAGS = ["-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]

def run(cmd, text=True):
    return subprocess.run(cmd, check=True, capture_output=True, text=text)

# 1. video: the only RGB -> YUV conversion
video = work / "video.mp4"
run(["ffmpeg", "-y", "-v", "error", "-framerate", str(fps), "-i", str(frames / "%05d.png"),
     "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p",
     "-c:v", "libx264", "-preset", "slow", "-crf", "16",
     "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv", *TAGS, "-r", str(fps), str(video)])

# 2. audio: two-pass loudnorm
dur = n / fps
target = "I=-14:TP=-1.5:LRA=11"
p1 = "" if MASTERED else subprocess.run(["ffmpeg", "-v", "info", "-i", str(mix), "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
m = json.loads(p1[p1.rindex("{"):p1.rindex("}") + 1]) if p1 else {k: 0 for k in ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"]}
af = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000,apad,atrim=0:{dur:.6f}")
if MASTERED:
    af = f"aresample=48000,apad,atrim=0:{dur:.6f}"
norm = work / "audio.wav"
run(["ffmpeg", "-y", "-v", "error", "-i", str(mix), "-af", af, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s24le", str(norm)])

# 3. mux: copy the video, encode the audio
tmp = out.with_suffix(".tmp.mp4")
run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-i", str(norm), "-map", "0:v", "-map", "1:a",
     "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2", *TAGS, "-movflags", "+faststart", "-t", f"{dur:.6f}", str(tmp)])
tmp.replace(out)

# 4. verify: frame count, tags, colour round trip, loudness
probe = json.loads(run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                        "stream=nb_read_frames,pix_fmt,color_range,color_space,color_primaries,color_transfer,r_frame_rate",
                        "-of", "json", str(out)]).stdout)["streams"][0]
print(f"video: {probe['nb_read_frames']} frames @ {probe['r_frame_rate']}, {probe['pix_fmt']}, "
      f"range={probe['color_range']} matrix={probe['color_space']} primaries={probe['color_primaries']} trc={probe['color_transfer']}")
assert int(probe["nb_read_frames"]) == n, "frame count mismatch"

pts = [(30, 30), (W - 160, 30), (30, H - 30), (W - 30, H - 30), (W // 2, H - 60), (60, H // 2)]
worst = 0
for k in sorted({0, n // 2, n - 1}):
    raw = run(["ffmpeg", "-v", "error", "-i", str(out), "-vf",
               f"select=eq(n\\,{k}),scale=in_range=tv:in_color_matrix=bt709:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24",
               "-frames:v", "1", "-f", "rawvideo", "-"], text=False).stdout
    dec = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(int)
    src = np.asarray(Image.open(pngs[k]).convert("RGB")).astype(int)
    for (x, y) in pts:
        d = int(np.abs(dec[y, x] - src[y, x]).max()); worst = max(worst, d)
        print(f"  frame {k:3d} @({x:4d},{y:4d})  png {tuple(int(v) for v in src[y, x])}  mp4 {tuple(int(v) for v in dec[y, x])}  max diff {d}")
    print(f"  frame {k:3d} whole-frame mean |diff| {np.abs(dec - src).mean():.2f} (per channel: "
          f"{', '.join(f'{v:+.2f}' for v in (dec - src).reshape(-1, 3).mean(0))})")
print(f"colour round trip: worst sampled difference {worst} (limit 3) -> {'PASS' if worst <= 3 else 'FAIL'}")

lr = subprocess.run(["ffmpeg", "-v", "info", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
I = re.findall(r"I:\s+(-?[0-9.]+) LUFS", lr)[-1]; TP = re.findall(r"Peak:\s+(-?[0-9.]+) dBFS", lr)[-1]
astr = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,sample_rate,channels",
                       "-of", "json", str(out)]).stdout)["streams"][0]
print(f"audio: {astr['codec_name']} {astr['sample_rate']} Hz, {astr['channels']} ch; {I} LUFS integrated, true peak {TP} dBTP"
      f" -> {'PASS' if abs(float(I) + 14) <= 1 and float(TP) <= -1.0 else 'CHECK'}")
print(f"wrote {out} ({dur:.3f} s)")
sys.exit(0 if worst <= 3 else 1)

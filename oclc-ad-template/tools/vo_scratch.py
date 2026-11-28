"""Scratch voice-over for timing.
Uses assets/vo/01.wav..07.wav if all exist; otherwise makes them with edge-tts
(ms-MY-YasminNeural, Malaysian Malay female) from each scene's vo_tts_text.
Writes out/vo-scratch/NN.wav (48 kHz mono, edge silence trimmed) and prints measured durations.
    .venv/bin/python tools/vo_scratch.py
"""
import asyncio, json, pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((ROOT / "config/upkk-2027.json").read_text())
VOICE = cfg["vo"]["scratch_voice"]
RATE = cfg["vo"].get("scratch_rate", "+0%")
out = ROOT / "out/vo-scratch"
out.mkdir(parents=True, exist_ok=True)
work = ROOT / "out/_work/vo"
work.mkdir(parents=True, exist_ok=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode())

def to_wav(src, dst):
    # trim leading/trailing silence (-50 dB), 48 kHz mono 16-bit
    af = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,"
          "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse")
    subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", af,
                           "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)])

async def tts(text, path):
    import os, ssl
    import edge_tts
    import edge_tts.communicate as comm
    # edge-tts pins certifi's CA list; behind a TLS-inspecting proxy, trust the CA bundle named in
    # SSL_CERT_FILE instead (verification stays on).
    ca = os.environ.get("SSL_CERT_FILE")
    if ca and os.path.exists(ca):
        comm._SSL_CTX = ssl.create_default_context(cafile=ca)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))

scenes = cfg["scenes"]
own = [ROOT / f"assets/vo/{i + 1:02d}.wav" for i in range(len(scenes))]
use_own = all(p.exists() for p in own)
for i, sc in enumerate(scenes):
    dst = out / f"{i + 1:02d}.wav"
    if use_own:
        to_wav(own[i], dst)
    else:
        mp3 = work / f"{i + 1:02d}.mp3"
        try:
            asyncio.run(tts(sc["vo_tts_text"], mp3))
        except Exception as e:  # no network: stop, never fake durations
            sys.exit(f"TTS failed for line {i + 1}: {e}")
        to_wav(mp3, dst)
print(f"source: {'assets/vo (recorded)' if use_own else 'edge-tts ' + VOICE + ' rate ' + RATE}")
for i, sc in enumerate(scenes):
    print(f"{i + 1:02d}.wav  {dur(out / f'{i + 1:02d}.wav'):6.3f} s  {sc['vo_text']}")

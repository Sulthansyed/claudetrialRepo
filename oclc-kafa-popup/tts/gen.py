"""Malay narration with Microsoft's neural voice (edge-tts), through the session proxy.
python tts/gen.py  → tts/voices/<id>.wav (24 kHz mono, silence trimmed) + tts/voices/dur.json"""
import os, io, json, asyncio, subprocess, hashlib
import numpy as np, soundfile as sf, edge_tts
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'voices'); os.makedirs(OUT, exist_ok=True)
VOICE, SR = 'ms-MY-YasminNeural', 24000
PROXY = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy') or None
lines = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
dur = {}
for L in lines:
    say, rate = L.get('say', L['text']), L.get('rate', '+0%')
    key = hashlib.sha1(json.dumps([VOICE, rate, say]).encode()).hexdigest()[:12]; mp3 = os.path.join(OUT, f".{L['id']}_{key}.mp3")
    if not os.path.exists(mp3): asyncio.run(edge_tts.Communicate(say, VOICE, rate=rate, proxy=PROXY).save(mp3))
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', mp3, '-ar', str(SR), '-ac', '1', '-f', 'wav', '-'], capture_output=True, check=True).stdout
    a, _ = sf.read(io.BytesIO(raw), dtype='float32')
    nz = np.where(np.abs(a) > .01 * np.abs(a).max())[0]; a = a[max(0, nz[0] - int(.01 * SR)): nz[-1] + int(.1 * SR)]
    sf.write(os.path.join(OUT, L['id'] + '.wav'), a, SR); dur[L['id']] = round(len(a) / SR, 3)
json.dump(dur, open(os.path.join(OUT, 'dur.json'), 'w'), indent=1); print(dur)

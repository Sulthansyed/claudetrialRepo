#!/bin/sh
# Scene 1 motion test: frames from the real page, scratch VO + paper foley.
# Encoded once (RGB -> bt709 limited), loudness -14 LUFS, colour verified against the PNG frames.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
cd "$HERE"
T1=$(python3 -c "import json;c=json.load(open('config/upkk-2027.json'));print(c['scenes'][0]['timing']['end_frame']/c['format']['fps'])")
W=out/_work/scene1
node tools/frames.mjs seq 0 "$T1" "$W"
.venv/bin/python tools/mix_scene.py 0 "$T1" "$W/events.json" "$W/mix.wav"
.venv/bin/python tools/encode.py "$W" "$W/mix.wav" out/scene1-test.mp4 30

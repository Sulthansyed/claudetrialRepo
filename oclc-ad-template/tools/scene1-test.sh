#!/bin/sh
# Scene 1 motion test: frames from the real page, scratch VO + paper foley, muxed at -14 LUFS.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
LIB=${LIB:-/root/lemo-opuscar}
cd "$HERE"
T1=$(python3 -c "import json;c=json.load(open('config/upkk-2027.json'));print(c['scenes'][0]['timing']['end_frame']/c['format']['fps'])")
W=out/_work/scene1
node tools/frames.mjs seq 0 "$T1" "$W"
ffmpeg -y -v error -framerate 30 -i "$W/%05d.png" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 "$W/video.mp4"
.venv/bin/python tools/mix_scene.py 0 "$T1" "$W/events.json" "$W/mix.wav"
LEMO_COLOR=bt709 sh "$LIB/core/render/mux.sh" "$W/video.mp4" "$W/mix.wav" out/scene1-test.mp4 30 0

#!/bin/sh
# One command: voice → events → picture → score/mix → master. Needs the Lemo-Opuscar library (setup.sh prints LIB=...).
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
"$LIB/.venv/bin/python" "$HERE/tts/gen.py"          # Malay narration (ms-MY-YasminNeural, online)
"$LIB/.venv/bin/python" "$HERE/tts/asr_ms.py"       # speech-to-text check in Malay
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/oclc-kafa-satu-klik.mp4" 30 0
node "$HERE/thumb.mjs"

#!/bin/sh
# RM750 or RM0? — one-command build: picture (1080×1920), sound, final film, subtitles, thumbnail.
# Needs the Lemo-Opuscar library (set LIB, default ~/lemo-opuscar) with its core, voice and music packages.
# Voices are in voices/; to regenerate: "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" tts/lines.json voices
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/rm750-or-rm0.mp4" 30 0
node "$HERE/srt.mjs" "$HERE"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/subtitles_bm_en.srt"
node core/render/still.mjs "$HERE" 0 --q thumb=1 --prefix thumb_ --size 1080x1920 --out "$HERE/out"
"$LIB/.venv/bin/python" -c "from PIL import Image; Image.open('$HERE/out/thumb_0.jpg').save('$HERE/thumbnail.png')"
echo "done: $HERE/rm750-or-rm0.mp4"

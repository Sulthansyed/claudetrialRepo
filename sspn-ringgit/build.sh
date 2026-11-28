#!/bin/sh
# RM2,000 or RM0? (SSPN) — one-command build: picture (1080×1920, 30 fps), sound, final film, subtitles, thumbnail, previews.
# Needs the Lemo-Opuscar library (set LIB, default ~/lemo-opuscar) with its core and voice packages.
# Voices are in voices/; to regenerate:  "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" tts/lines.json voices
#                                         "$LIB/.venv/bin/python" "$LIB/core/tts/asr_check.py" tts/lines.json voices
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
"$LIB/.venv/bin/python" core/audio/sampler.py --need "$HERE/mix.py"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/rm2000-or-rm0.mp4" 30 0
node "$HERE/srt.mjs" "$HERE"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/subtitles_bm_en.srt"
node core/render/still.mjs "$HERE" 0.5 --q nosub=1 --prefix poster_ --size 1080x1920 --out "$HERE/out"
cp "$HERE/out/poster_0.5.jpg" "$HERE/poster.jpg"
node "$HERE/preview.mjs"                                            # preview_*.png + thumbnail.png
"$LIB/.venv/bin/python" "$HERE/qc.py"
echo "done: $HERE/rm2000-or-rm0.mp4"

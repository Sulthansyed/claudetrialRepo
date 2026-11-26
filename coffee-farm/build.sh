#!/bin/sh
# Misty Ridge — one-command build: picture, sound, final film and subtitles.
# Needs the Lemo-Opuscar library (set LIB, default ~/lemo-opuscar) with its core, voice and music packages.
# Voices are already in voices/; to regenerate them: "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" tts/lines.json voices
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/misty-ridge.mp4" 30 1
# subtitles are burned into the picture; the .srt is for platforms that want a separate track
node -e '
const fs = require("fs"), src = fs.readFileSync(process.argv[1], "utf8");
const rows = [...src.matchAll(/\[\x27(v\d\d)\x27, ([\d.]+), ([\d.]+), \x27([^\x27]+)\x27\]/g)];
const cues = rows.map(([, , s, d, txt]) => { s = +s; d = +d; return { t0: +(s - .15).toFixed(2), t1: +(s - .15 + Math.max(1.8, d + .9, txt.length / 15 + 1.55)).toFixed(2), text: txt }; });
fs.writeFileSync(process.argv[2], JSON.stringify(cues));' "$HERE/film.js" "$HERE/out/srt_cues.json"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/subtitles_en.srt"
echo "done: $HERE/misty-ridge.mp4"

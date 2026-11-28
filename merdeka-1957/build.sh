#!/bin/sh
# Merdeka, 1957 (Comic History Cartoon, 1080x1920, 10 s): one command, from anywhere.
#   sh build.sh              parts (if missing), voice (if missing) + speech check, events, picture, mix, master,
#                            subtitles, readcheck, poster
#   PARTS=1 sh build.sh      re-key the part sheets (src/sheet-*.png) into parts/
#   VOICE=1 sh build.sh      regenerate the narration
# Needs the Lemo-Opuscar library (LIB) with its core, voice and music packages (setup.sh deps voice music).
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"
NAME=merdeka-1957
SIZE=1080x1920
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$HERE/out" "$HERE/stills"
cd "$LIB"

# puppet parts: key and cut the two green-screen sheets
if [ "${PARTS:-0}" = "1" ] || [ ! -f "$HERE/parts/my_11.png" ]; then "$PY" "$HERE/tools/extract.py"; fi

# voice: Kokoro bm_george; every line must pass the speech-to-text check
if [ "${VOICE:-0}" = "1" ] || [ ! -f "$HERE/vo/v2.wav" ]; then "$PY" core/tts/tts.py "$HERE/vo/lines.json" "$HERE/vo"; fi
"$PY" core/tts/asr_check.py "$HERE/vo/lines.json" "$HERE/vo" --lang en

# events, picture, mix, master (-14 LUFS, grain 1), subtitles
node core/render/events.mjs "$HERE" --size $SIZE --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --size $SIZE --fps 24 --workers "${WORKERS:-3}" --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py" --events out/events.json --out out/mix.wav
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" 24 1
"$PY" - "$HERE" <<'PYEOF'
import re, sys, json, pathlib
here = pathlib.Path(sys.argv[1]); html = (here / 'index.html').read_text()
block = html[html.index('const SUBS = ['):html.index('];', html.index('const SUBS = ['))]
cues = re.findall(r"\[([\d.]+), ([\d.]+), \[(.*?)\]\]", block)
ts = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)):03d}"
out = []
for i, (a, b, lines) in enumerate(cues, 1):
    text = ' '.join(json.loads('[' + lines.replace("'", '"').replace('\\"', "'") + ']')) if '"' not in lines else ' '.join(re.findall(r'"(.*?)"', lines))
    out.append(f"{i}\n{ts(float(a))} --> {ts(float(b))}\n{text}\n")
(here / 'subtitles_en.srt').write_text('\n'.join(out))
print('subtitles_en.srt', len(out), 'cues')
PYEOF

# checks and poster (8.6 s: MERDEKA!, the pin on Kuala Lumpur, Britain's hands up)
node core/render/readcheck.mjs "$HERE" --size $SIZE > "$HERE/out/readcheck.txt" && echo "readcheck ok" || { tail -12 "$HERE/out/readcheck.txt"; echo "readcheck: see out/readcheck.txt"; }
ffmpeg -v error -y -ss "${FRAME:-8.6}" -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"

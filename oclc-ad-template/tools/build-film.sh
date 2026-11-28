#!/bin/sh
# One command for the whole film:  npm run render
# Voice: assets/vo/01.wav..NN.wav when all exist (the recorded voice), otherwise the scratch TTS.
# Stops with a message, before rendering anything, if the voice-over does not fit 30 s.
set -e
cd "$(dirname "$0")/.."
PY=.venv/bin/python
echo "== voice-over";      $PY tools/vo_scratch.py
echo "== timing";          $PY tools/timing.py | tee out/timing-table.txt
echo "== word timings";    $PY tools/words.py
echo "== music";           if [ -f assets/music/bed.wav ]; then echo "using assets/music/bed.wav"; else $PY tools/music.py; fi
echo "== frames";          node tools/render_film.mjs 3
echo "== mix";             $PY tools/mix_film.py
echo "== encode";          $PY tools/encode.py out/_work/film out/_work/mix.wav out/oclc-upkk-2027.mp4 30 --mastered | grep -v "@("
echo "== key frames";      node tools/frames.mjs keyframes | tail -1
echo "== thumbnail";       node tools/thumbnail.mjs | tail -1
echo "== contact sheet";   $PY tools/contact_sheet.py
echo "== text QC";         node tools/qc_text.mjs | tail -1
echo "== QC report";       $PY tools/qc_report.py | tail -1
echo "done: out/oclc-upkk-2027.mp4, out/oclc-upkk-2027.srt, out/vo-full.wav, out/thumbnail.jpg, out/qc/"

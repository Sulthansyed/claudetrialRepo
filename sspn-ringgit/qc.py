"""QC report for the final film → QC.md (run after build: needs rm2000-or-rm0.mp4, out/qc_page.json, out/srt_cues.json, subtitles_bm_en.srt)."""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, 'rm2000-or-rm0.mp4'); OUT = os.path.join(HERE, 'out')
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
rows, fails = [], []
def check(name, ok, detail): rows.append((name, 'pass' if ok else 'FAIL', detail)); (None if ok else fails.append(name))

# streams and duration
p = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', F).stdout)
v = next(s for s in p['streams'] if s['codec_type'] == 'video'); a = next(s for s in p['streams'] if s['codec_type'] == 'audio')
dur = float(p['format']['duration']); fps = eval(v['r_frame_rate'])
check('Format', v['codec_name'] == 'h264' and a['codec_name'] == 'aac' and (int(v['width']), int(v['height'])) == (1080, 1920) and abs(fps - 30) < .01,
      f"{v['codec_name']} {v['width']}×{v['height']} {fps:g} fps · {a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch")
check('Duration', 36 <= dur <= 42, f'{dur:.2f} s (target 36–42 s)')

# loudness (EBU R128 integrated, true peak)
r = run('ffmpeg', '-hide_banner', '-nostats', '-i', F, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
summ = r[r.rfind('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)); TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1)); LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
check('Loudness', abs(I + 14) <= 1.0, f'{I:.1f} LUFS integrated (target −14), LRA {LRA:.1f} LU')
check('True peak', TP <= -1.0, f'{TP:.1f} dBTP (limit −1.0)')

# black / frozen frames
bd = run('ffmpeg', '-hide_banner', '-nostats', '-i', F, '-vf', 'blackdetect=d=0.1:pix_th=0.10', '-an', '-f', 'null', '-').stderr
nb = len(re.findall(r'black_start', bd)); check('Black frames', nb == 0, f'{nb} black segments (blackdetect, ≥ 0.1 s)')

# first frame shows both numbers: sample the two Saved cells on frame 0 of the final file
fr0 = os.path.join(HERE, 'qc_frame0.png'); run('ffmpeg', '-y', '-v', 'error', '-i', F, '-frames:v', '1', fr0)
q = json.load(open(os.path.join(OUT, 'qc_page.json'))); im = np.asarray(Image.open(fr0).convert('RGB')).astype(int)
def tone(b):
    x0, y0, x1, y1 = [int(round(b[k])) for k in ('x0', 'y0', 'x1', 'y1')]
    patch = im[y0 + 6:y0 + 16, x0 + 6:x0 + 16].reshape(-1, 3).mean(0); return patch
bx = {b['id']: b for b in q['boxes']}
lime, red = tone(bx['saveA']), tone(bx['saveB'])
okL = np.abs(lime - [184, 242, 90]).max() < 30; okR = np.abs(red - [232, 56, 45]).max() < 30
ins = all(0 <= b['x0'] and b['x1'] <= 940 and b['y1'] <= 1270 for b in q['boxes'])
check('First frame', okL and okR and ins, f"frame 0: Aisyah's Saved cell RGB {tuple(int(c) for c in lime)} (lime, RM2,000), Ali's {tuple(int(c) for c in red)} (red, RM0); both boxes left of x 940 and above the note (y < 1270) → `qc_frame0.png`")

# subtitles: one BM + one English line per cue, never wrapped (note ≤ 860 px, ends before x 940), no overlaps, all inside the film
cues = json.load(open(os.path.join(OUT, 'srt_cues.json'))); srt = open(os.path.join(HERE, 'subtitles_bm_en.srt'), encoding='utf-8').read().strip().split('\n\n')
two = all(len(c.split('\n')) == 4 for c in srt)
wmax = max(s['w'] for s in q['subs']); overl = any(cues[k]['t1'] > cues[k + 1]['t0'] + 1e-6 for k in range(len(cues) - 1))
short = min(c['t1'] - c['t0'] for c in cues); inside = cues[-1]['t1'] <= dur
check('Subtitles', two and wmax <= 860 and not overl and inside,
      f'{len(cues)} cues, each BM line over an English line; widest note {wmax:.0f} px of 860 (right edge x {80 + wmax:.0f} < 940); no overlaps; shortest card {short:.2f} s; last ends {cues[-1]["t1"]:.2f} s')

# voice: speech-to-text on the final mix
try:
    from faster_whisper import WhisperModel
    seg, _ = WhisperModel('base.en', device='cpu', compute_type='int8').transcribe(F, language='en', vad_filter=True)
    heard = ' '.join(s.text.strip() for s in seg)
    need = ['two parents', '8,000', '2,000', 'two columns', 'dividends', 'own name', 'zero relief', 'tax band', 'ptptn', 'counter', 'comment below']
    miss = [w for w in need if w not in heard.lower().replace(' ringgit', '')]
    check('Voice (whisper on the final mix)', not miss, ('all key phrases heard' if not miss else 'missing: ' + ', '.join(miss)) + f' · “{heard}”')
except Exception as e:
    check('Voice (whisper on the final mix)', False, f'not run: {e}')

md = ['# QC — RM2,000 or RM0? (SSPN)', '', f'File: `rm2000-or-rm0.mp4` · checked by `qc.py`', '', '| Check | Result | Measured |', '|---|---|---|']
md += [f'| {a} | {b} | {c} |' for a, b, c in rows]
open(os.path.join(HERE, 'QC.md'), 'w').write('\n'.join(md) + '\n')
print('\n'.join(md)); sys.exit(1 if fails else 0)

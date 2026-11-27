"""Speech-to-text check of every line in Malay (faster-whisper, multilingual model) + word timings → voices/words.json"""
import os, json, re, difflib
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, 'voices')
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small'), device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z0-9 ]', '', s.lower().replace('-', ' ').replace('…', ' ')).split()
bad, words = 0, {}
for L in json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8')):
    segs, _ = m.transcribe(os.path.join(V, L['id'] + '.wav'), language='ms', word_timestamps=True, beam_size=5)
    segs = list(segs); heard = ' '.join(s.text for s in segs).strip()
    words[L['id']] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    want = L.get('asr', L['text'].replace('OCLC', 'O C L C').replace(':)', ''))
    r = difflib.SequenceMatcher(None, ' '.join(norm(want)), ' '.join(norm(heard))).ratio()
    ok = r >= .85; bad += not ok
    print(('ok  ' if ok else 'DIFF'), L['id'], f'{r:.2f}', '|', heard)
json.dump(words, open(os.path.join(V, 'words.json'), 'w'), ensure_ascii=False, indent=0)
print('mismatches:', bad)

# OCLC ad template

Reusable set-up for One Click Learning Centre ads made in code, in a **layered cardstock paper-cut** style.
Everything an ad says (text, voice-over lines, timing rules, which word each beat waits for, colours, contact)
lives in `config/`; the characters and the scene layouts are code that a new ad reuses.

**Status:** Steps 1 and 2 approved, Jawi signed off by a KAFA teacher. Step 3 rendered: the full 30 s film with
the scratch voice. The recorded voice drops in with one command (see "Swap in the real voice-over").

## Deliverables (`out/`)

| File | What |
|---|---|
| `oclc-upkk-2027.mp4` | the ad: H.264 1080×1920, 30 fps, 900 frames / 30.000 s, yuv420p bt709 limited, AAC 48 kHz stereo, −14 LUFS |
| `oclc-upkk-2027.srt` | subtitles from the timing map (not burned in) |
| `vo-full.wav` | the whole voice-over track as used in the mix |
| `thumbnail.jpg` | 1080×1920 cover; all text inside y 240–1680 (TikTok's 3:4 grid crop) |
| `caption.txt` | the post caption |
| `qc/contact-sheet.png`, `qc/report.txt`, `qc/text.json` | QC: one frame a second, and the checks below |
| `frames/`, `frames-safezone/`, `jawi-check.png`, `scene1-test.mp4` | Step 2 previews (approved) |
| `character-sheet.png`, `test-frame-9x16.png` | Step 1 (approved) |

## Render

Needs Node 20+, Playwright's Chromium, ffmpeg 7+ and Python 3.11+. Python packages go in a local `.venv`:

```sh
python3 -m venv .venv && .venv/bin/pip install edge-tts numpy scipy soundfile pillow fonttools brotli
npm run render
```

`npm run render` (`tools/build-film.sh`) runs, in order:

1. **voice-over** (`tools/vo_scratch.py`): `assets/vo/01.wav`…`07.wav` if all exist, else the scratch TTS (edge-tts `ms-MY-YasminNeural`; cached in `out/vo-scratch/`, only re-made when a line changes).
2. **timing** (`tools/timing.py`): fits the lines into exactly 900 frames and writes every scene's and every line's start/end frame into `config/upkk-2027.json`, `out/oclc-upkk-2027.srt` and `out/timing-table.txt`.
3. **word timings** (`tools/words.py`): when each word starts (`out/vo-words.json`), so text lands on the word it matches.
4. **music** (`tools/music.py`): an original bed composed in code, unless `assets/music/bed.wav` exists.
5. **frames** (`tools/render_film.mjs`): all 900 frames from `scenes/film.html` in three headless browsers (~2 min).
6. **mix** (`tools/mix_film.py`): voice on top, music ducked ~11 dB under speech, paper foley; −14 LUFS, true peak −1.5 dBTP; also writes `out/vo-full.wav`.
7. **encode** (`tools/encode.py`): one RGB → bt709 limited-range conversion, AAC 48 kHz stereo; decodes frames back and checks the colour.
8. **key frames, thumbnail, contact sheet, QC** (below).

Behind a TLS-inspecting proxy, edge-tts trusts the CA bundle named in `SSL_CERT_FILE`.

## Swap in the real voice-over

1. Put the recording in as `assets/vo/01.wav` … `07.wav`, one file per line, in scene order (any sample rate; leading and trailing silence is trimmed).
2. Run `npm run render`.

The build then re-measures the lines and retimes with the same rules: voice at **1.0×**, at least **1.5 s** of no voice at the end (1.8 s when it fits), exactly **900 frames**. If the lines are too long it tries, gentlest first: shortening long pauses inside lines, then the lead-in/breath padding (to 85 %), then the ending (1.8 → 1.5 s). Only then a speed-up, never past **1.05×**, printed as a WARNING. If it still does not fit, the build **stops before rendering** and prints which lines are too long and by how much. It re-renders the MP4, the SRT and `vo-full.wav`.

If a new recording says a beat word differently (or a line is reworded), check `out/vo-words.json` and the beat map (next section). Any beat whose word is not found is printed as a WARNING during `npm run render`.

## Make a new ad by editing `config/*.json`

- **`config/brand.json`**: colours, fonts, logo rules, WhatsApp, website, class size. Scenes never type contact details: `{whatsapp_display}` and `{website}` in scene text are filled from here.
- **`config/upkk-2027.json`**: the tools read this file, so for a new ad keep a copy of it (e.g. in git) and edit it in place. Per scene:
  - `on_screen_text`: the exact words on screen, by role (`headline`, `subhead`, `badge`, `body`, `spine`, `stat`, `label`, `contact`).
  - `vo_text` (subtitles) and `vo_tts_text` (pronunciation for the scratch voice, e.g. "U P K K").
  - `jawi`: Jawi words, set as live text. Have every Jawi word signed off (`npm run jawi-check`).
  - `cues`: which spoken word each beat waits for, e.g. `"card_2": "mengeja"`. Words use the `vo_tts_text` spelling in lower case (`"u"` is the U of "U P K K").
  - `characters`, `props`, `camera`, `sfx`: the scene's cast and intent (layout code reads the text, Jawi and cues).
  - `format`, `safe_zone`, `vo` (timing rules: lead-in, breath, `end_hold_s`, `max_speedup`): shared settings.
  - Timing fields (`timing`, `vo`) are written by the build; don't edit them by hand.

The seven scene layouts (hook, curiosity, programme-1, programme-2, structure, climax, payoff) are functions in
`scenes/film.js`, keyed by scene `id`. A new ad with the same seven beats needs only config changes; a different kind
of beat needs a new function there.

## Where things live

```
oclc-ad-template/
  config/brand.json, upkk-2027.json      brand + the ad (see above)
  characters/
    lib/paper.js     paper finish as SVG filters (edge wobble, grain, cut rims, layer shadows)
    lib/rig.js       separate-part rig: compose(rig, pose), two-bone IK, mirrored L/R pairs
    lib/kid.js       shared kid body + face;  lib/props.js  books, pencil, notebook, question marks, stars
    poses.js         every approved pose and expression
    boy/ girl/ klik/ rig.js (source of truth), rig.svg (parts at rest), poses/*.svg, expressions/*.svg
  scenes/film.js     the film as render(t); film.html is the page the tools drive
  sheet/             character sheet, test frame and Jawi check pages
  tools/             build, render, audio, encode and QC scripts
  assets/            logo, Klik reference, fonts (OFL); add vo/ and music/ here
  out/               deliverables; out/_work is scratch (not committed)
```

How the rigs work: every part of a character shares one coordinate system (feet at `y = 0`, ~576 units tall; `L`/`R` = side as seen on screen). A pose only rotates, offsets, re-stacks or swaps parts, so a character looks the same in every pose. Faces are swappable paper pieces with separate eyebrow strips. In the film, characters and paper props step at 12 fps; camera, text, cards and the logo move every frame; scenes change with one 9-frame paper slide.

## QC

```sh
npm run qc          # text timing + margins over all 900 frames, contact sheet, report (on the last render)
npm run keyframes   # one still per scene, with and without the safe zone; exact-text, logo and Jawi-clearance checks
npm run jawi-check  # out/jawi-check.png: each Jawi word, its Rumi spelling and code points, for sign-off
```

`out/qc/report.txt` lists: duration and frame count, stream format, loudness (LUFS, true peak), the colour check
(decoded MP4 vs PNG), the VO-free ending, the shortest on-screen text, any text touching the safe-zone edge, logo
aspect in every scene, and that the rigs, brand, on-screen text, VO lines and Jawi are unchanged from the approved
Step 2 commit (`.venv/bin/python tools/qc_report.py <commit>` to compare with another).

## Rules carried from the briefs

- The logo is only ever placed from `assets/oclc-logo.png`, scaled uniformly (≥220 px in scene 2, ≥300 px in scene 7).
- Jawi is live text in Noto Naskh Arabic, so the letters join. Only signed-off words; plain lines elsewhere.
- Essential text and the logo stay inside x 72–940, y 200–1536; headlines ≥ 64 px, body ≥ 44 px; each text on screen ≥ 1.2 s.
- Gold for small highlights only (stars, ticks, underlines); terracotta for cheeks and small warm details.
- No dates, prices, results or contact details beyond `config/brand.json`.

## Credits

- Montserrat and Noto Naskh Arabic: SIL Open Font License 1.1 (`assets/fonts/`), via Fontsource.
- Scratch voice: Microsoft Edge neural TTS (`ms-MY-YasminNeural`) via edge-tts, for timing only; to be replaced by the recorded voice.
- Music and sound effects: original, synthesised in code (`tools/music.py`, `tools/sfx_paper.py`); no samples or downloads.
- Style base: Lemo-Opuscar library, style "Red Paper-cut" (`papercut-red`), materials and motion rules only.
- Logo and Klik reference: supplied by OCLC.

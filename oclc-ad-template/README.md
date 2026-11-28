# OCLC ad template

Reusable set-up for One Click Learning Centre ads made in code, in a **layered cardstock paper-cut** style.
A new ad should only need new files in `config/`.

**Status:** Step 1 approved (brand, rigs, character sheet). Step 2 done for approval: scene config, scratch VO, timing map, key frames, Jawi check, scene 1 motion test. The full 30 s film is Step 3.

```
oclc-ad-template/
  config/
    brand.json            colours (navy/teal sampled from the logo), fonts, logo rules, contact, class size
    upkk-2027.json        script / scenes / timings (stub, filled in Step 3)
  characters/
    lib/paper.js          paper finish as SVG filters (edge wobble, grain, cut rims, layer shadows)
    lib/rig.js            separate-part rig: compose(rig, pose), two-bone IK, mirrored L/R pairs
    lib/kid.js            shared kid body + face (boy and girl use the same face pieces)
    lib/props.js          books, pencil, exercise book, question marks, stars, click burst
    poses.js              every approved pose and expression
    boy/  girl/  klik/
      rig.js              source of truth for the character
      rig.svg             every part at rest, one <g> per part, with data-parent / data-pivot / data-z
      poses/*.svg         each pose, composed
      expressions/*.svg   kids' heads: neutral, confused, happy, excited
  scenes/film.html, film.js   the film: render(t) for any time t, driven by config/upkk-2027.json
  sheet/                  character sheet, test frame and Jawi check pages
  tools/
    render.mjs            page -> PNG with headless Chromium
    export-rigs.mjs       rig.js -> rig.svg, poses/*.svg, expressions/*.svg
  assets/                 oclc-logo.png, klik-character-sheet.png, fonts/ (OFL)
  out/                    renders
```

## Build

Needs Node 20+, Playwright's Chromium, ffmpeg 7+ and Python 3. Python packages go in a local `.venv`
(`python3 -m venv .venv && .venv/bin/pip install edge-tts numpy scipy soundfile fonttools brotli`).

```sh
npm run build        # Step 1: export rigs, render out/character-sheet.png and out/test-frame-9x16.png
npm run step2        # Step 2: everything below, in order
npm run vo           #   scratch VO -> out/vo-scratch/NN.wav (uses assets/vo/NN.wav instead when all 7 exist)
npm run timing       #   fit VO, write frames into config/upkk-2027.json, out/subtitles-draft.srt, out/timing-table.txt
npm run keyframes    #   out/frames/scene-N.png + out/frames-safezone/scene-N.png, checks safe zone + exact text
npm run jawi-check   #   out/jawi-check.png for the KAFA teacher
npm run scene1-test  #   out/scene1-test.mp4 (scene 1 only, 30 fps, scratch VO + paper foley, -14 LUFS)
```

Behind a TLS-inspecting proxy, edge-tts trusts the CA bundle named in `SSL_CERT_FILE`.

## A new ad

Copy `config/upkk-2027.json`, change the scenes (text, VO, characters, props, camera, sfx), drop the recorded
VO into `assets/vo/01.wav`...`NN.wav` and run `npm run step2`. Scene layouts live in `scenes/film.js`, one function per scene id.
Contact details are never typed into a scene: `{whatsapp_display}` and `{website}` come from `config/brand.json`.

## How the rigs work

- All parts of a character share one coordinate system: feet at `y = 0`, about 576 units tall (Klik uses the same units, so line-ups need no rescaling). `L`/`R` means the side **as seen on screen**.
- A pose only rotates, offsets, re-stacks or swaps parts (`rot`, `off`, `z`, `var`) and can place props. It never redraws anything, so a character looks the same in every pose.
- Arms can be posed by hand target: `reach: { armL: { to: [x, y], bend: 'out' } }`.
- Faces are swappable paper pieces: eyes (`dot`, `wide`, `happy`, `down`, `closed`), mouths (`neutral`, `smile`, `smirk`, `wavy`, `o`, `smileOpen`, `grin`), and separate eyebrow strips that carry most of the expression (rotation + lift).
- Paper finish: each piece carries its own fixed-seed edge wobble and grain (moves with the piece), while cut rims and shadows are applied in character space so the light stays top-left whatever a piece's rotation. Animation (Step 3) samples poses at about 12 fps inside a 30 fps film; camera and text move every frame.

### Parts

| Character | Parts |
|---|---|
| Boy | hips, legL/R (trousers + shoe), torso (baju Melayu), head, songkok, eyeL/R, browL/R, cheeks, mouth, armUpL/R, armLoL/R, handL/R |
| Girl | hips, legL/R (shoes), skirt, torso (baju kurung), head (face + under-scarf band), hood (hijab), drape (hijab front), eyeL/R, browL/R, cheeks, mouth, arms and hands as the boy |
| Klik | shadow, float (root), antenna, cursor, bodyBack, body, bezel, screen, face (neutral, happy, tap, whatsapp) |

## Rules carried from the brief

- The logo is only ever placed from `assets/oclc-logo.png`, scaled uniformly.
- Jawi is set as live text in Noto Naskh Arabic so the letters join; no decorative Arabic-looking shapes.
- Gold is for small highlights only (stars, ticks, underlines); terracotta for cheeks and small warm details.
- No dates, prices, results or contact details beyond `config/brand.json`.

## Credits

- Montserrat and Noto Naskh Arabic: SIL Open Font License 1.1 (`assets/fonts/`), from Fontsource.
- Scratch voice: Microsoft Edge neural TTS (`ms-MY-YasminNeural`) via edge-tts, for timing only; replaced by the recorded voice.
- Mux and loudness: Lemo-Opuscar `core/render/mux.sh`.
- Style base: Lemo-Opuscar library, style "Red Paper-cut" (`papercut-red`), materials and motion rules only.
- Logo and Klik reference: supplied by OCLC.

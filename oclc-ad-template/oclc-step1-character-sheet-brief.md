# OCLC UPKK 2027 Ad: Step 1, Character Sheet Only

Use Lemo-Opuscar. **This step only builds the brand config and character assets and renders a character sheet for approval. Do NOT build or render the video yet.**

## 0. Before you start
1. Read the Lemo-Opuscar director guide, technique guide and any style guide closest to **layered cardstock paper-cut**. Tell me which style guide you picked.
2. Check these files are in `assets/`:
   - `assets/oclc-logo.(svg|png)`: official OCLC logo. Never redraw, stretch or recolour it.
   - `assets/klik-character-sheet.png`: existing Klik mascot reference.
   If either is missing, stop and ask me.

## 1. Project structure (reusable template)
Set up the project so future OCLC ads only need new config files:

```
oclc-ad-template/
  config/
    brand.json          # colours, fonts, logo, contact
    upkk-2027.json      # script, scenes, timings (fill in Step 3, leave a stub now)
  characters/
    boy/  girl/  klik/  # SVG part rigs + poses
  assets/               # logo, Klik reference, textures
  out/                  # renders
  README.md
```

## 2. brand.json
- **Primary navy and teal:** sample the exact hex values from the OCLC logo file. Do not guess them.
- Warm cream background: `#F8F5EC`
- Gold accent: `#E9B949`, used only for small highlights (stars, ticks, underlines)
- Terracotta: `#C97862`, used only for cheeks and small warm details
- Text: logo navy on cream (check contrast is at least 4.5:1)
- Font: one clean bold sans for headlines and one regular weight for body text. It must support Malay. Jawi uses Noto Naskh Arabic (or Amiri), rendered in a browser so the letters join correctly.
- WhatsApp: `019-823 0383` (+60 19-823 0383)
- Website: `oneclicklearningcentre.com`
- Class size: 6–8 pupils per class

Do not add any dates, prices, results or other contact details.

## 3. Style: layered cardstock paper-cut
- Flat cut-paper shapes with a subtle paper-grain texture and slightly irregular edges
- Soft drop shadows between 2–3 depth layers, so the paper looks lifted off the page
- Characters will animate "on twos" (12 fps feel inside 30 fps). Design the parts with that in mind.
- Simple and warm. No gradients, no glossy 3D, no generic corporate look.

## 4. Characters
Build each one as a **separate-part SVG rig** (head, eyebrows L/R, eyes, mouth set, torso, upper/lower arms, hands, legs) so later steps can animate them. They must look identical in every pose.

**Boy (Malay Muslim, about 10 years old)**
- Navy songkok, pastel teal baju Melayu with matching trousers
- Dot eyes, paper-strip eyebrows (separate pieces, which carry most of the expression), small terracotta cheeks

**Girl (Malay Muslim, about 10 years old)**
- Cream hijab with a thin navy outline and a soft shadow, so it doesn't disappear on the cream background
- Modest navy baju kurung (school style)
- Same face style as the boy

**Klik (mascot)**
- Redraw Klik in paper-cut style from `assets/klik-character-sheet.png`: a floating teal/navy cube with a screen face and a cursor antenna
- Keep its shape and colours true to the reference

## 5. Poses and expressions needed
| Character | Poses |
|---|---|
| Boy | Confused (eyebrows tilted, hand on head) · Excited · Writing with a pencil · Holding books, smiling confidently |
| Girl | Neutral · Excited · Holding books, smiling confidently |
| Klik | Neutral float · Tapping its cursor antenna ("click") · Happy face · Screen face showing a WhatsApp icon |

Facial expressions sheet (both kids): neutral, confused, happy, excited.

## 6. Output for this step
1. `out/character-sheet.png` (landscape, at least 3000 px wide): all characters, all poses, colour swatches with hex codes, and a size line-up of the kids next to Klik.
2. `out/test-frame-9x16.png` (1080 × 1920): the boy in his confused pose at a study desk on the cream background, to check scale on a phone.
3. `characters/` with the reusable SVG rigs.
4. `config/brand.json`.

Then **stop** and show me the PNGs for approval.

## 7. Self-check before showing me
- [ ] Navy and teal sampled from the logo, not guessed
- [ ] Characters look identical across all poses
- [ ] Hijab is clearly visible on cream
- [ ] No random Arabic-looking symbols anywhere
- [ ] Logo is not redrawn or distorted
- [ ] Style reads as handmade paper-cut, not generic AI art

---

## For context only (do NOT build yet)
The approved 30-second storyboard (9:16, 1080×1920, 30 fps, Bahasa Melayu):

| Time | Beat | Scene |
|---|---|---|
| 0–3.5s | Hook | Boy confused by his Jawi workbook, question marks. "ANAK BAKAL MENDUDUKI UPKK 2027?" |
| 3.5–7s | Curiosity | Klik taps its antenna, calendar flips into books, logo appears. "PROGRAM CUTI SEKOLAH · 2 PILIHAN" |
| 7–12s | Programme 1 | KELAS JAWI INTENSIF, Membaca • Mengeja • Menulis |
| 12–17s | Programme 2 | KELAS ULANG KAJI UPKK: Akidah, Ibadah, Adab, Sirah, Bahasa Arab (5 books) |
| 17–22s | Structure | 4 MINGGU · 3 KELAS SEMINGGU · 12 SESI · 6–8 MURID SEKELAS |
| 22–25s | Climax | Boy now writes Jawi correctly and smiles; progress report ticks up. Modul Digital • Ujian Diagnostik • Laporan Kemajuan |
| 25–30s | Payoff | Both kids with books, Klik with WhatsApp face, logo. PENDAFTARAN DIBUKA! · WhatsApp 019-823 0383 · oneclicklearningcentre.com |

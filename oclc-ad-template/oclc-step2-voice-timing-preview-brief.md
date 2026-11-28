# OCLC UPKK 2027 Ad: Step 2, Voice-over, Timing and Previews

Work inside `oclc-ad-template/`. Step 1 (character sheet) is **approved**. Reuse the existing rigs in `characters/` and `config/brand.json`. Do not redesign any character.

**This step builds the scene config, a scratch voice-over, the timing map, still previews and one short motion test. Do NOT render the full 30-second video yet.**

---

## 1. Fill `config/upkk-2027.json`
This is the reusable scene config. Future ads should only need this file changed. For each scene, store: `id`, `beat`, `on_screen_text`, `vo_text`, `vo_tts_text` (pronunciation-friendly version), `characters`, `props`, `camera`, `sfx`, and the timing fields from section 3.

| # | Beat | On-screen text (exact) | Voice-over (exact) |
|---|---|---|---|
| 1 | Hook | ANAK BAKAL MENDUDUKI / UPKK 2027? | "Anak bakal menduduki UPKK tahun depan?" |
| 2 | Curiosity | PROGRAM CUTI SEKOLAH / PERSEDIAAN UPKK 2027 + badge "2 PILIHAN" | "Manfaatkan cuti sekolah bersama OCLC. Ada dua pilihan!" |
| 3 | Programme 1 | badge "PROGRAM 1" · KELAS JAWI INTENSIF · Membaca • Mengeja • Menulis | "Kuasai kemahiran membaca, mengeja dan menulis Jawi." |
| 4 | Programme 2 | badge "PROGRAM 2" · KELAS ULANG KAJI UPKK · book spines: Akidah, Ibadah, Adab, Sirah, Bahasa Arab | "Atau kukuhkan asas Akidah, Ibadah, Adab, Sirah dan Bahasa Arab." |
| 5 | Structure | 4 MINGGU · 3 KELAS SEMINGGU · 12 SESI · 6–8 MURID SEKELAS | "Empat minggu, tiga kelas seminggu, online dalam kumpulan kecil." |
| 6 | Climax | Modul Latihan Digital · Ujian Diagnostik & Penilaian Akhir · Laporan Kemajuan | "Lengkap dengan modul digital dan laporan kemajuan murid." |
| 7 | Payoff / CTA | PENDAFTARAN DIBUKA! · Persediaan UPKK 2027 · WhatsApp 019-823 0383 · oneclicklearningcentre.com | "Tempat terhad. Daftar sekarang bersama OCLC!" |

**Scene actions**
1. The boy (confused pose) sits at a study desk with a Jawi workbook. Paper question marks pop in around his head. The camera slowly pushes in.
2. Klik floats in and taps its cursor antenna ("click"). A school-holiday calendar flips its pages, and the pages fold into books. The boy switches to his excited pose. The OCLC logo appears (official file, never redrawn).
3. The boy arranges paper Jawi letters into words, then writes with a pencil.
4. Five paper books appear one by one, with a staggered drop and a soft bounce. Each spine shows one subject in Rumi.
5. A paper calendar and a laptop showing a small virtual class of 6 paper-cut tiles. The four stat cards stack in, big and bold.
6. **Climax:** the boy writes a Jawi word correctly and his face changes from confused to happy. A digital worksheet, a test paper and a progress-report card slide in, and the report gets a gold tick.
7. Both kids are in the holding-books, confident pose. Klik is beside them with its WhatsApp face. The logo and CTA text appear.

**Rules:** do not invent dates, prices, results or any contact detail beyond those in `brand.json`.

---

## 2. Scratch voice-over (for timing only)
The final voice will be a real recorded Malaysian female voice, dropped into `assets/vo/` later. For now:

1. If `assets/vo/01.wav` … `07.wav` exist, use those.
2. Otherwise, make a scratch TTS track per line with a **Malaysian Malay female voice** (e.g. `edge-tts`, voice `ms-MY-YasminNeural`). If no TTS can reach the network, stop and tell me. Don't fake the durations.
3. Use `vo_tts_text` so acronyms are spoken letter by letter: "U P K K", "O C L C".
4. Save as `out/vo-scratch/01.wav` … `07.wav` and print the **measured duration** of each line.

---

## 3. Timing map (narration drives the cut)
- Total: **exactly 30.000 s = 900 frames at 30 fps.**
- Each scene = its VO duration + about 0.3 s lead-in + about 0.4 s breathing room. Spread any spare time evenly, and give scene 7 at least 4 s.
- If the voice-over doesn't fit, tell me which line is too long. Never speed the voice up beyond 1.08×.
- Write the start/end frame of every scene and every VO line into `upkk-2027.json`.
- Generate `out/subtitles-draft.srt` from those timings.
- Print a timing table: scene | start | end | VO length | gap.

---

## 4. Safe zones (TikTok and Reels, 1080 × 1920)
Keep all essential text and the logo inside: **x 72–940, y 200–1536.**
- The right ~140 px is reserved for the platform buttons.
- The bottom 20% (y > 1536) is reserved for the caption and username, so nothing essential goes there.
- Headlines must be at least 64 px, and body/stat text at least 44 px.

---

## 5. Jawi accuracy
- Render all Jawi in the browser (Chromium/HarfBuzz) with Noto Naskh Arabic or Amiri, so the letters join correctly.
- The words used are: جاوي (Jawi), ممباچ (membaca), مڠيجا (mengeja), منوليس (menulis).
- Do not add any other Arabic-script text. Decorative workbook lines should be plain lines, not fake script.
- Output `out/jawi-check.png`: each word large, with its Rumi spelling and Unicode code points listed beside it. **A KAFA teacher will sign this off before Step 3.**

---

## 6. Previews to output
1. `out/frames/scene-1.png` … `scene-7.png`: one key frame per scene at 1080 × 1920, showing the final layout with all text.
2. `out/frames-safezone/scene-1.png` … `scene-7.png`: the same frames with the safe-zone box drawn as a red overlay.
3. `out/test-frame-9x16.png`, if it wasn't made in Step 1.
4. `out/scene1-test.mp4`: **scene 1 only**, fully animated at 30 fps with the scratch VO, to test motion style (12 fps stepped characters, smooth camera and text) and paper rustle and pop SFX.
5. The printed timing table from section 3.

Then **stop** and show me everything for approval.

---

## 7. Self-check before showing me
- [ ] All on-screen text matches section 1 exactly (Malay spelling included)
- [ ] No text or logo outside the safe zone
- [ ] Characters match the approved sheet exactly (girl has the navy inner cap and no visible hair)
- [ ] Logo is untouched and undistorted
- [ ] Jawi renders joined correctly, with no stray Arabic-looking symbols
- [ ] Timing adds up to exactly 900 frames
- [ ] Nothing in the scenes is a guessed date, price or contact

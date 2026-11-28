# OCLC UPKK 2027 Ad: Step 3, Full Render and Deliverables

Work inside `oclc-ad-template/`. Steps 1 and 2 are **approved**, and the Jawi has been **signed off by a KAFA teacher**.

**Locked. Do not change:** characters, palette, on-screen text, VO lines, scene order, layout, and every Jawi word (جاوي، ممباچ، مڠيجا، منوليس). If something must change, stop and ask me.

Voice: render with the **scratch VO** for now. The real recording will be dropped in later (see section 6).

---

## 1. Full 30-second animation
Animate all 7 scenes from `config/upkk-2027.json`, using the approved Step 2 key frames as the layout for each scene.

- **Motion style:** characters and paper props move stepped at 12 fps (on twos); the camera, text and backgrounds move smoothly at 30 fps. Use gentle ease-in/ease-out and a small overshoot on pops. No robotic linear moves.
- **Transitions:** one consistent paper transition between scenes (a slide or fold, 8–10 frames). No flashy or varied transitions.
- **Text:** each line appears in sync with the VO word or phrase it matches, and stays readable for at least 1.2 s.
- **Story beats to land clearly:**
  - Scene 1: the question marks pop in on the hook, with a slow push-in on the boy.
  - Scene 2: Klik taps its antenna, the calendar pages flip and fold into books, and the boy goes from confused to excited.
  - Scene 6 (climax): the boy writes جاوي, his face changes from confused to happy, and a gold tick lands on the progress report.
  - Scene 7: both kids smile with their books, Klik shows the WhatsApp face, and the CTA holds still for the 1.8 s VO-free ending.

## 2. Audio
- **Music:** if `assets/music/bed.wav` exists, use it. Otherwise compose a short original instrumental in code: cheerful but subtle (soft plucks or marimba with a warm pad), about 100–110 BPM, resolving to a gentle final chord in the last 1.8 s. No copyrighted or downloaded music.
- **SFX (subtle, never cartoonish):** paper rustle (scene 1), soft question-mark pops, the Klik "click" (scene 2), page flips (scene 2), card and book drops (scenes 3–4), the tick (scene 6). Reuse `tools/sfx_paper.py`.
- **Mix:** VO always clearly on top. Duck the music by about 10–12 dB under speech. Final loudness about **−14 LUFS integrated, true peak ≤ −1 dBTP**.

## 3. Render spec
- `out/oclc-upkk-2027.mp4`: H.264, 1080 × 1920, 30 fps, yuv420p, bt709 limited range, AAC 48 kHz stereo
- **Exactly 30.000 s / 900 frames.** Verify with ffprobe and print the result.
- Colour check: a sampled cream background pixel matches the PNG within ±3.

## 4. Other deliverables
1. `out/vo-full.wav`: the full VO track as used in the mix (scratch for now)
2. `out/oclc-upkk-2027.srt`: final subtitles from the timing map (do not burn them into the video)
3. `out/thumbnail.jpg`: 1080 × 1920 cover showing the confused boy with question marks, **"UPKK 2027?"** big in navy with a gold underline, and **"2 PROGRAM CUTI SEKOLAH"** underneath, plus the logo. Keep all text inside the centre 1080 × 1440 area (y 240–1680), because TikTok crops covers to 3:4 in the profile grid.
4. `out/caption.txt` (exact text):
   ```
   Anak bakal duduki UPKK 2027? 📚 Manfaatkan cuti sekolah dengan program online OCLC:
   ✅ Kelas Jawi Intensif
   ✅ Kelas Ulang Kaji UPKK
   4 minggu • 3 kelas seminggu • 6–8 murid sekelas
   Tempat terhad! WhatsApp 019-823 0383 untuk daftar.
   #UPKK2027 #KAFA #KelasJawi #CutiSekolah #KelasOnline #OCLC
   ```
5. `README.md` (update) covering: how to render, how to swap the voice-over, how to make a new ad by editing `config/*.json` only, where the character rigs and brand config live, and the QC commands.

## 5. QC outputs (for my review)
- `out/qc/contact-sheet.png`: one frame every 1 s (30 frames) in a 6 × 5 grid, with a timecode on each
- `out/qc/report.txt`: duration, frame count, loudness (LUFS and true peak), colour check, and a list of any text that touches the safe-zone edge

Then **stop** and commit everything.

## 6. Voice-over swap (document in README, don't run now)
When `assets/vo/01.wav` … `07.wav` exist, running `npm run render` must use them, re-measure and retime with the same rules (1.0×, at least 1.5 s VO-free ending, exactly 900 frames), and re-render the MP4, SRT and vo-full.wav. If the real voice doesn't fit, print which line is too long instead of speeding it up past 1.05×.

## 7. Self-check before committing
- [ ] 900 frames, 30.000 s exactly
- [ ] Nothing in the locked list changed (Jawi identical to the signed sheet)
- [ ] VO clearly audible over the music throughout, and loudness on target
- [ ] All text inside the safe zone and on screen at least 1.2 s
- [ ] No invented dates, prices, results or contacts
- [ ] Logo undistorted in every scene

# QC — RM2,000 or RM0? (SSPN)

File: `rm2000-or-rm0.mp4` · checked by `qc.py`

| Check | Result | Measured |
|---|---|---|
| Format | pass | h264 1080×1920 30 fps · aac 48000 Hz 2 ch |
| Duration | pass | 39.80 s (target 36–42 s) |
| Loudness | pass | -14.0 LUFS integrated (target −14), LRA 4.6 LU |
| True peak | pass | -1.7 dBTP (limit −1.0) |
| Black frames | pass | 0 black segments (blackdetect, ≥ 0.1 s) |
| First frame | pass | frame 0: Aisyah's Saved cell RGB (182, 240, 89) (lime, RM2,000), Ali's (232, 56, 45) (red, RM0); both boxes left of x 940 and above the note (y < 1270) → `qc_frame0.png` |
| Subtitles | pass | 15 cues, each BM line over an English line; widest note 835 px of 860 (right edge x 915 < 940); no overlaps; shortest card 0.99 s; last ends 38.43 s |
| Voice (whisper on the final mix) | pass | all key phrases heard · “Two parents, same 8,000 ringgit saved, one saves up to 2,000 ringgit in tax. The difference is hiding in two columns. Trap one withdraw in the same year, even your dividends and your relief shrinks. Trap two, an SSPN your own name gets zero relief. Do it right and you save up to 2,000 ringgit, depending on your tax band. The money must reach PTPTN by 31st December. Not paying at a counter, pay by the 25th. What a full BM version, comment below.” |

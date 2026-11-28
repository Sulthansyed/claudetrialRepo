# RM2,000 or RM0? (SSPN) — treatment

**Style:** Spreadsheet Film (`styles/spreadsheet`) · **Channel:** Ringgit, Explained (TikTok / Reels)
**Format:** 1080 × 1920, 30 fps, H.264 + AAC, −14 LUFS, true peak ≤ −1 dBTP · **Length:** 39.8 s (voice-led; speech 29.6 s)
**Voice:** Kokoro `am_onyx`, speed 0.92, English · **Subtitles:** the style's cell-comment note, BM line large on top, English small under it, one line each, never wrapped
**File in the shell:** `SSPN_2026.xlsx` · generic, hand-drawn shell; no bank, PTPTN, LHDN or spreadsheet-software marks or colours

> **Stage B revision (approved changes):** (1) beat 5 voice is now "Do it right, and you save up to two thousand ringgit, depending on your tax band.", the band table animation is kept and its numbers stay on screen; (2) every spoken amount says "ringgit" (on-screen text keeps "RM"); (3) the end-card footnote is 31 px on screen and held 4.2 s. Timings below are the re-timed ones.
>
> Stage A: treatment, `storyboard.jpg`, scratch VO + timing table (§6), three preview frames (`preview_beat1_0.5s.png`, `preview_beat3_12.8s.png`, `preview_beat5_27.0s.png`), `FACTS.md`. The picture code (`film.js`) already renders the whole 41 s timeline; sound is not built yet. Stage B (full render, mix, SRT, thumbnail, caption, QC) waits for approval.

---

## 1. Three candidate structures

1. **One parent, ctrl-Z through the year.** A single row; the film keeps editing it (withdraw, rename the beneficiary) and undoing. Clean, but the brief's hook is *two* parents with the same deposit, and one row can't show "same input, different output" in a single look.
2. **Two sheets side by side that disagree.** Aisyah's sheet on the top half, Ali's on the bottom; one formula is fixed and they agree. Stacked sheets suit 9:16, but two shells crowd the frame, and the point is not that Ali's sheet is *wrong*: his relief really is zero.
3. **One sheet, two rows, two hidden columns (chosen).** Both parents are rows of the same table. The answer is on screen from frame one (RM2,000 vs RM0) and the columns that explain it are hidden. The film unhides them one at a time: *Withdrawn* (trap 1, a what-if then ctrl-Z) and *Beneficiary* (trap 2, the real reason Ali gets 0). Then the sheet works out what "doing it right" is worth per tax band, counts it as cells, and ends back on the two rows with every column open.

Why 3: the comparison is the hook and it is shown, not told; hidden columns are the medium's own way to say "the difference is hiding" (the brief's line); and the ending can bookend the opening with the explanation now visible in the same frame.

**Opening image:** a locked wide frame on the two rows, the two Saved cells already filled (lime RM2,000, red RM0) at frame 0.
**Ending:** the camera comes back up the sheet to the same two rows, now with Beneficiary (Child / Self) and Withdrawn (0 / 0) open, and an end-card merged cell typed under them.
**Score shape:** office-pop that starts as a half-time groove, cuts dead twice, thickens to four-on-the-floor with sixteenth mallets while the cells count up, opens into a held half-time breath on the deadline, and lands on one glockenspiel ding at the end card.

## 2. Logline and arc

*Same RM8,000, same sheet: two hidden columns are the whole difference between RM2,000 and RM0.*

- **Setup (hook, 0–6 s):** two rows, both deposited 8,000; Saved says 2,000 for Aisyah, 0 for Ali.
- **Turn (6–18.4 s):** the header letters skip (A, C, E…): two columns are hidden. Unhide *Withdrawn*: a what-if 3,000 turns red and Aisyah's relief and savings shrink; ctrl-Z. Unhide *Beneficiary*: Ali = "Self". The IF formula is typed out; his relief stays 0.
- **Climax (19–29 s):** "do it right": one formula, filled right across three tax bands, and the savings are counted as cells (1 cell = RM80, so 11, 19 and 25 cells). A banded colour scale sweeps out from the 2,000 cell.
- **Payoff and end (29–41 s):** a merged cell stages the deadline (31 DIS, then "pay by 25 Dis" if not at a counter); the sheet scrolls back to the two rows for the end card and footnote.

## 3. Benchmark

- **Bloomberg Quicktake / Vox-style one-number explainers:** learn the rule "one number per beat, the number is the hero", and how a vertical short holds a single comparison long enough to judge it.
- **Spreadsheet-made music videos and campaigns** (the style's own reference grammar): learn cells as pixels, the selected cell as the lead, a formula bar that "speaks".
- **Don't take:** any shot, graphic, colour, music, logo or interface. The shell is drawn generic: no product name, no green ribbon, no familiar grid font; the file is `SSPN_2026.xlsx`.

## 4. The sheet (one world, variable widths and heights)

| Col | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Width (world px) | 92 | 96, hidden → opens in beat 4 | 84 | 92, hidden → opens in beat 3 | 84 | 56 | 150 |
| Header (row 4) | Parent | Beneficiary | Deposited | Withdrawn | Relief | Band | Saved |
| Row 5 | Aisyah | Child | 8,000 | 0 | 8,000 | 25% | **RM2,000** (lime) |
| Row 6 | Ali | Self | 8,000 | 0 | 0 | 25% | **RM0** (red) |

- Row 2: merged title A2:G2 `SSPN 2026 · Jimat cukai / tax saved (RM)`. Rows 5–6 are tall (80 world px) so the Saved numbers can be the hero and the table fills about a third of the frame.
- Rows 8–11: empty until the end; then merged A8:G11 is the end card, A12:G13 the footnote.
- Rows 16–45: the band table. Row 16: merged title `Pelepasan RM8,000 × kadar cukai`. Row 44: `11%`, `19%`, `25%` in C, D, E; row 45: `=8000*C44` filled right → 880, 1,520, 2,000. Bars of cells grow up from row 43, one cell = RM80, so the bars are 11, 19 and 25 cells tall (the percentage *is* the cell count). Label merged F41:G42 `1 sel = RM80`.
- Rows 48–55: merged A48:G53 is the deadline stage (`31 DIS`), A54:G55 the counter line.
- Named ranges for the formulas: `Beneficiary` = B5:B6, `Deposited` = C5:C6, `Withdrawn` = D5:D6, `Relief` = E5:E6, `Band` = F5:F6.
- Formulas shown, one per beat: Saved `=Relief*Band` (beat 1, on G5), Relief `=IF(Beneficiary="Self",0,MIN(Deposited-Withdrawn,8000))` (beat 4, on E6), band table `=8000*C44` (beat 5).
- Every full-width shot uses the zoom that puts column G's right edge left of x = 918: 183 % (hook, 5 columns), 153 % (6 columns), 130 % (all 7). At 130 % data cells are 26 px and the Saved cells 36 px.

### Colour logic (five hues + ink and shell greys)

| Hue | Meaning |
|---|---|
| lime `#b8f25a` | full relief / full saving (rule: Saved = Deposited × Band); the 25 % bar |
| red `#e8382d` | a trap fired: Withdrawn > 0, Beneficiary = "Self", Relief = 0, Saved = 0 |
| amber `#ffb21f` | reduced (Saved below the full amount, e.g. the 1,250 what-if); the `Beneficiary` reference box |
| sky `#4fb3e8` | the `Deposited` reference box; the 11% / 19% bars |
| indigo `#2a2f6c` | the `Withdrawn` reference box |
| ink `#17120a` | the selected cell, text |
| shell `#dcdbd5` / `#f1f0eb` | the window |

The background colour scale (beat 5) is 7 bands radiating from the 2,000 cell (E45), lime to sky, light and dark steps alternating; it stays for the rest of the film below row 13, so the end frame (rows 1–13) is white where the two rows and the end card sit.

## 5. Shot list (1080 × 1920)

Safe areas: key numbers sit above the subtitle note (note top at y ≈ 1270), never in the right 140 px, never in the bottom 20 % (y > 1536). The shell (title bar, toolbar, formula bar, column letters, sheet tabs, status bar) never zooms.

| # | Time | Framing | Camera | On sheet | Why |
|---|---|---|---|---|---|
| 1 | 0.0–6.2 | wide, two rows, 5 visible columns | **locked** (183 %) | Saved cells already RM2,000 (lime) / RM0 (red) at frame 0. The selected cell hops C5 → C6 ("same RM8,000") then to G5 ("up to RM2,000"); the formula bar shows `=Relief*Band` | a judged comparison: hold it, let the viewer compare |
| 2 | 6.2–9.0 | close on the header row under the column letters | **whip to the headers** (fast push 183 % → 305 %, 0.45 s) | letters read A C E F G; double fold lines at A|C and C|E pulse; status bar "2 lajur tersembunyi · 2 hidden columns" | look at the structure, not the data |
| 3 | 9.0–14.8 | medium on rows 3–5, A..G | eases out as D opens (rides the reflow) | right-click → Unhide; D opens showing `#`, `##`, `0`. D5 selected, `3000` typed, Enter: D5 red, then E5 8,000 → 5,000, G5 → RM1,250 (amber). Status "Undo"; ctrl-Z: back to 0 / 8,000 / RM2,000 | a what-if is a spreadsheet's native move; ctrl-Z says "this isn't Aisyah's real problem" |
| 4 | 14.8–18.4 | medium, whole table, 7 columns | rides the reflow again (153 % → 130 %) | B opens: Child / **Self** (red). Select E6, the IF formula types out over two lines in the expanded formula bar, reference boxes amber / sky / indigo on B, C, D. Enter: E6 0 and G6 RM0 flash red | the clue is a structural fact (who the account is for) |
| 5 | 18.4–25.8 | full on the band table, rows 16–45 | **track down the sheet** (0.9 s), then slow push while counting, then a pull-out for the sweep | `11% 19% 25%` pasted; `=8000*C44` → 880; fill handle drags to D, E → 1,520, 2,000; each bar counts up as cells (status "Count: 11 / 19 / 25"); colour scale sweeps from the 2,000 cell | signature shot: a count drawn as cells. The tallest bar is literally the 25 % band |
| 6 | 25.8–34.3 | full on the merged stage, rows 48–55 | scroll down + **push into the merged cell** (78 % → 130 %) | A48:G53 merges and expands; `31 DIS` typed huge; under it `Bukan di kaunter? Bayar sebelum 25 Dis` typed smaller, "25 Dis" amber | a deadline is a verdict: one merged cell, nothing else |
| 7 | 34.3–39.8 | wide, rows 1–14, all 7 columns | **fast scroll back up** (pull out + up, 0.8 s) then locked | back on the two rows, now with Child/Self and 0/0 open. A8:G11 merges: `Nak versi BM penuh? Komen di bawah.`; A12:G14 footnote (3 lines, 31 px) | bookend: the same comparison as frame one, now explained |

Camera moves: locked, whip-push, reflow ride, push, track down, pull-out, scroll back (7). Signature shot: #5.

## 6. Timing table (final VO, measured)

Kokoro `am_onyx`, speed 0.92, unchanged. Every line passes the speech-to-text check (`asr_check.py`, 0 mismatches). Files: `tts/lines.json` (spoken text), `voices/v01–v07.wav`, `voices/dur.json` (lengths), `voices/words.json` (Whisper word timings). Gaps between lines ≥ 0.33 s; beat 3 gets an extra 1.3 s after its line so the what-if and ctrl-Z read; beat 5 opens with 3 s of music while the first two bars count, so "two thousand" lands on the 2,000 cell; beat 6 ends on a 2.4 s music-only hold on the deadline so the counter line is readable.

| # | Beat | VO id | Starts | Speech | Ends | Beat window | Spoken text (TTS spelling) |
|---|---|---|---|---|---|---|---|
| 1 | Hook | v01 | 0.15 | 5.58 s | 5.73 | 0.0–6.2 | Two parents. Same eight thousand ringgit saved. One saves up to two thousand ringgit in tax. |
| 2 | Curiosity | v02 | 6.35 | 2.43 s | 8.78 | 6.2–9.0 | The difference is hiding in two columns. |
| 3 | Trap 1 | v03 | 9.05 | 4.46 s | 13.51 | 9.0–14.8 | Trap one: withdraw in the same year, even your dividends, and your relief shrinks. |
| 4 | Trap 2 | v04 | 14.85 | 3.52 s | 18.37 | 14.8–18.4 | Trap two: an S S P N in your own name gets zero relief. |
| 5 | Climax | v05 | 21.40 | 4.27 s | 25.67 | 18.4–25.8 | Do it right, and you save up to two thousand ringgit, depending on your tax band. |
| 6 | Payoff | v06 | 26.00 | 6.62 s | 32.62 | 25.8–34.3 | The money must reach P T P T N by thirty-first December. Not paying at a counter? Pay by the twenty-fifth. |
| 7 | End | v07 | 35.20 | 2.73 s | 37.93 | 34.3–39.8 | Want a full B M version? Comment below. |

Total: **39.8 s** (target 36–42 s). The end card holds 1.9 s after the last word and 3.5 s after it is typed; the footnote is on screen from 35.55 s (4.2 s).

**Lines that run long at 0.92:** none now. The new v05 (4.27 s) is the shortest climax line; v06 (6.62 s) has two sentences, so it gets four subtitle cards. The BM subtitles are split into 1–4 single-line cards per line at phrase breaks (BM over its matching English phrase), timed from Whisper's word timestamps; the BM wording is the brief's (beat 5: the approved new line), only the break points are mine (section 9).

## 7. Beat sheet (second by second)

| t | Event |
|---|---|
| 0.00 | hook frame; G5 RM2,000 lime, G6 RM0 red already drawn; selection on C5 |
| 0.25 | soft Enter clack; the two Saved cells flash white once (0.12 s) |
| 1.10 | selection hops C5 → C6 ("same RM8,000") |
| 3.00 | selection hops to G5 ("one saves up to two thousand ringgit"); G5 pops 30 %; formula bar `=Relief*Band` |
| 6.10 | music cut (silence 0.25 s) |
| 6.35 | whip push to the header row; whoosh; letters A C E F G; fold lines pulse at 6.9 and 7.4 (two ticks) |
| 7.9 | status bar: "2 lajur tersembunyi · 2 hidden columns" |
| 9.20 | right-click at the C|E fold, menu pops, "Unhide" at 9.5 |
| 9.5–10.05 | D opens (ratchet per step): `#`, `##`, `0` |
| 10.5 | select D5 (tick) |
| 11.15–11.45 | type `3000` (key clicks) |
| 12.30 | Enter: D5 = 3,000, red fill flash; 12.42 E5 → 5,000 (flash); 12.55 G5 → RM1,250 amber (flash) |
| 14.55 | ctrl-Z (status "Buat asal · Undo"): D5 0, E5 8,000, G5 RM2,000 lime |
| 14.95 | right-click at the A|C fold → Unhide at 15.2; 15.2–15.75 B opens; B6 "Self" red flash at 15.6 |
| 15.72 | select E6; 15.78–17.38 the IF formula types (≈ 34 cps); reference boxes appear as each name completes |
| 16.95 | music cut (silence 0.5 s) |
| 17.45 | Enter: E6 0 red flash, 17.58 G6 RM0 red flash (thump) |
| 18.50–19.30 | track down to the band table (whoosh); four-on-the-floor starts |
| 19.35 | band title merges; 19.5–19.8 `11%  19%  25%` pasted into C44:E44 |
| 19.85–20.30 | `=8000*C44` typed into C45; reference box on C44 |
| 20.55 | Enter: 880; bar C counts 11 cells (20.65–21.05), status "Count: 11" |
| 21.00 | label `1 sel = RM80` merges |
| 21.25–21.55 | fill handle drag to D45: 1,520; bar D counts 19 cells (21.65–22.3) |
| 21.40 | v05 starts: "Do it right, and you save up to…" |
| 22.45–22.80 | fill handle drag to E45: 2,000 lands with "two thousand ringgit"; bar E counts 25 cells (22.9–23.76), ding on the last |
| 23.95–25.50 | colour-scale sweep from E45 under "depending on your tax band" (blip + xylophone per ring), camera pulls out to 78 % |
| 25.90–26.60 | scroll down to rows 48–55; A48:G53 selected, merges at 26.65 |
| 27.25–27.55 | type `31 DIS`; Enter 27.7 ("thirty-first December" at 28.3) |
| 29.55–30.85 | type `Bukan di kaunter? Bayar sebelum 25 Dis` into A54:G55 (with "Not paying at a counter?"); Enter 30.95 ("25 Dis" turns amber); held to 34.3 |
| 34.30–35.10 | scroll back up to rows 1–14 (whoosh) |
| 35.20 | A8:G11 merges; 35.4–36.25 `Nak versi BM penuh? Komen di bawah.` typed; Enter 36.35 |
| 35.55 | footnote fills A12:G14 (3 lines, 31 px), held to the end |
| 36.95 | glockenspiel ding; hold to 39.8 |

## 8. Cue map and sound

**Tempo 112 bpm** (beat 0.536 s, bar 2.143 s). The voice leads; picture hits snap to the nearest eighth note (0.268 s) where the voice allows, and the score is written from the same timeline (`TL` in `film.js`) in Stage B.

| Section | Time | Bars | Music state | Lands on the grid |
|---|---|---|---|---|
| Hook | 0–6.1 | 1–3 | half-time kit (kick on 1, rim on 3), electric bass roots, marimba stabs | the Saved flash at 0.25, the G5 hop at 3.0 |
| — cut 1 — | 6.1–6.35 | | silence (foley only) | first sound after: the whip whoosh |
| Curiosity | 6.35–9.0 | 4 | bass + closed hats only, a question figure on marimba | fold ticks on beats |
| Trap 1 | 9.0–14.8 | 5–7 | half-time groove back, sour piano stab on the red Enter (12.3), falling glockenspiel on ctrl-Z | Enter 12.3, ctrl-Z 14.55 |
| Trap 2 | 14.8–16.95 | 8 | thinner (bass + rim), key clicks carry the rhythm | |
| — cut 2 — | 16.95–17.45 | | silence while the last characters type | first sound after: the IF Enter thump |
| Climax | 17.45–25.8 | 9–12 | low chord on the IF Enter; 18.5–23.95 four-on-the-floor, sixteenth marimba, the counting blips rise in pitch with each cell; then half-time under the sweep (keeps "tax band" clear) with a xylophone arpeggio per colour-scale ring | Enter 20.55, drags 21.25 / 22.45, 2,000 at 22.8, sweep 23.95 |
| Payoff (breath) | 25.8–34.3 | 13–16 | half-time again, glockenspiel on 31 DIS and on the counter line | 31 DIS Enter 27.7, counter line 30.95 |
| End | 34.3–39.8 | 17–18 | kit drops out, home chord on the merge, mallets on Enter, glockenspiel ding at 36.95, tail to silence | end-card Enter 36.35 |

**Sound design table**

| Section | Bed | Main foley | Music |
|---|---|---|---|
| Hook | quiet room tone | Enter clack, two flash blips, two selection ticks | half-time groove |
| Curiosity | room tone | whoosh, two fold ticks, status-bar pop | hats + bass |
| Trap 1 | room tone | mouse click, menu pop, column ratchet, key clicks, Enter thump + error buzz (soft), ctrl-Z rewind tick | groove + piano stab |
| Trap 2 | room tone | menu pop, ratchet, ~55 key clicks, cut to silence, Enter thump + low error blip | thin → silence |
| Climax | room tone | key clicks, Enter, fill-handle drag rasp, 55 rising sine blips (one per cell), ding on the 25th, sweep blips per ring | four-on-the-floor |
| Payoff | room tone | merge pop, key clicks, big Enter | half-time breath |
| End | room tone | whoosh, merge pop, key clicks, Enter, final ding | resolves to silence |

Mix: voice compressed and ~10 dB over the music by RMS, music carved 300 Hz–4 kHz under speech, mixed for phone speakers (low end high-passed at 90 Hz, bass with 2nd/3rd harmonics), −14 LUFS, true peak ≤ −1 dBTP. Two real silences (6.1, 16.95), two sound transitions (the whoosh at 6.35 J-cuts the header shot; the ding at 23.76 rings over the sweep). Instruments are sampled (see CREDITS).

## 9. Subtitle and title design

- **Cell comment note**: pale yellow note (`#fff8c4`), 2 px ink border, red corner triangle, docked lower left at x 80, top y 1290, width ≤ 860 (so the note ends before the right 140 px) and bottom above y 1536. Inter Bold 37 px BM line on top, Inter Medium 25 px English line under it (37 px is the largest size at which the longest card, 1a at 787 px, fits the note); one line each, never wrapped. The camera frames the subject above it.
- **Cards** (BM text from the brief, split at phrase breaks; timed from Whisper word starts; each full line ≥ max(1.8 s, speech + 0.6 s); the shortest card is 3a, "Perangkap pertama: keluarkan wang", at 1.0 s):

| Line | Card | BM (top) | English (under) |
|---|---|---|---|
| 1 | a | Dua ibu bapa. Simpan RM8,000 yang sama. | Two parents. Same RM8,000 saved. |
| | b | Seorang jimat cukai sehingga RM2,000. | One saves up to RM2,000 in tax. |
| 2 | – | Bezanya tersembunyi dalam dua lajur. | The difference is hiding in two columns. |
| 3 | a | Perangkap pertama: keluarkan wang | Trap one: withdraw |
| | b | pada tahun yang sama, termasuk dividen, | in the same year, even your dividends, |
| | c | pelepasan anda berkurang. | and your relief shrinks. |
| 4 | a | Perangkap kedua: SSPN atas nama sendiri, | Trap two: an SSPN in your own name |
| | b | pelepasan sifar. | gets zero relief. |
| 5 | a | Buat dengan betul, jimat sehingga | Do it right, and you save up to |
| | b | RM2,000, ikut kadar cukai anda. | RM2,000, depending on your tax band. |
| 6 | a | Wang mesti sampai ke PTPTN | The money must reach PTPTN |
| | b | sebelum 31 Disember. | by 31 December. |
| | c | Bukan di kaunter? | Not paying at a counter? |
| | d | Bayar sebelum 25 Disember. | Pay by the 25th. |
| 7 | – | Nak versi BM penuh? Komen di bawah. | Want a full BM version? Comment below. |

- **Formula bar**: Inter SemiBold 33 px fixed (the film's line), referenced names coloured to match their reference boxes; it expands to two lines for the IF formula (a line break after `0,`), as a real expanded formula bar does.
- **Sheet type**: cell values 11 × zoom (not drawn below 6.5 px), merged labels 14–26 × zoom, results 26–32 × zoom and popping 30 % on Enter. Every number the voice uses is ≥ 26 px on screen when it is spoken (smallest: the 0s in the 130 % shots, 26 px).
- **Footnote:** 3 lines, Inter SemiBold 31 px at the end zoom, in A12:G14, from 35.55 s to the end (4.2 s).
- **Thumbnail:** the two Saved cells huge, RM2,000 lime vs RM0 red, a merged cell `SSPN · sebelum 31 Dis`, all text inside the centre 1080 × 1440.

## 10. Open points

1. **Sources not re-read.** The source sites could not be reached from the build machine (see FACTS.md); the film states only the brief's claims.
2. **"1 sel = RM80"** makes the bar heights equal the band percentages (11, 19, 25 cells). It's arithmetic, not a claim.

## 11. Not the demo again (checked after reading the style's DEMO.md)

| | Style demo | This film | Differs? |
|---|---|---|---|
| Structure | a paradox revealed by a pivot (data → clue → regroup → name) | answer first, then two traps unhidden one by one, then "do it right" per band | yes |
| Opening | formula typed in a result cell, pull-out | locked wide frame with both answers already filled at frame 0 | yes |
| Signature shot | 700 cells hopping into a pivot | one formula filled right; three bars counted as cells (1 cell = RM80) | yes |
| Camera path | push → far pull-out → whip → farthest pull-out → land | locked → whip → two reflow rides → track down → pull-out → push into a merged cell → scroll back to the top | yes |
| Score shape | builds to a colour-scale flood finale | two dead cuts, the peak in the middle (counting), a half-time breath on the deadline, a single ding | yes |
| Ending | colour scale floods the sheet; title end card far below | bookend: back on the two rows from frame one, now explained; end card typed under them | yes |

Shared on purpose (the brief asks for them): hidden columns as the clue, a colour-scale sweep (mid-film here, not the finale), merged cells as stages.

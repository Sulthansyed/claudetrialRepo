# Ringgit, Explained: "RM2,000 or RM0?" (SSPN)

Use the **lemo-opuscar** skill, style **Spreadsheet** (`styles/spreadsheet`). Work in `sspn-ringgit/`. You may reuse helpers from `prs-ringgit/` (voice, mix, SRT tools), but not its look.

**Work in two stages and stop after Stage A.**

---

## Channel rules (same as the PRS episode)
- 1080 × 1920, 30 fps, H.264 + AAC, −14 LUFS, true peak ≤ −1 dBTP
- Voice: Kokoro `am_onyx`, speed **0.92**, English, mixed for phone speakers
- Subtitles as the style's **cell comment** note: **BM line large on top, English line small under it**, never wrapped
- Keep key numbers above the subtitle note and out of the right ~140 px and the bottom 20%
- No bank, PTPTN, LHDN or spreadsheet-software logos or brand colours. The shell is generic; the file name is `SSPN_2026.xlsx`.

## The idea
One spreadsheet, two parents. Both deposited RM8,000 into SSPN this year. Aisyah's tax-saved cell says **RM2,000**; Ali's says **RM0**. The film is the spreadsheet working out why.

## Sheet data
| Parent | Beneficiary (hidden at first) | Deposited | Withdrawn (hidden at first) | Relief | Band | Saved |
|---|---|---|---|---|---|---|
| Aisyah | Child | 8,000 | 0 | 8,000 | 25% | 2,000 |
| Ali | Self | 8,000 | 0 | 0 | 25% | 0 |

Formulas (real syntax, one per beat):
- Relief: `=IF(Beneficiary="Self",0,MIN(Deposited-Withdrawn,8000))`
- Saved: `=Relief*Band`

## Script (voice-led timing, target 36–42 s)
| # | Beat | Voice (EN) | Subtitle BM (top, large) | On sheet |
|---|---|---|---|---|
| 1 | Hook | "Two parents. Same RM8,000 saved. One saves up to RM2,000 in tax." | Dua ibu bapa. Simpan RM8,000 yang sama. Seorang jimat cukai sehingga RM2,000. | **First frame already shows both Saved cells: RM2,000 (lime) vs RM0 (red), visible by 0.5 s.** Locked wide frame on the two rows. |
| 2 | Curiosity | "The difference is hiding in two columns." | Bezanya tersembunyi dalam dua lajur. | Whip to the headers: letters skip, a double line marks the fold. |
| 3 | Conflict: trap 1 | "Trap one: withdraw in the same year, even your dividends, and your relief shrinks." | Perangkap pertama: keluarkan wang pada tahun yang sama, termasuk dividen, pelepasan anda berkurang. | Unhide **Withdrawn**. What-if: type 3,000 into Aisyah's Withdrawn cell, which flashes red; Relief drops to 5,000 and Saved to 1,250. Then Ctrl-Z back to 0. |
| 4 | Conflict: trap 2 | "Trap two: an SSPN in your own name gets zero relief." | Perangkap kedua: SSPN atas nama sendiri, pelepasan sifar. | Unhide **Beneficiary**: Ali = "Self". Type the IF formula; Ali's Relief and Saved stay 0 (red). |
| 5 | Climax | "Do it right, and RM8,000 of relief saves RM880, RM1,520 or RM2,000, depending on your tax band." | Buat dengan betul: pelepasan RM8,000 jimat RM880, RM1,520 atau RM2,000, ikut kadar cukai anda. | A small band table builds as cells: 11% → 880, 19% → 1,520, 25% → 2,000 (*count drawn as cells*), then a colour-scale sweep from the 2,000 cell. |
| 6 | Payoff | "The money must reach PTPTN by 31 December. Not paying at a counter? Pay by the 25th." | Wang mesti sampai ke PTPTN sebelum 31 Disember. Bukan di kaunter? Bayar sebelum 25 Disember. | Merged cell as stage: **31 DIS**, then a smaller "Bukan di kaunter? Bayar sebelum 25 Dis". |
| 7 | End | "Want a full BM version? Comment below." | Nak versi BM penuh? Komen di bawah. | End-card merged cell, plus a footnote cell: "Untuk YA 2026 · Jimat bergantung pada kadar cukai · Bukan nasihat kewangan / Not financial advice" |

Tell me if any line runs too long at speed 0.92. Don't speed the voice up.

## Facts (write `FACTS.md` with these sources; don't add claims beyond them)
| Claim | Source |
|---|---|
| SSPN relief up to RM8,000 on **net** deposits (deposits minus withdrawals in the year) | LHDN tax reliefs page: https://www.hasil.gov.my/en/individu/pelepasan-cukai/ · RinggitPlus: https://ringgitplus.com/en/blog/tax/how-much-tax-you-save-with-sspn-and-prs.html |
| Withdrawing dividends also counts as a withdrawal | TechARP: https://www.techarp.com/money/sspn-withdrawal-trap-wipes-out-tax-relief/ |
| Self as beneficiary gets no relief | RinggitPlus (above), citing PTPTN |
| Deposit must reach PTPTN by 31 Dec; outside a counter, pay by 25 Dec | RinggitPlus (above) |
| YA 2026 bands: 50,001–70,000 at 11%, 70,001–100,000 at 19%, 100,001–400,000 at 25% | PwC Malaysian Tax Booklet 2026/2027: https://www.pwc.com/my/en/publications/mtb/personal-income-tax.html |
| 8,000 × 11% / 19% / 25% = 880 / 1,520 / 2,000 | Arithmetic |

**Do not claim** anything about whether both parents can each claim RM8,000 (the sources disagree).

## Stage A: stop here for approval
1. `TREATMENT.md` and `storyboard.jpg` (one panel per beat)
2. Scratch VO with measured line lengths, and a timing table
3. 3 preview frames at 1080 × 1920: beat 1 (0.5 s), beat 3 (the red Withdrawn cell) and beat 5 (the band table)
4. `FACTS.md`

Commit and **stop**.

## Stage B: after I approve
- Full render `rm2000-or-rm0.mp4`, `subtitles_bm_en.srt`, `thumbnail.png` (spreadsheet cells, **RM2,000 vs RM0** big, "SSPN · sebelum 31 Dis"; all text inside the centre 1080 × 1440), and `caption.txt`:
  ```
  RM2,000 or RM0? Same RM8,000, different account 👀 Nak versi BM penuh? Komen! #RinggitExplained #SSPN #CukaiPendapatan #TaxRelief
  ```
- A QC report: duration, loudness, subtitle check, and the first frame showing both numbers.

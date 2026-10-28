# Gospel of Luke (1833): chapter-by-chapter verification ledger

**State:** 28 October 2026. The 1833 print is public domain. This is a **numbering and OCR-structure verification ledger**, *not* a fully proofread Nahuatl transcription or approved machine-translation dataset.

Reference scan: [1833 original (152-page PDF)](https://commons.wikimedia.org/wiki/File:Yacuic_iyec_tenonotzaltzin_in_Jesu-Christo,_quenami_oquimo_ihcuilhuili_in_San_Lucas.pdf). Machine-readable [chapter audit](luke_1833_chapter_audit.json). [Page-checked numeral correction details](luke_1833_facsimile_number_checks.json). Verse count independent reference: [Luke 24 chapters, 1,151 verses](https://www.mobile.catholic-resources.org/Bible/NT-Statistics-Greek.htm).

**Summary:** 24/24 OCR chapter boundaries located, 3/24 chapters' verse **numerals** checked against the original page images, 51 verse-marker positions pending structural review, 0 entire chapters of Nahuatl **wording** proofread.

| Chapter | Expected verses | Printed numerals checked | OCR numbers 2–last seen | Unresolved verse markers | Original PDF pages checked |
|---|---:|---|---:|---:|---|
| 1 | 80 | Yes (numbering only) | 79 | 0 | 9–17 |
| 2 | 52 | Yes (numbering only) | 51 | 0 | 18–23 |
| 3 | 38 | Yes (numbering only) | 37 | 0 | 24–28 |
| 4 | 44 | No | 42 | 1 | — |
| 5 | 39 | No | 36 | 2 | — |
| 6 | 49 | No | 43 | 5 | — |
| 7 | 50 | No | 46 | 3 | — |
| 8 | 56 | No | 55 | 0 | — |
| 9 | 62 | No | 57 | 4 | — |
| 10 | 42 | No | 38 | 3 | — |
| 11 | 54 | No | 46 | 7 | — |
| 12 | 59 | No | 53 | 5 | — |
| 13 | 35 | No | 29 | 5 | — |
| 14 | 35 | No | 33 | 1 | — |
| 15 | 32 | No | 29 | 2 | — |
| 16 | 31 | No | 30 | 0 | — |
| 17 | 37 | No | 33 | 3 | — |
| 18 | 43 | No | 40 | 2 | — |
| 19 | 48 | No | 46 | 1 | — |
| 20 | 47 | No | 44 | 2 | — |
| 21 | 38 | No | 36 | 1 | — |
| 22 | 71 | No | 67 | 3 | — |
| 23 | 56 | No | 54 | 1 | — |
| 24 | 53 | No | 52 | 0 | — |

## Actual image-verified work

- **Chapter 1:** Original PDF pages 9–17, printed pages 1–9. The printed verse numerals run 1–80. OCR corrections: 1:13 (`1 3`), 1:31 (`131`), 1:38 (`.38`), 1:57 (`51`), 1:67 (`61`). Tokens starting with a one-letter word are now accepted by the structural checker, which fixed the false flags for 1:54 and 1:56.
- **Chapter 2:** Original PDF pages 18–23, printed pages 10–15. The printed verse numerals run 1–52. OCR corrections: 2:11 (`1 1`) and 2:28 (punctuation before the numeral).
- **Chapter 3:** Original PDF pages 24–28, printed pages 16–20 (last page starts chapter 4). The printed verse numerals run 1–38. OCR correction: 3:7 (stray punctuation before numeral).

All eight corrections are restricted to **verse numerals** and recorded in a reproducible, fail-closed script [apply_luke1833_verified_numbers.py](../../tools/apply_luke1833_verified_numbers.py). The original scan is authoritative and remains unchanged; the working OCR is an explicitly unreviewed derivative.

## Work remaining

Chapters 4–24 have had their **OCR chapter boundaries and likely verse markers** machine checked, but their complete original-page verse-number sequences have **not** been visually verified. Missing OCR markers do not establish missing verses from the historical book. Five headings show OCR damage, and OCR can drop, join, or repeat digits. Page-number and running-header interruptions cause false candidates.

We must also perform **line-by-line image-to-OCR proofreading of all 24 chapters** and independent philological review of morphology, spelling, and interpretation. Numeral verification is not wording verification; none of these chapters is yet a translation-training-approved aligned dataset.

## How to continue accurately

Use [Tlahtōlli](https://niftybacon.github.io/tlahtolli/) → Translator → San Lucas 1833 → **Chapter-by-chapter verification checklist**. Chapter details show missing marker candidates, damaged headings, review priority and which original PDF pages have been checked. For spelling and word-boundary work, use **Load correction and verse review queue**, compare with the original page image, and export local decisions.

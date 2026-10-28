# Manuscript review desk — development sources, not gold translations

This directory begins our own accountable, non-expert engagement with source-era Nahuatl. **We can read and learn without pretending we are peer-reviewed specialists.** A source page is not a training pair, and an AI-generated interpretation is not a scholarly translation.

## First selected manuscript (2026-10-28)

[ENL_BC16_1573.json](ENL_BC16_1573.json) records the **1573 Coyoacán-region land sale**. The manuscript's physical location is **AGN, Tierras 1735, expediente 2, folio 122**; the Early Nahuatl Library identifies it as `BC16a000`.

- [View original facsimile](https://enl.wired-humanities.org/sites/default/files/mapaImages/BC16a000.png)
- [Read archival catalogue and transcription/translation attribution](https://enl.wired-humanities.org/bc16/elements/bc16a/000)
- [Document metadata and context](https://enl.wired-humanities.org/bc16)

**Readability status (checked again):** The Early Nahuatl Library image can be opened via its original image URL, but the accessible raster is not legible enough to establish letter forms reliably. No independently verified higher-resolution scan was found during this check. Enlargement or AI upscaling cannot restore missing strokes. The main Translator tab now includes a **Read a 1573 Nahuatl manuscript · printed-text aid** panel: it loads only this source-review record's three-unit excerpt, links to the external archival facsimile and published transcription, shows unresolved annotations, and sends optional evidence-only investigations to the normal translator. It deliberately does not redistribute the full published transcription or translation.

**What has actually happened:** The manuscript image was opened and visually inspected. The *web raster* is small. A three-part excerpt (`ticnamaca y¯ totlal`) was located with **assistance from the published analytic transcription**. Neither the complete manuscript nor the excerpt was independently collated letter by letter. The **meaning is not asserted**. The abbreviated `y¯` must stay ambiguous; do not auto-expand or silently add macrons.

**Contamination and permissions:** The English translation by James Lockhart was consulted while identifying the document. Therefore **BC16 is permanently excluded from our planned blind evaluation** unless a genuinely independent evaluation protocol is devised by someone not exposed to the answer. The physical sixteenth-century original, the modern photograph, editorial transcript, and English translation are **distinct reuse-rights objects**. Image, transcription and translation permissions are not established by their public URLs. No modern translation has been copied into this source file or `pairs.csv`.

## How to continue without an academic supervisor

1. Open the facsimile at its highest available resolution and save **page and line coordinates**, not just copied modern text.
2. Select 2–6 readable words, transcribe **each glyph** before comparing a printed edition, and keep unreadable letters marked as such. Do not infer the written text from how a familiar Nahuatl word *should* look.
3. Preserve the first-pass reading separately from the later editorial comparison; record every correction and its reason. If the image is too small to distinguish letters, report **not independently verified** rather than guess.
4. Only then consult dictionary entries to propose **possible** morphology or meanings; distinguish subject/object markers, plural endings, and contracted spellings from independently attested analysis.
5. Make every result auditable: original image URL, folio, date, region, uncertainty, reviewer identity, evidence for each claim, and unresolved alternatives. The person reviewing the model's proposed answer should not be the same model treated as an independent expert.
6. When ready for a **genuinely unseen benchmark**, pick a separate complete manuscript not used by Tlahtōlli's previews or development investigations, freeze its ID, and keep its translation out of the answer-generation process. An accountable human check is still necessary for claims about translation correctness.

**Our current honest ceiling:** facsimile located and viewed; editorial-assisted snippet; machine lookup diagnostic; **zero validated alignments, zero independently graded translations, no scholar sign-off**. That is a legitimate first manuscript exercise, not a score.

Technical gate: `node tools/evaluate_translation_readiness.js` and `node tools/test_translation_readiness.js` refuse a test split containing `ENL-BC16-1573` and ensure the manuscript remains a development-only reference. 

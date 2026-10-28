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

## Personal parallel-text reading workspace

The Translator tab also includes **Parallel Nahuatl reading desk · your own pasted source text**. This is the practical way to read ENL's two text columns without copying a whole published transcription or Lockhart's English translation into our public repository. Open the [ENL transcription and translation page](https://enl.wired-humanities.org/bc16/elements/bc16a/000), copy the passages **you personally wish to examine**, and paste them into the two fields in your browser.

1. Manually insert line breaks to identify small phrases or passages. The printed transcription contains abbreviations and punctuation, so an automatic sentence splitter would introduce false alignment.
2. Click **Prepare numbered reading lines**. The tool only numbers your lines; it never guesses which translations correspond.
3. Select a Nahuatl line and an English line, record a note about missing subjects, editorial paraphrase or ambiguity, and click **Add selected manual pairing**.
4. Click **Inspect selected Nahuatl phrase** for the existing source-linked dictionary/morphology proposals. The source English line is not used as a generated or verified answer.
5. **Export personal reading notes** as a JSON file and **Import saved personal reading** later. Data lives in the open browser page and only goes to your disk when you export; it is not silently synced to Tlahtōlli or submitted to any model. Without an export, reload discards the text and annotations.

The exported record is always `personal_unverified`; it carries `train_eligible:false`, `evaluation_eligible:false`, `alignment_verified:false`, and `published_translation_rights:not_verified`. It is **not** a `pairs.csv` record. A later learner cannot import a modified file that promotes those review flags. These safeguards do not adjudicate fair use, licensing, scholarly correctness, or permission to redistribute the published translation: review those separately before distributing personal exports.

## Verified-against-sources morphology, still not facsimile-verified

A source-by-source audit now documents **`ti-c-namaca | y¯ (probably yn / in) | to-tlal`**. See [the full claim/evidence ledger](../../../docs/ENL_1573_SOURCE_CROSSCHECKED_MORPHOLOGY.md), with Molina, Karttunen, Horn–Lockhart, grammar tables and a **separate 1563 `totlal` attestation** from UNAM. This is stronger than the earlier speculative reading: independently located lexical and grammatical references corroborate the morpheme functions. However, the initial `ti-` still has a real 1pl/2sg orthographic ambiguity, the source lacks an overt plural `-h`, and the `y¯` expansion is not independently read from the original glyphs. The quoted manuscript sample remains editorial-assistance-only.

The reading desk exposes six independently cited morpheme claims, their uncertainty and sources. The underlying data and browser checks **do not** treat them as a certified English translation, independent hidden evaluation, or licensed model-training material.

## How to continue without an academic supervisor

1. Open the facsimile at its highest available resolution and save **page and line coordinates**, not just copied modern text.
2. Select 2–6 readable words, transcribe **each glyph** before comparing a printed edition, and keep unreadable letters marked as such. Do not infer the written text from how a familiar Nahuatl word *should* look.
3. Preserve the first-pass reading separately from the later editorial comparison; record every correction and its reason. If the image is too small to distinguish letters, report **not independently verified** rather than guess.
4. Only then consult dictionary entries to propose **possible** morphology or meanings; distinguish subject/object markers, plural endings, and contracted spellings from independently attested analysis.
5. Make every result auditable: original image URL, folio, date, region, uncertainty, reviewer identity, evidence for each claim, and unresolved alternatives. The person reviewing the model's proposed answer should not be the same model treated as an independent expert.
6. When ready for a **genuinely unseen benchmark**, pick a separate complete manuscript not used by Tlahtōlli's previews or development investigations, freeze its ID, and keep its translation out of the answer-generation process. An accountable human check is still necessary for claims about translation correctness.

**Our current honest ceiling:** facsimile located and viewed; editorial-assisted snippet; machine lookup diagnostic; **zero validated alignments, zero independently graded translations, no scholar sign-off**. That is a legitimate first manuscript exercise, not a score.

Technical gate: `node tools/evaluate_translation_readiness.js` and `node tools/test_translation_readiness.js` refuse a test split containing `ENL-BC16-1573` and ensure the manuscript remains a development-only reference. 

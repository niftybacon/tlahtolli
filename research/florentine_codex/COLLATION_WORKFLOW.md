# Florentine Codex: two-pass diplomatic line collation

**State:** experimental research workspace; **zero certified lines**. This process does **not** authorize calling an AI-generated reading an attested manuscript transcription. The public web app keeps draft readings in the browser and exports a JSON backup; the drafts are never merged automatically into `close_reading.json` or the model training pairs.

## Procedure for each physical handwritten line

1. Open the cited folio (Book XI, 62r or 209v) in the original manuscript. Retain original line breaks, abbreviations, glyph uncertainty, and source-image links. Prefer the public-domain manuscript scans, not bulk republication of modern editorial transcription or translations.
2. **Reader A** independently transcribes each physical line without looking at Reader B or an automatic reconstruction. Provide a reproducible image region or coordinate locator; write uncertainty with a consistent editorial notation and explain doubtful glyphs.
3. **Reader B** separately reads the same image. Do not show A's text to B before entry. Distinct typed names in the interface are self-reported, not proof of two real or qualified human reviewers.
4. Compare the two strings literally. Tlahtōlli performs only NFC Unicode normalization for equivalence; it **does not** fold accents, modernize spelling, join words across lines, or alter punctuation. Disagreement is not resolved by majority vote or dictionary frequency.
5. Document differences in the disagreement field. An independent adjudicator must consult the primary image (ideally at higher resolution) and record their own notes before any editorial text is accepted.
6. Only then consider a separate **reading text** with proposed rejoined words, orthographic normalization, lemma identification, morphology, and contextual interpretation. Every join or other alteration must map back to a source line and remain reversible.
7. A linguistically qualified reviewer should consider alternative morphological analyses and the surrounding text, not just dictionary matches. Credit Nahua authors and scribes, the edition, reviewers, and contributors accurately. Independent linguistic/community review has **not** occurred for this dataset.
8. Rights and source-specific permissions must be separately checked for modern edited transcriptions and translations. No public redistribution or neural model training without an explicitly approved, independently reviewed dataset and document-separated evaluation.

## Tool behavior and limitations

Open [Tlahtōlli](https://niftybacon.github.io/tlahtolli/) → **Translator** → **Manuscript collation · Two independent readings**. It initializes five *candidate* image regions from `folio_visual_collation.json`, **not** from fabricated manuscript lines. The editor stores separate raw strings and uncertainty notes in browser local storage. A missing second pass, coincident reviewer names, missing exact line/crop locator, and conflicting readings are visibly flagged.

An exact textual match is reported as **two strings agreeing, not a verified original reading**. Exports always contain `gold_standard:false`, `facsimile_certified:false`, `grammar_certified:false`, `translation_certified:false`, and `train_eligible:false`. There is intentionally no button to promote local drafts into training material.

The dated GitHub Actions workflow `.github/workflows/codex-evidence-daily.yml` automatically checks data integrity once daily (13:23 UTC, subject to GitHub scheduling delays) and reports failures. It is **not** a research agent: it cannot read new manuscript pages, resolve ambiguity, contact speakers, or independently improve translations. A passing workflow means software checks passed, not that an expert verified any manuscript.

## Current baseline

- 12 books: rough aggregate written-form analysis, **not line transcriptions**.
- 2 manuscript folios: prior limited visual inspection, 5 bounded observations.
- 6 short excerpt candidates with lexical notes; the exact manuscript transcription is unresolved.
- 0 independently certified physical lines; 0 approved training pairs; 0 neural translation models fitted.

Progress must remain visible using these denominators. Never inflate verified work by counting words, snippets, dictionary matches, or OCR tokens as certified lines.

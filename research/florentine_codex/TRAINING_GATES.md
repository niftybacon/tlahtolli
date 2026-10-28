# Florentine Codex review-to-training gates (2026-10-28)

## Present state

- All twelve books have **aggregate orthographic counts** at [analysis.json](analysis.json). These counts do not supply sentence pairs, accurate word segmentation, or machine-translation training labels.
- Three **candidate fragments** are in [research_examples.json](../translation_corpus/research_examples.json). Their correspondence, transcription/editorial rights, and grammatical interpretations have not been approved.
- The Translator tab's **Corpus integrity and Florentine Codex review** section loads these fragments, preserves original versus normalized readings separately, records morphological hypotheses and interpretation, and lets a reviewer export local annotations.
- **No model has been fitted or fine-tuned on the Codex**. No passage is marked train-eligible simply because it appears in the manuscript, on Getty, or in a Zenodo deposit.

## Public-domain facsimiles located (2026-10-28)

Wikimedia Commons hosts scans of **all 12 books** (original 1577 manuscript) from the Library of Congress / former World Digital Library collection, each labeled **Public Domain Mark 1.0** and free of known copyright restrictions in the United States:

- [Volume I — Books 1–5](https://commons.wikimedia.org/wiki/File:C%C3%B3dice_Florentino,_Vol._1.pdf)
- [Volume II — Books 6–9](https://commons.wikimedia.org/wiki/File:C%C3%B3dice_Florentino,_Vol._II.pdf)
- [Volume III — Books 10–12](https://commons.wikimedia.org/wiki/File:C%C3%B3dice_Florentino,_Vol._III.pdf)

This is the preferred evidence source for an **independent transcription**. The manuscript text is public domain; however, Getty's separately produced digital images are marked CC BY-NC-ND 4.0, and University of Utah Press's edited transcription and English rendering remain rights-reserved. Do not conflate their licenses. Commons' status is a source claim, not individualized legal advice.

The Getty Digital Florentine Codex also makes its new **Spanish-to-English translation of the Spanish column for Books 1–11** and **Nahuatl-to-Spanish translation for Book 12** available as **CC BY 4.0**. Attribution is required and these cannot be assumed word-aligned Nahuatl→English equivalents. [Getty permission matrix](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions).

Early bilingual reference with its own public-domain status: [Daniel Brinton, *Rig Veda Americanus* (1890)](https://www.gutenberg.org/ebooks/14993), containing Nahuatl hymns and interpretative English paraphrases. **This derives from Sahagún's earlier hymn manuscripts, not a verified complete Florentine Codex bilingual text;** treat as a separate historical corpus and manually verify correspondences.

## Source and rights checks

- Historical original: *Florentine Codex*, Ms. Mediceo Palatino 218–220, Biblioteca Medicea Laurenziana, completed 1577. [Getty Digital Florentine Codex](https://florentinecodex.getty.edu/).
- Getty's Anderson–Dibble edited Nahuatl transcription and Nahuatl-to-English translation are identified as **all rights reserved** by the University of Utah Press: https://florentinecodex.getty.edu/about/3_Citations_and_Permissions. They must not be bulk-copied into this repository or casually designated as training material.
- Valery A. Berthoud F.'s deposited transcription: DOI https://doi.org/10.5281/zenodo.7213020. The current scan uses derived aggregate statistics only. Confirm the **record-specific** license and provenance before reproducing its edited transcription, and check editorial word boundaries against the manuscript. The Zenodo descriptive metadata's “Central Huasteca Nahuatl” label should not be used as an unexamined classification of the sixteenth-century source.
- Original manuscript facsimile, scholarly editorial transcription, and modern English translation have **different reuse rights**. The fact that one is accessible does not authorize the others.

## Required training record

Each example needs: source ID and exact book/folio/line; independently checked manuscript transcription; normalized orthography (separate from original); word segmentation; morphology with alternative parses; dated region/variety; English translation and translator credit; transcription reuse permission and its evidence; translation reuse permission and its evidence; named actual reviewer; and a reviewed alignment explaining omissions and reordering.

Review stages: candidate → facsimile checked → linguistic review → rights-cleared alignment → human approval. Merely selecting “linguistically reviewed” in a local browser does not automatically satisfy rights or train the model. Any edit to a reviewed text should reset the verification stage. Approval for **public redistribution** and **model training** must be checked separately.

## Suggested next work

1. Manually verify 20–30 short passages in **Book 11**, then collect genre contrast from **Book 6** (rhetoric) and **Book 12** (narrative). Do not treat the Spanish column as a literal word-for-word translation of Nahuatl.
2. Resolve original written lines split by layout; flag ambiguous compounds; add expert validation of verb morphology.
3. Secure permission or produce an independently transcribed, lawfully reusable text and independently authored paired glosses. Do not automatically ingest Getty's rights-reserved editions.
4. Produce a small approved dataset and **hold out whole books or chapters / folio clusters** to prevent near-duplicate leakage. Report results on unseen passages and unknown words.
5. With a sufficiently large dataset, benchmark a constrained, citation-based lookup/morphological parser against a supervised model. Report translation accuracy separately from word-form recall.

## Technical validation

Use the existing `tools/validate_translation_corpus.py` for schema/provenance checks and `tools/test_translator.js` for regression checks. The [source intake and pair template](../translation_corpus/README.md) remains the authoritative route to future training approval. The new in-browser review export contains `train_eligible: false` by design; it is **not** an approval bypass.

# Florentine Codex review-to-training gates (2026-10-28)

> **Policy refinement — experimental neural monolingual learning (2026-10-29).**
> The older gates below govern **approved bilingual translation pairs, independently
> validated grammar claims, and publication**. They are **not** a per-token
> verification requirement for the new `neural/` manuscript-text denoising
> laboratory. Under [the separate experimental intake policy](../neural_training/README.md),
> a traceable Classical-period historical transcription can train a **monolingual**
> model even if its segmentation, morphological interpretation or English
> translation has not been individually reviewed. The historical work ID,
> source URL, original spelling, variety tag, date and **transcription-specific
> reuse rights** remain required. In particular, the original manuscript's
> public-domain status does not automatically grant permission for the modern
> Berthoud transcription or Anderson–Dibble editions. Weak aligned English
> may train with explicit rights, source URL and reduced weight, but it never
> becomes verified gold or a source-authoritative morphological claim.
> **No Florentine Codex text has been trained into a checkpoint in this PR.**
> All legacy research, canonical morphotactics and independent-test
> exclusion rules remain in force.


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

## Morphology and normalization methodology from peer-reviewed research

Francis M. Tyers, Robert Pugh, and Valery A. Berthoud F., "[Codex to corpus](https://aclanthology.org/2023.americasnlp-1.4/)," *AmericasNLP* (2023), reported a partially annotated Florentine Codex corpus using Universal Dependencies-inspired annotation. They treated **retokenization** (repairing spaces/line endings) and **historical orthography normalization** as separate tasks, preserving the original source string. Their experiments used Books 1 and 8 for training, Book 5 for held-out evaluation; the orthographic normalizer achieved **87% exact normalized-word accuracy** with a standalone neural model in that setup, while their dictionary-assisted variant improved its word error rate to **8.3%**. **These are the paper's reported results; they are not Tlahtōlli's measured accuracy.**

Implementation consequences:

1. Prefer reversible character-boundary actions to unconstrained text generation: a proposed merge/split must point to the original source character offsets, and characters must never be invented when changing word boundaries.
2. Maintain separate immutable source transcription, tokenized reading, normalized orthography, lemma, part of speech, inflectional features and English interpretation.
3. Preserve and independently review morpheme roles (relational nouns, incorporation, subject/object marking, compounding) and do not infer meaning solely from string similarity.
4. Use document/book-level holdouts for normalization evaluation, not same-folio random train/test sentences.
5. If later integrating the published corpus, identify its **actual release location and unambiguous license**. The research article's promise of openness is not itself a permission statement for training on a particular file.
6. All automated normalizations remain *suggestions* until checked against manuscript readings; language variety and orthographic period are explicit.

## Suggested next work

1. Manually verify 20–30 short passages in **Book 11**, then collect genre contrast from **Book 6** (rhetoric) and **Book 12** (narrative). Do not treat the Spanish column as a literal word-for-word translation of Nahuatl.
2. Resolve original written lines split by layout; flag ambiguous compounds; add expert validation of verb morphology.
3. Secure permission or produce an independently transcribed, lawfully reusable text and independently authored paired glosses. Do not automatically ingest Getty's rights-reserved editions.
4. Produce a small approved dataset and **hold out whole books or chapters / folio clusters** to prevent near-duplicate leakage. Report results on unseen passages and unknown words.
5. With a sufficiently large dataset, benchmark a constrained, citation-based lookup/morphological parser against a supervised model. Report translation accuracy separately from word-form recall.

## Technical validation

Use the existing `tools/validate_translation_corpus.py` for schema/provenance checks and `tools/test_translator.js` for regression checks. The [source intake and pair template](../translation_corpus/README.md) remains the authoritative route to future training approval. The new in-browser review export contains `train_eligible: false` by design; it is **not** an approval bypass.

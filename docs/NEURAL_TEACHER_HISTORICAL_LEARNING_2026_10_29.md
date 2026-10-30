# Tēntli teacher distillation and Sahagún-related historical source training

**Date:** 2026-10-29. **Scope:** additional experimental neural learning; the entire pre-existing morphology/grammar/English/grammar-IR codebase remains unchanged.

## Why this is not a duplicate grammar engine

We reuse the current 2,142-headword dictionary, 12 full paradigm matrices, canonical `tools/morphology_engine.js` evidence ledger, `translator-sentence.js`, `translator-english.js`, and `translator-grammar-ir.js`. [Earlier PR #85](https://github.com/niftybacon/tlahtolli/pull/85) established the neural Transformer. This work **teaches that same model**, rather than writing a second parser, dictionary or English renderer. All earlier PRs remain in Git history. No dictionary claims or compiled browser assets are altered.

## Teacher export: what the model learns from Tēntli's existing machines

`tools/export_tentli_neural_teacher.js` extracts **source-graded synthetic teacher tasks**. Confirmed in the neural CI's actual canonical dataset:

| Grade | Exported |
| --- | ---: |
| Indexed paradigm cells, including ambiguity | 720 cells represented by **615 distinct written surfaces** |
| Individually source-checked headword analyses | 225 |
| Source-recorded full inflected forms admitted by teacher rules | 303 |
| English sentence drafts having only **one distinct English wording** after the current grammar-IR audit | **24** |
| English drafts with unresolved alternatives **withheld** | 264 |
| Additional source-licensed productive Tēntli hypotheses (low weight; NOT attestations) | **200** |
| **Unique task examples** | **1,367** |

Each row retains an evidence grade, original surface form, source URLs and reduced teacher weight. Equivalent finite forms are grouped into **one surface with all supported morphological readings**, not a randomly chosen person/tense. The current English composer and shared IR are the **only** sources of synthetic English teacher output; most ambiguous constructed cells are deliberately withheld. A source URL citing a lemma does not magically attest every grammar-derived cell.

The `neural/model.py` encoder–decoder now has a distinct `analyze` objective alongside `denoise` and `translate`, so the model can learn structured analyses separately from English generation. `neural/teacher.py` checks the release, source-file hashes, weights and source citation contracts; `neural/distill.py` trains **real PyTorch weights** on these tasks. `neural/train.py --init-checkpoint` continues the same weights when eligible manuscript source rows are available, rather than starting over. This adds task-token serialization relative to the v1 synthetic demonstration weights; **no production weights from v1 are shipped or migrated**.

**Limits:** This is teacher imitation of existing software outputs, not independent Classical Nahuatl morphological validation, human-reviewed bilingual translation, or new manuscript evidence. A low training loss would not mean that the student outperforms its teacher. Neural inference remains explicitly experimental, not the public Tēntli translator.

## Genuine historical source: Brinton's U.S. public-domain hymns

The original research inventory already identified [Daniel G. Brinton's *Rig Veda Americanus* (1890)](https://www.gutenberg.org/ebooks/14993), an edition of old Nahuatl hymns preserved through Sahagún's work. Project Gutenberg classifies it as **public domain in the USA**, and includes both Nahuatl and English material. Brinton explicitly says his English is a **paraphrase** and that he primarily follows the **Madrid manuscript's readings**, with variants from the Florentine witness. This is **not** a newly digitized diplomatic transcription of the 1577 Florentine Codex, and Brinton's English is not a 1:1 translation gold standard.

`neural/intake_brinton.py` isolates only the numbered Nahuatl stanza sections from all 20 Brinton hymns in the original Project Gutenberg plain text, explicitly stopping at glosses, variants, commentary and English interpretation. Original Brinton spellings remain intact; printed line wraps are joined, but no spelling repair, macron invention or forced word segmentation is performed. It emits source-location identifiers and source/work/date/variety/rights metadata for **monolingual denoising only**. Every extracted record belongs to the same `work_id`, preventing bogus verse-level train/test independence.

The exact source file is downloaded temporarily by the GitHub research workflow and verified against pinned SHA-256 `a9fd291536d2b106e331d3727acfb47e55720fa77165a173c2a76af5e5654fbe`. The published edition yielded **112 Nahuatl stanzas in 20 hymns** (Madrid-dominant Brinton witness); editorial variants and English paraphrases are excluded. Neither bulk text nor an externally copyrighted modern edition is checked in. `neural/train.py` splits long historical text into contiguous Unicode-preserving chunks, with **no silent truncation**, and supports a compatible teacher-weight warm start.

**No Brinton English translations are automatically aligned or trained yet.** Further verse-by-verse checking is necessary; interpretative renderings should be downweighted and kept outside actual gold evaluations.

## Additional resources already in Tlahtōlli, with current rights/evidence status

| Resource already indexed | Actual role | Admitted now? |
| --- | --- | --- |
| `research/florentine_codex/analysis.json`: all 12 books | Aggregate orthographic counts only, not training passages | **No** — lacks source text |
| `research/florentine_codex/close_reading.json`, visual collation and `data/passages.json` | Short already studied manuscript spellings and candidates | **No automatic training** without transcription-specific rights |
| [Digital Florentine Codex](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions) | 12-book Nahuatl transcription and Nahuatl-to-English **Anderson–Dibble** translation are available, but **all rights reserved** by University of Utah Press | **No** bulk training without permission |
| Getty's separate English of Spanish Books 1–11 | New CC BY 4.0 **Spanish-to-English**, not guaranteed literal Nahuatl-to-English | **No** naïve Nahuatl→English alignment |
| Getty Book 12 Nahuatl-to-Spanish translation | CC BY 4.0, but original transcription's reuse rights separately matter | Potential later Spanish intermediate task |
| `research/translation_corpus/axolotl_classical_pair_pointers.json` | Pinned source-located Nahuatl/Spanish parallel pointers; mixed provenance | **No** language/rights-generalized blind gold or automatic permission |
| `research/translation_corpus/enl_parallel_alignment_pointers.json` | Seven ENL source-located, editor-consulted Nahuatl-English phrase leads | **No** automated copying of uncertain editorial text |
| `research/translation_corpus/source_reviews/ENL_BC16_1573.json` | Source-located 1573 manuscript analysis, explicitly **not blind** | No published translation-gold promotion |
| `research/translation_corpus/luke_1833_* ` | Early 19th-century southern Puebla variety, different from 1570s Classical | **No** — explicit variety quarantine |
| `amoxcalli-archive.js` and lexical source shards | 36,543 mixed Siméon/OCR/Kaikki lexical comparisons | Evidence lookup only, not bilingual translation data |
| **Brinton's 1890 public-domain edition** | Historical hymns derived mainly from Sahagún Madrid witnesses, free-form English paraphrases | **Yes**, for traceable monolingual historical learning only |

References: [Getty permission matrix](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions), [Brinton Project Gutenberg rights and edition](https://www.gutenberg.org/ebooks/14993), [*Codex to corpus* paper](https://aclanthology.org/2023.americasnlp-1.4/). Literature that calls a research corpus open does **not** alone establish the license of its underlying machine-readable edited transcription.

## Reproduction and quality gates

```sh
# Canonical teacher examples are generated, not copied into an authoritative corpus:
node tools/export_tentli_neural_teacher.js /tmp/tentli-teacher.jsonl
node tools/test_tentli_teacher.js

# Source text is obtained separately from the public-domain edition:
curl -fsSL https://www.gutenberg.org/ebooks/14993.txt.utf-8 -o /tmp/brinton.txt
python -m neural.intake_brinton --input /tmp/brinton.txt --output /tmp/brinton.jsonl

# First learn the existing engines; then continue from their learned weights:
python -m neural.distill --teacher-manifest /tmp/tentli-teacher.jsonl --output /tmp/tentli-teacher-weights
python -m neural.train --manifest /tmp/brinton.jsonl --init-checkpoint /tmp/tentli-teacher-weights --output /tmp/tentli-teacher-historical --width 48 --heads 4 --layers 1 --max-bytes 256
```

CI runs `tools/test_tentli_teacher.js`, `tools/test_tentli_teacher_distill.py`, `tools/test_brinton_hymn_intake.py`, the earlier neural smoke and the original translator/morphology regressions. A separate research workflow runs a **real** teacher-then-Brinton training experiment and uploads only model weights and provenance summaries, **never the underlying manuscript text**. No new historical translation pairs, English gold scores or claimed accuracy are invented.

**Next phase:** reserve document-disjoint, licensed Classical sources for evaluation; obtain usable Nahuatl-to-English alignment rights (or create our own translations from source); then assess how much teacher-distilled historical learning improves out-of-sample translation adequacy. The 200-record Axolotl diagnostic stays a known development set, not a hidden evaluation corpus.

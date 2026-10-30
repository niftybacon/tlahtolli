# Tēntli neural laboratory — historical manuscript-driven learning v1

**Status:** A genuine PyTorch neural architecture and training/inference commands, but **no trained, deployed or validated Classical Nahuatl translation model**. Nothing in this directory replaces Tēntli's existing morphology/grammar engines or changes published translation outputs. Existing manuscripts and individual entries are not automatically reclassified.

## Search for prior work and preservation audit

Audited the current main tree and preceding PR history for an existing neural model, weights, or training pipeline. Found none. In particular:

- [PR #7](https://github.com/niftybacon/tlahtolli/pull/7): canonical `tools/morphology_engine.js`, indexed 720-cell reverse analyzer, guarded hypotheses.
- [PR #25](https://github.com/niftybacon/tlahtolli/pull/25): 36,543 Amoxcalli archival records, expressly no neural training.
- [PRs #26, #29 and #40](https://github.com/niftybacon/tlahtolli/pulls?q=is%3Apr+is%3Aclosed): clause analyzer, source morphology, contextual English and grammar integrations.
- [PRs #57–60](https://github.com/niftybacon/tlahtolli/pulls?q=is%3Apr+is%3Aclosed): source identity, held-out leakage controls and real Axolotl diagnostics.
- [PRs #83–84](https://github.com/niftybacon/tlahtolli/pulls?q=is%3Apr+is%3Aclosed): source-verified vowel morphology and 36–200 real-source translation diagnostics.

**None of these are superseded.** The new code lives only under `neural/`, new tests, this document, and an isolated research workflow. Do not create another morphological parser, grammar IR or English composer. Preserve the 12 existing paradigms, dictionary/release counts and all merged Git history. Source pointers are not copied into a second translation gold set.

## Policy: learn from historical evidence without first certifying each word

An authentic, traceable, lawfully reusable Classical Nahuatl transcription may now be fed into **monolingual self-supervised learning** even if its word boundaries, morphology and English interpretation have not undergone individual scholarly approval. This is the deliberate relaxation of our previous training-admission policy.

The source record needs a unique identifier, historical work identity, source URL, source date label, original transcribed text, variety, transcription confidence/status, rights and train/dev/test split. Valid `transcription_status`: `unreviewed`, `editorial`, `facsimile_checked`, `reviewed`. Any of them can train the monolingual model. Only `Classical Nahuatl` is currently enabled; do not blend modern dialects into this first model. The existing dialect-separated lookup and other corpus machinery remain intact.

**Distinct evidence claims:**

1. Manuscript text is evidence of actual written usage; a modern transcription can still have OCR, reading and segmentation errors. It can supply useful orthographic learning signals *before* dictionary-level analysis is approved.
2. Monolingual historical Nahuatl **does not supply an English meaning or translation alignment**. The denoising objective teaches distributional and spelling regularities, not translation adequacy.
3. A source-provided English equivalent may provide weak parallel supervision only with its **own** documented reuse rights, independent URL, language tag and explicit alignment grade. `candidate` alignments contribute loss weight **0.15**; `reviewed` alignments weight **1.0**. Neither is automatically independent held-out gold.
4. **Rights never become optional:** allowed text rights are `public_domain`, `cc0`, `cc_by_4_0`, or `permission_documented` with `permission_url`. `unknown` or `all_rights_reserved` is rejected. Old manuscripts may be public domain while a *modern edition/transcription/translation* has separate rights; inspect those separately. No unlicensed bulk Florentine transcription is bundled here.
5. An experimental neural output never upgrades `data/lexicon.json`, `data/morphology.json`, `data/evidence.json`, a known manuscript reading or a historical source claim. Canonical Tēntli morphological and grammar analyzers retain their authority in published product output.
6. Split records by entire historical `work_id` (not neighboring lines); identical source texts cannot cross splits under another work name. Training and development loss are **not** translation accuracy. The existing human-reviewed held-out evaluation gate and its current zero approved examples remain untouched.

## Input format: JSON Lines

Each record represents a historically located source span. Keep the original historical text as recorded, including spelling, accents and overbars; separate normalized guesses in your own research records rather than silently editing the original. Example below is a **schema placeholder only, not a real manuscript passage**:

```json
{"record_id":"source-folio-line-001","work_id":"whole-historical-work","source_url":"https://example.org/actual-folio","variety":"Classical Nahuatl","source_date":"1577","original":"<exact, lawfully reusable historical text>","transcription_status":"unreviewed","rights":"public_domain","split":"train"}
```

If the manuscript's transcription is licensed by permission rather than in the public domain, set `rights:"permission_documented"` and include a valid `permission_url`.

Optional, genuinely sourced English supervision:

```json
"translation":{"text":"<actual aligned English source text>","language":"en","rights":"cc_by_4_0","source_url":"https://example.org/actual-translation","alignment":"candidate"}
```

Do not train from the literal placeholders. Do not copy copyrighted modern translations, fabricate equivalence, or convert source pointer rows to fictional verified bilingual examples. The existing `research/translation_corpus/pairs.csv` stays unmodified.

## What the model actually is

`neural/model.py` is a **trainable byte-level Transformer encoder–decoder**, not a set of if/else translation rules. It uses PyTorch, Unicode-preserving UTF-8 boundaries, separate `DENOISE` and `TRANSLATE` task markers, masked-byte source corruption, causal decoder attention and learned parameters. `neural/train.py` fits it with AdamW and gradient clipping, can use clearly graded optional bilingual examples, and saves weights with source inventory/hash metadata. Default dimensions are a small research baseline (2 encoder layers, 2 decoder layers, 4 heads, width 96, maximum 256 input bytes), **not** a competent long-passage machine translator. It operates on bounded spans and may require substantial new training infrastructure.

The denoiser is useful for discovering written-form patterns. It cannot learn fluent English translation from Nahuatl-only text. No model is currently trained on any actual Classical manuscript, nor are language-model weights shipped in `main`. To obtain a useful translation model we still need suitable legally usable aligned English/Spanish examples, longer sequence capacity, disjoint evaluation sources, and eventually an evidence-aware adapter into the existing Tēntli engines.

The laboratory inference function refuses `translate` if the checkpoint never trained on bilingual examples, and all output is labeled `experimental_neural_hypothesis`. It does not secretly call ChatGPT or any other neural service, and it cannot silently override the existing rule-based production translator.

## Running the learning system

Python 3.11+ and PyTorch 2.x are required for neural training. Intake validation uses only Python's standard library.

```sh
python -m pip install 'torch>=2.2,<3'
python -m neural.train --manifest /path/to/licensed-classical.jsonl --output /tmp/tentli-neural --epochs 3 --batch-size 8
python -m neural.infer --model-dir /tmp/tentli-neural --task denoise --text 'SOURCE TEXT'
python -m unittest discover -s tools -p 'test_historical_neural_corpus.py' -v
python -m unittest discover -s tools -p 'test_tentli_neural_smoke.py' -v
```

The checkpoint writes `weights.pt` (real trained parameter tensors) plus `metadata.json` (source record counts, hashes, configuration, loss, and explicitly null translation accuracy). It **does not contain a copy of the training manuscript**. Local corpora and weights are excluded from Git by `.gitignore`. A test-only neural training run uses **fictional non-Nahuatl strings** with an explicit `synthetic_test_only` variety, which the real command cannot accept, to demonstrate gradient updates/checkpoint loading without fabricated historical Nahuatl. The research CI also runs unchanged canonical translator and morphology regressions.

## Source evidence and future integration

The Florentine Codex's twelve-book aggregate stats are **not** ready-made sentence pairs or trainable passages. Read `research/florentine_codex/TRAINING_GATES.md` for source-specific manuscript-vs-transcription-vs-modern-translation rights. For proper machine learning, create a traceable, rights-verified manuscript transcription corpus, preserving original spelling and document boundaries; don't accidentally train on aggregate counts or unlicensed modern editions.

The next milestone is to train on a real, lawfully usable Classical historical corpus and establish document-disjoint controls. Next, collect adequately aligned bilingual records for the `TRANSLATE` task and measure generalization. Only then introduce a source-graded integration that lets neural proposals assist `tools/morphology_engine.js` and `translator-grammar-ir.js`. **Keep both engines; no second morphology engine is needed.**
\n## Current extension: transfer knowledge already in Tēntli

The [teacher/historical neural training report](../../docs/NEURAL_TEACHER_HISTORICAL_LEARNING_2026_10_29.md) describes a source-graded distillation of **1,367 examples** from current canonical lexemes, recorded forms, indexed conjugations, source-gated new morphotactic hypotheses, and uniquely worded English drafts audited through the *existing* grammar IR. This uses a new `analyze` neural task, not another grammar engine. `neural/distill.py` fits genuine weights to the current machines; `neural/train.py --init-checkpoint` preserves that knowledge when training next on traceable old Nahuatl.

A distinct pinned, US-public-domain historical cohort draws **112 stanzas from 20 songs** in Daniel G. Brinton's 1890 edition derived mainly from Sahagún's Madrid witness. The model learns from original spellings (with contiguous chunking) but **does not** auto-import Brinton's paraphrastic English, Getty's all-rights-reserved Anderson–Dibble Nahuatl-to-English text, or other modern dialects. A GitHub Actions workflow creates the neural checkpoints without committing manuscript text or assuming translator accuracy. Weights remain **experimental**, not the browser translator.


## Research intake update: fair use can be distinct from source redistribution

Copyrighted training text is not automatically disallowed solely because its
rights are reserved: U.S. fair use may apply depending on how the text was
acquired, the purpose of training and the market impact. The
[Anderson–Dibble fair-use and model-release protocol](ANDERSON_DIBBLE_FAIR_USE.md)
now permits an explicitly **source-specific assessed-fair-use** training
metadata tier for private, lawfully obtained input without allowing source
text into public artifacts. This is not a claim that Getty's licensed display
is a general bulk-training license, nor does it independently authorize
redistribution of weights. `neural/release_audit.py` separately checks
translation evidence, documented source acquisition, extraction risk and
release assessment. No Anderson–Dibble data or model weights have been
imported as a result of this policy update.


## Two more historical books actually trained

The [2026-10-29 Brinton poetry + Chimalpahin training report](../../docs/TENTLI_TWO_HISTORICAL_BOOKS_TRAINING_2026_10_29.md)
records a live training run that **continued** the existing canonical
Tēntli-teacher + 112-hymn learned weights on two distinct source works:
**217 Nahuatl stanzas spanning 27 Brinton poems**, including **165
strictly size-bounded, weak English verse correspondences**, and **65
Chimalpahin historical Nahuatl prose paragraphs**. The other 52 poem
stanzas are **not** silently converted into truncated English bilingual
examples. The two source versions are SHA256-pinned and their original
texts remain off-repository; no canonical morphological or grammatical
engine changes, modern dialect mixing or independent translation-accuracy
claims are made.

## Temoa narrative corpus and larger Chimalpahin manuscripts

The [source-verified Temoa + Chimalpahin research report](../../docs/TEMOA_CHIMALPAHIN_RESEARCH.md)
records a completed **1,800-step** real PyTorch continuation of the same
prior Tēntli model on **five named work-level historical Nahuatl
sources**: Chimalpahin's Third and Eighth `Relaciones`, the *Anales
de Cuauhtitlan*, *Leyenda de los Soles* and *Anales Mexicanos*.
The intake admitted **450 provenance-bearing text records and 499,938
editorial transcription characters**, **zero** new translation pairs
and no source text redistribution. Rights are independently assessed
for noncommercial private research only; previously encountered
Axolotl source overlap remains known. Development denoising loss
(~2.0455) is **not** human-scored translation adequacy. Canonical
Tēntli morphology, grammar and dictionary remain unchanged.

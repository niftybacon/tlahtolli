# Historical translation diagnostic — 36, 48, 96 and 200 source records (2026-10-29)

**Version under test:** canonical main release `2026-10-29.9.0`, commit `d496667b472872f04a7fc003246b7bad95c50217`.

**Reproducible evidence:** [GitHub Actions real-source diagnostic #40972985402](https://github.com/niftybacon/tlahtolli/actions/runs/40972985402), including independent evaluation-readiness checks (passed). Source: [Comunidad Elotl's published Axolotl CSV at pinned Py-Elotl revision](https://github.com/ElotlMX/py-elotl/blob/157f34300f4ca92c3d75b74ec14142916d75c30b/elotl/corpora/axolotl.csv); exact original Git blob `90b7327fc4023ba529e1982f823ddeaee6e313e3`. The input is used only in temporary runner storage.

**Purpose:** determine where the existing Classical Nahuatl → English pipeline refuses real published text, not score semantic accuracy. The source's Classical label, span boundaries and published paired Spanish are not certified independent historical judgments. No Spanish text was fed to the analyzer as gold, and no new bilingual example was stored.

## Result across four deterministic development samples

| Sample | Source works | Nahuatl tokens | Exact curated matches | Curated recognition | Unrecognized occurrences | Unknown with canonical morphology candidates | Partial grammar windows | Complete grammar candidates | Audited English drafts |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 36 | 17 | 365 | 103 | 28.2% | 262 | 17 | 0 | 0 | 0 |
| 48 | 17 | 472 | 125 | 26.5% | 347 | 22 | 0 | 0 | 0 |
| 96 | 17 | 947 | 249 | 26.3% | 698 | 51 | 0 | 0 | 0 |
| **200** | **17** | **1,998** | **552** | **27.6%** | **1,446** | **111** | **0** | **0** | **0** |

Each sample uses the existing SHA256-ranked, duplicate-checked, round-robin source-work selector, with 3–18 Nahuatl tokens and 3–36 Spanish tokens per selected source record. The cohorts overlap: **these four results are not four independent evaluation sets.** In the 200-record sample, 18 records had no exact curated matches and none had zero unknown tokens. Eight contained question punctuation; punctuation is not the only or dominant reason for refusal.

### What the 1,446 unknown occurrences contain (200-record cohort)

| Cross-reference evidence tier | Unknown occurrences |
|---|---:|
| Exact Classical-labelled Kaikki archive form | 247 |
| Diacritic-only Classical-labelled archive comparison | 2 |
| Siméon OCR-only comparison | 214 |
| No direct archive match | **983** |

These mutually exclusive categories total 1,446. They classify **token occurrences**, not reliably identified lexemes, historical meanings or manuscript attestations. The 111 unknown occurrences with canonical morphology candidates **overlap** these categories and do **not** raise curated recognition. Many such candidates involve nominal/locative words, so 111 must not be described as newly translated verbs. Only two unreviewed archive-form grammatical-label clues arose in this larger cohort.

The most frequent still-unrecognized written forms among the 200 include `ye` (38), `ma` (18), `y` (18), `ynic` (17), `zan` (16), `yc` (12), `ipan` (11), `ya` (11), `yehuatl` (11), `ic` (10), `on` (10), and `ypan` (10). These require *individual historical and grammatical classification*, not a generic lexeme intake. They may include discourse particles, orthographic forms, bound material, or ambiguous grammatical sequences; their recurrence does not prove a single lemma or sense.

### Source-work differences

Exact curated recognition in the 200-record sample is not uniform:

- Higher: **Segunda relación**, 24/47 (51.1%); **Quinta Relación**, 59/150 (39.3%); **Tercera Relación**, 43/119 (36.1%).
- Lower: **Primera inserción**, 6/44 (13.6%); **Trece Poetas**, 16/98 (16.3%); **Anales de Tepeteopan**, 16/96 (16.7%); **Veinte himnos**, 24/142 (16.9%).

These are coverage differences in a bounded, editorially heterogeneous sample, not a quality ranking of the historical works.

## Separate source-located historical excerpt diagnostic

The existing `tools/diagnose_historical_sentences.js` independently examined nine **previously consulted, non-blind editorial excerpts**. Two had complete exact *headword* coverage; two lacked composition despite lexical coverage; one provided structural evidence without an English draft; six had lexical and syntactic gaps. No excerpt received an English draft. These mutually exclusive failure statuses total nine; “full lexical coverage” is an overlapping attribute, not another separate bin. The inspected excerpts are often fragments rather than complete propositions.

Examples of *written-surface diagnostic misses*, **not suggested substitutions or claimed translations**:

- `ioan` in a Florentine Codex source excerpt; comparable to attested conjunction spellings, but do not force it to a selected sense or syntax.
- `tiyahui`, a finite-looking form with no independent source-grounded full analysis in that excerpt.
- `mochioa`, `atlan`, the preserved overbar abbreviation `y¯`, and `ticnamaca`: morphology, spelling and source evidence must remain separate.
- `Coamjchi` and `Chimalmjchi`: historical fish names with source-specific spelling rather than grounds to invent generic noun templates.

## Pipeline diagnosis, without false-positive translation claims

**1. Curated surface-form retrieval is the first bottleneck.** The 2,142 published headword identities include 1,664 provisional nonverbs, 187 provisional verb candidates, and 66 older index-only items. They are useful research leads, but unreviewed archive tags do not confer trustworthy Classical meaning, inflected form, syntactic category or valency. On 200 real records, the curated recognizer accepts only 27.6% of written tokens.

**2. Canonical morphology is present but rarely repairs those raw input failures.** Source-gated Tēntli can propose multiple person, tense, and stem interpretations on specifically checked lexical examples; 111 of 1,446 curated-unknown occurrences in the broad sample have any canonical morphology candidate. Those are candidate analyses, not verified readings. The latest n-/t- vowel boundary fix and two newly source-reviewed Class 2 stems are real narrow additions, but there is no measured passage-translation improvement from them in this cohort.

**3. Lexical hints are not complete, compositional clause evidence.** The existing `translator-sentence.js`, declarative clause grammar, shared grammar IR, and `translator-english.js` can handle many constructed, source-bounded tests, including embedded relatives and agreement alternatives. Yet these data yielded **zero complete candidate clauses/records**, **zero supported partial grammar windows**, and **zero audited English drafts** in all four samples. Do not claim the system can translate the studied excerpts simply because `TlahtōlliMorphEngine.analyze()` returns a ranked hypothesis.

**4. Historical orthography, variety and source segmentation cannot be ignored.** The source spans include names, Spanish insertions, dates, Roman numerals, OCR phenomena, honorific or complex verb strings, questions and editorial boundary choices. The existing historical-spelling engine supplies tentative comparison evidence, not permission to substitute `y/i` or delete vowel length systematically.

**5. Reverse English → Nahuatl remains an exact dictionary-gloss lookup.** The `en-nh` branch in `translator-engine.js` indexes gloss strings and explicitly declines generalized morphology or composed-sentence generation. Do not describe it as a bidirectional historical sentence translator.

## Prioritized next work

1. **Source-grade the high-frequency failure types** from multiple works, beginning with short independent particles, locative expressions and bound person markers. For every proposed entry, record source, source-period spelling, POS, valency and sense ambiguity; exclude false standalone lexemes. Count new exact matches separately from genuine grammatical recoveries.
2. **Annotate independently sourced historical finite predicates** (including exact person/object, stem pair, tense/aspect, reflexive/honorific status and alternative readings) for all failed examples in a bounded audit. Preserve both unresolved forms and alternate source spelling when evidence conflicts.
3. **Integrate only independently licensed finite analyses into the existing shared clause representation.** Reuse `tools/morphology_engine.js`, `translator-sentence.js`, `data/clause_grammar.json` and the shared grammar IR. No parallel parser, invented object allomorph, or one-off English phrase table. Add positive and negative source-oriented tests demonstrating grammar roles, not merely keyword retrieval.
4. **Track a stable failure funnel**: source-checked lexical matches → verified or explicitly hypothetical finite morphological analyses → complete role assignment → grammar-graph-approved English proposal. Separate the same historical development cohort from genuinely untouched source works.
5. **Only then establish a blind, licensed, reviewed benchmark** with document-level held-outs and adjudicated manuscript readings. The project currently has **zero approved held-out translation pairs**. Therefore adequate English translation accuracy remains **unknown/null**, rather than 0%, 27.6% or any invented number.

## Reproduction

Run in a checkout with Node 22 or later after retrieving the **exact pinned** source CSV (a changed blob is rejected):

```sh
node tools/diagnose_translation_coverage_batch.js /path/to/axolotl.csv
node tools/evaluate_translation_readiness.js
node tools/test_translation_readiness.js
```

The corresponding manual GitHub Actions workflow is `.github/workflows/run-translation-coverage-diagnostic.yml`. It does not commit, upload or reproduce any bilingual source rows, stores no gold passage text, and leaves the dictionary and translator engines unchanged. Note also the separate existing `Check Tlahtōlli data` browser-source-link visibility failure on both pre-Batch09 `main` and the updated release; it is not a new linguistic translation result.

**Final conclusion:** the chief engineering bottleneck is **historically warranted lexeme/inflection analysis and its path to complete clause roles**, not a missing independent English sentence generator. The strongest safe next step is a large evidence-checked batch of real finite and grammatical-form analyses, followed by the *same* multi-cohort diagnostic.

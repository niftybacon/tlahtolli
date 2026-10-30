# Investigator-to-established-engines bridge (October 30, 2026)

## What 'autonomous learning' means in Tēntli at this release

The [full historical form investigator](../../neural/paged_historical_investigator.py) now autonomously inventories **1,181 distinct written forms** from source-identified Brinton *training* stanzas and individual original-source contexts, and searches **36,543** archival dictionary records. It also identifies evidence gaps and **68 prioritized contextual questions**. That is **autonomous research and evidence triage**.

It was not automatically updating dictionaries, inflection rules, models or Gold benchmarks. It only built a proposed evidence report. **It was not an integrated adaptive language learner.** This new step closes a concrete part of that gap: pass the investigator report to Tēntli's **actual existing analyzer engines**, so each unknown form is tested against what the current translator and grammar already can—and cannot—explain.

## Executed engine connections

`tools/investigator_engine_bridge.js` uses the real `tools/diagnose_historical_sentences.js` model loader (not newly invented translation rules) plus original sourced data:

| Existing component | Real bridge operation | Known limitations |
| --- | --- | --- |
| `translator-engine.js` curated lexical analysis | Checks each of the 1,181 exact written forms | Lexicon is not a complete historical inflection resolver, no general normalization |
| `paradigms.json` complete 10×6 verb paradigms | Reverse-indexes **actual indexed** verb cells only, preserving the paradigm's cited lemma source and cell indices | Grammar-derived paradigm cell is **not** attested manuscript occurrence |
| `translator-source-morphology.js` | Reuses the existing source-reviewed-by-reference, *exact-token* ENL BC16 morphology adapter | This covers only its small explicitly curated token set, **not** general morphological inflection |
| `translator-sentence.js` | Analyzes all seven short cited original Nahuatl contexts from BC19, BC16, BC26 and Florentine edition | Phrase fragments and 16th-century spellings may not be complete clauses |
| `translator-english.js` | Reports whether English composition is supported or abstained for each cited original snippet | English draft *is not printed as historical truth*; it is not compared to scholarly English |
| `translator-grammar-ir.js` | Produces provisional shared grammar nodes and alternative counts for the same historical context | Grammar candidates and discourse links are *not* proven historical readings |
| **Advanced standalone browser morphology** in `tools/morphology_engine.js` | Executed from the **actual original website source** in an isolated Node VM with the same curated dictionary and verb-paradigm data | Provisional hypotheses and analogies remain distinct from manuscript-attested or independently validated readings. The VM uses conservative NFC/case matching and does not call the browser UI. |

The result labels each historical surface by **the first applicable actual engine route**: curated lexical identification, exact indexed verb-cell match, exact source morphology match, archival headword only, or no linked engine match. This triage differs from the raw 937 archival misses: the translator might recognize a form that the larger archival word lists do not, or vice versa. All 1,181 forms remain source-cited research leads, not automatically accepted interpretations.

The seven cited historical contexts contain the exact edited Nahuatl string and its document source URL, but **not English editorial reference translations**; no copied modern bilingual data is distributed and no synthetic teacher target is inferred from a sentence. A piece of the original manuscript, word form or passage must not silently be normalized into an apparent canonical lemma, especially `y¯`, `cujcatl`, or numbered `-cān`. For Getty's dynamically rendered historical transcription the original document citation remains graded **not verified by static HTTP**, even though it can still be submitted as a marked *research hypothesis* to the existing grammar.

## Run the full joint research diagnostic

```sh
python -m neural.paged_historical_investigator --all \
  --output /tmp/tentli-1181-historical-source-forms.json

node tools/investigator_engine_bridge.js \
  --input /tmp/tentli-1181-historical-source-forms.json \
  --output /tmp/tentli-existing-engine-gaps.json

node tools/test_investigator_engine_bridge.js
```

The bridge re-hashes **all 19 source archival JSON files**, the lexicon, claims, manuscript atlas, original source-context catalogs, and director's provisional feedback. It refuses stale or tampered source files and all assertions of Gold, Silver, automatic lexical certification or training. This makes its output reproducible and **source-bound to the current revision**. It neither edits production dictionary code nor makes any neural optimizer step.

The dedicated GitHub Actions workflow runs the real research pipeline through the existing engines and saves an evidence-graded artifact. It is triggered by changes to its integration files or manually; the **weekly whole-worklist evidence run remains a separate job**. That weekly job is *not* a self-learning agent; it rechecks the source inventory available at the time and does not repeatedly train on itself.

## What should happen next

1. **Validate the advanced morphology engine's new investigator diagnoses against actual historical contexts**. The bridge now executes the original website source in a research-only VM. Grade `manuscript` / `lexical` / `paradigm` / `hypothesis` / `analogy` must never be collapsed into one purported historical attestation, especially among the 937 prior archive misses.
2. Build a source-conditioned **reason-for-miss** classifier, preserving differences among inflected forms, particles/vocables, historical spellings, manuscript abbreviations, segmentation and unsupported productive hypotheses. Investigations should create *proposed corrections*, not accepted new dictionary senses.
3. Permit reviewed corrections to enter the canonical lexicon and learning curriculum through a separate **human approval and protected regression** process. Keep an untouched Gold set outside the workflow.
4. Only after source-graded reviews and independent evaluation are available, consider scheduled retraining of an English-capable model with promotion gates. Repeated self-generated drafts do not constitute verified English learning.

**Learning assessment:** Tēntli now researches autonomously and the new bridge operates the **existing advanced morphology**, curated lexical, indexed paradigm, source morphology, sentence grammar, English composition/abstention and shared IR engines against source-graded research automatically. It does **not** autonomously approve new historical morphemes, acquire validated new grammatical knowledge, or update the public translation model from each run.


## Verified first full integrated execution

[Successful research bridge workflow](https://github.com/niftybacon/tlahtolli/actions/runs/41097899517) executed the current archived source investigator through all listed engine routes. **1,181** researched written forms received these mutually exclusive *first-supported-route* outcomes:

| Existing analyzer surface route | Distinct forms |
| --- | ---: |
| Curated lexical recognition | 97 |
| Additional exact indexed verb paradigm | 4 |
| Additional exact ENL source-review morphology | 1 |
| Additional browser advanced morphology hypothesis | 4 |
| Archival dictionary headword only, no linked translator analysis | 147 |
| No linked engine surface match | **928** |
| **Total** | **1,181** |

All seven short historical source contexts reached the genuine sentence grammar, English proposal/abstention and shared grammar IR, but **none** produced a complete supported finite-clause analysis or supported English draft. Each retained some lexical gap. **This is structural diagnostic coverage, not independent translation accuracy or zero real understanding**.

The advanced browser morphology's original `TlahtolliMorphEngine.analyze` implementation is executed directly inside an isolated Node VM with canonical dictionary and verb matrices. Unlike the full website environment, its **historicalSpellings browser helper is not invoked here**: the VM deliberately supplies an empty helper rather than inventing an unknown spelling transformation. Individually cited historical forms are still tracked separately by the source atlas. Hence these figures are **conservative research adapter results**, not complete parity with every browser UI behavior. Normalization is NFC lowercase without stripping macrons. Detailed evidence grades remain attached to morphological hypotheses and source-recorded indexes.

**No automatic learning or Gold certification occurred.** The bridge analyzes frozen source evidence and writes a separate auditable research report; it does not add lexical facts, approved morphological rules, neural gradients or published English translations.

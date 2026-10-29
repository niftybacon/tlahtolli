# Vocabulary-first batch 04 — 82 index-sourced headwords

## Editorial scope

This batch increases the site's canonical searchable vocabulary from **128 to 210 entries** in a single PR, without modifying `tools/morphology_engine.js`, `translator-sentence.js`, full verb paradigms, the historical archive, or sentence translations.

**Source:** Online Nahuatl Dictionary, Stephanie Wood, ed., University of Oregon / Wired Humanities Projects, indexed headword results in pages [75](https://nahuatl.wired-humanities.org/advanced-search-headword?page=75&title_1=&title_1_op=%3D), [475](https://nahuatl.wired-humanities.org/advanced-search-headword?page=475&title_1=&title_1_op=%3D), [573](https://nahuatl.wired-humanities.org/advanced-search-headword?page=573&title_1=&title_1_op=%3D), [628](https://nahuatl.wired-humanities.org/advanced-search-headword?page=628&title_1=&title_1_op=%3D) and [750](https://nahuatl.wired-humanities.org/advanced-search-headword?page=750&title_1=&title_1_op=%3D).

The batch contains **82 distinct, previously absent headwords** including **23 entries whose gloss suggests verbal use**. English glosses are short paraphrases of the *index summaries*, not full scholarly translations. Each entry identifies its index page and exact headword, labels its status `Index-sourced; further lexical review pending`, provides a brief English search gloss and keeps the original source-index URL. These are **source-indexed candidates**, not 82 independently collated sixteenth-century attestations.

## Boundaries: no cheating on linguistic evidence

- A dictionary search index mixes periods and varieties; these records use the existing site's `Classical Nahuatl` storage variety convention for discoverability but the notes explicitly say **chronology and variety are unresolved**, and need later entry-level inspection.
- **Headword and short index meaning** have `assessment: dictionary`, tied to an exact search-listing locator. The assigned part of speech is **editorial inference**, *not* a verified grammatical class (`assessment: inference`).
- **No** independently sourced stem, 1sg preterite, plural, possessed form, object-valency, morphological paradigm, finite translation or historical transcription is inferred. Each added entry has `inflections: []`, `stem: ''`, `plural: ''`, and an explicitly `unverified` stem claim.
- Similar forms and closely related compounds remain separately indexed if the ODN listing has separately named records; this does not claim independent morphological analysis. Any spelling with missing macrons retains the source-index orthography, rather than silently normalizing vowel quantity.
- The existing 36,543-record Amoxcalli archive remains its own unreviewed search source and has not been promoted into these headwords.

## Release and repeatable batching

The same **three canonical input files** remain the sole source of truth: `data/lexicon.json`, `data/morphology.json`, and `data/evidence.json`. The existing `tools/build_dictionary.py` generates `dictionary.json`, `claim_audit.csv` and the offline seed; no new analyzer, staging database, secondary vocabulary system or outside dependency was added.

Release version is `2026-10-29.3.0`, headwords **210**, original full paradigms **12**. Existing earlier cohorts and corresponding tests remain intact. Browser smoke tests were made resilient to *future headword-count increases* by testing translator readiness text, while the separate lexical count and provenance tests remain strict.

Run only the existing release sanity checks and regular CI workflow; no new expensive browser or grammatical test suite is added. A single batch PR is preferred to opening one PR for every handful of words. Additional source-index batches should follow the same three-file schema and explicitly mark provisional evidence.

## Accuracy

This vocabulary expansion is not evidence that historical translation accuracy improved. An index gloss alone cannot establish a sentence's referents, argument structure, or historical meaning. Any effects on the 36-row historical development set must be reported as an engineering diagnostic separately from held-out translation accuracy.

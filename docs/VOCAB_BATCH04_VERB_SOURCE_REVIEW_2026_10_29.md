# Vocabulary batch 04: evidence-gated source review of two verb entries

**Date:** October 29, 2026. One source-review increment on the existing PR #73; no second dictionary, parser, new lemma or full paradigm.

- [tepoztia](https://nahuatl.wired-humanities.org/content/tepoztia): ODN gives Molina 1571, Part II, f.104r col.2 **tepuztia. ni.** and a recorded **onitepuztiac** preterite. Only that intransitive lexical construction and exact transcribed historical form are newly source-checked.
- [tepoztehuia](https://nahuatl.wired-humanities.org/content/tepoztehuia): ODN's same Molina folio/column has **tepuzteuia. nitla.**, preterite **onitlatepuzteui**. This licences a transitive indefinite-object description, not specific-object c-/qui- agreement or hypothetical future stems.
- [nonotza](https://nahuatl.wired-humanities.org/content/nonotza) and [nonotza (alternative record)](https://nahuatl.wired-humanities.org/content/nonotza-0) give competing NŌNŌTZ(A)/NOHNŌTZ(A) lexical identities and different reflexive/transitive patterns. **Do not promote** a single automatic tense paradigm from the current index record.

These ODN transcriptions of Molina's printed historical dictionary are **not** independently collated source folios or witnessed contextual sentences. Source-written `tepuz-` is intentionally distinguished from editorial `tepoz-`; no macron substitution or base-1/base-2 derivation is asserted.

Both existing canonical records update only the source/POS fields and one exact 1sg preterite in `data/{lexicon,morphology,evidence}.json`. The source-checked `headword`, `meaning`, and `pos` claims carry locator f.104r col.2; `stem` remains `unverified`. The preterites are `evidence:dictionary`, while the canonical engine's bounded grammatical substitutions remain `grade:hypothesis` and incomplete in sentence grammar. No archival, English, or gold evaluation labels were changed.

After review: **210 headwords**, **130 entry-level source checked**, **80 index-only**, **257 stored form records**, **1,272 evidence claims**, **12 full paradigms**. Bump all release-version fields to `2026-10-29.3.1`.

Verification gates: `python tools/build_dictionary.py --check`, `python tools/build_morphology_engine.py --check`, `python tools/validate.py`, `node tools/test_index_verb_source_review.js`, all existing morphological test suites and both GitHub workflows. The pinned Axolotl cohort was not used to select lexical entries or claim increased translation accuracy.

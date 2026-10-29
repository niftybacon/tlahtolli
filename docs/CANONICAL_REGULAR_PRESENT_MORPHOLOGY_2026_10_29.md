# Canonical Tēntli: source-gated regular singular present (2026-10-29)

## Why this change

The existing `tools/morphology_engine.js` reverses 720 cells in 12 curated verb paradigms and proposes bounded object/possession analogies, but a source-located *regular intransitive verb* without a full paradigm often cannot be recognized in its ordinary singular present inflection.

Rather than create another parser or guess past-tense stems, this change adds **one bounded reverse rule inside the canonical analyzer**.

## Rule and safeguards

For each curated `dictionary.json` entry whose POS is **exactly** `verb (intransitive)`, whose headword **and POS** are separately supported by a source-located claim, and which is **not already in** `FULL_VERB_PARADIGMS`, accept only the original NFC-correctly written:

- `ni-` + source headword → **1sg present hypothesis**
- `ti-` + source headword → **2sg present hypothesis**

The entire source-recorded headword is retained as the proposed present stem; this does **not** claim independent verification of the prefixed word, stem-internal segmentation, or its contextual meaning. Reject irregular, transitive/reflexive, lexicalized/inherently uncertain, and already-indexed verbs. Do not guess third-person plural, 1pl, tenses, object prefixes, or sound changes. Vowel length and accents must match the source-catalogued form exactly—no diacritic folding for the new hypothesis.

The sources for the verb's lexical identity and class remain available in the existing claim ledger. The ordinary 1sg/2sg subject-prefix distinction follows the Classical grammatical sources already used for the Tēntli paradigm engine (Launey, *An Introduction to Classical Nahuatl*, lessons 2–3, and the project's indexed grammar sources). Each candidate is explicitly graded **hypothesis**, never `lexical`, `manuscript`, `paradigm`, or `complete`.

If a verb's exact prefixed form already appears in the curated lexicon as a separately recorded item, the existing stronger evidence wins rather than showing a redundant lower-grade conjecture.

## Concrete new capabilities

The current source-labelled dictionary permits provisional recognition of `niquiza`, `tiquiza`, `nicochi`, `ticochi`, and `nipolihui` without inventing a new lemma or declaring a correct translation. `tipolihui` is **already** independently listed as an excerpted form and retains its stronger evidence, with no duplicate hypothesis.

Examples of deliberately refused forms include `niyauh` (irregular verb), `nicuepa` (transitive/reflexive without object modeling), `nitlacuiloa` (lexicalized intransitive), `niquīza` (unlicensed macron change), and every other unsupported inflection.

## Implementation, guardrails, evaluation

- Edit only canonical `tools/morphology_engine.js` and rebuild its guarded `index.html` embed with `python tools/build_morphology_engine.py --write`.
- Run `node tools/test_regular_present_morphology.js` for five positive instances, provenance, exact spelling, recorded-form priority, missing-POS-source rejection, and explicit sentence-English abstention.
- Both current CI suites also check the canonical analyzer; all prior 720 matrix forms and existing historical spelling, possession, and translation gates remain intact.
- Keep the original 365-token Axolotl development cohort and its separate curated/archival/grammatical counts unchanged. Morphological hypotheses are **not curated lexical hits or proof of accurate translation**. A score change must be measured, not assumed.
- Stage 2 future work: separate source-backed lexical stems, licensed inflection classes, and dialect-specific morphophonology. Do not silently promote the 36,543 unreviewed archive entries.

Old draft PRs #30/#31 were closed as superseded; the declarative clause grammar and indexed nonpresent bridge already exist on `main` via PR #34. This change does not modify or duplicate either.

# Canonical Tēntli: productive verb templates grounded in recorded finite forms (2026-10-29)

## What was already indexed

On the base commit, `paradigms.json` has **12 complete paradigms**, each with 10 row patterns and 6 person cells (**720 grammar-generated cells**, not 720 manuscript attestations). `dictionary.json` contains **21 curated verb headwords**, nine without those full paradigms. The 36,543-record historical archive includes many more entries, but its independently unreviewed source labels do not license new dictionary headwords or paradigm rows. Existing separate verb attestation tokens remain source-specific.

## Problem

The existing canonical `tools/morphology_engine.js` can reverse all indexed paradigm cells, parse certain bounded object analogies, and propose singular intransitive present forms of additional curated headwords (PR #66). But it cannot systematically use a source-recorded first-person preterite and its explicitly labelled object prefix to recognize **other person forms** or **regular present forms** outside the 12 matrix verbs.

## A single extension inside the existing analyzer

`fromSourceLocatedFiniteTemplates` examines only canonical `dictionary.json.words[]` entries with separately sourced `headword` and `pos` claims and an exact **source-listed 1sg preterite token**. It excludes any lemma already in `FULL_VERB_PARADIGMS`. It never touches archive files, creates dictionary entries, generates a new 60-cell paradigm, or produces English.

1. The grammatical rule may substitute **ti- 2sg** for the recorded **ni- 1sg** in `o-ni-...` / `ō-ni-...` while preserving the augment, object agreement (if any), and the entire source-listed stem/preterite remainder *exactly*. The original finite exemplar must be tagged `Preterite 1sg` with `dictionary` or `text` evidence and an HTTPS source locator. Only plain intransitives, transitive `tla-` or `c-` prefixes with matching object labels, and explicitly labelled nonreflexive animate-indefinite `te-` forms from mixed transitive/reflexive verbs are eligible. It will **not** infer reflexive no→mo allomorphy.
2. Only where the original *recorded preterite* independently proves an indefinite `tla-` or `te-` object slot may the existing first/second singular present subject prefixes be combined with **that exact object slot** and the source-supported **dictionary citation base**. This is a morphological hypothesis, not proof of the written finite word. Specific object `c-` from a preterite does not license arbitrary present `c-/qui-` allomorphs.

The rule requires exact NFC spelling, retains the original source locator, reconstructs the entire written word from its parts, and suppresses its proposal if a stronger independently indexed whole-form analysis already exists. It emits only `grade: hypothesis`. It does not infer vowel-length changes, stem vowel alternation, third-person or plural agreement, extra objects, imperative, causative, applicative, tense interpretation beyond the source template, or a full sentence reading.

## Reproducibility and independently unseen forms

`tools/test_source_verb_productivity.js` includes **12 generated positive forms** from **four separately sourced lexical verbs** (`cochi`, `caqui`, `cuiloa`, `tlazotla`), and excludes any form already listed in the curated inflection inventory. It tests ambiguity and source priority, exact diacritics, removal of required evidence, fabricated URLs, and that none of the generated forms can become a `complete:true` sentence or an English translation.

Independent Classical subject/preterite structure: Michel Launey, *An Introduction to Classical Nahuatl*, 2011, Lessons 1 and 8, notably the regular person prefixes, independently selected base-2 preterite and optional augment; https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/preterite-tense/086BF0CAE349B08696892FE96A080C4F . Specific lexical forms and their grammatical categories are separately identified in the existing claim ledger and original source-linked `dictionary.json` entries.

Run:
```sh
node tools/test_source_verb_productivity.js
python tools/build_morphology_engine.py --check
python tools/test_advanced_morphology.py
node tools/test_axolotl_development.js
```

Both CI workflows execute the new test as well as their full existing regression inventories. The pinned 365-token Axolotl development sample must retain its independent counters; software hypotheses must not be misrepresented as curated lexical recognition or verified translation accuracy. No failing Axolotl token was used to derive or select a new rule.

## Next improvements requiring external evidence

Broader grammatical coverage requires licensed lexical bases for many additional verbs, specific object allomorph rules, stem-class changes across tenses, third/plural subject endings and historical orthography. Those are **not** safely learnable from 36,543 unreviewed dictionary records alone. Maintain evidence grades and run held-out historical sentences before making translation-quality claims.

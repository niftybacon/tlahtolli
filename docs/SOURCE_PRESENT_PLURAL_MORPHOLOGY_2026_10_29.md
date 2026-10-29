# Source-checked Classical present plural in canonical Tēntli (2026-10-29)

## Why a new rule, not a new engine or a new paradigm

The canonical analyzer already recognizes 12 fully indexed 10×6 paradigms and source-checked additional verb stem classes for restricted preterite and future forms. It lacked the **present plural** for those additional classes. This change modifies only the existing `fromSourceLocatedFiniteTemplates` path in `tools/morphology_engine.js`, with the offline `index.html` embed kept identical.

The grammar comes from Michel Launey, *An Introduction to Classical Nahuatl*, Lesson 1, pp. 12–17 (regular subject prefixes and present plural -h): https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/intransitive-verbs-word-order-absolutive-suffix/FC0BAA1ECC2F889E39D4C4B475B2DEFF . See also Thelma Sullivan's historical Classical grammar, *Compendio de la gramática náhuatl*, sections II and IV: https://historicas.unam.mx/publicaciones/publicadigital/libros/gramatica/cgnahuatl.html .

Only the **nine** distinct, independently located intransitive lexical bases already supported by canonical stem claims, specific 1sg preterite exemplars, and source-graded part-of-speech claims qualify: `cochi`, `tēmi`, `huetzi`, `tlācati`, `nāhuati`, `tlatzihui`, `patlāni`, `tlanahui`, `tlachia`.

For each lexeme the existing 1pl `ti-`, 2pl `an-`, and 3pl Ø prefixes combine with the source-checked present/citation base and regular -h. Examples: `ticochih`, `antēmih`, `huetzih`. **27 new whole-form grammatical hypotheses**, not 27 historical attestations, are possible. No original dictionary inflection claims, paradigm matrix, source metadata, historical source spellings, or English translations are changed.

## Strict refusal and evidence boundaries

- All three individually located headword/POS/stem fields **and** one exact recorded 1sg preterite must verify the canonical short base. The same gate used by existing past/future rules is reused; it does not simply strip a suffix from arbitrary headwords.
- The **23 new index-only possible verbs from vocabulary batch 04 do not qualify**: their POS remains inference and their stems and paradigms are unknown. Gloss similarity, historical OCR, and archive word forms never become verified finite grammar.
- Only specifically source-classed **intransitives** without full paradigms are admitted. Transitive objects, reflexives, borrowed/modern dialects, irregular endings, vowel quantity substitutions, and stem guessing abstain.
- An individually recorded exact form takes priority over generated morphology. All newly composed readings stay `grade: hypothesis` and no sentence is marked complete or assigned English from this rule.
- The 36-row/365-token Axolotl development cohort is **not** used for selecting roots or patterns and remains an unverified, source-mixed diagnostic. No translation accuracy gain is claimed. The independently approved held-out translation set remains empty.

## Regressions and release gate

`node tools/test_source_present_plural_morphology.js` covers 27 unseen written forms, morpheme reconstruction, provenance, source deletion, exact-form priority, negative macron/valency/dialect controls, and refusal to generate sentence English.

Existing gates are retained: `python tools/build_morphology_engine.py --check`, `node tools/test_source_stem_plural_morphology.js`, `node tools/test_curated_verb_expansion03.js`, `node tools/test_axolotl_development.js`, browser tests, and both CI workflows.

This change intentionally does NOT touch archive PR #64 or question-diagnostic PR #65 and does not introduce a fourth lexical data store, another parser, generated entries, or an extra paradigm file.

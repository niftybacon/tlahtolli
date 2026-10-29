# Canonical Tēntli: independently located long/short verb stems (2026-10-29)

## Problem

Classical Nahuatl distinguishes source-specific *present/long* (base 1) and *preterite/short* (base 2) verb stems. Tēntli already recognizes all 12 indexed 60-cell paradigms and uses source-listed first-person preterites for guarded 2sg and indefinite-object morphological proposals outside those paradigms. However, it does not use independently checked **long/short alternations** to interpret a limited third-person preterite or the regular **-z** future.

The repository contains source-located `cochi` (`coch-; cochi-`, Molina/Karttunen/Lockhart) and `caqui` (`cac-; caqui-`, Molina/Karttunen/Lockhart) in its existing canonical dictionary. Sources include:
- https://nahuatl.wired-humanities.org/content/cochi
- https://nahuatl.wired-humanities.org/content/caqui
- Michel Launey, *An Introduction to Classical Nahuatl* (2011), preterite/verb base rules: https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/preterite-tense/086BF0CAE349B08696892FE96A080C4F
- Thelma Sullivan, *Compendium of Nahuatl Grammar* (1988), future singular -z and examples `nicochiz`, `ticochiz`, `cochiz`.

## Extension inside the existing morphology engine

Only `tools/morphology_engine.js` implements the rule. Existing `fromSourceLocatedFiniteTemplates` now has a **source-stem-class gate**: a curated lexical headword and POS claim, a **separately source-located stem claim** whose complete list consists of exactly two named bound bases, one identical to the dictionary citation form, and an independent **exact 1sg preterite form** whose remaining stem equals the second source-listed base. No new private lexicon, archive import, regex-only prefix stripping, or 60-cell fabricated paradigm is introduced.

Licensed interpretations (all `grade: hypothesis`):
- Intransitive 3sg preterite: exact preterite augment + the independently checked short base, zero subject prefix. Transitive third person is **refused**, since object prefix allomorphs can change.
- Singular future (1sg, 2sg, and 3sg for intransitives; 1sg/2sg only for independently recorded `tla-` indefinite object transitives): unchanged **source-checked long/present base** + regular future `-z`. Other object classes are not licensed.

Other morphological cases, lexical entries, indexed paradigms, grammatical interpretation and English translation remain unchanged. The source's macron contrasts and exact stem boundaries must be preserved. A proposal is a compositional possibility, **not a historical attestation**, a corpus citation, a verified translation, or a new recognized curated headword.

## Testing

`tools/test_source_stem_class_morphology.js` checks seven previously **unindexed** candidate forms from two independently source-located base pairs (`nicochiz`, `ticochiz`, `cochiz`, `nitlacaquiz`, `titlacaquiz`, `ococh`, `ōcoch`). Each is checked against existing dictionary inflections so a test cannot pass by mere lookup. The suite contains near-miss macrons, malformed augment/objects, transitive 3sg refusal, unsupported verbs, evidence deletion, unsupported stem substitution, documented-form priority, and sentence-completion abstention. The test does not read or adapt to the Axolotl 365-token sample.

Checks:
```bash
python tools/build_morphology_engine.py --check
node tools/test_source_stem_class_morphology.js
node tools/test_source_verb_productivity.js
node tools/test_axolotl_development.js
python tools/test_advanced_morphology.py
```

Both GitHub CI suites run the new guard. Curated lexical recognition and held-out translation accuracy are separate measures; neither should be increased just because Tēntli recognizes an additional morphological *hypothesis*.

## Future work

Broader generalization requires source-checked stem-class labels and independent finite examples for **more than the current two eligible stem pairs**. It would be methodologically unsound to infer every stem class from a headword, to import the 36,543-record archive as verified lexical evidence, or to mistake 720 indexed grammar-derived paradigm cells for 720 separately witnessed written forms. Do not claim a measured historical translation improvement from this PR alone.

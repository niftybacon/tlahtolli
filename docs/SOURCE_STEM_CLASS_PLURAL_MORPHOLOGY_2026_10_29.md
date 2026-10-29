# Plural finite morphology from source-located verb stem classes (2026-10-29)

## Integration, not a second system

Tēntli already has 12 complete indexed 10×6 verb paradigms and independently sourced additional verb headwords. This change adds **no extra analyzer, paradigm matrix, dictionary, archived lookup shortcut or hardcoded development-set exceptions**. It extends the existing `fromSourceLocatedFiniteTemplates` within `tools/morphology_engine.js`, based on PR #69's source-checked **base 1/base 2** condition.

The existing curated dictionary and evidence ledger supply `cochi: coch-/cochi-` and `caqui: cac-/caqui-`, separately supported by Molina, Karttunen and Lockhart. Their exact source-recorded 1sg preterites must match the listed short base before this class-specific rule is usable. For transitive `caqui`, the independently labelled `tla-` indefinite object must be preserved exactly; guessed specific-object `c-/qui-` alternations are rejected.

The plural verb morphology is supported by:
- Michel Launey, *An Introduction to Classical Nahuatl*, chapter 8: 1sg source-checked short base, plural preterite -quē, optionally preceded by ō-;
  https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/preterite-tense/086BF0CAE349B08696892FE96A080C4F
- Thelma Sullivan, *Compendium of Nahuatl Grammar*, 1988: short-base preterite plural -queh and long-base future plural -zqueh with independent person prefixes;
  https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/North%20American/Uto-Aztecan/Nahuatl%20Grammar%2C%20Compendium%20of%20%28Sullivan%29.pdf
- Existing Tēntli `PEOPLE[3..5]` plural subject inventory: ti-, an-, Ø.

## Licensed results

Only **verified-long/short-source classes** with exact NFC spelling, a cited preterite exemplar and a located stem claim can produce:
- **Preterite plural:** source-recorded o-/ō- augment + 1pl/2pl/3pl prefix + independently recorded `tla-` (if separately sourced) + verified short preterite base + `queh`.
- **Future plural:** indexed 1pl/2pl/3pl prefix + same independently verified indefinite object where applicable + source-checked long/present base + `zqueh`.

This produces 15 new **testable full-form hypotheses** across the two source-verified stem pairs and all three plural subject categories, including `oticochqueh`, `oancochqueh`, `ocochqueh`, `titlacaquizqueh`, `antlacaquizqueh` and `tlacaquizqueh`. These are NOT individually reviewed historical attestations, not lexical headwords and not verified translations. The rule does not infer dialectal alternate endings, unknown root classes, reflexives, imperative, honorifics, or alternative object allomorphs.

## Tests, accuracy boundary

`tools/test_source_stem_plural_morphology.js` checks all 15 generated forms are **absent from the existing indexed inflection inventory**, tests exact segment reconstruction and evidence grades, challenges the analyzer with malformed/plural/diacritic/valency tokens, removes indispensable source claims, swaps stem or example, and verifies every candidate stays `complete:false` in the existing sentence parser with no verified English.

```sh
node tools/test_source_stem_plural_morphology.js
node tools/test_source_stem_class_morphology.js
python tools/build_morphology_engine.py --check
node tools/test_axolotl_development.js
```

Both CI suites include these gates. No 365-token Axolotl failure was used to select a form, root or suffix; the independent held-out accuracy remains unmeasured. Raising the 102/365 **curated lexical** recognition score requires genuinely sourced headword additions, not new hypothetical grammatical surface forms. The next significant research step is to independently validate more Classical verb base classes and integrate them into the existing **source-controlled dictionary**, rather than copy the entire unreviewed 36,543-record archive.

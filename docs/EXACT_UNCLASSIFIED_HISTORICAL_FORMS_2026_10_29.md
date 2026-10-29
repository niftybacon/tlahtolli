# Three exact historical forms with unresolved productive classes (2026-10-29)

These are **new discrete source records** for three of the seven previously unresolved index-only verb candidates. They are not three independently checked person/stem classes.

| Lemma | Exact transcribed surface | Source / source location | Editorial scope |
|---|---|---|---|
| `aztayoa` | `oaztayoac` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/aztayoa), quoting Molina (1571) II f.10r col.2 | Printed lexicon labels a preterite, but not its subject person or valency |
| `tecpayoa` | `otecpayoac` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/tecpayoa), quoting Molina (1571) II f.93r col.2 | Exact reported preterite; no independently sourced 1sg base or rule |
| `tepozotinemi` | `tepoçotinemiz` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/tepozotinemi), quoting Reyes García (1972), pp.304–305, edited Cuauhtinchan 1559 ordinances | Source-written finite-looking form in a transmitted colonial clause; not independent manuscript collation; future/person identification left unresolved |

The **whole written forms** are added to the existing `data/morphology.json` `inflections` list and canonical offline export, with individual `other` claims in `data/evidence.json`. Molina forms carry dictionary evidence. The Cuauhtinchan transcription is explicitly classified `review` (unreviewed) because a separate copy of the original manuscript was not collated. It is **not** asserted as `grade:manuscript` or a contextual English translation. The ODN web entries and edition locators make the quoted spelling independently inspectable.

**No promotion to complete verb class:** all three remain `status:Index-sourced; further lexical review pending` and their `stem` fields remain empty, `pos` claims `inference`. No 1sg preterite exemplar, future generator, new syntactic English, full conjugation matrix, archive promotion, or gold test item is introduced.

The older [80-entry verb-class review](BATCH04_REMAINING_80_VERB_CLASS_AUDIT_2026_10_29.md) remains a correct historical snapshot: these three candidates still have unverified productive grammar despite additional source-form evidence.

## Reconciliation with PRs #64 and #65

PRs #64 and #65 are merged; #64 only admits **exact source-listed Classical grammatical tags** as unreviewed archive morphology clues; #65 only retains source tokens and tentative morphology for unsupported question punctuation. Neither replaces Tēntli nor increases curated translation accuracy.

The archive's first asynchronous load triggered a complete Translator re-render, which could collapse researchers' expanded source-morpheme evidence panels and cause browser validation failure. The small `translator-integrated.js` fix preserves the expanded `details` state across that one-time refresh, without disabling archive-form clues, adding any new grammar, or changing dictionary recognition.

**Validation:** `node tools/test_batch04_verb_class_evidence.js`; `node tools/test_index_verb_source_review.js`; `python tools/build_dictionary.py --check`; `python tools/build_morphology_engine.py --check`; and both comprehensive CI workflows, including the pre-existing `tools/test_translator_browser.py` UI link-visibility regression.

# Batch 05 — mass Classical-labelled verb candidate intake (2026-10-29)

## Tangible expansion, without fabricated grammar

One consolidated source-data branch moves the canonical dictionary from **210 to 478 lexical headwords** by admitting **268 additional, distinct Kaikki/Wiktionary Classical-labelled (nci) verb-index candidates**. Total verb-labelled entries rise from **54 to 322**. This is **NOT** 322 source-verified conjugation classes: all 268 new entries are indexed-only and provisional. Existing **144 previously entry-level source-checked records**, **66 ODN index-only candidates**, **12 full conjugation paradigms**, **272 independently stored forms**, and historical morphology remain in place.

These new candidates were already present as *unreviewed records* in the 36,543-row Amoxcalli/Kaikki archive. Admission to provisional lexical search is not a new historical discovery or source verification.

## Frozen selection and source record

- Start with the existing **508** Kaikki rows labelled `verb` and `nci`.
- Exclude existing headwords and duplicates under accent/macron folding, explicit `form-of`/`alt-of`/obsolete and nonstandard records, overt person/tense-form tags, non-single-word heads, and unusable glosses.
- Where one canonical form is explicitly source tagged, retain it as the display headword and preserve the source spelling. Do not create hypothetical macrons, saltillos, or orthographic substitutions.
- Retain an exact source row, short English source gloss, original source headword, source-reported tags, and shard/row coordinates for each candidate in [the 268-row manifest](../research/batches/classical_archive_verb_batch05_2026_10_29.json). Human source review has not been completed.

## Provenance firewall

The status `Archive-indexed; lexical review pending` and POS label `verb (provisional archive index)` are intentional. Each added entry carries **inference** grades for headword, short gloss and part of speech, and **unverified** for stem. There are **zero** new inflected-form records, independently verified stem pairs, or 10×6 paradigms in this batch. No new finite verb rule or English sentence composition has been introduced.

The canonical Tēntli engine's productive verb gates require source-checked lexical POS plus further finite/stem evidence; these new entries are categorically ineligible. The lexical translator makes a provisional hit visibly uncertain and reports a separate provisional counter; the Axolotl development diagnostic continues treating it as unreviewed, not new curated historical recognition. Do not interpret changed lexical-index access as held-out translation accuracy, or treat the 365-token development sample as evaluation gold.

## Reproducible source and copyright

Existing licensed archive: [Amoxcalli raw Kaikki Nahuatl data](https://github.com/samvillasmith/amoxcalli-nahuatl-project/blob/main/source_data/nahuatl_kaikki_raw.jsonl), derived from Wiktionary via Kaikki/Wiktextract. Wiktionary data: CC BY-SA 3.0/GFDL; Amoxcalli-derived parsing: CC BY-SA 4.0. Preserve attribution, source locations, and applicable share-alike requirements. This import does not bulk-copy historical copyrighted reference works.

## Repeatable one-PR process

The manifest can be checked or applied by `python tools/import_archive_verb_batch.py --check` / `python tools/import_archive_verb_batch.py --write --manifest PATH`. The write path appends all new candidates to the existing three canonical source files **once**, then updates `paradigms.json`, `references.json`, `release.json`, and rebuilds the published dictionary, claim CSV and offline seed. It does not create a second dictionary or morphology engine.

Run source-batch checks, both build `--check` tools, existing translator and archived-data regressions, and full GitHub CI. After all pass, squash merge the **one consolidated PR**. Subsequent batches should independently source-review high-value stems and finite forms rather than inventing classes or spawn PRs per lemma.

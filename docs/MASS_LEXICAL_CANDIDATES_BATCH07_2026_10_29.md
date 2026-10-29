# Batch 07 — large nonverb lexical index intake (2026-10-29)

## Exactly what this adds

**1,664 new unreviewed, searchable source-index headwords** from Tlahtōlli's existing Classical-labelled Kaikki/Wiktionary shard, advancing the canonical total from **478 to 2,142**. POS breakdown: **1,552 nouns, 18 pronouns, 33 numerals, 40 adverbs, 14 adjectives, 4 particles, 3 interjections**. These are *candidate lexical leads*, not independently source-reviewed Classical dictionary entries.

The baseline **187 source-reviewed entries, 66 older ODN index-only entries, 225 unresolved provisional verb candidates, 305 independently stored forms and 12 existing paradigm matrices** remain untouched.

## Exact source audit

Each [manifest row](../research/batches/classical_archive_lexical_batch07_2026_10_29.json) preserves original source headword, source-listed short English gloss, POS, tags, and exact Kaikki archive shard and row. Selection refuses existing diacritic-folded headwords, recorded form-of/alt-of, obsolete, nonstandard and certain Spanish/English borrowing markers, multiword tokens and unusable glosses. These are *filters*, not independent confirmation of period, morphology, translation, dialect or historical correctness. Some source-index misclassifications and undetected loans may persist.

Upstream is [Amoxcalli's Nahuatl Kaikki archive](https://github.com/samvillasmith/amoxcalli-nahuatl-project/blob/main/source_data/nahuatl_kaikki_raw.jsonl), derived from Wiktionary/Kaikki. Preserve Wiktionary CC BY-SA 3.0/GFDL and Amoxcalli-derived CC BY-SA 4.0 attribution. No original historical manuscripts or restricted folio images have been bulk copied.

## Strict provenance

All entries use status `Archive-indexed; lexical review pending` and provisional POS. Their headword, short meaning and POS fields are `inference` grade; stem is `unverified`. None gains source-verified noun animacy, noun class, plurality, possessed forms, finite verb morphology, grammatical paradigms or independent text attestation. The Translator must show these hits as provisional, not counted toward curated lexical recognition, and never silently compose a verified English translation from them.

## Reproducible one-PR release

Run `python tools/import_archive_lexical_batch.py --check`, `node tools/test_archive_lexical_batch07.js`, `python tools/build_dictionary.py --check`, and `python tools/build_runtime_assets.py --check`. The importer `--write` mode verifies all frozen source coordinates, changes the three authoritative editorial files and matching version locks together, then rebuilds published JSON, claim CSV and offline HTML seed. The dedicated branch-scoped one-shot action applies this large data release using GitHub Actions because direct client uploads of multi-megabyte generated blobs were unavailable.

Future work: source-review high-utility lexical entries and noun inflections individually, then source-gate further productive verb class pairs. Index growth is not held-out translation accuracy; the Axolotl diagnostic corpus remains development-only.

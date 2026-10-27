## October 27, 2026 — Historical spellings and final interface polish

- Display source-linked original and historical spelling variants at the bottom of every dictionary overview, and index documented spellings for search.
- Add located `Jn` and `yn` forms for `in` in Florentine Codex Book 1, folio 16r. Distinguish source transcription from editorial orthography and avoid generating forms.
- Correct source names and clarify current opt-in FSRS-5 across the UI and release documentation. No redesign, lexical reinterpretation, or changes to personal study progress.

## v2.3.1 (2026-10-27) — Historical possessive evidence

- Located **notlaxcal** in Launey's grammar, **noconeuh** in a dated 1673 will, **nomil** in a 1586 land document, and **noteuh** in Sahagún's *Primeros Memoriales*.
- Promoted four previously unresolved possession records with exact source locations; no paradigms were extrapolated.
- Updated the online/offline records and tests; 109 claims remain unverified and 113 remain provisional.

## v2.3 — 2026-10-27: grammatical audit

- Audited 349 pending claims with dated lexical witnesses and Classical Nahuatl grammar.
- Explicitly distinguished citation-form number from referential number; added grammar source locations.
- Distinguished 113 rule-derived proposals from located grammatical/lexicographic records.
- Documented exceptions (mountains, stars) and retained ambiguity in polysemous nouns.
- Added actual plurals tlatoque and teopixque with source context, plus three possessed examples.
- Preserved still-missing plurals as unknown instead of claiming impossibility.

## v2.2 · 2026-10-27 — Founding vocabulary claim-level source audit

- Checked the original 44 entries individually against dictionary headwords, primary senses and lexical-category evidence.
- Added source-specific grammatical notes for 29+ exceptional or irregular morphology/possession/plural records.
- Distinguished late-colonial plurals of tlālli and āltepētl from unrestricted early-Classical number rules.
- Preserved unresolved classifications and all existing 88 headwords, 12 verb tables and reference witnesses.
- Updated research CSV and automated claim tests.

# Changelog

## v2.1 — Claim-by-claim lexical source review (2026-10-27)

- Audited the individual ODN source entries of all 44 new v2.0 headwords.
- Indexed 672 field-level research records across 88 words: 162 located sources, 510 unresolved questions.
- Added per-word evidence ledger and expanded Research Audit matrix; kept user-local edits and study records intact.
- Corrected *tonalli*: a cited plural suffix is not an independently attested complete plural word; full-form claim withdrawn.
- Documented selected source-listed bound possessed and combining stems, without generating free forms.
- Added machine-readable `claim_audit.csv`, regression fixtures, and CI tests.
- Original historical witness source atlas, 12 verb paradigms, and all 88 dictionary headwords preserved.

## v2.0 · New verified lexical batch and source witnesses (2026-10-26)
- Added **44** new Online Nahuatl Dictionary checked lexical headwords (88 total).
- Each new record includes citations with dictionary folio/page locators, core glosses, part of speech, provisional nominal class, and differentiated uncertainty.
- Added 5 source-documented full plural forms; did not guess the others.
- Added Early Nahuatl Library and Paz y Sánchez Luke 1833 to the Source Atlas with clear differences in historical era and variety.
- Added 14 individually located text references to the existing eight Codex witnesses (22 total).
- Preserved all existing data structures, offline vocabulary seed, backup workflow and verb paradigm cells.
- Updated tests to check multi-source provenance, 88-word sync and documented morphological exceptions.

## v1.9
- Added Folio atlas and limited verb subject/object morphological proposal engine.

# Batch 08 — 38 historical verb lexical reviews and 19 evidence-gated stem families (2026-10-29)

## The source-led decision, not a mechanical conjugator

Tlahtōlli's **2,142 lexical identities remain unchanged**. This one coordinated review checks **38 previously provisional Kaikki-labelled verbs** against lexical entries in the Online Nahuatl Dictionary (ODN), which quote specific Molina (1571), Lockhart (2001), and Karttunen (1992) references. Their exact historical dictionary quotations—not inferred patterns from word endings—go into the [38-row evidence manifest](../research/batches/source_stem_batch08_2026_10_29.json).

**15** new candidates gain a Class 1 (6) or Class 2 (9) constrained base rule, while **four previously entry-reviewed verbs** gain Class 1. **23 additional reviewed candidates do not gain productive stems.** The ledger also records **four separate exclusions** where the Classical vowel length/person-marked historical data are insufficient. Only **34 exact source-reported finite forms** from the new 38 entries plus **two additional differently written Class 1 source-listed preterites** from the older cohort are stored. Total indexed forms: **305 → 341**. The full **12 10×6 paradigm matrices** and canonical **9,003 claim records** are not expanded. All 38 upgrade pre-existing headwords, not new lexical identities. Remaining provisional verb candidates: **225 → 187**; entry-checked lexemes: **187 → 225**.

## Class 2 (9 candidates): citation base versus distinct completed base

The exact source and person-marked preterite support a *pair*, retained verbatim without speculative vowel or accent normalization:

| Lexeme | Citation base | Historical completed base | Exact source-listed 1sg |
| --- | --- | --- | --- |
| pāqui | pāqui- | pāc- | ōnipāc |
| iztlacati | iztlacati- | iztlacat- | ōniztlacat |
| huāqui | huāqui- | huāc- | ōnihuāc |
| mahui | mahui- | mauh- | onimauh |
| tlaōcoya | tlaōcoya- | tlaōcox- | ōnitlaōcox |
| teci | teci- | tez- | onitez |
| ichtequi | ichtequi- | ichtec- | ōnichtec |
| nequi | nequi- | nec- | ōnicnec; **specific c-object only** |
| quetza | quetza- | quetz- | onitlaquetz; **indefinite tla-object only** |

The historical dictionary locators, spelling conflicts, and alternative senses are in the frozen manifest, not interpolated from this table. The productive engine already requires source-listed 1sg preterites, exact object frame, a *separately graded* stem claim, and a two-part base pair; without these, it abstains. Only grammar-generated `hypothesis` readings become possible, not full English clauses.

## Class 1 (six new candidates + four old entries)

The Class 1 preterite has the citation base plus singular **-c**, rather than a shortened Class 2 base. The new source-gated Class 1 rules therefore explicitly remove singular **-c** before adding plural preterite **-queh**; they do **not** produce *-cqueh*. They also gate singular future, plural future and (for checked intransitives only) present plural as hypotheses. Only a source-listed 1sg with the original augment and an exact unchanged citation base is eligible.

Six newly checked: **huetzca, tequiti, tlatla, pixca** (intransitive) and **patla, neltoca** (the specific historically source-listed `nitla-` transitive frames). Four earlier historical entry reviews: **temo, panō, cuīca, popoca**. The previously indexed `onipanoc` and `onicuicac` are retained *alongside* their new exact Lockhart spellings `ōnipanōc` and `ōnicuīcac`; neither historical spelling is overwritten to create false orthographic certainty.

## Intentional refusals (23 class-unresolved + four separate gate refusals)

The 23 new lexical reviews without a productive stem include **cualāni, iztaya, pīnāhua, ceceya, potōni, pozōni, petlāni, caxani, chalāni, quiquici, yancuiya, poyāhua, tōca, pātzca, huītequi, ilcāhua, ilpia, tlazohtla, cocoa, āna, petzcoa, ixhui, poztequi**. They have source-specific spellings, lexical roles or attested tokens but unresolved unique stems, person frames, Class 3 and reflexive morphology, or source-era vowel length. That historical evidence is **not** an invitation to guess a class.

Additional explicit refusals for **chīpini** (conflicting vowel length between index and historical citation), **nehnemi**, **tzahtzi**, **ihcihui** (the available source citation does not independently confirm the required historical person-marked form; modern variety sources are not automatic Classical evidence).

## Reproducible build and research limits

```sh
python tools/import_source_stem_batch08.py --check
node tools/test_source_stem_batch08.js
python tools/build_dictionary.py --check
python tools/build_morphology_engine.py --check
python tools/build_runtime_assets.py --check
```

The frozen manifest and importer are replayable only against the identified previous **2,142-headword** editorial release. The single branch-scoped GitHub Actions build runs `--write`, regenerates all canonical datasets, audit CSV, offline HTML seed and source-controlled Tēntli embed, and checks old and new regression suites before committing the edition. No new person/object plural paradigm matrices are constructed.

**Epistemic boundary:** These are AI-assisted cross-checks of **ODN historical dictionary quotations**, not direct original Molina folio collation, independent scholarly peer review, or manuscript-attested whole sentences. The output must distinguish exact *dictionary-listed* first-person forms from reconstructed *hypothesis* forms. Neither a 365-token pinned Axolotl development check nor a successful structural test licenses claims of held-out translation accuracy. Respect period distinctions, conflicting spellings and source licensing; reject rather than fabricate when unsure.

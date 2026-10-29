# Batch 06 — sourced Classical verb coverage at scale (2026-10-29)

## Scope and audit boundary

**43** existing provisional Classical-labelled archive verb entries were independently cross-checked against published historical lexical material and upgraded to `Checked against source`. **33** exact first-person completed-form spellings were recorded as source-listed tokens; **six** independent Class 2 base pairs were admitted in the existing canonical Tēntli analysis engine. The batch uses ONE manifest and ONE pull request, not one PR or one conjugation table per verb.

Canonical headwords remain **478**. Reviewed entry count **144 → 187**; unreviewed Kaikki lexical candidates **268 → 225**; older ODN-only index **66** unchanged. Explicit source-listed inflected forms **272 → 305**. The pre-existing **12 full paradigm matrices** and all existing source evidence, grammar code and historical archives remain intact.

## Productive Class 2 pairs (exact-source only)

| Lexeme | Source-checked present/citation base | Exact preterite base | Independently reported first-person completed form | Source |
|---|---|---|---|---|
| miqui | `miqui-` | `mic-` | `onimic` | Molina II f.56v col.2; Karttunen p.148; Lockhart p.225 |
| cecmiqui | `cecmiqui-` | `cecmic-` | `onicecmic` | Molina II f.15v col.1; Karttunen p.27 |
| poyōmiqui | `poyōmiqui-` | `poyōmic-` | `ōnipoyōmic` | Lockhart p.230; Karttunen p.204 |
| cotōni | `cotōni-` | `cotōn-` | `ōnicotōn` | Lockhart p.216; Molina II f.24v col.2 |
| pēhua | `pēhua-` | `pēuh-` | `ōnipēuh` | Lockhart p.229; Karttunen p.191 |
| tzāhua | `tzāhua-` | `tzāuh-` | `ōnitzāuh` | Lockhart p.240; Molina II f.151v col.2 |

The exact source locators, grammatical limitations, spelling, verb categories and per-lexeme exceptions are machine-readable in [the batch manifest](../research/batches/source_reviewed_verb_batch06_2026_10_29.json).

## Why not give every reviewed verb a productive class?

The other **37** newly source-reviewed verbs have independently supported lexical roles and (for 27) an exact recorded first-person form, or a more restricted lexical witness. But mere similarity or a reported `Class 1`, `Class 3`, impersonal, irregular, reflexive or object-specific form **does not** automatically license a general verb-class alternation inside Tēntli's existing long/short-stem rule.

Some important refusals:

- `temo`, `panō` and `cuīca` have Class 1 preterites in **-c**; extending the current Class 2 short-base plural machinery to them could create false past plurals.
- `choloa` has different Molina and Lockhart past spellings and Class 3 behavior. No ad-hoc normalization or Class 2 masquerade.
- `āmiqui`, `āpīzmiqui` and `mayana` show original Molina spellings that do not independently certify all modern editorial vowel lengths. Exact recorded tokens remain distinct from normalized hypothesized forms.
- `chicāhua` has different ni/nic/nite/nitla senses and both first- and second-class evidence. The single recorded `nitla-` sense does not license an indiscriminate Class 2 matrix.
- `tōna`, `yohua`, `pāti` and `mani` must not receive ordinary personal ni-/ti- inflection solely from an impersonal or irregular dictionary lemma.
- `tzoncui` has an exact recorded reflexive token, but the source's `nino-` cannot be treated as a simple general transitive object allomorph.

## Mechanism and epistemic limits

Each reviewed verb updates only the existing three canonical editorial files `data/{lexicon,morphology,evidence}.json`. The primary source entry, explicit person/valency, exact finite example, and—only for six entries—source-quoted stem pair are kept separate in the claim ledger.

The existing Tēntli analyzer activates 14 additional source-licensed **hypothesis** patterns per Class 2 pair (2sg/3sg past, singular futures, plural past/future, plural present). The 84 test probes are grammar-generated compositions, **not 84 independently historical written forms** or proof of contextual English translation. Explicitly recorded 1sg forms are separately recognizable at lexical grade. The multi-clause, possession, historical spelling and English components are reused and not extended.

No held-out score or historical sentence accuracy improvement is asserted. The fixed 365-token Axolotl development cohort is not selected or modified for training; the source reviews were selected by historical lexical documentation, not the corpus failures.

## Validation

```sh
node tools/test_source_verb_batch06.js
python tools/build_dictionary.py --check
python tools/build_morphology_engine.py --check
node tools/test_source_stem_class_morphology.js
node tools/test_source_verb_productivity.js
node tools/test_axolotl_development.js
```

Both existing GitHub CI workflows execute the new targeted regression alongside the larger suites. Source locators are an AI-assisted cross-check of published ODN quotations of Molina, Karttunen and Lockhart; they are **not original facsimile collation** or specialist peer review. Please preserve cited orthography, competing senses, and manuscript uncertainty.

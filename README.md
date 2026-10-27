# Tlahtōlli · A living Classical Nahuatl dictionary

[**Open Tlahtōlli Online**](https://niftybacon.github.io/tlahtolli/)

**Version 1.7 · Interlinear annotation and evidence-aware reading.** This is an independent, AI-assisted learning/research tool, **not** a scholarly peer-reviewed edition. Its evidence status is per claim, not per page; never infer that a lexicon URL verifies every field.

## Explore

- **Tlahtōlli · Dictionary:** search exact and alternate spellings, indexed inflections, 12 finite-verb paradigms, and English meanings. Filter noun/verb/particle, noun animacy, and evidence coverage.
- **Tēntli · Form detective:** recognizes indexed forms and displays conservative subject-prefix alignment for matched paradigm cells, not a general finite-state parser or historical attestation.
- **Āmoxtli · Reader:** annotate saved passages and search exact forms, indexed **candidate headwords**, or short 2–6-token phrases. **Interlinear annotation desk** offers per-token lemma, grammatical label, gloss, evidence level, exact locator and a TSV export. Candidate matches are not established readings or manuscript evidence.
- **Momachtia · Study:** browser-local vocabulary review **plus 720-card indexed verb-paradigm practice** with selectable verbs, tense scopes and spaced-repetition scheduling. Form-level study records are included in full backups and CSV study exports.
- **Tlāhcuīlōlli · Research audit:** source-specific field claims, a field-by-field citation coverage matrix, and an exportable research queue. Exact source locators are required for the matrix counts.

## Publishing additional vocabulary

After researching a headword, prepare a single JSON record with the format described in [the schema](docs/SCHEMA.md). Run:

```sh
python tools/add_entry.py --candidate new-word.json --dry-run
python tools/add_entry.py --candidate new-word.json --apply
python tools/validate.py
python tools/test_data.py
python tools/test_interlinear.py
```

The preparation tool deliberately refuses to overwrite an existing headword. Inspect the Git diff, check all grammar references and spellings, then commit the three changed publication files together. The public website syncs the published data when loaded or on manual sync. With authorized GitHub access, a ChatGPT-assisted entry can also be prepared and committed without manual upload; nothing is added to the live dictionary merely by mentioning a word outside an active repository-editing session.

## Verification and limitations

- **13 field-level source records** across the founding 44 headwords at v1.7. Many other fields remain to be individually audited.
- The 720 verb cells are *grammar-derived*, not individually confirmed manuscript attestations.
- The concordance indexes local user-saved texts, **not a licensed historical corpus**. Lemma-mode matches are proposals assembled from known spellings, forms and grammar tables; even a matched form may have a different contextual analysis.
- A morpheme interpretation is limited to evidence from explicitly indexed paradigms, with unsegmented elements labeled as such. Competing analyses are listed as candidates, not resolved contextual parses.
- **Token citations require a source URL and exact locator.** Their presence documents an editorial research trail; it does not verify that a chosen analysis is correct. Old project backups are supported; new optional evidence fields default to unreviewed.
- Historical forms and variation require context. Normalized matching strips vowel-length marks for discovery; it is not proof of the same lexical sense.
- Your local vocabulary and conjugation study schedules, custom entries, notes and passages are **not uploaded to GitHub**. Export a full JSON backup before changing devices.

Read [the editorial policy](docs/EDITORIAL_POLICY.md), [contribution guide](docs/CONTRIBUTING.md), [research backlog](docs/RESEARCH_BACKLOG.md), and [changelog](CHANGELOG.md).

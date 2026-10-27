# Tlahtōlli · A living Classical Nahuatl dictionary

[**Open Tlahtōlli Online**](https://niftybacon.github.io/tlahtolli/)

**Version 1.5 · Research, morphology and reading tools.** This is an independent, AI-assisted learning/research tool, **not** a scholarly peer-reviewed edition. Its evidence status is per claim, not per page; never infer that a lexicon URL verifies every field.

## Explore

- **Tlahtōlli · Dictionary:** search exact and alternate spellings, indexed inflections, 12 finite-verb paradigms, and English meanings. Filter noun/verb/particle, noun animacy, and evidence coverage.
- **Tēntli · Form detective:** recognizes indexed forms and displays conservative subject-prefix alignment for matched paradigm cells, not a general finite-state parser or historical attestation.
- **Āmoxtli · Reader:** annotate saved passages, inspect tokens, and search an exact-word *concordance* across your saved passages. Uncited teaching examples are not historical witnesses.
- **Momachtia · Study:** browser-local review scheduling (two directions, CSV export, and full-project backup support).
- **Tlāhcuīlōlli · Research audit:** source-specific field claims, citation gaps, and downloadable research queue.

## Publishing additional vocabulary

After researching a headword, prepare a single JSON record with the format described in [the schema](docs/SCHEMA.md). Run:

```sh
python tools/add_entry.py --candidate new-word.json --dry-run
python tools/add_entry.py --candidate new-word.json --apply
python tools/validate.py
python tools/test_data.py
```

The preparation tool deliberately refuses to overwrite an existing headword. Inspect the Git diff, check all grammar references and spellings, then commit the three changed publication files together. The public website syncs the published data when loaded or on manual sync. With authorized GitHub access, a ChatGPT-assisted entry can also be prepared and committed without manual upload; nothing is added to the live dictionary merely by mentioning a word outside an active repository-editing session.

## Verification and limitations

- **13 field-level source records** across the founding 44 headwords at v1.5. Many other fields remain to be individually audited.
- The 720 verb cells are *grammar-derived*, not individually confirmed manuscript attestations.
- The word-concordance indexes local user-saved text, not a licensed scholarly corpus.
- A morpheme interpretation is limited to evidence from explicitly indexed paradigms, with unsegmented elements labeled as such.
- Historical forms and variation require context. Normalized matching strips vowel-length marks for discovery; it is not proof of the same lexical sense.
- Your local study schedule, custom entries, notes and passages are **not uploaded to GitHub**. Export a full JSON backup before changing devices.

Read [the editorial policy](docs/EDITORIAL_POLICY.md), [contribution guide](docs/CONTRIBUTING.md), [research backlog](docs/RESEARCH_BACKLOG.md), and [changelog](CHANGELOG.md).

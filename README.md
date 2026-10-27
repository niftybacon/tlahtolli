# Tlahtōlli — Living Classical Nahuatl Dictionary

[**Open Tlahtōlli**](https://niftybacon.github.io/tlahtolli/) · **Version 1.4** · Open research and learning notebook

Classical Nahuatl dictionary and text reader with source-aware forms, research audits, indexed inflection lookup, and browser-local vocabulary review. The project is independently maintained and **not scholarly peer-reviewed**.

## What's new in v1.4

- **Momachtia · Study:** private spaced-repetition learning cards, Nahuatl–English or English–Nahuatl, due dates and CSV export.
- **Full JSON backups now preserve study history.** Previous v1.3 project backups remain importable.
- **Research requests:** turn an unknown word into a prefilled [GitHub issue](https://github.com/niftybacon/tlahtolli/issues/new) for evidence review.
- **Source-level improvements:** five field-specific evidence claims for the exceptional plurals of *calli*, *xōchitl*, *tēpetl*, *cītlalin* and the possessed *tēpetl* stem.
- **Release safeguards:** dictionary/HTML offline-seed consistency checks, verb-cell fixtures, evidence-source validation and JavaScript syntax tests in CI.
- v1.3 features retained: form detective, research audit, claim source locators, reader coverage, full verb tables.

## How publication works

The site loads `dictionary.json` and `paradigms.json` when opened or when the Sync button is pressed. The HTML includes an offline seed. The `version` field of the two JSON documents **must match**. Publishing requires a GitHub commit; the website does not read private ChatGPT conversations automatically. Existing locally edited words are protected during normal sync. No automatic sync of personal learning progress occurs between devices.

## Tests

```sh
python tools/validate.py
python tools/test_data.py
```

The structural validator is not linguistic peer review. The [editorial policy](docs/EDITORIAL_POLICY.md) explains why lexicon attestations, textbook paradigms and editorial inferences are tracked separately.

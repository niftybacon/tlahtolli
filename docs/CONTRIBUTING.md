# Adding an entry
1. Verify the headword, senses, historical variety, part of speech and original spelling using a named dictionary or grammar.
2. Give noun animacy and plural only when the source supports them. Exceptional inanimate plurals require individual evidence.
3. Cite forms separately as source-recorded, text-attested, grammar-derived, or provisional. Include URL **and** page/folio/dictionary-entry locator.
4. Record conflicting readings and uncertainty. Never call automatically generated forms historically attested.
5. Prepare a candidate JSON with `python tools/add_entry.py --candidate entry.json --dry-run`; run `--apply` only once it has been reviewed. Existing headwords must be edited manually—never silently overwritten.
6. Run `python tools/validate.py`, `python tools/test_data.py`, and the browser tests if available.
7. Review the Git diff, then commit all changed website/data files together. The website will fetch published changes when opened or on manual sync.

Lexical starting point: https://nahuatl.wired-humanities.org/

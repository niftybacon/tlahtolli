# Tlahtōlli — Living Classical Nahuatl Dictionary

A growing Classical Nahuatl dictionary and source-aware reading notebook. [Open the website](https://niftybacon.github.io/tlahtolli/).

## v1.3 — Research edition

- **Form detective:** analyzes existing indexed forms and subject/tense paradigm cells; does not invent unattested forms.
- **Research audit:** ranks missing citation evidence and exports a research queue.
- **Evidence locators:** attach page/folio/entry information to grammatical claims.
- **Reader coverage:** shows token indexing statistics and exports unknown tokens.
- **Important fix:** ordinary edits to entries preserve saved field-level evidence records.

## Publish an update

Modify `dictionary.json` and, if necessary, `paradigms.json`. Keep their `version` values identical. Run `python tools/validate.py`, review the data and its sources, then publish to `main`. The website checks for updates on opening or when Sync is clicked. Adding words in ChatGPT requires an authorized edit to the GitHub repository: the website does not read your chats.

## Evidence policy

A URL is a pointer, not independent verification. Distinguish dictionary lemmas, source-attested text forms, grammar-generated conjugations, alternative orthographies, and uncertain analyses. Attach **field-specific** notes and the exact location within the cited source. A morphological match does not prove a reading in a historical sentence. No specialist has peer-reviewed the current 44 entries.

The app keeps personal notes and reading passages locally in your browser. Back up the full JSON workspace before migrating browsers or overwriting personal edits. Sync preserves locally modified entries.

### Suggested reference works

- [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/) (Wired Humanities Projects, University of Oregon)
- [Launey, An Introduction to Classical Nahuatl](https://www.si.edu/object/siris_sil_970857) (Smithsonian bibliographic listing)
- [D. K. Jordan, Nahuatl Grammar Notes](https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html)
- [Pugh and Tyers, Highland Puebla Nahuatl morphological analyzer](https://aclanthology.org/2023.americasnlp-1.12/) (different variety; do not copy into Classical Nahuatl without validation)

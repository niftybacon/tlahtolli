# Tlahtōlli v2.0 · 88-word research expansion

[Open Tlahtōlli](https://niftybacon.github.io/tlahtolli/)

**Version 2.0 — 44 additional lexically documented headwords** (44 founding + 44 new = 88). New headwords have lexicon links and publication/page locators. The **reference atlas** covers eight reference collections and 22 individually linked historical-text occurrences; 14 witnesses come from this expansion.

## Evidence hierarchy and period labels

- **Online Nahuatl Dictionary:** confirms the lexical citation spelling and primary English sense with references to Molina (1571), Karttunen (1992), Lockhart (2001), etc. A dictionary link alone does NOT prove a noun's grammatical animacy, an unattested plural, or a particular textual parsing.
- **Early Nahuatl Library:** mid-sixteenth-century Coyoacan archival document (AGN Tierras 1735, exp. 2; Lockhart, *Beyond the Codices* Doc. 26). Records several observed forms, including *chilli*, *milli*, *tecpan*, *tecpancalli* and *xivitl*.
- **Gospel of Luke:** Mariano Paz y Sánchez, 1833, a **19th-century Puebla-region** Nahuatl translation (NOT automatically the same dialect or period as sixteenth-century central Mexico). Witnesses cite chapter and verse. This text may illustrate historical vocabulary, but cannot be generalized as precontact or early colonial usage.
- **Florentine Codex:** original eight linked folio references remain. They are not blanket grammatical proof.

The release preserves previous 44 headwords, 120 recorded forms, and 12 verb paradigms. Five newly added words have dictionary-recorded **full plural** forms; many other entries intentionally have no independently verified plural recorded, which **does not mean the word cannot be pluralized**. Animacy for new headwords is an explicit provisional working hypothesis based on meaning and flagged as unverified at the grammatical-claim level. Editorial names do not imply expert review.

## Maintain and test

Run `python tools/validate.py`, `python tools/test_references_schema.py`, `python tools/test_data.py`, `python tools/browser_smoke.py`, `python tools/test_references.py`, and `python tools/test_interlinear.py` before publishing. References and published dictionary/paradigms must share the same version; `index.html` also contains a matching offline seed.

`verified_44_source_index.csv` has the precise evidence review ledger and explicit limitations for every new entry. ENL and Bible.com are linked; no entire copyrighted chapter or archival transcription is republished.

The user’s reading passages, study records, edits and annotations remain browser-local. Back up your project JSON before changing browsers or devices. Data sync adds new published headwords while preserving local edits.

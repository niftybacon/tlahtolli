# Tlahtōlli v2.1 · Field-by-field source audit

[Open Tlahtōlli](https://niftybacon.github.io/tlahtolli/)

**88 Classical Nahuatl headwords, 672 claim-level research records.** The 44 v2.0 additions have had their lemmas and primary noun senses checked directly against the individual Online Nahuatl Dictionary entries; the older 44 retain their previously recorded evidence, with explicit review tasks for missing fields. This is AI-assisted source checking, **not specialist peer review**.

## Evidence principles

- An entry has independent records for headword, sense, part of speech, animacy, grammatical number, plural evidence, possession, and stem morphology wherever relevant.
- Source-located lexicographic or grammar claims are marked `dictionary`, `text`, or `grammar`, while remaining questions are `unverified` and speculative rules are `inference`.
- **162 records** reference a specific lexicographic or grammatical location; **510 records** remain unresolved. These are record counts, not an estimate of dictionary correctness.
- Exception: *tonalli*. Karttunen documents plural suffix `-tin`, but the cited entry does not independently attest a fully written plural `tonaltin`. Its previous full-word attestation label has been withdrawn. **This does not mean that the form is impossible**.
- Suffix-only evidence for `-tin` or `-meh` is recorded as a morphological pattern, not silently expanded to a whole-word historical attestation.
- Explicit dictionary plural wordforms remain for *conetl*, *ichpochtli*, *telpochtli*, and *namictli*. They are **lexicographically documented**, not independently verified on a manuscript folio here.
- Specially documented bound possessed/combining stems (e.g. *camatl*, *tequitl*, *namictli*, *maitl*) are labeled as bound, not standalone word tokens.
- Animacy remains a **working, explicitly unverified** grammatical classification for the 44 newly added words where nominal agreement and class behavior have not been independently checked.

## What appears in the app

Each entry's **Evidence · Sources** tab now contains a scannable **field-by-field evidence ledger**, with direct source links, page/entry locators, supported claims, and pending questions. The Research Audit displays claim-level source coverage for headwords, meanings, parts of speech, noun number/animacy, plural behavior, possession, and stems.

The document `claim_audit.csv` exports all 672 source-and-review records for external inspection. The corpus atlas, 22 existing witness links, interlinear reader, 12 verb paradigms, and local study/backups remain intact.

## Important historical-language caveat

The [Early Nahuatl Library](https://enl.wired-humanities.org/content/welcome-early-nahuatl-library) provides colonial documents and the [1833 Gospel of Luke](https://www.bible.com/bible/4612/LUK.1.NCI1833) represents a later regional translation; manuscript occurrence in either source is **not** itself a source-specific proof of noun animacy, paradigm, or one fixed meaning. Published sources also vary by period, region, and orthographic practice.

## Tests and future review

Run `python tools/validate.py`, `python tools/test_claim_audit.py`, `python tools/test_data.py`, and the browser test suite. The automated checks verify structure, evidence classification and data integrity—not historical truth. GitHub Pages updates dictionary data automatically for entries without protected local edits. Export a full JSON backup before major changes.


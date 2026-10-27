# Tlahtōlli Phase 3 — Scalable search and progressive results (2026-10-27)

The browser now uses a local substring index to narrow evidence-aware search
scoring for longer queries, without changing the ranking or whether a form is
attested, inferred or still unverified. For larger dictionaries, result lists
render 100 matches at a time with a **Show next** control while preserving the
total match count and currently selected entry. Synthetic-data browser
regressions test search parity, list paging, and index invalidation. The
published 88 headwords, 178 indexed forms, 12 verb paradigms and 674 evidence
records are unchanged. See the [Phase 3 technical guide](docs/PHASE3_SEARCH_SCALING.md).
Performance gains have not been timed on end-user devices.

# Tlahtōlli Phase 2 — Editorial data architecture (2026-10-27)

The dictionary is now maintained in separate authoritative [lexicon](data/lexicon.json), [morphology](data/morphology.json), and [historical evidence](data/evidence.json) sources. A deterministic [builder](tools/build_dictionary.py) reconstructs the **unchanged public dictionary and standalone offline HTML seed**, with CI rejecting out-of-sync outputs. All **88 headwords, 178 forms, 12 verb paradigms, and 674 claim records** are preserved. Read the [architecture and editing guide](docs/PHASE2_ARCHITECTURE.md). This is a code/data maintainability upgrade, not a new historical verification claim or a measured speed improvement.

# Tlahtōlli Phase 1 — Reduced startup downloads and faster interactive search (2026-10-27)

The published HTML retains all 88 headwords and 12 verb paradigms offline. On the website a cache-revalidated [release manifest](release.json) now avoids re-downloading already bundled dictionary/paradigm JSON when the edition is unchanged. Search input redraws are batched, preserving the detail pane when the selected headword is unchanged. See [implementation and compatibility notes](docs/PHASE1_PERFORMANCE.md). No lexical evidence classifications or locally saved personal edits were changed.

# Tlahtōlli v2.3.1 — Historical evidence reassessment (2026-10-27)

All 222 outstanding provisional/unverified field claims were inventoried and assigned individual evidence decisions and follow-up requirements. **16** gained source-located support, while **111** remain inference and **95** unverified. The 674-field ledger now contains **324 dictionary**, **129 grammar**, and **15 quoted historical-text** records. This is an AI-assisted research update, **not full historical verification or expert peer review**. See [full claim-by-claim reassessment](claim_reassessment_2026-10-27.csv) and [method and historical locators](docs/OUTSTANDING_CLAIMS_2026-10-27.md).

# Tlahtōlli v2.3.1 — Four additional located possessive forms

This patch adds **notlaxcal**, **noconeuh**, **nomil**, and **noteuh** as specifically located grammatical/historical occurrences, with manuscript date or grammar page in each evidence claim. There are now **674 claim records:** 316 dictionary, 128 grammar, 8 historical-text, 113 provisional inference and 109 still unverified. A located grammatical rule is not the same as independently attesting each derived form. No expert peer review is claimed.

All 88 lemmas, 12 verb paradigms and locally protected edits are preserved. Read [noun number and animacy distinctions](docs/NOUN_CLASS_AND_NUMBER.md). Download `claim_audit.csv` for field-by-field status.

# Tlahtōlli v2.3.1 — Morphology and noun-class review

The 349 open field claims from v2.2 were reassessed through the published Classical Nahuatl grammar of Launey and individually cited lexicographic and historical forms. The research ledger now contains **316 dictionary, 127 grammar, 5 historical-text, 113 provisional analytical-inference and 113 unverified records** (total 674). **Inferences are not verified lexical facts.** See [grammatical guide](docs/NOUN_CLASS_AND_NUMBER.md).

New historically recorded plurals: *tlatoani → tlatoque* and *teopixqui → teopixque*. The 88 lemma collection and all existing reading and study features remain available. The site synchronizes the published release and preserves browser-local personal edits. Always make a full backup before upgrading devices.

# v2.3.1 source-by-source evidence expansion

This AI-assisted pass checked the original 44 headwords against their Online Nahuatl Dictionary lemma, principal translation and lexical-class information, with exact entry sections and underlying works noted. It also added independent records for historically documented possessed stems, plural alternatives, verb stem changes and region-/period-bound plurals. **A dictionary citation is not independent manuscript attestation or expert peer review.** Inanimate/animate and number properties remain unresolved when these entries lack direct grammatical evidence. Local user edits are preserved by the published-data sync system.

This release contains 674 claim records: 313 lexical references, 8 grammatical references, 4 text-specific references, and 349 unresolved records. Counts are editorial tracking, not probability of correctness.

# Tlahtōlli v2.3.1 · Field-by-field source audit

[Open Tlahtōlli](https://niftybacon.github.io/tlahtolli/)

**88 Classical Nahuatl headwords, 674 claim-level research records.** The 44 v2.0 additions have had their lemmas and primary noun senses checked directly against the individual Online Nahuatl Dictionary entries; the older 44 retain their previously recorded evidence, with explicit review tasks for missing fields. This is AI-assisted source checking, **not specialist peer review**.

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


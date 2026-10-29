# Tlahtōlli — current translator and evidence inventory (October 29, 2026)

[Open Tlahtōlli](https://niftybacon.github.io/tlahtolli/) · [Editorial policy](docs/EDITORIAL_POLICY.md) · [Translator architecture (dated handoff)](docs/TRANSLATOR_CAPABILITIES_2026_10_28.md)

**Canonical release: `2026-10-29.9.0`.** Check `release.json` and three canonical editorial files before trusting dated snapshots. The dictionary still contains **2,142 headword records**: **225** individually entry-level source-checked, **187** still-provisional Kaikki verb candidates, **66** older ODN index-only, and **1,664** provisional nonverb candidates. **341 exact lexical/inflected-form records** are stored, with **12 unchanged 10 × 6 full paradigms** and **9,003** distinct field claims. These figures do not claim independent manuscript attestation or contextual machine-translation accuracy.

**Batch 09 — all vowel-initial verb candidates audited:** The canonical dataset contains **50** verb-labelled vowel-initial lexical identities, including **48** in the initial 268-verb archive intake. The [reproducible complete vowel-initial census](docs/VOWEL_INITIAL_VERB_INVENTORY_2026_10_29.md) distinguishes source-checked intransitive, object-bearing, reflexive, index-only and provisional entries. The **existing** Tēntli engine now applies the Classical subject-prefix allomorph **n-/t- immediately before a vowel** instead of ni-/ti- before consonants, according to Launey (2011) §1.2. Only *individually source-checked* intransitive entries gain this compositional present analysis, never unreviewed archive candidates. Historically dictionary-listed 1sg preterites permit cautious 2sg-subject hypotheses where the **exact** short base begins with the documented vowel. **Two** independently labelled Lockhart Class 2 pairs from the Batch 08 refused cohort, `iztlacati-/iztlacat-` and `ichtequi-/ichtec-`, gain lexeme-specific reviewed stem claims using their *existing* dictionary-listed `ōniztlacat` and `ōnichtec` (without creating new historical forms). **No other provisional or mixed-valency verb is promoted from its spelling.** All extra finite forms remain `hypothesis` and may not be reported as verified historical tokens, full paradigms or English translations. Source manifest: [two independently checked Class 2 pairs](research/batches/source_vowel_class2_batch09_2026_10_29.json); [complete census](docs/VOWEL_INITIAL_VERB_INVENTORY_2026_10_29.md); regression coverage: `tools/test_vowel_initial_verbs.js` and source-gated Batch 08 tests. Headwords **2,142**, full matrices **12**, exact indexed forms **341**, claims **9,003** remain unchanged. The Batch 08 inventory below is a historical pre-Batch09 snapshot.

**Batch 08 source-graded stem coverage:** one substantive release reviews **38** previously provisional historical verb headwords against ODN's quoted Molina/Lockhart/Karttunen entries. **34 exact newly source-listed forms** plus **two complementary historical spellings for previously reviewed verbs** are recorded; only **13** of those new entries meet the strong Class 1/Class 2 evidence gates. **Four existing Class 1 verbs** gain similarly constrained productive grammar, yielding **17** newly source-gated stem families. The **25** remaining reviewed verbs and **six separate refusals** are intentionally excluded from productive stem generalization. Generated wordforms are grammatical **hypotheses**, not additional attestations or verified English translations. [Complete Batch 08 evidence ledger](research/batches/source_stem_batch08_2026_10_29.json) · [Class 1 vs Class 2 audit and limitations](docs/SOURCE_STEM_CLASS_AUDIT_BATCH08_2026_10_29.md).

**Batch 07:** 1,664 additional nci-labelled Kaikki index candidates (1,552 nouns, 18 pronouns, 33 numerals, 40 adverbs, 14 adjectives, 4 particles and 3 interjections) enter *provisional lexical search only*. One consolidated release and PR: [frozen source manifest](research/batches/classical_archive_lexical_batch07_2026_10_29.json) · [source limits and audit](docs/MASS_LEXICAL_CANDIDATES_BATCH07_2026_10_29.md).

**Batch 05 mass verb candidates:** 268 distinct Classical-labelled Kaikki/Wiktionary archive-indexed verbs have been added to the canonical searchable inventory in one coordinated branch. They remain provisional, with zero newly verified stem classes, generated finite forms, new paradigms or independent historical accuracy evidence. Exact source rows, grade limitations and licensing: [batch 05 audit](docs/MASS_VERB_CANDIDATES_BATCH05_2026_10_29.md). Future bulk expansions should use one PR per substantive release, then squash merge after CI.

**Batch 06 productive verb evidence:** 43 formerly provisional Kaikki-labelled verb headwords gained ODN historical dictionary-level lexical reviews; 33 exact 1sg completed forms were recorded with individual Molina/Lockhart locators, and six documented Class 2 present/preterite stem pairs became eligible under the **existing** Tēntli rules. Generated forms remain hypotheses, not independent text attestations or English sentences. See [the batch 06 evidence ledger](docs/SOURCE_REVIEWED_VERB_BATCH06_2026_10_29.md). This was a single consolidated source pass, not 43 small PRs.

**Morphological inventory:** **12 complete 10 × 6 verb paradigm matrices (720 grammar-derived cells, not independent manuscripts)**, **341 stored lexical/inflected-form records**, and **9,003 individual field-level claims** with distinct evidence grades. The **36,543-row Siméon/Kaikki archive** is separate and unreviewed. Archive forms, historical spellings, grammatical hypotheses and independently attested tokens must *not* be conflated.

**One analyzer, not parallel systems:** `tools/morphology_engine.js` is the canonical Tēntli morphological engine. The clause processor is `translator-sentence.js` with `data/clause_grammar.json`; `translator-grammar-ir.js` represents agreement, clause and discourse alternatives without inventing referents. `translator-historical-morphology.js`, `translator-source-morphology.js`, `amoxcalli-archive.js` and manuscript study records are **evidence and comparison layers**, not substitute productive morphology engines. The existing Tēntli engine supports guarded, source-licensed present/preterite/future hypotheses without adding full paradigms for every headword. Proposed readings remain `hypothesis`, never lexicographic or manuscript attestations.

**Source-reviewed verb distinctions:** [tepoztia](https://nahuatl.wired-humanities.org/content/tepoztia) has source-spelled `tepuztia`, Molina's intransitive `ni` and preterite `onitepuztiac`; [tepoztehuia](https://nahuatl.wired-humanities.org/content/tepoztehuia) has `tepuzteuia`, transitive indefinite `nitla` and preterite `onitlatepuzteui`. Their specific stem classes remain **unverified**. `nonotza` remains index-only because overlapping lexical sources disagree on orthographic/valency distinctions. [Audit and limits](docs/VOCAB_BATCH04_VERB_SOURCE_REVIEW_2026_10_29.md).

**Batch 04 class audit:** All 80 previously index-only records were reviewed for verb-class eligibility: 14 source-backed verb classifications and ten recorded 1sg preterites were added; 7 ambiguous/insufficient verb-like items and 59 nonverb index entries remain unpromoted. [All 80 dispositions](docs/BATCH04_REMAINING_80_VERB_CLASS_AUDIT_2026_10_29.md). The existing analyzer also now admits source-labelled animate-indefinite `nite-` transitives as *hypotheses* only. No additional full paradigms were created.

**Further exact historical-form review:** `aztayoa` and `tecpayoa` now record two source-quoted Molina preterites; `tepozotinemi` records a source-spelled form from the edited 1559 Cuauhtinchan document. **All three remain index-only for verb-class verification**, because these source examples do not establish person-marked base classes. See [exact form review](docs/EXACT_UNCLASSIFIED_HISTORICAL_FORMS_2026_10_29.md). Existing PRs #64 and #65 have been reconciled and merged: exact archive grammatical tags now provide separately unreviewed clues, and question punctuation preserves token diagnostics. The archive bridge is not a second productive analyzer. A browser continuity fix keeps expanded source-evidence panels open when the archive finishes loading.

**Source-verified Class 2 addition (2026-10-29):** Two previously checked but stem-unverified verb entries now have individually cited Class 2 base pairs: `quiza-/quiz-` (Molina `oniquiz`, Lockhart p.231) and `polihui-/poliuh-` (Molina `onipoliuh`, Lockhart p.230). The existing Tēntli rules newly analyze **28 whole-word grammatical hypotheses** across these two classes (**0 before this source addition**), while leaving them *unattested as complete historical tokens*. The full indexed paradigm count remains 12. This update also fixes the previous **64 vs 54** overcount caused by treating `adverb` and other nonverb POS descriptions as verbs; the sentence source-gloss check now requires an actual verb POS. [Source distinction and negative tests](docs/CLASS2_STEM_AND_POS_AUDIT_2026_10_29.md).

**Next work, in priority order:** verify lexical POS/valency and independently documented present/preterite stems for more index candidates; expand only truly missing productive morphotactics; then improve integration with the existing shared grammar IR. Preserve exact historical spellings, unresolved ambiguities and source-era distinctions. The pinned 36-record/365-token Axolotl data is *development diagnostics*, not an independent held-out test; no approved gold translation pairs exist, and spelling matches must never inflate translation accuracy.

**Canonical build workflow:** edit `data/lexicon.json`, `data/morphology.json`, `data/evidence.json`; regenerate `dictionary.json`, `claim_audit.csv`, and the `index.html` offline seed using `python tools/build_dictionary.py --write`. Keep the separately maintained Tēntli engine and its HTML embed in parity using `python tools/build_morphology_engine.py --write`. Check both with `--check` and run existing CI. Publish all canonical/source/release documents with matching version strings (`release.json`, `paradigms.json`, `references.json`). Protect local user edits, study data and reader annotations.

**Paragraph integration:** supported clause sequences now preserve English choices with final punctuation and inside mixed paragraphs, up to 24 clauses. See the [bottleneck audit](docs/TRANSLATOR_BOTTLENECK_AUDIT.md). After JavaScript or translator-data edits, run `python tools/build_runtime_assets.py --write` and commit the updated `index.html` script URLs. The runtime identifier is separate from the dictionary edition.

---

## Historical release notes (dated snapshots; counts below are not the current inventory)

# Translation Desk v0.2 — evidence-aware research preview (October 28, 2026)

[Open Tlahtōlli](https://niftybacon.github.io/tlahtolli/) and select **Tlahtōlli · Translator** in the main navigation · [Corpus Stage 1 workspace](research/translation_corpus/README.md)

At this October 28 milestone, the translator was a **native tab within Tlahtōlli**, not a separate website. It indexed **115 Classical Nahuatl headwords**, their explicitly recorded historical spellings and sourced standalone forms, and **three source-linked historical passage candidates**. It shows bracketed lexical glosses, ambiguity/unknown-word warnings, and researcher notes with source links. These are **not AI-generated complete translations** and the three interpretive examples are **not cleared or approved for machine training**.

Stage 1 collection gates and testing: `python tools/validate_translation_corpus.py` and `node tools/test_translator.js`.

**Sentence/morphology bridge (development PR #26):** The existing sentence engine now accepts the existing canonical morphological analyzer as an optional third dependency. It can display an **exact source-listed finite verb form's recorded gloss** for an otherwise unsupported *single-token* clause, with linked evidence and an explicit unreviewed-context warning. This is not generalized past-tense sentence generation. For unsupported multiword clauses, it shows separately labeled, bounded **partial morphological clues** without declaring a complete translation. No unknown words are discarded and no hypothetical or approximate form is silently accepted as a sentence. Regression coverage includes historical 1sg preterites and source-specific completed forms, plus negative controls for negation, extra arguments, contradicted sources, and unverified morphology. The canonical [translator capability map](docs/TRANSLATOR_CAPABILITIES_2026_10_28.md) documents all current engines and limitations for future development sessions.

**Extended lexical evidence (experimental):** The Translator now loads the separately licensed 36,543-row Siméon/Kaikki archive when a Nahuatl analysis is requested and shows unreviewed comparisons beneath both recognized and unknown words. Exact source-form hits precede accent/macron-folded spelling alternatives, explicitly marked uncertain. Source sense labels, source-listed grammatical form tags (such as plural and canonical), and etymology remain visible when supplied. A matching source-listed form is explicitly distinguished from a matching dictionary headword; neither one is a verified historical inflection or a contextual translation. A dedicated **morphology cross-reference** compares existing proposed analyses to exact Classical Kaikki lemma-and-surface pairs, including source-listed form labels; it rejects conflicting noun/verb parts of speech and proposed spelling substitutions. This is unreviewed agreement between resources, **not** evidence that the parse, sentence, or period is correct; it never changes confidence grades or English sentence candidates. The shipped Kaikki source shard is covered by `node tools/test_archive_lexical.js` along with synthetic regression cases. Historical French OCR and modern-variety Wiktionary records are not silently promoted into the then-reviewed 115-headword dictionary. Archive comparisons never change the working translation gloss or train a model. A GitHub Actions workflow (`.github/workflows/translator-regressions.yml`) is configured to run all three tests on relevant pushes and PRs: `node tools/test_translator.js`, `node tools/test_translator_sentence.js`, and `node tools/test_archive_lexical.js`. The translator's analysis engine is maintained in [translator-engine.js](translator-engine.js), with the embedded tab interface in [translator-integrated.js](translator-integrated.js). The previous standalone `translator.html` link remains available for old bookmarks. Existing dictionary, reader, and SRS features remain unchanged.

---

# Stone and the mirror — one new historical Amoxtli passage (October 27, 2026)

Added a documented Florentine Codex Book 11 fol. 209v stone-to-mirror clause with original transcription, normalized reading, English interpretation and individual token analyses. The dictionary now has 115 headwords: three audited lexical records were added for **tēzcatl**, **cuepa**, and **ca**. The already-listed *tetl* (stone) and *chīhua* (make) are reused without overwriting or duplicating them. The text concerns stones crafted into mirrors; ideas of divination and seeing hidden things are cultural context **not** a purported translation of this passage. [Review note](docs/AMOXTLI_MIRROR_STONE.md).

# Amoxtli — four cited reading excerpts and nine source-led dictionary entries (2026-10-27)

Four compact historical text passages now appear in the reading desk, including Florentine Codex Book 11 and a Cantares Mexicanos excerpt identified in a UNAM edition. Nine new lexical entries are fully separated into their lexical, morphological and claim-level sources, for **112 total lemmas**. Previously saved personal passages and annotations receive the new public excerpts additively. No manuscript-level verification, universal morphology or new paradigm is inferred. [Research ledger](docs/AMOXTLI_EXPANSION_02.md).

# Historical spellings and interface polish (October 27, 2026)

Word overviews now display an evidence-aware **Historical spellings** section. Already linked transcriptions are shown with sources, including the Florentine Codex spellings `Jn` and `yn` for **in** (Book 1, folio 16r). These spellings are searchable. The rest of the dictionary, morphology, and study tools remain unchanged. See [the documentation](docs/HISTORICAL_SPELLINGS.md).

# FSRS-5 Stage 2 (opt-in)

This study panel now includes FSRS-5 scheduling (off by default to protect existing progress), independent vocabulary/reverse/conjugation retention targets, limited history-based calibration and 30-day forecasts. All data stays in browser localStorage, backed up with full-project JSON. Anki TSV contains note content and stable GUIDs, not scheduling history. [Full documentation](docs/FSRS_STAGE2.md).

# Study upgrades — locally customizable repetition and Anki TSV interoperability (2026-10-27)

Study settings now expose separate review/new ordering controls, timed optional answer reveal, real 30-day recall measurements, seven-day scheduled workload forecasts and stable Anki import GUIDs for forward/reverse vocabulary and conjugations. The classic scheduler introduced then was SM-2-family; current versions also offer optional **FSRS-5**. Anki manages scheduling for TSV-imported notes independently. Personal study records, settings, and review history remain only in this browser until explicitly backed up or exported. See [study settings and Anki export documentation](docs/STUDY_SYSTEM_V3.md).

# Advanced spaced repetition and Anki interoperability (2026-10-27)

The built-in vocabulary **and conjugation** study tools now share a configurable browser-local Anki-inspired scheduler: short-term learning/relearning steps, daily new/review limits, long-term ease and interval modifiers, leech suspension, sibling burying, independent forward/reverse recall, practice-only cram, grade-interval previews and one-step Undo. Three self-contained Anki TSV exports are available (vocabulary, reverse vocabulary, and 720 indexed conjugation prompts); Anki manages imported cards with **its own** review scheduler, and TSV does not transfer study history. Full-project JSON backups now preserve advanced settings and schedules. The classic scheduler from that release remains available alongside opt-in FSRS-5; see [advanced study and Anki guide](docs/ADVANCED_SRS_AND_ANKI.md).

# Expansion 01 — 103 sourced Classical Nahuatl lemmas (2026-10-27)

Fifteen new historical-lexicon entries add **nine nouns and six verbs**, with individual Molina/Karttunen/Lockhart or colonial-edition locators. Includes source-quoted special verb forms and bounded noun stem analyses; no fabricated 10×6 paradigms or manuscript-attestation claims. All original 88 lemmas, 12 verb models, and 674 original field claims are preserved. The [15-entry research ledger](docs/EXPANSION01_SOURCE_LEDGER.md) states exact evidence boundaries, including unresolved plurals. The advanced offline morphology engine can now recognize the new cited tokens.

# Advanced source-aware Classical Nahuatl morphology engine (2026-10-27)

Tlahtōlli now includes a bounded reverse morphological analyzer using all 720 indexed grammar-derived verb cells, evidence-specific lexical inflections, careful noun stem/absolutive segmentation, and guarded transitive/possessive hypotheses. It retains ambiguous analyses, labels rule generation as **unverified**, and explains what each matched morpheme does. The standalone HTML works offline, with the engine now maintained in `tools/morphology_engine.js` and checked against the embedded copy by CI. This does **not** increase the 88 headwords or imply manuscript attestation of generated forms. See the [engine's research boundaries and architecture](docs/ADVANCED_MORPHOLOGY_ENGINE.md).

# Existing-88-word historical research and advanced morphology (2026-10-27)

Three combining bases (calli, tlālli, tēpetl) are now supported by field-specific lexical locators and published colonial compounds. The unchanged 674-claim ledger now has 327 dictionary, 129 grammar, 15 historical text, 108 inference and 95 unverified claims: **203 remaining unresolved fields**. The [complete existing-88 research queue](research/phase4_existing_88_claim_queue.csv) and [source-review/analyzer methodology](docs/PHASE4_SOURCE_REVIEW_AND_ANALYZER.md) preserve the scope and limits. New morpheme-level segmentation of indexed noun headwords and verb paradigm cells is analytical, not independent attestation. Earlier dated audit files remain historical snapshots.

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


## v1.8 — Cleaner interface and clearer navigation

- Compact landing page with a visible English/Nahuatl search and shortcut.
- Expandable import, backup, export, and advanced analysis controls.
- Kept reader-to-form-detector navigation functional.
- Mobile-first spacing, keyboard accessibility and reduced-motion styling.
- No new speculative linguistic data; existing 44 entries, 120 form records and 720 finite-verb practice cells are preserved.
- New browser and HTML validator regression coverage.

# Changelog

## v1.7 — Interlinear annotation, provenance and conservative ambiguity (2026-10-26)
- Token-by-token interlinear research table inside the text reader, with safe TSV export and direct jump-to-token controls.
- Separate per-token evidence classes: unreviewed, editorial inference, lexicon consulted, or passage cited. Cited statuses require a URL and exact locator; none imply peer review or attested grammatical interpretation.
- Explicit competing indexed analyses where multiple lexical or paradigm readings are possible; suggestions remain unresolved until researched.
- Manual historical-spelling links clearly labeled **proposals**, not verified variants.
- Per-token annotation metadata survives the existing full-backup round-trip.
- New browser regression tests for source/locator validation, persistence, download handling, formula-injection protection and uncertainty display.
- The 44 headwords, 120 indexed form records, and 12 × 60 core paradigm cells remain unchanged.

## v1.6 · 2026-10-26
- Three concordance methods: exact form, dictionary headword including indexed candidate forms, and short normalized phrase matching.
- Optional source-URL filter for saved passages; URL presence is not historical verification.
- Export candidate labels and contextual search evidence to CSV.
- Indexed conjugation practice across the existing 720 paradigm cells, with core/all pattern selection, per-form review scheduling and local backup support.
- Research-audit coverage matrix showing field-specific citation gaps, requiring a URL and exact locator.
- Browser regressions for phrase and lemma lookups, evidence labels, conjugation practice and backup integrity.
- Historical uncertainty safeguards preserved; no additional forms claimed to be text-attested.

# Tlahtōlli — changelog

## v1.5 · 2026-10-26
- Conservative paradigm alignment: when possible, identify the subject prefix and show the unsegmented remainder, without claiming a full morphological parse.
- Dictionary filters for part of speech, noun animacy, and citation coverage.
- Searchable, exportable KWIC-style concordance across *locally saved* passages, with direct navigation to matching tokens and form analysis.
- Eight additional field-specific research claims with precise lexicographic/grammar locations: tlācatl (3), pilli (2), ōcēlōtl (1), nemi (1), cuīcatl (1). Now 13 in total.
- Research entry preparation tool, expanded validation fixtures, and automated Chromium browser smoke tests.
- No bulk corpus extraction, invented attestations, or language model calls from the website.

## v1.4
- Private spaced-repetition review cards and progress backup.
- GitHub research request links, fixed personal citation persistence, five field-specific citations.
- Integrity tests and documented editorial evidence policy.

## v1.3
- Form detective, research dashboard, reader token coverage and unknown-token CSV.

## v1.2
- Ranked dictionary search, evidence ledger, safe published dictionary synchronization.

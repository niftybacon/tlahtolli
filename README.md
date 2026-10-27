# Tlahtōlli v1.9 · Source Atlas and Bounded Morphology

[Open the live website](https://niftybacon.github.io/tlahtolli/).

## New in v1.9
- **Source atlas:** six described external source collections with attribution, chronology and rights guidance.
- **Getty folio witnesses:** eight researched folio locations recorded for ātl, calli, xōchitl, tlācatl, pilli, tēpetl, in, and auh. Each is evidence of a *written occurrence*, not automatically of its grammar or sense.
- **Source explorer:** Evidence · Sources on every entry shows Getty occurrences where checked; Research Audit shows the complete bibliography. General source-site links are marked for exploration only.
- **Limited morphotactic hypotheses:** proposals for a subject + object + indexed present-tense transitive stem, using the object-prefix inventory documented in Launey's grammar. Never marks a generated form historically attested.
- **Better verification:** new sourced grammatical claims require specific page/folio/entry locations. Grammar-derived inferences no longer count as independently supported field claims.

## How to add a genuine attestation
Check the actual text and original spelling at a historical folio. Add a record to `references.json` with lemma, recorded form, exact folio URL and locator, edition rights and a caution about what is supported. Do **not** copy rights-restricted transcript passages into the repository.

For a grammatical classification, use the entry's Evidence form with precise citation and source location. Historical examples and grammar paradigms should remain distinct.

## Verify
`python tools/validate.py`, `python tools/test_data.py`, `python tools/test_references.py`, and the GitHub Actions browser suite. Passing code checks does not constitute human scholarly review.

Current coverage: 44 headwords, 120 indexed form records, 12 finite-verb paradigms, 13 previously recorded claim-level citations, and 8 located historical-form references. Most fields still need independent investigation.

Personal notes, saved passages, edits and study progress remain browser-local; export a full JSON backup when moving between browsers.

# Phase 2 — Normalized editorial sources

Tlahtōlli now has **three independent, authoritative data sources** instead of
editing the 88-word published dictionary JSON as one giant object.

| Source | Authoritative contents | Excludes |
| --- | --- | --- |
| [data/lexicon.json](../data/lexicon.json) | Headword, variety, senses/translation, part of speech, source pointer, examples and editorial notes | Inflections, grammatical analyses, historical claims |
| [data/morphology.json](../data/morphology.json) | Stem, animacy/number labels, plurals, absolutives, possessives, grammar notes, specifically recorded inflected forms and \`formsEdited\` | Headword senses, claim evidence ledger |
| [data/evidence.json](../data/evidence.json) | Every field-specific \`claims\` record, review grade, URL, page/folio locator, conclusion, reviewer and check date | Searchable morphology or definitions |

Each record uses an ordered \`(word, variety)\` key. The build rejects missing,
duplicated, reordered or mismatched entries; all three input editions and
\`paradigms.json\`, \`references.json\` and \`release.json\` must share the same
version.

## Reproducible outputs and compatibility

\`tools/build_dictionary.py\` deterministically assembles the sources into the
existing public contract:

- **dictionary.json:** unchanged schema, fields, exact headwords and evidence.
- **claim_audit.csv:** regenerated from the evidence ledger in published order.
- **index.html** embedded offline dictionary/verb seed: regenerated only if its
  JSON data differs. The main application still opens directly from a single
  offline HTML file, and the Phase 1 small-release-manifest caching is retained.

**These three outputs are generated artifacts, not the primary editing surface.**
The browser still uses its original \`localStorage\` workspace, saved reader
notes, study progress, protected local edits, suppressed words and full backups.
No automatic upload or edit synchronization with public GitHub is introduced.

The normalized editorial files are published alongside the public outputs, but
the current browser application does **not** download all three again. It reads
the backward-compatible \`dictionary.json\` contract or its embedded offline
copy. Future scale-out or lazy-loading can build on this arrangement without
abandoning standalone offline mode.

## Editorial workflow

1. Change the appropriate canonical \`data/*.json\` file(s), never hand-edit
   \`dictionary.json\`, \`claim_audit.csv\` or the embedded HTML seed.
2. Update all three source \`version\` values **together** with
   \`paradigms.json\`, \`references.json\` and \`release.json\` if the published
   edition changes. Keep manifest headword/paradigm counts accurate.
3. Rebuild, check, and run tests from the repository root:

   \`\`\`bash
   python tools/build_dictionary.py --write
   python tools/build_dictionary.py --check
   python tools/test_phase2.py
   python tools/validate.py
   python tools/test_claim_audit.py
   python tools/test_data.py
   \`\`\`

4. Review the complete source and generated diff, including changes to
   uncertainty labels; merge only after GitHub Actions passes.

For adding a new source-checked lemma, \`python tools/add_entry.py
--candidate PATH.json --dry-run\` previews it; \`--apply\` creates entries in
all three source files, updates all edition versions, and regenerates outputs.
The command refuses to overwrite existing headwords.

## Research safeguards

- An \`inference\` is **not** an attested historical form.
- A dictionary or grammar citation is **not** automatically proof of manuscript
  occurrence or animacy in every sense.
- Text references still identify published contextual transcriptions, not
  guaranteed fresh inspection of original folios.
- Evidence classifications and form-level citations remain intact and separate.
- The build validates structural integrity and identity, not scholarly truth.

## Baseline acceptance test (2026-10-27)

The migration should generate **the same** 88 headwords, 178 forms,
12 verb paradigms and 674 individual evidence records (324 dictionary,
129 grammar, 15 historical-text, 111 inference, 95 unverified). No lexical
content change, default word ordering change, local edit migration, or runtime
schema upgrade is required for this architectural release.

**Scaling note:** this normalization is primarily a maintenance and correctness
improvement. It does not claim additional browser speed or make searching
thousands of entries inherently O(1); that needs measured indexing and delivery
work later.

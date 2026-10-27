# Phase 3 — Scalable browser search and bounded result rendering

Phase 3 builds on the **merged Phase 2 editorial architecture**. It changes only
the dictionary **runtime search and result-list presentation**, not the
authoritative linguistic data or the published JSON API.

## Browser-local search candidates

- The existing search engine still distinguishes exact headwords, dictionary-
  or text-cited forms, spelling variants, grammar-generated paradigms,
  provisional forms, stems, English senses, prefixes and fuzzy suggestions.
- On building the local search index, each word also contributes a set of
  two-character substrings from *each individually searchable field*. The
  inverted map points to candidate word indices, not to purported attestations.
- Queries of three or more normalized characters first select the smallest
  matching substring posting list, then call the **existing** evidence-aware
  `scoreEntry` routine only for those candidate entries. Shorter queries use
  the previous exhaustive scan.
- If candidate scoring finds no real matches, the original limited edit-distance
  fallback still examines all entries eligible under the user's active filters.
- Indexing includes ordinary plurals and all configured grammar-derived cells
  as search possibilities; it **does not upgrade** their historical status.
- Searches use the current browser-local `words` array (including user edits),
  and the index is rebuilt after save/import/public release sync invalidation.

The inverted list deliberately provides a conservative **superset** of potential
matches. Ranking, labels and suggestions remain the responsibility of
`scoreEntry`, so a substring index hit is not an attestation or a contextual
grammatical analysis.

## Progressive results

- The matching count still includes **all** hits after the original facet and
  variety filters and evidence-aware sort.
- The list initially renders at most 100 ordinary matches and offers a
  **Show next 100 entries** button to load further results.
- Query or filter changes reset the visible window. For continuity, an already
  selected match can appear additionally as a pinned visible row even when its
  rank lies beyond the first 100.
- Selection, details, source claims, reader passage notes, annotations and study
  progress retain their existing behavior. Browser-local backups and the
  standalone offline HTML file are unchanged.

## Verification

CI runs `python tools/test_phase3.py` in headless Chromium. The test adds
300 **synthetic** browser-only entries, checks list bounds/load-more/reset,
compares full results and ranking against the original exhaustive scoring
algorithm for exact, folded, form, meaning, prefix, short-query and fuzzy cases,
and tests index invalidation after a local edit. Existing browser, source
integrity and evidence tests continue to run.

The benchmark scope is correctness and scalability behavior, **not measured
speed**. At 88 published headwords users may see little measurable improvement,
while bounded DOM construction becomes more useful as the lexicon expands.
This phase does not introduce a network API, background upload, service worker,
server search, or automatic merging of uncertain morphological analyses.

## Operational notes

The editor still changes `data/lexicon.json`, `data/morphology.json`, and
`data/evidence.json` as described in
[Phase 2](PHASE2_ARCHITECTURE.md). No data-version bump is necessary for a
search-only HTML-code change because embedded dictionary/paradigm/reference
content and schema remain unchanged. Run the existing build --check step
before publishing.

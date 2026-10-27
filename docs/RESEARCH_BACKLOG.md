# Active research priorities

## Primary: audit the founding 44 entries

Only 13 specific claims have independently locatable references in the initial release. General dictionary links exist for many entries, but these do not independently support every part of speech, animacy classification, plural, or stem form. Use the Research audit tab to export a current per-word queue (including local edits).

Priorities:
- Audit exceptional inanimate/contextual plural entries (mountains, stars, colonial loans) against exact source spellings and historical usage.
- Recheck each noun's plural behavior and distinguish regular productive endings from lexically specific or personified plurals.
- Check all verb preterite and imperative stems. The 10 by 6 tables are *grammar-derived* and may differ by period, register and transitivity.
- Review possessive constructions with complete source examples, not just combining stems.
- Check vowel length (including distinctions potentially erased by macron-insensitive search).

## Engineering

- Review the new lemma-candidate concordance on actual historically sourced texts. Automatic matching is not syntactic or semantic disambiguation.
- Audit the 720 grammar-derived forms and especially the transitive fixed-object assumptions before treating the paradigm trainer as a grammatical authority.
- Maintain separate source and entry-level provenance; a passage marked "with source URL" is not independently manuscript-verified.


- Extend the corpus model to attach per-token original orthography, source folio/page and independent transcription provenance.
- Expand the morphological analyzer with an explicit finite-state rule set *only after* assembling source-backed tests; do not copy rules directly from a different modern Nahuatl variety.
- Implement stable lemma IDs, sense-level citations and explicit duplicate/renaming migrations.
- Improve keyboard accessibility and offline caching without interfering with update checking or leaking browser-private study records.
- Add a dedicated manuscript edition catalogue, respecting source licenses and transcription rights.

## External review

Independent scholarly review would be valuable for disputes, rare forms, and editorial orthography. Until then, use transparent uncertainty levels and treat the app as a research notebook, not a final authoritative edition.

## Annotation and historical-source research (v1.7)
- Evidence that a manuscript contains a spelling is distinct from evidence that a particular grammatical interpretation is correct.
- Cite edition + exact page, folio or line, rather than relying only on a generic dictionary URL.
- Record alternative analyses and leave uncertain contextual readings unresolved.
- The current TSV export contains local normalized tokens, not automatically aligned original manuscript tokens. A licensed corpus and true source alignment remain future research tasks.

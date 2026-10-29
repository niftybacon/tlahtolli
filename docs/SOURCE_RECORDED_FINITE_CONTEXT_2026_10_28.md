# Source-recorded finite verb clauses — 2026-10-28

This adds **new bounded structural coverage**, not another morphology integration engine or an automatic translation model.

## New behavior

The existing Tēntli engine already knows a few source-recorded finite forms outside the 12 full paradigm tables. Previously, the sentence parser primarily used these as isolated-token glossary clues, not as finite anchors in multi-token grammatical structures.

The existing sentence engine now checks an explicit, source-linked editorial admission file at `data/source_finite_context.json`. It admits two forms whose written surface, lexical source and canonical Tēntli morphology independently agree:

- `qujça` — verb `quiza`; Florentine Codex Book XI, folio 217r; **subject person unresolved**, 3sg nominal role conditional only.
- `tipolihui` — verb `polihui`; cited Cantares Mexicanos folio 35r in a secondary edition; **2sg editorial analysis, not an independently collated autograph**.

These are exact recorded forms only. Their spellings do not authorize arbitrary affix permutations, grammatical person generation or new unattested stem forms.

The project now generates **unverified, fully token-consumed structural alternatives**, with explicit source links, for:

- `itech qujça` — the exact two-word segment occurs in the already consulted Florentine excerpt; the possessive/relational referent and adjunct attachment are **not resolved**.
- `qujça itech` — same evidence-guarded construction in the opposite written order, *not* separately attested.
- `qujça in xochitl` and `in xochitl qujça` — the existing declarative third-singular noun-subject grammar creates **conditional** noun roles only. The person of `qujça` is **not independently established**.
- `cen tipolihui` and `tipolihui cen` — a source-recorded finite form with a separate dictionary-supported adverb. A compound phrase is *not* independently attested by those sources; modifier scope is unresolved.

These results use the already-existing sentence model and shared `translator-grammar-ir.js` graph, which stores candidate-only nodes and unresolved argument/modifier edges. The Translator interface displays the new analyses in a clearly marked panel. No English sentence is generated, no referent is resolved, and `complete:false` remains intact.

## Validation

- `node tools/test_source_finite_context.js` checks genuine Tēntli morphology, lexical/provenance agreement, structural coverage in both orders, IR correspondence, source-validation failures, and refusal of nonlicensed 2sg nominal subjects.
- `python tools/test_source_finite_context_browser.py` checks browser integration and explicit uncertainty wording; both are run by GitHub CI.
- Existing present/future finite composition, source-specific 1573 morphology, relative clauses and locative parsers remain unchanged.

The existing corpus diagnostic is still a deliberately narrower Node suite; it is **not** an independent or comprehensive accuracy evaluation. The longer edited Florentine phrase `injn itoca itech qujça xochitl, ioan tlapalli` is **not** now a supported complete translation. The exact `itech qujça` span is recognized but wider phrase attachments and `ioan` remain unresolved.

## Follow-up

The next genuinely new work would be source-graded relational attachment across a larger witnessed clause, plus more independently source-located finite forms and independent adjudication. Do not promote these hypotheses to historical translations or a gold benchmark.

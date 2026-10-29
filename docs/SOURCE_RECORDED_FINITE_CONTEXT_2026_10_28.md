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


## Subsequent increment — larger historical finite spans

The existing source-finite analyzer now composes a recorded finite token, a previously indexed relational word, and a noun **without inventing person agreement or the relational referent**.

- `itech qujça xochitl` is an exact contiguous, previously consulted **editorial word window** inside the existing Book XI 217r excerpt. The model now reports the finite predicate, relational adjunct, and bare noun in one **three-token structural alternative**, while explicitly leaving the noun's grammatical role unassigned. The visible source window is not a facsimile-certified parse or a verified interpretation.
- `itech qujça in xochitl` and `in xochitl itech qujça` are **four-token compositional hypotheses**, not separately attested word sequences. Their marked noun may serve as a subject **only if** the original finite verb's unresolved agreement proves compatible with third-person singular. The parser does not make that determination.
- The bare-noun window is admitted **only** if its exact original spellings occur contiguously in the existing canonical `data/passages.json` with a matching source URL and research-only status. Altering its words, provenance, status or source makes the analyzer abstain. The shared grammar IR independently verifies the witness metadata and refuses tampered claims.
- Existing source-finite, indexed-paradigm, locative, and comparative behavior are unchanged. English remains unavailable for these new structures. No bare-noun rule is applied to arbitrary substituted nouns.

This is **not** yet a complete structural analysis of `injn itoca itech qujça xochitl, ioan tlapalli`: the preceding possessed-name expression, following coordination and full clause relationships remain unresolved.

The next meaningful step should be connecting **already validated partial spans** to additional source-supported clause components with clear, non-overlapping bounds, not adding redundant verb paradigms or another grammar engine.

## Follow-up

The next genuinely new work would be source-graded relational attachment across a larger witnessed clause, plus more independently source-located finite forms and independent adjudication. Do not promote these hypotheses to historical translations or a gold benchmark.

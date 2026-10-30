# Tēntli Phase 1 — bounded semantic-preservation contract (2026-10-30)

**Status: new research-cli validation layer; NOT independently verified Nahuatl→English semantics, NOT new grammar, NOT public-site deployment.** Follows [Issue #95](https://github.com/niftybacon/tlahtolli/issues/95) and the [mandatory six-phase roadmap](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md).

## What was missing

The existing grammar IR checked sourced finite frames, agreement and relative roles and filtered unsupported English options. It did not independently re-run the canonical analyzer and English realizer to prove the *candidate being handed to a scorer* was unchanged from the corresponding source-licensed choice. A consumer could potentially alter option text, person, tense, negation, object identity or provenance after a grammar audit and still present it downstream as audited.

## What this milestone adds (without a second translator)

`translator-semantic-ir.js` exposes a versioned `TlahtolliSemanticIR.create(existingSentence, existingEnglish, existingGrammarIR).verify(input, analysis, graph, auditedComposition)` adapter. It:

1. Re-runs the **existing** source-aware sentence analyzer and the **existing** shared grammar IR and English composer on the exact supplied text.
2. Fails closed if the supplied original analysis/graph differs from the new canonical analysis or if English choices, join boundaries, status, evidence URLs, clause coverage or structured roles differ from the recomputed grammar-audited options.
3. Produces **read-only** semantic commitments *copied exclusively from licensed finite frames* for each surviving option: lemma, indexed subject person, tense, polarity, overt/indefinite/unresolved object status, original English object surface, relative-gap and matrix roles, location attachment and source citations. Referent identities, gender, contextual lexical sense and complete historical semantic truth remain **explicitly unresolved**.
4. Is used as a **second gate in the existing research-only** `tools/source_gated_english_bridge.js`, which refuses unsupported results rather than free-generating English or inventing evidence. Supported complete candidates retain their canonical wording; no dictionary, productive morphology, neural model, source corpus, Silver/Gold data or public translator behavior is changed.

This performs **cross-component consistency verification**, not natural-language entailment or correctness against an independent expert translation. The reference is the canonical grammatical model itself, so shared wrong grammar, sense selection or historical context can still yield a consistent but wrong English draft. `verifiedTranslation` is always false and `independentHistoricalAccuracy` is null.

The new adapter also deliberately avoids claiming that locative attachment is independently resolved; it only preserves the already admitted locative alternative. It never resolves third-person referents or upgrades morphology hypotheses to source-attested forms. Novel or missing structures remain refused.

## Mechanical regression and adversarial controls

`tools/test_semantic_ir.js` tests existing constructed finite, negated, relative, multi-clause and separate-sentence examples, the actual research CLI bridge, and deliberately tampered English/IR evidence: changed subject person, tense, polarity, omitted negation, object roles, relative-gap, invented lexical meaning, unlicensed URL, forged audit status, purported human verification, graph edges, grammatical tokens and connective. It tests abstention on unsupported inputs.

`translator-regressions.yml` runs the new test and existing `test_source_gated_english_bridge.js` on both pull requests and pushes, alongside earlier grammar and source tests. This tests software preservation, **not historical translation accuracy**.

## Remaining Issue #95 work

- Expand the semantic contract to additional source-licensed constructions only where the current grammar and English composer already support them; do not invent finite analyses for nested/conditional/possessed structures merely to widen a success count.
- Distinguish grammatical consistency from independent contextual lexical semantic assessment. Qualified reviewers and historical parallel evidence remain needed under Phase 2.
- Measure overhead on longer supported passages and consider a provenance-fingerprinted caching layer *only* with equivalent stale-evidence refusal tests.
- Complete fully independent reference-based semantic faithfulness evaluation only when an untouched approved Gold set exists. The present approved Gold count remains **zero**.

This is one source-gated preservation milestone on Phase 1; do **not** mark all Phase 1 or Issue #95 as completed on the strength of these constructed controls.

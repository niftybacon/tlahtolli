# Shared evidence-bounded grammatical representation (IR v1)

**Status:** Provisional parser-graph adapter. It does not constitute a verified historical translation, attested sentence, entity resolution, or new grammatical rule.

## Purpose

The finite-clause, in-relative, nested-subordinate, source-located possessed noun, and bounded discourse reference engines previously returned independent result arrays. `translator-grammar-ir.js` now composes those **existing** licensed outputs into one explicit node-edge representation without creating unseen parses or merging their separate alternative interpretations.

### Inputs and API

`window.TlahtolliGrammarIR.create(curatedDictionary).build(originalInput, sentenceModel.analyze(originalInput))`

It returns `schema: tlahtolli-grammar-ir-v1`, `nodes`, `edges`, `clauseIds`, `alternatives`, `counts`, `diagnostics`, and explicit unresolved statuses. `input` and clause-local tokens preserve source spelling. Nodes and edges are bounded (32 clause units, 240 nodes, 480 edges, 48 unranked alternatives), and identifiers are deterministic for an unchanged input and result. The original analyzer output is not modified.

## Graph entities

- **clause**: a bounded clause unit, original written tokens, and the analyzer's own completion state.
- **analysis-alternative**: a separately identified, unranked possible reading. Different syntactic interpretations are NOT collapsed into one coherent global parse.
- **finite-predicate**: indexed finite spelling, grammatical subject person and its subordinate depth. Repeated identical verbs bind by explicit positions in nested constructions.
- **nominal-mention**: an exact single written lexical noun token; when supported, its independently sourced possessed form and possessor person. Nominal possessor is an attribute, not an entity ID.
- **implicit-subject-slot**: an unresolved 3sg subject slot only when the existing grammar returned a unique supported implicit-intransitive analysis.

Graph links include `in-subordinate-dependency`, `terminal-relative-dependency`, `possible-relative-gap`, `possible-matrix-argument`, `possible-grammatical-argument`, `contains-nominal-mention`, `antecedent-candidate`, and `explicit-clause-connection`.

**Every edge has `status: candidate-only` and `notIdentity: true`.** A possible grammatical antecedent is a permissible lexical mention attached to an unresolved subject slot, not an assertion that two entities are identical. Unmentioned participants always remain possible.

## Evidence and refusal boundaries

The graph does not invoke a morphological generator. It can only link exact form analyses and already-present source-labelled alternatives. A plain noun mention requires a unique curated Classical noun lexical source, not a random URL from a grammar marker. A possessed noun retains the already validated source claim, exact original spelling, and documented owner person from the base analyzer. The nominal owner person can differ from the matrix and relative verb subject persons without contradiction.

Discourse links are created only from existing `antecedentProposals` or `discourseReferenceProposals` with correct clause distance, explicit 3sg↔3sg agreement, candidate-only status, and a single unique previous overt noun mention with the same cited lexical source. No link crosses unsupported or ambiguous syntax. The graph neither manufactures new antecedents for nested/relative fragments nor promotes an implicit subject into a new overt noun mention.

Unknown spelling, repeated ambiguous noun positions, missing claims, improperly sourced facts, unsupported person or role agreement, missing tokens, or unsupported clause structures abstain. Source URLs must be HTTPS. The original input and grammatical alternatives remain inspectable independently of the graph.

## Browser presentation

A separate **Shared grammatical representation** disclosure displays counts for clause units, nested dependencies, nominal mentions, and candidate antecedents, plus a small capped selection of structural edges. It is clearly labelled **NOT identity** or a historically certified sentence. The preexisting nested `in`, relative, possessed-argument, source-morphology, locative, and English presentation pathways remain independently visible.

## Concurrent development / integration order

The IR work lives on `feat/shared-evidence-grammar-ir-20261028`, initially based on the other AI's PR #41 head (`ab2a75c`). It is proposed **against that existing branch** so the other AI's actual nested/discourse changes are exercised in tests, not substituted or duplicated.

PR #41 predates merged #39's possessed relative heads. This IR branch reconciles **only** the small source-gated relative-head changes needed to connect those components, while preserving the other AI's nested and discourse functions. It does not force-push or edit PR #41.

Current `main` has separate #40 English reading composition; before merging this IR into `main`, reconcile those English assets and any new changes from the other AI. Run **both** CI suites on the final reconciled commit. Never merge the dependency branch's older UI wholesale over current `main`.

## Tests

- `node tools/test_translator_nested_in_discourse.js`: the other AI's nested and discourse behavior.
- `node tools/test_shared_grammar_ir.js`: combined real nested-with-possessed-head, separately sourced 1sg/3sg noun ownership, explicit 3sg discourse candidate, duplicate finite verb spelling, multiple role alternatives, tampered evidence, depth and bound checks.
- `python tools/test_shared_grammar_ir_browser.py`: end-to-end live Translator UI loading and explicit uncertainty labels.
- Existing noun possession, relative, manuscript, and full repository browser tests remain mandatory.

This is an architectural integration milestone. The independently reviewed held-out historical translation benchmark remains unavailable.

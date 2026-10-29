# Nested `in` clauses and bounded discourse mentions

**Status:** grammar hypotheses only. No manuscript attestation, trained coreference classifier, resolved historical entities, or verified English translation is claimed.

## Change in the sentence engine

The existing finite-token and headed-relative sources are reused; `nestedInProposals` is separate from `nominalInProposals`, `relativeClauseProposals`, and completed English candidates.

- A nested finite chain is parsed from **exactly written** `V in V in V`, with present/future person features taken from the existing indexed paradigms. Every nonterminal finite predicate must be a source-supported transitive `mati` or `itta` reading; intermediate clauses cannot be inferred from absent words.
- Maximum nesting: **three** explicit finite-subordination edges; the recursive parser has caps on input length and number of unranked alternatives. Longer or unsupported structures abstain.
- An embedded finite predicate may contain an explicit nominal head and `in`-introduced relative (`V in [V in noun in V]`). This terminal case reuses the original head-gap agreement checker: only agreement-compatible subject/object alternatives survive.
- Every proposal records `coverage`, `depth`, verb layer features, terminal node kind, provenance URLs, and a warning. Proposals never set `complete:true` or provide authoritative English.
- Coordinated `auh` clauses may contain structurally recognized nested units; `intla` retains a separate conditional boundary and does not imply a shared referent.

## Discourse-reference layer

`discourseReferenceProposals` is a bounded, non-committal **inventory of possible earlier overt subject mentions**, not actual pronoun resolution. Only a uniquely structured grammar-derived intransitive third-person singular subject frame licenses participation. A target has an **implicit 3sg subject**; prior candidates require an overt, unique, source-backed 3sg nominal subject. The lookback is at most three parsed clause units and stops at an unsupported or ambiguous clause.

- For an implicit subject following two separate overt nouns, **both** remain visible alternatives; neither is ranked.
- For multiple consecutive implicit subjects, none is promoted into a new referent or a verified coreference chain.
- An explicit relative, locative-complex, or subordinate predicate cannot silently act as an eligible simple-clause mention.
- Different grammatical persons do not link; unsupported clauses block lookback. Unmentioned participants remain possible even when only one overt candidate exists.
- `intla` conditionals do not expose discourse antecedent links across protasis/consequent.

**Data shape:** each unresolved subject slot has `toClause`, `pronounSlot`, `confidence:'candidate-only'`, `candidates` (including `fromClause`, lexical evidence and clause distance), `status`, `scope`, `alternatives`, and `note`. Retained legacy `antecedentProposals` remain a separate adjacent-pair heuristic.

## Tests and scope

`node tools/test_translator_nested_in_discourse.js` covers depth 2/3, rejected depth 4, missing markers, unlicensed matrices, agreement-filtered nested relatives, 3-clause lookback, competing visible mentions, unsupported-clause barriers, `intla` exclusions, and `auh` integration. Existing `node tests/in-clause-antecedents.test.js` stays in CI.

All fixture verb surface forms are intentionally synthetic. Passing a synthetic fixture is evidence that the parser enforces programmed constraints, **not evidence of historically idiomatic Nahuatl or translation accuracy**.

Sources inherited from the prior grammar layers: [Online Nahuatl Dictionary: in](https://nahuatl.wired-humanities.org/content/in), Michel Launey, [Noun Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550) and [Relative Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB). These references motivate categories and constraints; they do not independently validate the constructed test passages.

## Coordination with concurrent work

This change is **stacked on** `feat/in-clause-antecedent-links-20261028` (PR #35), not merged into `main`. It does not rewrite the ongoing declarative-grammar branch or the other agent's possession/agreement branch. Rebase and run combined CI when those changes integrate; do not force-push or overwrite other contributors' work.

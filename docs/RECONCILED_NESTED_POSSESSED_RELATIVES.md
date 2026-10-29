# Reconciled nested subordination and possessed relative heads

**Status:** conservative structural grammar proposals only. The result is **not** a verified translation, independently confirmed manuscript construction, or identified real-world pronoun antecedent.

## Current integration

The implementation begins from the recent `main` containing source-located possessed relative heads and the independent English composition engine. It merges only our bounded `in`-subordination and discourse candidate tracking; it does not roll back or override those contributions.

### Nested structure and possession

An explicit finite dependency can contain another finite predicate with an overt `in`-headed relative noun phrase. For example the diagnostic pattern

`nicmati in niquitta in iicxi in chōca`

is *a compositional test of the parser*, **not** a historical citation or a validated idiomatic sentence.

The outer `mati` indexed subject, inner `itta` indexed subject, source-listed nominal possessor on `iicxi`, and gap of the relative `chōca` are distinct features. **Do not unify the 3sg possessor with the 3sg relative subject.** The possessed nominal head comes only from the existing exact source-evidence resolver `resolveRecordedPossessed`, called by the existing `relativeInProposals`. Nested parsing reuses that function rather than inventing morphological forms or lower-quality fallbacks.

Structure is bounded (at most three explicit `in` dependency levels), all tokens must be consumed, and nonterminal matrices are limited to the current source-backed transitive licensing subset (`mati`, `itta`). Unlicensed or ambiguous heads are rejected; subject/object ambiguity in transitive relatives remains unranked.

### Discourse candidate tracking

The `discourseReferenceProposals` field gathers overt, unique, source-backed 3sg subject mentions within up to three earlier *simple* clause units. It does not rank them or assert actual coreference. Unsupported and ambiguous clauses block traversal. An implicit subject never creates or inherits an identity claim. Conditional `intla` clauses remain separate.

### Compatibility and validation

- Existing declarative syntax and indexed morphology, exact possessed-head evidence, English composition, and the previous `relativeClauseProposals` field are preserved.
- New tree and reference panels display evidence but avoid generated translations. Nested possessed heads display their lexical possessor explicitly, with a warning against confusing it with any finite verb subject.
- `node tools/test_translator_nested_in_discourse.js` and `node tools/test_nested_possessed_relatives.js` cover nesting bounds, exact token coverage, agreement, source evidence, duplicate lemma rejection, missing provenance, competing antecedents, and conditional isolation.
- `tools/test_translator_browser.py` checks the UI. GitHub CI must pass before merging.

## Coordination

Pull request #41 and earlier #35/#36/#38 contain older variants; they must **not** be merged over this newer branch. PR commentary is the shared integration log for parallel assistants. The fresh branch retains changes already merged by the concurrent contributor. Only a green head commit current with `main` can be merged.

Historical framework: [ON Dict. `in`](https://nahuatl.wired-humanities.org/content/in); [Launey, Noun Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550); [Launey, Relative Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB). These support grammatical categories, not the exact synthetic combinations.

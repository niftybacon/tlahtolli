# Nested Classical Nahuatl `in` structures and cautious discourse reference

**Status:** Source-guided syntax hypotheses, not verified translations, annotated referent identities, or claims of historical manuscript attestation.

## Integration with the latest declarative grammar engine

This version applies the nested-subordination and discourse-reference proposals to the current `main` engine, which now includes declarative clause patterns, source-crosschecked morphosyntactic analyses, and possessed noun agreement. It is **not** a direct merge of the earlier historical branch.

- `nestedInProposals` composes fully consumed finite `in` clauses with depth bounded at three explicit subordinate edges. Inner finite matrices are licensed only for the curated transitive verbs `mati` and `itta`; the mechanism uses preexisting source-backed finite paradigms.
- A terminal headed `in`-relative reuses the existing 3sg subject/object gap compatibility constraints instead of resolving grammatical ambiguity by word order.
- Each structural proposal exposes explicit layer features, nesting depth, terminal form, unranked alternatives, token coverage, citations, and a warning. The engine does not invent omitted words or output a complete English translation.
- Recognized nested finite structures may occur as segments of overt `auh` clause coordination. Conditional `intla` units remain distinct; no pronoun antecedent is inferred between a conditional protasis and consequent.

## Bounded discourse candidate tracking

The `discourseReferenceProposals` field is an **unranked inventory of possible antecedent mentions**, not a confident entity linker. A uniquely analyzed *simple* intransitive 3sg implicit-subject clause may refer to an earlier overt 3sg noun-subject mention within the preceding three clause units. Earlier pronoun-like implicit subjects never become new overt mentions. Unsupported syntax or subject/object ambiguity interrupts lookback.

When two different overt third-person nouns are available, both remain visible as alternatives; neither can be selected from agreement alone. Even one visible matching noun does not exclude an unmentioned discourse participant.

## Coverage and conservative boundaries

- Current nested syntax is restricted to full-token, overt `in` patterns and licensed finite paradigm cells. Subordinate negative scope, interrogatives, historical orthographic contractions, semantic clause-type selection, and free attachment are not derived.
- `complete` remains false for newly proposed nested structures. Neither accepted translations nor held-out accuracy measurements are created by these rules.
- Existing declarative grammar, locative analyses, morphosyntactic proposals, and possession/agreement outputs remain independent.
- Testing: `node tools/test_translator_nested_in_discourse.js`. Synthetic fixture verb forms are *not* manuscript quotations, and test success does not establish linguistic accuracy.

## Concurrent development

This reconciliation branch starts from `main` after the declarative and morphology/possessive integration. It supersedes the earlier stacked PRs #35 and #36 **as a proposed integration path**, retaining their idea without merging old conflicting file snapshots. Keep it isolated and await successful CI/review before merging. Avoid force pushes over the other contributor's changes.

Prior grammar references include [Online Nahuatl Dictionary: `in`](https://nahuatl.wired-humanities.org/content/in), Launey's [Noun Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550), and [Attributives and Relative Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/attributives-relative-clauses-copula-verbs-semiauxiliaries/E39B0BBF93FA2B6E7E906C8F6702EAFB). These are construction-level references, not independent validation of the synthetic examples.

# Source-bounded overt noun arguments in finite `in` subordination

**Status:** unranked grammatical proposals; not independently attested combined sentences, gold translations, or resolved pronoun identities.

## New coverage

Previously, the Classical Nahuatl translator recognized one finite `in` complement only if its dependent predicate was a single indexed verb, and its recursive parser likewise had no overt subject or object slot on terminal finite clauses.

`nestedInProposals` now also recognizes a finite complement with a fully written nominal argument, constrained by the **same declarative clause rules** already used by ordinary indexed finite clauses:

- `[licensed transitive finite] in [intransitive 3sg finite] in [curated noun]`, as in the illustrative parser fixture `nicmati in chōca in cihuātl` (dependent overt subject).
- `[licensed transitive finite] in in [curated noun] [intransitive 3sg finite]` (preposed dependent subject), using explicit token-position tracking.
- `[licensed transitive finite] in [transitive finite] in [curated noun]` (possible dependent object for 1st/2nd-person indexed subjects; both subject and object roles remain unranked for 3sg transitive forms).
- A dependent clause with two overt `in [noun]` expressions under existing 3sg-transitive patterns: all licensed subject/object alternatives are retained.
- A dependent source-listed possessed noun argument (including documented `nocal` and `iicxi`) when the **existing** exact claim-located possession resolver and its morphological evidence both accept it. A nominal possessor is separate from a verbal subject and cannot identify the subject or referent.
- The same terminal clause may be nested under an additional licensed `in`-introduced matrix, up to the current recursive depth limit of three.

These are **syntactic possibilities only**, not historical quotations or verified idiomatic sentence translations. The broad linguistic motivation for finite nominal clauses is described by Michel Launey, [*An Introduction to Classical Nahuatl*, Lesson 31: Noun Clauses](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/noun-clauses/F671D417C8996C3D444F793A9B73F550); argument-order flexibility is discussed in Dexter Sobkowiak's [2022 research on Classical Nahuatl verbal complexes and constituent order](https://coling.al.uw.edu.pl/wp-content/uploads/2023/11/Dexter-Sobkowiak-2022-PhD-dissertation.pdf). Neither source establishes that every generated combination is attested.

## Implementation

**No new hard-coded nominal agreement parser.** The terminal subordinate invokes `matchClauseRules(suffix, finiteAt, {possessed: resolveRecordedPossessed})`. Its noun spans, role alternatives, and person/valency checks come directly from the existing declarative pack. No additional dictionary guesses, spelling repair, omitted article insertion, or fluent English candidates are generated.

A proposal returns `terminal.kind='finite-with-arguments'`, the exact source-backed finite token position, the matched `ruleId`, and separately attributed `subjectArgument` / `objectArgument` structures with lexical and, when present, possessive source provenance. The complete syntactic hypothesis remains `complete:false` and `grade` explicitly says **NOT a translation**.

The shared `translator-grammar-ir.js` consumes these proposals, placing the verb at its actual written token index instead of assuming it always occurs two tokens after the previous matrix. Each argument becomes a source-bounded nominal mention with `possible-grammatical-argument` edges, `referentResolved:false`, and `subjectPossessorUnified:false`. Competing subject/object roles remain separate analysis alternatives.

The translator UI displays the embedded clause, matched rule, explicit nominal roles and lexical possessor separately.

## Explicit limits and regression strategy

Parsing still abstains on unsupported matrices, unmatched or extra tokens, unknown nouns, unverified possessive morphology, incompatible subject persons, negative subordinate scope, excessive nesting, and unknown clause attachment. Broad `in` semantics, discourse identity, and manuscript accuracy remain unresolved.

- `node tools/test_subordinate_clause_arguments.js`: synthetic regression fixture for noun-before/after-verb order, transitive ambiguity, two arguments, depth limits, source constraints, and grammatical graph integrity.
- `node tools/test_nested_possessed_relatives.js`: existing true-dictionary, source-graded morphological fixture extended to dependent source-listed possessed arguments, tampered evidence, duplicate lexical entries, and rejected non-recorded forms.
- `python tools/test_translator_browser.py`: rendered diagnostic panels, unranked roles, and possession separation.
- Both translator and full data/browser CI workflows must pass on the final head SHA before merging. No fabricated held-out translation results are introduced.

## Coordination

Work occurs on a branch based on current `main`, avoiding direct mutation of the concurrent assistant's branches. The pull request is the shared coordination and review log. If `main` gains overlapping grammar changes, reconcile and retest on a fresh base rather than force-pushing an outdated implementation.

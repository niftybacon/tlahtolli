# Possessed nominal heads in bounded Classical Nahuatl in-relatives

**Status:** an editorial, source-composed syntactic hypothesis. Not an independently witnessed sentence, complete translation, discourse reference resolution, or licensed additional noun paradigm.

## Grammar increment

The existing narrowly bounded in-relative parser (four written tokens, or five with a matrix finite verb) previously accepted only unique unpossessed curated noun citation forms. It now also accepts an **exact source-located possessed noun token** as the head, using the *same* reverse-morphology and claim-evidence gate that already governs the PNP agreement parser. This is reuse of source checks, not newly generated possession.

Illustrative proposals are `in nocal in chōca`, `in iicxi in niquitta`, and `niquitta in itoca in chōca`; **these combinations are not claimed as source-attested quotations or gold translations**.

A head's documented possessor is stored separately from:
- grammatical person of the finite *relative* predicate;
- grammatical person of any overt *matrix* predicate;
- possible gap role of the head (relative subject, relative object, etc.);
- referent identity and third-person discourse participants, **not resolved**.

The relative gap rules remain unchanged: 3sg intransitive subjects, non-third-person transitive object gaps, and both unranked possible roles for 3sg transitive predicates. An exact possessed form does not turn a 1sg possessor into a 1sg matrix or relative subject. The parser fully consumes each written token and refuses missing or extra nouns, unsupported punctuation, unlicensed negation, unknown verb forms and incomplete evidence.

## Source and vocabulary scope

The existing explicit possessive evidence register permits 3sg forms `iicxi` (icxitl) and `itoca` (tocaitl); unique source-recorded no- first-person possessed nouns retain their established guardrails. This feature does not admit `inxiuh` and `imitzcuinoan` as 3sg merely because they begin with i; those cited entries describe third-person plural possession. It does not automatically normalize historically source-recorded `ytlatqui` to `itlatqui`.

Every proposed source list includes the original noun's cited morphological source and the independent relative-clause grammar reference. These support the ingredients, **not the newly composed sentence as an attestation**.

## Concurrency and merge policy

This isolated branch begins at merge commit `0000834` (#37). The other developer's nested in-subordination PR #38 and coordination/antecedent PRs #35/#36 remain untouched. Both efforts modify the sentence parser. If one lands before the other, reconcile all insertions and behavior on a fresh current-main comparison and rerun *both* workflows; never force-push or auto-merge over changed code.

## Checks

- `node tools/test_relative_in_antecedents.js`: unchanged plain-head grammar and restrictions
- `node tools/test_possessed_agreement.js`: exact owner claims and source gates
- `node tools/test_possessed_relative_heads.js`: new 1sg/3sg head cases, ambiguity, input and source tampering, negative tests
- `python tools/test_morphology_clause_browser.py`: real browser labels and source links
- `node tools/test_multiclause_syntax.js`: independent auh/intla logic remains valid

No held-out, human-reviewed translation accuracy evidence was added.

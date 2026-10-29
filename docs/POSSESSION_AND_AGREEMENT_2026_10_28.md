# Exact possessed nouns and independent finite agreement

**Stage:** Source-located construction hypotheses. Not historical translation accuracy, a productive possessive generator, or human-reviewed manuscript reading.

## Concurrent development and reconciliation

This work originates on a unique branch from main commit 800b024, which already includes finite-verb+locative construction analysis and overt auh/intla multi-clause proposals. It reconciles prior grammar/morphology draft PRs #30 and #31 without replacing the newer main sentence engine or UI. Do not update any developer's existing branch or merge the drafts separately without reviewing their shared history. Before merging this PR, compare the current main SHA and run CI on any rebased/reconciled changes.

## Source-constrained PNP grammar

The editable file data/clause_grammar.json now has 16 rules: the prior 10 finite-clause patterns plus six **PNP** patterns for bare or written-in-marked possessed nouns (either before or after the finite verb). They share the same validated valency, subject-person and role-assignment interpreter but are **never used** to produce complete English sentence candidates.

The first implementation recognizes only complete, explicitly source-located and exact **no- (1sg possessor)** forms in the curated dictionary, such as nocal, nocuīc, noxōchiuh and noteuh. Each form requires a located possessed-form claim, exact canonical lexical morphology, a matching original written surface, cited locator, matching source URLs and unambiguous lemma identity. Exact dictionary word matches alone are insufficient. The morphological analyzer's guessed **analogy** forms and unreviewed records cannot pass. Forms with ambiguous i-/in-, or a modern-dialect substitution, do not automatically acquire a 3sg/3pl interpretation. The existing 1573 totlal source-specific analysis stays separate; it is not silently turned into a general productive to- rule.

Each proposal explicitly separates:

- noun possessor: the nominal prefix's 1sg feature (e.g., no-);
- verb subject: the person indexed in the *finite* verb (1sg, 2sg, 3sg and so forth);
- verb object marking and possible argument role of the possessed NP;
- evidential grade: exact recorded nominal form + indexed or grammar-derived finite cell + cited editorial grammar construction;
- unresolved grammatical attachment, contextual senses, discourse identity and actual historical occurrence.

Therefore the analysis **does not require noun possessor and verb subject to match**. A verb marked 2sg may contain a source-recorded noun with 1sg possessor; that is not evidence of co-reference. For third-person transitive verbs with one overt possessed NP, possible subject and object roles remain separately visible. Intransitive non-third-person verbs do not acquire a new overt third-person subject by force.

The system also exposes provisional links with exact canonical nonpresent finite forms from selected rows already supported in the morphology bridge. These are **not** full English translations. Incomplete or unexpected words, unsupported negation, unlabeled spelling substitutions, source tampering, unsourced nouns and extra arguments must fail closed.

## Data and workflow boundaries

The 36,543 supplementary records remain unreviewed lexical aids and do not automatically establish grammatical rules. No word forms, corpus training labels, human review status, manuscript interpretations or translation scores are added. The standalone historical gloss and existing multi-clause/locative behavior remain unchanged.

Run:
- node tools/test_translator_sentence.js
- node tools/test_declarative_grammar.js
- node tools/test_morphology_clause_bridge.js
- node tools/test_possessed_agreement.js
- node tools/test_multiclause_syntax.js
- node tools/test_complex_locative_clauses.js
- python tools/test_translator_browser.py
- python tools/test_morphology_clause_browser.py

## Research direction

Next investigate independently documented possessed-noun forms beyond first-person no-, including ambiguities with historical in and plural possessors. Those cannot be admitted by guessing a prefix onto a stem. The following larger steps are verb-object agreement with more explicit arguments, nominal modifiers, finite locative attachment with possessed NPs, and source-supported subordinate/relative clauses with clause-local scope.

Every construction needs positive and adversarial negative evidence, record-level provenance, review of original orthography, and a human-reviewed unseen corpus before any reliability score can be reported.

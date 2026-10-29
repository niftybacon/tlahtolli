# Shared grammar IR: reading-local agreement and discourse-scope audit

**Status:** Engineering integrity checks on existing finite, relative, possessed-noun, and discourse proposals. **Not** a new Classical Nahuatl grammar, historical attestation, translation accuracy claim, or pronoun identity resolver.

## Why this is not a second parser

The shared graph (`translator-grammar-ir.js`) already adapts existing **source-bounded, explicitly alternative** analyses. This increment adds an internal `agreementAudit` and strict fail-closed guards **inside that same graph producer**, without editing the underlying canonical sentence analyzer, its editable clause rules, the English composer, or the UI.

The new `agreementAudit` returns `checked`, `accepted`, bounded `rejected` reasons and a cautionary status. Counts are about **syntactic admissibility of candidate graph edges**, not frequency, historical correctness, translation accuracy, or likelihood. Every emitted edge remains `candidate-only` and `notIdentity: true`.

## Local grammatical constraints

- **Relative subject gap:** requires the relative finite verb's indexed subject to be **3sg**. The head noun's **possessor** person is *not* the head noun's grammatical person and never substitutes for it.
- **Relative object gap:** requires a **transitive** relative finite reading. Both 3sg transitive gap alternatives survive if each passes the original rule.
- **Matrix subject role:** requires the matrix verb's indexed subject to be **3sg**.
- **Matrix object role:** remains permitted only where the original canonical relative constructor proposed it. The IR does **not** independently recompute matrix transitivity because the existing relative matrix frame does not export valency. Do not treat this as an independent valency certification.
- **Possessed-noun subject argument:** requires the indexed finite verb subject to be **3sg**.
- **Possessed-noun object argument:** requires the transitive `indexed fixed 3sg` object classification already exposed by the source-bounded morphology/finite parser.

These rules are applied **before** an IR reading alternative or argument edge is emitted, so forged role metadata cannot create an apparently licensed edge or alternative.

## Cross-clause safety

An existing antecedent proposal is accepted into the graph only when its preceding clause itself independently yields a **unique full-coverage, overt 3sg nominal subject** with a unique curated lexical citation. A noun that was only an object, a relative head, or a source-recorded possessor is never promoted into an overt subject mention. The later implicit subject slot must itself be supported by the original finite grammar.

No candidate may jump across an intervening unsupported, ambiguous, relative, nested, or complex clause. Distance remains bounded at three clause units. The original proposal still must identify 3sg↔3sg and carry `candidate-only` status; an attacker-inserted alternative source or grammatical label is not sufficient.

The checker preserves unresolved identities, unmentioned possible third-person participants, separately scoped matrix/relative subjects, and separate nominal possessor features. It **never** resolves two mentions to one entity or uses an owner prefix as a pronoun antecedent.

## Regressions

`node tools/test_grammar_ir_agreement_audit.js` covers:
- positive reversible subject/object gaps for a third-person transitive relative;
- forged 1sg relative subject gaps and intransitive object gaps;
- forged 1sg possessed-noun subject roles and intransitive object roles;
- distinct third-person noun possessor vs first-person finite verb subject;
- real source-cited overt 3sg antecedent vs forged relative-head antecedent;
- forged references across unparsed clauses;
- forged subject links from prior overt objects;
- no promoted referent IDs and deterministic graph structure.

`tools/test_shared_grammar_ir.js` and the rest of the original translator regressions must continue to pass. GitHub PR verification additionally runs full browser/data CI.

## Concurrent development boundary

This change starts on main merge `a6a5a8a`, the shared IR baseline (#43). The other AI's PR #44 updates editable English realization, location attachment, the translator UI, and the full-data workflow. This branch changes **only** `translator-grammar-ir.js`, one new graph test, the translator-only CI workflow and this documentation. In particular, it does not touch `translator-integrated.js`, `translator-english.js`, `translator-sentence.js`, or the data/browser workflow currently affected by PR #44.

If PR #44 merges first, compare current main, reconcile if necessary and rerun both CI suites on the final commit. No force push or merge on an unchecked moving base.

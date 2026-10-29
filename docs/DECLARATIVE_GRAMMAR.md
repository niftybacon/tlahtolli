# Declarative Classical Nahuatl clause grammar (stage 1)

**Status:** source-bounded architectural refactor; no claim of improved historical translation accuracy, expanded morphology, more vetted headwords, or new manuscript attestations.

## Why it exists

A 36,543-record lexical archive is not a sentence grammar. The curated dictionary, archival dictionary lookup, morphological analysis, clause construction, and English realization are distinct processes. Previously the sentence engine contained a procedural verb-location / noun-phrase scanner and an assignments branch that determined third-person subject and object readings. Adding another construction required altering this loop, creating opportunities to discard words, force word order or silently resolve ambiguity.

## Canonical editable rules

The file **data/clause_grammar.json** defines 16 finite clause construction patterns (10 established finite patterns and six structurally provisional possessed-NP patterns). Each rule has:

- **sequence:** ordered sequence of V (one exact indexed present/future finite verb cell), NP (written in + a unique curated Classical Nahuatl noun citation spelling), or PNP (an exact source-located possessed noun form, optionally preceded by written in, never an analogical guess). PNP rules only produce provisional possession/role analyses, not English translations.
- **valency:** any, transitive, or intransitive, checked against the existing paradigm transitivity flag.
- **persons:** indexed subject/person numbers: 0=1sg, 1=2sg, 2=3sg, 3=1pl, 4=2pl, 5=3pl.
- **roles:** none, subject, object, either, or both. Either and both enumerate competing third-person subject/object assignments rather than choosing by position.
- **source_url and evidence_status:** a grammar citation and explicit notice that these are editorial formalizations, not independently witnessed utterances.

These construction templates are backed by documented grammar ingredients, not individually attested sentences or license to take archived dictionary meanings as verified contextual translations.

## Interpreter behavior

The sentence engine validates the entire pack, requires one indexed finite verb, full token coverage, bounded noun phrase slots, compatible person, valency and role semantics, and rejects duplicate or invalid rules. Unknown slots, unlicensed role combinations, modified evidence status, malformed metadata and unsafe source URLs cause the whole pack to fail closed. No partial rule pack is quietly used.

The existing source-listed finite-form bridge, 1573 agreement proposals, comparative fragments, and locative subsystem are not promoted to full translated sentences.

The Translator tab requests the JSON rules alongside the dictionary. The two-argument TlahtolliSentence.create(dictionary, paradigms) API remains usable offline using an in-module seed executed by the same rule interpreter. It is not a second parser. The configured and built-in rule seeds must remain in parity until offline bootstrap can be generated from canonical rule data.

**The first pack intentionally preserves existing supported constructions.** It does not translate all 720 grammar-derived forms, unreviewed archival records, or arbitrary colonial sentences. It makes future evidence-licensed grammar expansion maintainable.

## Extending responsibly

1. Locate independent Classical-period grammatical references and original positive/negative evidence. Do not claim an example already consulted during development is an unseen test.
2. Check whether a construction fits V and NP slots. Possession, modifiers, incorporation, subordination and discourse require additional analyzer capabilities, not fraudulent slot labels.
3. Add or revise JSON rules with source URLs, preserving 1pl/2sg and third-person argument ambiguity. Possessor agreement never automatically forces verbal subject agreement.
4. Add positive and negative engineering regressions and browser checks. Review the diff on a feature branch.
5. Before claiming translation accuracy, obtain human-reviewed, legally usable, independently held-out document-grouped historical passages. At present translation_accuracy remains null.

## Checks

- node tools/test_translator_sentence.js
- node tools/test_declarative_grammar.js
- node tools/test_source_morphology.js
- node tools/test_locative_relations.js
- python tools/test_translator_browser.py

The existing editorial evidence policy and independent evaluation readiness protocols still govern grammar sources and translation claims.

## Reconciliation with contemporaneous main

The reconciliation branch was cut from main commit 800b024 (which includes
finite+locative clause proposals and overt auh/intla multi-clause syntax). The
original declarative parser and the nonpresent morphological bridge were
transplanted into that source without replacing those main additions. Existing
finite+locative and multi-clause tests are required for a safe integration.

The original PR #30 and #31 remain open and unchanged while this comprehensive
branch is reviewed; do not merge them separately without reconciling history.
The other concurrently active developer should keep its own branch and review
new main changes before opening a competing PR. GitHub Actions success indicates
software behavior checks, not historical translation validity.

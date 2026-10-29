# Stage 2 — indexed morphology meets declarative clause grammar

**Status:** grammar-derived structural hypotheses; no generated English translation, new corpus attestations, or verified translation accuracy.

## What is new

The canonical reverse analyzer indexes 720 grammar-derived cells (12 paradigms × 10 tense/mood patterns × 6 persons). The existing complete sentence parser handles indexed present and future rows (0, 3). This bridge can **provisionally combine** exact indexed forms from five other rows with noun phrases using the **same** editable clause grammar interpreter:

| Row | Pattern | Output |
| --- | --- | --- |
| 1 | Preterite | Structural proposal; no English sentence |
| 2 | Imperfect | Structural proposal; no English sentence |
| 4 | Conditional | Structural proposal; no English sentence |
| 5 | Pluperfect | Structural proposal; no English sentence |
| 6 | Habitual/quotidian | Structural proposal; no English sentence |

This makes 360 additional grammar-generated cells eligible for investigation, **not 360 independent manuscript attestations** or translations. Not all 360 can combine with current one-/two-noun phrase rules. Imperative, past optative, admonitive and vetitive rows (7–9) are excluded because mood/person licensing requires additional independent grammatical checks.

## Gates and behavior

An analysis is only accepted when the canonical morphological provider returns a candidate of kind Indexed conjugation with paradigm evidence; exact written form, lemma, person, row, class, source URL and object/transitivity category must also match the published paradigm matrix. Orthographic substitutions, guessed productive transitive prefixes, added augments and hypothetical possessives cannot pass.

The verb must have a unique curated Classical Nahuatl lexical record. The configured declarative grammar must consume **every written token** under its existing valency and agreement constraints; nouns are only the unique, source-linked curated citation forms introduced by written in. Both third-person subject/object assignments remain visible when ambiguous. Unknown words, unsupported noun forms, additional arguments and unsupported word orders cause rejection, not guessed completion.

This output is a separately labeled **Indexed morphology + clause grammar (NOT a translation)** panel. It preserves source links, exact verb surface, proposed grammatical pattern, lexical meaning possibilities, noun links and alternatives. It neither sets sentence complete=true nor generates an English sentence. Unsupported negative constructions remain unsupported; prior present/future negation is unchanged. Isolated exact source-listed historic finite-form glosses retain their prior, narrower behavior.

The accompanying data source is grammar-derived, not verified in a codex, and the independent held-out benchmark still has zero approved examples. Do **not** call diagnostic coverage a translation accuracy score.

## Validation

- node tools/test_morphology_clause_bridge.js
- node tools/test_declarative_grammar.js
- node tools/test_translator_sentence.js
- python tools/test_morphology_clause_browser.py
- python tools/test_translator_browser.py

This feature branch is stacked on PR #30, the declarative parser. Main also includes newer finite-locative context features. Those must be reconciled before merging to main, with the complete suite rerun.

## Next evidence-bound milestone

Integrate documented possessed noun phrases and agreement constraints from independent Classical-era texts, preserving first-person plural versus second-person singular ti- readings. That requires new morphological NP slots and positive and negative documented evidence; never silently treat a dictionary hit or translated historical edition as training gold.

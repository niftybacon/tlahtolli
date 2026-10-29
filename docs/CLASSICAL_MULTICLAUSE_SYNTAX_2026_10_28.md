# Classical Nahuatl multi-clause syntax: overt coordination and conditional marking

**Implementation:** `translator-sentence.js` / `translator-integrated.js` — October 28, 2026.

**Review status:** bounded historical grammar proposal. This is **not** complete Classical Nahuatl discourse translation, independently validated clause-boundary segmentation, approved model training text, or measured accuracy.

## Historical justification

1. **`auh`**: The [Online Nahuatl Dictionary entry](https://nahuatl.wired-humanities.org/node/171956) cites Alonso de Molina (1571 II f. 9r) and Carochi (1645, Lockhart translation 2001 pp. 458–61, 498). It is an overt marker that can begin a new independent statement, continue discourse or introduce contrast. English values **and/but/well are not interchangeable** and cannot be chosen without contextual evidence. Another [historical discussion of Classical Nahuatl coordination (Sobkowiak 2022, citing Andrews 2003)](https://coling.al.uw.edu.pl/wp-content/uploads/2023/11/Dexter-Sobkowiak-2022-PhD-dissertation.pdf) notes that unmarked juxtaposition was also productive, but that fact does NOT license silently inserting a coordinator into arbitrary adjacent words.
2. **`intla`**: [Online Nahuatl Dictionary `intla`](https://nahuatl.wired-humanities.org/content/intla) records Molina (1571 II f.39r), Karttunen (1992 p.106), Carochi (1645, English edition 2001 p.504), and Lockhart (2001 p.220): conditional conjunction *if/when*. [Michel Launey, *An Introduction to Classical Nahuatl*, Lesson 34](https://www.cambridge.org/core/books/abs/an-introduction-to-classical-nahuatl/conditions-more-particles/76A81C0D005DA60A951D4B578416020A) documents conditional protases and their various tense/mood combinations. **Present-tense verb recognition alone does not verify the modal or semantic correctness of a full historical condition.**
3. **Negative conditions**: Launey explicitly documents **`intlācamo`** and does not license automatic **`intla ahmo`** as the corresponding subordinate form. The new parser deliberately refuses that unverified sequence rather than generating the wrong rule.
4. **`ihuan`**: [Online Nahuatl Dictionary `ihuan`](https://nahuatl.wired-humanities.org/node/172223) attests *and/with/along with*, noting its origin as the possessed form of a relational element. **This phase does not treat it as an unambiguous two-finite-clause boundary**; noun-phrase coordination is a distinct problem.

## New source-grounded parser

When a literal, supported marker is present, `TlahtolliSentence.create(...).analyze(text)` produces a separate **`multiClauseProposals`** collection:

- **Explicit coordination**: `[supported finite clause] auh [supported finite clause]`, with optional comma immediately before the coordinator. A bounded third clause with another `auh` is allowed.
- **Delimited condition**: `intla [supported finite antecedent], [supported finite consequent]`, also supporting a semicolon separator. This is **a visible segmentation aid**, not proof of original manuscript punctuation or true conditional mood. Negative `intla ahmo`, nested `auh`, and alternative orthographic forms have no automatic acceptance.
- A *supported finite clause* means either an existing fully indexed, grammar-derived simple clause candidate, **or** an existing, fully consumed finite-verb + source-linked relational-locative structure. Source-listed isolated English glosses, morphology-only clues and standalone noun/locative fragments do **not** count.
- All segments must be individually and completely covered; no interpolation of missing words, skipped particles, omitted antecedents, inferred shared subjects, or upgraded hypothetical translations.
- Each segment records its written words, finite-analysis type, alternative grammatical readings, indexed subject-person possibilities, and optional explicitly written locative.
- The outer multi-clause relation is always **`complete:false`** and is independently labeled **NOT an English translation**. The individual simple-clause analyses retain their existing statuses, but their combination is not a verified coherent translation.
- When adjacent supported finite+locative clauses literally repeat the same source-spelled location, the existing `contextLinks` can report this observable textual repetition. It **never** invents an inherited place, prove people identical, or resolve pronouns across sentences.

## What this adds without overclaiming

| Research-style test input (not historically attested as a complete phrase) | Output |
|---|---|
| `ninemi auh nichōca` | Two finite grammatical units; `auh` links independent discourse; unspecified “and/but/well” force |
| `ninemi auh nichōca auh niquitta in cihuātl` | Three finite units, two exact coordinators, still not a fluent English sentence |
| `intla ninemi, nichōca` | A candidate antecedent–consequent structure with explicit comma and unresolved condition type/mood |
| `ninemi calli itic auh nichōca calli itic` | Two bounded finite+locative clauses and explicitly repeated written `calli itic` |
| `intla ninemi, niquittaz in cihuātl calli itic` | Simple finite antecedent with source-graded finite+locative consequent |
| `ninemi ihuan nichōca` | No multi-clause claim (possessive/conjunctive scope of `ihuan` requires separate research) |
| `intla ahmo ninemi, nichōca` | No multi-clause claim; negative conditional sequence not licensed |
| `ninemi auh onicoch` | No multi-clause claim; an isolated recorded historical gloss is not a verified independently parsed finite clause |
| `ninemi nichōca` | No multi-clause claim; unmarked coordination is documented but clause segmentation here is not independently established |

## Testing

- `tools/test_multiclause_syntax.js` tests both markers, a three-clause sequence, 12 verb paradigms × present and future (with 1sg/2sg indexed person), existing locative contexts, third-person subject/object ambiguity, negation, evidence links, and more than 25 malformed or unsupported patterns.
- The main browser suite `tools/test_translator_browser.py` checks visible source references, alternatives, explicit repeated-location context, and refusal of `intla ahmo` / `ihuan` two-clause interpolation.
- The focused workflow runs `node tools/test_multiclause_syntax.js`; the full project workflow includes Chromium tests, manuscript safeguards and other components.

The test examples are synthetic grammar diagnostics, not an independent corpus. **No translation accuracy score can be derived from these tests.**

## Next scientific questions

A research review of original Classical Nahuatl manuscript contexts should establish how a single written `in` may introduce a subordinate or relative clause without misreading it as an article, and how `ihuan` coordinates nominal versus clausal constituents. The unmarked-coordination feature described by Andrews should require objective clause-boundary evidence rather than naive token adjacency. Future conditional grammar must validate mood and asymmetries before rendering any coherent English if/then translation.

# Source-grounded nominal coordination in Classical Nahuatl

Date: 2026-10-28. This is an **experimental grammatical-coverage improvement**, not a verified translation or manuscript collation.

## Nonduplication audit

The repository already supported clause coordination with `auh` (including multiple clauses and English alternatives), exact indexed verb/noun clause grammar, historical source-recorded finite predicates, and recovery of bounded grammatical windows inside longer text. Its existing multi-clause parser expressly declined to interpret `ihuan` as a clause boundary because it may connect noun phrases.

**New, not previously supported:** a pair of unique, cited Classical noun citation forms, each optionally preceded by the source-linked article-like `in`, connected by the cited `īhuān` conjunction/postpositional construction. The coordinator is not treated as proof of a particular English relation or a complete sentence.

The existing source document for the conjunction is https://nahuatl.wired-humanities.org/node/172223 (documented `ihuan, yhuan, iuan`; lemma `īhuān`). The exact historical spelling `ioan` is admitted **only** when the full original noun–connector–noun window appears in the previously catalogued Florentine Codex Book XI folio 217r editorial transcription: https://florentinecodex.getty.edu/book/11/folio/217r .

## Measured pre/post development inputs

| Source or control input | Baseline on previous main | This change |
|---|---|---|
| `xochitl, ioan tlapalli` | No noun-coordination analysis | Three-token NP candidate; exact editorial source window, with evidence links |
| `in cihuātl īhuān in conetl` | No noun-coordination analysis | Five-token NP candidate, both cited headwords and marker positions retained |
| `xōchitl ihuan tlapalli` | No noun-coordination analysis | Cited-spelling composition, **not** asserted historical attestation |
| `injn itoca itech qujça xochitl, ioan tlapalli` | Existing source-finite window at words 3–5 only | Adds an independent nominal-coordination window at words **5–7**; windows overlap on `xochitl`, **no inferred relationship or whole-sentence translation** |
| `niquitta in cihuātl īhuān in conetl` | Finite and NP components not jointly interpreted | Nominal window recovered inside longer expression; verbal argument and object-number agreement remain unresolved |

These are controlled development diagnostics, not independent validation or accuracy rates.

## Semantic and epistemic boundaries

- The canonical dictionary lemma `īhuān` includes “and; together with.” The analysis retains both as possible relationships, without selecting a translation.
- Noun citation forms are source-cited, but number, plural morphology, grammatical role, possessors, coreference and verbal subject/object agreement are **not inferred**. `in` is treated as a source-linked noun-phrase marker hypothesis.
- The system does **not** generate complete English from a noun-coordination hypothesis, or claim such a combination is attested merely because its component words are source-linked.
- The exact historical spelling `ioan` is **not** a global spelling-rewrite rule; a matching, non-training source-located editorial noun phrase is mandatory.
- The existing grammar graph independently rechecks coordinator provenance, exact original word offsets, both noun headwords, and—for `ioan`—the original source sequence. Its noun heads remain separate from the grammatical subject/object and discourse-antecedent inventories.
- When a noun-coordination span appears inside a longer sentence, it is just local evidence. Partial windows are not a complete clause parse.

## CI and expansion guidance

`node tools/test_nominal_coordination.js` checks productive dictionary-listed cue spellings, the quoted Florentine window, hostile source/corpus mutations, unsupported noun forms, no fabricated English, grammar-graph provenance and two overlapping local spans. `python tools/test_nominal_coordination_browser.py` verifies browser presentation and refusal, and runs in full data/browser CI.

The logical next research target is **evidence-graded assignment of a coordinated noun phrase as an actual verbal argument**, conditional on independently supported valency and object/subject agreement. It should not be undertaken by assuming that a verb which indexes a singular noun automatically licenses a plural coordinate object. Historical translation accuracy remains unmeasurable without independent evaluated passages.

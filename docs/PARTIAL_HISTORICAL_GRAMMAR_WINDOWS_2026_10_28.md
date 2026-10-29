# General bounded historical grammatical-window recovery

Date: 2026-10-28. Status: engineering development diagnostic, **not historical translation evaluation**.

## Problem verified before implementation

The sentence engine already supported indexed finite clauses, comparative fragments, source-recorded finite forms, locative phrases, relative/complement constructions, and shared grammatical IR. But a longer historical input with an unsupported outer construction exposed none of those **existing** inner constructions as complete-token grammar analyses.

Example: the consulted Florentine Codex XI 217r editorial excerpt `injn itoca itech qujça xochitl, ioan tlapalli` contains the exact three-token sequence `itech qujça xochitl`, licensed by PR #51. Previously the full seven-token input reported no clause-level proposal, even though submitting that interior sequence alone returned a structural analysis.

This was an important **composition-of-existing-capabilities gap**, not a need for another morphology engine or a new Nahuatl grammar.

## Solution

`translator-sentence.js` now uses its **own existing** parser, without adding grammatical rules, to examine bounded contiguous token windows when the original input is not a fully supported clause. It reports up to 24 local windows spanning 2–6 tokens, drawn from inputs of 4–18 tokens and at most 85 candidate window probes. Longer inputs or unsafe token markup fail closed. A candidate is only reported if a full window is consumed and cited sources are present.

This is a **span inventory**: candidates can overlap, are not ranked, and cannot be joined into a claimed sentence interpretation or English composition. Original token positions, written punctuation, parser families and source links are retained. Clause-level `complete` and English availability remain unchanged.

The shared `translator-grammar-ir.js` receives separate `partial-grammatical-span` evidence nodes with original offsets and a clear boundary-attachment-unresolved label. These are **not** full sentence alternatives, identity links, or English licenses. The graph rechecks their offsets, family identifiers, source URLs, scope and flags. The existing Translator UI lists windows plus words with no window coverage.

## Direct measured development examples

| Input | Before | New local evidence |
|---|---|---|
| Florentine XI 217r 7-token excerpt | No full clause candidate | `itech qujça xochitl`, positions 3–5, source-finite |
| `niquitta in cihuātl extra` | No full clause | `niquitta in cihuātl`, indexed finite |
| `iuhqujn chimalli desconocido más` | No full clause | `iuhqujn chimalli`, comparative fragment |
| `atl yitic nemjnj extra` | No full clause | `atl yitic nemjnj`, locative |
| `qujça in xochitl extra` | No full clause | `qujça in xochitl`, source finite |

These illustrate mechanism correctness across different **already implemented** analyzers; they are not representative historical-language accuracy samples. The hypothetical extra words in constructed controls are intentionally unsupported.

Remaining limitations include whole-clause attachment, unattested compound forms, multi-sentence discourse composition, and independent historical gold translation review. Even if every token belongs to at least one overlapping window, **whole-clause interpretation is still unsupported**. In particular this does not translate the complete Florentine excerpt.

## No duplication / merge safeguards

- Reuses existing morphology, clause parser, source finite evidence, locative and comparative grammar, English refusal, and grammatical IR.
- Does not introduce new formal grammar rules or infer missing historical word forms.
- Introduces a **general-purpose** partial-parse recovery layer, with failure isolation and original offsets, rather than single-manuscript string matching.
- Node and Playwright regressions exercise original historical spelling, four different grammar families, unsupported token gaps, deliberate forged offsets/sources and no English leakage.

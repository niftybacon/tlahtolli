# Historical sentence diagnostics — 2026-10-28

**Status: development-only audit, not independent gold.** This report analyzes existing source-located edited transcription candidates, not independently certified manuscript readings. The passages have already influenced development and cannot establish translation accuracy.

Run from the repository root:

~~~bash
node tools/diagnose_historical_sentences.js
node tools/diagnose_historical_sentences.js --json
node tools/test_historical_sentence_diagnostics.js
~~~

## Current scope and observed outcomes

- Eight source-located editorial entries from data/passages.json, including nominal fragments and uncertain compounds; one pre-inspected 1573 Coyoacán ENL manuscript excerpt from the source-review record.
- Excludes the traditional flower-and-song teaching formula, which has no specific cited manuscript occurrence in current metadata.
- Zero complete English drafts for the nine original excerpts; zero complete indexed finite clause analyses. These numbers are **not accuracy**: several excerpts are not finite sentences.
- Two excerpts have every written token recognized by the curated lexical lookup index, yet remain uncomposed. One (the 1573 land-sale excerpt) receives two unranked source-backed agreement proposals, but no English.
- Six have both lexical-index gaps and no English draft.
- Safe editorial spelling comparisons are separately reported; original source spelling is never overwritten. Bracketed conjectural normalizations are skipped.

| Source / original excerpt | Curated lexical index | Original-spelling observation |
| --- | --- | --- |
| FC XI 62r: atl yitic nemjnj | 3/3 | Fragment, no full English |
| FC XI 62r: iuhqujn chimalli | 2/2 | Comparison fragment, no full English |
| FC XI 217r: injn itoca itech qujça xochitl, ioan tlapalli | 6/7 | ioan misses exact lookup |
| Historical text: cen tiyahui, tipolihui. | 2/3 | tiyahui misses exact lookup |
| FC XI 209v: in mochioa tezcatl, in mocuepa ca tetl | 6/7 | mochioa misses exact lookup |
| FC XI 62r: atlan nemini | 1/2 | atlan misses exact lookup |
| FC XI 62r: Coamjchi | 0/1 | Hypothesized compound noun, not a finite sentence |
| FC XI 62r: Chimalmjchi | 0/1 | Hypothesized compound noun, not a finite sentence |
| ENL 1573: ticnamaca y¯ totlal | 0/3 | Two source-backed agreement alternatives; no English |

**Orthography integrity follow-up:** the lexical tokenizer now preserves source-written `y¯` (spacing overbar) as one exact surface token rather than reducing it to `y`. The original abbreviation **still has no established curated lexical reading**: the source-specific morphology adapter separately keeps its unverified `yn/in` expansion as a hypothesis, never an automatic normalization. The diagnostic now checks preservation and explicit abstention rather than treating lost scribal marks as acceptable.

**Scope limit:** This Node harness loads the actual curated lexical, indexed sentence, locative, English, shared grammar IR and exact ENL source-morphology modules, but not the separate browser-embedded Tēntli supplementary morphology. It reads existing local files only; no downloads, new training pairs or source promotion occur.

## Engineering implications

1. Separate fragment/nominal diagnostics from finite-sentence diagnostics before interpreting failure rates.
2. Preserve source orthography in tokenization and make editorial expansion an explicit, separately graded hypothesis.
3. Investigate recorded forms such as mochioa, tiyahui and ioan in the morphology-to-syntax handoff, retaining historical source caveats.
4. Extend coverage from documented clause structures, not invented complete readings.
5. Obtain independent source-document-grouped specialist review before reporting translation quality or accuracy.

All new checks assert source eligibility and refusals, not that a published interpretation has been correctly translated.

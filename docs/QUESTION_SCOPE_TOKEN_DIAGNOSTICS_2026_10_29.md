# Unsupported question inputs: preserve token diagnostics (2026-10-29)

## Finding

The pinned 36-row Axolotl development audit identified one source row with
question punctuation (upstream row 4751). Earlier `TlahtolliSentence.analyze`
returned a single incomplete clause with `tokens: []` whenever **any**
`?` or `¿` appeared in the input. This erased all sentence-side token
and morphology diagnostic coverage of that row, while the lexical analyzer
still separately counted its 18 tokens.

## Repair

Question inputs still **fail closed**, never producing a complete clause,
English sentence candidate, grammatical question interpretation, or
antecedent relation. Their source-written word tokens now remain available
through the existing `partialClues` analyzer. The original input is retained
and the explanation explicitly distinguishes morphology from syntax.

The fix does not reinterpret interrogative syntax, decide where a quote or
punctuated source row truly ends, or treat Axolotl rows as independently
validated sentences. It also does not alter the curated dictionary, archive
source evidence, or lexical recognition denominator.

## Regression

```sh
node tools/test_translator_sentence.js
node tools/test_axolotl_development.js
```

Verify that question-bearing inputs retain their word tokens, remain
`complete:false` with zero clause readings, and have a safe morphology
array. In the pinned 36-row corpus, expect unchanged 102/365 curated tokens,
but question-bearing row 4751 no longer reports zero sentence-side tokens.
This is a diagnostic bugfix, not a morphology coverage or translation gain.

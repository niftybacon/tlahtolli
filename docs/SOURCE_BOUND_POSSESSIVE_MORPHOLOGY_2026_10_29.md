# Source-located bound possessed nouns in canonical Tēntli (2026-10-29)

## Verified problem and design

Tlahtōlli's canonical `tools/morphology_engine.js` already reads the curated lexicon, source claims, and documented `no-` possessive examples. However, it did not productively reverse-analyze **single bound possessed bases** actually listed by independent lexical/grammar sources under `dictionary.json.words[].possessed`. These are different from bare citation heads and proposed absolutive/combining stems.

This patch extends that **same** analyzer without creating another lexicon, archive parser, stem registry, or sentence grammar. It uses the already published `NOUN_PREFIXES` inventory and exact full-form comparison.

## Licensing rules

For a source-labelled record to license an unverified analytical reading, all of the following must hold:

1. Its lexical category is exactly `noun` in the curated dictionary; `headword`, `pos` and `possessed` must have individually source-located `dictionary`, `grammar`, or `text` claims.
2. The possessed field specifies **one** exact bound form, e.g. `-tepēuh (possessed stem; Karttunen)`. Reject multi-component forms, editorial alternatives, stem choices without specific possession evidence, and descriptions marking exceptional semantics, reverential forms, plurals, or restricted noble senses.
3. The candidate original NFC input must match exactly one of `no-`, `mo-`, `i-`, `to-`, `amo-` concatenated with the **source-listed bound base**. **No macron folding**, vowel deletion, consonant substitution, extra suffix, compound segmentation, or guessed allomorphy is permitted.
4. Stronger independently indexed complete forms take precedence. The output has `grade: analogy`, a lemma, source locator, possessor prefix and exact bound base, and an explicit warning: **not attested as a whole token**, no contextual possessive relationship or English translation established.

Source fields remain inside the curated dictionary. The 36,543-record Amoxcalli archive is untouched and is NOT promoted into verified readings. Broadly guessed noun plurals, ablatives, derivative suffixes and special register forms remain unsupported.

## Reproducibility

```bash
node tools/test_source_bound_possessives.js
python tools/build_morphology_engine.py --check
python tools/test_advanced_morphology.py
node tools/test_axolotl_development.js
```

Positive tests use nine whole forms **not listed in the curated inflections**, across nine independent source-located lemmas and all five existing possessor prefixes, including `noāuh`, `motepēuh`, `iteuh`, `toāmauh`, `amocihuāuh`, `notequiuh`, `mochān`, `inamic`, and `noyōllo`. These are *hypothetical compositional forms*, not historical attestations. Negative tests reject vowel-quantity changes, whole-form punctuation, special semantics, multi-base compounds, missing claims, and forged inference-only evidence. Sentence engine tests ensure none can become `complete:true` or an English sentence.

Do not conflate morphological **candidate** coverage with curated lexical recognition (102/365 as of PR #66), approved held-out translation accuracy (unmeasured), or historical transcription correctness. The 365-token cohort was used for diagnosis before this PR and is not an independent gold evaluation; no entries or grammatical rules are added for its failing tokens.

## Remaining work

Source-specific allomorphic possession (especially vowel-contact and inalienability), plural noun class, and genuinely productive nonpresent verb morphology require additional independently checked stems and grammatical examples. Avoid automatic inflection generation from unreviewed archive entries and don't import modern variety rules as universal Classical Nahuatl morphology.

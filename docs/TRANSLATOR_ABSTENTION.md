# Translation Desk: explicit abstention policy (2026-10-28)

## What changed

Tlahtōlli uses historical lexical records and grammar candidates; it is **not** a trained sentence-level neural translator. Its former lexical gloss chose the first matching dictionary meaning. That could be misleading where several lemmas, glosses, or vowel-length contrasts were possible. The new display refrains from choosing a lemma when evidence is insufficient.

| Situation | Display | Rationale |
| --- | --- | --- |
| Exactly one indexed lemma/form, no known competing length-marked lexeme | `[water]` (sample dictionary sense) | A **lexical cue only**; contextual sense and complete grammar are not verified. |
| Only a macron-/diacritic-folded candidate | `[?form: spelling uncertain]` | An orthographic approximation does not establish exact historical identity. |
| Exact form maps to multiple genuinely distinct entries | `[?form: multiple entries]` | No first-result disambiguation. |
| Unmarked exact form has a known distinct macron-bearing competitor | `[?form: vowel length ambiguous]` | Vowel length is contrastive in Classical Nahuatl; traditional orthography often omits it. |
| Not indexed | `[?form]` | Unknown to this **limited dictionary**, not necessarily an unattested or impossible word. |

The interface still lists source links and candidate interpretations, including competing orthographies; morphological hypotheses remain separate from source-attested text. “Orthography conflicts” are counted separately from ordinary ambiguous lemma matches. Reverse English lookup also abstains if several entries match a word.

## Boundaries and limitations

This change improves **how uncertainty is communicated**, not language-model accuracy. A single dictionary lemma with several senses still previews its first listed sense inside brackets; this does *not* establish which sense is correct in a complete sentence. A word without competing lemmas in our 115-entry dictionary may have competing senses or homographs **not yet indexed**. Therefore absence of a displayed conflict is not proof of unambiguous Nahuatl.

No fabricated training pairs were added; no neural training was performed. This is not a claim of modern Nahuatl speaker validation or Classical Nahuatl expert review.

## Positive and negative controls

`node tools/test_translation_abstention.js` checks:
- same-spelling distinct dictionary entries require abstention;
- a synthetic contrast `toca` / `tōca` produces an unresolved-vowel-length warning for unmarked input, but permits the explicitly marked form;
- exact documented historical spelling `atl` for `ātl` remains an exact source-backed lookup;
- diacritic-only near matches must not generate definite glosses;
- reverse dictionary lookup respects ambiguous results;
- unknown words, punctuation, newlines and case are preserved.

These synthetic controls test **software behavior**, not historical truth. `toca`/`tōca` are used to exercise contrast handling, not to certify individual manuscript lines.

## Linguistic references

- Michel Launey, [*An Introduction to Classical Nahuatl*, preliminary lesson](https://assets.cambridge.org/97805215/18406/excerpt/9780521518406_excerpt.pdf) — historical spellings often omit vowel length and glottal stops and vary in representing sounds.
- David Tuggy, [“The Vowels of Nahuatl”](https://mexico.sil.org/language_culture/aztec/vowels-of-nahuatl) — vowel length is contrastive; multiple words can share unmarked spelling.
- See [editorial policy](EDITORIAL_POLICY.md) for claim-level source categories, and [Codex review ethics](../research/florentine_codex/REVIEW_ETHICS.md) for historical and community review limits.

## Next accuracy milestones

1. Add a *rights-cleared*, human-verified clause-level evaluation set with source/exact folio locations and difficult negatives; reserve document-grouped held-out data.
2. Evaluate coverage and ambiguity rates on these unseen texts, separating lexical recognition, orthographic normalization, morphological parsing, and **actual translation meaning**.
3. Introduce context-based disambiguation only where supported by reliable examples and grammar rules; keep abstention as the fallback when evidence is absent.
4. Expand source-located vocabulary and morphology through transparent independent checks, rather than treating analyzer output as ground truth.

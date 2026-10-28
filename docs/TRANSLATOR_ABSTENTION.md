# Translation Desk: explicit abstention policy (2026-10-28)

## What changed

Tlahtōlli uses historical lexical records and grammar candidates; it is **not** a trained sentence-level neural translator. Its former lexical gloss chose the first matching dictionary meaning. That could be misleading where several lemmas, glosses, or vowel-length contrasts were possible. The new display refrains from choosing a lemma when evidence is insufficient.

| Situation | Display | Rationale |
| --- | --- | --- |
| Exactly one indexed lemma/form, no known competing length-marked lexeme | `[water]` (sample dictionary sense) | A **lexical cue only**; contextual sense and complete grammar are not verified. |
| Only a macron-/diacritic-folded candidate | `[?form: spelling uncertain]` | An orthographic approximation does not establish exact historical identity. |
| Exact form maps to multiple genuinely distinct entries | `[?form: multiple entries]` | No first-result disambiguation. |
| Unmarked exact form has a known distinct macron-bearing competitor | `[?form: vowel length ambiguous]` | Vowel length is contrastive in Classical Nahuatl; traditional orthography often omits it. |
| Exact entry lists several gloss segments | `[?form: multiple dictionary senses]` | Dictionary order is not evidence for contextual sense selection. |
| Not indexed | `[?form]` | Unknown to this **limited dictionary**, not necessarily an unattested or impossible word. |

The interface still lists source links and candidate interpretations, including competing orthographies; morphological hypotheses remain separate from source-attested text. “Orthography conflicts” are counted separately from ordinary ambiguous lemma matches. Reverse English lookup also abstains if several entries match a word.

## Boundaries and limitations

This change improves **how uncertainty is communicated**, not language-model accuracy. A single dictionary lemma with several comma- or semicolon-separated gloss segments now abstains with `[?form: multiple dictionary senses]`. These segments can include synonyms or editorial notes as well as distinct senses; the engine deliberately does not infer semantic equivalence from English wording. The full dictionary meaning and its source remain visible. A single unsplit gloss can still hide polysemy, so this is a conservative formatting-based safeguard, not a complete sense inventory or contextual disambiguator. A word without competing lemmas in our 115-entry dictionary may have competing senses or homographs **not yet indexed**. Therefore absence of a displayed conflict is not proof of unambiguous Nahuatl.

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

## Sense preservation follow-up (2026-10-28)

Repository inspection identified two remaining first-result paths: the working gloss selected the first segment of a multi-part meaning, and index insertion discarded same-headword records even when their meanings or parts of speech differed. The engine now retains competing records, preserves distinct source URLs/evidence/context for otherwise identical claims, and collapses only duplicate records. Identical lexical claims from different sources remain visible without being counted as competing lexical analyses (subject to the existing conservative display limit).

Each lookup candidate exposes a derived `senses` array using the existing comma/semicolon segmentation. This is editorial parsing of the repository's meaning field, not newly verified dictionary sense numbering. `senseAmbiguous` and `stats.senseAmbiguities` describe unresolved lists in Nahuatl-to-English mode. The stats count tokens, not meanings or measured translation error. Repeated identical segments do not introduce ambiguity. Reverse lookup remains retrieval of a supplied English gloss; it does not select a Nahuatl contextual sense or generate sentences.

Provenance: dictionary.json and its existing cited lexical records are the sole lexical input; no entries, source readings, translations, or review grades were added or promoted. The historical spelling background remains Launey's preliminary lesson, pp. 3–6, linked above; that reference does not validate the synthetic controls or this software's sense segmentation. Tests cover both record orders, colliding headwords and historical aliases, competing parts of speech, provenance retention, display overflow, duplicate records, single glosses, and comma/semicolon lists. The integrated browser regression uses the existing xōchitl record to check that full alternatives and the caution remain visible. These are behavior regressions, not a held-out historical translation evaluation.

This favors abstention for many common words, including synonym lists. More informative context-sensitive output requires source-located sense records, grammatical constraints and independently checked clause examples before any automatic selection can be justified. No model training, expert review or accuracy improvement measurement is claimed.

## First compositional context rule: comparison fragments

`comparison-iuhquin-noun-v1` combines an exact indexed iuhquin form with an exact indexed noun in a complete two-word input fragment. It returns `like ...` candidate readings for each existing noun gloss segment, alongside the original lexical output. Thus `iuhquin chimalli` now produces a comparison reading containing `like shield`, even though isolated dictionary senses remain unresolved. This is productive composition over indexed nouns, not memorization of the three research passages.

Rule provenance: Online Nahuatl Dictionary, https://nahuatl.wired-humanities.org/content/iuhquin (consulted 2026-10-28), explicitly records comparison uses, citing Karttunen 1992 p. 109; Carochi/Lockhart 2001 pp. 504 and 444–45; Lockhart 2001 p. 221. These references support the comparison relation. They do not independently certify our generated English wording or every possible noun combination. Each result carries the marker and noun source URLs. Existing manuscript examples retain their existing candidate status.

The rule requires one lexical analysis per word, source links, noun part of speech, and no approximate spelling, orthographic conflict or truncated candidate list. It accepts spaces and an optional final period/question/exclamation mark. It does not attach across punctuation, newlines, extra words or reversed order. This boundary is an engineering scope restriction, not a claim about which Classical Nahuatl constructions are grammatical. The rule has no verb-clause interpretation, article insertion, noun-sense ranking, idiom resolution, or claim to sentence-level translation. All noun gloss segments remain alternatives, including editorial notes that may make awkward English. This is an explicit compositional scaffold for later reviewed sense records.

Positive and negative software fixtures are constructed. Browser tests use the existing dictionary record for chimalli. No measured translation accuracy, independently verified new readings, expert review or training is claimed.

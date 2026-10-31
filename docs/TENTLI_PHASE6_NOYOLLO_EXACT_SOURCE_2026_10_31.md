# Phase 6: exact Brinton `noyollo` through canonical morphology

*October 31, 2026 — source-attested original spelling; **unreviewed morphological interpretation**; not a complete English translation.*

## Why this is different from another dictionary lookup

The published `yollotl` entry cites Molina (1571 II f.40v) for “heart” and Karttunen (1992 pp.342–343) for the usually possessed bound `-yōllo`. [Lockhart (2001 p.156)](https://nahuatl.wired-humanities.org/content/yollo) separately notes the **`Noyol` / `Noyollo`** idiom family, while [ODN `yollotl`](https://nahuatl.wired-humanities.org/content/yollotl) cites Lockhart (2001 p.242) for a possessed `noyōllo` expression. [GDN's historical Carochi index](https://gdn.iib.unam.mx/diccionario/yollotl/28971) gives related first-person possessed spellings. These are separate lexical/grammatical evidence types, not a license to globally omit vowel length.

[Brinton's *Ancient Nahuatl Poetry* (1890)](https://www.gutenberg.org/files/12219/12219-h/12219-h.htm) prints the **unmarked** written token `noyollo` in Songs **VI.2, XI.4, and XVII.13**. The previous canonical morphology recognized `noyōllo` as a **constructed first-person bound-stem analogy** but not Brinton's actual unmarked `noyollo` surface.

## Source-scoped improvement in actual engines

`tools/morphology_engine.js` now recognizes **only the exact original spelling** `noyollo` as an **unreviewed source-linked analysis candidate**:

- Lexical source: the existing **source-checked** `yollotl` dictionary headword and its exact `-yōllo (bound form)` citation; canonical original data are unchanged.
- First-person possessive hypothesis: `no- + yollo`, without claiming original printed Brinton lacked long vowels phonologically.
- Written-form evidence: the original 1890 Brinton poem, not an invented English translation, a manuscript facsimile, or a generalized spelling normalizer.
- Graded result: `unreviewed`, with `possessor: 1sg`, explicit unresolved soul/heart/mind/intention semantics and original-sentence refusal.
- `translator-sentence.js` **already consumes** the canonical morphology provider as partial grammatical clues; no new sentence parser is created. `translator-english.js` must still **abstain** for the isolated unparsed noun and the longer Brinton passages. Do not turn `noyollo yehua` into a preset English phrase.

A direct test runs this exact original through morphology, canonical sentence and English, and tests missing evidence, variants (`noyōllo`, `noyöllo`, `moyollo`, etc.), unsupported suffixes, fused constructions and altered citations. The browser's embedded morphology and versioned asset hashes must be regenerated with existing scripts before merge.

## October 31 follow-up: preserve the source clue in the shared grammatical representation

The adversarial audit found that `noyollo yehua` exposed the exact printed `noyollo` inside the existing sentence model's `morphologicalClues`, but the next shared grammar IR layer dropped that evidence entirely when no full-clause parse was available. The existing sentence model now also retains the full original punctuation-bearing `noyollo,` token while consulting the exact `noyollo` form for *partial morphology only*, without a general punctuation or vowel-length normalization. The existing `translator-grammar-ir.js` now retains a **source-possessed-form-observation** (not a resolved noun mention) with original token index, 1sg possessive **hypothesis**, published original Brinton URL and separate `yollotl` lexical source. It recomputes the source sentence evidence and refuses forged or stale callers; punctuation, alternate spelling, unsupported pronouns and lack of canonical source data do not promote the clue. The English composer still refuses the original poem and the isolated noun phrase; there is no universal `yehua` role, no completed Brinton clause and no approved translation. The browser panel now explicitly displays the source-bound observation and original token with its two citations, separately from grammatical arguments. Regressions: `tools/test_phase6_source_morphology_ir_observations.js` and `tools/test_phase6_source_morphology_ir_browser.py`; no change to 926 recognition route count or Silver/Gold totals. Draft PRs #114/#115 also edit grammar IR: agents must retain this node's explicit **observation-not-argument** distinction on merge.

## Coverage and Gold/Silver gates

This is a **source-attested exact spelling with a still-unreviewed morphological segmentation**. The full historical investigator is permitted to expose the new candidate, but excludes this **specific kind** from its **certified canonical recognition-route** count until the explicit source/grammar review and release benchmark are approved. Consequently the published **926/1,181** unmatched development metric is *unchanged*, although the existing English/morphology engine now exposes a useful additional clause clue.

No full historical Brinton clause translated; no independently reviewed bilingual example, Gold, Silver, training data or new dictionary headword; no global `yōllo`⇄`yollo` spelling transformation. A later PR can reclassify exact original attestation after independent grammatical review and remeasure the historical cohort. Do not repeatedly ask the director to solve the already documented `yehua` ambiguity.

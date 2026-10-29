# Verified Class 2 bases: quiza and polihui; POS substring correction (2026-10-29)

## Tangible baseline → new detection

**Same 210 canonical headwords and 12 complete matrices.** Before this source review, Tēntli returned **0** lemma-specific analyses for 28 selected finite forms of `quiza` and `polihui`. After adding these individually verified base pairs, the *unchanged* canonical Tēntli analyzer returned **28/28** grammatical hypotheses. This is a targeted, predeclared synthetic probe of rule coverage, **not** 28 manuscript attestations, independent gold rows, translator accuracy, or evidence that the analyzer can translate a complete sentence.

For each lemma the new hypotheses consist of 2sg and 3sg preterites (2), singular future (3), plural preterites (3), plural futures (3), and plural presents (3). All remain `grade:hypothesis`, with exact morphological segments reconstructing the surface form. The 1sg historical preterites are separately recorded `grade:lexical`, with no invented contextual English.

## Explicit historical source audit

| Lemma | Present/citation base | Past base | Source-reported 1sg | Independent class source |
|---|---|---|---|---|
| [quiza](https://nahuatl.wired-humanities.org/content/quiza) | `quiza-` | `quiz-` | `oniquiz` (Molina 1571 II f.89v col.1) | Lockhart (2001), *Nahuatl as Written*, p.231, identifies **Class 2 ōniquīz** |
| [polihui](https://nahuatl.wired-humanities.org/content/polihui) | `polihui-` | `poliuh-` | `onipoliuh` (Molina 1571 II f.83r col.1) | Lockhart (2001), *Nahuatl as Written*, p.230, identifies **Class 2 ōnipoliuh** |

Both ODN records preserve the source's spellings *as transcribed*, not an independent facsimile collation. Molina's `quiz` is written without Lockhart's modern editorial vowel-length mark in `quīz`; a rule **must not** silently invent a macron-equivalent surface. Molina's `poliui` (citation) and editorial `polihui` are not proof of a universal spelling transformation. Neither the transitive **poloa** nor a motion-compound `-ti-` auxiliary inherits these class claims.

The source-graded `stem` claims are updated in place. No new engine, 60-cell matrix, third-person English, training pair, archived morphological promotion, or unsupported synonym has been introduced.

## Other unresolved historical classes

`nonotza` has demonstrably competing Karttunen analyses: **NŌNŌTZ(A)** (counsel/advise, with several Molina *nino/nite/nitla* constructions) versus **NOHNŌTZ(A)** (converse/chat, apparently different vowel/glottal pattern). [ODN NŌNŌTZ(A)](https://nahuatl.wired-humanities.org/content/nonotza) · [ODN NOHNŌTZ(A)](https://nahuatl.wired-humanities.org/content/nonotza-0). Do **not** attach one stem class or full transitive paradigm to their shared unmarked `nonotza` index headword. Similarly, `aztayoa`, `tecpayoa` and `tepozotinemi` have exact historical word-form clues but no independently fixed productive person/class; the remaining index-only verbs require more evidence.

## Correctness correction: verb labels must be anchored

An initial inventory used `pos.includes('verb')` and counted **64** entries. Strict `pos.startsWith('verb (')` counts **54** actual verb-labelled entries. The ten false positives include several adverbs, a noun described as homophonous with a *verbal* form, and particle/locative POS descriptions containing `adverb`. The prior number did **not** reflect extra true verb entries. The sentence module's source-listed finite-gloss gate now requires a genuine verb POS, blocking false source-form translations from adverbs. Other existing exact verb-type gates and source-restricted rules remain unchanged.

## Reproducible proof

`node tools/test_verified_class2_refinement.js` checks the 28 **exactly named** positive cells, 1sg source priority, all six preexisting hypothesis families, exact spelling/morpheme reconstruction, deleted source-field withdrawal, future vowel-length refusal, and fake-adverb finite-translation abstention. Existing morphology tests, `python tools/build_dictionary.py --check`, `python tools/build_morphology_engine.py --check`, and both comprehensive CI suites also apply. The Axolotl 36-row development sample was **not** used to choose stems, positive forms, or grammatical rules.

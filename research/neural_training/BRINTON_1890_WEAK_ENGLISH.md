# Brinton (1890) Nahuatl–English candidate alignments — October 29, 2026

**Evidence status:** 150 **source-provided, weak stanza alignments**, NOT independently verified manuscript translations, linguistic gold, approved `pairs.csv` rows, or public Tēntli translations.

## Source and rights

- Historical printed edition: Daniel G. Brinton, *Ancient Nahuatl Poetry: Containing the Nahuatl Text of XXVII Ancient Mexican Poems*, 1890, printed parallel Nahuatl and English numbered stanzas. Publication is in the **US public domain**, as confirmed by [Project Gutenberg ebook 12219](https://www.gutenberg.org/ebooks/12219).
- Pinned ASCII source: GITenberg mirror of Project Gutenberg's `12219.txt`, Git blob SHA `76b6a70282eb9c7cb973125661aa8113fe6cece1`. Source: https://github.com/GITenberg/Ancient-Nahuatl-Poetry-Containing-the-Nahuatl-Text-of-XXVII-Ancient-Mexican-Poems--13-Brinton__12219/blob/master/12219.txt .
- The material is a nineteenth-century transcription and English poetic **interpretation** of older texts, not a verified diplomatic transcription, a modern literal translation, or an orthographically normalized teaching edition. Brinton himself explicitly warned of translation uncertainties. The text carries old plain-ASCII representations of some accent marks (e.g. `[)a]`); these are **preserved**, not silently corrected.
- Printed line breaks were collapsed to a single space for UTF-8 JSONL model examples. All actual letters, capitalization, symbols and lexical spellings remain as in the source mirror; punctuation and edition artifacts require future inspection. Each JSONL record retains a GitHub line reference, exact song/verse identifier, and upstream blob SHA.
- This is not the separately trained *Rig Veda Americanus* collection. Nevertheless, overlapping authors, poetic language, lexemes and print conventions mean this is not a clean **independent translation-quality benchmark**.

## What was actually imported

- **217** numbered Nahuatl stanza → same-number English stanza correspondences were mechanically located in the printed poems.
- **52** were excluded because either side exceeded the existing 256-byte model's 254-byte payload limit. They are not silently truncated or sentence-split.
- **15** more were excluded for conspicuous `etc.` / incomplete editorial references; they are not appropriate direct bilingual targets.
- **150** remain, drawn from **20** poems. **133** belong to the research `train` split; **17** belong to `dev`. Complete poem units XXV, XXVI, XXVII were reserved for development, so no stanza from those songs is used for optimizer updates. No `test` or `gold` entries are created.
- English translations are marked `translation.alignment = "candidate"` for **0.15 gradient weight** in the existing `neural/corpus.py` pipeline. `rights = "public_domain"` applies to both sides of the 1890 edition. The original texts are `transcription_status = "editorial"`.
- The source's exact form can be used for *experimental supervised translation*; an expert must still check line/phrase alignment and the original manuscripts before any promotion to `approved`. Source-provided **stanza** alignments cannot be assumed clause-by-clause literal equivalences.

## Use and repeatable supervised practice

```sh
python -m unittest discover -s tools -p 'test_brinton_weak_parallel.py' -v

# Experimental PyTorch learner: 150 graded historical bilingual examples.
# A fresh random checkpoint DOES NOT know English and cannot be called fluent.
python -m neural.train \
  --manifest research/neural_training/brinton_1890_poetry_weak_en.jsonl \
  --output /tmp/tentli-brinton-candidate \
  --epochs 5 --batch-size 4 --max-steps 80

# To CONTINUE a previously trained compatible Tēntli checkpoint, also pass:
# --init-checkpoint /path/to/previous-tentli-research-artifact
```

Training/development loss measures fit to these **weak historical English targets**, **not** true translation accuracy. Do not compare these exposed development poems to an unseen held-out manuscript benchmark. No weights are merged or deployed automatically; `pairs.csv` remains unchanged.

## Next steps

1. Allow targeted historical lexical **gloss** training from independently source-linked Molino/Carochi entries, but do not equate a dictionary sense with a verified literal passage translation. `ātl` → *water* and `xōchitl` → *flower* are straightforward teaching anchors; `in` is a contextual particle, article, or demonstrative and must **not** be forced into an invariant *the* translation. Consult [ODN ātl](https://nahuatl.wired-humanities.org/content/atl), [ODN xochitl](https://nahuatl.wired-humanities.org/content/xochitl) and [ODN in](https://nahuatl.wired-humanities.org/content/in).
2. Train in the existing **experimental** neural path. An English-pretrained FLAN-T5 weak-alignment adapter should be a separate, opt-in tier, not a weakening of `train_reviewed_english.py`'s human-approved corpus gate.
3. Audit Brinton song/verse correspondences against a facsimile and modern scholarly interpretation, prioritizing the shortest, most compositionally clear lines. Only then consider a higher alignment tier.
4. Preserve autonomous *proposal* cycles (discover errors, request source evidence, queue corrections, run held-out diagnostics) and forbid unreviewed self-generated translations from becoming the target on the next training cycle.

# Brinton song-vocable and particle research — October 30, 2026

This follow-up to the [canonical source-checked lexical coverage audit](TENTLI_CLASSICAL_LEXICAL_WITNESS_COVERAGE_2026_10_30.md) is **research triage only**, not 40 automatic training cycles and not an update to the public translator.

## Historically located distinctions

| Brinton written form | Relevant independently located reference | Triage conclusion, not a fixed English translation |
|---|---|---|
| `ohuaya` | [ODN ohuaya](https://nahuatl.wired-humanities.org/content/ohuaya), quoting the category documented by Bierhorst (2009), p. 42 for c.1582 song material | A **song vocable**; do not count it as an ordinary dictionary noun/verb or erase it from the original |
| `zan` | [ODN zan](https://nahuatl.wired-humanities.org/content/zan), Molina 1571 part II fol. 14r | Restrictive/adversative particle; can mean only/just *or* serve an adversative function |
| `ye` | [ODN ye](https://nahuatl.wired-humanities.org/content/ye-0), Molina 1571 II fol. 34v | A temporal/discourse particle, often now/already, sometimes untranslated |
| `ya` | [ODN ya](https://nahuatl.wired-humanities.org/node/173300), Karttunen 1992 p. 333 | Historical relation to ye, **not** an instruction to rewrite every song syllable ya as ye |

`aya`, `y`, `a`, `o`, `ohuaye` and `huia` remain **unresolved**: we have not authenticated the function of each isolated occurrence. The [immutable 1890 edition](https://github.com/GITenberg/Ancient-Nahuatl-Poetry-Containing-the-Nahuatl-Text-of-XXVII-Ancient-Mexican-Poems--13-Brinton__12219/blob/ab90a087b33d8c767caa867674dbf33e0cee084f/12219.txt) describes songs containing sung interjections and rhythmic syllables but does not warrant automatically classifying every instance. Do **not** equate standalone `aya` with the grammatical construction `ayamō` without syntactic evidence.

## Machine-generated counts, not meanings

The 133 training stanzas contain **2,646** exact written-form token occurrences. Only **317** match an independently source-checked canonical citation form or individually cited early witness spelling, leaving **2,329** unmatched written-form occurrences. In this limited sample `ohuaya` appears **106** times; separating this historically documented vocable for review yields **2,223** remaining unmatched occurrences as a *workload estimate*, not as a count of missing dictionary lemmas.

The new [source-graded form catalog](../research/translation_corpus/brinton_contextual_form_leads_2026_10_30.json) and `neural/historical_form_triage.py` generate **40 stanza contexts** spanning historical training poem groups, with source pointers and distinct evidence classes. **All 17 development stanzas are excluded.** No form acquires a verified context-specific meaning, primary English training target, lexicon approval or Gold status from the audit. The source text and Brinton English are not modified; no tokens are deleted or silently translated. The 40 cases are research **proposals**, not 40 autonomous completed linguistic investigations.

## Reproduce and gate

```sh
python -m unittest discover -s tools -p 'test_historical_form_triage.py' -v
python -m neural.historical_form_triage --limit 40 --max-per-work 4 \
  --output /tmp/brinton-contextual-form-audit.json
```

The [source-form CI workflow](https://github.com/niftybacon/tlahtolli/actions/workflows/tentli-brinton-contextual-form-triage.yml) validates evidence classes and refuses any automatic Gold/training promotion. Its JSON artifact can guide a reviewer to specific historical lines. The next genuinely valuable step is independent contextual linguistic review of those lines and qualified, rights-reviewed Silver pairs, followed by wholly separate blind Gold evaluation (tracked in [Issue #98](https://github.com/niftybacon/tlahtolli/issues/98)).

# Source-checked morphology of a 1573 Coyoacán land sale

**Status (2026-10-28): externally source-crosschecked, AI-assisted; manuscript glyphs not independently collated; NOT scholar-peer-reviewed; NOT translation training or held-out evaluation data.**

## Primary edited witness and exact written evidence

- ENL *Coyoacan Region, 1573: Land Sale to a Spaniard*, BC16a000, AGN Mexico, Tierras 1735, exp. 2, f. 122.
- [James Lockhart's analytic transcription and English interpretation](https://enl.wired-humanities.org/bc16/elements/bc16a/000), based on material in his personal papers and identified as *Beyond the Codices* (1976), document 16, pp. 98–101.
- Bounded, source-spelled fragment: **`ticnamaca y¯ totlal`**. The full clause continues into a location description. We used Lockhart's edition to locate this fragment; we did **not** re-read each original manuscript letter from a high-resolution image.

A practical, contextual English gloss is **“we are selling our land”**, following the published translation. This is NOT a newly proven literal alignment or an evaluation answer produced independently from source translation.

## Externally supported analysis

| Written unit | Morphological division | Evidence | Remaining uncertainty |
| --- | --- | --- | --- |
| `ticnamaca` | `ti-` + `c-` + `namaca` | `ti-` subject agreement (1pl **or** 2sg); `c-` 3sg object; Molina 1571, II, f. 62v and Karttunen 1992, p. 158 identify `namaca` as a transitive 'sell' verb | The expected 1pl present `-h` is not written; historic omission of final `-h` is known. `ti-` does NOT prove 'we' in isolation. The document's preceding `tehuātin` and the two sellers make 'we' well supported *contextually*. |
| `y¯` | Likely `yn` / `in` (noun-phrase particle) | Horn & Lockhart discuss overbars representing nasal consonants, and Lockhart/Karttunen record `in/yn` as an article-like particle | Expansion of this particular written mark was not checked against an independently legible autograph. **Keep `y¯` in the original field**, do not silently rewrite as `yn`. It is **not** a macron proving vowel length. |
| `totlal` | `to-` + `tlal` | `to-` is 1pl possessor 'our'; Molina/Karttunen identify `tlalli` 'land'; independent **1563** central Mexican documentary evidence attests the actual word `totlal` meaning 'our land' | Citation form `tlalli` contains a nominal absolutive; this does not license reinserting `-li` in the possessed written token. The first document's glyphs are not independently collated. |

The subject of `ticnamaca` is most plausibly 1pl **because of context**, not because of a unique `ti-` agreement value. An automatic grammar parser must preserve 2sg in isolation. The third-person object `c-` is compatible with the owned land nominal, but assigning its precise referent is a contextual decision.

## Independent references, located claims

1. **Lexical verb:** [Online Nahuatl Dictionary, `namaca`](https://nahuatl.wired-humanities.org/content/namaca). Molina's recorded headword and transitive paradigm; Karttunen's gloss and examples.
2. **Verbal agreement, object marking, possession:** [D. K. Jordan, *Nahuatl Grammar Notes*](https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html), pronominal, object and possessive prefix tables, including `ti-`, `c-/qui-`, `to-`.
3. **Lexical land noun:** [Online Nahuatl Dictionary, `tlalli`](https://nahuatl.wired-humanities.org/content/tlalli). Molina (1571), II f. 124r; Karttunen (1992), p. 275. Editorial vowel length is NOT inferred as visible in this manuscript.
4. **Independent exact possessed form:** [UNAM, *Gran Diccionario Náhuatl*, `-tlal`](https://gdn.iib.unam.mx/diccionario/tlal/184899), separate 1563 land petition concerning Luis de Santa María and Martín Momauhti. It documents the same `totlal` form in an independently sourced historical passage.
5. **Scribal overbar:** [Rebecca Horn and James Lockhart, *Mundane Documents in Nahuatl*, printed p. 16 (2010), PDF p. 16 of 22](https://bpb-us-e1.wpmucdn.com/blogs.uoregon.edu/dist/7/5151/files/2022/01/Horn_Lockhart-mundane-docs-in-N.pdf). They explain the overbar's use for an elided `n` or `m` and the importance of retaining it in printed transcriptions.
6. **Article-like particle:** [Online Nahuatl Dictionary, `in`](https://nahuatl.wired-humanities.org/content/in), the historical variant `yn`, and Lockhart (2001) p. 164 explaining its article, particle, or clause-boundary roles.
7. **Why 'we' in context:** [Online Nahuatl Dictionary, `tehuantin`](https://nahuatl.wired-humanities.org/content/tehuantin) and [`chane`](https://nahuatl.wired-humanities.org/content/chane), plus the published BC16 text's earlier `yn tehuātin` and `tichanneque`. The latter means a group of residents, helping locate a plural discourse referent; the source's own 1573 narrative names two sellers.

## What 'verified' means here, and what it does not

- **Checked with independent sources:** dictionary lemmas, prefix values, use of scribal bars, contemporaneous spelling of `totlal`, and document-local plurality context. These findings are not mere unfounded algorithmic guesses.
- **Contextually argued, not proved from the surface alone:** 1pl rather than 2sg in the verb, and the referent of the third-person object.
- **Still unverified:** word-by-word facsimile collation, exact historic vowel length and glottal-stop notation, manuscript-hand expansion of `y¯`, and specialist adjudication.
- **Not permissible to report:** 100% morphological accuracy, gold English translation, claim that the original manuscript visibly writes `yn`, or model training approval.

The structured, source-by-source and token-by-token annotations are in [`ENL_BC16_1573.json`](../research/translation_corpus/source_reviews/ENL_BC16_1573.json) under `source_crosschecked_morphology`. The source-reading panel exposes the evidence and uncertainty without modifying the published dictionary or translating unsupported sentences. The metadata integrity gate prevents changing this record to an approved held-out or training example, and CI tests both the schema and the browser evidence panel.

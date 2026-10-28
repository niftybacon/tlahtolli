# Reusable Classical Nahuatl comparative fragments — 2026-10-28

## Scope

This milestone extends Tlahtōlli's **existing** `translator-sentence.js` into source-aware contextual **nonfinite fragments**, grounded in a *different* sixteenth-century witness from the 1573 Coyoacán land sale. It is not a dialect-wide translator, a neural model, or a measurable increase in held-out translation accuracy.

### Source independent of ENL 1573

The *Florentine Codex*, Book 11, folio 62r, includes **`iuhqujn chimalli`** in a description of the *chimalmichin* (shield-fish); the published contextual rendering includes “like a shield.” [Original transcription and editorial translation](https://florentinecodex.getty.edu/book/11/folio/62r).

The [Online Nahuatl Dictionary entry for `iuhquin`](https://nahuatl.wired-humanities.org/content/iuhquin) cites Launey (2011, p. 132), Karttunen (1992, p. 109), and Lockhart (2001, p. 221), independently documenting the comparative sense “like, as if.” The [dictionary entry for `chimalli`](https://nahuatl.wired-humanities.org/content/chimalli) provides the noun's lexical senses. The source-spelled **`iuhqujn`** is already indexed as an exact historical form in `dictionary.json`; the engine does not guess that spelling by applying generic `j`/`i` substitution.

### What actually changed

`TlahtolliSentence.create(dictionary, paradigms, morphology, researchExamples)` now accepts an **optional fourth, display-only research-example argument**. It recognizes a restricted two-token construction:

`[source-linked comparative iuhquin / historical iuhqujn] + [unique Classical Nahuatl curated noun]`

It outputs a separate `fragmentInterpretations` collection, **not** a `candidates` list of complete sentences, so `complete:false` is retained. Each entry documents:

- the exact written comparative and noun,
- dictionary meanings and unresolved alternative senses,
- grammar-compositional reading (`like/as if + [all dictionary senses]`),
- hyperlinks to both dictionary records,
- if and **only if** the exact two-token historical string matches an **existing, non-training, source-attributed Florentine Codex comparison example**, a separate labeled editorial reading with that exact witness URL.

For example:

| Entered form | Engine result | What is **not** claimed |
| --- | --- | --- |
| `iuhqujn chimalli` | Source-linked comparative fragment; editorial comparison “Like a shield.” attached, explicitly **in-sample** | Independently validated model translation |
| `iuhquin chimalli` | Rule-based lexical composition; **no transferred historical English** | That normalized spelling is exact FC witness |
| `iuhquin calli` | “like/as if + [house; building; dwelling]” in an expandable **unattested hypothesis** | Historically found phrasing or selected contextual sense |
| `iuhquin cihuātl` | Preserves “woman; wife (possessed)” rather than choosing one | Verified single English rendering |
| `atl yitic nemjnj` | The comparison rule refuses; this is a different construction, also in FC Book 11 | That all Classical phrases are now parsed |

The existing sentence engine, manuscript-derived morphological clues, and source-linked single-NP verb agreement proposals remain unchanged. Nothing from a modern regional Nahuatl variety enters this grammar by default. The preexisting `research_examples.json` remains **candidate, not gold or training**. Other unverified linguistic or textual features are never silently upgraded by the presence of a published English interpretation.

### Verification and next task

`tools/test_contextual_fragments.js` covers exact source matching, generalized curated noun substitution, source/rights tampering, lexical duplicate ambiguity, unsupported suffix or third token, negation, and no regression in previously supported complete-sentence behavior. `tools/test_translator_browser.py` checks the actual visible source-linked fragment vs generic composition. The test suite does not measure translation accuracy and cannot turn these examples into an independent test set.

The next valuable frontier is a separately sourced **relational/locative** fragment rule. Florentine Book 11 also contains `atl yitic nemjnj`, but `nemjnj`'s nominal/verbal function and `yitic`'s relation to its nominal argument should be investigated independently before making even a tentative contextual interpreter. Historical attestation of a single string does not license sweeping productive syntax.

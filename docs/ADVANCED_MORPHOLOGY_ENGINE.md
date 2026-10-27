# Advanced Classical Nahuatl Morphology Engine

This is a **bounded, source-sensitive research analyzer**, not a universal
Classical Nahuatl parser and not proof of manuscript attestation.

## What it does

It reverse-analyzes an entered word form by comparing it with the **current
browser-local dictionary**, including protected personal entries and the
published 88-lemma/12-verb corpus. The UI ranks multiple analyses and explains
both morphological structure and **evidence provenance**.

| Layer | Coverage | Evidence handling |
| --- | --- | --- |
| Lexical headword and historical spelling variants | All published + local entries | A lexical identification, not contextual semantic disambiguation |
| Separately indexed noun/verb inflections | 178 published form records | Honors each form's dictionary, text, paradigm or review assessment |
| Indexed verb paradigms | 12 verb models × 10 tense/mood patterns × 6 subject persons = **720 cells** | Always marked grammar-derived, even if they resemble a manuscript form |
| Morphological segmentation of those verb cells | Subject, allomorphically fixed third-person object, recorded stem/base, residual tense/number material | Unresolved internal suffix boundaries are **left unresolved** |
| Productive transitive verb hypotheses | Controlled subject–object recombination of actual indexed verb-cell templates (excluding imperative/optative/vetitive) | **Inferences only**, subject/object reflexives and unmodeled allomorphy explicitly excluded |
| Noun stem/absolutive segmentation | Only where an editorial stem yields the exact lemma with -tl, -tli, -li, or special noun -in | Retains field-specific evidence grade; no automatic noun-plural generation |
| Possessive analogy | A narrowly evidenced full first-person form beginning with no-, analogically recombined with selected possessor markers | Generates **unverified** hypotheses; does not infer full forms from bound stems |
| Ambiguity | Multiple indexed tenses/subjects and rule possibilities | Preserves alternatives instead of forcing one explanation |
| Orthographic folding | Existing search ignores editorial macrons | Displays explicit caution about meaningful vowel length |

### Morphotactic hypotheses

Classical Nahuatl marks 1st/2nd person subjects with prefixes, normally has a
zero 3rd-person subject prefix, and expresses verbal subject plurality with
suffixes. Transitive verbs require object indexing. These general constraints
are documented in linguistic descriptions, but the **exact surface form**
still depends on class, phonology, tense, and dialect.

The productive layer therefore uses the **actually indexed model cell** as a
template. It copies that cell's identified subject prefix, fixed 3sg object
boundary, *recorded lexical base*, and residual inflectional ending. Only the
object slot is varied, and that variation is marked unverified. The analyzer
does not manufacture an unknown preterite from the citation form. It also
refuses to interpret free-form suffix chains, arbitrarily infer incorporation,
derive causatives/applicatives/passives, or mark hypothetical analyses as
historically attested.

### Confidence is a provenance classification

The ranking distinguishes cited textual examples, dictionary/grammar-located
entries, dictionary headwords, indexed but rule-derived paradigms,
hypothetical productive verb composition, and possessive analogy.
**Scores are display priorities, not calibrated probabilities of historical
accuracy or grammatical correctness.** Even a cited text requires the reader
to check edition, context, period, and original folio.

### Source, reproducibility, and privacy

The canonical engine source is
[`tools/morphology_engine.js`](../tools/morphology_engine.js).
[`tools/build_morphology_engine.py`](../tools/build_morphology_engine.py)
copies it into the existing **single-file offline HTML application**.
No external runtime dependency, remote generation API, user-data upload,
new localStorage key, or change to the 88 lexical entries is introduced.

To change the engine:

```bash
python tools/build_morphology_engine.py --write
python tools/build_morphology_engine.py --check
python tools/build_dictionary.py --check
python tools/validate.py
python tools/test_advanced_morphology.py
python tools/test_phase4.py
python tools/browser_smoke.py
```

CI also runs all earlier evidence, reader, source atlas, browser and
Phase 1–3 tests. The new test checks **all 720 published model cells**,
ambiguous forms, indexed stems, generated transitive object hypotheses,
noun segmentation, citation provenance, and unknown-word refusal.

### Remaining scholarly/engineering work

This is an advanced *bounded parser*, not a full HFST analyzer with exhaustive
lexc/twol phonology. Priority gaps: original-folio gold-standard
transcriptions, explicit macron and saltillo variants, verb negation/temporal
augment restrictions, productive reflexives, directional prefixes,
incorporation, causative/applicative/passive derivation, noun suppletion,
reduplication, semantic/valency restrictions and period-specific variation.
Each should be added only with cited positive and negative examples.

We must not import automatic rules or coverage statistics from a different
modern Nahuatl variety and assume applicability to sixteenth-century sources.
We must also **not** interpret absence from our 88-word lexicon as
ungrammaticality or historical impossibility.

## Grammar and engineering reference points

- Michel Launey (2011), *An Introduction to Classical Nahuatl*, esp. lessons
  2–3 and 8–10; [Cambridge edition](https://www.cambridge.org/core/books/an-introduction-to-classical-nahuatl/9CBFDE9F6BE1C23042F76008AE74A712).
- Karttunen (1992), *An Analytical Dictionary of Nahuatl*, via the
  [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/).
- Zúñiga and Creissels (eds., 2023), chapters on Classical Nahuatl
  applicative and clause morphology.
- Pugh and Tyers (2023),
  [Highland Puebla finite-state morphology](https://aclanthology.org/2023.americasnlp-1.12/),
  for **software architecture** comparison only; not as historical
  Classical Nahuatl attestation.

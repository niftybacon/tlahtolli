# Pinned Axolotl development cohort: all 36 source records and 275 unrecognized tokens

**Date:** 2026-10-29. **Upstream:** [Comunidad Elotl, Axolotl CSV](https://github.com/ElotlMX/py-elotl/blob/157f34300f4ca92c3d75b74ec14142916d75c30b/elotl/corpora/axolotl.csv), byte-verified git blob `90b7327fc4023ba529e1982f823ddeaee6e313e3`. **GitHub Actions evidence:** [run 40883350857](https://github.com/niftybacon/tlahtolli/actions/runs/40883350857). Analyzer: `tools/diagnose_axolotl_development.js --limit 36 --audit-36`.

This is a **development audit**, not a score, gold set or assertion that each source row is a grammatical sentence. The existing round-robin sample is pinned by exact upstream record IDs; **no failing row was discarded**.

## Findings

- **36 source rows from 17 source-work titles; 365 surface tokens.** Exactly **90 curated dictionary matches** and **275 unrecognized occurrences**, representing **232 distinct unrecognized spellings**. No missing occurrence was silently omitted.
- The **275** partition into **41 exact Classical-labelled Kaikki source-form matches**, **41 Siméon OCR-only comparisons** and **193 not located directly in either archive**. These are lexical cross-references, not verified meanings; the five already detected historical-spelling proposals overlap those groups and do not raise curated recognition.
- Only **one** of the 275 unknown occurrences has an existing canonical morphology analysis (`noteuh`). No source row gained a complete grammar candidate or bounded partial window. This is a **production morphology and lexical-form coverage gap**, not evidence that the grammar engines are absent.
- **Five rows have no curated matches at all** (upstream indices 5048, 6321, 5241, 902, 11739), while **13 rows contain at most six lexical tokens**. Two clear **name/title listings** (5048, 902) are *not suitable to treat as full independent sentence translations*. Five other rows include explicit Roman-number style material (990, 5812, 13452, 10014, 6818); whether they are dates or surrounding clauses requires source checking. One row (4751) includes a question mark, for which the current sentence parser intentionally returns no clause reading. Four source rows split into multiple punctuated units.
- Recurring missing tokens include `niman` (7), `ye` (7), `yc` (4), `oncan` (3), `ipan` (3), `nech` (3). Several of these are *already attested independently* in early dictionaries (for example [niman, Molina 1571](https://nahuatl.wired-humanities.org/node/172499), [oncan, sixteenth-century witnesses](https://gdn.iib.unam.mx/diccionario/oncan/187086), [ompa, Molina 1571](https://nahuatl.wired-humanities.org/content/ompa)), but not all are curated free lexemes: `nech` may be a bound person marker, and `ye` has multiple functions. Do not classify every unknown as a missing noun or verb lemma.
- Colonial and edited materials also contain names and Spanish orthography (`Diego`, `español`, `Don`, `José`, `Castillo`, etc.), Roman numeral forms, and long concatenated verbal sequences (e.g. `otechtlamizquiquia`, `quimocihuauhti`, `quimocuititzinohua`). They are not evidence for a universal lexical normalization or automatically inferred verb agreement.

## Every source row, unchanged cohort

The counts below are source-analysis records, **not verified complete sentences**. “Classical” means an exact source-form match in the existing *unreviewed* archive. “OCR” means a Siméon OCR-only match. “Other” has no direct archival match, which may include inflections and mixed-language or named tokens.

| Upstream CSV row | Source-work title | Tokens | Curated | Classical | OCR | Other | Inspection note |
|---:|---|---:|---:|---:|---:|---:|---|
| 12592 | Anales de Tepeteopan | 12 | 4 | 0 | 1 | 7 | source clause/fragment not certified |
| 9712 | Anales de Tlatelolco | 10 | 1 | 1 | 1 | 7 | source clause/fragment not certified |
| 10818 | Cuarta Relación (Libro las ocho relaciones) | 14 | 5 | 2 | 1 | 6 | source clause/fragment not certified |
| 13267 | Documentos nauas de la Ciudad de México del siglo XVI | 16 | 3 | 0 | 0 | 13 | source clause/fragment not certified |
| 3962 | La tinta negra y roja (antología de poesía náhuatl) | 15 | 3 | 1 | 1 | 10 | punctuation-separated units |
| 4474 | Memorial Breve (Libro las ocho relaciones) | 12 | 4 | 1 | 2 | 5 | source clause/fragment not certified |
| 9869 | Nican Mopohua | 3 | 1 | 2 | 0 | 0 | source clause/fragment not certified |
| 5048 | Primera inserción (Libro las ocho relaciones) | 6 | 0 | 1 | 1 | 4 | name/title listing; zero curated matches |
| 12629 | Primera relación (Libro las ocho relaciones) | 17 | 6 | 2 | 2 | 7 | source clause/fragment not certified |
| 4508 | Quinta Relación (Libro las ocho relaciones) | 12 | 2 | 5 | 0 | 5 | source clause/fragment not certified |
| 13342 | Segunda inserción (Libro las ocho relaciones) | 16 | 4 | 1 | 2 | 9 | source clause/fragment not certified |
| 990 | Segunda relación (Libro las ocho relaciones) | 5 | 3 | 0 | 1 | 1 | Roman-number material |
| 5812 | Tercera Relación (Libro las ocho relaciones) | 3 | 2 | 0 | 1 | 0 | Roman-number material |
| 16060 | Testimonios de la antigua palabra | 9 | 3 | 0 | 0 | 6 | source clause/fragment not certified |
| 6321 | Trece Poetas del Mundo Azteca | 3 | 0 | 1 | 1 | 1 | zero curated matches |
| 5241 | Veinte himnos sacros de los Nahuas | 13 | 0 | 0 | 3 | 10 | punctuation-separated units; zero curated matches |
| 8684 | Vida económica de Tenochtitlan | 12 | 5 | 1 | 2 | 4 | punctuation-separated units |
| 13664 | Anales de Tepeteopan | 8 | 2 | 1 | 2 | 3 | source clause/fragment not certified |
| 4751 | Anales de Tlatelolco | 18 | 3 | 2 | 3 | 10 | question punctuation blocks parsing |
| 13452 | Cuarta Relación (Libro las ocho relaciones) | 4 | 2 | 0 | 0 | 2 | Roman-number material |
| 7877 | Documentos nauas de la Ciudad de México del siglo XVI | 18 | 3 | 1 | 3 | 11 | source clause/fragment not certified |
| 5011 | La tinta negra y roja (antología de poesía náhuatl) | 6 | 3 | 1 | 0 | 2 | source clause/fragment not certified |
| 12741 | Memorial Breve (Libro las ocho relaciones) | 13 | 3 | 2 | 4 | 4 | source clause/fragment not certified |
| 8228 | Nican Mopohua | 3 | 2 | 0 | 0 | 1 | source clause/fragment not certified |
| 902 | Primera inserción (Libro las ocho relaciones) | 6 | 0 | 1 | 0 | 5 | name/title listing; zero curated matches |
| 13193 | Primera relación (Libro las ocho relaciones) | 16 | 6 | 1 | 0 | 9 | source clause/fragment not certified |
| 12894 | Quinta Relación (Libro las ocho relaciones) | 12 | 4 | 2 | 1 | 5 | source clause/fragment not certified |
| 5216 | Segunda inserción (Libro las ocho relaciones) | 12 | 3 | 1 | 1 | 7 | source clause/fragment not certified |
| 10014 | Segunda relación (Libro las ocho relaciones) | 4 | 2 | 0 | 0 | 2 | Roman-number material |
| 6818 | Tercera Relación (Libro las ocho relaciones) | 3 | 1 | 1 | 0 | 1 | Roman-number material |
| 759 | Testimonios de la antigua palabra | 9 | 2 | 2 | 0 | 5 | source clause/fragment not certified |
| 4519 | Trece Poetas del Mundo Azteca | 5 | 1 | 2 | 1 | 1 | source clause/fragment not certified |
| 5515 | Veinte himnos sacros de los Nahuas | 11 | 2 | 1 | 2 | 6 | source clause/fragment not certified |
| 7245 | Vida económica de Tenochtitlan | 15 | 4 | 3 | 4 | 4 | punctuation-separated units |
| 11739 | Anales de Tepeteopan | 18 | 0 | 1 | 1 | 16 | zero curated matches |
| 12395 | Anales de Tlatelolco | 6 | 1 | 1 | 0 | 4 | source clause/fragment not certified |

| **Total** | **36 source records** | **365** | **90** | **41** | **41** | **193** | **No gold translations** |

## Prioritized engineering changes (no duplicated engine)

1. **Correct unit-of-evaluation reporting.** Keep all 36 source rows for *lexical analysis*, but stop referring to them as 36 certified complete sentences. Source segmentation and predicate identity must be inspected before any sentence denominator is reported. Do not filter away poor-performing rows to raise metrics.
2. **Expand the *existing canonical lexicon*, not a parallel lookup.** Verify recurring early-classical function words using separate historical dictionaries, then update the existing `data/{lexicon,morphology,evidence}.json` and regenerate derived `dictionary.json`, claim ledger and offline seed with `tools/build_dictionary.py`. Do not invent noun animacy, plural or verb paradigms for adverbs/particles.
3. **Investigate unsplit finite/possessed forms in the *existing Tēntli* parser.** One unknown morphology match across 275 shows that curated roots and productive agreement coverage, not just historical spelling, are insufficient. Validate individual recurrent affixes against grammatical sources and use negative counterexamples; never infer an analysis solely because its apparent Spanish translation sounds appropriate.
4. **Report evidence tiers separately:** curated exact, archive Classical exact, OCR only, hypothesized orthography, morphological hypothesis, truly unlocated. Never add archive guesses or Spanish names to verified-recognition counts.
5. **Retain immutable sample identity.** The `--audit-36` command refuses changes to pinned row selection. A corrected *sentence evaluation cohort* should be created separately after source-level boundary verification; never relabel this development batch as held-out.

The existing parser recognizes only a bounded set of finite/nominal constructions. A row containing a longer attested historical predicate is not a grammar failure solely because the current index lacks that finite form. Similarly, editorial Spanish–Nahuatl pairs in Axolotl are not necessarily aligned at the syntactic-clause level. No English translation or accuracy figure is reported here.

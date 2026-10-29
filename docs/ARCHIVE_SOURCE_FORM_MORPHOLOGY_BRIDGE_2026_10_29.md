# Exact Classical source-form tags → provisional morphology clues (2026-10-29)

## Diagnosis

A 36,543-record unreviewed archive already has an indexed source-form lookup,
but the Tēntli morphological analyzer chiefly recognizes the curated lexicon
and 12 verb paradigms. Before this change, archive `crossCheckMorphology`
could only confirm a source-form overlap **after** the canonical engine had
already produced a candidate; it could not supply a missing form-of clue.
In the pinned Axolotl development cohort, the pre-#63 audit recorded just
one canonical morphological proposal among 275 unknown occurrences.
PR #63 added 12 *curated lexical occurrences* from three independently
sourced free words; it did not change the morphological architecture.

## Minimal bridge: existing archive, existing sentence morphology provider

`TlahtolliArchive.analyzeSourceForms(token)` examines only the already-indexed,
**exact-spelling**, Classical-labelled Kaikki source-form records. It requires
a form explicitly listed under a dictionary lemma with morphological labels:
- noun: `plural`, `possessive`;
- verb: person or tense/aspect labels (first/second/third-person,
  impersonal, preterite, imperfective, present, past, future, future-near,
  non-past).

Simple headword matches, canonical/alternative orthographic labels alone,
unrecognized-form error tags, OCR-only Siméon records, modern Nahuatl
varieties, punctuation, and approximate diacritic matches are excluded.
The result is **unreviewed**: it preserves the source lemma, POS, exact
surface and source-reported tags, never manufactures an internal morpheme
boundary, never licenses an additional tense/person or a productive
paradigm, and never produces a contextual English sense.

The browser passes these provisional candidates through its existing
sentence-level morphology-clue provider when the user has loaded the
archive. On the first successful archive load, it refreshes the current
display exactly once; curated dictionary status and bracketed English
glosses remain controlled by the existing translation engine.
No grammar candidate automatically becomes complete or translated.

The pinned Axolotl diagnostic uses the same archive adapter and reports
`archiveFormMorphologyUnknownTokens` separately from the unchanged
`sourceMorphologyUnknownTokens` (canonical Tēntli) and
`curatedMatches`. All original token and row denominators remain intact.
An archive-labelled clue can overlap lexical lookups and is not
translation accuracy, proof of linguistic correctness, or independent
manuscript attestation.

## Tests and remaining bottleneck

```sh
node tools/test_archive_lexical.js
node tools/test_axolotl_development.js
python tools/test_amoxcalli_browser.py
```

The tests cover exact source-labelled plural `alomeh` → `alo`, rejection
of modern dialect and diacritic-only near matches, non-promotion of an
unknown word to the curated gloss, and browser visibility in the existing
morphological-clue panel. The Axolotl audit remains the same pinned source
selection (no duplicate/gold claims). Repository CI is authoritative.

**Not solved:** Most unlocated forms still need source-checked root/stem
entries and productive, source-sensitive inflectional rules; a source-listed
form-of tag is not an executable grammar rule. This bridge is groundwork
for inspecting and testing real lexical morphology without adding a
parallel dictionary or weakening evidence thresholds.

# Finite intransitives with independently guarded coordinated subjects

Status: **development structural hypothesis only**. Neither standalone morphological
paradigm cells nor composed sentence strings are independently attested utterances or
held-out translation data. The project still has **zero reviewed gold pairs**.

## Existing machinery reused

This increment uses `nominalCoordinationProposals` (PR #53), exactly indexed
present forms from the existing clause parser, the curated `animacy` metadata of
each uniquely identified noun, the same shared grammatical graph (PR #43) and
its source/offset validation, and the existing English abstention policy.
No second coordination analyzer, morphology generator, or semantic translation
module was built.

The new `coordinatedSubjectProposals` searches only a **fully consumed**
`V + coordinated NP` or `coordinated NP + V` token pattern and only for
intransitive, third-person present forms with an exact index match.

A separate Classical Nahuatl grammatical reference, [GDN `ihuan`]
(https://gdn.iib.unam.mx/diccionario/ihuan/50956), says two coordinated
**animate singular nouns** may have **singular or plural verbal agreement**;
two coordinated **inanimate nouns** have **singular agreement**. The reference
describes a construction class, NOT independently witnessed occurrences
of our composed examples. The headwords themselves retain their own
dictionary sources and editorial animacy tags. Unknown/mixed animacy
fails closed. Third-person transitive object attachment is **excluded**:
its existing 3sg object marker cannot be assumed to license a pair.

## Controlled diagnostic probes, never historical quality scores

| Constructed input | Licensed structural hypothesis |
| --- | --- |
| `chōca in cihuātl īhuān in conetl` | 3sg, two animate singular heads |
| `chōcah in cihuātl īhuān in conetl` | 3pl, same animate pair |
| `in cihuātl īhuān in conetl chōcah` | preposed animate pair |
| `tlami in xōchitl īhuān in tetl` | 3sg inanimate pair; contextual sense unverified |
| `tlamih xochitl, ioan tlapalli` | REFUSED: 3pl inanimates |
| `niquitta in cihuātl īhuān in conetl` | REFUSED: transitive 3sg object |
| `chōcah in cihuātl īhuān in xōchitl` | REFUSED: mixed animacy not evidenced |

Where the historical `ioan` spelling occurs, the original PR #53 exact
Florentine folio window gate still applies. An unattested substitution
cannot acquire that spelling by analogy.

The IR creates a **candidate-only predicate-to-coordinator** edge after
independently rechecking the original token offsets, both noun lexical
sources and animacy classes, the coordinator provenance, and the
canonical paradigm's exact person/tense/lemma form. All noun-head nodes
retain `grammaticalRole:null`, `number:null`, `referentId:null`.
The UI labels candidates explicitly as **NOT a translation**.
No complete English draft is generated and `complete:false` remains.

The Florentine XI 217r seven-word excerpt remains **untranslated**:
its overlapping source-finite and noun-coordination windows are not promoted
to a complete clause interpretation.

## Integrity checks

- `node tools/test_coordinated_subject_agreement.js`
- All existing nominal coordination, clause and grammar-IR regressions
- Browser translator diagnostics, full repository CI

The test suite includes negative number/valency/person/animacy cases,
unsourced `ioan`, source URL tampering, fabricated indexed spellings, and
prohibits language-quality scores. Any broader attachment—particularly
transitive objects, comitative scope, dependent clauses or past tenses—requires
new independent Classical sources and should not be inferred from this PR.

## Independent evaluation remains a separate, necessary milestone

No case here may be entered as gold: all are constructed during development.
Independent manuscript-grouped transcription, review and rights-cleared
aligned interpretations must precede the first actual accuracy measure, as
specified in `research/translation_corpus/EVALUATION.md`.

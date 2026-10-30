# Training batch: Brinton's 27 poems + Chimalpahin prose

## Actual executed source experiment — 2026-10-29

This expands the earlier Tēntli neural checkpoint, **without changing any
canonical morphology, grammar, shared IR, dictionary claims or public
translator**. It uses source text from two independently identifiable
U.S.-public-domain Project Gutenberg editions:

| Work | Exact upstream | Extracted historical text | English role |
| --- | --- | --- | --- |
| Daniel G. Brinton, *Ancient Nahuatl Poetry* (1890) | [Gutenberg #12219](https://www.gutenberg.org/ebooks/12219) | **27 poems, 217 stanzas** | **165 short verse-number-matched English renderings** as **candidate weak translation training**, not verified literal gold; 52 longer English stanzas excluded from bilingual training rather than misaligned/truncated |
| Chimalpahin Cuauhtlehuanitzin, *Yntemoca yntlacamecayo...* (colonial historical lineage narrative) | [Gutenberg #21802](https://www.gutenberg.org/ebooks/21802) | **65 prose paragraphs, 23,077 source characters** | **0 translation pairs**. Gutenberg references a distinct copyrighted English print edition, so it is not treated as a licensed parallel target. |

**282 total Nahuatl text records**, 165 weakly aligned English target
records. Both original source downloads are source-pinned:

- #12219 decoded UTF-8 source SHA256: `5b7c4a799063e22c1ce91a798bb86ffbd1ead3e093771220f7eba92d6070b2c0`.
- #21802 decoded UTF-8 source SHA256: `db3f883ef2924c044dbc9edffbcd1d0dce2e837f24d74d810d02c79ef0f0b356`.

These are the exact publicly downloadable source editions used in
[the successful training workflow run](https://github.com/niftybacon/tlahtolli/actions/runs/40983513345).
The source text is consumed temporarily and excluded from git; the
workflow stores the model weights, metadata and source hashes.

## What the model actually learned

The workflow re-creates the **1,367 synthetic teacher examples** from
existing canonical Tēntli grammar/morphology and distills them into real
PyTorch weights (96 gradient steps). It then learns from the previously
admitted **112 Nahuatl stanzas in 20 Brinton/Sahagún-related hymns**
(56 steps), preserving the learned model weights between stages.
It finally **continues the same weights** using the newly acquired
27 Brinton poems **and** Chimalpahin prose (160 additional steps).

English pairs are weak verse-level supervision **only** where the entire
numbered Nahuatl stanza and its associated numbered English rendering
fit the model's 254-byte payload each. The other 52 poem stanzas remain
valid **monolingual historical source input**. Chimalpahin prose is
monolingual. There is no claim that the English is word-for-word, and
no invented English counterpart for Chimalpahin.

The source collector recognizes both the initial Nahuatl and English
`I.` poem headings without counting a 28th poem, excludes Brinton's
introductory English and notes, and strips bracketed transcriber/folio
annotations from the Chimalpahin edition. It preserves the edited
Nahuatl spelling—including overbar-as-tilde notation, where present.
No source-data row becomes an independently approved historical
translation or a source-reviewed morphological analysis.

## Risks and constraints

- **Accuracy remains unmeasured.** The extra 160 gradient steps show
  actual training, not generalization. The neural output stays separate
  from Tēntli's published grammar and translator.
- Brinton's poetic English is an interpretive Victorian-era translation,
  not expert-aligned literal gold; its examples are down-weighted at
  `candidate` grade. No held-out quality scores are fabricated.
- The two works share old Classical-period Nahuatl but have different
  editions, genres, historical provenance, and spellings. They are
  separate `work_id` groups, not randomly divided across train/test.
- Chimalpahin's original manuscripts and the 2007/2025 Gutenberg
  transcription have different witness/version identities; any
  corrected transcription should require a changed source hash.
- The trained model remains a small experimental encoder–decoder and
  is not a production-quality DeepL replacement. Model weights are
  a research workflow artifact rather than shipped on the public site.

## Reproduce from the repository

```bash
# Check the source parsing with synthetic fixtures and existing grammar:
python -m unittest discover -s tools -p 'test_poems_chimalpahin_intake.py' -v
node tools/test_tentli_teacher.js

# Get the original public-domain editions (not modern copyrighted translations):
curl -fsSL https://www.gutenberg.org/ebooks/12219.txt.utf-8 -o /tmp/brinton27.txt
curl -fsSL https://www.gutenberg.org/ebooks/21802.txt.utf-8 -o /tmp/chimalpahin.txt

# Prepare the source-aware corpus, retaining citations and weak alignment grades:
python -m neural.intake_poetry_chimalpahin --poems /tmp/brinton27.txt \
  --prose /tmp/chimalpahin.txt --output /tmp/nahuatl-two-works.jsonl

# The full reproducible teacher -> earlier hymns -> both new books
# training chain is in .github/workflows/tentli-poems-chimalpahin-training.yml.
```

Do not treat this source code as a replacement for any older PR, or
claim that these 165 weak alignments are 165 verified gold translations.

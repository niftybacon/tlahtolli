# Temoa historical narrative and Chimalpahin corpus: research intake

**Status:** Source-bounded private/noncommercial research; *not* a publicly
licensed historical-parallel dataset, a released machine-translation model,
or expert-verified manuscript/translation gold.

## Why these are new source works, not five more Florentine books

[Temoa, UNAM](https://temoa.iib.unam.mx/) contains about a hundred
editorially encoded historical documents, annotations and dictionaries.
Its catalog includes separate paleographies of the Florentine Codex
(already trained by Tēntli), Cantares (future literary work),
Chimalpahin's Third and Eighth Relaciones, and independent chronicles.
Only **five named historical prose work IDs** are admitted here:

| Work in Temoa | Exact source URL | Independent witness identity | Experiment |
| --- | --- | --- | --- |
| Chimalpahin, *Third Relación* | https://temoa.iib.unam.mx/3-relacion-de-chimalpahin | Early-17th-century Chimalpahin, BNF Mexican manuscript 74, Third Relación | Nahuatl denoising |
| Chimalpahin, *Eighth Relación* | https://temoa.iib.unam.mx/8-relacion-de-chimalpahin | BNF Mexican 74, Eighth Relación; separate text and URL, *not* another copy of the third | Nahuatl denoising |
| *Anales de Cuauhtitlan* | https://temoa.iib.unam.mx/cuauhtitlan-anales | Códice Chimalpopoca annals; not by Chimalpahin | Nahuatl denoising |
| *Leyenda de los Soles* | https://temoa.iib.unam.mx/la-leyenda-de-los-soles | Códice Chimalpopoca mythic-historical prose, distinct narrative | Nahuatl denoising |
| *Anales Mexicanos* | https://temoa.iib.unam.mx/anales-mexicanos | Historical annals; editor/witness date needs further bibliographic investigation | **Development-only denoising** |

**Excluded:** all Florentine passages, all modern Nahuatl varieties,
Cantares, Spanish/French editorial texts, lexical dictionaries, pictorial
codex-only annotations, and the short Culhuacan Chimalpahin work previously
learned via Gutenberg. No English or Spanish translation pairs are
created or inferred. The historical texts are longer than Tēntli's
previous Nahuatl poetry and prayers; these prose works can supply
complex discourse and referential patterns even before semantic
translation supervision is approved.

**Publication identities:** According to Rafael Tena (1998), BNF
Mex. 74 contains eight Relaciones and the *Memorial de Colhuacan*:
these are *separate manuscript work units*, but one broader composite
manuscript. They must not be counted as eight independently authored
books or as equivalent to the previously trained short Chimalpahin
lineage. Cite
https://nahuatl.historicas.unam.mx/index.php/ecn/article/view/77927 .
Historical source literary authorship and the modern paleographer's
copyrighted edition are distinct.

## Source selection and actual text structure

The public UNAM site renders a list of folios for some editions and
`article.nahuatl` sections within `div.parrafos`:

- The Third Relación lists **approximately 95 folio-side links**;
  folios with only a small rubric are excluded rather than filled in.
- The Eighth Relación is represented with unusually long continuous
  text sections (a source-specific virtual `0r` locator, not a claim
  that an entire long work is physically written on one manuscript
  folio). The importer does not invent physical leaf numbers.
- The Cuauhtitlan annals and *Leyenda de los Soles* similarly use
  virtual/aggregate folio identifiers for certain transcribed blocks.
- The code explicitly chooses `article.nahuatl`; it never extracts
  separately displayed `article.traduccion`, translated scholarly
  notes or HTML navigation. Automatic function-word screening is
  a **conservative Nahuatl-majority heuristic**, not expert
  adjudication of every code-switched sentence.
- Large digital articles are split into **technical 6,000-character
  training containers**, which **do not denote Nahuatl sentences**,
  morphological units, or new paleographic divisions. The existing
  `neural.train` chunks source bytes without silently truncating any
  character. Original spellings are not standardized or corrected.
- Exact duplicate chunk hashes are removed across the five new
  works. This **does not guarantee** deduplication across *earlier*
  Axolotl excerpts or other manuscript editions; some source titles
  already appeared in Axolotl. Hence development loss is **not**
  independent historical translation accuracy or blind manuscript
  evaluation.

Keep all folios and chunks of a historical source in **one work-level
split** rather than dividing neighboring paragraphs randomly.
The data collection inventory retains source URLs and per-source
SHA-256, but neither full text nor a searchable replacement database
is committed.

## Access, copyright, training basis and public release

**Original manuscripts** (16th–17th century) are historical. However,
Temoa's *modern digital paleographies* are scholarly edited works.
The [UNAM credits](https://temoa.iib.unam.mx/creditos) explicitly
attribute transcriptions and the web edition, © 2018 UNAM. A
[2023 research review](https://aclanthology.org/2023.americasnlp-1.pdf)
notes UNAM's retained re-release/derivative-work controls for its
Florentine digital edition. The site's public text visibility does
**not** automatically authorize redistribution or unbounded
commercial reuse of each paleography.

This experiment uses the `fair_use_assessed` **preliminary** private
research intake tier and a source-specific purpose/access/market
assessment: noncommercial linguistic-learning experiments, lawfully
accessible public HTML with author/work/source URLs, temporary inputs,
no source-substituting text copies committed to Git, and no machine
translation output released as a scholarly edition. The amount is
material (substantial sections of complete editorial editions),
and future commercial weights could compete with UNAM offerings;
that weighs against assuming automatic fair use. A separate
professional legal analysis may be warranted before commercialization.
This documentation is **not a fair-use determination, a license,
an agreement from UNAM, or legal advice**.

Both the historic Latin-alphabet original and its modern transcription
have separate rights questions; no editorial translations are used.
Any future public release of weights requires separate review of
training acquisition, output memorization/extraction, market effects,
licenses and independently assessed translation accuracy. The research
checkpoint is a short-lived GitHub Actions artifact with
`weights.pt` and aggregate provenance only.

## How to reproduce

```sh
python -m pip install requests beautifulsoup4
python -m unittest discover -s tools -p test_temoa_chimalpahin_intake.py -v
python -m neural.intake_temoa_chimalpahin \
  --delay 0.3 --output /tmp/tentli-temoa-private.jsonl
```

The [source-only extraction + continued-training workflow](../.github/workflows/tentli-temoa-chimalpahin-training.yml)
also downloads and verifies **the previously trained** Tēntli
Sahagún-sermons PyTorch checkpoint from
[run #40990926995](https://github.com/niftybacon/tlahtolli/actions/runs/40990926995).
It will never silently restart from random weights and call that
"continued training." All public canonical morphology, grammar-IR,
lexicon and translator code remain unchanged.

## Measured manuscript intake (real Temoa source, 2026-10-29)

The first complete source ingestion fetched and checked the actual Temoa
Nahuatl editions, excluding French/Spanish translation panels and
pictorial/Florentine materials. These are source-extracted *character*
counts, not linguistic word counts or independent English/Spanish gold.

| Work | Indexed source pages / folio routes | Editorial Nahuatl articles | Nahuatl-majority chars before technical splitting |
| --- | ---: | ---: | ---: |
| Chimalpahin Third Relación | 94 | 310 | 137,492 |
| Chimalpahin Eighth Relación | 3 | 43 | 126,664 |
| Anales de Cuauhtitlan | 1 (aggregate/virtual) | 52 | 192,544 |
| Leyenda de los Soles | 1 (aggregate/virtual) | 9 | 32,565 |
| Anales Mexicanos | 3 | 27 | 10,673 |
| **Total** | **102 source routes** | **441 editorial articles** | **499,938 source characters** |

After purely technical chunking into bounded, provenance-bearing records
and excluding unusable/duplicate material, **450 independent record
identifiers** were admitted to the `neural/corpus.py` research intake.
This is **not** 450 independently reviewed sentences, and a digital
aggregate folio route is NOT necessarily one physical manuscript leaf.

All five work titles are explicitly separated and source-located in the
existing `research/translation_corpus/source_candidates.csv` to avoid
a second bibliography. The Eighth/Third Relaciones are the actual larger
Chimalpahin work witnesses, not the previously trained Gutenberg short
Culhuacan lineage. The Anales de Cuauhtitlan and other Temoa texts may
still overlap source passages in earlier Axolotl rows, so held-out
denoising metrics must not be called unseen translation accuracy.

## Required validation before claiming success

Training succeeds only after Temoa reports the exact five work groups
and actual readable Nahuatl prose, a valid preserved base checkpoint,
a positive number of real optimization steps, and a saved source-aware
weights artifact. *No* translation-accuracy score will be inferred from
training loss. Source counts and exact results must come from the CI
run, not invented in advance.

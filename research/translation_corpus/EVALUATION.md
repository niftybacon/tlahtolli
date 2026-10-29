# Independent Classical Nahuatl translation evaluation — readiness protocol

**Current status: NO independently reviewed held-out translation benchmark. Translation accuracy is not measurable.** This is an integrity gate and a coverage diagnostic, **not** a claim that Tlahtōlli translates Classical Nahuatl reliably.

Run from the repository root:

```sh
python tools/validate_translation_corpus.py
node tools/evaluate_translation_readiness.js
node tools/evaluate_translation_readiness.js --json
node tools/test_translation_readiness.js
```

## What is currently available

- `pairs.csv`: **zero** approved source-aligned parallel examples as of October 28, 2026.
- `research_examples.json`: **three display-only candidate passages** from the Florentine Codex. These are already indexed in the translator, have unresolved text/translation rights, and do **not** constitute unseen reference answers.
- `dictionary.json` and `paradigms.json`: the existing curated lexicon and grammar-derived forms; not a held-out translation corpus.
- The imported Siméon and Kaikki dictionaries are source-linked lexical aids, **not** adjudicated sentence alignments.

The readiness command reports `translation_accuracy: null`. It may show the number of tokens recognized by the current curated dictionary and whether a bounded grammar candidate exists for each **already-known** research example. Those are **in-sample engineering diagnostics** only. The script explicitly constructs the lexical analyzer with **no saved research passages**, so a verbatim stored phrase cannot inflate the probe. It still does not make the examples independent: their component words and prior editorial choices have affected project development.

## First non-blind manuscript intake — 1573 Coyoacán land sale

We selected **Early Nahuatl Library BC16a000**, archived as **AGN Tierras 1735, exp. 2, folio 122**. See [source review and facsimile](source_reviews/ENL_BC16_1573.json) and the [self-review procedure](source_reviews/README.md).

The actual manuscript image has been viewed, but the tiny first-pass excerpt was located with the assistance of a published transcription. **The published English translation was also consulted**, so it would be misleading to place the source in a blind test set. It is reserved for *development source inspection only*. Its language/date are more directly relevant to sixteenth-century Classical Nahuatl than the 1833 Luke edition, but that does not verify any candidate reading.

The evaluation readiness tool loads this source-review record and rejects attempts to label this source as a clean held-out test. It reports only mechanical dictionary lookup diagnostics for the excerpt; `y¯` remains an unresolved written abbreviation. No translated pair, rights clearance, gold score, or independent human language assessment has been produced.

## Admission protocol for future test cases

1. Choose a manuscript or source document **not used** in public Tlahtōlli passage examples, dictionary tuning, rule selection, or other development. Register the full work/source ID; do not split adjacent lines or folios randomly into train/test.
2. Establish the source's **date, geographic variety, exact document and folio/segment reference**. Classical Nahuatl is the target. A nineteenth-century southern Puebla Gospel or modern variety is **not** interchangeable with sixteenth-century Classical Nahuatl.
3. Transcribe the original spelling from a facsimile, independently of machine-suggested normalization. Record both original and normalized text, with accountable human reviewer names and uncertainties.
4. Obtain a source-located, legally usable English or Spanish interpretation. Keep a literal gloss, idiomatically readable translation, and historical Spanish paraphrase distinct. Record reviewer(s), edition and translation source URL. Do not machine-generate a purported gold answer.
5. Review difficult senses, morphology, subject/object role, omitted arguments, orthographic variants and possible multiple acceptable readings **before** comparing the tool's output to the reference. Record disagreements and allow abstention when the source is genuinely unclear.
6. Allocate the **entire source_id and split_group** consistently to one data split. Keep any source already in the public example set out of the independent test split. Deduplicate original and normalized token sequences across splits. Freeze the evaluation inputs and model version **before** blinded judgment.
7. Enter the rights-cleared, reviewed, aligned record in `pairs.csv` using the documented column schema and the existing `approved` gate. The data validator and readiness audit must both pass. **Automated tests do not verify that the named reviewers actually did the work or that the historical interpretation is correct**: an independent human source audit remains mandatory.

The readiness checker rejects: non-Classical approved test data, missing rights/reviewer metadata, unapproved rows assigned to any split, overlap with indexed display examples, duplicated strings across splits, and a source ID or split group appearing in more than one split. These are *minimum* checks, not evidence that surviving records are truly out-of-distribution or correctly translated.

## Document-level contamination audit (2026-10-29)

The admission audit now reads the **existing** development evidence in
`data/passages.json`, `research_examples.json`, the inspected ENL source-review
records and the known 1833 Luke edition metadata. These were already used by
the translator. A test pair cannot become independent by merely using a
different `source_id`, a different folio URL, an `/en/` vs `/es/` URL,
a changed query string, or copied text with editorial macrons removed.

Safeguards:

- The Florentine Codex is treated as **one consulted work** across books,
  folios and language routes. All of it is excluded from clean held-out test
  claims because the project has used multiple portions in grammar development.
- The ENL BC16a manuscript is excluded across its specific image and catalog
  subpages; other ENL manuscripts are **not automatically excluded**.
- The original 1833 Luke edition is excluded from independent *Classical*
  evaluation, irrespective of its already documented variety mismatch.
- Original and normalized development passages are matched by conservative
  orthography-insensitive fingerprints. Four consecutive source words appearing
  inside a longer candidate reveal a reused window; shorter passages only
  trigger on exact normalized equality. The four-word rule can have false
  positives: a reviewer must resolve a conflict **before** admitting a source,
  not suppress the diagnostic to obtain a favorable score.
- Pairs in different train/dev/test splits may not share a canonical source
  work URL even if their source IDs and split groups differ.

This is **not a complete plagiarism detector**. Alternate hosts, private
copies, undocumented aliases, content reuse through paraphrase, and manuscript
identity that cannot be determined from an archive URL still require a human
source-lineage audit. Automated source-collision checks are conservative
metadata gates; they do not verify that an unseen reviewer did not read the
translation or that any gold sentence is linguistically correct.

The new source lead **Crónica mexicáyotl**, edited with Nahuatl paleography
and Spanish translation by Gabriel K. Kruell (UNAM 2021), is bibliographic
metadata only, not an entered test sentence: no passage text was imported,
manuscript witness collated, translation permission granted or reviewer
appointed. The edition is based on the Códice Chimalpáin and must not be
silently combined with the distinct earlier edition's manuscript witness.
See `source_candidates.csv`. Treat that lead as **possible future intake,
not an independent benchmark already obtained**.

## What may eventually be measured

Once independent references and human assessments exist, report separately:

- **Coverage**: exact lexical retrieval, unknown/ambiguous/orthographically uncertain words, and grammar-candidate availability. These quantities are automatic but **not** translation accuracy.
- **Human-reviewed adequacy and sense selection**: whether a proposed reading preserves the actual predicate, roles, polarity, tense/aspect where recoverable, and meaning in the document context; distinguish correct, partial, incorrect and unresolved.
- **Abstention quality**: unsupported completions, dangerous overconfident sense choices, unsupported vowel-length fixes, and legitimate rejections.
- **Source contamination**: demonstrate no manuscript/page used for gold test was intentionally used in rule design, example lookup, or model training.

Do **not** automatically compare Tlahtōlli's bracketed dictionary glosses to a prose translation using string equality, BLEU, or another scalar metric and call the result a translation score. The current system is not a trained neural model. With zero human-scored held-out predictions, the proper reported translation-quality value remains **not available**.

## Research ethics and licensing

Public web access is not authorization to reproduce modern translations for training or benchmarking. Historical manuscripts, modern editions, digitized transcriptions and third-party English/Spanish interpretations have different rights. Store source URLs and rights records where redistribution is not cleared. Never represent an AI-generated Classical Nahuatl sentence as attested language.

The audit is reproducible from checked-in source code; nothing in it silently promotes source candidates into an approved data set.

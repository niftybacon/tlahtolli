# Anderson–Dibble as neural training material: assessed fair use vs public release

**Scope:** Tēntli's existing neural train/teacher pipeline. This document
does not authorize scraping Getty or claim that Tlahtōlli has trained on or
redistributed any Anderson–Dibble text. It is not a legal opinion.

## Why the former license-only gate was too narrow

Text copyright and machine-learning research are not identical to public
redistribution of a book. In June 2025, federal courts in *Bartz v. Anthropic*
and *Kadrey v. Meta* ruled for fair use on specific AI-training facts, while
distinguishing issues around pirate-source acquisition, retained copies and
market harm. These decisions are fact-specific and do **not** supply blanket
permission for our Classical Nahuatl translation model. In particular, a
model generating substantially the Anderson–Dibble English from Florentine
Nahuatl could compete with or reconstruct the protected translation.

The [Getty publication's rights table](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions)
identifies Anderson–Dibble Nahuatl-to-English text as **University of Utah
Press, all rights reserved**. This classification means it is *copyrighted*,
not that every machine-learning use is categorically prohibited. However,
Getty's permission to display the book does **not** itself grant third parties
a bulk-download or ML-training license. Any such research use needs an
explicit acquisition/access and legal-basis review.

## Explicit private fair-use research path

The Tēntli `neural/corpus.py` intake now supports `fair_use_assessed` as a
separate, documented factual *claim* alongside public domain, Creative
Commons and licensed training. It requires:

- A source URL and date/variety/work/folio reference, original written text,
  train/dev/test split and transcription quality grade, exactly as before.
- `acquisition_url`: locator for the specific lawfully acquired transcription
  or English edition, rather than a pirate mirror or unverifiable scrape.
- `assessment_url`: an accessible locator for a **source-specific fair-use
  assessment**. A link to a general article is not source-specific review.
- `assessment_note`: at least a meaningful account of purpose, acquisition,
  amount, nature and market effects. This does not itself establish fair use.
- `no_source_redistribution:true`: no source text, excerpts, private alignments
  or raw training bundles in the public repository or model artifacts.

**Original Nahuatl and published Anderson–Dibble English must receive separate
rights assessments**. The public-domain Sahagún manuscript does not put the
modern English translation into the public domain. Neither should a model
trained on this material silently train on the Spanish column as though it
were equivalent to Nahuatl.

A *schema illustration only* (no copyrighted text is included):

```json
{
  "record_id": "FC_BOOK_FOLIO_SEGMENT",
  "work_id": "FC_AD_BOOK_1",
  "source_url": "https://florentinecodex.getty.edu/book/1/folio/...",
  "variety": "Classical Nahuatl",
  "source_date": "1577",
  "original": "<privately and lawfully obtained Nahuatl text>",
  "transcription_status": "editorial",
  "rights": "fair_use_assessed",
  "acquisition_url": "https://florentinecodex.getty.edu/",
  "assessment_url": "https://example.org/REPLACE-WITH-ACTUAL-SOURCE-SPECIFIC-LEGAL-REVIEW",
  "assessment_note": "<replace with a real documented acquisition, fair-use and market-impact analysis>",
  "no_source_redistribution": true,
  "split": "train",
  "translation": {
    "text": "<privately and lawfully obtained Anderson–Dibble English>",
    "language": "en",
    "rights": "fair_use_assessed",
    "source_url": "https://florentinecodex.getty.edu/book/1/folio/...",
    "acquisition_url": "https://florentinecodex.getty.edu/",
    "assessment_url": "https://example.org/REPLACE-WITH-SOURCE-SPECIFIC-ENGLISH-REVIEW",
    "assessment_note": "<replace with assessment separately addressing the modern English translation>",
    "no_source_redistribution": true,
    "alignment": "candidate"
  }
}
```

These placeholders must **never** enter a real training set. The model
cannot learn English from schema metadata alone. An external, real,
source-aligned historical corpus is still required. Existing `neural/train.py`
does the actual PyTorch fitting with optional teacher checkpoint warm-start;
there is no second grammar engine. `candidate` translation alignment is
weaker than `reviewed` and does not mean independent gold accuracy.

## Publishing a trained translation model is a separate event

Running training and distributing weights are distinct decisions. Before a
public model release, use `python -m neural.release_audit --model-dir ...`
and a separately maintained review record. Its engineering checks include:
actual bilingual training, independent human-reviewed held-out accuracy,
source-acquisition documentation, passage memorization/extraction tests and,
for fair-use-assessed training inputs, a separate model-publication
assessment URL. The command prints blocker categories without printing any
copyrighted English or Nahuatl passages.

A passing checklist is **not** legal approval. Human review of fair use,
market effects, website access conditions, and memorization findings is
still necessary. Tēntli's current model has **no Anderson–Dibble examples**
and no measured translation accuracy. Do not claim public English model
readiness or ship unrestricted weights as a proven translator.

## External legal and source references

- [Getty / University of Utah Press rights](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions)
- [June 23, 2025 *Bartz v Anthropic* fair-use order](https://docs.justia.com/cases/federal/district-courts/california/candce/3%3A2024cv05417/434709/231)
- [June 2025 *Kadrey v Meta* court order](https://law.justia.com/cases/federal/district-courts/california/candce/3%3A2023cv03417/415175/598/)
- [US Copyright Office Part 3 report (2025)](https://www.copyright.gov/ai/)

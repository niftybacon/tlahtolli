# Amoxcalli / Flor y Canto lexical import (2026-10-28)

**Status: supplementary lexical archive, not reviewed additions to Tlahtōlli's curated dictionary.** The original 115 source-researched headwords, morphological paradigms, claim classifications, saved-study IDs and browser-local edits remain unchanged.

## Imported data

- **28,709** records parsed from Rémi Siméon, *Dictionnaire de la langue nahuatl ou mexicaine* (1885). All French source definitions, parsed POS and available root analyses were retained in 15 JSON shards. The original 1885 text is public domain; the parsed/OCR edition redistributed here comes from the Amoxcalli project, licensed **CC BY-SA 4.0**. This automated OCR has substantial mistakes, including apparent page headings: records must not be treated as verified headwords.
- **7,834** publicly supplied *raw* English Wiktionary/Kaikki records, covering Classical (nci), Central (nhn), Central Huasteca (nch) and Eastern Huasteca (nhe) Nahuatl, retained in four JSON shards. Forms, gloss alternatives, grammatical tags and etymology text are retained. Kaikki/Wiktionary reuse is governed by the **CC BY-SA 3.0 / GFDL** source terms; Amoxcalli-derived organization is **CC BY-SA 4.0**. This includes varieties and modern words which are **not** independent evidence for sixteenth-century Classical Nahuatl.
- **36,543 source rows total**. The current Amoxcalli site separately advertises a **37,146-entry merged master SQLite database**; the two accessible raw GitHub sources are not identical to that master and this integration does **not** claim all 37,146 merged master entries are imported. The user-facing application reports the actual count.
- No automatic English translation of Siméon's French definitions was generated. Original French nuance is preserved rather than replaced by unreliable glosses.

The machine-readable `manifest.json` records sources, licenses, varieties, counts, and provenance. Imported records preserve headwords as written; these are source-level references and never introduce new Tlahtōlli attested form or morphology claims.

## Source attribution

- Sam Villa-Smith / Amoxcalli — Flor y Canto Nahuatl, 2026: https://github.com/samvillasmith/amoxcalli-nahuatl-project
- Siméon parsed file: https://github.com/samvillasmith/amoxcalli-nahuatl-project/blob/main/simeon_parsed.json
- Kaikki raw file: https://github.com/samvillasmith/amoxcalli-nahuatl-project/blob/main/source_data/nahuatl_kaikki_raw.jsonl
- Tatu Ylonen, *Wiktextract: Wiktionary as Machine-Readable Structured Data*, LREC 2022: https://kaikki.org/
- Original historical work: Rémi Siméon, *Dictionnaire de la langue nahuatl ou mexicaine* (Paris, 1885).

**Reuse notice:** The imported datasets retain their indicated share-alike conditions. Do not treat them as license-free material or merge them into Tlahtōlli's independently curated research ledger without a rights and source review.

## Integration and limitations

The **Dictionary → Expanded lexical archive** panel loads the imported shards only on request. It offers source/variety filtering, full French definitions and alternate English glosses, and links back to attribution. The translator preserves its 115-headword curated recognition statistics, but when an input token is unknown it can also display exact matching **unreviewed** reference records from Siméon or Kaikki's **Classical** section. Modern dialect forms are not quietly mixed into translator output. Archive suggestions never become definitive translations and are not fed to sentence grammar or automatic flashcard creation.

The source archive is fetched once per browser session; it is not downloaded at initial page load, does not upload local learning data, and does not perform neural training. As a large document collection, its initial load and memory cost are substantial. OCR errors, semantic segmentation and historical orthography distinctions remain unresolved; many tokens, including some 1833 Luke spellings, may still lack a supported lexical interpretation. Historical exact forms from Siméon are not automatically converted into macron-normalized modern spellings.

This changes lexical **access and candidate discovery**, not verified accuracy, sentence translation competence, or model parameters.

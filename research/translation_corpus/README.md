# Tlahtōlli · Classical Nahuatl Translation Corpus (Stage 1)

**Status: source intake, not a released training dataset.** The objective is a rights-cleared, provenance-rich, reviewed collection of aligned Classical Nahuatl passages. No row is approved for model training merely because a text and translation are available online.

## What contributors should send

The easiest contribution is a **URL to an original Nahuatl passage and a URL to an English or Spanish translation**, ideally naming the edition, chapter or folio, and the variety and date if known. Send one to three sources at first; you do **not** need to transcribe or align anything. Links to audio readings and their transcripts are welcome as a **separate speech project**; audio is not a substitute for a verified text–translation pair.

When a translation is behind copyright or other reuse restrictions, contribute only the source link and bibliographic reference. Do not copy full copyrighted translations into GitHub without appropriate permission.

## Data integrity rules

1. **Variety matters:** Classical Nahuatl is the primary target. Modern Huasteca, Central Puebla, and other varieties are labeled separately and never silently merged with Classical evidence.
2. **Every pair needs provenance:** Exact source title, reference URL, folio/page or segment identifier, editors/translators, date/region where known, and original vs normalized orthography.
3. **Separate attested text from interpretation:** An original transcription, scholarly normalized reading, literal gloss, historical Spanish rendering, and modern editorial translation are different objects. Do not treat historically adapted paraphrases as literal sentence alignments.
4. **Record permissions explicitly:** `unknown` means *not usable for training*. Verify rights for both transcription and translation; being publicly readable is not permission to train or redistribute.
5. **No fabricated examples:** Never machine-translate into Nahuatl and then label the result as historical. Hypotheses must be visibly distinguished from evidence.
6. **Train/evaluation separation:** Reserve complete source documents or manuscript units, not random adjacent sentences, as held-out tests. This reduces text leakage and memorization.
7. **Human review:** Only rows marked `approved` with rights clearance and source-accurate alignment should enter a future training set. Automated validation is not expert linguistic review.
8. **Keep the public dictionary intact:** This is a separate research dataset; adding a candidate row does not overwrite the published 115-headword dictionary or existing reading passages.

## Files

- [source_intake_template.md](source_intake_template.md) — plain-language source information for contributors.
- [pairs.csv](pairs.csv) — future parallel-text records. Currently header-only by design; placeholders are not training data.
- [research_examples.json](research_examples.json) — three short historical passage candidates for the translator preview, explicitly **not approved for training**.
- [tools/validate_translation_corpus.py](../../tools/validate_translation_corpus.py) — checks approved-pair provenance, permissions, document-grouped holdouts, and rejects any unapproved rows assigned to a training split.
- [tools/test_translator.js](../../tools/test_translator.js) — regression checks for phrase provenance, lexical index, dialect isolation, and unknown-word behavior.
- [source_candidates.csv](source_candidates.csv) — bibliographic leads that require rights and alignment assessment.

## Review workflow

`candidate → permissions_checked → transcribed → aligned → linguistically_reviewed → approved`.

Only an explicit `approved` status and verified permissions authorize training use. Keep source-based groups together when eventually splitting into training/dev/test datasets.

## Useful starting places to investigate

- [Digital Florentine Codex](https://florentinecodex.getty.edu/en/) — original manuscript and editorial materials; modern translations/transcriptions can have their own rights.
- [Early Nahuatl Library](https://enl.wired-humanities.org/content/welcome-early-nahuatl-library) — historical texts with source-specific descriptions.
- [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/) — lexical verification, not automatically a sentence-parallel corpus.
- [Gran Diccionario Náhuatl](https://gdn.iib.unam.mx/) — bibliographic/lexicographic cross-references.

**Do not bulk scrape.** Begin with small, individually reviewed passages, proper attribution, and explicit permission checks.

## New source: historical Gospel of Luke (1833)

Mariano Paz y Sánchez, *El Evangelio de S. Lucas: del Latín al Mexicano ó mejor Nahuatl* (1833), [public-domain original scan](https://commons.wikimedia.org/wiki/File:Yacuic_iyec_tenonotzaltzin_in_Jesu-Christo,_quenami_oquimo_ihcuilhuili_in_San_Lucas.pdf). Source metadata in [luke_1833_source.json](luke_1833_source.json). Cambridge University Library identifies this historical variety with southern Puebla around 1830; it is **not automatically identical** to sixteenth-century central Mexican Nahuatl.

The reproducible [1833 Luke analyzer](../../tools/analyze_luke1833.py) has successfully scanned the Internet Archive plain-text OCR and stores only [derived aggregate measurements](luke_1833_analysis.json): **26,201 approximate OCR letter-runs**, **5,404 distinct OCR forms**, **4,589 direct dictionary-form occurrences**, and **1,217 additional tentative matches after guarded historical spelling substitutions**. Counts are not corrected words, morphological parses, or translation accuracy. The source is public domain, but the OCR has not been manually checked, paired with an English translation, or judged training-ready. The modern Bible.com digital transcription and recent Nahuatl Bible versions are not used as interchangeable originals.

The **Tlahtōlli → Translator** tab now offers a **Luke 1833** orthographic profile, an original-print title sample, original-form dictionary matching (including historically documented `yhuan`), tentative normalization, existing Tēntli morphology analysis, and comparison with frequent source spellings. Historical forms remain on screen as written; proposals and derived corpus counts are separately labeled.

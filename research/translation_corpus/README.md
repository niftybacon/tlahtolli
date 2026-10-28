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

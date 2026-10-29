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
- [EVALUATION.md](EVALUATION.md) — independent held-out translation-quality admission protocol, explicit zero-score baseline, and contamination rules.
- [tools/evaluate_translation_readiness.js](../../tools/evaluate_translation_readiness.js) — measures **only** in-sample engineering coverage while enforcing fail-closed held-out-data readiness; accuracy stays null until human-scored test cases exist.
- [tools/test_translation_readiness.js](../../tools/test_translation_readiness.js) — adversarial checks for leakage, rights, variety, reviewer, and CSV-safety gates.
- [source_candidates.csv](source_candidates.csv) — bibliographic leads that require rights and alignment assessment.
- [source_reviews/ENL_BC16_1573.json](source_reviews/ENL_BC16_1573.json) — the first 1573 central Mexican Nahuatl manuscript actually located and image-inspected, explicitly **not blind** because we consulted a modern transcription and translation. A short editorial-assisted excerpt is marked uncertain, never gold.
- [source_reviews/README.md](source_reviews/README.md) — an achievable step-by-step manuscript reading process without claiming scholarly certification.

## Real published parallel-pair pointers (2026-10-29)

We identified **10 actual source-provided Nahuatl–Spanish parallel pairs** in
six published source works within [Comunidad Elotl's Py-Elotl Axolotl CSV]
(https://github.com/ElotlMX/py-elotl/blob/157f34300f4ca92c3d75b74ec14142916d75c30b/elotl/corpora/axolotl.csv).
The inspected upstream CSV has **16,111 rows**, including **5,993 rows
labeled Classical Nahuatl** (upstream label, not a scholarly variety audit).

See [axolotl_classical_pair_pointers.json](axolotl_classical_pair_pointers.json):
an immutable Git-blob-pinned research manifest recording exact 1-based CSV
record numbers, source work titles, ISO label, expected token counts, and
outstanding verification requirements. The current set covers
*Anales de Tlatelolco*, *Anales de Tepeteopan*, *Vida económica de
Tenochtitlan*, *Memorial Breve*, *Tercera Relación*, and *Nican Mopohua*.

**Inspect the actual paired strings locally**, without saving their underlying
modern translations in the public Tlahtōlli repository:

```sh
# Obtain the exact pinned source file from the upstream link above.
node tools/inspect_axolotl_candidates.js /path/to/axolotl.csv
node tools/inspect_axolotl_candidates.js /path/to/axolotl.csv --json
```

The inspector checks the **original Git blob SHA**, exact CSV row count,
source-work identity, Classical variety label, ISO `nci`
label, expected token counts, and unique Nahuatl/Spanish text per candidate.
It refuses modified files, shifted rows, duplicated pairs and invented
`approved`/`gold` labels. CSV parsing preserves original spelling,
punctuation, line breaks and quoted separators. Its output is a **local
source-provided alignment**, not an independent facsimile collation.

**What these records do not prove:** the source work's date or variety was
confirmed independently; the Nahuatl was rechecked against a first-edition
manuscript; the modern Spanish editor rendered precisely the same semantic
clause boundaries; or that downstream rights in each work are cleared.
The Py-Elotl **software** license alone does not grant rights in the books
from which source pairs were extracted.

Because we inspected and selected these examples, their six source-work
titles are now excluded by the existing evaluator from **independent held-out
gold**. They are useful for source discovery, human linguistic review and
eventual explicitly in-sample development analysis only. No strings were
copied into `pairs.csv`, no benchmark was scored, and the project's approved
gold count remains zero.

The original scholarly description of Axolotl:
[Gutiérrez-Vásques, Sierra and Hernández Pompa (2016)]
(https://aclanthology.org/L16-1666/) documents source, dialect,
orthographic and alignment variation. Those limitations must be resolved
one source at a time before claims of translation quality.

## Review workflow

`candidate → permissions_checked → transcribed → aligned → linguistically_reviewed → approved`.

Only an explicit `approved` status and verified permissions authorize training use. Keep source-based groups together when eventually splitting into training/dev/test datasets.

## Useful starting places to investigate

- [Digital Florentine Codex](https://florentinecodex.getty.edu/en/) — original manuscript and editorial materials; modern translations/transcriptions can have their own rights.
- [Early Nahuatl Library](https://enl.wired-humanities.org/content/welcome-early-nahuatl-library) — historical texts with source-specific descriptions.
- [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/) — lexical verification, not automatically a sentence-parallel corpus.
- [Gran Diccionario Náhuatl](https://gdn.iib.unam.mx/) — bibliographic/lexicographic cross-references.

**Do not bulk scrape.** Begin with small, individually reviewed passages, proper attribution, and explicit permission checks.

## First operational development-corpus diagnostics (2026-10-29)

Instead of treating the thousands of available historical parallel fragments as
unusable until certified for a *blind* evaluation, Tlahtōlli now has a repeatable
**development analysis** over the *actual pinned* upstream Axolotl CSV:

```sh
curl -fsSL \
 https://raw.githubusercontent.com/ElotlMX/py-elotl/157f34300f4ca92c3d75b74ec14142916d75c30b/elotl/corpora/axolotl.csv \
 -o /tmp/tlahtolli-axolotl.csv
node tools/diagnose_axolotl_development.js /tmp/tlahtolli-axolotl.csv --limit 36
node tools/diagnose_axolotl_development.js /tmp/tlahtolli-axolotl.csv --limit 48 --json
```

The tool reuses the existing lexicon lookup, canonical morphology analyzer,
source-aware sentence parser, and the already-shipped 36,543-row Amoxcalli archive lookup.
Archive matches are reported separately as exact Classical headword/form evidence,
diacritic-only Classical variants, or unreviewed Siméon OCR matches; none is promoted
to a verified curated match or automatically translated. It does **not** create a second translator, infer
rules from Spanish translations, or copy bilingual passage text into the repo.
It verifies the original upstream git blob SHA and row/classification totals
before processing. The bounded sample is deterministic, de-duplicated and
round-robin stratified by source-work title; the 3–18 word filter prioritizes
phrase/sentence candidates rather than chapter-length OCR or one-word labels.

This produces exact **in-sample engineering coverage** categories:
curated lexical forms found/unrecognized, approximate or ambiguous matches,
unknown tokens with *provisional* morphology analyses, complete indexed
sentence grammar candidates, source-backed partial grammar windows,
conditional structural analyses, and source-work-level differences. The
diagnostic never compares Spanish wording to generated English: those are not
equivalent representations. A morphology proposal is not counted as a secure
lexical match; a full grammar candidate is **not** a verified translation.

The GitHub translator regression workflow automatically downloads the exact
pinned CSV to temporary runner storage, runs a reproducible 36-row sample,
and reports the aggregate counts without uploading the original bilingual
sentences or adding examples to `pairs.csv`.
The separate fixture regression checks sample determinism, non-Classical
exclusion, duplicate exclusion, source-byte integrity, real-engine use, and
no fabricated translation score. Developer-created examples exist *only* in
the fixture tests and do not contribute to the real-corpus report.

### First measured baseline from the pinned source (36-row CI run)

The live source-byte-verified diagnostic on October 29, 2026 analyzed a
deterministic sample of **36 published Classical-labeled parallel rows across
17 upstream source-work titles** (GitHub Action `40876479899`,
pinned blob SHA `90b7327fc4023ba529e1982f823ddeaee6e313e3`).

| Mechanical result | Actual count |
| --- | ---: |
| Nahuatl lexical word tokens | 365 |
| Recognized by the **115-headword curated lookup** | 90 (24.7%) |
| Not recognized by curated lookup | 275 (75.3%) |
| Among those 275: exact Classical-labeled **archive** evidence | 41 |
| Diacritic-only Classical archive evidence | 0 |
| Siméon OCR evidence only | 41 |
| Neither archive source matched | 193 |
| Tokens with unreviewed morphology proposals | 1 |
| Complete grammar candidates | 0 of 36 |
| Partial grammar-window rows | 0 of 36 |

The categories are *token occurrences*, not unique lemmas, correct readings,
or historical translation success rates. The frequent missing surfaces include
`niman`, `ye`, `ipan`, `oncan`, and `ma`.
The result points to **source-sensitive lexical/form coverage and morphology**
as a higher priority than adding another highly specialized sentence pattern.
It does not make all 193 unmatched forms real missing dictionary headwords:
inflection, clitics, orthographic variation, named entities, and OCR issues
remain possible.

**Limitations:** The upstream 'Classical Nahuatl' label is an editorial dataset
classification. Its Spanish translations can be paraphrastic and its source
orthography/digitization uneven. Work-level stratification is based on the
upstream source title. The tool measures *current capability gaps*, not whether
the original manuscript is authentic or whether a proposed English reading
would be correct. Fixes must be justified by linguistic evidence; the first
priority is the highest-impact failure class in the resulting report, not an
arbitrary additional grammar rule.

## Seven additional inspected Nahuatl–English anchor pairs (2026-10-29)

[ENL short parallel-anchor pointers](enl_parallel_alignment_pointers.json) record
**seven short matched source/translation phrases** on seven individually checked
pages of **five distinct manuscript works**, dated 1559, 1607, 1617, 1622 and
1738. They come from the Early Nahuatl Library, not from the already-registered
Axolotl samples. Each pointer supplies exact short orthographic anchors,
a short excerpt from the published English translation, page URL, date,
document identity, and translator attribution. It never imports the complete
modern transcription or translation.

**Evidence tier:** genuine publication-located **phrase anchors**, NOT
independently reviewed sentence-to-sentence translations or model gold.
Modern editions may normalize, split, conflate, paraphrase, or omit clauses;
no correspondence beyond the short observed matching phrase is certified.
These documents have now been inspected and are automatically quarantined
from independent held-out evaluation. This is a development research queue
for eventual facsimile collation and expert validation; all approval flags
remain false and `pairs.csv` remains unchanged.

The two parallel manifests are **not the same dataset**: Axolotl supplies
published row references across six different source-work titles; ENL supplies
short navigation/translation anchors from five archived manuscript documents.
Do not add them together as eleven independent blind test works.

## New source: historical Gospel of Luke (1833)

Mariano Paz y Sánchez, *El Evangelio de S. Lucas: del Latín al Mexicano ó mejor Nahuatl* (1833), [public-domain original scan](https://commons.wikimedia.org/wiki/File:Yacuic_iyec_tenonotzaltzin_in_Jesu-Christo,_quenami_oquimo_ihcuilhuili_in_San_Lucas.pdf). Source metadata in [luke_1833_source.json](luke_1833_source.json). Cambridge University Library identifies this historical variety with southern Puebla around 1830; it is **not automatically identical** to sixteenth-century central Mexican Nahuatl.

The reproducible [1833 Luke analyzer](../../tools/analyze_luke1833.py) has successfully scanned the Internet Archive plain-text OCR and stores only [derived aggregate measurements](luke_1833_analysis.json): **26,201 approximate OCR letter-runs**, **5,404 distinct OCR forms**, **4,589 direct dictionary-form occurrences**, and **1,217 additional tentative matches after guarded historical spelling substitutions**. Counts are not corrected words, morphological parses, or translation accuracy. The source is public domain, but the OCR has not been manually checked, paired with an English translation, or judged training-ready. The modern Bible.com digital transcription and recent Nahuatl Bible versions are not used as interchangeable originals.

The **Tlahtōlli → Translator** tab now offers a **Luke 1833** orthographic profile, an original-print title sample, original-form dictionary matching (including historically documented `yhuan`), tentative normalization, existing Tēntli morphology analysis, and comparison with frequent source spellings. Historical forms remain on screen as written; proposals and derived corpus counts are separately labeled.

## 1833 Luke: OCR correction and tentative verse segmentation (2026-10-28)

The first real cleanup of the public-domain 1833 OCR is complete. The source has **715 printed line-end hyphen joins**; **315** were mechanically rejoined where our published lexical index or repeated unbroken OCR spelling provided support. **400** remain unresolved. The corpus scan also identified **99 plausible two-word spacing occurrences** (14 distinct examples in the saved review queue) and **1,051 candidate verse starts**. Repeated running headers and scanned page numbers complicate chapter/verse identification, so these are **not** yet verified verse references.

Outputs: [automatically prepared working OCR](luke_1833_working_ocr.txt), [729-item source-linked correction and segmentation queue](luke_1833_review_queue.json), and [reproducible script](../../tools/clean_segment_luke1833.py). The corrected working text remains explicitly unreviewed. No semantically inferred or macron-added spelling is silently substituted. The review UI is under **Tlahtōlli → Translator → San Lucas 1833**. Local accept/reject annotations are not uploaded; export them to retain your review. The original page images remain the authoritative check.

The correction script already uses **source URLs from Tlahtōlli's existing dictionary and independently marked inflection records** to explain proposed repairs. It does not import external dictionary prose or treat generated paradigms as manuscript attestations.

The [source-intake policy](source_intake_policy.md) additionally records [r/nahuatl](https://www.reddit.com/r/nahuatl/) as a *source-discovery and orthography discussion* lead. It is not a corpus of verified sixteenth-century Classical Nahuatl or material automatically licensed for model training.

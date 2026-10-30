# Autonomous historical evidence investigator — Tēntli

*Phase 2/5 of the consolidated roadmap. Research tool, not a self-certifying translation engine. October 30, 2026.*

## What the investigator actually does without requesting a human to check thousands of entries

`neural/autonomous_evidence_investigator.py` now processes **40 high-priority written-form questions per execution**. It automatically pulls together provenance and *exact-form concordances* from the existing canonical lexicon and evidence ledger, primary historical word-form witness links, the pinned source-printed Brinton training poems, and the complete source-separated Amoxcalli import:

| Source family | Entries indexed | Editorial status | Language and limits |
| --- | ---: | --- | --- |
| Rémi Siméon, *Dictionnaire* (1885), via Amoxcalli | 28,709 | Machine-parsed/OCR unverified; historical printed lexicon, not newly verified manuscript | French sense pointers; OCR errors possible |
| English Wiktionary via Kaikki/Amoxcalli | 7,834 source rows | Community English dictionary; **only nci Classical-labelled records admitted** | Community glosses and forms, NOT 16th-century attestations |
| Canonical Tlahtōlli headword/POS source claims | Checked subset of the published lexicon | Claim-level source-located | These do not independently certify every contextual meaning |
| Explicitly cited early Florentine Codex/ENL written forms | Small strictly linked witness atlas | Exact historical form occurrence only | Does not license generalized orthographic transformations |

The code verifies that the 28,709 + 7,834 archived source rows total **36,543** before indexing, checks archive formats and stored editorial grades, preserves the source-family attribution and appropriate **CC BY-SA** catalog licenses, does not merge modern `nhn`/other Kaikki varieties into Classical `nci`, and never bulk-mirrors contemporary ODN editorial entries. Candidate dictionary text excerpts in generated reports are limited, source-tagged **review leads**, not a new licensed corpus.

For each of 40 high-frequency written forms it computes existing historical occurrence counts and source-line links, exact historical and modern-source-record matches where applicable, multiple sense/POS evidence leads, conflicts requiring checking, and the next proposed verification action. **French OCR meanings and community English glosses are not automatically treated as semantically equivalent.** Two archive families do not constitute two independent sixteenth-century manuscript witnesses.

The run outputs a machine-readable evidence ledger with SHA-256 hashes of the canonical data, historical candidates, archive manifest and human feedback. Exact-form matches are *not* automatically interpreted as inflections, roots or orthographic variants; longer compounds are not split and vowel distinctions are not silently collapsed.

## A concrete example: `zanio`

The project director previously assessed Brinton Song V, stanza 1, accepting the historical spelling `zanio`, the meanings *only/alone/just this one*, and the semantic intent of Brinton's English. The investigator now retains that feedback **verbatim as a separately marked single editorial observation**, linked to the exact historical stanza:

- Brinton Song V.1 original: [pinned printed stanza](https://github.com/GITenberg/Ancient-Nahuatl-Poetry-Containing-the-Nahuatl-Text-of-XXVII-Ancient-Mexican-Poems--13-Brinton__12219/blob/ab90a087b33d8c767caa867674dbf33e0cee084f/12219.txt#L1734)
- Molina (1571), part II, fol. 14r col. 2: *zanio* recorded as a variant of *zaniyo* in the [Online Nahuatl Dictionary entry *zan iyo*](https://nahuatl.wired-humanities.org/node/172083)
- Karttunen (1992), *zaniyoh*: *only, alone*, indexed separately in the [ODN entry *zaniyo*](https://nahuatl.wired-humanities.org/content/zaniyo)

These are **individually attributed lexical references**, though retrieved through one modern aggregator. We do not claim independent inspection of the 1571 Molina folio or Karttunen's book from the machine-readable pointer. The director's assessment is useful **preliminary feedback**, not a second independently credentialed reviewer of the full poem. It is not Gold, approved Silver, or permission to train a model on a supposedly verified entire stanza.

The explicit project feedback file is `research/translation_corpus/project_director_provisional_feedback.json`; its entries are checked against source-form occurrences and the exact source/translation URLs. A tampered URL or a user assertion marked `training_eligible`, `silver_approved` or `gold` fails validation.

## Running an honest autonomous batch

```sh
python -m neural.autonomous_evidence_investigator --limit 40 \
  --output /tmp/tentli-source-investigations-40.json
python -m unittest discover -s tools -p 'test_autonomous_evidence_investigator.py' -v
```

The standalone [GitHub Actions workflow](../../.github/workflows/tentli-autonomous-evidence-investigator.yml) runs on relevant PR/push changes, on manual dispatch and weekly on Monday (UTC). It regenerates a **30-day research artifact** and GitHub job summary. No automation silently edits the dictionary, human-reviewed `pairs.csv`, model, site or Gold reference. The weekly cadence is a scheduled reproducibility check over the **available archive revision**, not an AI agent that can independently read new off-site manuscripts or perform unlimited source acquisition.

### Output categories and escalation

- **Cited canonical source claim**: an already checked headword/POS reference; contextual English meaning remains unapproved.
- **Exact historical dictionary record**: a short, attributed Siméon 1885 OCR excerpt, requiring quality review.
- **Classical-labelled community record**: a short Kaikki/Wiktionary sense lead; not historical manuscript evidence.
- **Multiple independent *archive families***: exact headword concordance across Siméon/Kaikki, not automatically multiple primary historical attestations or matching senses.
- **No exact evidence**: probable compound, derivation, inflection, spelling problem, poetic vocable or unindexed lemma to research—not automatically a missing dictionary word.
- **Human escalation**: source disagreement, competing POS, or especially consequential contextual assertions (including `zanio`). Only these need prioritized human input. The tool does not pretend its 40 automated research cases are 40 verified translations.

Even a successful 40-case batch leaves independently human-reviewed Gold count unchanged. Historical English training on newly verified Silver requires separate adjudication and the reviewed-pair gate from [the Silver/Gold protocol](SILVER_GOLD_REVIEW_PROTOCOL.md). The private Gold benchmark must remain an entirely independent collection not consulted during learning.

## Next technical steps

Extend precise manuscript source acquisition under rights controls (individual dated primary documents), expand **source family and period-qualified** orthographic variants without indiscriminate rewriting, connect reviewable unresolved cases to persistent proposed corrections, and add carefully constrained human acceptance of sources into reviewed Silver. Keep the real Gold reference out of iterative research entirely.

The meaningful progress is removing repetitive lookup labor while preserving a narrow, auditable human-verification boundary.


## Measured first execution — 40 lexical source investigations (October 30, 2026)

[Successful GitHub Actions run #41085308258](https://github.com/niftybacon/tlahtolli/actions/runs/41085308258) read the exact pinned Brinton training split, canonical claim evidence, and all **36,543** archived Amoxcalli records, without training a model or promoting a word:

| Exact written-form match category | Actual investigation cases |
| --- | ---: |
| Both Siméon 1885 OCR and Classical-labelled Kaikki community archive | **3** |
| Siméon historical OCR archive only | **14** |
| Classical-labelled Kaikki community archive only | **6** |
| Neither dictionary archive | **17** |
| **Total** | **40** |

Of 7,834 raw Kaikki source rows, only **4,622** were indexed as explicitly Classical `nci`; **3,212** non-Classical rows were excluded. Siméon's **28,709** historical OCR rows remained separately attributed. The source-family comparison did **not** turn the 3 dual-source form matches into independently verified Spanish/French/English sense equivalences.

The engine flagged **5** forms for closer, contextual linguistic attention: `can`, `ic`, `cuicatl`, `ayac`, and the manually noted `zanio`. These flags indicate potentially conflicting part-of-speech indexing or an important existing editorial assertion, not confirmed translation mistakes.

The remaining **35** cases received source-citation lookup and an automatically generated next-research action but did not get a high-priority human escalation in this batch. **Zero independent primary-source checks**, **zero meaning certifications**, **zero approved Silver/Gold**, and **zero production lexicon or model changes** were made.

The full 40-record report is the [GitHub Actions research artifact](https://github.com/niftybacon/tlahtolli/actions/runs/41085308258) retained for 30 days. These are real *research-source indexing checks*; new manuscript analysis, expert contextual verification and access to additional original sources remain future improvements.

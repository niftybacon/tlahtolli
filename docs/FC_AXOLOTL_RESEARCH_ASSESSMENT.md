# Florentine Codex + Axolotl: source-specific private research assessment

**Scope.** This document records a source-specific, preliminary U.S. fair-use
research assessment for Tēntli's *private, non-redistributed* neural training.
It is NOT advice from legal counsel, a license grant, a ruling, or permission
to redistribute source text or an unevaluated checkpoint. The source-specific
assessment path is used by the existing `fair_use_assessed` research intake
contract, and the public model-release audit remains a separate gate.

## Florentine Codex, Berthoud edited transcript

- **Work:** 1577 manuscript *Historia general de las cosas de Nueva España*;
  the supplied 12-book machine-readable transcription edited by Valery A.
  Berthoud F. (2022), [Zenodo 7213020](https://zenodo.org/records/7213020).
- **Lawful acquisition:** Public, unrestricted Zenodo research-deposit file
  download (NOT Getty copyrighted Anderson–Dibble transcription, translation,
  or images). Downloading a publicly available record does not automatically
  settle reuse rights. The archival facsimile is older public-domain material,
  but the modern editorial transcription may carry separate interests.
- **Purpose and character:** Noncommercial research into recognition and
  denoising of historical written Nahuatl, with source-graded provenance;
  no edited book, text search corpus or verbatim excerpt replacement.
- **Nature and amount:** The complete 12-book transcript supports broad
  morphological/orthographic pattern learning; preserving the complete
  source means using more than isolated excerpts. Training consumes transient
  content from the runner; no original text, sentence list or translation
  targets are checked into the public repository. Book 5 is development-only.
- **Market and access:** No directly licensed English translation is copied,
  and the small experimental model is not a substitute edition; nonetheless
  exposure of edited passages or future distributable weights may have
  separate market/access effects that require new review.
- **Quality:** Prior Tlahtōlli research recorded a SHA-256 for each book.
  Exact checksums are required, including Book 5, before any training.
  Historical scribal text can wrap words at printed line breaks; no new
  lexical or morphological attestation is inferred from editorial segmentation.
  Zenodo's language metadata says Huasteca even though its work description
  identifies the 1577 Codex; manuscript identity, not the platform language
  field, governs labeling.
- **Release:** No raw files, model training JSONL, or journal-length English
  passages are uploaded. Publication of weights requires the existing
  `neural/release_audit.py` and a separately documented analysis.

## Axolotl Spanish–Nahuatl corpus

- **Source:** [UNAM Axolotl Spanish–Nahuatl parallel corpus](https://axolotl-corpus.mx/),
  [Py-Elotl GitHub distribution](https://github.com/ElotlMX/py-elotl),
  pinned commit `157f34300f4ca92c3d75b74ec14142916d75c30b`,
  `elotl/corpora/axolotl.csv`, Git blob
  `90b7327fc4023ba529e1982f823ddeaee6e313e3`.
- **Acquisition:** Public original GitHub distribution at this specific
  commit, no pirate mirrors, paywall circumvention or website crawling.
  GitHub code is MPL-2.0, but the program license may not license its
  underlying sourced book excerpts or translations.
- **Purpose:** Limited computational analysis of Classical-labelled
  Nahuatl orthography and weak Spanish bilingual generalization—not
  commercial redistribution or a competing corpus. Other varieties are
  EXCLUDED completely.
- **Nature and amount:** The original CSV has 16,111 records, 5,993 labeled
  Classical. The importer requires BOTH exact Classical label and ISO `nci`;
  monolingual Nahuatl uses those rows and a Spanish pair is admitted only
  when both untruncated strings fit the research model. The full work
  is diverse and includes historical editions plus later interpretations,
  not independently verified direct translations. Document titles are
  recorded as work identities to avoid accidental split leakage.
- **Market and attribution:** Original rows and translated excerpts are
  never exported into a public corpus or committed. Research-only model
  training may support recognized transformative NLP uses, but compiling
  republishable translation pairs or deploying a replacement public
  translator would require separate analysis of acquisition conditions,
  historical works and model memorization risks.
- **Alignment caveat:** All paired Spanish is weak/candidate grade, not
  reviewed gold; the collection itself notes OCR, diachronic variation and
  sentence-alignment challenges. No English target is inferred from the
  Spanish, nor is Spanish mislabeled English.
- **Release:** Source-aware weights held as restricted research artifact;
  no claim of legal clearance for public distribution of source data or
  a model memorizing the edited books.

## Enforcement and limitations

The existing `neural/corpus.py` requires a source-specific assessment
locator, an acquisition URL, a substantive explanation and
`no_source_redistribution:true` for `fair_use_assessed`. The two source
cohorts have distinct work IDs and separately tagged Spanish/Nahuatl or
English modalities. The pipeline is audited before model training:
**Florentine original checksums must match the earlier study; Axolotl's
actual Git blob must match the historic source pointer manifest.**

The existing `neural/release_audit.py` controls future publication; the
research checkpoint does NOT constitute a finding of fair use or quality.
No Anderson–Dibble, Getty source data or modern Nahuatl dialects are
in this training run. Further training on any other edition requires a
distinct assessed input and model-output review.

References: [Zenodo record](https://zenodo.org/records/7213020),
[Py-Elotl](https://github.com/ElotlMX/py-elotl),
[Axolotl paper](https://aclanthology.org/L16-1666/),
[Getty rights table](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions),
[separate Tēntli publication policy](../research/neural_training/ANDERSON_DIBBLE_FAIR_USE.md).

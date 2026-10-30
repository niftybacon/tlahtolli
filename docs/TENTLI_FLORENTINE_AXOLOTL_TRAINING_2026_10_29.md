# Tēntli: Florentine Codex + Axolotl neural research training

**Date:** 2026-10-29 (America/Chicago). This research experiment adds historical learning to the **existing** Tēntli neural architecture without replacing any morphology, clause grammar, grammar IR, evidence catalog, English composer, dictionary, or prior PR.

## Data and canonical provenance

### Same twelve Codex files used in our original scan

From [Berthoud's 2022 Florentine Codex transcription (Zenodo 7213020)](https://zenodo.org/records/7213020), retrieved **using the exact existing `tools/analyze_florentine_codex.get_file` downloader**. Every original source (including its line endings) must hash to the SHA-256 stored in `research/florentine_codex/analysis.json`. Previously this archive supplied aggregate counts; **this is its first neural-language-training intake**, and it does NOT include Anderson–Dibble or Getty translation text.

- **12 source books validated**; **1,401 training/development segments**.
- **11 books in train**, **Book 5 in development** with work-level separation.
- Printed line wraps are retained rather than silently inventing word boundaries.
- The Berthoud transcription reports missing special characters, including tildes, and Zenodo labels the deposit Central Huasteca Nahuatl despite the described 1577 Florentine work. Both editorial source and historical identity must be retained in provenance. The editor's transcript and original historical manuscript do not have identical reuse rights.

Book-level eligibility does **not** constitute verification of 1,401 independent sentences, orthographic forms or English equivalents. The model trains self-supervised historical written-form denoising, not invented translation pairs.

### Axolotl, strictly Classical

Reuses our pinned `research/translation_corpus/axolotl_classical_pair_pointers.json`: [ElotlMX/py-elotl, commit 157f34300f4ca92c3d75b74ec14142916d75c30b](https://github.com/ElotlMX/py-elotl/tree/157f34300f4ca92c3d75b74ec14142916d75c30b), `elotl/corpora/axolotl.csv`, **actual Git blob SHA `90b7327fc4023ba529e1982f823ddeaee6e313e3`**.

- 16,111 input corpus rows; **5,993 rows explicitly labeled Classical Nahuatl / ISO nci**.
- **5,979 retained source text examples** after excluding 14 duplicates/unusable cases.
- **4,420 source-aligned Nahuatl–Spanish *candidate* pairs**, each with full text within model input/output bounds. Their task label is `es`, **not English**.
- **1,559 additional historical Nahuatl rows without suitable short Spanish targets** are retained for monolingual learning; no long Spanish target is silently truncated.
- 17 independent source-work titles identified in the filtered cohort; they are manuscript/source identifiers for provenance, not 17 independently verified source editions.

**Modern dialects excluded.** The upstream Classical labels have not been individually specialist-verified. The corpus includes historical translational and alignment issues; these are weak Spanish learning signals, not gold accuracy. Attribution goes to Axolotl's UNAM corpus and py-elotl package authors.

## Neural training method

The **unchanged 48-width, one-encoder/one-decoder, 256-byte-position Transformer** is initialized from the previous successful teacher + Brinton + Chimalpahin checkpoint [run 40983772892](https://github.com/niftybacon/tlahtolli/actions/runs/40983772892). The workflow downloads the actual checkpoint and verifies the weights, base architecture, trained analysis and prior bilingual example counts. No separate grammar analyzer or reinitialized lexical database is substituted.

1. **Florentine historical written-language training:** `neural.train` with original-text monolingual denoising; separate dev-book loss, not translation accuracy.
2. **Axolotl Classical historical + weak Spanish training:** `neural.train` continues the **same checkpoint** on denoising and candidate Spanish translation. Spanish adds a UTF-8 in-band `es: ` task prefix to the *existing* `TRANSLATE` token—rather than renumbering the byte vocabulary, breaking earlier teacher checkpoints, or misclassifying Spanish as English.
3. **Artifact:** save only neural weights, loss/quality metadata, exact source fingerprints and counts to private research action artifact. No full corpus rows, transcript, source translations, or raw text checked into Tlahtōlli.

This remains an experimental research model. It does **not** claim successful translations of held-out Classical Nahuatl; separate independent human evaluation is still unavailable.

## Source-rights boundary

The right source is publicly accessible, but public research access alone isn't a license to redistribute modern editorial material. The [source-specific private research assessment](FC_AXOLOTL_RESEARCH_ASSESSMENT.md) documents how each source was acquired, the research character, editorial rights distinctions, amount and potential market effect. The `neural/corpus.py` `fair_use_assessed` gate is an explicit preliminary assessment **not a court ruling or legal clearance**. Source text never enters commits or the deployed translator; public checkpoint distribution requires the independent `neural/release_audit.py` and human/copyright review.

## Reproducibility

The executable [training workflow](../.github/workflows/tentli-florentine-axolotl-training.yml) downloads the older trained checkpoint artifact, fetches all 12 original Florentine files via the pre-existing downloader, downloads the original pinned Axolotl CSV, verifies source identities and creates two private JSONL training datasets; then runs PyTorch continued training and uploads a research checkpoint. The new import logic is `neural/intake_florentine_axolotl.py`. Synthetic tests prove strict Classical-only labeling, source hash refusal, Spanish-target separation and document/book grouping.

If the older temporary artifact has expired (30-day retention), reproducibility requires the previously published [teacher and books training workflow](../.github/workflows/tentli-poems-chimalpahin-training.yml) to create it anew; never silently restart from a random model while claiming continuation.

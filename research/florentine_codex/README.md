# Florentine Codex: Twelve-book research analysis

**Run completed:** 2026-10-28. **Scope:** all 12 books; preliminary aggregate orthographic statistics only.

The [Tlahtōlli Translator tab](https://niftybacon.github.io/tlahtolli/) now contains a **Florentine Codex corpus atlas**, which reads [analysis.json](analysis.json). All source text stays outside this public repository; the report includes numerical counts, hashes, and short recurring single-token spellings, not chapters, paragraphs, sentences, or translations.

## Source and research scope

- **Transcription:** Valery A. Berthoud F., *Transcript of the Florentine Codex (Nahuatl)* (Zenodo, 2022), DOI [10.5281/zenodo.7213020](https://doi.org/10.5281/zenodo.7213020). Text files corresponding to the 12 books were read transiently by a GitHub Actions research runner.
- **Historical manuscript reference:** [Getty Digital Florentine Codex](https://florentinecodex.getty.edu/codex). Getty's separate Anderson–Dibble transcription and English translation are marked all rights reserved on its [citations and permissions](https://florentinecodex.getty.edu/about/3_Citations_and_Permissions) page; those full texts were **not** downloaded or copied into this repository.
- **Reuse:** Research availability is not itself permission to republish a modern editorial transcription or to fine-tune a model. The Zenodo deposit's specific license must be verified before including any verbatim material or training pairs. **No model was trained on the twelve files.**
- **Variety:** Zenodo labels the record “Central Huasteca Nahuatl,” despite describing the sixteenth-century Codex. This discrepancy requires verification. Do not substitute contemporary Huasteca Nahuatl as Classical Nahuatl.

## What we measured

The basic scan case-folds and removes diacritic marks, extracts runs of Unicode letters, counts repeated written forms, and checks surface matches against currently published Classical Nahuatl headwords and listed historical spellings.

**Important limitations:** The source often wraps text midword at the printed line ending, and its transcription omits or differs in historical characters such as tilde markings; therefore these are approximate written units, **not trustworthy word counts or morpheme segmentations**. A spelling match against a dictionary entry is not an identified meaning in a sentence. The derived lexicon coverage percentage is a rough diagnostic, not translator accuracy. Source scans are **not** aligned translations.

## Run it again

GitHub Actions: [Research scan of all 12 Florentine Codex books](../../.github/workflows/analyze-florentine.yml), started when the workflow or analyzer is updated or by a manual workflow dispatch. The script only commits aggregate statistics.

Offline, with locally obtained appropriate text files:

```sh
python tools/analyze_florentine_codex.py --input-dir /path/to/twelve-files --output research/florentine_codex/analysis.json
python tools/test_florentine_analysis.py
```

To fetch the 12 research-deposit text files transiently without checking them into GitHub:

```sh
python tools/analyze_florentine_codex.py --download-zenodo
```

## Next research phases

1. Verify transcription provenance, editing decisions, and precise reuse permissions.
2. Reconstruct word boundaries and editorially distinguish orthography from morphological analysis.
3. Associate recognized lemmas with source locators, uncertainty grades, inflectional hypotheses, and citations.
4. Obtain rights-cleared bilingual alignment and independently reviewed examples before any machine-learning experiment.
5. Evaluate on document-disjoint held-out data; do not report training-text recognition as translation quality.

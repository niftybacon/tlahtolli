# Tēntli — FIRST RAW CHECKPOINT TRANSLATION PROBES

**Executed 2026-10-29 local / 2026-10-30 UTC.**
**Outcome: the actual 104,039-parameter neural model is not yet a usable
Classical Nahuatl→English or Nahuatl→Spanish translator.**
This is a **source-graded development diagnostic, NOT an independent
translation-quality benchmark** and NOT a human-scored accuracy claim.

## Exactly what was executed

- [Full successful source-and-weights test run #40995225354](https://github.com/niftybacon/tlahtolli/actions/runs/40995225354):
  downloads *actual* independently verified research weights from
  [Florentine+Axolotl run #40987019137](https://github.com/niftybacon/tlahtolli/actions/runs/40987019137)
  and [Temoa+Chimalpahin run #40993235240](https://github.com/niftybacon/tlahtolli/actions/runs/40993235240).
  Weight SHA-256 hashes are recorded in the result JSON; they are different,
  not randomly initialized synthetic fixtures.
- Both models share the same existing **104,039-parameter byte-level,
  48-width, 1-layer encoder-decoder Transformer** and 256-byte
  maximum sequence length.
- Exact same inputs, PyTorch CPU `model.eval()`, **greedy autoregressive
  decoding** with a **fixed maximum of 72 generated tokens**. No beam
  search, human re-ranking, hidden semantic corrections, model
  improvement, source text substitutions, or fabricated gold.
- **8 already-known constructed software grammar examples**, **7 short
  source-located ENL Nahuatl–English anchors from existing pointer
  metadata**, and **2 out-of-domain nonsense controls** are run against
  both historical neural checkpoints. **5 separately tagged
  Spanish-condition probes**, **4 unscored analysis probes** and
  **2 denoising-input probes** inspect the latest checkpoint.
- The **existing canonical grammar composer + grammar IR** also reads
  the **same 17 English probe inputs**, including exact original source
  spellings; zero canonical grammar or dictionary code changed.
- Raw outputs, per-checkpoint weight SHA-256, simple string diagnostics,
  source pointers and comparisons live in the two JSON files uploaded
  to the Actions artifact
  `tentli-actual-neural-inference-benchmark-results`.

### Source-integrity caveat

The grammar cases are **software-created teacher/development**
references available through canonical grammar rules. They are not
real manuscript translations and may overlap training supervision.
The [ENL historical anchors](../research/translation_corpus/enl_parallel_alignment_pointers.json)
were **already inspected** and have no certified sentence alignment,
independent blind test eligibility or cleared modern translation rights.
Their very short text and English locators are used as *diagnostic
examples*, not promoted into approved `pairs.csv`. Human-reviewed
independent translation test size is **zero**. No BLEU/chrF/COMET
or percentage claiming translation accuracy is reported.

## Verbatim sample outputs

| Actual Nahuatl input | Reference used only for software/known development | Earlier neural checkpoint | Most recent neural checkpoint |
| --- | --- | --- | --- |
| `nichōca` | I cry. | repeating `anana...` | `nca` |
| `nitlacua` | I eat. | repeating `anana...` | `n tla` |
| `niquitta in cihuātl` | I see the woman. | repeating `Auh in in...` | repeating `n in in...` |
| `ahmo niquittaz in cihuātl` | I will not see the woman. | repeating `Auh yn...` | repeating `auh in in...` |
| `niquitta in cihuātl in chōca` | I see the woman that cries. | repeating `Auh in...` | `n ichuatlicatlatlatlicatlatla` |
| `Yn tehuantin pipiltin` | We the nobles (previously inspected ENL anchor) | repeating `Auh yn...` | `140v` |
| `Atle yp pohuiz` | it will count as nothing (previously inspected ENL anchor) | repeating `Auh yn...` | `141v ` |

**These are genuine emitted strings**. Ellipses in the table abbreviate
long repeated raw outputs; consult the unaltered JSON/Actions logs for
complete byte-for-byte outputs and full inputs. Neither the appearance
of `140v` nor repetition of `in` is meaningful English translation.
They suggest source formatting leakage/repetitive text generation,
not trained semantic competence.

## Mechanical test results — NOT translation accuracy

| Probe set | Existing canonical grammar | Early neural | Latest neural |
| --- | ---: | ---: | ---: |
| Eight constructed software grammar references | **8/8 exact output strings** | **0/8 exact** | **0/8 exact** |
| Seven previously seen ENL short historical anchors | **0/7 available; abstains** | **0/7 exact** | **0/7 exact** |
| Two nonsense controls | **2/2 correctly abstain** | unconstrained decoder may fabricate | **one fabricated string, one empty string** |

The canonical reference is only the grammar composer with built-in
source-backed English options, not the entire production website
including optional specialized morphology providers. Its strong
performance here shows the eight cases are *within its design
coverage*. It does NOT validate the canonical translator on genuinely
unknown colonial passages; its seven ENL abstentions are intentionally
safer than inventing translations.

### Spanish-conditioned output and interface metadata bug

The raw neural model, when explicitly conditioned with the training
prefix `es: `, **did not produce coherent Spanish** on five
diagnostic inputs. In addition, `neural.infer.infer(...,
target_language="es")` rejects the newest checkpoint with:

> `Checkpoint has no Spanish translation training examples`

That rejection is **wrong about the training history**, but does
reflect an actual metadata defect. The current `source_inventory`
describes only the final Temoa monolingual batch, so the standard
inference guard fails to see the **4,420 weak Spanish pairs** in the
prior Axolotl training stage. `trained_translation_examples`
still includes the older Spanish examples, but their *language-specific
provenance* was not propagated. This bug must be fixed by
forward-carrying **cumulative per-language counts/source checkpoints**
under a versioned model metadata schema, not by guessing that any
generic translation example is Spanish supervision.
The direct model probe bypasses only this wrapper guard and uses
the exact `es: ` byte prefix already used in training. It does
not claim that the public Spanish inference interface works.

The neural `analyze` probe likewise emitted short unfinished forms
such as `nca`, `nin`, `n tla` and
`nintlatlatlatlatlatli`; none constitutes a valid morpheme-
segmented or source-audited grammatical analysis.

## Diagnosis and decisions

1. **Do not deploy, fuse, or substitute neural output** into the
   public Tēntli translator: it presently fails simple constructed
   English examples, while the canonical engine correctly composes them.
2. **Stop indiscriminate historical monolingual expansion** until
   translation is measured. The English signal was predominantly
   weak Brinton/grammar-teacher data (only 165 complete weak
   Brinton pairs); Axolotl provided 4,420 weakly aligned **Spanish**
   examples, not English. Later large monolingual denoising
   batches never replayed bilingual/analysis examples, which creates
   a **plausible** catastrophic-forgetting mechanism; the old
   checkpoint also failed, so **forgetting is not independently
   demonstrated** without controlled matched-loss replay experiments.
3. **Track cumulative training per task and language** in artifacts,
   including model init hashes, task weights, step counts and
   source/work exposure. Repair Spanish inference guards
   against that structured metadata, not guessed class labels.
4. **Add a real independent gold benchmark** of newly commissioned,
   human-reviewed Classical Nahuatl sentence translations from held-out
   document *families*, with source, edition, variety, and work-level
   contamination checks. ENL anchors and the old grammar teacher
   are NOT eligible for that role.
5. **Correct learning objective/data architecture before parameter
   inflation alone:** experiment with subword-aware encoding,
   bilingual target-language tags, genuinely aligned English/Spanish
   pairs, mixed-task replay, validation-based early stopping, and a
   larger model only when a clean gold benchmark exists. Historical
   prose denoising alone does not teach translation semantics.
6. **Preserve the canonical grammatical system** and demand explicit
   independent improvements before attempting neural suggestions,
   especially for possession, long clauses and ambiguous historical
   spellings.

The test required no new source training, source redistribution,
model edits, or modification to the canonical grammar and lexicon.
The trained research artifacts currently expire after **30 days**;
persist approved research weights somewhere durable only after a
separate rights, release and security audit.

## Reproduction

```sh
# GitHub Actions run downloads pinned earlier and latest
# REAL saved weight artifacts, checks their SHA and provenance,
# evaluates raw greedy generation and canonical grammar composer,
# and publishes both JSON reports. In particular, the script
# is deliberately not allowed to label these probes 'accuracy'.
python -m tools.probe_actual_tentli_neural \
  --before /path/to/extracted-early-artifact \
  --after /path/to/extracted-latest-artifact \
  --output /tmp/tentli-actual-inference-probes.json \
  --generation-limit 72
node tools/probe_actual_tentli_canonical.js \
  /tmp/tentli-actual-inference-probes.json \
  /tmp/tentli-canonical-versus-neural.json
```

For the complete two-checkpoint output and reproduction run:
[GitHub Actions #40995225354](https://github.com/niftybacon/tlahtolli/actions/runs/40995225354).

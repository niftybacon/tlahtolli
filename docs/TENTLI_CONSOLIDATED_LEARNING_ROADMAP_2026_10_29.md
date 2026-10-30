# Tēntli — consolidated six-phase roadmap and Gold / Silver / Bronze evidence policy
_Last reconciled October 29, 2026 (America/Chicago). Research milestones are not release accuracy claims._

The six development phases are **overlapping workstreams**, not a six-engine rewrite. All new learning components reuse Tēntli's canonical `tools/morphology_engine.js`, `translator-sentence.js`, `translator-grammar-ir.js`, and `translator-english.js`. No AI output becomes a lexicon entry, manuscript attestation, or approved gold row without separate review.

## Six implementation workstreams

| Priority | Work | Definition of progress |
| --- | --- | --- |
| 1. Stabilize grammar | Resolve independent PR #92, source-gated finite verb English drafts, browser regression and semantic IR audit | No newly unsupported semantic roles or regression in canonical outputs |
| 2. Acquire bilingual evidence | Preserve primary-source location and licenses; create independently graded English translation alignments; freeze untouched historical works for blind evaluation | Gold evaluation set and traceable candidate/silver development corpus |
| 3. Grow grammar teacher | Generate person/object/negation/tense/possessive/clause exercises from documented canonical analyses, not neural inventions | Diverse, label-preserving Bronze lessons with lexeme-disjoint dev split |
| 4. Train English-capable model | Compare old from-scratch byte model to **pretrained** English-capable FLAN-T5 LoRA, on segregated Bronze vs historical candidate supervision | Actual optimizer steps + source-disjoint dev loss + safe decoder acceptance/rejection report |
| 5. Persistent reviewed feedback | Keep pending corrections (and source references) separate from approved human-reviewed training, freeze model/checkpoint histories | Auditable proposed fixes, tests, and documented reviewer-led promotion |
| 6. Historical coverage | Prioritize unknowns in actual historical texts and separate modern varieties; keep OCR, analysis, and real source senses distinct | Historical coverage diagnostics; no unjustified English translations |

## Gold / Silver / Bronze: never conflate evidence with volume

**Gold — independent translation evaluation.** Goal: eventually 100–200 varied, explicitly rights-cleared, independently expert-reviewed Classical Nahuatl→English **held-out** translations from whole historical works that have not been used for training, rule revisions, demonstrations or exploratory candidate selection. Current approved independent Gold: **0**. A model cannot label its own outputs Gold. Gold is for final evaluation, not training or tuning; do not rotate those works into training after looking at scores.

**Silver — historically sourced bilingual supervision.** An editor/translator's source-provided correspondence with documented provenance, appropriate reuse rights, and independently assessed alignment quality can become Silver training/dev material. We must retain a distinction between **Silver candidates** and **reviewed Silver**. The 150 entries from Brinton's 1890 *Ancient Nahuatl Poetry* are **unreviewed, interpretive stanza-level Silver candidates**; 133 train and 17 poem-disjoint development. They are NOT independently reviewed, and their corpus `translation.alignment` remains `candidate`. Existing `neural/corpus.py` weights them **0.15**, not 1.0. The standalone `neural/historical_candidate_english.py` passes the same conservative evidence weight to pretrained FLAN-T5 LoRA adaptation without changing approved-pair gates.

**Bronze — source-grammatical synthetic training.** Canonical `tools/export_source_gated_english_practice.js` produces 288 constructed bilingual examples across 12 verbs (not independently attested). Those are already separated by lemma and labeled editorial grammatical hypotheses, with ambiguity-aware weak supervision. Never treat them as historical sentences, Gold evaluation, or evidence that the system translated an unseen manuscript. This Bronze source should remain in a separate research experiment until any combined curriculum has explicit tier sampling, uncertainty weights, and work-disjoint evaluation.

**Monolingual historical text** is a *fourth objective*, not a translation-evidence tier. Its denoising loss does not tell us whether English meanings are correct.

The published dictionary's 2,142 headword identities, 225 independently source-checked headword records, provisional archive records, exact forms, grammatical hypotheses and lexicon spelling variants are not themselves 2,142 bilingual translation pairs.

## Historical English-pretraining milestone

The **weak Brinton** JSONL and tests live only in the research tree. We added a separate opt-in English-pretrained adaptation path:

```sh
# Checks 150 real historical candidate alignments; no weights changed
python -m neural.historical_candidate_english --audit-only

# Trains a research-only FLAN-T5-small LoRA on 133 historical candidates,
# tests development *loss* on 17 previously reserved Brinton stanzas.
python -m neural.historical_candidate_english \
  --manifest research/neural_training/brinton_1890_poetry_weak_en.jsonl \
  --output /private/tentli-brinton-weak-english-adapter --steps 40

# Still rejects all raw model suggestions outside the EXISTING source-audited
# English candidate set, without editing production web translator weights.
python -m neural.pretrained_english --text 'nichōca' \
  --adapter-dir /private/tentli-brinton-weak-english-adapter
```

Experiments **must** record the base model revision, historical manifest hash, training works, dev works, actual updates, loss before/after, and counts of accepted/rejected raw proposals. An improvement in dev loss on known Brinton editorial targets, or 40 successful updates, is **not** independent Classical Nahuatl translation accuracy. Trained adapters stay private/time-bounded and never deploy by CI.

Research checks: `tools/test_brinton_weak_parallel.py`, `tools/test_historical_candidate_english.py`, `tools/test_pretrained_english_review_loop.py`. The original `research/translation_corpus/pairs.csv` remains the sole authority for **human-approved** translation pairs, and its supervised loader is unchanged.

## Forty-cycle research process (different from 40 gradient updates)

An autonomous research assistant can propose **up to 40 bounded hypotheses/experiments** in a cycle, but none is automatically authoritative. At each candidate step:

1. Locate a real failure or uncertainty from source-work-disjoint diagnostics; retain original Nahuatl, source folio or exact record, and model/checkpoint hash.
2. Search historical dictionary/manuscript references, assess reuse permissions and dialect, preserve alternatives and uncertainty.
3. Propose a **testable** grammatical rule, lexical improvement, or training example in a separate review queue; do not overwrite the canonical evidence.
4. Run training or morphology tests in isolated research branches; compare historical development coverage and untouched Gold metrics, when genuine Gold exists.
5. Escalate any source promotion, reviewer claim, merge, or production deployment to independent review.

Prioritize areas of high-frequency words and sentence meaning, including context-sensitive `in` (not an invariant 'the'), `atl` / `ātl` and `xochitl` / `xōchitl` (careful spellings). The model may repeat a **proven** supervised example, but repetition cannot transform incorrect labels into facts. All model-generated corrective examples remain Bronze or pending feedback until independently checked.

## Release gate

A candidate neural checkpoint is **not** a public translation upgrade unless independent, rights-cleared, source-work-disjoint human evaluation demonstrates better semantic faithfulness and coverage, and there is no regression in Tēntli's morphological/grammar-IR source guarantees or hallucination/abstention controls. Until then the canonical English reading remains authoritative.

## Actual pretrained candidate training result (October 29, 2026 local)

[Successful candidate FLAN-T5 research workflow #41004161971](https://github.com/niftybacon/tlahtolli/actions/runs/41004161971) completed the newly introduced weak-history training job, the source/Gold-separation tests, a 40-step FLAN-T5 LoRA optimizer run, actual adapter load, and canonical translation/unknown-input gate probes. Results from its emitted research metadata:

- 133 train, 17 development candidates, drawn from disjoint Brinton poems; weak-alignment gradient weight **0.15**.
- 40 actual LoRA optimizer steps; English-pretrained base model remains `google/flan-t5-small`, pinned revision.
- Held-out **Brinton development teacher-forced loss**: **3.980656 before → 3.886141 after**. This is not a human semantic evaluation or translation accuracy.
- All three constructed free-generation probes were **rejected** by the canonical English candidate gate: `nichōca` → proposal `Preserve every argument, negation, number and tense.`; `nitlacua` → empty proposal; `niquitta in cihuātl` → instructional fragment. The existing canonical outputs (`I cry.`, `I eat.`, `I see the woman.`) remained unchanged; unknown `xyzzy` abstained.
- Independent human-scored accuracy remains **null**; zero Gold examples; no adapter publicly deployed. Actual adapter stored as a time-limited research-only GitHub Actions artifact (30 days).

This result supports continued *carefully graded* bilingual supervision **and better data/architecture**, not merely more unsupervised repetition. Separate [Issue #98](https://github.com/niftybacon/tlahtolli/issues/98) tracks independent Gold review; [Issue #99](https://github.com/niftybacon/tlahtolli/issues/99) tracks an existing main-branch English evidence-panel browser regression. The latter is independently visible in [main workflow #41002514274](https://github.com/niftybacon/tlahtolli/actions/runs/41002514274) and should be fixed in parallel without mixing unrelated user-interface changes into this neural training PR.

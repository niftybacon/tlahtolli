# Pretrained English, reviewed corrections and persistent source-graded practice

**Research only.** The public browser's canonical translator, historical
morphology, grammar-IR, dictionary, and current neural weights are NOT
changed by this work. Inference research can opt into a genuinely
pretrained English-capable decoder; all outputs remain source-gated.

## 1. What was installed and why

**English model:** [Google FLAN-T5-small](https://huggingface.co/google/flan-t5-small)
(version pinned to `10b5db0bd799e8f44ff8bf0b2b9407863033cbd2`),
**76,961,152 parameters**, model card license **Apache-2.0**.
The model is downloaded separately when explicitly requested using
`transformers`, `torch` and `sentencepiece`; it is not vendored or
redistributed by Tlahtōlli. No hosted API, key, subscription or
unsourced internet translation service is necessary.

Important: pretrained FLAN-T5 **knows written English better than
the tiny 104,039-parameter custom byte model**. It does *not*
therefore understand historical Nahuatl, prove translation
accuracy or know what an unsupported manuscript means.

The existing **source-backed grammar bridge** in
`neural/hybrid_infer.py` / `tools/source_gated_english_bridge.js`
constructs complete, sourced grammatical English alternatives
**before** the pretrained decoder runs. The larger model rewrites
the **English candidate only**, and may replace it **only if its
output exactly matches a complete already-audited English choice**.
A proposal adding unseen words, arguments, nouns, negation, number,
tense, or unsupported punctuation is rejected and the original
canonical English remains. Unknown Nahuatl abstains and doesn't even
load the larger model.

### Verified real pretrained execution

[Successful real FLAN-T5-small test #41000763943](https://github.com/niftybacon/tlahtolli/actions/runs/41000763943)
loaded **actual** model weights (76,961,152 parameters), and
the English-realization gate accepted the model's rewrites for:

| Original source | Audited + accepted model English |
| --- | --- |
| `nichōca` | `I cry.` |
| `nitlacua` | `I eat.` |
| `niquitta in cihuātl` | `I see the woman.` |

`xyzzy` abstained. These are **known constructed grammar controls**
and model identity rewrites, not an independent historical
translation benchmark or evidence that FLAN itself translates Nahuatl.

The default English research path remains canonical. Enabling
`--pretrained-english` is **opt-in**, and incompatible or
hallucinated rewrites do not escape the source evidence gate.

```sh
python -m pip install torch transformers==4.46.3 sentencepiece
python -m neural.pretrained_english --text 'nichōca'
python -m neural.hybrid_infer --text 'nichōca' --pretrained-english
```

## 2. Feedback: immediate memory is NOT immediate self-certification

The opt-in `neural/correction_queue.py` stages a translation
attempt and proposed correction into an append-only JSONL file.
Every entry includes original Nahuatl, source URL, work identity,
variety, engine commit, failure category, suggested English and
failure note. It is always `pending_human_review`,
`train_eligible:false`, `gold_translation:false` with unknown
rights. Repeated input is deduplicated by **work + exact source**.
A thousand votes do not create a manuscript citation.

**Do not commit private user submissions to a public repository.**
Use a private queue or add only consented historical public-source
examples; redact people and secrets. No user conversations are
automatically imported. The `--queue` option accepts a private
path. A minimal candidate JSON may look like:

```json
{
  "source_text": "nichōca",
  "source_url": "https://example.org/replace-with-actual-source",
  "work_id": "actual-manuscript-identity",
  "nahuatl_variety": "Classical Nahuatl",
  "engine_commit": "0d6faca05b791726854c50ee733e55b4aba9e1d6",
  "failure_category": "english_composition",
  "user_suggested_english": "I cry.",
  "failure_note": "A reviewer must first inspect the real source and context"
}
```

```sh
python -m neural.correction_queue stage --queue /private/path/corrections.jsonl --input proposed.json
python -m neural.correction_queue report --queue /private/path/corrections.jsonl --threshold 40
```

The last command groups **distinct historical inputs by work
and failure category**. Reaching 40 flags a *research priority*;
it doesn't secretly patch rules, rerank translations or retrain
weights. The [daily scheduled feedback audit](../.github/workflows/tentli-pretrained-reviewed-learning.yml)
produces aggregate summaries without reading private queues or
approving any unverified word.

## 3. True reviewed corrections: ready, but no real pairs yet

The authoritative review/rights/holdout file remains
[research/translation_corpus/pairs.csv](../research/translation_corpus/pairs.csv),
not the correction queue. Its existing
`tools/validate_translation_corpus.py` checks Classical variety,
source and translation rights, editor/reviewer identity,
alignment, and document-level split boundaries.

`neural/train_reviewed_english.py` then requires **separate named
transcription and translation reviewers**, at least one
rights-cleared `approved` **training** pair and a **different
historical work** containing an `approved` **development** pair.
It trains a **small LoRA adapter** on FLAN-T5 only from those
approved Nahuatl/English examples, and records source manifest
hashes, base checkpoint revision, exact optimizer step count, and
pre/post dev *loss*. A LoRA adapter is not promoted automatically.
The held-out test remains unused.

**Current real approved pairs: zero.**
Therefore no genuine human-reviewed historical bilingual training
has occurred yet, and the tool **correctly refuses to fabricate it**.
The test workflow has demonstrated a one-step LoRA update with
a deliberately synthetic fixture; this validates the machinery,
**not historical competence**.

```sh
python -m neural.train_reviewed_english --audit-only
# Only after source- and rights-reviewed pairs.csv has distinct train/dev works:
python -m neural.train_reviewed_english \
  --pairs research/translation_corpus/pairs.csv \
  --output /private/approved-english-adapter --steps 80
```

## 4. Teaching synthetic grammar versus actual historical supervision

We should practice forms Tēntli's source-backed engines can
already analyze. The existing source-graded
`tools/export_tentli_neural_teacher.js` creates such
**synthetic grammar-produced** Nahuatl/English examples. They are
low-confidence teaching exercises, not attested manuscript pairs,
and must never become independent evaluation gold.

`neural/grammar_teacher_practice.py` gates these through the
unchanged teacher provenance ledger and can practice the supervised
English objective with a separate lightweight LoRA adapter,
**explicitly labeled `synthetic_grammar_teacher`**. Whenever the
data permits, whole predicate lemmas must be held out. A
successful training-loss reduction is never historical accuracy.
If source diversity is inadequate, the practice run must
**fail closed** rather than invent missing verb groups.

The model should not update its own weights based on English
fluency, model confidence, user clicks, repetition, or feedback
that has not been independently checked. Otherwise it can
reinforce hallucinated lexical senses.

## 5. Autonomous persistence, without autonomous invention

Daily GitHub Actions reads the versioned pending queue and
checks the source-graded corpus and reviews. The report surfaces
frequent categories to help agents choose the next improvement;
it does not run an unsupervised agent, access user chats,
confer new scholarly authority, auto-merge grammar PRs,
train on private conversations or release a model.

Approved progress is stored durably through Git commits and
verified source data; experimental trained adapters may be saved
as time-limited private research artifacts. Research artifact
retention is **30 days**, not indefinite model memory.
External long-lived weights need a separate rights, security
and storage plan.

## 6. Independent second-agent work, without code conflicts

[Issue #95 — Semantic IR and English-meaning verifier](https://github.com/niftybacon/tlahtolli/issues/95)
is an assignment-ready specification for another agent:
unify predicate/arguments, subject/object person, possession,
tense/aspect, negation and subordination under one
source-linked semantic representation; verify all words are
accounted for before English realization. That agent can use
a separate branch and PR, independently of this English model
and feedback work. **Creating an issue does not start an agent.**
PR #92's lexically source-gated predicate-English integration
remains a separate concurrent workstream.

## Progress criteria before release

- No new unreviewed word, translation or historical attestation
  is fabricated by English realization.
- Real translation evaluation requires unseen, expert-reviewed
  source-document groups and permissions, *not* constructed
  controls or AI self-scores.
- Track accepted/rejected pretrained English rewrites separately
  from human-verified meaning and real bilingual training.
- No public default English model deployment until it improves
  held-out meaning/coverage without increasing unsupported
  statements; preserve the canonical grammar fallback.

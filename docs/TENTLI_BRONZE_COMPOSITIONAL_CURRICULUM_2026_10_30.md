# Tēntli Bronze Phase 3 — source-gated single- and two-clause English curriculum
*October 30, 2026. Research only; not historical bilingual Silver or Gold.*

## Actual generated and validated curriculum

[Successful full indexed and compositional teacher CI](https://github.com/niftybacon/tlahtolli/actions/runs/41074457452) runs the existing canonical Tēntli morphology, sentence analyzer, English composer and shared grammar-IR audit **before** accepting any training example. It rejects any source without complete, cited candidate English; no invented Nahuatl verbal cells or free neural paraphrases.

| Measure | Actual |
| --- | ---: |
| Indexed input attempts (12 lemmas × 10 source-indexed paradigms × 6 persons × 2 polarities) | 1,440 |
| Independent complete, source-audited **single-clause** English options admitted | **288** |
| Newly constructed, separately audited **two-clause** conjunctions with `auh` | **5,888** |
| Total Bronze source-grammatical curriculum | **6,176** |
| Whole verb-lemma groups used in construction | 12 |
| Training examples (10 source lemmas; coordinated pairs use only those 10) | **6,000** |
| Development examples (other 2 source lemmas; coordinated pairs use only those 2) | **176** |
| Approved independent historical English examples created | **0** |
| Model weights or public translator changed by the export | **0** |

The first expansion attempt against all ten indexed verb tense/mood patterns admitted **only 288** simple English examples. This is a source gate doing the right thing: an indexed surface alone does **not** justify an independently correct English tense or mood rendering. The new 5,888 options come instead from complete two-clause inputs, each individually passed through the entire canonical grammar/English audit, such as structurally joining supported clauses with `auh`. This yields larger *compositional exercise coverage* while **not claiming the underlying finite morphological inventory has been verified**.

### Limitations and train/dev separation

These 6,176 examples are **combinatorially related**, not 6,176 unrelated linguistic facts: they reuse only 12 verb-lemma groups, and the 5,888 two-clause combinations arise from cross-products of known constructions. Measured model gains on a synthetic dev set will not establish true historical translation accuracy.

The generator partitions the 12 canonical lemma groups before composing. A coordinated source uses only two distinct verbs **within the same partition**; it cannot put a training lemma in a development clause or vice versa. The existing `neural.grammar_teacher_practice.teacher_curriculum` independently validates the metadata fingerprint, labels, and group-level split. The tests verify both **all component lemmas** and the full source-audit result for every generated example.

Each row carries its original Nahuatl source, Tēntli's cited English candidate, distinct source URLs, a grammatical pattern/person/polarity label, all contributing lemma groups, the ordinal of the default canonical English alternative, and **explicit `human_reviewed: false`, `historically_attested_sentence: false` and `training_status: synthetic_teacher_only_not_historical_gold`**.

Ambiguous English alternatives retain their original count, and the existing learner gives them weaker gradient weight **0.15** instead of **0.6** for unambiguous canonical choices. This does not mathematically prove that the first default English wording is always correct; it is a source-backed editorial lesson.

### Reproduction

```sh
node tools/test_source_gated_english_bridge.js
node tools/test_wide_source_gated_english_practice.js
node tools/export_wide_source_gated_english_practice.js /tmp/bronze-wide.jsonl
python -m neural.grammar_teacher_practice \
  --teacher-manifest /tmp/bronze-wide.jsonl --audit-only
```

The bridge's research-specific batch producer reuses **one initialized instance** of exactly the same canonical grammar environment for thousands of calls. The old `produce(text)` path is unchanged. A regression test compares full serialized output for ordinary, ambiguous, unknown, past, future and negative source cases, ensuring caching cannot bypass the evidence gate.

## Next step

A bounded, **separate** English-pretrained LoRA learning experiment can train on these examples and measure teacher-forced development loss on the two lexically held-out verb groups. No automatic weight deployment or Gold promotion is authorized. Even a large drop in synthetic held-out loss is not evidence for accurate unseen Classical Nahuatl manuscripts.

Independent human-reviewed Gold (Issue #98) and source-reviewed Silver pairs remain the essential missing reference for any public model upgrade. The parallel [Brinton source review](TENTLI_BRINTON_CONTEXTUAL_FORMS_2026_10_30.md) identifies real vocabulary uncertainty that synthetic repetition cannot resolve.

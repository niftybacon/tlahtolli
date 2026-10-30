# Tēntli — mandatory consolidated six-phase roadmap and Gold / Silver / Bronze policy
_Last reconciled October 30, 2026 (America/Chicago). This section is the CURRENT policy; later dated experiments are historical observations, not current milestone claims._

> **Required contributor/agent contract.** This document and [the README's required-roadmap entrypoint](../README.md#required-development-roadmap-october-30-2026) govern future Tēntli work. All agents must read [`AGENTS.md`](../AGENTS.md) first, inspect latest `main` and active PRs, and preserve existing canonical engines. A roadmap change does not imply instant mastery: demonstrate real source-supported outcomes and measured diagnostics. Any **substantial** deviation or milestone advance must be reconciled in **both** this roadmap and the README in the same PR, with explicit notice in the PR body/linked issue to concurrent agents. No silent changes.

## Six overlapping workstreams — October 30 baseline and acceptance gates

| Phase | Implemented baseline | Next move and definition of progress |
| --- | --- | --- |
| **1. Stabilize the engines** | Existing `tools/morphology_engine.js`, `translator-sentence.js`, `translator-grammar-ir.js`, `translator-english.js`, `tools/source_gated_english_bridge.js`; source-gated predicate English PR #92 merged, earlier browser regression #99 closed | [Issue #95](https://github.com/niftybacon/tlahtolli/issues/95): add independent semantic event/argument verification in an isolated branch; preserve exact-token coverage, agreement/person/number, tense/aspect, negation scope, object definiteness, possessors, referents and abstentions; run existing regressions and negative controls |
| **2. Establish bilingual evidence** | 150 Brinton printed stanza **candidate** correspondences (133 train / 17 dev); 40 source-locked **pending** Silver review cases; **0 signed reviewed Silver and 0 approved blind Gold** | Independently check historic text, alignments, rights and contextual meaning; select an entirely untouched collection for 10–20 initial human-reviewed Gold cases, then 100–200 as possible; no reviewed-human claim without review ([Issue #98](https://github.com/niftybacon/tlahtolli/issues/98)) |
| **3. Expand the grammar teacher** | 6,176 source-grammar-audited **Bronze constructed examples** (not 6,176 historical translations) | Focus on *new* verified coverage for possession, clause embedding, argument roles, negation and discourse. Use testable source-bounded generations, explicit labels, lemma/work-disjoint validation and difficult negative cases rather than inflating counts by simple recombination |
| **4. Give Tēntli stronger English** | Pretrained FLAN-T5-small LoRA and earlier byte-model training are real *research* experiments. Raw free generation failed controls; source-gated canonical English remains authoritative | Use qualified, rights-cleared reviewed bilingual supervision and semantic comparison before scaling experiments. Preserve grammar-IR gates, collect before/after scores and rejected proposals, never deploy unsupported predictions or claim accuracy from dev loss |
| **5. Build persistent learning** | Pending-correction queues and recurring historical audits exist, but the scheduled analysis reports **do not write accepted grammar rules or model knowledge** | Persistent, versioned `proposal → independent source review → explicit authorization → canonical source/engine update → regression → measured historical effect`. Keep rejected/pending proposals distinct; protect original historical source fingerprints |
| **6. Expand historical coverage** | 1,181 source-written forms investigated; 928 without linked-engine analysis after #105 and #106; seven historical contexts exercised through the engine; exact context-gated `huiya` notes reach production | Prioritize recurring source-verified gaps and authentic clause/finite-verb evidence, distinguish poetic vocable vs ordinary verb and `-cān` functions; integrate only warranted analyses into **existing** engines; rerun identical pinned development cohorts with unchanged measurements |

**Phase 1 implementation note, October 30:** The research English bridge has gained [a bounded, recomputation-based semantic-preservation contract](TENTLI_SEMANTIC_PRESERVATION_CONTRACT_2026_10_30.md) that checks exact canonical English options and sourced person/tense/negation/object/relative roles before research neural scoring. It is a separate read-only adapter to the existing engines and has constructed negative-control tests. It is **partial** progress on [#95](https://github.com/niftybacon/tlahtolli/issues/95), **not** completion of historical semantic verification or independently measured translation accuracy. Remaining Phase 1 work includes supported-construction expansion, long-passage performance measurement and independent evaluation against qualified human-reviewed references. Gold and reviewed Silver remain **zero**; no neural weights or public website translator were changed.

**Phase 5 implementation note, October 30:** The existing opt-in feedback/correction queue now has a [versioned, append-only editorial review ledger](TENTLI_PHASE5_REVIEW_LEDGER_2026_10_30.md). It maintains a hash-chained history of source-fingerprinted pending proposals, human/editorial *declared* review decisions and PR/commit/test-linked implementation reports; all mutations require an exact prior ledger head and all changes remain visibly **unverified declarations**. New `tools/test_review_ledger.py` checks tampering, stale heads, incompatible source fingerprints, unauthorized Gold/Silver/training status, missing source URLs and fictitious implementation reports. The committed ledger is **empty** and does not represent any independently reviewed linguistic meaning, approved training example or verified productive rule. This is partial **review infrastructure** only, **not** autonomous approved promotion or learned historical grammar. Next milestone: one genuinely source-checked candidate, actual independent review, canonical implementation through a separate tested PR and measured before/after engine coverage, with an independently checked ledger follow-up. The source-to-grammar engine consumption path is unchanged; Phase 2 Gold remains 0.

**Dependency:** Phases **2 and 6** must steer phases 1, 3 and 4; phase 5 closes the review loop. These are interdependent workstreams, not six new engines or fixed promises of elapsed time. Start with source-grounded semantic verification, then investigated high-impact grammar gaps, then independently supervised English learning.

## Historical translation and learning baseline — distinguish units

- The October 29 pinned **200** Axolotl development records contain **1,998 token occurrences**; **552** exact curated token matches (27.6%); **111** previously unknown token occurrences have morphology *hypotheses*; **0** complete grammar records / audited English drafts. Those measurements were a known **development** cohort, **not independent accuracy**. See [coverage diagnostic](TRANSLATION_COVERAGE_DIAGNOSTIC_2026_10_29.md). New releases must identify the actual evaluated revision and run the same cohort; do not assume earlier scores are current after changes.
- The October 30 source investigation assessed **1,181 distinct written surfaces**, with **928** not matched through any connected engine. It did *not* produce 928 missing dictionary lemmas or approve 928 translations. See [full-form triage](../research/translation_corpus/UNRESOLVED_928_HISTORICAL_TRIAGE_2026_10_30.md).
- The **6,176** Bronze practice examples are grammar-generated and audited, many arising from clause combinations. More examples alone need not imply new grammatical phenomena or semantic competence.
- Canonical lexical inventory (at the documented October 29 snapshot): **2,142** headword records, **225** individually source-checked at the entry level, **341** recorded lexical/inflected forms, **9,003** field claims and **12** full derived paradigm tables. None of these counts is an independent manuscript translation score.
- The October 30 context-specific `huiya` evidence must match the **exact two cited contexts**, not globally rewrite `huiya` into a song interjection or "go." The existing grammar/IR/English abstention path and negative tests are the control; see [engine consumption audit](../research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md).

## Gold / Silver / Bronze: trust level is distinct from permission to train

| Tier | Current verified status | Allowed action | Prohibited claim |
| --- | --- | --- | --- |
| **Gold: blind independent evaluation** | **0** expert-adjudicated historical English cases | Rights-cleared independent semantic scoring, after whole-collection freeze and blind reviewer protocol. Initial target 10–20, eventual 100–200 | Never train, tune, proofread the model from the answers or represent in-sample works as unseen |
| **Silver: historical bilingual evidence** | **150 Brinton candidates**, **40 pending review cases**, **0 independently signed and approved Silver** | Source-exact editorial comparison, documented rights and fidelity. Limited weak research supervision of existing *candidate* data remains explicitly low-weight; separately approved reviewed cases may later qualify for supervised training | A candidate alignment, nineteenth-century poetic paraphrase or automated matched line is not an expert-verified literal translation |
| **Bronze: constructed grammar learning** | **6,176** source-grammar-audited synthetic English examples | Controlled grammar practice/experiments, provenance-aware training and negative tests | Never call a generated cell an independently attested manuscript form or Gold |
| **Monolingual historical** | Source-graded Florentine, Sahagún, Chimalpahin and other experimental corpus subsets | Separately labeled historical-language training / denoising research where rights permit | Denoising loss and sample count are not English translation accuracy |

These safeguards are encoded in the [Silver/Gold review protocol](../research/translation_corpus/SILVER_GOLD_REVIEW_PROTOCOL.md) and existing approved-pair gates. Keep **source provenance**, **contextual semantic confidence**, **training entitlement**, and **human approval** as separate metadata fields; a checked lemma/part of speech is not automatically a reviewed contextual translation. Never infer Gold or Silver from the presence of a file in `research/`.

## Next ordered development milestones

1. **Semantic preservation (#95):** independently versioned verifier/adaptor, no competing grammar engine; verify full token coverage, scopes, roles, source grades and abstention.
2. **928 gap-case research:** use the **existing** full-source investigator and engine bridge; classify source-specific unknowns by inflection, spelling, particle/vocable, segmentation, missing lemma, construction or unresolved. Prioritize cross-work frequency and source quality. Initial source-audited 50–100 investigations are a *target*, never a promise of approved interpretations.
3. **Source-licensed grammar promotion:** review bounded morphology/clauses, integrate into canonical engines only where source evidence warrants; test positive/negative examples and compare pinned historical development results.
4. **Independent bilingual review (#98):** human-sign the highest-value Silver cases and freeze genuinely unexposed Gold collections **in parallel** with engineering; no private reference text in public CI.
5. **Durable reviewed promotion:** persist source fingerprints, alternative analyses, review/decision logs, regression IDs and actual affected engine outputs; no automatic source truth from a neural proposal.

## Multi-agent coordination: must follow, and must notify on substantial change

1. **At start of every new task**, read `README.md`, `AGENTS.md`, this file, the current engine consumption audit, the relevant source/evidence policy and the open PRs/issues. Older dated handoffs are historical, not authority over newer primary-source evidence.
2. **Reuse** canonical morphology, sentence parser, shared grammar IR and English composer. Do not clone a parser, invent English glosses, strip diacritics globally, mix modern dialects into Classical data, or silently promote provisional archive/OCR records.
3. **Coordinate before edits:** claim a nonoverlapping module/workstream in the PR, record the starting `main` SHA, inspect changed files in other branches, rebase/reconcile before merge. Avoid unreviewed merges or overriding other agents' files.
4. **Every substantive PR** must explain what changed, which of phases 1–6 it advances, its source/rights/provenance and evidence tier, actual measured results and limits, negative/regression tests, and coordination with other open work. See [PR checklist](../.github/PULL_REQUEST_TEMPLATE.md).
5. **When substantially changing milestones, architecture, training/deployment permissions, evidence-tier rules, evaluation split, verified counts or ownership**, update this file **and** the README in the **same** PR; notify collaborators/agents through the PR summary and relevant issue (e.g. #95/#98). Describe breaking/retraining/migration implications and update the engine consumption audit if actual connections change. Do not claim notification to agents merely by storing a note: explicitly document where the message was posted.
6. **Ship only verified outcomes:** run targeted plus full regressions, generated-asset parity checks when relevant, and pinned historical dev checks where affected. Never claim independent accuracy with Gold=0; a CI green check certifies engineering invariants, not scholarly meaning.

## Preexisting experimental details (historical reference; not status overrides)

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

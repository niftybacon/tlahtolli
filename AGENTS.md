# AGENTS.md — mandatory Tlahtōlli / Tēntli agent instructions

**Applies to the entire repository, including AI coding agents.** Read this document at the start of each new repository task. It is the entry point to the [required README roadmap](README.md#required-development-roadmap-october-30-2026) and the [authoritative six-phase plan](docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md). When this file conflicts with historical dated PR descriptions, check the current canonical sources and explain the conflict; do not blindly use the older account. Scholarship and source evidence can require revising the roadmap, but **not silently**.

## Nonnegotiable mission and architecture

Build an evidence-grounded **Classical Nahuatl** research dictionary and translator that can improve measured coverage of authentic texts **without hallucinating historical forms or English meanings**.

Reuse these existing components rather than writing rival engines:

- Canonical productive morphology: `tools/morphology_engine.js` and its generated browser counterpart.
- Existing source-aware lexicon, `data/lexicon.json`, `data/morphology.json`, `data/evidence.json` and claim audits; `dictionary.json` is generated, not a second source of truth.
- Syntax: `translator-sentence.js`, `data/clause_grammar.json`; shared representations: `translator-grammar-ir.js`; English: `translator-english.js`.
- English source gate: `tools/source_gated_english_bridge.js`. Experimental neural components must not bypass canonical semantic and provenance audits.
- Evidence comparison, source morphology, spelling and the 36,543-row archive are **not** a substitute productive analyzer. Check [actual consumption](research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md) before asserting that a research file is loaded by production.

**No automatic Gold/Silver certification, human reviewer impersonation, manufactured attestations, generalized orthographic substitutions, unstated modern-dialect substitutions or self-promoted neural outputs.** Preserve exact historical written form, manuscript/editorial locator, source period, variants, competing senses, argument structures, uncertainty, licensing and role of each claim.

## Mandatory six-phase plan

| Phase | Required objective (current roadmap) |
| --- | --- |
| 1 | **Stabilize the engines:** finish source-grounded semantic role/scope verification in Issue #95 using merged source-word and English-preservation checks (#108/#116) plus reviewed whole clauses. Do **not** build a duplicate semantic adapter. |
| 2 | **Top priority:** independently review the 150 Brinton **candidate** alignments/40 pending Silver worksheets and prepare truly untouched, blind, work-disjoint Gold under #98. Current approved Silver/Gold = **0**; project-director research is not independent Gold. |
| 3 | Improve productive grammar *diversity* from the existing **6,176 Bronze synthetic** examples with independently justified historical constructions; #114/#115 are draft stacked work, not merged grammar. |
| 4 | Hold major stronger-English retraining until independently reviewed semantic supervision/evaluation exists; preserve canonical English source gates and abstention. |
| 5 | **Use**, do not recreate, the merged versioned append-only source-fingerprinted review/implementation ledger (#109); keep director declarations separate from external expert approvals and tested promotions. |
| 6 | **Top priority:** compare original clauses and exact written forms from the existing 1,181-form investigator, **926** current unmatched surfaces, 80 source-locked dossiers and 3 unapproved context leads (#117); never equate a research finding with a canonical grammar rule. |

**Phases 2 and 6 lead concurrently.** They supply reviewed evidence to Phase 1 semantic safety and Phase 3 grammar, while the existing Phase 5 ledger retains provenance; only later should Phase 4 train on approved material. Preserve contextual lexical sense vs grammatical construction vs complete English translation as separate review outcomes. A director's stated contextual interpretation is a reviewable, source-cited proposal rather than automatic independently expert-certified Silver/Gold. Never reopen an already documented identical review question without a new source or unresolved distinction. See the revised authoritative roadmap for acceptance gates and open PR coordination.

## Evidence tiers and hard boundaries

- **Gold:** entirely untouched, collection-disjoint and independently reviewed historical Nahuatl→English evaluation, **never** training or tuning. Until genuinely reviewed, Gold count remains 0.
- **Silver:** distinguish historical printed **candidate**, linguistic **reviewed candidate**, and explicitly **approved** training eligibility. Brinton's interpretive stanza correspondences are not automatically literal, expert reviewed or trainable at full confidence.
- **Bronze:** source-grounded **constructed** exercises, not manuscript attestations, and not independent historical translation accuracy.
- **Monolingual historical:** separate task; denoising loss, optimizer steps and downloaded corpus volume cannot establish English quality.

Use [review gates](research/translation_corpus/SILVER_GOLD_REVIEW_PROTOCOL.md), [the consolidated roadmap](docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md), and [engine evidence audit](research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md). No independent Gold set has yet established real translation accuracy; do not report lexical coverage as that accuracy.

## Before editing, while working, and before merge

1. **Read current `main`, README, roadmap, this file, relevant editorial/source files, open PRs and open issues.** Note exact main SHA and look for other AI agents editing overlapping modules; coordinate branch/file ownership through PR/issue. Never overwrite another agent's improvements or recreate an already merged feature.
2. Define a narrow milestone with a measurable criterion and failure/regression tests. Work on a **separate feature branch**, not directly on `main`, unless explicitly instructed to do so.
3. Record source URLs, date/folio, form/sense distinctions, source rights and exact original surfaces. Distinguish contextual poetic vocables (such as the **two exact reviewed `huiya`** contexts) from productive verbs. Avoid universal rules based on similar spelling.
4. Include actual outputs of source-specific diagnostics, existing analyzers, English/IR refusals, and relevant negative cases; compare against pinned development data. A simulated or constructed example never substitutes for a historical proof.
5. Run the specific tests plus full translator/editorial/asset checks where touched. Keep canonical generated files synchronized using repository's existing builders; do not hand-edit derived output and leave scripts inconsistent.
6. **Substantial changes require coordination and notification:** if architecture, evidence policy, source permissions, evaluation splits, training/deployment rules, material coverage claims, milestones or agent ownership change, update **both** `README.md` and `docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md` in that PR and update this file if agent expectations change. Update engine-consumption audit when engine wiring changes. State the change, impacts, affected agents/modules and new acceptance evidence in the PR description and **notify relevant parallel agents on their linked issue/PR**. If no parallel agent is identifiable, explicitly say so in the PR instead of claiming a notification was sent.
7. Re-fetch current `main` and inspect concurrent PR diffs before merging. Never merge with failed required checks or hidden conflicts; preserve preexisting work and published reader data.

See [required PR checklist](.github/PULL_REQUEST_TEMPLATE.md). Lightweight documentation/testing changes still follow these boundaries even when no roadmap milestone changes.

## First recommended tasks and forbidden shortcuts

- **Best independent engineering workstream:** semantic verifier [#95](https://github.com/niftybacon/tlahtolli/issues/95), not an alternative morphology engine.
- **Best autonomous historical research workstream:** reuse `neural/paged_historical_investigator.py`, `tools/investigator_engine_bridge.js`, `tools/triage_unresolved_historical_forms.js` for source-traceable current 926-case gap analysis (historical baseline 928); promote only individually justified findings.
- **Best human review workstream:** [#98](https://github.com/niftybacon/tlahtolli/issues/98) for actual independent Gold, plus pending Silver review.
- **Best efficiency workstream:** durable reviewed evidence promotion, regression trace and honest coverage funnel; **do not add redundant weekly schedulers** or blindly train on the same unverified text.

The project is better served by fifty independently grounded grammar analyses that reach the real sentence/English pathway than by thousands of speculative dictionary rows or self-generated translation claims. A reviewer should be able to reproduce what changed and why.

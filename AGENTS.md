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

| Phase | Required objective |
| --- | --- |
| 1 | Stabilize canonical engines and build a source-grounded semantic verifier, especially [Issue #95](https://github.com/niftybacon/tlahtolli/issues/95), with negative/regression tests |
| 2 | Expand independent **bilingual evidence**: reviewed Silver and protected, genuinely blind Gold ([Issue #98](https://github.com/niftybacon/tlahtolli/issues/98)); currently 150 *candidate* Brinton alignments, 40 *pending* Silver reviews and zero approved Gold/reviewed Silver |
| 3 | Improve grammatical diversity of the existing 6,176 **Bronze synthetic** cases; don't inflate a known grammar by repetitive sentence combinations |
| 4 | Improve English with genuine reviewed bilingual supervision before further large neural training; preserve source-gated English and abstention |
| 5 | Build a durable **proposal → review → source-authorized promotion → regression** process; current scheduled audits only propose research |
| 6 | Make authentic historical text more analyzable: 1,181 researched written forms and 928 unconnected forms are triage measurements, not 928 dictionary lemmas |

**Phases 2 and 6 guide other phases.** Prioritize semantic verification, historical-failure classification, source-licensed productive grammar connections, reviewed translation evaluation and persistent promotion. Follow the details, evidence limits and acceptance criteria in the authoritative roadmap.

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
- **Best autonomous historical research workstream:** reuse `neural/paged_historical_investigator.py`, `tools/investigator_engine_bridge.js`, `tools/triage_unresolved_historical_forms.js` for source-traceable 928-case gap analysis; promote only individually justified findings.
- **Best human review workstream:** [#98](https://github.com/niftybacon/tlahtolli/issues/98) for actual independent Gold, plus pending Silver review.
- **Best efficiency workstream:** durable reviewed evidence promotion, regression trace and honest coverage funnel; **do not add redundant weekly schedulers** or blindly train on the same unverified text.

The project is better served by fifty independently grounded grammar analyses that reach the real sentence/English pathway than by thousands of speculative dictionary rows or self-generated translation claims. A reviewer should be able to reproduce what changed and why.

# Phase 5 milestone: append-only correction review and implementation ledger

*October 30, 2026; research/project-governance capability, not autonomous linguistic knowledge or a live translation upgrade.*

## Purpose and architectural boundary

Tēntli already has `neural/correction_queue.py` for **pending**, source-linked feedback, and `research/translation_corpus/pairs.csv` for **separately approved** rights-checked training pairs. The current historical investigator diagnoses original manuscript/edition surfaces and does not automatically update productive grammar. Re-running scans cannot legitimately make unverified assumptions canonical.

The new `neural/review_ledger.py` adds a **versioned, append-only history** of source-fingerprinted *research decisions*, rather than another dictionary, morphological analyzer, translation model, parallel corpus, or independently certified Silver/Gold system. It reads genuine canonical pending corrections, records bounded human/editorial *declarations*, and records a later claimed implementation with PR/commit/test pointers. **Nothing in this system writes an approved dictionary entry, source claim, manuscript transcription, Silver/Gold pair, neural weight, or public translator output.**

The committed `research/translation_corpus/review_ledger.jsonl` is intentionally **empty**: no corrections were independently reviewed or implemented during creation. These tests use deliberately fictional non-Nahuatl fixture inputs that are never committed as real decisions.

## State transitions and evidentiary meaning

| State/event | Preconditions | Result and restrictions |
| --- | --- | --- |
| `proposal` | An **exact, canonical** staged record from `neural.correction_queue.stage`, tied to original work/written input and engine revision | Pending research hypothesis. Never equivalent to a verified linguistic form or human translation |
| `review_note` | Existing proposal and matching original source fingerprint; reviewer name *as a declaration*, rationale, specific evidence URLs, source-rights assessment | `needs_more_evidence`, `reject_candidate` or `source_supported_hypothesis`. These are **recorded editor assertions**, not electronically authenticated qualified review or automatic approval |
| `implementation_report` | Most recent review declaration `source_supported_hypothesis`, matching source fingerprint, actual-looking Tlahtōlli PR URL, full commit SHA, changed paths, regression paths and measured diagnostic *as user-supplied claims* | Status `implementation_reported_not_verified`, **not** an automatic commit, deployment, source attestation, accurate translation or certification of CI |

The source is reviewed and promoted, if justified, only through a separately reviewed human-controlled **code PR** that changes the actual canonical source and grammar and measures results against the pinned historical development cohort. Merely appending an `implementation_report` does **not** check whether the cited GitHub PR exists, passed CI, was merged or introduced the claimed rule. A reviewer must check all of this separately.

All ledger events have `train_eligible:false`, `gold_translation:false`, `automatically_promoted:false`, `independent_review_authenticated:false`. Changes in literary interpretation (such as historical `huiya` poetic vocables) **require additional source-specific original-language evidence and negative controls**; an editorial declaration is never a blanket spelling or semantic rule. Approved historical English alignment is handled by the **separate** Silver review protocol and training authorization gates.

## Hashing and concurrency

Each event contains an incrementing sequence, immutable `proposal_id`, `previous_hash` and `event_hash`. The hash covers the previous hash plus canonical JSON; replay recomputes the chain and refuses reordered, edited, duplicated, malformed or promotion-bearing records. All writes require the precise `--expected-head` returned by the latest report, and each local write uses a temporary file + atomic replacement.

**These SHA-256 chains are not cryptographic identities, electronic signatures, immutable remote storage or proof that a person reviewed a historical source.** Someone who controls the entire ledger could rewrite all events and recompute hashes. Git history, approved PR review, separately pinned hashes, source identity and access controls remain necessary. Filesystem-level writes are atomic but are not a substitute for inter-agent PR coordination or distributed locking.

Never put private user messages, secret manuscripts, personal data, restricted modern translations, or a reviewer’s private notes into public GitHub. Keep private decisions in a local protected ledger until the owner consents to a rights-cleared public record. The code may validate a source URL's syntax but does **not** verify the cited work, legal license, person identity, historical manuscript glyphs, contextual English or actual machine accuracy.

## Use with existing opt-in correction queue

First stage a **real, consented Classical Nahuatl** source observation (with valid rights to record it), using the preexisting correction-queue interface:

```sh
python -m neural.correction_queue stage \
  --queue /private/tentli/corrections.jsonl \
  --input /private/tentli/new-correction.json
```

The ledger may live in the same private workspace. A missing ledger is an empty state with a SHA-256 head of 64 zeros, also returned by `report`:

```sh
python -m neural.review_ledger report --ledger /private/tentli/review_ledger.jsonl

# Copy the exact head_hash reported above as --expected-head:
python -m neural.review_ledger import-pending \
  --queue /private/tentli/corrections.jsonl \
  --ledger /private/tentli/review_ledger.jsonl \
  --expected-head <CURRENT_64_HEX_HASH>
```

For individual review or implementation reports, prepare a JSON file containing *only* the documented fields, then call:

```sh
python -m neural.review_ledger review \
  --ledger /private/tentli/review_ledger.jsonl \
  --proposal-id pending-<20hex> --input /private/tentli/manual-review.json \
  --expected-head <CURRENT_64_HEX_HASH>

python -m neural.review_ledger implementation \
  --ledger /private/tentli/review_ledger.jsonl \
  --proposal-id pending-<20hex> --input /private/tentli/implementation-report.json \
  --expected-head <CURRENT_64_HEX_HASH>
```

The review declaration JSON must contain `source_fingerprint`, `decision`, `reviewer_name`, `rationale`, `evidence_urls` (1–12 distinct source pointers, **including the original staged source URL**, not only unrelated citations), and `rights_assessment` (`unknown`, `restricted`, or `declared_usable_for_research`). The human submits the declaration; the program does not invent a person or read a user's private files automatically.

The implementation JSON must contain the unchanged `source_fingerprint`, `implementation_pr`, `engine_commit` (40 hex), `changed_paths`, `regression_tests`, `outcome_note` and `measured_diagnostic`. The software refuses direct `pairs.csv` or Gold edits in a purported implementation report. The *real* human-controlled PR is the only place source promotion or official grammatical changes can occur.

```sh
python -m unittest discover -s tools -p 'test_review_ledger.py' -v
python -m neural.review_ledger report --ledger research/translation_corpus/review_ledger.jsonl
```

The separate `.github/workflows/tentli-review-ledger.yml` validates this chain and runs the **existing correction and approved-pair safeguards on PR/push**, rather than creating any additional weekly scheduler. Tests cover 40 independent synthetic proposals, stale heads, original-input tampering, invalid source rights, invented review claims, bogus GitHub pointers, attempts to label data Gold, review state changes, and event reordering.

## Next milestone and acceptance

The current release is **review infrastructure** only. The next *linguistic* milestone is a **real** source-licensed proposal—from the 928 historically unresolved surface triage or a real consented feedback item—subjected to review, a dedicated canonical engine PR and before/after historical regressions, with its final outcome linked back to the ledger. Without a genuine human review and confirmed source evidence, the ledger properly stays empty and cannot make the translator more accurate merely by existing.

The full six-phase plan and agent coordination contract remain [mandatory](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md); this Phase 5 step must not be conflated with Phase 2 independently evaluated Gold or Phase 4 model learning.

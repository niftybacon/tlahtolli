"""Experimental English-pretrained LoRA on *candidate* historical bilingual source stanzas.

This intentionally does NOT use or weaken the human-approved pairs.csv gate.
Brinton's historical 1890 parallel renderings are weak, interpretive supervision,
not verified literal translations or an independent benchmark. Train privately,
then submit raw suggestions only through Tēntli's existing canonical English gate.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

from .corpus import load_corpus
from .train_reviewed_english import fit_adapter

DEFAULT_MANIFEST = Path("research/neural_training/brinton_1890_poetry_weak_en.jsonl")
TIER = "candidate_historical_bilingual"
WEIGHT = 0.15


def load_candidate_pairs(manifest: Path) -> dict[str, list[dict]]:
    """Re-use the established historical source/rights and work-leakage validator.

    No candidate row is allowed to claim review, test-gold, or any training
    precedence over an independently inspected manuscript.
    """
    historic = load_corpus(manifest)
    rows: dict[str, list[dict]] = {"train": [], "dev": [], "test": []}
    work_splits: dict[str, str] = {}
    for item in historic:
        if item.split == "test":
            raise ValueError("Candidate bilingual corpus may not contain independent gold/test rows")
        if (not item.experimental_parallel or item.alignment != "candidate" or
                item.translation_language != "en" or item.translation_weight != WEIGHT):
            raise ValueError("Only historically sourced, weak English candidate alignments may train")
        if item.rights not in {"public_domain", "cc0", "cc_by_4_0", "permission_documented"}:
            raise ValueError("Weak bilingual manuscript requires explicit reuse rights")
        work_splits.setdefault(item.work_id, item.split)
        if work_splits[item.work_id] != item.split:
            raise ValueError("Historical work split contamination")
        rows[item.split].append({
            "id": item.record_id,
            "source": item.original,
            "target": item.translation,
            "work": item.work_id,
            "source_url": item.source_url,
            "evidence_grade": "published_historical_candidate_not_independently_checked",
            "example_weight": WEIGHT,
        })
    if not rows["train"] or not rows["dev"]:
        raise ValueError("Historical candidate research requires both train and dev work groups")
    if {r["work"] for r in rows["train"]} & {r["work"] for r in rows["dev"]}:
        raise ValueError("Candidate train/development historical works overlap")
    return rows


def audit(manifest: Path) -> dict:
    rows = load_candidate_pairs(manifest)
    return {
        "evidence_tier": TIER,
        "training_candidates": len(rows["train"]),
        "development_candidates": len(rows["dev"]),
        "train_works": len({r["work"] for r in rows["train"]}),
        "dev_works": len({r["work"] for r in rows["dev"]}),
        "training_weight": WEIGHT,
        "train_eligible_reviewed_pairs": 0,
        "independent_gold_pairs": 0,
        "accuracy": None,
        "weights_updated": False,
        "source_manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
    }


def adapt(manifest: Path, output: Path, *, steps: int = 32) -> dict:
    rows = load_candidate_pairs(manifest)
    result = fit_adapter(rows, output, max_steps=steps,
                         evidence_tier=TIER,
                         source_fingerprint=hashlib.sha256(manifest.read_bytes()).hexdigest())
    # The independent gold-corpus loader remains unmodified and closed.
    result.update({
        "candidate_historical_training_records": len(rows["train"]),
        "candidate_historical_dev_records": len(rows["dev"]),
        "candidate_translation_weight": WEIGHT,
        "human_reviewed_training_examples": 0,
        "gold_translation_examples": 0,
        "weak_candidate_rights_validated": True,
        "historical_alignment_grade": "published_interpretive_stanza_candidate",
        "historical_semantic_accuracy": None,
        "source_translation_quality_verified": False,
    })
    (output / "research_metadata.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--steps", type=int, default=32)
    ap.add_argument("--audit-only", action="store_true")
    a = ap.parse_args()
    if a.audit_only:
        print(json.dumps(audit(a.manifest), indent=2, ensure_ascii=False))
        return
    if a.output is None:
        ap.error("Experimental LoRA training requires a private --output")
    print(json.dumps(adapt(a.manifest, a.output, steps=a.steps), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

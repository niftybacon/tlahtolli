"""Read-only public-checkpoint readiness audit for Tēntli research.

This is engineering risk disclosure, not legal advice or a ruling that training
or publishing is lawful. No dataset or model weights are uploaded by this tool.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path


def audit(metadata: dict, *, review: dict | None = None) -> dict:
    blockers=[]
    review=review or {}
    if metadata.get("format") != "tentli-experimental-neural-v1":
        blockers.append("Unrecognized or missing model checkpoint metadata")
    if not metadata.get("trained_translation_examples", 0):
        blockers.append("No actual source-aligned bilingual translation training")
    if metadata.get("independent_translation_accuracy") is None:
        blockers.append("No independent human-reviewed translation-quality evaluation")
    if metadata.get("experiment_fixture_only"):
        blockers.append("Checkpoint is based on synthetic smoke fixtures")
    inventory=metadata.get("source_inventory", {})
    copyright_restricted=bool(inventory.get("fair_use_assessed_source_records", 0))
    if copyright_restricted:
        if not isinstance(review.get("model_publication_assessment_url"),str) or not review["model_publication_assessment_url"].startswith("https://"):
            blockers.append("Fair-use input requires a separate, documented review of publishing these weights")
    if not review.get("no_substantial_memorization"):
        blockers.append("No documented source-text memorization/reproduction audit")
    if not review.get("heldout_human_quality_review"):
        blockers.append("No independently reviewed held-out translation evaluation")
    if not review.get("reviewed_source_acquisition"):
        blockers.append("No acquisition/source-access assessment for the actual training files")
    return {
        "public_release_ready": len(blockers)==0,
        "blockers": blockers,
        "fair_use_is_legal_certification": False,
        "note": "A passing engineering checklist cannot resolve copyright or platform terms; consult a qualified reviewer for specific works."
    }


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model-dir",required=True)
    p.add_argument("--review-json",help="Separately maintained public-release assessment metadata")
    a=p.parse_args()
    root=Path(a.model_dir)
    metadata=json.loads((root/"metadata.json").read_text(encoding="utf-8"))
    review=json.loads(Path(a.review_json).read_text(encoding="utf-8")) if a.review_json else {}
    result=audit(metadata,review=review)
    print(json.dumps(result,indent=2,ensure_ascii=False))
    if not result["public_release_ready"]:
        raise SystemExit(2)


if __name__=="__main__":
    main()

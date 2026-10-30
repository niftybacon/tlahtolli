#!/usr/bin/env python3
"""Fail-closed registration and human-adjudicated scoring for private Gold evidence.

No online/historical-source access is claimed here. Gold labels and reviewer
identities MUST be supplied from independent, rights-cleared human review;
nothing in this repository fabricates them. Never check private Gold answers
into a public GitHub branch or train/tune on them.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
from urllib.parse import urlparse

from tools.prepare_silver_review import _human_identity

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "research/neural_training/brinton_1890_poetry_weak_en.jsonl"
PAIRS = ROOT / "research/translation_corpus/pairs.csv"
FORMAT = "tentli-independent-human-gold-benchmark-v1"
PREDICTIONS = "tentli-gold-blind-model-predictions-v1"
ADJUDICATIONS = "tentli-gold-independent-human-adjudications-v1"
# Crucial: a Brinton SONG cannot become blind Gold merely because a different
# Brinton song was held out for development. The entire printed collection
# has appeared in the model research. Group by edition/collection as well.
EXPOSED_COLLECTIONS = {
    "brinton-1890-ancient-nahuatl-poetry",
    "tentli-canonical-synthetic-grammar",
}
DECISIONS = {"faithful", "partial", "incorrect", "abstained"}


def _url(x: object) -> bool:
    if not isinstance(x, str):
        return False
    try:
        u = urlparse(x)
        return u.scheme == "https" and bool(u.hostname) and not u.username and not u.password
    except ValueError:
        return False


def _fingerprint(data: object) -> str:
    return hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()


def known_exposure(candidate_manifest: Path = CANDIDATES, pair_csv: Path = PAIRS) -> dict:
    collections = set(EXPOSED_COLLECTIONS)
    works = set()
    content = set()
    train = [json.loads(line) for line in candidate_manifest.read_text(encoding="utf-8").splitlines()
             if line.strip()]
    for row in train:
        collections.add("brinton-1890-ancient-nahuatl-poetry")
        works.add(row["work_id"])
        content.add(" ".join(row["original"].casefold().split()))
    with pair_csv.open("r", encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row.get("source_id"):
                works.add(row["source_id"])
            if row.get("split_group"):
                works.add(row["split_group"])
            if row.get("normalized_nahuatl"):
                content.add(" ".join(row["normalized_nahuatl"].casefold().split()))
    return {"collections": collections, "works": works, "normalized_content": content,
            "historical_candidate_records_considered": len(train)}


def validate_private_gold(data: dict, *, exposures: dict | None = None,
                          allow_empty: bool = False) -> dict:
    if not isinstance(data, dict) or data.get("format") != FORMAT:
        raise ValueError("Unknown Gold benchmark file schema")
    if data.get("labels_available_to_training") is not False or data.get("automatic_human_review") is not False:
        raise ValueError("Gold cannot be available to training or automatically reviewed")
    rows = data.get("examples")
    if not isinstance(rows, list):
        raise ValueError("Gold examples must be explicit, independently supplied records")
    if not rows and not allow_empty:
        raise ValueError("No independently human-reviewed Gold examples exist yet")
    exposure = exposures if exposures is not None else known_exposure()
    seen = set()
    source_texts = set()
    works = {}
    collections = set()
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ValueError("Gold record must be an object")
        rid, work, collection = row.get("gold_id"), row.get("work_id"), row.get("source_collection_id")
        if not all(isinstance(z, str) and z.strip() for z in (rid, work, collection)):
            raise ValueError("Gold record requires original, stable source work and collection IDs")
        if rid in seen or rid in exposure["works"]:
            raise ValueError("Duplicate or contaminated Gold identifier")
        seen.add(rid)
        if (collection in exposure["collections"] or work in exposure["works"] or
                "brinton" in collection.casefold() or "brinton" in work.casefold() or
                "synthetic" in collection.casefold() or "synthetic" in work.casefold()):
            raise ValueError("Gold requires a wholly unseen source collection and historical work")
        collections.add(collection)
        if work in works and works[work] != collection:
            raise ValueError("Same Gold work assigned to multiple source collections")
        works[work] = collection
        src, eng = row.get("nahuatl"), row.get("reviewed_english")
        if not isinstance(src, str) or not src.strip() or not isinstance(eng, str) or not eng.strip():
            raise ValueError("Gold requires separately reviewed Nahuatl and English content")
        norm = " ".join(src.casefold().split())
        if norm in exposure["normalized_content"] or norm in source_texts:
            raise ValueError("Gold input was already exposed or duplicated")
        source_texts.add(norm)
        if row.get("variety") != "Classical Nahuatl":
            raise ValueError("Gold must identify the Classical Nahuatl variety explicitly")
        if not (_url(row.get("source_url")) and _url(row.get("translation_source_url"))):
            raise ValueError("Gold requires exact source and reviewed translation provenance URLs")
        if row.get("source_rights") not in {"public_domain", "cc0", "cc_by_4_0", "permission_documented"} or row.get("english_rights") not in {"public_domain", "cc0", "cc_by_4_0", "permission_documented"}:
            raise ValueError("Gold source and English rights must both be independently cleared")
        if not all(isinstance(row.get(z), str) and len(row[z].strip()) >= 8
                   for z in ("folio_or_segment", "source_date", "historical_context_note",
                             "transcription_review_note", "translation_review_note")):
            raise ValueError("Gold requires source segment and independently written review notes")
        people = [row.get(k) for k in ("transcription_reviewed_by", "translation_reviewed_by")]
        if not all(_human_identity(x) for x in people) or len({p.casefold().strip() for p in people}) != 2:
            raise ValueError("Distinct named source and English reviewers are mandatory")
        if (row.get("model_predictions_seen_before_reference_freeze") is not False or
                row.get("training_eligible") is not False or row.get("blind_holdout") is not True):
            raise ValueError("Gold must be frozen independently before predictions or training")
        if row.get("transcription_verified") is not True or row.get("semantic_translation_verified") is not True:
            raise ValueError("Both text and translation require affirmative human review")
    summary = {
        "format": "tentli-independent-gold-private-audit-v1",
        "gold_reviewed_examples": len(rows),
        "gold_heldout_collections": len(collections),
        "gold_heldout_works": len(works),
        "previously_exposed_historical_candidate_records": exposure["historical_candidate_records_considered"],
        "labels_publicly_exported": False,
        "training_eligible": False,
        "independent_reviewer_expertise_machine_verified": False,
        "reference_content_sha256": _fingerprint(rows),
        "independent_gold_semantic_accuracy": None,
    }
    return summary


def wilson(success: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if not total:
        return (0.0, 0.0)
    n = total
    p = success / n
    denom = 1 + z*z/n
    center = (p + z*z/(2*n)) / denom
    spread = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n))/denom
    return max(0.0, center-spread), min(1.0, center+spread)


def score_blind(gold: dict, predictions: dict, adjudications: dict,
                *, min_gold: int = 10, exposures: dict | None = None) -> dict:
    """All final meanings require independent human judgment, never exact string equality."""
    meta = validate_private_gold(gold, exposures=exposures)
    refs = {r["gold_id"]: r for r in gold["examples"]}
    if len(refs) < min_gold:
        raise ValueError("Cannot publish meaningful Gold accuracy from fewer reviewed examples")
    if (predictions.get("format") != PREDICTIONS or
            adjudications.get("format") != ADJUDICATIONS or
            predictions.get("gold_reference_sha256") != meta["reference_content_sha256"] or
            adjudications.get("gold_reference_sha256") != meta["reference_content_sha256"]):
        raise ValueError("Blind predictions/adjudications do not match sealed Gold reference")
    predicted, judgments = {}, {}
    for row in predictions.get("predictions", []):
        key = row.get("gold_id")
        if key not in refs or key in predicted:
            raise ValueError("Unknown or duplicate blind model prediction")
        if row.get("status") not in {"translation", "abstain"}:
            raise ValueError("Unknown model output category")
        if not isinstance(row.get("model_revision"), str) or len(row["model_revision"]) < 8:
            raise ValueError("Exact model revision required for audit")
        if row["status"] == "abstain" and row.get("english") is not None:
            raise ValueError("Abstain must not contain a guessed answer")
        if row["status"] == "translation" and (not isinstance(row.get("english"), str) or not row["english"].strip()):
            raise ValueError("Nonempty English required for a model translation")
        predicted[key] = row
    for row in adjudications.get("judgments", []):
        key = row.get("gold_id")
        if key not in refs or key in judgments:
            raise ValueError("Unknown or duplicate external human judgment")
        if row.get("decision") not in DECISIONS:
            raise ValueError("A real independent semantic judgment is required")
        ref = refs[key]
        human = row.get("adjudicator")
        if (not _human_identity(human) or
            human.strip().casefold() in {
                ref["transcription_reviewed_by"].strip().casefold(),
                ref["translation_reviewed_by"].strip().casefold()
            }):
            raise ValueError("Adjudicator must be independent of both Gold reference reviewers")
        if not isinstance(row.get("semantic_rationale"), str) or len(row["semantic_rationale"].strip()) < 30:
            raise ValueError("Meaning, person, tense, negation and omissions require a rationale")
        judgments[key] = row
    if set(predicted) != set(refs) or set(judgments) != set(refs):
        raise ValueError("Predictions and human judgments must cover every sealed Gold example")
    counts = {label: 0 for label in sorted(DECISIONS)}
    for key, prediction in predicted.items():
        decision = judgments[key]["decision"]
        if (prediction["status"] == "abstain") != (decision == "abstained"):
            raise ValueError("Human abstention category must match model's actual abstention")
        counts[decision] += 1
    n = len(refs)
    lo, hi = wilson(counts["faithful"], n)
    return {
        "format": "tentli-independent-gold-scored-v1",
        "evaluated_gold_examples": n,
        "reference_sha256": meta["reference_content_sha256"],
        "adjudication_counts": counts,
        "strict_faithful_rate": round(counts["faithful"]/n, 6),
        "approximate_95pct_wilson_interval": [round(lo, 6), round(hi, 6)],
        "model_abstention_rate": round(counts["abstained"]/n, 6),
        "reference_labels_logged": False,
        "training_eligible": False,
        "score_requires_human_judgment": True,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--private-gold", type=Path, help="Private independently reviewed dataset (never commit)")
    ap.add_argument("--predictions", type=Path)
    ap.add_argument("--judgments", type=Path)
    ap.add_argument("--min-gold", type=int, default=10)
    args = ap.parse_args()
    if not args.private_gold:
        print(json.dumps({
            "status": "no_real_gold_supplied",
            "registered_gold": 0,
            "accuracy": None,
            "action": "Obtain independently reviewed, rights-cleared untouched historical work before evaluation"
        }, indent=2))
        return
    gold = json.loads(args.private_gold.read_text(encoding="utf-8"))
    if bool(args.predictions) != bool(args.judgments):
        ap.error("Predictions and independently human-adjudicated judgments must be provided together")
    if args.predictions:
        preds = json.loads(args.predictions.read_text(encoding="utf-8"))
        decisions = json.loads(args.judgments.read_text(encoding="utf-8"))
        out = score_blind(gold, preds, decisions, min_gold=args.min_gold)
    else:
        out = validate_private_gold(gold)
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

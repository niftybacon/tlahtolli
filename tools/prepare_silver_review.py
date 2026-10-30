#!/usr/bin/env python3
"""Build a human-review worksheet for printed Brinton Nahuatl–English candidates.

SOURCE-FIDELITY != SEMANTIC TRUTH. This module NEVER promotes a candidate to
approved pairs.csv, Silver or Gold by itself. A separately signed human
review may validate *eligibility for proposed Silver*, but the canonical
approved corpus remains an independent editorial gate.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlparse

from neural.historical_evidence_prioritizer import CANDIDATES, prioritize

FORMAT = "tentli-brinton-silver-human-review-packet-v1"
ASSESSMENT_FORMAT = "tentli-independent-silver-review-assessment-v1"
BRINTON_COMMIT = "ab90a087b33d8c767caa867674dbf33e0cee084f"
EDITION_URL = (
    "https://github.com/GITenberg/"
    "Ancient-Nahuatl-Poetry-Containing-the-Nahuatl-Text-of-XXVII-"
    "Ancient-Mexican-Poems--13-Brinton__12219/blob/"
    f"{BRINTON_COMMIT}/12219.txt#L"
)
MANUSCRIPT_FACSIMILE_UNVERIFIED = "printed_1890_edition_only"


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")).hexdigest()


def packet(manifest: Path = CANDIDATES, *, limit: int = 40,
           per_work: int = 4) -> dict:
    """Turn 40 already chosen, TRAIN-only candidates into review worksheets."""
    candidates = [json.loads(s) for s in manifest.read_text(encoding="utf-8").splitlines()
                  if s.strip()]
    index = {row["record_id"]: row for row in candidates}
    if len(index) != len(candidates):
        raise ValueError("Duplicate Brinton candidate record IDs")
    priorities = prioritize(manifest, max_items=limit, per_work=per_work)
    reviews = []
    for lead in priorities["queue"]:
        row = index[lead["record_id"]]
        if row["split"] != "train" or row["translation"]["alignment"] != "candidate":
            raise ValueError("Review worksheet cannot ingest Gold or development materials")
        if row["source_url"] != lead["source_url"] or row["translation"]["source_url"] != lead["translation_url"]:
            raise ValueError("Candidate source pointers shifted since prioritization")
        if not row["source_url"].startswith(EDITION_URL) or not row["translation"]["source_url"].startswith(EDITION_URL):
            raise ValueError("Brinton research pointers must be pinned to original immutable edition")
        if row["rights"] != "public_domain" or row["translation"]["rights"] != "public_domain":
            raise ValueError("Original and editor English must separately carry documented reuse rights")
        canonical = {
            "record_id": row["record_id"],
            "work_id": row["work_id"],
            "source_url": row["source_url"],
            "translation_url": row["translation"]["source_url"],
            "nahuatl_as_printed": row["original"],
            "english_as_printed": row["translation"]["text"],
            "edition_blob_sha": row["source_blob_sha"],
        }
        reviews.append({
            **canonical,
            "canonical_source_fingerprint": digest(canonical),
            "review_flags": lead["review_flags"],
            "review_priority_not_confidence": lead["review_priority_not_confidence"],
            "source_collection_id": "brinton-1890-ancient-nahuatl-poetry",
            "manuscript_facsimile_status": MANUSCRIPT_FACSIMILE_UNVERIFIED,
            "printed_alignment_status": "candidate_editorial_numbered_stanza",
            "review_status": "pending_independent_contextual_human_review",
            "reviewed_translation_text": None,
            "transcription_reviewer": None,
            "translation_reviewer": None,
            "silver_approved": False,
            "gold": False,
            "training_eligible": False,
        })
    if not reviews or len(reviews) != limit:
        raise ValueError("Missing bounded, sourced human review cases")
    if len(set(x["record_id"] for x in reviews)) != len(reviews):
        raise ValueError("Duplicate source stanza in a review packet")
    return {
        "format": FORMAT,
        "provenance_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "work_limit": per_work,
        "printed_source_collection_id": "brinton-1890-ancient-nahuatl-poetry",
        "source_stanzas_count": len(candidates),
        "source_work_train_only": True,
        "heldout_dev_stanzas_excluded": sum(row["split"] == "dev" for row in candidates),
        "human_reviewed_silver_count": 0,
        "gold_count": 0,
        "automatically_approved_training_count": 0,
        "review_cases": reviews,
    }


def _valid_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    try:
        parsed = urlparse(value)
        return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password
    except ValueError:
        return False


def _human_identity(value: object) -> bool:
    if not isinstance(value, str):
        return False
    s = value.strip()
    banned = {"ai", "ai-only", "chatgpt", "gpt", "model", "bot", "unknown",
              "tbd", "pending", "none", "anonymous", "placeholder", "reviewer"}
    return bool(5 <= len(s) <= 160 and s.casefold() not in banned and
                not any(x in s.casefold() for x in ("automated", "language model", "ai-generated")))


def review_assessments(sheet: dict, assessments: dict) -> dict:
    """Validate supplied, independent human review claims; never silently approve.

    Requires manually prepared attestations. Checks *format and consistency*;
    independent reviewer expertise and manuscript fidelity remain human judgments.
    """
    if sheet.get("format") != FORMAT:
        raise ValueError("Historical Silver worksheet schema mismatch")
    if assessments.get("format") != ASSESSMENT_FORMAT or not isinstance(assessments.get("decisions"), list):
        raise ValueError("Independent Silver review decisions must use explicit schema")
    refs = {r["record_id"]: r for r in sheet["review_cases"]}
    if len(refs) != len(sheet["review_cases"]):
        raise ValueError("Duplicate review packet ID")
    decisions = assessments["decisions"]
    seen = set()
    eligible = 0
    declined = 0
    pending = len(refs)
    for item in decisions:
        if not isinstance(item, dict):
            raise ValueError("Malformed human review decision")
        ident = item.get("record_id")
        if ident not in refs or ident in seen:
            raise ValueError("Unknown or duplicate review decision")
        seen.add(ident)
        ref = refs[ident]
        if item.get("canonical_source_fingerprint") != ref["canonical_source_fingerprint"]:
            raise ValueError("Human decision source fingerprint changed; review invalid")
        status = item.get("decision")
        if status not in {"reviewed_silver_candidate", "reject_alignment", "needs_more_evidence"}:
            raise ValueError("Unrecognized Silver alignment decision")
        if item.get("gold") is not False or item.get("training_eligible") is not False:
            raise ValueError("Review decisions may not self-declare Gold or canonical train eligibility")
        if status == "needs_more_evidence":
            continue
        # Rejects require reasons; successful Silver claims require two
        # distinct named reviewing roles and actual textual judgment.
        details = item.get("alignment_notes")
        if not isinstance(details, str) or len(details.strip()) < 40:
            raise ValueError("Contextual source-language alignment explanation required")
        if status == "reject_alignment":
            declined += 1
            pending -= 1
            continue
        if item.get("alignment_scope") not in {"stanza_contextual", "clause", "phrase"}:
            raise ValueError("Reviewer must describe context-specific alignment scope")
        if not (item.get("original_collated_against_print") is True and
                item.get("english_semantics_reviewed") is True):
            raise ValueError("Independent source and semantic review attestations required")
        transcriber = item.get("transcription_reviewer")
        translator = item.get("translation_reviewer")
        if not _human_identity(transcriber) or not _human_identity(translator) or transcriber.strip().casefold() == translator.strip().casefold():
            raise ValueError("Distinct, individually named, non-AI human reviewers required")
        translated = item.get("reviewed_english")
        if not isinstance(translated, str) or not 1 <= len(translated.strip()) <= 3000:
            raise ValueError("Approved-for-consideration Silver requires reviewed English wording")
        if not isinstance(item.get("transcription_notes"), str) or len(item["transcription_notes"].strip()) < 20:
            raise ValueError("Transcript comparison observations required")
        if item.get("original_rights") not in {"public_domain", "cc0", "cc_by_4_0", "permission_documented"} or item.get("translation_rights") not in {"public_domain", "cc0", "cc_by_4_0", "permission_documented"}:
            raise ValueError("Both textual witnesses require documented rights")
        if not (_valid_url(item.get("review_source_url")) and _valid_url(item.get("review_translation_url"))):
            raise ValueError("Citation URLs for independent review required")
        if item.get("printed_editorial_translation_is_literal") not in {True, False}:
            raise ValueError("Reviewer must explicitly assess literalness of Brinton's English")
        if item.get("manuscript_facsimile_checked") not in {True, False}:
            raise ValueError("Manuscript comparison status must be explicit, not implied")
        eligible += 1
        pending -= 1
    return {
        "format": "tentli-silver-review-audit-v1",
        "human_attested_reviewed_silver_candidates": eligible,
        "alignment_rejections": declined,
        "review_decisions_pending": pending,
        "gold_examples_created": 0,
        "approved_pairs_csv_modified": False,
        "automatically_training_eligible": False,
        "independent_human_expertise_verified_by_software": False,
        "note": "Software verifies declared evidence fields only; editorial committee must inspect actual reviewer work before any promotion.",
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--manifest", type=Path, default=CANDIDATES)
    ap.add_argument("--limit", type=int, default=40)
    ap.add_argument("--max-per-work", type=int, default=4)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--decisions", type=Path, help="Optional manually supplied decisions; never promoted to approved pairs")
    args = ap.parse_args()
    sheet = packet(args.manifest, limit=args.limit, per_work=args.max_per_work)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(sheet, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    summary = {key: value for key, value in sheet.items() if key != "review_cases"}
    if args.decisions:
        reviews = json.loads(args.decisions.read_text(encoding="utf-8"))
        summary["manual_review_audit"] = review_assessments(sheet, reviews)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

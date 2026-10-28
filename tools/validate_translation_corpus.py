#!/usr/bin/env python3
"""Validate Stage 1 Tlahtōlli classical Nahuatl translation research corpus.
Never reclassifies historical candidates as model-training material.
"""
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "research" / "translation_corpus"
PAIRS = BASE / "pairs.csv"
EXAMPLES = BASE / "research_examples.json"
REQUIRED = (
    "pair_id", "source_id", "source_title", "source_url", "folio_or_segment",
    "source_date", "source_region", "nahuatl_variety", "original_orthography",
    "normalized_nahuatl", "translation_text", "translation_language",
    "translator_or_editor", "translation_source_url", "alignment_type",
    "original_rights", "translation_rights", "transcription_reviewed_by",
    "translation_reviewed_by", "review_status", "split_group", "split", "notes",
)
STATES = {
    "candidate", "permissions_checked", "transcribed", "aligned",
    "linguistically_reviewed", "approved",
}
SPLITS = {"", "train", "dev", "test"}
RIGHTS = {
    "public_domain", "cc0", "cc_by_4_0",
    "permission_documented",
}
VARIETIES = {"Classical Nahuatl", "Eastern Huasteca Nahuatl", "Western Huasteca Nahuatl",
             "Central Nahuatl", "Puebla Nahuatl", "Other", "unknown"}
URL_SCHEMES = {"http", "https"}


def valid_url(url):
    try:
        x = urlparse(url)
        return x.scheme in URL_SCHEMES and bool(x.netloc) and not x.username and not x.password
    except ValueError:
        return False


def check_records(path=PAIRS):
    errors = []
    counts = Counter()
    seen = set()
    groups = {}
    with open(path, "r", newline="", encoding="utf-8-sig") as fh:
        rd = csv.DictReader(fh)
        if rd.fieldnames is None or tuple(rd.fieldnames) != REQUIRED:
            return ["pairs.csv column names/order differ from the source-controlled schema"], counts
        for ln, row in enumerate(rd, 2):
            counts["total"] += 1
            if None in row:
                errors.append(f"line {ln}: too many columns")
            if any(row.get(k) is None for k in REQUIRED):
                errors.append(f"line {ln}: missing columns")
                continue
            sid = row["pair_id"].strip()
            if not sid or sid in seen:
                errors.append(f"line {ln}: missing or duplicated pair_id {sid!r}")
            seen.add(sid)
            state = row["review_status"].strip()
            if state not in STATES:
                errors.append(f"line {ln}: unexpected review_status {state!r}")
            var = row["nahuatl_variety"].strip()
            if var not in VARIETIES:
                errors.append(f"line {ln}: variety must be explicit, even if unknown")
            split = row["split"].strip()
            if split not in SPLITS:
                errors.append(f"line {ln}: invalid split {split!r}")
            group = row["split_group"].strip()
            if group and split:
                if group in groups and groups[group] != split:
                    errors.append(f"line {ln}: source group {group!r} leaked between {groups[group]} and {split}")
                groups[group] = split
            if state == "approved":
                counts["approved"] += 1
                required_text = (
                    "source_title", "folio_or_segment", "original_orthography",
                    "normalized_nahuatl", "translation_text", "translator_or_editor",
                    "source_date", "transcription_reviewed_by",
                    "translation_reviewed_by", "alignment_type", "split_group",
                )
                for key in required_text:
                    if not row[key].strip():
                        errors.append(f"line {ln}: approved pair lacks {key}")
                for key in ("source_url", "translation_source_url"):
                    if not valid_url(row[key]):
                        errors.append(f"line {ln}: approved pair needs a URL in {key}")
                if row["original_rights"].strip() not in RIGHTS:
                    errors.append(f"line {ln}: original text rights not independently cleared")
                if row["translation_rights"].strip() not in RIGHTS:
                    errors.append(f"line {ln}: translated text rights not independently cleared")
                if var != "Classical Nahuatl":
                    errors.append(f"line {ln}: only explicitly Classical Nahuatl records are in this approved training project")
                if not split:
                    errors.append(f"line {ln}: approved pair must have a document-grouped data split")
                if row["transcription_reviewed_by"].strip() == "AI-only" or row["translation_reviewed_by"].strip() == "AI-only":
                    errors.append(f"line {ln}: AI-only review cannot approve a training pair")
            else:
                counts["pending"] += 1
                if split:
                    errors.append(f"line {ln}: unapproved records cannot enter train/dev/test")
    return errors, counts


def check_examples(path=EXAMPLES):
    errors = []
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (ValueError, OSError) as exc:
        return [f"research_examples.json unavailable: {exc}"], 0
    if data.get("format") != "tlahtolli-translation-research-examples" or data.get("schema") != 1:
        errors.append("unrecognized research_examples format/version")
    entries = data.get("entries", [])
    if not isinstance(entries, list):
        return errors + ["entries must be an array"], 0
    seen = set()
    for i, e in enumerate(entries):
        if not isinstance(e, dict):
            errors.append(f"example {i}: expected object"); continue
        if not e.get("id") or e["id"] in seen:
            errors.append(f"example {i}: missing or duplicate ID")
        seen.add(e.get("id"))
        if e.get("train_eligible") is not False or e.get("review_status") == "approved":
            errors.append(f"example {i}: public interpretation candidate must never be marked training-ready")
        if not valid_url(e.get("source_url", "")):
            errors.append(f"example {i}: invalid source URL")
        for key in ("original", "normalized", "english_interpretation", "variety", "source_note"):
            if not isinstance(e.get(key), str) or not e[key].strip():
                errors.append(f"example {i}: missing {key}")
        if e.get("variety") != "Classical Nahuatl":
            errors.append(f"example {i}: wrong language variety")
    return errors, len(entries)


def main():
    errors, counts = check_records()
    ex_errors, total_examples = check_examples()
    errors += ex_errors
    print(f"Corpus: {counts['total']} aligned entries, {counts['approved']} approved, "
          f"{counts['pending']} not approved; {total_examples} display-only passage candidates.")
    if errors:
        for error in errors:
            print("ERROR: " + error, file=sys.stderr)
        return 1
    print("Validation passed. No data was modified or automatically approved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

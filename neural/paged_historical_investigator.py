"""Paged, complete historic written-form evidence scanning; no weekly 40 ceiling.

Scans *all* unique Brinton TRAIN written forms (not development/Gold) and
explicit primary-edition review leads. Builds each archival index once,
supports resumable pages via validated prior source-fingerprinted reports,
and does not convert any research match into a certified English meaning.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

from .canonical_lexical_coverage import (
    ROOT, MANIFEST, LEXICON, EVIDENCE, WITNESSES, source_claims, witness_forms,
    build_lookup, clean, tokens,
)
from .autonomous_evidence_investigator import ARCHIVE, FEEDBACK, build_indexes, load_feedback
from .primary_source_context import examine as old_contexts
from .multidocument_evidence import inspect_documents, CATALOG as MULTIDOC
from .primary_source_context import CATALOG as PRIMARY

FORMAT = "tentli-paged-historical-evidence-batch-v1"


def filehash(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def evidence_fingerprints(manifest: Path = MANIFEST) -> dict:
    # Hash actual archived source rows, not merely the manifest. This prevents
    # resuming on stale lexical evidence after silent row-level source edits.
    archive_manifest=json.loads((ARCHIVE / "manifest.json").read_text(encoding="utf-8"))
    source_files={}
    for family in ("simeon","kaikki"):
        for name in archive_manifest[family]["files"]:
            if not name.startswith(family+"_") or "/" in name or "\\" in name:
                raise ValueError("Unsafe source file name in archival provenance")
            source_files[name]=filehash(ARCHIVE / name)
    return {
        "individual_archived_lexical_source_sha256": source_files,
        "historical_brinton_train_dev_manifest": filehash(manifest),
        "canonical_lexicon": filehash(LEXICON),
        "source_checked_claims": filehash(EVIDENCE),
        "witness_atlas": filehash(WITNESSES),
        "archive_manifest": filehash(ARCHIVE / "manifest.json"),
        "original_context_registry": filehash(PRIMARY),
        "added_historical_documents": filehash(MULTIDOC),
        "project_director_observations": filehash(FEEDBACK),
    }


def candidate_worklist(manifest: Path = MANIFEST) -> tuple[list[dict], list[dict], dict]:
    samples = [json.loads(ln) for ln in manifest.read_text(encoding="utf-8").splitlines()
               if ln.strip()]
    if len({x["record_id"] for x in samples}) != len(samples):
        raise ValueError("Duplicate historical records")
    if any(x["split"] not in {"train", "dev"} for x in samples):
        raise ValueError("Gold/test sources must never enter the research investigator")
    if any(x["translation"]["alignment"] != "candidate" for x in samples):
        raise ValueError("Unexpected reviewed/Gold labels in weak candidate corpus")
    lex = json.loads(LEXICON.read_text(encoding="utf-8"))
    evid = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    refs = json.loads(WITNESSES.read_text(encoding="utf-8"))
    looked = build_lookup(source_claims(lex, evid),
                          witness_forms(refs, source_claims(lex, evid)))
    counts = Counter()
    works = defaultdict(set)
    locations = defaultdict(list)
    for row in samples:
        if row["split"] != "train":
            continue
        for word in tokens(row["original"]):
            counts[word] += 1
            works[word].add(row["work_id"])
            if len(locations[word]) < 3 and not any(x["record_id"] == row["record_id"]
                                                    for x in locations[word]):
                locations[word].append({
                    "record_id": row["record_id"],
                    "work_id": row["work_id"],
                    "printed_historical_source_url": row["source_url"],
                })
    contexts = old_contexts(live=False)["investigations"] + inspect_documents(live=False)["contexts"]
    forms_in_context = {}
    for c in contexts:
        form = clean(c["form"])
        forms_in_context.setdefault(form, []).append({
            "original_work_id": c.get("work_id") or c.get("primary_collection_id"),
            "source_url": c["source_url"],
            "source_grade": "short_original_edition_context_not_independent_english_translation",
            "context_id": c.get("id") or c.get("probe_id"),
        })
    feedback = load_feedback(FEEDBACK, candidates=samples)
    # Include forms from newly read primary editions even if absent from Brinton.
    # Brinton frequencies (NOT translation meaning) prioritize the worklist.
    forms = set(counts) | set(forms_in_context) | set(feedback)
    proposals = []
    for form in forms:
        proposals.append({
            "written_surface": form,
            "historical_training_token_occurrences": counts[form],
            "historical_train_work_count": len(works[form]),
            "historic_brinton_source_examples": locations[form],
            "individually_cited_early_canonical_match": bool(looked.get(form)),
            "original_edition_contexts": forms_in_context.get(form, []),
            "project_director_feedback_present": form in feedback,
            "historically_verified_whole_clause_translation": False,
            "automatically_certified_meaning": False,
        })
    proposals.sort(key=lambda p: (
        -int(p["project_director_feedback_present"]),
        -int(bool(p["original_edition_contexts"])),
        -p["historical_train_work_count"],
        -p["historical_training_token_occurrences"],
        p["written_surface"],
    ))
    return proposals, samples, looked


def run(*, batch_size: int = 200, offset: int = 0, all_forms: bool = False,
        previous: Path | None = None, manifest: Path = MANIFEST) -> dict:
    if not 1 <= batch_size <= 1000 or offset < 0:
        raise ValueError("Batch must be 1..1000; offset must be nonnegative")
    fingerprints = evidence_fingerprints(manifest)
    proposals, samples, checked = candidate_worklist(manifest)
    candidate_count = len(proposals)
    previously_seen: set[str] = set()
    source_by_form={p["written_surface"]:p for p in proposals}
    if previous:
        past = json.loads(previous.read_text(encoding="utf-8"))
        if (past.get("format") != FORMAT or
            past.get("evidence_fingerprints") != fingerprints):
            raise ValueError("Prior audit evidence changed or report is from a different dataset; recompute")
        old_rows = past.get("investigations")
        if not isinstance(old_rows, list):
            raise ValueError("Prior audit lacks original investigative records")
        if past.get("processed_form_count") != len(old_rows) or past.get("distinct_written_forms_available") != candidate_count:
            raise ValueError("Prior research report count is inconsistent with current corpus")
        for row in old_rows:
            form = row.get("written_surface")
            if not isinstance(form, str) or not form or form in previously_seen:
                raise ValueError("Tampered or duplicate prior investigation")
            if row.get("gold") is not False or row.get("training_eligible") is not False:
                raise ValueError("Prior output attempted Gold/training upgrade")
            original=source_by_form.get(form)
            if original is None or any(row.get(k)!=v for k,v in original.items()):
                raise ValueError("Prior report is not traceable to the same original source contexts")
            previously_seen.add(form)
        if not previously_seen.issubset({p["written_surface"] for p in proposals}):
            raise ValueError("Previous audit contains forms outside the current source")
    remaining = [p for p in proposals if p["written_surface"] not in previously_seen]
    selected = remaining[offset:] if all_forms else remaining[offset:offset + batch_size]
    archive, archival_stats = build_indexes()
    primary_contexts = old_contexts(live=False)["investigations"]
    new_contexts = inspect_documents(live=False)["contexts"]
    contexts = defaultdict(list)
    for item in primary_contexts + new_contexts:
        contexts[clean(item["form"])].append(item)
    results = []
    family_counts = Counter()
    human_escalations = []
    for candidate in selected:
        word = candidate["written_surface"]
        sim = archive["simeon"].get(word, [])[:2]
        kaik = archive["kaikki"].get(word, [])[:2]
        category = ("both" if sim and kaik else "simeon_only" if sim
                    else "kaikki_only" if kaik else "neither")
        family_counts[category] += 1
        observed_pos = {x["pos_as_recorded"].casefold() for x in sim+kaik
                        if x["pos_as_recorded"] and
                        x["pos_as_recorded"].casefold() not in {"unknown", "other"}}
        escalated = (len(observed_pos) > 1 or
                     candidate["project_director_feedback_present"] or
                     (not (sim or kaik or checked.get(word)) and
                      candidate["historical_train_work_count"] >= 3))
        if escalated:
            human_escalations.append(word)
        results.append({
            **candidate,
            "source_families_exact_headword_matched": category,
            "historical_dictionary_1885_unreviewed_OCR": sim,
            "kaikki_nci_community_index": kaik,
            "canonical_source_checked_exact_form": checked.get(word, [])[:2],
            "human_contextual_review_priority": escalated,
            "contextual_primary_edition_evidence": contexts.get(word, []),
            "cross_language_semantic_agreement": None,
            "historically_verified_whole_clause_translation": False,
            "gold": False, "silver_approved": False, "training_eligible": False,
            "canonical_lexicon_modified": False,
        })
    if len({x["written_surface"] for x in results}) != len(results):
        raise ValueError("Duplicate form in research output")
    return {
        "format": FORMAT, "evidence_fingerprints": fingerprints,
        "distinct_written_forms_available": candidate_count,
        "already_examined_from_prior_same_source_revision": len(previously_seen),
        "batch_offset": offset,
        "batch_limit": None if all_forms else batch_size,
        "processed_form_count": len(results),
        "remaining_distinct_forms_after_this_batch": max(
            0, len(remaining) - offset - len(results)),
        "historical_train_stanzas": sum(r["split"] == "train" for r in samples),
        "historical_dev_stanzas_excluded": sum(r["split"] == "dev" for r in samples),
        "distinct_original_document_edition_works_in_source_registers": len({
            c["source_url"] for c in primary_contexts + new_contexts}),
        "archived_source_records_indexed": archival_stats["simeon_total"] + archival_stats["kaikki_total"],
        "source_family_hits": dict(family_counts),
        "human_context_review_proposals": len(human_escalations),
        "human_context_review_top_20": human_escalations[:20],
        "human_silver_added": 0, "gold_added": 0,
        "automatic_lexical_sense_certifications": 0,
        "model_updated": False, "dictionary_updated": False,
        "investigations": results,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--batch-size", type=int, default=200)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--all", action="store_true", help="Inspect all remaining forms, no fixed 40 ceiling")
    ap.add_argument("--previous", type=Path, help="Skip exact forms already investigated with identical input hashes")
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    report = run(batch_size=args.batch_size, offset=args.offset,
                 all_forms=args.all, previous=args.previous)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k!="investigations"}, indent=2))


if __name__ == "__main__":
    main()

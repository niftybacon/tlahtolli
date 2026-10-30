"""Tēntli Phase 5: append-only, tamper-evident editorial research decisions.

NOT a trainer, dictionary writer, authority for Gold/Silver, or attestation
certifier. Events record declarations only. Manual PR/code/source review is
required for every actual engine or lexical promotion.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from neural.correction_queue import SCHEMA as PENDING_SCHEMA, stage, read_queue, _valid_url

SCHEMA = "tentli-evidence-decision-ledger-v1"
GENESIS = "0" * 64
DECISIONS = frozenset({"needs_more_evidence", "reject_candidate", "source_supported_hypothesis"})
FORBIDDEN = frozenset({"train_eligible", "approved_gold", "approved_silver", "model_weights_updated"})
REPOSITORY_PR = re.compile(r"https://github\.com/niftybacon/tlahtolli/pull/[1-9][0-9]*$")
COMMIT = re.compile(r"[a-f0-9]{40}$")
FILE = re.compile(r"(?:[a-zA-Z0-9_.-]+/)*[a-zA-Z0-9_.-]+$")
MAX_EVENTS = 20000
MAX_ITEMS = 10000

def _canonical(obj: dict) -> str:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False)

def _require(test: bool, message: str) -> None:
    if not test:
        raise ValueError(message)

def _digest(prev: str, body: dict) -> str:
    return hashlib.sha256((prev + "\n" + _canonical(body)).encode("utf-8")).hexdigest()

def _bounded(s, label, size=3000) -> str:
    _require(isinstance(s, str) and bool(s.strip()) and len(s) <= size and
             not any(ord(c) < 32 and c not in "\r\n\t" for c in s),
             "Invalid or unbounded " + label)
    return s.strip()

def _safe_path(value: str) -> bool:
    return isinstance(value, str) and len(value) <= 160 and bool(FILE.fullmatch(value)) and ".." not in value.split("/")

def _proposal_row(row):
    """Recalculate exact canonical pending correction; reject fabricated fields."""
    _require(isinstance(row, dict) and row.get("schema") == PENDING_SCHEMA,
             "Proposal must be a real staged correction")
    _require(row.get("review_status") == "pending_human_review" and
             row.get("train_eligible") is False and row.get("gold_translation") is False,
             "Staged correction is not an approval")
    raw = {
        "source_text": row.get("source_text"),
        "source_url": row.get("source_url"),
        "work_id": row.get("work_id"),
        "engine_commit": row.get("engine_commit"),
        "failure_category": row.get("failure_category"),
        "user_suggested_english": row.get("suggested_english_unverified"),
        "failure_note": row.get("failure_note"),
        "nahuatl_variety": row.get("nahuatl_variety"),
    }
    try:
        expected = stage(raw)
    except (TypeError, ValueError, KeyError) as exc:
        raise ValueError("Invalid canonical pending correction") from exc
    _require(row == expected, "Pending correction fingerprint or evidence flags were modified")
    return expected

def _event_payload(kind, proposal_id, data, records):
    _require(kind in {"proposal", "review_note", "implementation_report"},
             "Unknown event kind")
    _require(isinstance(proposal_id, str) and proposal_id.startswith("pending-") and
             re.fullmatch(r"pending-[a-f0-9]{20}", proposal_id) is not None,
             "Invalid pending proposal identifier")
    _require(isinstance(data, dict) and not FORBIDDEN.intersection(data),
             "Event cannot contain promotion or training authorization")
    if kind == "proposal":
        _require(set(data) == {"pending"}, "Proposal requires exact pending snapshot")
        pending = _proposal_row(data["pending"])
        _require(pending["id"] == proposal_id, "Proposal ID does not match source fingerprint")
        _require(proposal_id not in records, "Duplicate proposal cannot create new evidence")
        return
    _require(proposal_id in records, "Review or implementation has no prior proposal")
    current = records[proposal_id]
    pending = current["pending"]
    _require(data.get("source_fingerprint") == pending["fingerprint"],
             "Source fingerprint mismatch; original text or work changed")
    if kind == "review_note":
        _require(set(data) == {"source_fingerprint", "decision", "reviewer_name",
                              "rationale", "evidence_urls", "rights_assessment"},
                 "Review note schema mismatch")
        _require(data["decision"] in DECISIONS, "Invalid review decision")
        _bounded(data["reviewer_name"], "editor declaration", 120)
        _bounded(data["rationale"], "review rationale", 3000)
        _require(data["rights_assessment"] in {"unknown", "restricted", "declared_usable_for_research"},
                 "Rights declarations may not automatically authorize training")
        urls = data["evidence_urls"]
        _require(isinstance(urls, list) and 1 <= len(urls) <= 12 and
                 len(urls) == len(set(urls)) and all(isinstance(u, str) and
                  len(u) <= 400 and _valid_url(u) for u in urls),
                 "Review needs distinct bounded evidence URLs")
        _require(not current["implemented"], "Review after implementation requires a new follow-up proposal")
    else:
        _require(set(data) == {"source_fingerprint", "implementation_pr",
                              "engine_commit", "changed_paths", "regression_tests",
                              "outcome_note", "measured_diagnostic"},
                 "Implementation report schema mismatch")
        _require(current["last_decision"] == "source_supported_hypothesis",
                 "Implementation requires a preceding source-supported hypothesis declaration")
        _require(not current["implemented"], "One implementation report per proposal")
        _require(isinstance(data["implementation_pr"], str) and
                 REPOSITORY_PR.fullmatch(data["implementation_pr"]) is not None,
                 "Implementation requires a Tlahtōlli PR URL")
        _require(isinstance(data["engine_commit"], str) and
                 COMMIT.fullmatch(data["engine_commit"]) is not None,
                 "Implementation requires exact commit SHA")
        for key in ("changed_paths", "regression_tests"):
            paths = data[key]
            _require(isinstance(paths, list) and 1 <= len(paths) <= 40 and
                     len(paths) == len(set(paths)) and all(_safe_path(p) for p in paths),
                     "Implementation requires bounded repository " + key)
        _require(not any("pairs.csv" in p or "gold" in p.lower() for p in data["changed_paths"]),
                 "Review ledger cannot authorize Gold or bilingual training changes")
        _bounded(data["outcome_note"], "implementation outcome")
        _bounded(data["measured_diagnostic"], "measured development diagnostic")

def _replay(events):
    records = {}
    prev = GENESIS
    _require(len(events) <= MAX_EVENTS, "Ledger exceeds bounded event count")
    for n, event in enumerate(events, 1):
        _require(isinstance(event, dict) and set(event) ==
                 {"schema", "sequence", "previous_hash", "event_hash", "kind", "proposal_id", "data",
                  "train_eligible", "gold_translation", "automatically_promoted",
                  "independent_review_authenticated"},
                 f"Event {n}: unknown or missing keys")
        _require(event["schema"] == SCHEMA and event["sequence"] == n and
                 event["previous_hash"] == prev, f"Event {n}: broken sequence or chain")
        _require(event["train_eligible"] is False and event["gold_translation"] is False and
                 event["automatically_promoted"] is False and
                 event["independent_review_authenticated"] is False,
                 f"Event {n}: unsupported review or training promotion")
        body = {k:v for k,v in event.items() if k != "event_hash"}
        _require(event["event_hash"] == _digest(prev, body),
                 f"Event {n}: source/review event hash was altered")
        kind, identity, data = event["kind"],event["proposal_id"],event["data"]
        _event_payload(kind, identity, data, records)
        if kind == "proposal":
            records[identity] = {"pending": data["pending"], "last_decision": None,
                                 "review_count": 0, "implemented": False}
        elif kind == "review_note":
            records[identity]["last_decision"] = data["decision"]
            records[identity]["review_count"] += 1
        elif kind == "implementation_report":
            records[identity]["implemented"] = True
        _require(len(records) <= MAX_ITEMS, "Too many staged proposals")
        prev = event["event_hash"]
    return records, prev

def read_ledger(path: Path):
    if not path.exists():
        return [], {}, GENESIS
    lines = path.read_text(encoding="utf-8").splitlines()
    events = []
    for i, line in enumerate(lines, 1):
        _require(bool(line.strip()), f"Ledger line {i} is blank")
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Ledger line {i} invalid JSON") from exc
    records, head = _replay(events)
    return events, records, head

def append_event(path: Path, kind: str, proposal_id: str, data: dict, expected_head: str):
    """Optimistic concurrency guard + atomic replacement, never change existing events."""
    _require(isinstance(expected_head, str) and re.fullmatch(r"[0-9a-f]{64}",expected_head) is not None,
             "Required valid expected ledger head")
    events, records, head = read_ledger(path)
    _require(expected_head == head, "Ledger has advanced; reconcile other agent changes first")
    _event_payload(kind, proposal_id, data, records)
    body = {"schema":SCHEMA, "sequence":len(events)+1, "previous_hash":head,
            "kind":kind, "proposal_id":proposal_id, "data":data,
            "train_eligible":False, "gold_translation":False,
            "automatically_promoted":False, "independent_review_authenticated":False}
    event = {**body, "event_hash":_digest(head, body)}
    new_events = [*events, event]
    _replay(new_events)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Local write is atomic; GitHub PR merging still requires standard source control review.
    encoded = "".join(_canonical(e)+"\n" for e in new_events)
    fd, temp = tempfile.mkstemp(dir=path.parent,prefix=".tentli-review-ledger-",text=True)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as f:
            f.write(encoded)
            f.flush()
            os.fsync(f.fileno())
        # Optimistic check immediately before replacement. Separate agents must
        # still reconcile concurrent PR branches; filesystem locks are not claimed.
        _require(read_ledger(path)[2] == expected_head,
                 "Concurrent ledger change detected before commit")
        os.replace(temp,path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
    return event

def summarize(path: Path):
    events, records, head = read_ledger(path)
    status = Counter()
    for item in records.values():
        name = ("implementation_reported_not_verified" if item["implemented"] else
                item["last_decision"] or "pending_review")
        status[name] += 1
    return {
        "schema":"tentli-evidence-ledger-summary-v1",
        "head_hash":head,"events":len(events),"distinct_proposals":len(records),
        "by_declaration_status":dict(sorted(status.items())),
        "approved_silver":0,"approved_gold":0,"training_pairs_created":0,
        "canonical_engine_changes_automatically_applied":0,
        "independent_human_reviewer_identity_verified":False,
        "next_action":"Source review and explicit code PR; implementation reports are not proof of test success."
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("report","import-pending","review","implementation"))
    parser.add_argument("--ledger", type=Path, default=Path("research/translation_corpus/review_ledger.jsonl"))
    parser.add_argument("--queue", type=Path,help="Read existing staged corrections only")
    parser.add_argument("--proposal-id")
    parser.add_argument("--input",type=Path,help="JSON with review/implementation declaration")
    parser.add_argument("--expected-head", help="Copy exact head_hash from report; required for every write")
    args=parser.parse_args()
    if args.action=="report":
        print(json.dumps(summarize(args.ledger),ensure_ascii=False,indent=2))
        return
    if not args.expected_head:
        parser.error("Writes require --expected-head from the current report")
    if args.action=="import-pending":
        if not args.queue:
            parser.error("import-pending requires --queue")
        staged=read_queue(args.queue)
        event_count=0
        current=args.expected_head
        for row in staged:
            _, records, head=read_ledger(args.ledger)
            _require(current==head, "Ledger head changed during import")
            if row["id"] in records:
                _require(records[row["id"]]["pending"]==row,
                         "Existing proposal differs from original pending input")
                continue
            current=append_event(args.ledger,"proposal",row["id"],{"pending":row},current)["event_hash"]
            event_count+=1
        print(json.dumps({"imported":event_count,**summarize(args.ledger)},ensure_ascii=False,indent=2))
        return
    if not args.input or not args.proposal_id:
        parser.error("review and implementation require --input and --proposal-id")
    payload=json.loads(args.input.read_text(encoding="utf-8"))
    event=append_event(args.ledger,
                       "review_note" if args.action=="review" else "implementation_report",
                       args.proposal_id,payload,args.expected_head)
    print(json.dumps({"appended_kind":event["kind"],**summarize(args.ledger)},ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()

"""Persistent, opt-in, PENDING translation correction intake.

This queue is NOT training data and is never accepted as historical
evidence automatically. One user vote, AI output, or repeated attempt
never counts as an approved bilingual pair. The existing
research/translation_corpus/pairs.csv remains the ONLY reviewed source.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlparse

SCHEMA="tentli-unreviewed-correction-v1"
ISSUES={"lexicon","morphology","english_composition","syntax",
        "semantic","orthography","discourse","input_limit","other"}
MAX_EXAMPLES=15000
PRIORITY_THRESHOLD=40


def _valid_url(value:str)->bool:
    try:
        u=urlparse(value)
        return u.scheme in {"http","https"} and bool(u.hostname) and not (u.username or u.password)
    except ValueError:
        return False


def stage(data:dict)->dict:
    """Prepare a persistent candidate, never approve it."""
    if not isinstance(data,dict):
        raise ValueError("Feedback must be a JSON object")
    required=("source_text","source_url","work_id","engine_commit",
              "failure_category","user_suggested_english","failure_note")
    for key in required:
        val=data.get(key)
        if not isinstance(val,str) or not val.strip() or len(val)>3000:
            raise ValueError(f"Required bounded feedback field: {key}")
    if data["failure_category"] not in ISSUES:
        raise ValueError("Unknown failure type")
    if not _valid_url(data["source_url"]):
        raise ValueError("A real historical source URL is required")
    if not re.fullmatch(r"[a-f0-9]{7,40}",data["engine_commit"]):
        raise ValueError("Exact source engine revision required")
    if data.get("nahuatl_variety")!="Classical Nahuatl":
        raise ValueError("Classical-only queue; do not silently mix modern varieties")
    text=data["source_text"].strip()
    english=data["user_suggested_english"].strip()
    if any(ord(c)<32 and c not in "\r\n\t" for c in text+english):
        raise ValueError("Control characters in feedback text")
    fingerprint=hashlib.sha256(("\0".join([data["work_id"],text])).encode("utf-8")).hexdigest()
    if data.get("train_eligible") or data.get("approved") or data.get("gold_translation"):
        raise ValueError("Staged corrections can never claim training or gold status")
    return {
        "schema":SCHEMA,
        "id":"pending-"+fingerprint[:20],
        "source_text":text,
        "source_url":data["source_url"],
        "work_id":data["work_id"].strip(),
        "nahuatl_variety":"Classical Nahuatl",
        "engine_commit":data["engine_commit"],
        "failure_category":data["failure_category"],
        "suggested_english_unverified":english,
        "failure_note":data["failure_note"].strip(),
        "fingerprint":fingerprint,
        "review_status":"pending_human_review",
        "train_eligible":False,
        "gold_translation":False,
        "rights":"unknown",
        "needs_manuscript_confirmation":True,
    }


def read_queue(path:Path)->list[dict]:
    if not path.exists():
        return []
    rows=[];seen=set()
    for i,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
        if not line.strip():continue
        try:
            obj=json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Queue line {i} has malformed JSON: {exc}") from exc
        if obj.get("schema")!=SCHEMA or obj.get("review_status")!="pending_human_review" or obj.get("train_eligible") is not False or obj.get("gold_translation") is not False:
            raise ValueError(f"Queue line {i} illegally claims review or training eligibility")
        required=("source_text","source_url","work_id","engine_commit","failure_category","suggested_english_unverified","fingerprint","id")
        if any(not isinstance(obj.get(k),str) or not obj[k].strip() for k in required):
            raise ValueError(f"Queue line {i} incomplete")
        if obj["failure_category"] not in ISSUES or not _valid_url(obj["source_url"]):
            raise ValueError(f"Queue line {i} invalid source/problem")
        fp=hashlib.sha256((obj["work_id"]+"\0"+obj["source_text"]).encode()).hexdigest()
        if obj["fingerprint"]!=fp or obj["id"]!="pending-"+fp[:20]:
            raise ValueError(f"Queue line {i} source fingerprint changed")
        if obj["id"] in seen:
            raise ValueError(f"Queue line {i} duplicates an input instead of creating independent evidence")
        seen.add(obj["id"])
        rows.append(obj)
    if len(rows)>MAX_EXAMPLES:raise ValueError("Correction queue exceeds bounded capacity")
    return rows


def append_pending(queue:Path,data:dict)->dict:
    item=stage(data)
    prior=read_queue(queue)
    if any(x["id"]==item["id"] for x in prior):
        raise ValueError("Identical historical input already staged; repeated feedback is not new evidence")
    queue.parent.mkdir(parents=True,exist_ok=True)
    with queue.open("a",encoding="utf-8") as file:
        file.write(json.dumps(item,ensure_ascii=False,sort_keys=True)+"\n")
    return item


def summarize(queue:Path,threshold:int=PRIORITY_THRESHOLD)->dict:
    if not 1<=threshold<=10000:raise ValueError("Invalid recurring problem threshold")
    rows=read_queue(queue)
    by_issue=Counter(r["failure_category"] for r in rows)
    by_work=Counter(r["work_id"] for r in rows)
    groups=Counter((r["failure_category"],r["work_id"]) for r in rows)
    recurring=[{"failure_category":category,"work_id":work,
                "distinct_attested_inputs":n,"priority":"research_queue",
                "automatically_fixable":False} for (category,work),n in groups.items() if n>=threshold]
    recurring.sort(key=lambda r:(-r["distinct_attested_inputs"],r["work_id"],r["failure_category"]))
    return {
        "format":"tentli-pending-feedback-aggregate-v1",
        "total_distinct_inputs":len(rows),
        "pending_human_review":len(rows),
        "approved_training_pairs_from_queue":0,
        "failure_categories":dict(sorted(by_issue.items())),
        "source_work_counts":dict(sorted(by_work.items())),
        "threshold":threshold,
        "recurring_problems":recurring,
        "autonomous_training_or_promotion":False,
        "next_action":"Review evidence, resolve grammatical issue, add test, and only then consider an approved pair in existing pairs.csv"
    }


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("action",choices=("stage","report"))
    ap.add_argument("--queue",type=Path,default=Path("research/translation_corpus/correction_queue.jsonl"))
    ap.add_argument("--input",type=Path,help="JSON object, reviewed by user before any public repository commit")
    ap.add_argument("--threshold",type=int,default=40)
    a=ap.parse_args()
    if a.action=="stage":
        if not a.input:ap.error("stage requires --input")
        print(json.dumps(append_pending(a.queue,json.loads(a.input.read_text(encoding="utf-8"))),ensure_ascii=False,indent=2))
    else:
        print(json.dumps(summarize(a.queue,a.threshold),ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()

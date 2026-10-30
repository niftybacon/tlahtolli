"""Finite, source-graded synthetic-English practice using existing grammar teacher.

NOT historical gold. NOT review-approved corrections. Every pair comes
from the already established, source-linked canonical teacher export.
Hold out ALL forms of some verb lemmas; never claim manuscript accuracy.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

from .teacher import load_teacher
from .train_reviewed_english import fit_adapter

ROOT=Path(__file__).resolve().parents[1]


def teacher_curriculum(manifest:Path)->dict[str,list[dict]]:
    teacher,ledger=load_teacher(manifest,root=ROOT)
    pack=json.loads((ROOT/"paradigms.json").read_text(encoding="utf-8"))
    mappings=defaultdict(set)
    for lemma,paradigm in pack["paradigms"].items():
        for row in paradigm["cells"]:
            for written in row:
                mappings[written].add(lemma)
    by_lemma=defaultdict(list)
    seen=set()
    for item in teacher:
        if item.task!="translate" or item.grade!="grammar-composed-English":
            continue
        written=item.input.removeprefix("ahmo ").strip()
        lemmas=mappings.get(written,set())
        if len(lemmas)!=1:
            continue
        lemma=next(iter(lemmas))
        key=(item.input,item.target)
        if key in seen:raise ValueError("Duplicate English grammar teacher pair")
        seen.add(key)
        if not item.source_urls or any(not x.startswith("https://") for x in item.source_urls):
            raise ValueError("Grammar teacher has no original source evidence")
        by_lemma[lemma].append({
            "id":"synthetic-"+hashlib.sha256((item.input+"\0"+item.target).encode()).hexdigest()[:16],
            "source":item.input,"target":item.target,
            "work":"synthetic-lexical-lemma-"+lemma,
            "source_url":item.source_urls[0],
            "evidence_grade":"synthetic_source_gated_grammar_not_manuscript",
        })
    lemmas=sorted(by_lemma)
    if len(lemmas)<3 or sum(len(x) for x in by_lemma.values())<8:
        raise ValueError("Insufficient independent grammar-teacher lexical groups: "+repr({x:len(y) for x,y in sorted(by_lemma.items())}))
    # Completely withhold entire lemma paradigms. This is a SYNTHETIC
    # generalization control, not a blind historical work-level gold test.
    holdout=set(lemmas[-max(1,len(lemmas)//5):])
    rows={"train":[],"dev":[],"test":[]}
    for lemma in lemmas:
        rows["dev" if lemma in holdout else "train"].extend(by_lemma[lemma])
    if not rows["train"] or not rows["dev"]:
        raise ValueError("No lexeme-disjoint synthetic train/dev split")
    return rows


def practice(manifest:Path,output:Path,*,steps:int=24)->dict:
    rows=teacher_curriculum(manifest)
    fingerprint=hashlib.sha256(manifest.read_bytes()).hexdigest()
    result=fit_adapter(rows,output,max_steps=steps,learning_rate=0.0003,
                       evidence_tier="synthetic_grammar_teacher",
                       source_fingerprint=fingerprint)
    result["human_reviewed_training_examples"]=0
    result["synthetic_grammar_examples"]=len(rows["train"])
    result["historically_attested_sentence_translations_added"]=0
    result["accuracy"]=None
    (output/"research_metadata.json").write_text(
        json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return result


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--teacher-manifest",type=Path,required=True)
    ap.add_argument("--output",type=Path)
    ap.add_argument("--steps",type=int,default=24)
    ap.add_argument("--audit-only",action="store_true")
    a=ap.parse_args()
    if a.audit_only:
        rows=teacher_curriculum(a.teacher_manifest)
        print(json.dumps({"training_synthetic":len(rows["train"]),
                          "dev_synthetic":len(rows["dev"]),
                          "heldout_lemmas":len({r["work"] for r in rows["dev"]}),
                          "reviewed_historical_gold":0,
                          "weights_updated":False},indent=2))
        return
    if not a.output:ap.error("--output required for private adapter")
    print(json.dumps(practice(a.teacher_manifest,a.output,steps=a.steps),
                     indent=2,ensure_ascii=False))


if __name__=="__main__":
    main()

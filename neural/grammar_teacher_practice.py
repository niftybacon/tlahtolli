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
    metadata=json.loads(Path(str(manifest)+".meta.json").read_text(encoding="utf-8"))
    by_lemma=defaultdict(list)
    seen=set()

    if metadata.get("format")=="tentli-source-grammar-english-practice-v1":
        if metadata.get("human_reviewed") is not False or metadata.get("historical_gold")!=0:
            raise ValueError("Synthetic curriculum attempted to claim human review")
        for path,digest in metadata.get("source_sha256",{}).items():
            if path.startswith("/") or ".." in Path(path).parts:
                raise ValueError("Unsafe synthetic source hash path")
            expected=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
            if digest!=expected:
                raise ValueError(f"Canonical grammar source changed after teacher export: {path}")
        if len(metadata.get("source_sha256",{}))<7:
            raise ValueError("Synthetic source hash ledger is incomplete")
        lines=[json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
        if len(lines)!=metadata.get("examples"):
            raise ValueError("Incomplete synthetic teacher source manifest")
        for row in lines:
            if (row.get("training_status")!="synthetic_teacher_only_not_historical_gold" or
                row.get("human_reviewed") is not False or
                row.get("historically_attested_sentence") is not False or
                row.get("evidence_grade")!="editorial_grammar_not_independently_reviewed"):
                raise ValueError("Synthetic teacher row improperly claims historical truth")
            if not row.get("source_urls") or any(not x.startswith("https://") for x in row["source_urls"]):
                raise ValueError("Source-grammatical English teacher lacks scholarly locators")
            lemma=row.get("lemma")
            if not isinstance(lemma,str) or row.get("work")!="synthetic-lemma-"+lemma:
                raise ValueError("Source teacher lemma and work group mismatch")
            source,target=row.get("source"),row.get("target")
            if not isinstance(source,str) or not isinstance(target,str) or not source or not target:
                raise ValueError("Empty synthetic source/English")
            key=(source,target)
            if key in seen:
                raise ValueError("Repeated synthetic grammar pair")
            seen.add(key)
            by_lemma[lemma].append({
                "id":"synthetic-"+hashlib.sha256((source+"\\0"+target).encode()).hexdigest()[:16],
                "source":source,"target":target,"work":"synthetic-lemma-"+lemma,
                "source_url":row["source_urls"][0],
                "evidence_grade":"synthetic_grammar_proposal_not_historical_review",
                "alternative_english_count":row["alternative_english_count"],
                "example_weight":0.15 if row["alternative_english_count"]>1 else 0.6,
            })
    else:
        # The older teacher exported only unambiguous English choices.
        # It is allowed if sufficiently diverse, but cannot pretend the
        # old 24 'tlacuā' forms generalize to unseen verbal lemmas.
        teacher,ledger=load_teacher(manifest,root=ROOT)
        pack=json.loads((ROOT/"paradigms.json").read_text(encoding="utf-8"))
        mappings=defaultdict(set)
        for lemma,paradigm in pack["paradigms"].items():
            for row in paradigm["cells"]:
                for written in row:
                    mappings[written].add(lemma)
        for item in teacher:
            if item.task!="translate" or item.grade!="grammar-composed-English":
                continue
            written=item.input.removeprefix("ahmo ").strip()
            lemmas=mappings.get(written,set())
            if len(lemmas)!=1:continue
            lemma=next(iter(lemmas))
            if not item.source_urls or any(not x.startswith("https://") for x in item.source_urls):
                raise ValueError("Grammar teacher missing original citations")
            key=(item.input,item.target)
            if key in seen:raise ValueError("Repeated teacher source example")
            seen.add(key)
            by_lemma[lemma].append({
                "id":"synthetic-"+hashlib.sha256((item.input+"\\0"+item.target).encode()).hexdigest()[:16],
                "source":item.input,"target":item.target,
                "work":"synthetic-lemma-"+lemma,
                "source_url":item.source_urls[0],
                "evidence_grade":"synthetic_grammar_proposal_not_historical_review",
                "alternative_english_count":1,
                "example_weight":0.2,
            })
    lemmas=sorted(k for k,v in by_lemma.items() if v)
    if len(lemmas)<3 or sum(len(x) for x in by_lemma.values())<8:
        raise ValueError("Insufficient independent grammar-teacher lexical groups: "+repr({x:len(y) for x,y in sorted(by_lemma.items())}))
    # Hold out whole lexical paradigms. Still a synthetic study,
    # NOT an independently reviewed historical manuscript benchmark.
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
    result["ambiguous_synthetic_training_examples"]=sum(r["alternative_english_count"]>1 for r in rows["train"])
    result["ambiguous_synthetic_weight"]=0.15
    result["unambiguous_synthetic_weight"]=0.6
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

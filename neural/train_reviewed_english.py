"""Supervised, review-gated adaptation of the PRETRAINED English decoder.

The existing translation_corpus/pairs.csv is the ONLY human-reviewed
parallel authority. Non-approved feedback, monolingual historical
corpora, grammar-teacher synthetic examples and unaligned ENL pointers
are never silently converted into English translation labels.

Run only after at least one approved train and one independently
document-grouped approved dev pair exist. Never update the production
model automatically, and never claim accuracy from training loss.
"""
from __future__ import annotations
import argparse
from collections import Counter
import csv
import hashlib
import json
from pathlib import Path
import random
import sys

from .pretrained_english import MODEL_ID,MODEL_REVISION


def load_reviewed_pairs(path:Path)->dict[str,list[dict]]:
    from tools.validate_translation_corpus import check_records
    errors,counts=check_records(path)
    if errors:
        raise ValueError("Existing source-rights/review corpus validator rejected data: "+
                         " | ".join(errors[:8]))
    result={"train":[],"dev":[],"test":[]}
    seen_english=set()
    groups={}
    with path.open(encoding="utf-8-sig",newline="") as file:
        for row in csv.DictReader(file):
            if row["review_status"]!="approved":continue
            if row["nahuatl_variety"]!="Classical Nahuatl" or row["translation_language"]!="en":
                continue
            group=row["split_group"].strip()
            split=row["split"]
            if split not in result:
                raise ValueError("Approved English example needs an explicit split")
            if group in groups and groups[group]!=split:
                raise ValueError("A historical source work leaked across splits")
            groups[group]=split
            original=row["original_orthography"].strip()
            normalized=row["normalized_nahuatl"].strip()
            eng=row["translation_text"].strip()
            if not original or not normalized or not eng:
                raise ValueError("Approved pair has empty source or English")
            key=" ".join(normalized.casefold().split())
            if key in seen_english:
                raise ValueError("Same Nahuatl content appears in multiple reviewed rows")
            seen_english.add(key)
            if row["transcription_reviewed_by"].strip()==row["translation_reviewed_by"].strip():
                # This is a policy for the adaptation job, not a claim that
                # string identity proves independent linguistic expertise.
                raise ValueError("Training requires distinct named transcription and translation review roles")
            result[split].append({
                "id":row["pair_id"],"source":normalized,"target":eng,
                "work":group,"source_url":row["source_url"],
                "rights_source":row["original_rights"],
                "rights_target":row["translation_rights"],
                "review":"existing_corpus_validator_approved_not_self_verified"
            })
    if not result["train"] or not result["dev"]:
        raise ValueError(
            f"Need APPROVED, document-disjoint English train+dev pairs; "
            f"found {len(result['train'])} train, {len(result['dev'])} dev. "
            "The public corpus currently contains zero approved pairs. "
            "Do not fabricate supervision or train on unreviewed feedback.")
    if {x["work"] for x in result["train"]}&{x["work"] for x in result["dev"]}:
        raise ValueError("Historical document-level train/dev contamination")
    return result


def source_prompt(nahuatl:str)->str:
    # Properly reviewed bilingual target; not an independent grammar guess.
    return ("Translate Classical Nahuatl into English. Preserve every "
            "argument, negation, number and tense.\nNahuatl: "+
            nahuatl+"\nEnglish:")


def _encode_pairs(rows:list[dict],tokenizer,max_source:int,max_target:int):
    for row in rows:
        src=tokenizer(source_prompt(row["source"]),return_tensors="pt",truncation=False)
        tgt=tokenizer(row["target"],return_tensors="pt",truncation=False)
        if src["input_ids"].shape[1]>max_source or tgt["input_ids"].shape[1]>max_target:
            raise ValueError("Reviewed bilingual pair exceeds tokenizer bound; needs manual alignment")
        yield row,src,tgt["input_ids"]


def fit_adapter(rows:dict[str,list[dict]],output:Path,*,max_steps:int,
                learning_rate:float=0.0003,seed:int=19,
                evidence_tier:str,source_fingerprint:str)->dict:
    """One actual optimizer shared by strictly segregated evidence tiers."""
    if evidence_tier not in {"human_reviewed_bilingual","synthetic_grammar_teacher"}:
        raise ValueError("Unknown supervised learning tier")
    if not 1<=max_steps<=2000 or not 0<learning_rate<=0.002:
        raise ValueError("Bounded adaptation requires 1..2000 steps and safe learning rate")
    if not rows.get("train") or not rows.get("dev"):
        raise ValueError("Supervised adaptation requires train and dev data")
    train_works={r["work"] for r in rows["train"]}
    dev_works={r["work"] for r in rows["dev"]}
    if train_works & dev_works:
        raise ValueError("Grammatical or historical source group train/dev contamination")
    import torch
    from peft import LoraConfig,TaskType,get_peft_model
    from transformers import AutoTokenizer,AutoModelForSeq2SeqLM

    torch.manual_seed(seed)
    random.seed(seed)
    torch.set_num_threads(min(4,torch.get_num_threads()))
    tokenizer=AutoTokenizer.from_pretrained(MODEL_ID,revision=MODEL_REVISION,trust_remote_code=False)
    base=AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_ID,revision=MODEL_REVISION,trust_remote_code=False)
    lora=LoraConfig(r=4,lora_alpha=8,lora_dropout=0,
                    target_modules=["q","v"],bias="none",
                    task_type=TaskType.SEQ_2_SEQ_LM)
    model=get_peft_model(base,lora)
    model.train()
    train=list(_encode_pairs(rows["train"],tokenizer,256,128))
    dev=list(_encode_pairs(rows["dev"],tokenizer,256,128))
    def evaluate()->float:
        model.eval()
        with torch.inference_mode():
            values=[float(model(**source,labels=target).loss.item())
                    for _,source,target in dev]
        model.train()
        return sum(values)/len(values)

    before=evaluate()
    optimizer=torch.optim.AdamW((p for p in model.parameters() if p.requires_grad),
                                lr=learning_rate)
    rng=random.Random(seed)
    actual=0
    for step in range(max_steps):
        record,src,target=rng.choice(train)
        weight=record.get("example_weight",1.0)
        if not isinstance(weight,(int,float)) or not 0<weight<=1:
            raise ValueError("Invalid supervised example evidence weight")
        if evidence_tier=="human_reviewed_bilingual" and weight!=1:
            raise ValueError("Human-reviewed supervision weight was silently downgraded")
        optimizer.zero_grad(set_to_none=True)
        loss=model(**src,labels=target).loss * weight
        if not torch.isfinite(loss):
            raise ValueError("Nonfinite supervised loss")
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(),1.0)
        optimizer.step()
        actual+=1
    after=evaluate()
    output.mkdir(parents=True,exist_ok=True)
    model.save_pretrained(output)
    report={
        "format":"tentli-english-supervision-lora-v1",
        "evidence_tier":evidence_tier,
        "base_model":MODEL_ID,"revision":MODEL_REVISION,
        "base_license":"Apache-2.0",
        "training_rows":len(train),"development_rows":len(dev),
        "test_rows_not_used":len(rows.get("test",[])),
        "train_work_ids":sorted(train_works),
        "dev_work_ids":sorted(dev_works),
        "source_manifest_sha256":source_fingerprint,
        "actual_optimizer_steps":actual,
        "synthetic_ambiguous_train_records":sum(
            r.get("alternative_english_count",1)>1 for r in rows["train"])
            if evidence_tier=="synthetic_grammar_teacher" else 0,
        "dev_teacher_forced_loss_before":round(before,6),
        "dev_teacher_forced_loss_after":round(after,6),
        "automatically_approved_for_public_translation":False,
        "independent_translation_accuracy":None,
        "claim":(
            "Reviewed historical English pairs require independent human verification and full permissions"
            if evidence_tier=="human_reviewed_bilingual" else
            "Synthetic canonical teacher practice, NOT historical English translations or independent gold"),
    }
    (output/"research_metadata.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report


def supervised_adapt(pairs:Path,output:Path,*,max_steps:int=80,
                     learning_rate:float=0.0003,seed:int=19)->dict:
    rows=load_reviewed_pairs(pairs)
    return fit_adapter(rows,output,max_steps=max_steps,
        learning_rate=learning_rate,seed=seed,
        evidence_tier="human_reviewed_bilingual",
        source_fingerprint=hashlib.sha256(pairs.read_bytes()).hexdigest())

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--pairs",type=Path,default=Path("research/translation_corpus/pairs.csv"))
    ap.add_argument("--output",type=Path)
    ap.add_argument("--steps",type=int,default=80)
    ap.add_argument("--audit-only",action="store_true")
    a=ap.parse_args()
    if a.audit_only:
        from tools.validate_translation_corpus import check_records
        err,c=check_records(a.pairs)
        if err:raise ValueError("; ".join(err))
        print(json.dumps({"approved":c["approved"],"training_started":False,
                          "requires_distinct_reviewed_train_and_dev":True}))
        return
    if not a.output:ap.error("Training requires --output (private local artifact directory)")
    result=supervised_adapt(a.pairs,a.output,max_steps=a.steps)
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()

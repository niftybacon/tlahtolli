#!/usr/bin/env python3
"""Run the ACTUAL historical-trained neural weights on fixed source/grammar probes.

This is a diagnostic/probe. Previously examined ENL anchors and software
grammar references are NOT blind gold. Never turn these into a translation
accuracy score or upgrade tentative anchors into training evidence.
"""
from __future__ import annotations
import argparse
from difflib import SequenceMatcher
import hashlib
import json
from pathlib import Path
import re
import time

import torch
from neural.model import TentliNeural
from neural.infer import infer

ROOT=Path(__file__).resolve().parents[1]
GRAMMAR_PROBES=[
 ("G01","nichōca","I cry."),
 ("G02","nitlacua","I eat."),
 ("G03","niquitta in cihuātl","I see the woman."),
 ("G04","ahmo niquittaz in cihuātl","I will not see the woman."),
 ("G05","niquitta in cihuātl in chōca","I see the woman that cries."),
 ("G06","chōca in cihuātl","The woman cries."),
 ("G07","nichōca auh nitlacua","I cry. I eat."),
 ("G08","chōca in cihuātl. chōca","The woman cries. He / she / it cries."),
]
SPANISH_PROBES=[
 ("ES01","nichōca"),
 ("ES02","nitlacua"),
 ("ES03","niquitta in cihuātl"),
 ("ES04","niquitta in cihuātl in chōca"),
 ("ES05","Yn tehuantin pipiltin"),
]
ANALYSIS_PROBES=["nichōca","niquitta","nitlacua","nimitztlazohtla"]


def load_model(folder:Path):
    meta=json.loads((folder/"metadata.json").read_text(encoding="utf-8"))
    if meta["format"]!="tentli-experimental-neural-v1" or meta["model_config"]["width"]!=48:
        raise ValueError("Unknown/unapproved historical neural research checkpoint")
    weights=(folder/meta["weights_filename"]).read_bytes()
    model=TentliNeural(**meta["model_config"])
    state=torch.load(folder/meta["weights_filename"],map_location="cpu",weights_only=True)
    model.load_state_dict(state,strict=True)
    model.eval()
    return model,meta,hashlib.sha256(weights).hexdigest()


def text_stats(output:str,reference:str|None):
    d={
        "utf8_replacement_characters":output.count("\ufffd"),
        "visible_characters":len(output),
        "latin_letters":len(re.findall(r"[A-Za-z]",output)),
        "empty":not bool(output.strip())
    }
    if reference is not None:
        # Diagnostic only: compares surface strings; cannot establish
        # linguistic adequacy, accepted translation, or human accuracy.
        a=" ".join(output.lower().split())
        b=" ".join(reference.lower().split())
        d["exact_reference_string"]=a==b
        d["character_similarity_exploratory"]=round(SequenceMatcher(None,a,b).ratio(),4)
    return d


def benchmark(early:Path,latest:Path,output:Path,*,generate_limit:int=72):
    if not 8<=generate_limit<=128:
        raise ValueError("Invalid fixed generation budget")
    torch.set_num_threads(1)
    before,before_meta,before_sha=load_model(early)
    after,meta,after_sha=load_model(latest)
    if before_sha==after_sha or before_meta["steps"]!=480 or meta["steps"]!=1800:
        raise ValueError("Cannot establish old-vs-new genuinely distinct trained checkpoint lineage")
    if meta.get("trained_translation_examples",0)<4000 or meta.get("initialization")!="teacher-distilled":
        raise ValueError("No actual prior bilingual source lineage")
    if meta["independent_translation_accuracy"] is not None:
        raise ValueError("Checkpoint claims independent translation accuracy without human gold")

    anchors=json.loads((ROOT/"research/translation_corpus/enl_parallel_alignment_pointers.json").read_text(encoding="utf-8"))
    if anchors["anchor_count"]!=7 or any(r.get("gold_translation") or r.get("train_eligible") for r in anchors["rows"]):
        raise ValueError("Previously seen ENL anchors cannot be reclassified as gold or training")
    probes=[{
        "id":id,"source":src,"reference":eng,
        "group":"software_constructed_development",
        "reference_status":"existing_software_teacher_not_historical_gold",
    } for id,src,eng in GRAMMAR_PROBES]
    probes += [{
        "id":row["id"],"source":row["nahuatl_anchor"],
        "reference":row["english_anchor"],
        "group":"enl_short_edited_anchor_development",
        "reference_status":"already_inspected_alignment_and_rights_unreviewed_not_blind_gold",
        "url":row["url"],"work":row["work"]
    } for row in anchors["rows"]]
    probes += [{
        "id":"NEG01","source":"asfdghjk xyzwe","reference":None,
        "group":"out_of_domain_negative",
        "reference_status":"synthetic_non_Nahuatl"
    },{
        "id":"NEG02","source":"xyzzy","reference":None,
        "group":"out_of_domain_negative",
        "reference_status":"synthetic_non_Nahuatl"
    }]

    t0=time.monotonic()
    results=[]
    for probe in probes:
        source=probe["source"]
        old=before.generate(source,task="translate",limit=generate_limit)
        new=after.generate(source,task="translate",limit=generate_limit)
        results.append({**probe,
            "old_neural_en":old,"latest_neural_en":new,
            "old_output_diagnostic":text_stats(old,probe["reference"]),
            "new_output_diagnostic":text_stats(new,probe["reference"])
        })
        print("RAW_EN_PROBE",json.dumps({"id":probe["id"],"source":source,
            "reference":probe["reference"],"old":old,"latest":new},ensure_ascii=False),flush=True)

    spanish=[]
    for id,source in SPANISH_PROBES:
        early_out=before.generate("es: "+source,task="translate",limit=generate_limit)
        later_out=after.generate("es: "+source,task="translate",limit=generate_limit)
        spanish.append({"id":id,"source":source,"old_neural_es":early_out,
                        "latest_neural_es":later_out,
                        "reference":None,"status":"qualitative_language_output_only_no_gold"})
        print("RAW_ES_PROBE",json.dumps(spanish[-1],ensure_ascii=False),flush=True)

    analyses=[]
    for source in ANALYSIS_PROBES:
        result=after.generate(source,task="analyze",limit=generate_limit)
        analyses.append({"source":source,"neural_analysis_proposal":result,
                         "status":"unverified_not_canonical_parse"})
        print("RAW_ANALYSIS_PROBE",json.dumps(analyses[-1],ensure_ascii=False),flush=True)

    reconstruction=[]
    for source in ("nichōca auh nitlacua","Yn tehuantin pipiltin"):
        result=after.generate(source,task="denoise",limit=generate_limit)
        reconstruction.append({"source":source,"neural_undamaged_reconstruction":result,
                               "warning":"denoising training masks source bytes; uncorrupted-input generation is a related but different task"})
        print("RAW_RECONSTRUCTION_PROBE",json.dumps(reconstruction[-1],ensure_ascii=False),flush=True)

    # The normal public infer() wrapper blocks Spanish on inherited checkpoints
    # because source_inventory counts ONLY this final monolingual stage, not
    # cumulative older Spanish training. Record the bug honestly; do NOT
    # mutate weights/metadata or silently claim user-facing Spanish works.
    try:
        spanish_ui=infer(str(latest),"nichōca",task="translate",target_language="es")
        spanish_guard={"status":"accepted","output":spanish_ui["proposal"]}
    except ValueError as err:
        spanish_guard={"status":"blocked","reason":str(err)}
    print("SPANISH_INFER_API_GUARD",json.dumps(spanish_guard,ensure_ascii=False),flush=True)

    grammar=[r for r in results if r["group"]=="software_constructed_development"]
    source_anchors=[r for r in results if r["group"]=="enl_short_edited_anchor_development"]
    summary={
        "format":"tentli-actual-checkpoint-inference-probe-v1",
        "model_parameters":meta["trainable_parameters"],
        "generation_limit":generate_limit,
        "fixed_greedy_decoding":True,
        "model_before":{"run_id":40987019137,"sha256_weights":before_sha,"steps_last_stage":before_meta["steps"]},
        "model_after":{"run_id":40993235240,"sha256_weights":after_sha,"steps_last_stage":meta["steps"]},
        "english_software_probes":len(grammar),
        "enl_development_anchors_not_gold":len(source_anchors),
        "negative_controls":2,
        "spanish_unscored_probes":len(spanish),
        "analysis_unscored_probes":len(analyses),
        "denoising_unscored_probes":len(reconstruction),
        "grammar_exact_surface_matches_before":sum(r["old_output_diagnostic"]["exact_reference_string"] for r in grammar),
        "grammar_exact_surface_matches_after":sum(r["new_output_diagnostic"]["exact_reference_string"] for r in grammar),
        "enl_exact_anchor_surface_matches_before":sum(r["old_output_diagnostic"]["exact_reference_string"] for r in source_anchors),
        "enl_exact_anchor_surface_matches_after":sum(r["new_output_diagnostic"]["exact_reference_string"] for r in source_anchors),
        "translation_accuracy":None,
        "human_reviewed_test_count":0,
        "heldout_gold_count":0,
        "spanish_inference_api":spanish_guard,
        "elapsed_seconds":round(time.monotonic()-t0,2),
        "notes":[
            "Grammar references are software-constructed teacher data and were accessible to the prior training process.",
            "ENL anchors were previously consulted and not independently human sentence-aligned; they are not blind gold.",
            "Greedy decoder is byte-level and capped; a fluent-looking string would still need historical review.",
            "No BLEU/COMET/chrF translation accuracy is claimed from these probes.",
            "Training-source overlap is unresolved; earlier Brinton/Chimalpahin/Florentine/Axolotl data was not a true blind gold evaluation set.",
        ]
    }
    report={"summary":summary,"english_probes":results,
            "spanish_probes":spanish,"analysis_probes":analyses,
            "reconstruction_probes":reconstruction}
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("ACTUAL_NEURAL_INFERENCE_SUMMARY",json.dumps(summary,ensure_ascii=False),flush=True)
    return report


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before",required=True)
    parser.add_argument("--after",required=True)
    parser.add_argument("--output",required=True)
    parser.add_argument("--generation-limit",type=int,default=72)
    args=parser.parse_args()
    benchmark(Path(args.before),Path(args.after),Path(args.output),generate_limit=args.generation_limit)

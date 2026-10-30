"""Source-grammatical English and opt-in neural **candidate ranking**.

This tool never sends a raw neural generation to the user as a
translation. It executes the existing source-aware morphology,
sentence English composer, and grammar-IR audit through a read-only
Node bridge. PyTorch may score the *licensed candidate strings* using
conditional log likelihood, but cannot add words or meanings.

Usage:
 python -m neural.hybrid_infer --text "nichōca" --model-dir /tmp/real-weights
 python -m neural.hybrid_infer --text "nicochi" --model-dir /tmp/real-weights \
     --selection experimental-neural-ranked

No public model integration or translation-accuracy claim is implied.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path
import subprocess
import unicodedata

ROOT=Path(__file__).resolve().parents[1]
BRIDGE=ROOT/"tools"/"source_gated_english_bridge.js"
MAX_INPUT_CHARS=7000
MAX_CANDIDATES=32


def canonical_candidates(text: str,max_candidates:int=MAX_CANDIDATES)->dict:
    if not isinstance(text,str) or not text.strip() or len(text)>MAX_INPUT_CHARS:
        raise ValueError("Nonempty Nahuatl source of at most 7000 characters required")
    if not 1<=max_candidates<=64:
        raise ValueError("Invalid bounded candidate count")
    request=json.dumps({"text":text,"maxCandidates":max_candidates},ensure_ascii=False)
    completed=subprocess.run(
        ["node",str(BRIDGE)],input=request,text=True,encoding="utf-8",
        stdout=subprocess.PIPE,stderr=subprocess.PIPE,cwd=ROOT,
        timeout=25,check=False,
    )
    if completed.returncode:
        raise RuntimeError("Canonical source evidence engine failed: "+
                           completed.stderr[-1500:])
    obj=json.loads(completed.stdout)
    if obj.get("status") not in {"candidates","abstain"}:
        raise ValueError("Unknown canonical bridge result")
    if obj.get("verified_translation") is not False:
        raise ValueError("Canonical draft cannot claim human verification")
    if obj["status"]=="candidates":
        choices=obj.get("candidates")
        if not obj.get("grammar_complete") or not isinstance(choices,list) or not choices:
            raise ValueError("Missing full-coverage audited English candidates")
        if obj.get("canonical_draft")!=choices[0].get("english"):
            raise ValueError("Default grammatical draft does not match first candidate")
        for candidate in choices:
            if not candidate.get("english") or not candidate.get("source_urls"):
                raise ValueError("Unsourced grammatical English candidate")
            if candidate.get("grade")!="grammar_source_bounded_draft_not_manuscript_translation":
                raise ValueError("Forged evidence grade")
    elif obj.get("candidates") or obj.get("canonical_draft"):
        raise ValueError("Unsupported input must remain an abstention")
    return obj


def score_licensed_candidates(source:str, candidates:list[dict], model_dir:str)->dict:
    """Evaluate teacher-forced next-byte likelihood ONLY, never generate."""
    import torch
    from torch.nn import functional as F
    from .model import TentliNeural, inputs, targets
    from .model import VOCAB_SIZE
    torch.set_num_threads(1)
    folder=Path(model_dir)
    metadata=json.loads((folder/"metadata.json").read_text(encoding="utf-8"))
    if metadata.get("format")!="tentli-experimental-neural-v1":
        raise ValueError("Unknown neural model artifact")
    if not metadata.get("trained_translation_examples",0):
        raise ValueError("Checkpoint has no historical translation task lineage")
    cfg=metadata["model_config"]
    limit=cfg["max_bytes"]-2
    if len(unicodedata.normalize("NFC",source).encode("utf-8"))>limit:
        return {"status":"skipped_source_exceeds_neural_context",
                "max_source_utf8_bytes":limit,
                "reason":"Full Nahuatl source would be silently truncated by the old byte model"}
    model=TentliNeural(**cfg)
    model.load_state_dict(torch.load(folder/metadata["weights_filename"],weights_only=True,map_location="cpu"),
                          strict=True)
    model.eval()
    src=torch.tensor([inputs(source,"translate",cfg["max_bytes"])],dtype=torch.long)
    proposals=[]
    with torch.inference_mode():
        for candidate in candidates:
            english=candidate["english"]
            if len(unicodedata.normalize("NFC",english).encode("utf-8"))>limit:
                proposals.append({"english":english,"status":"skipped_target_exceeds_neural_context",
                                  "average_nll":None})
                continue
            tgt=torch.tensor([targets(english,cfg["max_bytes"])],dtype=torch.long)
            logits=model(src,tgt[:,:-1])
            scores=F.cross_entropy(logits.reshape(-1,VOCAB_SIZE),
                                   tgt[:,1:].reshape(-1),reduction="mean")
            loss=float(scores.item())
            if not math.isfinite(loss):raise ValueError("Nonfinite neural candidate score")
            proposals.append({"english":english,"status":"score_unvalidated",
                              "average_nll":round(loss,6)})
    ranked=sorted((p for p in proposals if p["average_nll"] is not None),
                  key=lambda x:x["average_nll"])
    return {"status":"scored_unvalidated","candidate_scores":proposals,
            "best_scored_english":ranked[0]["english"] if ranked else None,
            "max_source_utf8_bytes":limit,
            "warning":"Low neural loss is not semantic correctness, nor calibrated confidence."}


def infer_hybrid(text:str,model_dir:str|None=None, *,
                 selection:str="canonical",max_candidates:int=MAX_CANDIDATES)->dict:
    if selection not in {"canonical","experimental-neural-ranked"}:
        raise ValueError("Selection must be canonical or experimental-neural-ranked")
    if selection!="canonical" and not model_dir:
        raise ValueError("Neural-ranked selection needs an actual trained checkpoint")
    candidate_set=canonical_candidates(text,max_candidates=max_candidates)
    result={
        "format":"tentli-source-gated-english-hybrid-v1",
        "source_text":text,
        "status":candidate_set["status"],
        "translation_is_human_verified":False,
        "selection_policy":selection,
        "canonical_draft":candidate_set["canonical_draft"],
        "english":candidate_set["canonical_draft"],
        "candidates":candidate_set["candidates"],
        "source_engine":"unchanged_canonical_morphology_sentence_english_and_grammar_ir",
        "predicate_pack_available":candidate_set["predicate_pack_available"],
        "neural_free_generation_used":False,
        "neural": {"status":"not_requested"},
        "warning":"Editorial grammatical drafts, not verified Classical Nahuatl translations.",
    }
    if candidate_set["status"]=="abstain":
        result["english"]=None
        result["neural"]={"status":"not_scored_unsupported_grammar"}
        result["reason"]=candidate_set.get("reason")
        result["morphology_clues_not_translation"]=candidate_set.get("source_graded_morphology_only",[])
        return result
    # A purely editorial grammar option may not be silently transformed into
    # historical evidence even if the neural network strongly favors it.
    if model_dir is not None:
        score=score_licensed_candidates(candidate_set["source_text"],candidate_set["candidates"],model_dir)
        result["neural"]=score
        if (selection=="experimental-neural-ranked" and
            score["status"]=="scored_unvalidated" and
            candidate_set["candidates_exhaustive"] and
            score["best_scored_english"] is not None):
            approved={c["english"] for c in candidate_set["candidates"]}
            chosen=score["best_scored_english"]
            if chosen not in approved:
                raise ValueError("Neural ranking tried to escape grammatical candidate set")
            result["english"]=chosen
            result["selected_by_unvalidated_neural_score"]=True
            result["warning"]=(
                "Neural experimental ranking among pre-approved grammatical alternatives; "
                "NOT a translation-accuracy claim, nor a verified contextual sense.")
        else:
            result["selected_by_unvalidated_neural_score"]=False
    return result


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--text",required=True)
    ap.add_argument("--model-dir")
    ap.add_argument("--selection",choices=("canonical","experimental-neural-ranked"),default="canonical")
    ap.add_argument("--max-candidates",type=int,default=MAX_CANDIDATES)
    a=ap.parse_args()
    report=infer_hybrid(a.text,a.model_dir,selection=a.selection,max_candidates=a.max_candidates)
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=="__main__":
    main()

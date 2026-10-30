"""Optional PRETRAINED English realizer for source-backed Tēntli grammar.

The model already knows how to produce English from previous general
pretraining. It does NOT know Classical Nahuatl reliably and is NEVER
allowed to translate Nahuatl directly. The canonical morphology,
dictionary, sentence composer and grammar IR supply every admissible
English interpretation first. An unrestricted English rewrite is
rejected unless it exactly matches a source-audited candidate.

Model: google/flan-t5-small, Apache-2.0, pinned Hugging Face revision.
No model weights or web API keys are shipped in the repository.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .hybrid_infer import canonical_candidates

MODEL_ID = "google/flan-t5-small"
MODEL_REVISION = "10b5db0bd799e8f44ff8bf0b2b9407863033cbd2"
MODEL_LICENSE = "apache-2.0"
MAX_ENCODER_TOKENS = 384
MAX_NEW_TOKENS = 96


def candidate_key(text: str) -> str:
    # Only ignore invisible Unicode/spacing variations. Do NOT remove,
    # substitute, reorder, or add English lexical words or punctuation.
    return " ".join(unicodedata.normalize("NFC", text).split())


def approved_research_adapter(folder: Path) -> dict[str, Any]:
    """Validate local experimental adapter identity, NOT its historical accuracy."""
    path = folder / "research_metadata.json"
    if not path.is_file() or not (folder / "adapter_model.safetensors").is_file():
        raise ValueError("Missing private research adapter and provenance metadata")
    meta=json.loads(path.read_text(encoding="utf-8"))
    if (meta.get("format")!="tentli-english-supervision-lora-v1" or
        meta.get("evidence_tier") not in {"synthetic_grammar_teacher","human_reviewed_bilingual",
                                         "candidate_historical_bilingual"} or
        meta.get("base_model")!=MODEL_ID or meta.get("revision")!=MODEL_REVISION or
        meta.get("automatically_approved_for_public_translation") is not False or
        meta.get("independent_translation_accuracy") is not None or
        meta.get("actual_optimizer_steps",0)<1):
        raise ValueError("Untrusted adapter or missing evidence-grade research restrictions")
    if meta.get("evidence_tier") == "candidate_historical_bilingual":
        if (meta.get("candidate_historical_training_records",0)<1 or
            meta.get("candidate_translation_weight") != 0.15 or
            meta.get("weak_candidate_rights_validated") is not True or
            meta.get("human_reviewed_training_examples") != 0 or
            meta.get("gold_translation_examples") != 0 or
            meta.get("source_translation_quality_verified") is not False or
            meta.get("historical_semantic_accuracy") is not None or
            meta.get("historical_alignment_grade") != "published_interpretive_stanza_candidate"):
            raise ValueError("Weak historical candidate adapter lacks explicit non-gold evidence restrictions")
    return meta


@dataclass
class FlanEnglishDecoder:
    """Small pretrained English-capable seq2seq model; lazy optional dependency."""

    model_id: str = MODEL_ID
    revision: str = MODEL_REVISION
    local_files_only: bool = False
    adapter_path: str | None = None

    def __post_init__(self) -> None:
        # Do not load the larger model at all on an unsupported Nahuatl input.
        import torch
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id, revision=self.revision, trust_remote_code=False,
            local_files_only=self.local_files_only)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            self.model_id, revision=self.revision, trust_remote_code=False,
            local_files_only=self.local_files_only)
        self.adapter_metadata = None
        if self.adapter_path:
            metadata = approved_research_adapter(Path(self.adapter_path))
            from peft import PeftModel
            self.model = PeftModel.from_pretrained(
                self.model,str(self.adapter_path),is_trainable=False,
                local_files_only=True)
            self.adapter_metadata = metadata
        self.model.eval()
        torch.set_num_threads(min(torch.get_num_threads(), 4))

    def _generate(self, prompt: str) -> str:
        toks = self.tokenizer(prompt, return_tensors="pt", truncation=False)
        if toks["input_ids"].shape[1] > MAX_ENCODER_TOKENS:
            raise ValueError("Pretrained English input exceeds reviewed token limit; refusing truncation")
        import torch
        with torch.inference_mode():
            output = self.model.generate(
                **toks, max_new_tokens=MAX_NEW_TOKENS,
                num_beams=2, do_sample=False, early_stopping=True)
        return self.tokenizer.decode(output[0], skip_special_tokens=True).strip()

    def rewrite(self, canonical: str) -> str:
        # Pretrained English-only use; source-backed meaning supplied
        # by the canonical engine before this operation.
        return self._generate(
            "Rewrite this English sentence as clear, natural English. "
            "Preserve the exact meaning, arguments, tense, negation and "
            "number. Do not invent any facts. Return only the English sentence.\\n"
            "Sentence: "+canonical)

    def translate_reviewed_nahuatl(self, source: str) -> str:
        # The private LoRA is trained on an explicitly graded bilingual
        # Nahuatl -> English objective (reviewed, synthetic, or weak historical), not English-only rewriting.
        # This raw proposal is NEVER output unless the source grammar
        # independently admits EXACTLY the generated English.
        if self.adapter_metadata is None:
            raise ValueError("No supervised bilingual research adapter loaded")
        from .train_reviewed_english import source_prompt
        return self._generate(source_prompt(source))


def guarded_english_realization(
    source: str,
    *,
    rewrite: Callable[[str], str],
    max_candidates: int = 32,
    admitted: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Pure/testable candidate gate. Rewriter cannot invent lexical meaning.

    On unsupported grammar NO rewrite is invoked; this is important for
    avoiding hallucination and unnecessary model loading.
    """
    parsed = admitted if admitted is not None else canonical_candidates(source,max_candidates)
    baseline = parsed.get("canonical_draft")
    if parsed.get("status") != "candidates":
        return {
            "status":"abstain","english":None,"canonical_draft":None,
            "pretrained_used":False,"model_proposal":None,
            "source_grammar_status":parsed.get("status"),
            "reason":parsed.get("reason","Source grammar does not license a complete English reading"),
            "verified_translation":False,
        }
    choices = parsed.get("candidates")
    if not parsed.get("grammar_complete") or not isinstance(choices,list) or not choices:
        raise ValueError("No complete source-licensed English alternatives")
    if baseline != choices[0].get("english"):
        raise ValueError("Canonical baseline differs from first audited alternative")
    for candidate in choices:
        if (not candidate.get("source_urls") or
            candidate.get("grade") != "grammar_source_bounded_draft_not_manuscript_translation"):
            raise ValueError("Ungrounded English candidate")
    proposal = rewrite(baseline)
    if not isinstance(proposal,str):
        raise ValueError("Pretrained English proposal must be a string")
    proposed_key=candidate_key(proposal)
    allowed={candidate_key(x["english"]): x["english"] for x in choices}
    chosen=allowed.get(proposed_key)
    # Even a fluent English proposal outside the audited options is
    # UNTRUSTED. Return the full canonical reading instead of guessing.
    return {
        "status":"candidate_accepted" if chosen is not None else "rewrite_rejected",
        "english":chosen if chosen is not None else baseline,
        "canonical_draft":baseline,
        "pretrained_used":True,
        "model_proposal":proposal,
        "model_suggestion_is_verified":False,
        "model_proposal_accepted":chosen is not None,
        "candidate_count":len(choices),
        "source_grammar_status":"candidates",
        "verified_translation":False,
        "reason":("The proposal is exactly an already source-audited English alternative."
                  if chosen is not None else
                  "Proposed English differs from every audited alternative; kept the canonical draft."),
    }


def pretrained_english(source: str, *,
                       model_id: str=MODEL_ID, revision: str=MODEL_REVISION,
                       local_files_only: bool=False,adapter_dir:str|None=None,
                       decoder: FlanEnglishDecoder | None=None)->dict[str,Any]:
    candidate_set=canonical_candidates(source)
    if candidate_set["status"]!="candidates":
        return guarded_english_realization(source,rewrite=lambda _: "",admitted=candidate_set)
    if model_id != MODEL_ID or revision != MODEL_REVISION:
        raise ValueError("Unreviewed English decoder model or revision")
    engine=decoder if decoder is not None else FlanEnglishDecoder(
        model_id=model_id,revision=revision,local_files_only=local_files_only,
        adapter_path=adapter_dir)
    rewrite=(lambda _: engine.translate_reviewed_nahuatl(source)) if adapter_dir else engine.rewrite
    result=guarded_english_realization(source,rewrite=rewrite,admitted=candidate_set)
    result["pretrained_model"]={
        "repository":MODEL_ID,"revision":MODEL_REVISION,"license":MODEL_LICENSE,
        "adapter_evidence_tier":getattr(engine,"adapter_metadata",None) and engine.adapter_metadata["evidence_tier"],
        "generation_task":"supervised_nahuatl_to_english_gated" if adapter_dir else "pretrained_english_rewrite_gated",
        "claim":"pretrained English expression; NOT pretrained Classical Nahuatl translation"
    }
    return result


def main()->None:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--text",required=True)
    p.add_argument("--local-files-only",action="store_true")
    p.add_argument("--adapter-dir",help="Optional PRIVATE research LoRA adapter with checked provenance, never automatically published")
    a=p.parse_args()
    print(json.dumps(pretrained_english(a.text,local_files_only=a.local_files_only,adapter_dir=a.adapter_dir),
                     indent=2,ensure_ascii=False))


if __name__=="__main__":
    main()

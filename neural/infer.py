#!/usr/bin/env python3
"""Opt-in research inference; cannot override canonical Tēntli grammar."""
import argparse
import json
from pathlib import Path
import torch
from .model import TentliNeural


def infer(model_dir: str, text: str, task: str = "denoise", target_language: str = "en") -> dict:
    folder = Path(model_dir)
    meta = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    if meta.get("format") != "tentli-experimental-neural-v1":
        raise ValueError("Unsupported neural artifact")
    if task == "translate" and not (meta.get("trained_translation_examples", 0) or
                                    meta.get("teacher_translation_examples", 0)):
        raise ValueError("This model has not learned from any English supervision")
    if task == "analyze" and not meta.get("trained_analysis_examples", 0):
        raise ValueError("This model has not learned canonical morphological analyses")
    if task not in {"denoise", "translate", "analyze"}:
        raise ValueError("Unknown model task")
    if target_language not in {"en", "es"}:
        raise ValueError("Unsupported translation target language")
    if target_language == "es":
        if task != "translate":
            raise ValueError("Spanish target only applies to translation, not morphology or denoising")
        if not meta.get("source_inventory", {}).get("translation_language_counts", {}).get("es", 0):
            raise ValueError("Checkpoint has no Spanish translation training examples")
        # This matches the existing byte-model source prefix used in
        # neural.train, without changing task tokens or canonical grammar.
        text = "es: " + text
    model = TentliNeural(**meta["model_config"])
    model.load_state_dict(torch.load(folder / meta["weights_filename"],
                                     map_location="cpu", weights_only=True))
    return {
        "mode": task,
        "translation_target_language": target_language if task == "translate" else None,
        "proposal": model.generate(text, task=task),
        "grade": "experimental_neural_hypothesis",
        "translation_accuracy": None,
        "warning": ("Unverified neural output; never overrides the canonical Tēntli analysis. " +
                    ("Teacher English is synthetic grammar output, not historical translation training."
                     if task == "translate" and not meta.get("trained_translation_examples", 0) else "")),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model-dir", required=True)
    p.add_argument("--text", required=True)
    p.add_argument("--target-language", choices=["en", "es"], default="en")
    p.add_argument("--task", choices=["denoise", "translate", "analyze"], default="denoise")
    a = p.parse_args()
    print(json.dumps(infer(a.model_dir, a.text, a.task, a.target_language), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

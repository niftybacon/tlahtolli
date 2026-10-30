#!/usr/bin/env python3
"""Opt-in research inference; cannot override canonical Tēntli grammar."""
import argparse
import json
from pathlib import Path
import torch
from .model import TentliNeural


def infer(model_dir: str, text: str, task: str = "denoise") -> dict:
    folder = Path(model_dir)
    meta = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
    if meta.get("format") != "tentli-experimental-neural-v1":
        raise ValueError("Unsupported neural artifact")
    if task == "translate" and not meta.get("trained_translation_examples", 0):
        raise ValueError("This model has not learned from any licensed translation examples")
    if task not in {"denoise", "translate"}:
        raise ValueError("Unknown model task")
    model = TentliNeural(**meta["model_config"])
    model.load_state_dict(torch.load(folder / meta["weights_filename"],
                                     map_location="cpu", weights_only=True))
    return {
        "mode": task,
        "proposal": model.generate(text, task=task),
        "grade": "experimental_neural_hypothesis",
        "translation_accuracy": None,
        "warning": "Unverified neural output; not a historical attestation or a Tēntli grammar judgment",
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model-dir", required=True)
    p.add_argument("--text", required=True)
    p.add_argument("--task", choices=["denoise", "translate"], default="denoise")
    a = p.parse_args()
    print(json.dumps(infer(a.model_dir, a.text, a.task), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Distill existing Tēntli grammar/lexical teacher signals into neural weights.

No historical corpus is imported, no new canonical rules are inferred, and
generated English is a synthetic engine target, not certified source translation.
"""
from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path
import random
import torch
from .model import TentliNeural, encode_text, inputs, targets
from .teacher import load_teacher
from .train import step


def distill(teacher_manifest: str, output: str, *, width: int = 48, heads: int = 4,
            layers: int = 1, max_bytes: int = 256, epochs: int = 1,
            batch_size: int = 8, max_steps: int | None = None,
            seed: int = 19) -> dict:
    if epochs < 1 or batch_size < 1 or (max_steps is not None and max_steps < 1):
        raise ValueError("Invalid distillation limits")
    root = Path(__file__).resolve().parents[1]
    rows, ledger = load_teacher(teacher_manifest, root=root)
    for row in rows:
        if len(row.input.encode("utf-8")) > max_bytes - 2 or len(row.target.encode("utf-8")) > max_bytes - 2:
            raise ValueError("Teacher example would be silently truncated; increase max_bytes")
    torch.manual_seed(seed)
    rng = random.Random(seed)
    model = TentliNeural(width=width, heads=heads, layers=layers, max_bytes=max_bytes)
    model.train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.0005)
    steps = 0
    losses: list[float] = []
    for _ in range(epochs):
        indices = list(range(len(rows)))
        rng.shuffle(indices)
        for offset in range(0, len(indices), batch_size):
            batch = []
            for j in indices[offset:offset + batch_size]:
                r = rows[j]
                batch.append((inputs(r.input, r.task, max_bytes),
                              targets(r.target, max_bytes), r.weight, r.task))
            optimizer.zero_grad(set_to_none=True)
            loss = step(model, batch, torch.device("cpu"))
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            steps += 1
            losses.append(float(loss.item()))
            if max_steps is not None and steps >= max_steps:
                break
        if max_steps is not None and steps >= max_steps:
            break
    dest = Path(output)
    dest.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), dest / "weights.pt")
    counts = Counter(r.grade for r in rows)
    meta = {
        "format": "tentli-experimental-neural-v1",
        "description": "Genuine neural teacher distillation; no independently translated historical training pairs",
        "model_config": model.config,
        "seed": seed, "steps": steps, "epochs_requested": epochs,
        "training_mean_loss": sum(losses)/len(losses),
        "training_objectives": dict(Counter(r.task for r in rows)),
        "teacher_grade_counts": dict(counts),
        "teacher_release": ledger["release"],
        "teacher_source_sha256": ledger["source_sha256"],
        "teacher_examples": len(rows),
        "teacher_translation_examples": counts.get("grammar-composed-English", 0),
        "trained_analysis_examples": sum(r.task == "analyze" for r in rows),
        "trained_translation_examples": 0,
        "source_inventory": {"teacher_only": True, "independent_gold": 0},
        "can_claim_translation_accuracy": False,
        "independent_translation_accuracy": None,
        "experiment_fixture_only": False,
        "weights_filename": "weights.pt",
    }
    (dest / "metadata.json").write_text(json.dumps(meta, indent=2, sort_keys=True)+"\n", encoding="utf-8")
    return meta


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--teacher-manifest", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--epochs", type=int, default=1)
    p.add_argument("--width", type=int, default=48)
    p.add_argument("--heads", type=int, default=4)
    p.add_argument("--layers", type=int, default=1)
    p.add_argument("--max-bytes", type=int, default=256)
    p.add_argument("--batch-size", type=int, default=8)
    p.add_argument("--max-steps", type=int)
    p.add_argument("--seed", type=int, default=19)
    a = p.parse_args()
    print(json.dumps(distill(a.teacher_manifest, a.output, width=a.width, heads=a.heads,
          layers=a.layers, max_bytes=a.max_bytes, epochs=a.epochs, batch_size=a.batch_size,
          max_steps=a.max_steps, seed=a.seed), indent=2))


if __name__ == "__main__":
    main()

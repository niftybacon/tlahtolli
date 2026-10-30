#!/usr/bin/env python3
"""Train source-aware byte Transformer from legally usable historical text.

python -m neural.train --manifest /path/to/licensed.jsonl --output /tmp/tentli-neural
No model weights are shipped with the public translator.
"""
from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path
import random
import torch
from torch.nn import functional as F

from .corpus import load_corpus, summarize
from .model import TentliNeural, PAD, MASK, BYTE_OFFSET, inputs, targets


def corrupt(source: list[int], *, rng: random.Random, probability: float = 0.20) -> list[int]:
    """Mask actual source bytes, not task tags or EOS."""
    out = source[:]
    candidates = [i for i in range(1, len(out) - 1) if out[i] >= BYTE_OFFSET]
    masked = 0
    for i in candidates:
        if rng.random() < probability:
            out[i] = MASK
            masked += 1
    if candidates and not masked:
        out[rng.choice(candidates)] = MASK
    return out


def make_examples(rows, cap: int, *, rng: random.Random):
    for row in rows:
        yield corrupt(inputs(row.original, "denoise", cap), rng=rng), targets(row.original, cap), 1.0, "denoise"
        if row.translation is not None:
            yield inputs(row.original, "translate", cap), targets(row.translation, cap), row.translation_weight, "translate"


def pad_sequences(sequences: list[list[int]], device: torch.device):
    length = max(len(x) for x in sequences)
    return torch.tensor([x + [PAD] * (length - len(x)) for x in sequences], dtype=torch.long, device=device)


def step(model: TentliNeural, batch, device: torch.device) -> torch.Tensor:
    x = pad_sequences([e[0] for e in batch], device)
    y = pad_sequences([e[1] for e in batch], device)
    logits = model(x, y[:, :-1])
    label = y[:, 1:]
    loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), label.reshape(-1),
                           reduction="none", ignore_index=PAD).view(label.shape)
    per_record = loss.sum(dim=1) / label.ne(PAD).sum(dim=1).clamp(min=1)
    weights = torch.tensor([e[2] for e in batch], dtype=torch.float32, device=device)
    # Mean over examples, not weight sum: 0.15 remains 0.15 even alone in batch.
    return (per_record * weights).mean()


def train(manifest: str, output: str, *, epochs: int = 1, batch_size: int = 8,
          width: int = 96, heads: int = 4, layers: int = 2, max_bytes: int = 256,
          learning_rate: float = 0.0005, seed: int = 19,
          allow_test_fixture: bool = False, max_steps: int | None = None,
          init_checkpoint: str | None = None) -> dict:
    if epochs < 1 or batch_size < 1 or max_bytes < 16 or (max_steps is not None and max_steps < 1):
        raise ValueError("Invalid training limits")
    rows = load_corpus(manifest, allow_test_fixture=allow_test_fixture)
    stats = summarize(rows)
    torch.manual_seed(seed)
    rng = random.Random(seed)
    device = torch.device("cpu")
    model = TentliNeural(width=width, heads=heads, layers=layers, max_bytes=max_bytes).to(device)
    teacher_meta = None
    if init_checkpoint is not None:
        folder = Path(init_checkpoint)
        teacher_meta = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
        if teacher_meta.get("format") != "tentli-experimental-neural-v1" or teacher_meta.get("model_config") != model.config:
            raise ValueError("Teacher checkpoint format/model dimensions do not match")
        model.load_state_dict(torch.load(folder / teacher_meta["weights_filename"],
                                        map_location="cpu", weights_only=True))
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    training = [r for r in rows if r.split == "train"]
    development = [r for r in rows if r.split == "dev"]
    total_steps = 0
    training_losses: list[float] = []
    for epoch in range(epochs):
        rng.shuffle(training)
        examples = list(make_examples(training, max_bytes, rng=rng))
        rng.shuffle(examples)
        model.train()
        for offset in range(0, len(examples), batch_size):
            batch = examples[offset:offset + batch_size]
            optimizer.zero_grad(set_to_none=True)
            loss = step(model, batch, device)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            training_losses.append(float(loss.item()))
            total_steps += 1
            if max_steps is not None and total_steps >= max_steps:
                break
        if max_steps is not None and total_steps >= max_steps:
            break
    # Dev is never used for optimizer steps. It is NOT translation accuracy.
    dev_loss = None
    if development:
        model.eval()
        with torch.no_grad():
            dev_examples = list(make_examples(development, max_bytes, rng=random.Random(seed)))
            scores = [float(step(model, dev_examples[j:j + batch_size], device).item())
                      for j in range(0, len(dev_examples), batch_size)]
            dev_loss = sum(scores) / len(scores)
    out = Path(output)
    out.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), out / "weights.pt")
    result = {
        "format": "tentli-experimental-neural-v1",
        "description": "Byte denoising/optional weakly supervised translation Transformer; not a deployed translator",
        "model_config": model.config,
        "seed": seed, "steps": total_steps, "epochs_requested": epochs,
        "training_objectives": dict(Counter(e[3] for e in make_examples(training, max_bytes, rng=random.Random(seed)))),
        "training_mean_loss": sum(training_losses) / len(training_losses),
        "development_mean_loss": dev_loss,
        "trainable_parameters": sum(p.numel() for p in model.parameters()),
        "trained_translation_examples": stats["translation_training_records"] + (teacher_meta or {}).get("trained_translation_examples", 0),
        "trained_analysis_examples": (teacher_meta or {}).get("trained_analysis_examples", 0),
        "teacher_translation_examples": (teacher_meta or {}).get("teacher_translation_examples", 0),
        "teacher_release": (teacher_meta or {}).get("teacher_release"),
        "initialization": "teacher-distilled" if teacher_meta is not None else "random",
        "can_claim_translation_accuracy": False,
        "independent_translation_accuracy": None,
        "experiment_fixture_only": allow_test_fixture,
        "source_inventory": stats,
        "weights_filename": "weights.pt",
    }
    (out / "metadata.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--epochs", type=int, default=1)
    ap.add_argument("--batch-size", type=int, default=8)
    ap.add_argument("--width", type=int, default=96)
    ap.add_argument("--heads", type=int, default=4)
    ap.add_argument("--layers", type=int, default=2)
    ap.add_argument("--max-bytes", type=int, default=256)
    ap.add_argument("--learning-rate", type=float, default=0.0005)
    ap.add_argument("--seed", type=int, default=19)
    ap.add_argument("--init-checkpoint", help="Resume historical learning from a compatible teacher-distilled model")
    ap.add_argument("--max-steps", type=int)
    args = ap.parse_args()
    result = train(args.manifest, args.output, epochs=args.epochs, batch_size=args.batch_size,
                   width=args.width, heads=args.heads, layers=args.layers,
                   max_bytes=args.max_bytes, learning_rate=args.learning_rate,
                   seed=args.seed, max_steps=args.max_steps, init_checkpoint=args.init_checkpoint)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

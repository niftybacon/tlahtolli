#!/usr/bin/env python3
"""Fit and reload real neural weights on synthetic non-Nahuatl fixtures only.

Proves gradients, checkpoints and inference guards, NOT Classical competence.
"""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    import torch
except ImportError:
    torch = None


@unittest.skipIf(torch is None, "Install torch for real neural-gradient smoke")
class TransformerSmoke(unittest.TestCase):
    def test_utf8_weights_train_and_translation_guard(self):
        from neural.model import encode_text, decode_bytes
        from neural.train import train
        from neural.infer import infer
        self.assertEqual(decode_bytes(encode_text("xōchitl īhuān", 100)), "xōchitl īhuān")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            data = root / "synthetic.jsonl"
            rows = []
            for i, item in enumerate(["ka fo bar.", "na foo bar.", "aa ko foo."]):
                rows.append({
                    "record_id": f"fixture-{i}", "work_id": "synthetic-work",
                    "source_url": "https://example.org/synthetic-fixture",
                    "source_date": "fictional", "variety": "synthetic_test_only",
                    "original": item, "transcription_status": "unreviewed",
                    "rights": "public_domain", "split": "train",
                })
            data.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
            result = train(str(data), str(root / "checkpoint"), width=24, heads=4,
                           layers=1, max_bytes=48, batch_size=3, epochs=1,
                           max_steps=1, allow_test_fixture=True)
            self.assertGreater(result["trainable_parameters"], 0)
            self.assertEqual(result["steps"], 1)
            self.assertEqual(result["trained_translation_examples"], 0)
            self.assertIsNone(result["independent_translation_accuracy"])
            self.assertTrue((root / "checkpoint" / "weights.pt").exists())
            with self.assertRaisesRegex(ValueError, "not learned"):
                infer(str(root / "checkpoint"), "ka fo bar", task="translate")
            response = infer(str(root / "checkpoint"), "ka fo bar", task="denoise")
            self.assertEqual(response["grade"], "experimental_neural_hypothesis")
            self.assertIsNone(response["translation_accuracy"])
            self.assertIsInstance(response["proposal"], str)


if __name__ == "__main__":
    unittest.main()

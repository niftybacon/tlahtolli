#!/usr/bin/env python3
"""Real PyTorch teacher distillation and warm-start regression.

The teacher samples are canonical software output, not historical gold.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
ROOT = Path(__file__).resolve().parents[1]

try:
    import torch
except ImportError:
    torch = None


@unittest.skipIf(torch is None, "PyTorch not installed")
class TeacherDistillationTests(unittest.TestCase):
    def test_distill_reload_and_historical_finetune(self):
        from neural.teacher import load_teacher
        from neural.distill import distill
        from neural.infer import infer
        from neural.train import train
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            teacher = folder / "teacher.jsonl"
            subprocess.run(["node", str(ROOT / "tools/export_tentli_neural_teacher.js"),
                            str(teacher)], cwd=ROOT, check=True, capture_output=True, text=True)
            rows, meta = load_teacher(teacher, root=ROOT)
            self.assertGreater(len(rows), 800)
            self.assertEqual(meta["counts"]["cells"], 720)
            self.assertTrue(all(r.grade != "historically_attested" for r in rows))
            checkpoint = folder / "teacher_checkpoint"
            learned = distill(str(teacher), str(checkpoint), width=24, heads=4,
                              layers=1, max_bytes=256, batch_size=4, max_steps=2)
            self.assertEqual(learned["steps"], 2)
            self.assertGreater(learned["trained_analysis_examples"], 800)
            self.assertEqual(learned["trained_translation_examples"], 0)
            self.assertGreater(learned["teacher_translation_examples"], 0)
            self.assertTrue((checkpoint/"weights.pt").exists())
            output = infer(str(checkpoint), "nitlahtoa", task="analyze")
            self.assertEqual(output["grade"], "experimental_neural_hypothesis")
            self.assertIsNone(output["translation_accuracy"])
            _ = infer(str(checkpoint), "nitlahtoa", task="translate")

            # Explicit fictional non-Nahuatl fixture: does not claim this is a
            # genuine historical manuscript or introduce gold translation pairs.
            data = folder / "fixture.jsonl"
            fixture = {
                "record_id": "fixture-1", "work_id": "fictional-teacher-smoke",
                "source_url": "https://example.org/synthetic",
                "source_date": "fictional", "variety": "synthetic_test_only",
                "original": "ka zo bar.", "transcription_status": "unreviewed",
                "rights": "public_domain", "split": "train",
            }
            data.write_text(json.dumps(fixture)+"\n", encoding="utf-8")
            refined = train(str(data), str(folder/"finetuned"), width=24, heads=4,
                            layers=1, max_bytes=256, epochs=1, batch_size=1,
                            max_steps=1, allow_test_fixture=True,
                            init_checkpoint=str(checkpoint))
            self.assertEqual(refined["initialization"], "teacher-distilled")
            self.assertEqual(refined["teacher_translation_examples"], learned["teacher_translation_examples"])
            self.assertEqual(refined["trained_analysis_examples"], learned["trained_analysis_examples"])
            with self.assertRaises(ValueError):
                train(str(data), str(folder/"mismatched"), width=32, heads=4,
                      layers=1, max_bytes=256, epochs=1, batch_size=1,
                      max_steps=1, allow_test_fixture=True,
                      init_checkpoint=str(checkpoint))


if __name__ == "__main__":
    unittest.main()

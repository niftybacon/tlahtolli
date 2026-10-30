"""Guard Brinton 1890 public-domain stanza candidates from gold promotion and leakage."""
from __future__ import annotations

import json
from pathlib import Path
import unittest

from neural.corpus import load_corpus, summarize

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "research/neural_training/brinton_1890_poetry_weak_en.jsonl"
PINNED_BLOB = "76b6a70282eb9c7cb973125661aa8113fe6cece1"
DEV_POEMS = {"xxv", "xxvi", "xxvii"}


class BrintonWeakParallelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = [json.loads(line) for line in FILE.read_text(encoding="utf-8").splitlines() if line.strip()]

    def test_source_gated_neural_corpus_loads(self):
        rows = load_corpus(FILE)
        stats = summarize(rows)
        self.assertEqual(stats["records"], 150)
        self.assertEqual(stats["splits"], {"dev": 17, "train": 133})
        self.assertEqual(stats["works"], 20)
        self.assertEqual(stats["translation_training_records"], 133)
        self.assertEqual(stats["candidate_parallel_training_records"], 133)
        self.assertEqual(stats["translation_language_counts"], {"en": 133, "es": 0})
        self.assertIsNone(stats["independent_translation_accuracy"])
        self.assertTrue(all(x.translation_weight == 0.15 for x in rows))

    def test_no_historical_candidate_promoted_to_gold(self):
        for row in self.raw:
            with self.subTest(record=row["record_id"]):
                self.assertEqual(row["variety"], "Classical Nahuatl")
                self.assertEqual(row["rights"], "public_domain")
                self.assertEqual(row["transcription_status"], "editorial")
                self.assertEqual(row["source_blob_sha"], PINNED_BLOB)
                self.assertEqual(row["translation"]["rights"], "public_domain")
                self.assertEqual(row["translation"]["language"], "en")
                self.assertEqual(row["translation"]["alignment"], "candidate")
                self.assertIsNone(row["independent_translation_accuracy"])
                self.assertNotIn("gold", row)
                self.assertNotIn("approved", row)
                self.assertTrue(row["source_url"].startswith("https://github.com/GITenberg/"))
                self.assertIn("#L", row["source_url"])
                self.assertIn("#L", row["translation"]["source_url"])
                self.assertLessEqual(len(row["original"].encode("utf-8")), 254)
                self.assertLessEqual(len(row["translation"]["text"].encode("utf-8")), 254)

    def test_entire_poems_held_out_by_group(self):
        groups = {}
        sources = {}
        for row in self.raw:
            poem = row["work_id"].rsplit("-", 1)[-1]
            expected = "dev" if poem in DEV_POEMS else "train"
            self.assertEqual(row["split"], expected)
            self.assertEqual(groups.setdefault(row["work_id"], row["split"]), row["split"])
            fingerprint = " ".join(row["original"].lower().split())
            self.assertEqual(sources.setdefault(fingerprint, row["split"]), row["split"])
        self.assertEqual({row["work_id"].rsplit("-", 1)[-1]
                          for row in self.raw if row["split"] == "dev"}, DEV_POEMS)


if __name__ == "__main__":
    unittest.main()

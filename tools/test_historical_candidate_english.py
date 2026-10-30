"""Historical weak-alignment training must never acquire approved/gold authority."""
from __future__ import annotations
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.historical_candidate_english import (
    DEFAULT_MANIFEST, TIER, WEIGHT, audit, load_candidate_pairs
)
from neural.pretrained_english import approved_research_adapter, MODEL_ID, MODEL_REVISION
from neural.train_reviewed_english import load_reviewed_pairs

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / DEFAULT_MANIFEST


class HistoricalEnglishCandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = [json.loads(s) for s in MANIFEST.read_text(encoding="utf-8").splitlines() if s.strip()]

    def test_real_history_is_trainable_but_not_gold(self):
        corpus = load_candidate_pairs(MANIFEST)
        self.assertEqual(len(corpus["train"]), 133)
        self.assertEqual(len(corpus["dev"]), 17)
        self.assertEqual(corpus["test"], [])
        self.assertEqual(len({r["work"] for r in corpus["train"]}), 17)
        self.assertEqual(len({r["work"] for r in corpus["dev"]}), 3)
        self.assertTrue(all(r["example_weight"] == WEIGHT for r in corpus["train"]))
        self.assertFalse({r["work"] for r in corpus["train"]} & {r["work"] for r in corpus["dev"]})
        result = audit(MANIFEST)
        self.assertEqual(result["evidence_tier"], TIER)
        self.assertEqual(result["train_eligible_reviewed_pairs"], 0)
        self.assertEqual(result["independent_gold_pairs"], 0)
        self.assertIsNone(result["accuracy"])
        self.assertFalse(result["weights_updated"])

    def _tiny_manifest(self, modification):
        train = next(x for x in self.rows if x["split"] == "train")
        dev = next(x for x in self.rows if x["split"] == "dev")
        rows = [deepcopy(train), deepcopy(dev)]
        modification(rows)
        return "\n".join(json.dumps(x, ensure_ascii=False) for x in rows) + "\n"

    def _reject(self, modify, pattern):
        with tempfile.TemporaryDirectory() as d:
            manifest = Path(d) / "bad.jsonl"
            manifest.write_text(self._tiny_manifest(modify), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, pattern):
                load_candidate_pairs(manifest)

    def test_reviewed_alignment_not_silently_promoted(self):
        self._reject(lambda rows: rows[0]["translation"].update(alignment="reviewed"),
                     "Only historically sourced")

    def test_unknown_translation_rights_rejected(self):
        self._reject(lambda rows: rows[0]["translation"].update(rights="unknown"),
                     "rights are undocumented")

    def test_unknown_source_rights_rejected(self):
        self._reject(lambda rows: rows[0].update(rights="unknown"),
                     "rights are undocumented")

    def test_test_gold_split_rejected(self):
        self._reject(lambda rows: rows[1].update(split="test"),
                     "may not contain independent gold")

    def test_modern_nahuatl_dialect_rejected(self):
        self._reject(lambda rows: rows[0].update(variety="Eastern Huasteca Nahuatl"),
                     "only Classical Nahuatl")

    def test_approved_pair_loader_is_independent_and_closed(self):
        with self.assertRaisesRegex(ValueError, "Need APPROVED"):
            load_reviewed_pairs(ROOT / "research/translation_corpus/pairs.csv")

    def test_candidate_adapter_load_guard_requires_non_gold_metadata(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            (folder / "adapter_model.safetensors").write_bytes(b"metadata-fixture-only-not-real-weights")
            metadata = {
                "format": "tentli-english-supervision-lora-v1",
                "evidence_tier": TIER,
                "base_model": MODEL_ID,
                "revision": MODEL_REVISION,
                "automatically_approved_for_public_translation": False,
                "independent_translation_accuracy": None,
                "actual_optimizer_steps": 32,
                "candidate_historical_training_records": 133,
                "candidate_translation_weight": WEIGHT,
                "weak_candidate_rights_validated": True,
                "human_reviewed_training_examples": 0,
                "gold_translation_examples": 0,
                "source_translation_quality_verified": False,
                "historical_semantic_accuracy": None,
                "historical_alignment_grade": "published_interpretive_stanza_candidate",
            }
            path = folder / "research_metadata.json"
            path.write_text(json.dumps(metadata), encoding="utf-8")
            self.assertEqual(approved_research_adapter(folder)["evidence_tier"], TIER)
            for bad in (
                {"gold_translation_examples": 1},
                {"candidate_translation_weight": 1.0},
                {"weak_candidate_rights_validated": False},
                {"source_translation_quality_verified": True},
                {"human_reviewed_training_examples": 133},
                {"automatically_approved_for_public_translation": True},
            ):
                path.write_text(json.dumps({**metadata, **bad}), encoding="utf-8")
                with self.subTest(bad=bad), self.assertRaises(ValueError):
                    approved_research_adapter(folder)


if __name__ == "__main__":
    unittest.main()

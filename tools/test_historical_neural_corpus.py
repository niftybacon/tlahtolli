#!/usr/bin/env python3
"""Evidence safety gates for historical neural learning, without torch dependency."""
from __future__ import annotations
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from neural.corpus import CorpusError, inspect_record, load_corpus, summarize


def example(**update):
    x = {
        "record_id": "test-case-1", "work_id": "test-work",
        "source_url": "https://example.org/archive/folio-1",
        "variety": "Classical Nahuatl", "source_date": "1577",
        "original": "Nimitztlazohtla. Jn xōchitl.",
        "transcription_status": "unreviewed", "rights": "public_domain",
        "split": "train",
    }
    x.update(update)
    return x


class IntakeTests(unittest.TestCase):
    def test_unreviewed_historical_is_eligible_for_unlabeled_learning(self):
        e = inspect_record(example())
        self.assertEqual(e.transcription_status, "unreviewed")
        self.assertFalse(e.experimental_parallel)
        self.assertEqual(summarize([e])["monolingual_training_records"], 1)
        self.assertIsNone(summarize([e])["independent_translation_accuracy"])

    def test_unknown_licenses_are_not_automatically_granted(self):
        for status in ["unknown", "copyright_unknown", "all_rights_reserved"]:
            with self.subTest(status=status), self.assertRaises(CorpusError):
                inspect_record(example(rights=status))
        with self.assertRaises(CorpusError):
            inspect_record(example(rights="permission_documented"))
        self.assertEqual(inspect_record(example(rights="permission_documented",
                                                permission_url="https://example.org/permission")).rights,
                         "permission_documented")

    def test_classical_only_and_fixture_isolation(self):
        with self.assertRaises(CorpusError):
            inspect_record(example(variety="Modern Huasteca Nahuatl"))
        with self.assertRaises(CorpusError):
            inspect_record(example(variety="synthetic_test_only"))
        self.assertEqual(inspect_record(example(variety="synthetic_test_only"), allow_test_fixture=True).work_id,
                         "test-work")

    def test_candidate_targets_are_weak_not_gold_and_require_own_rights(self):
        parallel = {"text": "I love you.", "language": "en",
                    "rights": "cc_by_4_0", "source_url": "https://example.org/translation",
                    "alignment": "candidate"}
        e = inspect_record(example(translation=parallel))
        self.assertEqual(e.translation_weight, 0.15)
        self.assertEqual(e.alignment, "candidate")
        self.assertEqual(inspect_record(example(translation={**parallel, "alignment": "reviewed"})).translation_weight, 1.0)
        with self.assertRaises(CorpusError):
            inspect_record(example(translation={**parallel, "rights": "unknown"}))
        with self.assertRaises(CorpusError):
            inspect_record(example(translation={**parallel, "source_url": ""}))

    def test_source_work_split_leakage_and_identical_span_leakage(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "rows.jsonl"
            rows = [example(), example(record_id="test-case-2", split="test")]
            path.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
            with self.assertRaisesRegex(CorpusError, "leaks"):
                load_corpus(path)
            rows[1]["work_id"] = "different-work"
            path.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
            with self.assertRaisesRegex(CorpusError, "Identical"):
                load_corpus(path)
            rows[1]["original"] = "Another distinct hypothetical passage."
            path.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
            self.assertEqual(summarize(load_corpus(path))["splits"], {"test": 1, "train": 1})

    def test_duplicate_record_and_no_forged_accuracy_field(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "rows.jsonl"
            path.write_text("\n".join([json.dumps(example()), json.dumps(example())]), encoding="utf-8")
            with self.assertRaisesRegex(CorpusError, "Duplicate"):
                load_corpus(path)
        self.assertFalse("translation_accuracy" in inspect_record(example()).__dict__)


if __name__ == "__main__":
    unittest.main()

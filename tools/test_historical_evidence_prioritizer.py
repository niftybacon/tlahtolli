"""Research triage is reproducible, source-grounded, and never evaluation gold."""
from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
import tempfile
import unittest

from neural.historical_evidence_prioritizer import (
    INDEX, CANDIDATES, ADDITIONAL_ANCHORS, exact_tokens, load_anchors,
    prioritize, source_index_anchors
)


class HistoricalEvidencePriorityTests(unittest.TestCase):
    def test_all_44_checked_index_entries_are_preserved(self):
        anchors = source_index_anchors()
        self.assertEqual(len(anchors), 44)
        self.assertEqual(len({a["headword"] for a in anchors}), 44)
        for a in anchors:
            self.assertTrue(a["lexical_practice_only"])
            self.assertFalse(a["historical_sentence_pair"])
            self.assertFalse(a["approved_gold"])
            self.assertTrue(a["historical_locator"])
            self.assertTrue(a["source_url"].startswith("https://nahuatl.wired-humanities.org/"))
            self.assertTrue(a["glosses"])

    def test_historically_checked_atl_xochitl_and_ambiguous_in(self):
        anchors = {a["headword"]: a for a in load_anchors()}
        self.assertEqual(len(anchors), 47)
        self.assertEqual({x["headword"] for x in ADDITIONAL_ANCHORS},
                         {"atl", "xochitl", "in"})
        self.assertEqual(anchors["atl"]["primary_gloss"], "water")
        self.assertEqual(anchors["xochitl"]["primary_gloss"], "flower")
        self.assertEqual(anchors["in"]["part_of_speech"], "particle")
        self.assertIsNone(anchors["in"]["primary_gloss"])
        self.assertTrue(anchors["in"]["context_sensitive"])
        self.assertIn("often untranslated", anchors["in"]["glosses"])
        self.assertNotIn("the", anchors["in"]["glosses"])
        for a in anchors.values():
            self.assertTrue(a["lexical_practice_only"])
            self.assertFalse(a["historical_sentence_pair"])
            self.assertFalse(a["approved_gold"])

    def test_only_exact_free_words_no_unsourced_segmentation(self):
        self.assertEqual(exact_tokens("atl xochitl in"), ["atl", "xochitl", "in"])
        self.assertNotIn("atl", exact_tokens("xochiatl"))
        self.assertNotIn("xochitl", exact_tokens("tlaxochitl"))
        self.assertEqual(exact_tokens("In IN"), ["in", "in"])

    def test_40_priorities_from_train_only_and_work_spread(self):
        report = prioritize()
        self.assertEqual(report["source_rows"], 150)
        self.assertEqual(report["candidate_train_rows_considered"], 133)
        self.assertEqual(report["reserved_development_rows_not_inspected_for_priority"], 17)
        self.assertEqual(report["source_indexed_lexical_anchors"], 47)
        self.assertEqual(report["selected_for_human_review"], 40)
        self.assertEqual(report["max_per_historical_work"], 4)
        self.assertFalse(report["output_is_training_or_gold"])
        self.assertIsNone(report["independent_gold_translation_accuracy"])
        self.assertEqual(report["approved_parallel_pairs_added"], 0)
        self.assertEqual(report, prioritize())
        groups = Counter(x["work_id"] for x in report["queue"])
        self.assertTrue(groups)
        self.assertLessEqual(max(groups.values()), 4)
        known = {x["record_id"]: x for x in (
            json.loads(line) for line in CANDIDATES.read_text(encoding="utf-8").splitlines()
            if line.strip()
        )}
        for x in report["queue"]:
            self.assertEqual(x["split"], "train")
            self.assertNotIn(x["work_id"].rsplit("-", 1)[-1], {"xxv", "xxvi", "xxvii"})
            self.assertEqual(x["translation_url"], known[x["record_id"]]["translation"]["source_url"])
            self.assertEqual(x["source_url"], known[x["record_id"]]["source_url"])
            self.assertFalse(x["train_eligibility_increased"])
            self.assertFalse(x["independent_gold"])
            self.assertEqual(x["suggested_status"],
                             "pending_source_and_translation_alignment_review")

    def test_any_test_gold_row_must_fail_closed(self):
        data = [json.loads(line) for line in CANDIDATES.read_text(encoding="utf-8").splitlines() if line.strip()]
        # Change a complete source work: the corpus validator must not
        # reject *work leakage* before our separate gold/test admission gate.
        heldout_work = data[-1]["work_id"]
        for row in data:
            if row["work_id"] == heldout_work:
                row["split"] = "test"
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "injected.jsonl"
            p.write_text("\n".join(json.dumps(x) for x in data) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "gold/test"):
                prioritize(p)

    def test_bounded_review_range(self):
        with self.assertRaisesRegex(ValueError, "Invalid bounded"):
            prioritize(max_items=0)
        with self.assertRaisesRegex(ValueError, "Invalid bounded"):
            prioritize(per_work=0)


if __name__ == "__main__":
    unittest.main()

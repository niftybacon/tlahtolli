"""Audit canonical source-checked vocabulary without mistaken historical claims."""
from __future__ import annotations
from collections import Counter
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.canonical_lexical_coverage import (
    LEXICON, EVIDENCE, WITNESSES, MANIFEST,
    build_lookup, clean, inspect, source_claims, tokens, witness_forms
)


class CanonicalLexicalCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lexicon = json.loads(LEXICON.read_text(encoding="utf-8"))
        cls.evidence = json.loads(EVIDENCE.read_text(encoding="utf-8"))
        cls.atlas = json.loads(WITNESSES.read_text(encoding="utf-8"))
        cls.lexemes = source_claims(cls.lexicon, cls.evidence)

    def test_reuses_real_checked_lemmas_with_claim_provenance(self):
        self.assertGreaterEqual(len(self.lexemes), 100)
        self.assertLessEqual(len(self.lexemes), len(self.lexicon["words"]))
        for entry in self.lexemes.values():
            self.assertTrue(entry["headword_claims"])
            self.assertTrue(entry["pos_claims"])
            self.assertTrue(entry["source_url"].startswith("https://"))
            self.assertFalse(entry["historical_sentence_translation"])
            self.assertFalse(entry["independent_english_gloss_review"])

    def test_evidence_source_order_must_match_canonical(self):
        bad = deepcopy(self.evidence)
        bad["entries"][0], bad["entries"][1] = bad["entries"][1], bad["entries"][0]
        with self.assertRaisesRegex(ValueError, "do not align"):
            source_claims(self.lexicon, bad)

    def test_provisional_lexeme_does_not_gain_source_check_from_spelling(self):
        bad_lexicon = deepcopy(self.lexicon)
        candidate = next(x for x in bad_lexicon["words"]
                         if x.get("status") == "Checked against source"
                         and clean(x["word"]) in self.lexemes)
        candidate["status"] = "provisional"
        reduced = source_claims(bad_lexicon, self.evidence)
        self.assertNotIn(clean(candidate["word"]), reduced)
        self.assertEqual(len(reduced), len(self.lexemes) - 1)

    def test_only_cited_early_forms_not_global_normalization(self):
        witnesses = witness_forms(self.atlas, self.lexemes)
        look = build_lookup(self.lexemes, witnesses)
        self.assertNotEqual(clean("ātl"), clean("atl"))
        self.assertEqual(tokens("Xōchitl atl Jn yn"), ["xōchitl", "atl", "jn", "yn"])
        self.assertNotIn("tlaxochitl", look)
        for candidates in witnesses.values():
            self.assertTrue(all(row["source_id"] in {"dfc", "enl"} for row in candidates))
            self.assertTrue(all(row["human_sentence_translation_reviewed"] is False for row in candidates))
        if "in" in self.lexemes:
            self.assertIn("jn", look)
            self.assertIn("yn", look)
        if "ātl" in self.lexemes:
            self.assertIn("atl", look)
        self.assertNotIn("tlahtoani", witnesses)  # exclusively 1833 Puebla-source spelling

    def test_no_modern_1833_witness_can_spread_into_classical(self):
        witnesses = witness_forms(self.atlas, self.lexemes)
        urls = [x["witness_url"] for rows in witnesses.values() for x in rows]
        self.assertFalse(any("bible.com" in url for url in urls))

    def test_real_brinton_report_is_training_only_and_bounded(self):
        result = inspect()
        self.assertEqual(result["train_stanzas_examined"], 133)
        self.assertEqual(result["dev_stanzas_reserved"], 17)
        self.assertEqual(result["review_queue_size"], 40)
        self.assertGreaterEqual(result["source_checked_classical_lemmas"], 100)
        self.assertGreater(result["train_token_occurrences"], 0)
        self.assertGreater(result["matched_exact_or_cited_witness_token_occurrences"], 0)
        self.assertLessEqual(result["matched_exact_or_cited_witness_token_occurrences"],
                             result["train_token_occurrences"])
        self.assertEqual(result["approved_historical_translation_pairs_added"], 0)
        self.assertIsNone(result["independent_gold_accuracy"])
        self.assertFalse(result["neural_weights_updated"])
        n = Counter(x["work_id"] for x in result["review_queue"])
        self.assertTrue(n)
        self.assertLessEqual(max(n.values()), 4)
        self.assertTrue(all(x["review_status"] == "pending_not_approved" for x in result["review_queue"]))
        self.assertTrue(all(x["model_gold_or_train_promotion"] is False for x in result["review_queue"]))
        self.assertEqual(result, inspect())

    def test_40_lexical_review_proposals_have_no_invented_glosses(self):
        report = inspect()
        proposals = report["proposed_unmatched_surface_review"]
        self.assertEqual(report["unmatched_surface_proposals_count"], 40)
        self.assertEqual(len(proposals), 40)
        self.assertTrue(proposals)
        for item in proposals:
            with self.subTest(surface=item["written_surface"]):
                self.assertIsNone(item["candidate_meaning"])
                self.assertFalse(item["auto_source_checked"])
                self.assertFalse(item["training_eligible"])
                self.assertEqual(item["human_review_status"], "unreviewed_frequency_lead")
                self.assertTrue(item["requires_historical_spelling_segmentation_and_context_review"])
                self.assertGreater(item["token_occurrences_in_training_poems"], 0)
                self.assertGreater(item["distinct_training_work_count"], 0)
                self.assertTrue(item["training_source_examples"])
                self.assertTrue(all("brinton-1890-poetry-" in v["record_id"]
                                    and v["printed_source_url"].startswith("https://github.com/")
                                    for v in item["training_source_examples"]))
                self.assertTrue(all(v["work_id"].rsplit("-", 1)[-1] not in
                                    {"xxv", "xxvi", "xxvii"}
                                    for v in item["training_source_examples"]))

    def test_gold_test_source_rows_are_never_inspected(self):
        raw = [json.loads(x) for x in MANIFEST.read_text(encoding="utf-8").splitlines() if x.strip()]
        # Move a WHOLE poem group rather than introducing a fake split leakage.
        work = raw[-1]["work_id"]
        for r in raw:
            if r["work_id"] == work:
                r["split"] = "test"
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "unapproved-test.jsonl"
            path.write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in raw)+"\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Gold/test"):
                inspect(path)

    def test_invalid_bounds_refused(self):
        with self.assertRaisesRegex(ValueError, "Bounded review"):
            inspect(limit=0)
        with self.assertRaisesRegex(ValueError, "Bounded review"):
            inspect(per_work=0)


if __name__ == "__main__":
    unittest.main()

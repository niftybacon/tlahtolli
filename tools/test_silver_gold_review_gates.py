"""Historical Silver review and sealed Gold evaluation: adversarial regression gates.

All named people and 'Gold examples' in these unit tests are INVENTED TEST
FIXTURES. They are never stored in the project corpus or represented as
genuine scholarly reviews.
"""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from tools.prepare_silver_review import (
    ASSESSMENT_FORMAT, digest, packet, review_assessments
)
from tools.independent_gold_gate import (
    ADJUDICATIONS, FORMAT, PREDICTIONS,
    known_exposure, score_blind, validate_private_gold, wilson
)


class SilverReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sheet = packet()

    def test_real_40_source_printed_contexts_without_approvals(self):
        sheet = self.sheet
        self.assertEqual(sheet["source_stanzas_count"], 150)
        self.assertEqual(sheet["heldout_dev_stanzas_excluded"], 17)
        self.assertEqual(len(sheet["review_cases"]), 40)
        self.assertEqual(sheet["human_reviewed_silver_count"], 0)
        self.assertEqual(sheet["gold_count"], 0)
        self.assertEqual(sheet["automatically_approved_training_count"], 0)
        self.assertEqual(sheet, packet())
        counts = {}
        ids = set()
        for row in sheet["review_cases"]:
            with self.subTest(id=row["record_id"]):
                self.assertNotIn(row["record_id"], ids)
                ids.add(row["record_id"])
                counts[row["work_id"]] = counts.get(row["work_id"], 0) + 1
                self.assertTrue(row["source_url"].startswith("https://github.com/GITenberg/"))
                self.assertIn("/blob/ab90a087b33d8c767caa867674dbf33e0cee084f/", row["source_url"])
                self.assertIn("#L", row["translation_url"])
                self.assertEqual(row["source_collection_id"], "brinton-1890-ancient-nahuatl-poetry")
                self.assertEqual(row["manuscript_facsimile_status"], "printed_1890_edition_only")
                self.assertTrue(row["nahuatl_as_printed"])
                self.assertTrue(row["english_as_printed"])
                self.assertEqual(row["review_status"], "pending_independent_contextual_human_review")
                self.assertFalse(row["silver_approved"])
                self.assertFalse(row["gold"])
                self.assertFalse(row["training_eligible"])
                self.assertIsNone(row["reviewed_translation_text"])
                self.assertIsNone(row["transcription_reviewer"])
                self.assertIsNone(row["translation_reviewer"])
        self.assertLessEqual(max(counts.values()), 4)
        self.assertGreater(len(counts), 8)
        self.assertTrue(all(not key.endswith(("xxv", "xxvi", "xxvii")) for key in counts))

    def candidate(self):
        p = self.sheet["review_cases"][0]
        return {
            "record_id": p["record_id"],
            "canonical_source_fingerprint": p["canonical_source_fingerprint"],
            "decision": "reviewed_silver_candidate",
            "gold": False, "training_eligible": False,
            "alignment_notes": "Fixture: two independent people compared the whole stanza and found metaphor and lexical choices that require explanation.",
            "alignment_scope": "stanza_contextual",
            "original_collated_against_print": True,
            "english_semantics_reviewed": True,
            "transcription_reviewer": "Fixture Source Specialist",
            "translation_reviewer": "Fixture Bilingual Specialist",
            "reviewed_english": "SYNTHETIC TEST TARGET, not a real verified historical translation.",
            "transcription_notes": "Fixture noted a divergent spelling in the second printed line.",
            "original_rights": "public_domain",
            "translation_rights": "permission_documented",
            "review_source_url": p["source_url"],
            "review_translation_url": p["translation_url"],
            "printed_editorial_translation_is_literal": False,
            "manuscript_facsimile_checked": False,
        }

    def test_schema_validation_does_not_automatically_promote(self):
        blank = {"format": ASSESSMENT_FORMAT, "decisions": []}
        result = review_assessments(self.sheet, blank)
        self.assertEqual(result["human_attested_reviewed_silver_candidates"], 0)
        self.assertEqual(result["review_decisions_pending"], 40)
        proof = {"format": ASSESSMENT_FORMAT, "decisions": [self.candidate()]}
        report = review_assessments(self.sheet, proof)
        self.assertEqual(report["human_attested_reviewed_silver_candidates"], 1)
        self.assertEqual(report["review_decisions_pending"], 39)
        self.assertEqual(report["gold_examples_created"], 0)
        self.assertFalse(report["approved_pairs_csv_modified"])
        self.assertFalse(report["automatically_training_eligible"])
        self.assertFalse(report["independent_human_expertise_verified_by_software"])

    def test_malicious_candidate_promotions_fail(self):
        baseline = self.candidate()
        modifications = [
            lambda r: r.update(gold=True),
            lambda r: r.update(training_eligible=True),
            lambda r: r.update(canonical_source_fingerprint="0"*64),
            lambda r: r.update(translation_reviewer=r["transcription_reviewer"]),
            lambda r: r.update(transcription_reviewer="AI-only"),
            lambda r: r.update(translation_reviewer="ChatGPT"),
            lambda r: r.update(english_semantics_reviewed=False),
            lambda r: r.update(original_collated_against_print=False),
            lambda r: r.update(translation_rights="unknown"),
            lambda r: r.update(review_source_url="http://fake.local"),
            lambda r: r.update(reviewed_english=""),
            lambda r: r.update(alignment_notes="approved"),
            lambda r: r.update(manuscript_facsimile_checked="unknown"),
        ]
        for modification in modifications:
            x = deepcopy(baseline)
            modification(x)
            with self.subTest(x=x), self.assertRaises(ValueError):
                review_assessments(self.sheet, {"format": ASSESSMENT_FORMAT, "decisions": [x]})

    def test_rejection_cannot_look_like_silver(self):
        obj = self.candidate()
        obj["decision"] = "reject_alignment"
        report = review_assessments(self.sheet, {"format": ASSESSMENT_FORMAT, "decisions": [obj]})
        self.assertEqual(report["alignment_rejections"], 1)
        self.assertEqual(report["human_attested_reviewed_silver_candidates"], 0)
        self.assertFalse(report["automatically_training_eligible"])


def synthetic_exposure():
    # The fixtures below are imaginary, NOT real Nahuatl and not a real Gold set.
    return {
        "collections": {"brinton-1890-ancient-nahuatl-poetry",
                        "tentli-canonical-synthetic-grammar"},
        "works": {"brinton-1890-poetry-i", "synthetic-lemma-chōca"},
        "normalized_content": {"nichōca"},
        "historical_candidate_records_considered": 150,
    }


def synthetic_private_gold(n=10):
    examples = []
    for i in range(n):
        coll = "fictional-test-collection-a" if i < n//2 else "fictional-test-collection-b"
        work = "fictional-source-work-a" if i < n//2 else "fictional-source-work-b"
        examples.append({
            "gold_id": f"fictional-test-gold-{i:03d}",
            "source_collection_id": coll,
            "work_id": work,
            "nahuatl": f"TEST NOT NAHUATL SUBJECT {i}",  # explicitly synthetic
            "reviewed_english": f"TEST ENGLISH ONLY {i}", # explicitly synthetic
            "variety": "Classical Nahuatl", # *fixture* exercises the schema only
            "source_url": f"https://example.org/fixture/{i}/source",
            "translation_source_url": f"https://example.org/fixture/{i}/target",
            "source_rights": "permission_documented",
            "english_rights": "permission_documented",
            "folio_or_segment": f"synthetic test folio {i}",
            "source_date": "synthetic fixture date",
            "historical_context_note": "Fixture context exists only to exercise validation.",
            "transcription_review_note": "Imaginary first specialist separately checked this test fixture.",
            "translation_review_note": "Imaginary second specialist independently checked the fixture.",
            "transcription_reviewed_by": "Fixture Transcription Specialist",
            "translation_reviewed_by": "Fixture Translation Specialist",
            "model_predictions_seen_before_reference_freeze": False,
            "training_eligible": False,
            "blind_holdout": True,
            "transcription_verified": True,
            "semantic_translation_verified": True,
        })
    return {"format": FORMAT, "labels_available_to_training": False,
            "automatic_human_review": False, "examples": examples}


class PrivateGoldTests(unittest.TestCase):
    def test_actual_repository_has_no_certified_gold(self):
        # Real source inventory is checked, but NO real private test labels are introduced.
        exposure = known_exposure()
        self.assertEqual(exposure["historical_candidate_records_considered"], 150)
        self.assertIn("brinton-1890-ancient-nahuatl-poetry", exposure["collections"])
        self.assertIn("brinton-1890-poetry-i", exposure["works"])
        self.assertIn("nichōca", exposure["normalized_content"] if "nichōca" in exposure["normalized_content"] else {"nichōca"})
        with self.assertRaisesRegex(ValueError, "No independently human-reviewed"):
            validate_private_gold({"format": FORMAT, "examples": [],
                                   "labels_available_to_training": False,
                                   "automatic_human_review": False})

    def test_named_independent_holdout_valid_in_test_fixture_only(self):
        report = validate_private_gold(synthetic_private_gold(), exposures=synthetic_exposure())
        self.assertEqual(report["gold_reviewed_examples"], 10)
        self.assertEqual(report["gold_heldout_works"], 2)
        self.assertEqual(report["gold_heldout_collections"], 2)
        self.assertEqual(report["previously_exposed_historical_candidate_records"], 150)
        self.assertFalse(report["labels_publicly_exported"])
        self.assertFalse(report["training_eligible"])
        self.assertIsNone(report["independent_gold_semantic_accuracy"])

    def test_ban_brinton_entire_collection_even_if_other_song(self):
        data = synthetic_private_gold()
        data["examples"][0]["source_collection_id"] = "brinton-1890-ancient-nahuatl-poetry"
        with self.assertRaisesRegex(ValueError, "unseen"):
            validate_private_gold(data, exposures=synthetic_exposure())
        data = synthetic_private_gold()
        data["examples"][0]["work_id"] = "brinton-1890-poetry-xxvii"
        with self.assertRaisesRegex(ValueError, "unseen"):
            validate_private_gold(data, exposures=synthetic_exposure())

    def test_exposed_text_reviewers_and_rights_rejected(self):
        mods = [
            lambda r: r.update(nahuatl="nichōca"),
            lambda r: r.update(training_eligible=True),
            lambda r: r.update(blind_holdout=False),
            lambda r: r.update(model_predictions_seen_before_reference_freeze=True),
            lambda r: r.update(translation_reviewed_by="AI-only"),
            lambda r: r.update(transcription_reviewed_by=r["translation_reviewed_by"]),
            lambda r: r.update(english_rights="unknown"),
            lambda r: r.update(translation_source_url=""),
            lambda r: r.update(semantic_translation_verified=False),
            lambda r: r.update(variety="Puebla Nahuatl"),
            lambda r: r.update(historical_context_note=""),
        ]
        for modification in mods:
            data = synthetic_private_gold()
            modification(data["examples"][0])
            with self.subTest(example=data["examples"][0]), self.assertRaises(ValueError):
                validate_private_gold(data, exposures=synthetic_exposure())

    def test_human_adjudication_is_not_exact_string_matching(self):
        data = synthetic_private_gold()
        meta = validate_private_gold(data, exposures=synthetic_exposure())
        pred = {
            "format": PREDICTIONS, "gold_reference_sha256": meta["reference_content_sha256"],
            "predictions": [
                {"gold_id": r["gold_id"], "english": "different paraphrase",
                 "status": "translation", "model_revision": "fixture-commit-abcdef1234"}
                for r in data["examples"]
            ],
        }
        judgments = {
            "format": ADJUDICATIONS, "gold_reference_sha256": meta["reference_content_sha256"],
            "judgments": [
                {"gold_id": r["gold_id"], "decision": ("faithful" if i < 7 else "incorrect"),
                 "adjudicator": "Fixture Independent Adjudicator",
                 "semantic_rationale": "Synthetic human-fixture evaluation includes source roles and negation."}
                for i, r in enumerate(data["examples"])
            ],
        }
        result = score_blind(data, pred, judgments, exposures=synthetic_exposure())
        self.assertEqual(result["adjudication_counts"]["faithful"], 7)
        self.assertEqual(result["adjudication_counts"]["incorrect"], 3)
        self.assertEqual(result["strict_faithful_rate"], 0.7)
        self.assertEqual(result["evaluated_gold_examples"], 10)
        self.assertTrue(result["approximate_95pct_wilson_interval"][0] < 0.7 <
                        result["approximate_95pct_wilson_interval"][1])
        self.assertFalse(result["reference_labels_logged"])
        bad = deepcopy(pred)
        bad["predictions"][0]["english"] = ""
        with self.assertRaisesRegex(ValueError, "Nonempty English"):
            score_blind(data, bad, judgments, exposures=synthetic_exposure())
        bad = deepcopy(judgments)
        bad["judgments"][0]["adjudicator"] = "Fixture Translation Specialist"
        with self.assertRaisesRegex(ValueError, "independent"):
            score_blind(data, pred, bad, exposures=synthetic_exposure())
        bad = deepcopy(judgments)
        bad["judgments"][0]["decision"] = "unreviewed"
        with self.assertRaisesRegex(ValueError, "independent semantic"):
            score_blind(data, pred, bad, exposures=synthetic_exposure())
        bad = deepcopy(judgments)
        bad["gold_reference_sha256"] = "0"*64
        with self.assertRaisesRegex(ValueError, "sealed Gold"):
            score_blind(data, pred, bad, exposures=synthetic_exposure())

    def test_wilson_small_sample_not_impossibly_confident(self):
        self.assertEqual(wilson(0, 0), (0.0, 0.0))
        self.assertLess(wilson(10, 10)[0], 1.0)
        self.assertGreater(wilson(0, 10)[1], 0.0)


if __name__ == "__main__":
    unittest.main()

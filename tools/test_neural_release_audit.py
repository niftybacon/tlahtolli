#!/usr/bin/env python3
"""Model-release auditing must never silently approve current teacher-only weights."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.release_audit import audit


class ReleaseAuditTests(unittest.TestCase):
    def test_current_teacher_and_historical_denoiser_not_public_translation(self):
        current={
          "format":"tentli-experimental-neural-v1",
          "trained_translation_examples":0,
          "teacher_translation_examples":24,
          "independent_translation_accuracy":None,
          "source_inventory":{"teacher_only":True}
        }
        assessment=audit(current)
        self.assertFalse(assessment["public_release_ready"])
        self.assertTrue(any("bilingual" in reason for reason in assessment["blockers"]))
        self.assertTrue(any("human-reviewed" in reason for reason in assessment["blockers"]))

    def test_nonlicensed_train_data_needs_distinct_model_release_review(self):
        trained={
          "format":"tentli-experimental-neural-v1",
          "trained_translation_examples":60,
          "independent_translation_accuracy":0.5,
          "source_inventory":{"fair_use_assessed_source_records":60}
        }
        assessment=audit(trained,review={
          "no_substantial_memorization":True,
          "heldout_human_quality_review":True,
          "reviewed_source_acquisition":True
        })
        self.assertFalse(assessment["public_release_ready"])
        self.assertTrue(any("publishing these weights" in reason for reason in assessment["blockers"]))
        self.assertFalse(assessment["fair_use_is_legal_certification"])

    def test_full_review_clears_engineering_gates_not_legal_rights(self):
        trained={
          "format":"tentli-experimental-neural-v1",
          "trained_translation_examples":200,
          "independent_translation_accuracy":0.75,
          "source_inventory":{"fair_use_assessed_source_records":200}
        }
        result=audit(trained,review={
          "model_publication_assessment_url":"https://example.org/fictional-review",
          "no_substantial_memorization":True,
          "heldout_human_quality_review":True,
          "reviewed_source_acquisition":True
        })
        self.assertTrue(result["public_release_ready"])
        self.assertFalse(result["fair_use_is_legal_certification"])

if __name__=="__main__":
    unittest.main()

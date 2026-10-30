"""Evidence investigator regression: archival provenance, dialect separation, no self-approval."""
from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.autonomous_evidence_investigator import (
    FORMAT, FEEDBACK, MANIFEST, build_indexes, investigate, load_feedback,
)


class HistoricalResearchInvestigatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = investigate()

    def test_real_40_explorations_and_correct_archive_source_counts(self):
        r = self.result
        self.assertEqual(r["format"], FORMAT)
        self.assertEqual(r["investigation_count"], 40)
        self.assertEqual(r["historical_training_stanzas"], 133)
        self.assertEqual(r["historical_development_stanzas_excluded"], 17)
        self.assertEqual(r["archive_record_counts"]["simeon_total"], 28709)
        self.assertEqual(r["archive_record_counts"]["kaikki_total"], 7834)
        self.assertEqual(len({x["form"] for x in r["investigations"]}), 40)
        self.assertEqual(sum(r["source_family_hit_summary"].values()), 40)
        self.assertTrue(r["provenance_sha256"]["brinton_manifest"])
        self.assertEqual(r, investigate())

    def test_real_report_never_mistakes_source_lookup_for_translation(self):
        report = self.result
        self.assertEqual(report["human_reviewed_silver_added"], 0)
        self.assertEqual(report["gold_added"], 0)
        self.assertEqual(report["machine_verified_meanings"], 0)
        self.assertEqual(report["independent_primary_source_checks_completed"], 0)
        self.assertEqual(report["canonical_source_changes"], 0)
        self.assertFalse(report["training_weights_updated"])
        self.assertTrue(report["high_priority_manual_context_escalations"])
        for item in report["investigations"]:
            with self.subTest(form=item["form"]):
                self.assertIsNone(item["candidate_translation"])
                self.assertFalse(item["lexicon_entry_approved"])
                self.assertFalse(item["training_eligible"])
                self.assertFalse(item["silver_approved"])
                self.assertFalse(item["gold"])
                self.assertFalse(item["global_spelling_normalization_performed"])
                self.assertFalse(item["cross_language_semantic_equivalence_auto_verified"])
                self.assertTrue(item["sampled_source_locations"])
                self.assertTrue(all(x["record_id"].startswith("brinton-1890-poetry-") and
                                    x["printed_source_url"].startswith("https://github.com/")
                                    and x["work_id"].rsplit("-", 1)[-1] not in
                                    {"xxv", "xxvi", "xxvii"}
                                    for x in item["sampled_source_locations"]))
                for fam in ("simeon_1885_french_ocr", "kaikki_community_classical_only"):
                    for x in item["evidence"][fam]:
                        self.assertFalse(x["historical_semantics_verified"])
                        self.assertTrue(x["source_record_id"])
                        self.assertTrue(x["citation_url"].startswith("https://"))
                        self.assertIn("CC BY-SA", x["license"])

    def test_zanio_project_director_assessment_is_preserved_not_certified(self):
        found = {x["form"]: x for x in self.result["investigations"]}
        self.assertIn("zanio", found, "Direct feedback must not disappear from top-40 frequency batch")
        r = found["zanio"]
        feedback = r["evidence"]["project_director_single_review"]
        self.assertIsNotNone(feedback)
        self.assertEqual(feedback["passage"], "brinton-1890-poetry-v-01")
        self.assertIn("only", feedback["claimed_sense"])
        self.assertEqual(feedback["historical_dictionary_url"],
                         "https://nahuatl.wired-humanities.org/node/172083")
        self.assertFalse(feedback["whole_stanza_silver_approved"])
        self.assertFalse(feedback["second_human_review"])
        self.assertTrue(r["needs_contextual_human_scholarship"])
        self.assertFalse(r["silver_approved"])
        self.assertFalse(r["gold"])

    def test_project_director_feedback_is_not_a_signature(self):
        source = json.loads(FEEDBACK.read_text(encoding="utf-8"))
        corpus = [json.loads(line) for line in MANIFEST.read_text(encoding="utf-8").splitlines() if line.strip()]
        for edit in (
            lambda x: x["entries"][0].update(gold=True),
            lambda x: x["entries"][0].update(training_eligible=True),
            lambda x: x["entries"][0].update(second_human_review=True),
            lambda x: x["entries"][0].update(historical_alignment_approved=True),
            lambda x: x["entries"][0].update(original_url="https://example.com/fake"),
            lambda x: x["entries"][0].update(exact_written_form="xochitl"),
        ):
            bad = deepcopy(source)
            edit(bad)
            with tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / "invalid-feedback.json"
                p.write_text(json.dumps(bad), encoding="utf-8")
                with self.subTest(bad=bad["entries"][0]), self.assertRaises(ValueError):
                    load_feedback(p, candidates=corpus)

    def test_fake_archive_excludes_modern_nahuatl_even_at_identical_spelling(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            metadata = {
                "format": "tlahtolli-amoxcalli-archive-manifest-v1",
                "source_rows": {"simeon": 1, "kaikki": 2, "total": 3},
                "simeon": {"files": ["simeon_00.json"],
                           "source_url": "https://example.org/1885",
                           "license": "CC BY-SA 4.0"},
                "kaikki": {"files": ["kaikki_00.json"],
                           "source_url": "https://example.org/2026",
                           "license": "CC BY-SA 4.0"},
            }
            (folder/"manifest.json").write_text(json.dumps(metadata), encoding="utf-8")
            (folder/"simeon_00.json").write_text(json.dumps({
                "format": "tlahtolli-amoxcalli-simeon-v1",
                "start": 0, "review": "ocr-unverified",
                "rows": [["ZANIO", "seulement", "adv", None, None, None]],
            }), encoding="utf-8")
            (folder/"kaikki_00.json").write_text(json.dumps({
                "format": "tlahtolli-amoxcalli-kaikki-v1",
                "start": 0, "review": "source-derived-not-expert-reviewed",
                "rows": [
                    ["zanio", "adv", "nci", [[["alone"], [], []]], [], "", "Classical Nahuatl"],
                    ["zanio", "adv", "nhn", [[["alone"], [], []]], [], "", "Modern Central Nahuatl"],
                ],
            }), encoding="utf-8")
            idx, stats = build_indexes(folder)
            self.assertEqual(stats["simeon_total"], 1)
            self.assertEqual(stats["kaikki_total"], 2)
            self.assertEqual(stats["nonclassical_community_excluded"], 1)
            self.assertEqual(len(idx["simeon"]["zanio"]), 1)
            self.assertEqual(len(idx["kaikki"]["zanio"]), 1)
            self.assertEqual(idx["simeon"]["zanio"][0]["source_grade"],
                             "1885_historical_dictionary_2026_unreviewed_OCR_French")
            self.assertFalse(idx["kaikki"]["zanio"][0]["historical_semantics_verified"])
            metadata["source_rows"]["kaikki"] = 3
            (folder/"manifest.json").write_text(json.dumps(metadata), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "count differs"):
                build_indexes(folder)

    def test_range_is_bounded_and_fail_closed(self):
        for n in (0, 201):
            with self.assertRaisesRegex(ValueError, "bounded"):
                investigate(max_cases=n)


if __name__ == "__main__":
    unittest.main()

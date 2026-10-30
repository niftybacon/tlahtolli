"""Guard historical particle/vocable research against unsourced English training."""
from __future__ import annotations

from collections import Counter
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.historical_form_triage import CATALOG, EXPECTED, contextual_audit, read_catalog
from neural.canonical_lexical_coverage import MANIFEST


class TestHistoricalSongFormTriage(unittest.TestCase):
    def test_ten_source_located_and_cautious_entries(self):
        data = read_catalog()
        self.assertEqual(set(data), EXPECTED)
        self.assertEqual(len(data), 10)
        self.assertEqual(data["ohuaya"]["class"], "documented_song_vocable")
        self.assertEqual(data["zan"]["class"], "documented_contextual_particle")
        self.assertEqual(data["ye"]["class"], "documented_contextual_particle")
        self.assertEqual(data["ya"]["class"], "documented_historical_variant_with_context_risk")
        for surface in ("aya", "y", "a", "o", "ohuaye", "huia"):
            self.assertTrue(data[surface]["class"].startswith("unresolved_"))
        for row in data.values():
            self.assertIsNone(row["fixed_english_target"])
            self.assertFalse(row["lexicon_promotion"])
            self.assertFalse(row["training_eligible"])
            self.assertFalse(row["contextual_translation_verified"])
            self.assertFalse(row["independent_manuscript_review"])
            self.assertTrue(all(s["url"].startswith("https://") and s["locator"]
                                for s in row["sources"]))

    def test_exact_historical_train_counts_and_no_automatic_filter(self):
        a = contextual_audit()
        self.assertEqual(a["train_stanzas_only"], 133)
        self.assertEqual(a["untouched_development_stanzas"], 17)
        self.assertEqual(a["lexical_training_token_occurrences"], 2646)
        self.assertEqual(a["baseline_unmatched_surface_occurrences"], 2329)
        self.assertEqual(a["documented_song_vocable_occurrences_flagged_not_deleted"], 106)
        self.assertEqual(a["unmatched_occurrences_excluding_flagged_vocable_as_workload_estimate"], 2223)
        self.assertEqual(a["proposed_human_context_reviews"], 40)
        self.assertEqual(a["source_cited_forms"], 4)
        self.assertEqual(a["unresolved_editorial_forms"], 6)
        self.assertEqual(a["human_approved_bilingual_examples_created"], 0)
        self.assertFalse(a["train_weights_changed"])
        self.assertFalse(a["live_translator_changed"])
        self.assertIsNone(a["independent_gold_accuracy"])
        self.assertTrue(a["no_global_spelling_rewrites"])
        self.assertTrue(a["no_fixed_english_target"])
        self.assertEqual({r["surface"] for r in a["forms"]}, EXPECTED)
        found = {row["surface"]: row for row in a["forms"]}
        self.assertEqual(found["zan"]["training_token_occurrences"], 60)
        self.assertEqual(found["ye"]["training_token_occurrences"], 105)
        self.assertEqual(found["ya"]["training_token_occurrences"], 54)
        self.assertEqual(found["y"]["training_token_occurrences"], 75)
        self.assertEqual(found["aya"]["training_token_occurrences"], 34)
        for row in a["forms"]:
            self.assertIsNone(row["verified_english_translation"])
            self.assertFalse(row["approve_lexicon_or_train"])
            self.assertFalse(row["independent_human_reviewed"])
            self.assertTrue(row["citation_links"])
            self.assertTrue(all(x["work_id"].rsplit("-", 1)[-1] not in
                                {"xxv", "xxvi", "xxvii"} for x in row["example_pointers"]))

    def test_diversity_and_repeatability(self):
        a = contextual_audit()
        self.assertEqual(a, contextual_audit())
        groups = Counter(r["work_id"] for r in a["review_queue"])
        self.assertTrue(groups)
        self.assertLessEqual(max(groups.values()), 4)
        self.assertTrue(all(r["eligible_for_training_or_gold"] is False
                            and r["contextual_review"] == "pending_human_source_review"
                            for r in a["review_queue"]))
        self.assertTrue(all(r["work_id"].rsplit("-", 1)[-1] not in
                            {"xxv", "xxvi", "xxvii"} for r in a["review_queue"]))

    def test_catalog_cannot_invent_gold_or_fixed_gloss(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        for mutation in (
            lambda d: d["forms"][0].update(fixed_english_target="word"),
            lambda d: d["forms"][0].update(training_eligible=True),
            lambda d: d.update(independent_human_review_count=1),
            lambda d: d["forms"][1].update(lexicon_promotion=True),
            lambda d: d["forms"][1].update(contextual_translation_verified=True),
            lambda d: d["forms"][2]["sources"].clear(),
            lambda d: d["forms"][3].update(surface="ohuaya"),
            lambda d: d["forms"][0].update(surface="Ohuaya"),
        ):
            with tempfile.TemporaryDirectory() as tmp:
                copy = deepcopy(data)
                mutation(copy)
                file = Path(tmp) / "malicious.json"
                file.write_text(json.dumps(copy), encoding="utf-8")
                with self.subTest(mutation=str(mutation)), self.assertRaises(ValueError):
                    read_catalog(file)

    def test_no_gold_split_can_be_triaged(self):
        items = [json.loads(line) for line in MANIFEST.read_text(encoding="utf-8").splitlines() if line.strip()]
        group = items[-1]["work_id"]
        for item in items:
            if item["work_id"] == group:
                item["split"] = "test"
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "leaky.jsonl"
            file.write_text("\n".join(json.dumps(x) for x in items) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "test/Gold"):
                contextual_audit(file)

    def test_review_range_and_none_of_the_forms_are_synthetically_translated(self):
        for n, k in ((0, 4), (40, 0), (201, 4)):
            with self.assertRaisesRegex(ValueError, "bounded"):
                contextual_audit(limit=n, max_per_work=k)


if __name__ == "__main__":
    unittest.main()

"""Primary edition passage checks: distinct grammar roles, exact short text and Gold protections."""
from __future__ import annotations
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.primary_source_context import (
    CATALOG, examine, read_catalog, match_located_excerpt, fetch_page
)


class ControlledPrimarySourceTests(unittest.TestCase):
    def test_stable_graded_catalog_and_no_automatic_translations(self):
        r = examine()
        self.assertEqual(r["specific_short_historical_contexts"], 3)
        self.assertEqual(r["primary_edited_source_collections"], 2)
        self.assertEqual(r["morphology_and_variant_source_index_claims"], 5)
        self.assertEqual(r["network_source_pages_checked"], 0)
        self.assertEqual(r["live_edition_text_checks"], 0)
        self.assertEqual(r["independent_manuscript_facsimile_collations"], 0)
        self.assertFalse(r["historical_source_accuracy_independently_certified"])
        self.assertEqual(r["new_approved_silver_translations"], 0)
        self.assertEqual(r["new_gold_translations"], 0)
        self.assertEqual(r["approved_dictionary_changes"], 0)
        self.assertFalse(r["model_weights_updated"])
        self.assertEqual(r, examine())
        ids = {x["id"] for x in r["investigations"]}
        self.assertEqual(ids, {"enl-bc19-numbered-can", "enl-bc19-ayac",
                               "dfc-book10-cujcatl"})
        for row in r["investigations"]:
            self.assertFalse(row["training_eligible"])
            self.assertFalse(row["source_based_silver_approved"])
            self.assertFalse(row["contextual_english_translation_certified"])
            self.assertFalse(row["independent_manuscript_image_read"])
            self.assertTrue(row["cannot_generalize_spelling_or_suffix"])
            self.assertIsNone(row["exact_visible_edition_phrase_checked"])

    def test_can_locative_optative_and_interrogative_are_distinct(self):
        data=read_catalog()
        roles = {x["id"]: x["function"] for x in data["grammar_claims"]}
        self.assertEqual(roles["can-optative"], "plural_optative_verb_suffix")
        self.assertEqual(roles["can-interrogative"], "independent_interrogative_or_locative")
        self.assertEqual(roles["can-abundance"], "abundant_locative_derivation")
        c = next(x for x in data["contexts"] if x["id"] == "enl-bc19-numbered-can")
        self.assertEqual(c["role"], "numbered_locative_suffix")
        self.assertEqual(c["written_form"], "yniquexcan")
        self.assertNotEqual(c["written_form"], "can")
        self.assertTrue(all(x["evidence_grade"].startswith(("cited_historical",
                           "historic_lexicographic", "modern_grammar",
                           "indexed_historical", "historical_lexicographic"))
                           for x in data["grammar_claims"]))

    def test_ayac_written_vs_aiaac_and_cuicatl_vs_cujcatl_remain_explicit(self):
        data=read_catalog()
        record={x["form"]:x for x in data["contexts"]}
        self.assertEqual(record["ayac"]["written_form"], "ayac")
        self.assertEqual(record["cuicatl"]["written_form"], "cujcatl")
        gram={x["id"]:x for x in data["grammar_claims"]}
        self.assertEqual(gram["ayac-alternate"]["historical_indexed_variant"], "aiaac")
        self.assertEqual(gram["cuicatl-derivation"]["related_verb_source_url"],
                         "https://nahuatl.wired-humanities.org/node/176079")
        self.assertTrue(all(x["not_a_general_rule"] for x in data["contexts"]))

    def test_syntax_assessment_uses_exact_whole_phrase_not_suffix_substring(self):
        self.assertTrue(match_located_excerpt("... yniquexcan mani tlalli calpilco ...",
                                               "yniquexcan mani tlalli calpilco"))
        self.assertTrue(match_located_excerpt("... ayac tle quitoz oncan tlatoz ...",
                                               "ayac tle quitoz oncan tlatoz"))
        self.assertTrue(match_located_excerpt("... qujioltevujaia in cujcatl: ...",
                                               "qujioltevujaia in cujcatl"))
        self.assertFalse(match_located_excerpt("... ayacan tle quitoz ...",
                                                "ayac tle quitoz"))
        self.assertFalse(match_located_excerpt("... qujioltevujaia in cuicatl ...",
                                                "qujioltevujaia in cujcatl"))
        self.assertFalse(match_located_excerpt("... can mani tlalli calpilco ...",
                                                "yniquexcan mani tlalli calpilco"))
        self.assertFalse(match_located_excerpt("... yniquexcan manitlalli calpilco ...",
                                                "yniquexcan mani tlalli calpilco"))

    def test_live_page_collation_simulated_without_reading_unsourced_text(self):
        seen=[]
        pages={
          "https://enl.wired-humanities.org/BC19":
            "Land grant of 1621: ayac tle quitoz oncan tlatoz, "
            "yniquexcan mani tlalli calpilco.",
          "https://florentinecodex.getty.edu/book/10/folio/118v":
            "Tolteca: qujioltevujaia in cujcatl.",
        }
        def fetch(url):
            seen.append(url)
            return pages[url]
        out=examine(live=True,page_fetcher=fetch)
        self.assertEqual(out["network_source_pages_checked"], 2)
        self.assertEqual(out["live_edition_text_checks"], 3)
        self.assertEqual(len(seen), 2)
        self.assertEqual(out["new_approved_silver_translations"], 0)
        pages["https://enl.wired-humanities.org/BC19"]="A different document"
        with self.assertRaisesRegex(ValueError, "no longer matches"):
            examine(live=True,page_fetcher=fetch)

    def test_source_tampering_and_false_gold_is_refused(self):
        baseline=json.loads(CATALOG.read_text(encoding="utf-8"))
        mutations=(
         lambda d: d["contexts"][0].update(written_form="can"),
         lambda d: d["contexts"][0].update(role="plural_optative_verb_suffix"),
         lambda d: d["contexts"][0].update(source_url="https://attacker.test/text"),
         lambda d: d["contexts"][0].update(exact_short_source_phrase="can"),
         lambda d: d["contexts"][1].update(independent_manuscript_facsimile_checked=True),
         lambda d: d["contexts"][2].update(english_alignment_human_reviewed=True),
         lambda d: d["source_collections"][0].update(training_allowed=True),
         lambda d: d["source_collections"][0].update(gold_holdout_eligible=True),
         lambda d: d["grammar_claims"][0].update(function="plural_optative_verb_suffix"),
         lambda d: d["global_guardrails"].update(human_silver_approved=1),
         lambda d: d["global_guardrails"].update(gold_created=1),
         lambda d: d["global_guardrails"].update(allow_bulk_copyrighted_transcription=True),
        )
        for mutate in mutations:
            doc=deepcopy(baseline)
            mutate(doc)
            with tempfile.TemporaryDirectory() as td:
                path=Path(td)/"untrusted-source.json"
                path.write_text(json.dumps(doc,ensure_ascii=False),encoding="utf-8")
                with self.subTest(data=doc), self.assertRaises(ValueError):
                    read_catalog(path)

    def test_remote_download_host_allowlist(self):
        for url in ("http://enl.wired-humanities.org/BC19",
                    "https://evil.example/BC19",
                    "https://user:password@enl.wired-humanities.org/BC19"):
            with self.assertRaises(ValueError):
                fetch_page(url)


if __name__ == "__main__":
    unittest.main()

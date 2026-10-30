"""The investigator can process the *full* available source worklist, not weekly 40."""
from __future__ import annotations
from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from neural.multidocument_evidence import (
    load_catalog, inspect_documents, original_language_section,
    CATALOG, EXACT_PROBES,
)
from neural.paged_historical_investigator import run, FORMAT


def fake_pages():
    return {
        "https://enl.wired-humanities.org/bc16":
            "Untrusted English example ticnamaca y¯ totlal - cannot count "
            "Transcriptions and Translations | Analytic Transcription | "
            "ticnamaca y¯ totlal, çan necoc cempohualli quahuitl "
            "[Transcription by James Lockhart] "
            "Published English translation ...",
        "https://enl.wired-humanities.org/bc26/elements/bc26a/000":
            "Introduction: yn don juan tecpancalli ytech poviz "
            "English Translation: palace "
            "Analytic Transcription "
            "yn don juan tecpancalli ytech poviz ynic cecni ocoçacapan "
            "[Transcription by James Lockhart] "
            "English Translation: palace",
    }


class AdditionalDocuments(unittest.TestCase):
    def test_source_documents_are_anchored_and_rights_safe(self):
        obj=load_catalog()
        self.assertEqual(len(obj["works"]),2)
        self.assertEqual(len(obj["probes"]),4)
        self.assertEqual(len(EXACT_PROBES),4)
        self.assertEqual({x["date_precision"] for x in obj["works"]},
                         {"year","editorial_estimate_not_exact_year"})
        self.assertTrue(all(not x["training_eligible"] and not x["gold_eligible"]
                            for x in obj["works"]))

    def test_two_live_edited_nahuatl_documents_are_distinct_from_english(self):
        pages=fake_pages()
        called=[]
        def source(url):
            called.append(url)
            return pages[url]
        r=inspect_documents(live=True, fetcher=source)
        self.assertEqual(r["historical_works_consulted"],2)
        self.assertEqual(r["contextual_form_probes"],4)
        self.assertEqual(r["live_original_edition_passages_checked"],4)
        self.assertEqual(r["distinct_source_pages_fetched"],2)
        self.assertEqual(len(called),2)
        self.assertEqual(r["independent_human_reviewed_translation_pairs"],0)
        self.assertEqual(r["gold_created"],0)
        self.assertEqual(r["automatic_training_examples"],0)
        self.assertTrue(all(x["original_transcription_live_verified"]
                            and not x["training_eligible"] for x in r["contexts"]))
        pages[next(iter(pages))] = "This is an English page without a Nahuatl section"
        with self.assertRaisesRegex(ValueError, "transcription"):
            inspect_documents(live=True, fetcher=source)

    def test_english_or_introduction_cannot_prove_original_occurrence(self):
        with self.assertRaisesRegex(ValueError,"section"):
            original_language_section(
                "Intro ticnamaca y¯ totlal [Transcription by James Lockhart]",
                "enl-bc16-1573")
        # The contextual form is in the intro, not original Nahuatl section.
        pages=fake_pages()
        pages["https://enl.wired-humanities.org/bc26/elements/bc26a/000"]=(
            "Intro yn don juan tecpancalli ytech poviz"
            " Analytic Transcription ynic cecni ocoçacapan "
            "[Transcription by James Lockhart]")
        with self.assertRaisesRegex(ValueError,"excerpt mismatch"):
            inspect_documents(live=True,fetcher=lambda url:pages[url])

    def test_tampering_and_training_promotion_rejected(self):
        start=json.loads(CATALOG.read_text(encoding="utf-8"))
        edits=(
            lambda d:d["works"][0].update(date="2001"),
            lambda d:d["works"][1].update(date_precision="year"),
            lambda d:d["works"][0].update(training_eligible=True),
            lambda d:d["works"][1].update(gold_eligible=True),
            lambda d:d["works"][0].update(source_url="https://attacker.invalid/BC16"),
            lambda d:d["probes"][0].update(exact_short_nahuatl="ticnamaca"),
            lambda d:d["probes"][2].update(review_status="silver_approved"),
            lambda d:d["safeguards"].update(promote_to_silver=True),
        )
        for edit in edits:
            x=deepcopy(start)
            edit(x)
            with tempfile.TemporaryDirectory() as td:
                p=Path(td)/"source.json"
                p.write_text(json.dumps(x),encoding="utf-8")
                with self.subTest(x=x), self.assertRaises(ValueError):
                    load_catalog(p)


class PagedResearch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.first=run(batch_size=200)
        cls.second=run(batch_size=200,offset=200)

    def test_real_source_index_goes_beyond_original_40(self):
        a=self.first
        b=self.second
        self.assertEqual(a["format"],FORMAT)
        self.assertEqual(a["processed_form_count"],200)
        self.assertGreater(a["distinct_written_forms_available"],200)
        self.assertGreater(a["archived_source_records_indexed"],36000)
        self.assertEqual(a["historical_train_stanzas"],133)
        self.assertEqual(a["historical_dev_stanzas_excluded"],17)
        self.assertEqual(b["processed_form_count"],min(200,a["distinct_written_forms_available"]-200))
        aforms={r["written_surface"] for r in a["investigations"]}
        bforms={r["written_surface"] for r in b["investigations"]}
        self.assertFalse(aforms & bforms)
        self.assertTrue({"can","ayac","cuicatl","tecpancalli","necoc"} & aforms)
        self.assertEqual(a["human_silver_added"],0)
        self.assertEqual(a["gold_added"],0)
        self.assertEqual(a["automatic_lexical_sense_certifications"],0)
        self.assertTrue(all(x["gold"] is False and x["silver_approved"] is False
                            and x["training_eligible"] is False
                            and x["cross_language_semantic_agreement"] is None
                            for x in a["investigations"]))

    def test_page_resume_and_evidence_change_rejection(self):
        a=self.first
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"previous.json"
            p.write_text(json.dumps(a),encoding="utf-8")
            b=run(batch_size=200,previous=p)
            self.assertEqual(b["already_examined_from_prior_same_source_revision"],200)
            self.assertFalse({x["written_surface"] for x in b["investigations"]}
                             & {x["written_surface"] for x in a["investigations"]})
            tamper=deepcopy(a)
            tamper["evidence_fingerprints"]["source_checked_claims"]="0"*64
            p.write_text(json.dumps(tamper),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"changed"):
                run(batch_size=10,previous=p)
            tamper=deepcopy(a)
            tamper["investigations"][0]["gold"]=True
            p.write_text(json.dumps(tamper),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"Gold"):
                run(batch_size=10,previous=p)

    def test_all_scope_never_includes_dev_english_or_gold(self):
        r=run(all_forms=True)
        self.assertEqual(r["processed_form_count"],r["distinct_written_forms_available"])
        self.assertEqual(r["remaining_distinct_forms_after_this_batch"],0)
        self.assertTrue(all("english" not in x for x in r["investigations"]))
        self.assertEqual(r["gold_added"],0)
        self.assertEqual(r["model_updated"],False)

    def test_finite_bounded_batch_and_offset(self):
        for kwargs in ({"batch_size":0},{"batch_size":1001},{"offset":-1}):
            with self.subTest(kwargs=kwargs),self.assertRaises(ValueError):
                run(**kwargs)


if __name__=="__main__":
    unittest.main()

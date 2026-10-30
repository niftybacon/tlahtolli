"""Guard pretrained English generation and review-only feedback/supervision."""
import csv
import json
from pathlib import Path
import tempfile
import unittest

from neural.pretrained_english import (
    MODEL_ID,MODEL_REVISION,guarded_english_realization,pretrained_english
)
from neural.correction_queue import append_pending,read_queue,summarize,stage
from neural.train_reviewed_english import load_reviewed_pairs
from tools.validate_translation_corpus import REQUIRED,check_records


def allowed():
    return {
        "status":"candidates","grammar_complete":True,
        "canonical_draft":"I see the woman.",
        "candidates":[
            {"english":"I see the woman.","source_urls":["https://example.org/lexicon"],
             "grade":"grammar_source_bounded_draft_not_manuscript_translation"},
            {"english":"I look at the woman.","source_urls":["https://example.org/lexicon"],
             "grade":"grammar_source_bounded_draft_not_manuscript_translation"}
        ]
    }


class TestEnglishSafety(unittest.TestCase):
    def test_flant5_is_pinned(self):
        self.assertEqual(MODEL_ID,"google/flan-t5-small")
        self.assertEqual(len(MODEL_REVISION),40)

    def test_pretrained_cannot_insert_semantics(self):
        result=guarded_english_realization("niquitta in cihuātl",
            rewrite=lambda _: "I saw three women yesterday.",admitted=allowed())
        self.assertEqual(result["english"],"I see the woman.")
        self.assertEqual(result["status"],"rewrite_rejected")
        self.assertFalse(result["verified_translation"])

    def test_exact_audited_english_can_be_selected(self):
        result=guarded_english_realization("niquitta in cihuātl",
            rewrite=lambda _: "I look at the woman.",admitted=allowed())
        self.assertEqual(result["english"],"I look at the woman.")
        self.assertTrue(result["model_proposal_accepted"])
        self.assertFalse(result["verified_translation"])

    def test_unsupported_no_model_called(self):
        seen=[]
        result=guarded_english_realization("xyzzy",
            rewrite=lambda _: seen.append("invoked") or "Invented output",
            admitted={"status":"abstain","reason":"unsupported"})
        self.assertIsNone(result["english"])
        self.assertFalse(result["pretrained_used"])
        self.assertEqual(seen,[])

    def test_existing_canonical_gates_live(self):
        class Stub:
            def rewrite(self,src):
                return "I cry."
        result=pretrained_english("nichōca",decoder=Stub())
        self.assertEqual(result["english"],"I cry.")
        self.assertTrue(result["model_proposal_accepted"])
        self.assertFalse(result["verified_translation"])
        result=pretrained_english("xyzzy",decoder=Stub())
        self.assertEqual(result["status"],"abstain")
        self.assertFalse(result["pretrained_used"])


class TestPersistentFeedback(unittest.TestCase):
    def feedback(self,n):
        return {
            "source_text":f"nichōca auh niquitta in cihuātl {n}",
            "source_url":"https://example.org/historical/folio",
            "work_id":"independent-work-1",
            "engine_commit":"0d6faca05b791726854c50ee733e55b4aba9e1d6",
            "failure_category":"english_composition",
            "user_suggested_english":"The suggested English may be wrong.",
            "failure_note":"The English choice is a candidate, not a confirmed historical reading",
            "nahuatl_variety":"Classical Nahuatl",
        }

    def test_pending_cannot_claim_gold(self):
        obj=self.feedback(1)
        obj["train_eligible"]=True
        with self.assertRaises(ValueError):
            stage(obj)
        obj.pop("train_eligible")
        self.assertEqual(stage(obj)["review_status"],"pending_human_review")
        obj["nahuatl_variety"]="Eastern Huasteca Nahuatl"
        with self.assertRaises(ValueError):
            stage(obj)

    def test_dedup_and_distinct_problem_frequency(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"pending.jsonl"
            for n in range(40):
                append_pending(p,self.feedback(n))
            self.assertEqual(len(read_queue(p)),40)
            s=summarize(p,threshold=40)
            self.assertEqual(s["total_distinct_inputs"],40)
            self.assertEqual(len(s["recurring_problems"]),1)
            self.assertEqual(s["approved_training_pairs_from_queue"],0)
            self.assertFalse(s["autonomous_training_or_promotion"])
            with self.assertRaisesRegex(ValueError,"Identical"):
                append_pending(p,self.feedback(1))


class TestApprovalGate(unittest.TestCase):
    def approved_pair(self,n,split,group):
        vals={k:"" for k in REQUIRED}
        vals.update({
            "pair_id":f"pair-{n}",
            "source_id":group,
            "source_title":"License-cleared example for software test",
            "source_url":f"https://example.org/{group}",
            "folio_or_segment":str(n),
            "source_date":"1540",
            "source_region":"Central Mexico",
            "nahuatl_variety":"Classical Nahuatl",
            "original_orthography":"nichōca" if n==1 else "nitlacua",
            "normalized_nahuatl":"nichōca" if n==1 else "nitlacua",
            "translation_text":"I cry." if n==1 else "I eat.",
            "translation_language":"en",
            "translator_or_editor":"Fixture Editor",
            "translation_source_url":f"https://example.org/{group}/translation",
            "alignment_type":"sentence_reviewed",
            "original_rights":"public_domain",
            "translation_rights":"permission_documented",
            "transcription_reviewed_by":"Fixture Transcription Reviewer",
            "translation_reviewed_by":"Fixture Translation Reviewer",
            "review_status":"approved",
            "split_group":group,
            "split":split,
            "notes":"SYNTHETIC TEST ONLY; no historical license or approval claimed"
        })
        return vals
    def write(self,path,rows):
        with path.open("w",encoding="utf-8",newline="") as file:
            writer=csv.DictWriter(file,fieldnames=REQUIRED)
            writer.writeheader()
            writer.writerows(rows)

    def test_actual_repo_has_no_approved_learning_pairs(self):
        rows=Path("research/translation_corpus/pairs.csv")
        errors,counts=check_records(rows)
        self.assertEqual(errors,[])
        self.assertEqual(counts["approved"],0)
        with self.assertRaisesRegex(ValueError,"Need APPROVED"):
            load_reviewed_pairs(rows)

    def test_document_disjoint_fixture_rows_are_readable(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"pairs.csv"
            self.write(p,[self.approved_pair(1,"train","source-a"),
                          self.approved_pair(2,"dev","source-b")])
            self.assertEqual(len(load_reviewed_pairs(p)["train"]),1)
            self.assertEqual(len(load_reviewed_pairs(p)["dev"]),1)
            bad=self.approved_pair(2,"dev","source-a")
            self.write(p,[self.approved_pair(1,"train","source-a"),bad])
            with self.assertRaisesRegex(ValueError,"leaked"):
                load_reviewed_pairs(p)

    def test_unreviewed_not_trainable(self):
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/"pairs.csv"
            row=self.approved_pair(1,"train","source-a")
            row.update(review_status="candidate",split="")
            self.write(p,[row])
            with self.assertRaisesRegex(ValueError,"Need APPROVED"):
                load_reviewed_pairs(p)


if __name__=="__main__":
    unittest.main()

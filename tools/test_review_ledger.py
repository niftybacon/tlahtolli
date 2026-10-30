"""Phase 5 ledger tests use invented NON-NAHUATL fixture metadata only."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from neural.correction_queue import append_pending
from neural.review_ledger import (
    GENESIS, SCHEMA, append_event, read_ledger, summarize
)

def feedback(n=1):
    return {
        "source_text":f"synthetic fixture {n} (NOT historical Nahuatl)",
        "source_url":"https://example.org/synthetic-fixture/1",
        "work_id":"fictional-unit-test-work",
        "engine_commit":"0d6faca05b791726854c50ee733e55b4aba9e1d6",
        "failure_category":"semantic",
        "user_suggested_english":"Invented software-testing sentence, NOT a translation.",
        "failure_note":"Synthetic, public fictional regression fixture.",
        "nahuatl_variety":"Classical Nahuatl"
    }

def reviewer(fp,decision="source_supported_hypothesis"):
    return {
        "source_fingerprint":fp, "decision":decision,
        "reviewer_name":"Fictional Fixture Reviewer (not a real person)",
        "rationale":"Software fixture only, not a source-approved grammatical or historical claim.",
        "evidence_urls":["https://example.org/synthetic-fixture/1",
                         "https://example.org/fake-published-source"],
        "rights_assessment":"unknown"
    }

def implementation(fp):
    return {
        "source_fingerprint":fp,
        "implementation_pr":"https://github.com/niftybacon/tlahtolli/pull/500000",
        "engine_commit":"0d6faca05b791726854c50ee733e55b4aba9e1d6",
        "changed_paths":["translator-grammar-ir.js"],
        "regression_tests":["tools/test_shared_grammar_ir.js"],
        "outcome_note":"Fictional test record; does NOT certify that a change occurred.",
        "measured_diagnostic":"Synthetic software test; NOT translation accuracy."
    }

class TestPersistentEvidenceLedger(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)
        self.queue = self.folder/"correction_queue.jsonl"
        self.ledger = self.folder/"review_ledger.jsonl"

    def stage(self,n=1):
        return append_pending(self.queue,feedback(n))

    def add(self,n=1):
        r=self.stage(n)
        event=append_event(self.ledger,"proposal",r["id"],{"pending":r},summarize(self.ledger)["head_hash"])
        return r,event

    def test_empty_new_ledger_cannot_claim_trained_or_human_review(self):
        s=summarize(self.ledger)
        self.assertEqual(s["head_hash"],GENESIS)
        self.assertEqual(s["events"],0)
        self.assertEqual(s["distinct_proposals"],0)
        self.assertEqual(s["approved_silver"],0)
        self.assertEqual(s["approved_gold"],0)
        self.assertEqual(s["training_pairs_created"],0)
        self.assertEqual(s["canonical_engine_changes_automatically_applied"],0)
        self.assertFalse(s["independent_human_reviewer_identity_verified"])

    def test_proposal_is_staged_snapshot_and_cannot_self_approve(self):
        r,e=self.add()
        self.assertEqual(e["kind"],"proposal")
        self.assertEqual(e["sequence"],1)
        self.assertEqual(e["previous_hash"],GENESIS)
        self.assertEqual(e["schema"],SCHEMA)
        for fld in ("train_eligible","gold_translation","automatically_promoted","independent_review_authenticated"):
            self.assertIs(e[fld],False)
        records=read_ledger(self.ledger)[1]
        self.assertEqual(records[r["id"]]["pending"],r)
        self.assertEqual(summarize(self.ledger)["by_declaration_status"],{"pending_review":1})

    def test_tampered_stage_provenance_flags_or_spelling_fails(self):
        r=self.stage()
        for mutate in (
            lambda x: x.update(train_eligible=True),
            lambda x: x.update(review_status="approved"),
            lambda x: x.update(source_text="rewritten unquoted input"),
            lambda x: x.update(nahuatl_variety="modern"),
            lambda x: x.update(fingerprint="a"*64),
            lambda x: x.update(rights="cleared"),
            lambda x: x.update(unknown_field=True)
        ):
            candidate=copy.deepcopy(r)
            mutate(candidate)
            with self.assertRaises(ValueError):
                append_event(self.ledger,"proposal",r["id"],{"pending":candidate},GENESIS)
        self.assertEqual(summarize(self.ledger)["events"],0)

    def test_stale_head_duplicate_and_chain_tampering(self):
        r,e=self.add()
        second=self.stage(2)
        with self.assertRaisesRegex(ValueError,"advanced"):
            append_event(self.ledger,"proposal",second["id"],{"pending":second},GENESIS)
        with self.assertRaisesRegex(ValueError,"Duplicate"):
            append_event(self.ledger,"proposal",r["id"],{"pending":r},e["event_hash"])
        self.assertEqual(summarize(self.ledger)["events"],1)
        stored=json.loads(self.ledger.read_text().strip())
        stored["data"]["pending"]["source_text"]="forged"
        self.ledger.write_text(json.dumps(stored)+"\n")
        with self.assertRaisesRegex(ValueError,"hash"):
            read_ledger(self.ledger)

    def test_review_declarations_and_rejections_are_not_promotions(self):
        r,e=self.add()
        negative=reviewer(r["fingerprint"],"needs_more_evidence")
        x=append_event(self.ledger,"review_note",r["id"],negative,e["event_hash"])
        self.assertEqual(summarize(self.ledger)["by_declaration_status"],{"needs_more_evidence":1})
        self.assertEqual(summarize(self.ledger)["training_pairs_created"],0)
        y=append_event(self.ledger,"review_note",r["id"],
                       reviewer(r["fingerprint"],"reject_candidate"),x["event_hash"])
        self.assertEqual(summarize(self.ledger)["by_declaration_status"],{"reject_candidate":1})
        with self.assertRaisesRegex(ValueError,"requires"):
            append_event(self.ledger,"implementation_report",r["id"],
                         implementation(r["fingerprint"]),y["event_hash"])
        self.assertEqual(read_ledger(self.ledger)[1][r["id"]]["review_count"],2)

    def test_review_requires_source_locator_and_no_approval(self):
        r,e=self.add()
        invalids=[
            lambda x:x.update(source_fingerprint="bad"),
            lambda x:x.update(decision="approved_silver"),
            lambda x:x.update(rights_assessment="automatically_licensed"),
            lambda x:x.update(evidence_urls=[]),
            lambda x:x.update(evidence_urls=["https://example.org/unrelated"]),
            lambda x:x.update(evidence_urls=["https://example.org/one"]*2),
            lambda x:x.update(evidence_urls=["http://user:password@example.org/secret"]),
            lambda x:x.update(reviewer_name=""),
            lambda x:x.update(train_eligible=True),
            lambda x:x.update(extra_gold=True),
        ]
        for change in invalids:
            payload=reviewer(r["fingerprint"])
            change(payload)
            with self.assertRaises(ValueError):
                append_event(self.ledger,"review_note",r["id"],payload,e["event_hash"])
        self.assertEqual(summarize(self.ledger)["events"],1)

    def test_implementation_report_does_not_certify_real_change(self):
        r,e=self.add()
        rev=append_event(self.ledger,"review_note",r["id"],
                         reviewer(r["fingerprint"]),e["event_hash"])
        impl=append_event(self.ledger,"implementation_report",r["id"],
                          implementation(r["fingerprint"]),rev["event_hash"])
        s=summarize(self.ledger)
        self.assertEqual(s["events"],3)
        self.assertEqual(s["by_declaration_status"],{"implementation_reported_not_verified":1})
        self.assertEqual(s["canonical_engine_changes_automatically_applied"],0)
        self.assertEqual(s["training_pairs_created"],0)
        with self.assertRaisesRegex(ValueError,"One implementation"):
            append_event(self.ledger,"implementation_report",r["id"],
                         implementation(r["fingerprint"]),impl["event_hash"])
        with self.assertRaisesRegex(ValueError,"after implementation"):
            append_event(self.ledger,"review_note",r["id"],
                         reviewer(r["fingerprint"]),impl["event_hash"])

    def test_implementation_fails_without_provenance_tests_or_source_declaration(self):
        r,e=self.add()
        with self.assertRaisesRegex(ValueError,"preceding"):
            append_event(self.ledger,"implementation_report",r["id"],
                         implementation(r["fingerprint"]),e["event_hash"])
        rev=append_event(self.ledger,"review_note",r["id"],
                         reviewer(r["fingerprint"]),e["event_hash"])
        for mutate in [
            lambda x:x.update(implementation_pr="https://github.com/other/repo/pull/1"),
            lambda x:x.update(engine_commit="123"),
            lambda x:x.update(changed_paths=["research/translation_corpus/pairs.csv"]),
            lambda x:x.update(changed_paths=["../outside.py"]),
            lambda x:x.update(regression_tests=[]),
            lambda x:x.update(measured_diagnostic=""),
            lambda x:x.update(gold_translation=True)
        ]:
            obj=implementation(r["fingerprint"]);mutate(obj)
            with self.assertRaises(ValueError):
                append_event(self.ledger,"implementation_report",r["id"],obj,rev["event_hash"])
        self.assertEqual(summarize(self.ledger)["events"],2)

    def test_multiple_candidates_preserve_independence_and_order(self):
        prior=GENESIS
        records=[]
        for n in range(1,41):
            r=self.stage(n)
            event=append_event(self.ledger,"proposal",r["id"],{"pending":r},prior)
            self.assertEqual(event["sequence"],n)
            prior=event["event_hash"]
            records.append(r["id"])
        self.assertEqual(len(set(records)),40)
        self.assertEqual(summarize(self.ledger)["distinct_proposals"],40)
        self.assertEqual(summarize(self.ledger)["head_hash"],prior)
        lines=self.ledger.read_text().splitlines()
        lines[2],lines[3]=lines[3],lines[2]
        self.ledger.write_text("\n".join(lines)+"\n")
        with self.assertRaisesRegex(ValueError,"sequence|chain"):
            read_ledger(self.ledger)

    def test_unknown_or_dropped_events_do_not_pass(self):
        r,e=self.add()
        obj=copy.deepcopy(e)
        for patch in (
            lambda x:x.update(automatically_promoted=True),
            lambda x:x.update(independent_review_authenticated=True),
            lambda x:x.update(new_key="forged"),
            lambda x:x.update(sequence=4),
            lambda x:x.update(previous_hash="bad")
        ):
            tampered=copy.deepcopy(obj)
            patch(tampered)
            self.ledger.write_text(json.dumps(tampered)+"\n")
            with self.assertRaises(ValueError):
                read_ledger(self.ledger)
        self.ledger.write_text(json.dumps(obj)+"\n")
        self.assertEqual(read_ledger(self.ledger)[2],e["event_hash"])

if __name__ == "__main__":
    unittest.main()

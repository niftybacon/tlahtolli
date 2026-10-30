"""Synthetic fixture tests: source checksum, variety isolation, Spanish task."""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import neural.intake_florentine_axolotl as intake
from neural.corpus import inspect_record

class SourceIntakeTests(unittest.TestCase):
    def test_florentine_uses_prior_real_scan_checksum_and_disjoint_books(self):
        texts={}
        known={"books":[]}
        for n,title in intake.BOOKS:
            # Synthetic source is never claimed to be historical Nahuatl.
            content="\n".join(f"synthetic fake manuscript line {j} text." for j in range(70))
            texts[n]=content
            known["books"].append({"book":n,"source_sha256":hashlib.sha256(content.encode()).hexdigest()})
        rows,meta=intake.florentine_rows(texts,known)
        self.assertEqual(len(meta),12)
        self.assertGreater(len(rows),12)
        self.assertTrue(all(r["rights"]=="fair_use_assessed" for r in rows))
        self.assertTrue(all(r["split"]=="dev" for r in rows if "book-5" in r["work_id"]))
        self.assertTrue(all(r["split"]=="train" for r in rows if "book-5" not in r["work_id"]))
        texts[4]+="CORRUPTION"
        with self.assertRaisesRegex(ValueError,"differs"):
            intake.florentine_rows(texts,known)

    def test_axolotl_5993_exact_classical_rows_and_spanish_no_modern(self):
        buff=io.StringIO()
        writer=csv.writer(buff,lineterminator="\n")
        for n in range(16111):
            if n<5993:
                writer.writerow(["Un texto español "+str(n),"auh yn nahuatl "+str(n),
                                 "Classical Nahuatl","Test historical work "+str(n%4),"nci"])
            else:
                writer.writerow(["Modern Spanish","Modern nahuatl",
                                 "Eastern Huasteca Nahuatl","modern work","nhe"])
        raw=buff.getvalue().encode()
        expected=hashlib.sha1(f"blob {len(raw)}\0".encode()+raw).hexdigest()
        old=intake.AXO_SHA
        try:
            intake.AXO_SHA=expected
            rows,meta=intake.axolotl_rows(raw)
            self.assertEqual(meta["strict_classical_label_records"],5993)
            self.assertEqual(meta["accepted_nahuatl_records"],5993)
            self.assertGreater(meta["short_candidate_spanish_pairs"],0)
            self.assertTrue(all(r["variety"]=="Classical Nahuatl" for r in rows))
            self.assertTrue(all(r["translation"]["language"]=="es" for r in rows if "translation" in r))
            self.assertTrue(all(r["translation"]["alignment"]=="candidate" for r in rows if "translation" in r))
        finally:
            intake.AXO_SHA=old
        with self.assertRaisesRegex(ValueError,"blob changed"):
            intake.axolotl_rows(raw+b" ")

    def test_original_and_spanish_translation_rights_are_independent(self):
        r={
            "record_id":"foo","work_id":"book-1",
            "source_url":intake.SOURCE_HOOK,"variety":"Classical Nahuatl",
            "source_date":"1577","original":"nimitztlazohtla.",
            "transcription_status":"editorial","split":"train"
        }
        intake.rights(r,intake.SOURCE_HOOK)
        t={"text":"Yo te quiero.","language":"es","alignment":"candidate",
           "source_url":intake.AXO_URL}
        intake.rights(t,intake.AXO_URL)
        r["translation"]=t
        ex=inspect_record(r)
        self.assertEqual(ex.translation_language,"es")
        self.assertEqual(ex.translation_weight,0.15)
        self.assertEqual(ex.rights,"fair_use_assessed")

if __name__=="__main__":
    unittest.main()

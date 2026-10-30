#!/usr/bin/env python3
"""Synthetic tests of source-specific fair-use research *intake*, not legal advice."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from neural.corpus import inspect_record, load_corpus, summarize, CorpusError

def row():
    return {
      "record_id": "fictional-folio-1",
      "work_id": "fictional-source-work",
      "source_url": "https://example.org/book/1/folio/1r",
      "variety": "Classical Nahuatl",
      "source_date": "1577",
      "original": "Fictional only. Not a Nahuatl corpus record.",
      "transcription_status": "editorial",
      "rights": "fair_use_assessed",
      "acquisition_url": "https://example.org/lawfully-obtained-edition",
      "assessment_url": "https://example.org/review/source-specific",
      "assessment_note": "This dummy review describes a hypothetical research use only; it is not an actual legal approval.",
      "no_source_redistribution": True,
      "split": "train"
    }

class FairUseIntake(unittest.TestCase):
    def test_metadata_qualified_training_path(self):
        rec=inspect_record(row())
        self.assertEqual(rec.rights, "fair_use_assessed")
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"fictional-private.jsonl"
            path.write_text(json.dumps(row())+"\n",encoding="utf-8")
            summary=summarize(load_corpus(path))
            self.assertEqual(summary["fair_use_assessed_source_records"],1)
            self.assertIsNone(summary["independent_translation_accuracy"])

    def test_missing_legal_review_does_not_auto_allow(self):
        for field in ("acquisition_url","assessment_url","assessment_note","no_source_redistribution"):
            with self.subTest(field=field):
                record=row()
                del record[field]
                with self.assertRaises(CorpusError):
                    inspect_record(record)

    def test_translation_has_independent_fair_use_requirements(self):
        record=row()
        record["translation"]={
          "text": "Fictional English pair; only a synthetic data validation test.",
          "language": "en",
          "rights": "fair_use_assessed",
          "source_url": "https://example.org/published-english-edition",
          "alignment": "candidate"
        }
        with self.assertRaises(CorpusError):
            inspect_record(record)
        record["translation"].update({
          "acquisition_url": "https://example.org/lawfully-obtained-english",
          "assessment_url": "https://example.org/review/translation-specific",
          "assessment_note": "This review concerns the English edition distinctly from the original manuscript.",
          "no_source_redistribution": True
        })
        e=inspect_record(record)
        self.assertTrue(e.experimental_parallel)
        self.assertEqual(e.translation_weight,0.15)

    def test_all_rights_reserved_is_not_itself_legal_basis(self):
        record=row()
        record["rights"]="all_rights_reserved"
        with self.assertRaises(CorpusError):
            inspect_record(record)


if __name__=="__main__":
    unittest.main()

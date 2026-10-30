"""Collation checks prevent misaligned literary text from posing as verified source."""
from __future__ import annotations
from copy import deepcopy
import unittest

from tools.verify_brinton_parallel_source import (
    AttestationError, SOURCE_BLOB_SHA, SOURCE_REPO, git_blob_sha, verify_record
)


class BrintonPrintedSourceAuditTests(unittest.TestCase):
    def fixture(self):
        lines = [
            "ANCIENT NAHUATL POEMS.\n", "I.\n", "_SONG TITLE_\n",
            "1. atl.\n", "1. water.\n",
            "2. xochitl.\n", "2. flower.\n", "NOTES.\n",
        ]
        root = f"https://github.com/{SOURCE_REPO}/blob/master/12219.txt"
        row = {
            "record_id": "brinton-1890-poetry-i-01",
            "source_blob_sha": SOURCE_BLOB_SHA,
            "source_url": root + "#L4",
            "original": "atl.",
            "translation": {
                "source_url": root + "#L5", "text": "water.",
                "language": "en", "alignment": "candidate",
            },
        }
        return lines, row

    def test_correct_original_and_english_stanza_are_collated(self):
        lines, row = self.fixture()
        result = verify_record(row, lines, prose_begin=0, prose_end=7)
        self.assertEqual(result["song"], "I")
        self.assertEqual(result["verse"], 1)

    def test_changed_nahuatl_rejected(self):
        lines, row = self.fixture()
        row["original"] = "xochitl."
        with self.assertRaisesRegex(AttestationError, "Nahuatl differs"):
            verify_record(row, lines, prose_begin=0, prose_end=7)

    def test_changed_english_rejected(self):
        lines, row = self.fixture()
        row["translation"]["text"] = "flower."
        with self.assertRaisesRegex(AttestationError, "English differs"):
            verify_record(row, lines, prose_begin=0, prose_end=7)

    def test_misaligned_stanza_rejected(self):
        lines, row = self.fixture()
        row["translation"]["source_url"] = row["translation"]["source_url"].replace("#L5", "#L7")
        with self.assertRaisesRegex(AttestationError, "same-number|Nahuatl differs|same printed poem section"):
            verify_record(row, lines, prose_begin=0, prose_end=7)

    def test_synthetic_gold_promotion_rejected(self):
        lines, row = self.fixture()
        row["translation"]["alignment"] = "reviewed"
        with self.assertRaisesRegex(AttestationError, "cannot promote"):
            verify_record(row, lines, prose_begin=0, prose_end=7)

    def test_bad_git_object_rejected(self):
        lines, row = self.fixture()
        row["source_blob_sha"] = "0" * 40
        with self.assertRaisesRegex(AttestationError, "Git object SHA changed"):
            verify_record(row, lines, prose_begin=0, prose_end=7)

    def test_git_blob_hash_is_content_sensitive(self):
        self.assertEqual(git_blob_sha(b""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391")
        self.assertNotEqual(git_blob_sha(b"atl"), git_blob_sha(b"ATL"))


if __name__ == "__main__":
    unittest.main()

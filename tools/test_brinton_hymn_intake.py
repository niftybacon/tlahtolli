#!/usr/bin/env python3
"""Reject notes/glosses and recognize only explicitly numbered Nahuatl stanzas."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.intake_brinton import extract,ROMAN


class BrintonIntakeTests(unittest.TestCase):
    def synthetic_page(self):
        source=["RIG VEDA AMERICANUS", "Daniel G. Brinton", "RIG VEDA AMERICANA"]
        for hymn in ROMAN:
            source.extend([hymn+". _Synthetic icuic._",
                           "   1. zzz aaa xxx, this is only a synthetic parser test.",
                           "continuation-on-original-text-line.",
                           "   2. xxx aaazz, also entirely synthetic.",
                           "_Gloss._",
                           "   1. NOT A TRAINING VERSE.",
                           "_Translation._",
                           "   1. Should never become a parallel training target."])
        source.append("GLOSSARY.")
        return "\n".join(source)

    def test_only_historical_stanza_sections_not_commentary(self):
        rows,meta=extract(self.synthetic_page())
        self.assertEqual(len(rows),40)
        self.assertEqual(meta["hymns"],20)
        self.assertEqual(meta["translation_pairs"],0)
        self.assertTrue(all(r["variety"]=="Classical Nahuatl" for r in rows))
        self.assertTrue(all("NOT A TRAINING VERSE" not in r["original"] for r in rows))
        self.assertTrue(all("Should never become" not in r["original"] for r in rows))
        self.assertTrue(all(r["work_id"]=="brinton1890-sahagun-hymns-all-20" for r in rows))
        self.assertEqual(rows[0]["original"],
                         "zzz aaa xxx, this is only a synthetic parser test. continuation-on-original-text-line.")

    def test_missing_chapter_fails_closed(self):
        text=self.synthetic_page().replace("XV. _Synthetic icuic._","unmarked title")
        with self.assertRaisesRegex(ValueError, "20 ordered"):
            extract(text)


if __name__=="__main__":
    unittest.main()

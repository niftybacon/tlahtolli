"""Test fenced source extraction without treating English commentary as Nahuatl."""
import sys
from pathlib import Path
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.intake_poetry_chimalpahin import extract_poems,extract_prose,ROMANS


def sample_poems():
    lines=[
       "The Project Gutenberg eBook of Ancient Nahuatl Poetry",
       "eBook #12219",
       "*** START OF THE PROJECT GUTENBERG EBOOK ANCIENT NAHUATL POETRY ***",
       "Introduction in English. This is not training data.",
       "ANCIENT NAHUATL POEMS."
    ]
    for roman in ROMANS:
        lines.extend([roman+".", "_TITLE OF POEM._",
                      "1. Nahuatl-original synthetic test text, not real Nahuatl.",
                      "1. English synthetic counterpart should only be a low quality candidate.",
                      "2. More fictional Nahuatl writing.",
                      "2. Further synthetic English translation.",
                      "3. A fictional third historical stanza, never an actual quotation.",
                      "3. A matching third English paraphrase.",
                      "4. Fictional final source stanza.",
                      "4. An English paraphrase of a synthetic stanza."])
    lines.extend(["NOTES.","1. Editorial notes definitely not source language.",
                  "*** END OF THE PROJECT GUTENBERG EBOOK ANCIENT NAHUATL POETRY ***"])
    return "\n".join(lines)


def sample_prose():
    lines=["eBook #21802","*** START OF THE PROJECT GUTENBERG EBOOK CHIMALPAHIN ***",
           "[Transcriber's Note: Modern English commentary must never enter training.]",
           "La decendencia y generacion de los Reyes, y Señores.",
           "Yntemoca yntlacamecayo, yn tlahtoque yn teteuhctin.",
           "auh yn mochiuh culhuacan, yn altepetl yn tlaca.",
           ""]
    for i in range(140):
        lines.extend([f"Auh yn tlahtoque {i}, yn tlaca ypan altepetl yn otonal.", 
                      "Auh yn teteuhctin yn chalca yn ic neçi tecpan.", ""])
    lines.extend(["[A page or more is missing here.]",
                  "Auh yn nican catca, auh yn ompa.",
                  "*** END OF THE PROJECT GUTENBERG EBOOK CHIMALPAHIN ***",
                  "Trademark licensing boilerplate is not Nahuatl."])
    return "\n".join(lines)


class ExtractorTests(unittest.TestCase):
    def test_poems_segment_historical_verses_from_commentary_and_english(self):
        rows,meta=extract_poems(sample_poems(),max_parallel_bytes=220)
        self.assertEqual(meta["poems"],27)
        self.assertEqual(meta["stanzas"],108)
        self.assertEqual(meta["paired_verse_number_anchors"],108)
        self.assertGreater(meta["weak_parallel_trainable_short_pairs"],0)
        self.assertTrue(all(r["original"].startswith(("Nahuatl-original","More fictional","A fictional","Fictional final")) for r in rows))
        self.assertTrue(all("Editorial notes" not in r["original"] for r in rows))
        self.assertTrue(all(r["work_id"]=="brinton1890-27-poems-all" for r in rows))
        self.assertTrue(all(r.get("translation",{}).get("alignment","candidate")=="candidate" for r in rows))
    def test_missing_poem_refused(self):
        text=sample_poems().replace("XVII.\n_TITLE", "_MISSING._\n_TITLE")
        with self.assertRaisesRegex(ValueError,"headings"):
            extract_poems(text)
    def test_prose_removes_editorial_markers_and_preserves_words(self):
        rows,meta=extract_prose(sample_prose())
        self.assertGreaterEqual(meta["paragraphs"],30)
        self.assertEqual(meta["translation_pairs"],0)
        self.assertTrue(all("Transcriber's" not in r["original"] for r in rows))
        self.assertTrue(all("generacion" not in r["original"] for r in rows))
        self.assertTrue(all(r["work_id"]=="chimalpahin21802-culhuacan-lineages" for r in rows))
        self.assertTrue(any("Yntemoca yntlacamecayo" in r["original"] for r in rows))
    def test_prose_truncated_refused(self):
        text=sample_prose().replace("Yntemoca yntlacamecayo,","CORRUPTED,")
        with self.assertRaisesRegex(ValueError,"title"):
            extract_prose(text)


if __name__=="__main__":
    unittest.main()

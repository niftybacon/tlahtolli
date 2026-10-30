"""Synthetic source contracts for UNAM Ayer 1485 Nahuatl-only research intake."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.intake_sahagun_sermons import index_sermons,page_source,score_nahuatl,presentation_page_range


def fake_index():
    starts=[5+i*3 for i in range(64)]
    starts[-1]=197
    return "<html><body>"+ "".join(
      f'<a href="ayer1485p?s=ayer1485-{p}">[Sermón {i+1}]</a>'
      for i,p in enumerate(starts)
    )+"</body></html>"


def fake_page(sermon=1):
    actual="In axcan in notlaçopilhuane, auh in totecuyo dios. "*20
    return f'''<html><body><h2>[Sermón {sermon}:] Primer domingo</h2>
    <div class="card"><div class="card-header"><h5>Transcripción</h5></div>
      <div class="card-body sem-manuscrito-texto">
        <p>La transcripción está aquí en un test de español editorial.</p>
        <p class="center">Dominica prima adventus domini</p>
        <p>{actual}</p>
        <p>Prima pars</p>
        <p>{actual} <sup>3</sup></p>
      </div>
    </div>
    <div class="card"><div class="card-header"><h5>Traducción</h5></div>
      <div class="card-body sem-manuscrito-texto"><p>Texto español moderno.</p>
      <p>Esta frase no debe contaminar nuestra fuente en náhuatl.</p></div>
    </div></body></html>'''


class TestSahagunIntake(unittest.TestCase):
    def test_index_64_source_document_boundaries(self):
        texts=index_sermons(fake_index())
        self.assertEqual(len(texts),64)
        self.assertEqual(texts[0]["page"],5)
        self.assertEqual(texts[-1]["page"],197)
        self.assertEqual(len({x["page"] for x in texts}),64)

    def test_nahuatl_transcription_not_modern_spanish(self):
        page=page_source(fake_page(),expected_sermon=1)
        self.assertGreater(len(page["paragraphs"]),0)
        self.assertTrue(all("to" in p for p in page["paragraphs"]))
        self.assertTrue(all("debe contaminar" not in p for p in page["paragraphs"]))
        self.assertTrue(all("Prima pars" != p for p in page["paragraphs"]))
        self.assertEqual(len(page["text_sha256"]),64)

    def test_wrong_page_or_missing_source_refused(self):
        with self.assertRaisesRegex(ValueError,"Unexpected sermon"):
            page_source(fake_page(2),expected_sermon=1)
        with self.assertRaisesRegex(ValueError,"No independent historical transcription"):
            page_source(fake_page().replace("Transcripción","Unrelated"),expected_sermon=1)

    def test_manuscript_range_does_not_invent_missing_folios(self):
        h='<html><h2>[Sermón 57]</h2><div>(Ms. 1485, Col. Ayer, p. 177)</div></html>'
        self.assertEqual(presentation_page_range(h,sermon=57,start=177,next_start=181),(177,177))
        with self.assertRaisesRegex(ValueError,"Invalid source page span"):
            presentation_page_range(h,sermon=57,start=176,next_start=181)
        h_alt='<html><h2>[Sermón 26]</h2><div>(Ms. 1485 Ayer, p. 90-93)</div></html>'
        self.assertEqual(presentation_page_range(h_alt,sermon=26,start=90,next_start=94),(90,93))
        h2='<html><h2>[Sermón 64]</h2><div>(Ms. 1485, Col. Ayer, p. 197-198)</div></html>'
        self.assertEqual(presentation_page_range(h2,sermon=64,start=197,next_start=199),(197,198))

    def test_conservative_ratio(self):
        self.assertGreater(score_nahuatl("auh yn inic ca in yn nican")[1],0.5)
        self.assertEqual(score_nahuatl("La versión moderna y nuestra traducción en español")[0],0)


if __name__=="__main__":
    unittest.main()

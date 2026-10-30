"""Synthetic fixtures for work-identified Temoa Nahuatl-only corpus intake."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.intake_temoa_chimalpahin import (
    WORKS,paths_for_work,extract_page,technical_spans,source_record,
)
from neural.corpus import inspect_record

def page(*,title="3 Relacion de Chimalpahin",folio="134v"):
    nah="Nican yn iuh quitohua huehuetque auh yn acico inic yn nican. "*15
    spa="La traducción española y sus editores no son el texto original. "*13
    return f'''<html><h2>{title}</h2><h3>folio: {folio}</h3>
    <section class="parrafos">
      <div class="parrafo"><h4>{folio} 1</h4><article class="nahuatl">{nah}</article>
      <article class="traduccion">{spa}</article></div>
      <div class="parrafo"><h4>{folio} 2</h4><article class="nahuatl">
      Auh yn nican inic ticmatizque yn tlahtoque. {nah}</article></div>
      <div class="parrafo"><h4>{folio} 3</h4>
        <article class="notes">French notes, editor's commentary.</article>
      </div>
    </section>
    <div class="divMenuFolios">
       <a href="/3-relacion-de-chimalpahin/134v">134v</a>
       <a href="/3-relacion-de-chimalpahin/135v">135v</a>
       <a href="/3-relacion-de-chimalpahin/135v">135v duplicate</a>
    </div></html>'''

class Tests(unittest.TestCase):
    def test_strict_source_allowlist(self):
        self.assertEqual(len(WORKS),5)
        self.assertEqual(WORKS["anales-mexicanos"]["split"],"dev")
        self.assertFalse(any("florentine" in x or "cantares" in x for x in WORKS))
    def test_folio_selector(self):
        links=paths_for_work(page(),"3-relacion-de-chimalpahin")
        self.assertEqual(len(links),2)
        self.assertEqual(links[0],"https://temoa.iib.unam.mx/3-relacion-de-chimalpahin/134v")
        self.assertEqual(links[1],"https://temoa.iib.unam.mx/3-relacion-de-chimalpahin/135v")
    def test_exact_nahuatl_panel_and_no_fabricated_translation(self):
        articles,stats=extract_page(page(),slug="3-relacion-de-chimalpahin",expected_folio="134v")
        self.assertEqual(len(articles),2)
        self.assertEqual(stats["folio"],"134v")
        self.assertTrue(all("nican" in x for x in articles))
        self.assertTrue(all("traducción española" not in x for x in articles))
        self.assertEqual(len(stats["text_sha256"]),64)
    def test_wrong_source_and_folio_rejected(self):
        with self.assertRaisesRegex(ValueError,"wrong historical work"):
            extract_page(page(),slug="8-relacion-de-chimalpahin")
        with self.assertRaisesRegex(ValueError,"folio route"):
            extract_page(page(),slug="3-relacion-de-chimalpahin",expected_folio="140r")
    def test_technical_containers_never_truncate_or_change_unicode(self):
        source="nimitztlazohtla" * 1200+"\u00e7 "
        cuts=list(technical_spans(source,cap=200))
        self.assertEqual("".join(cuts),source)
        self.assertTrue(all(len(x)<=200 for x in cuts))
        self.assertGreater(len(cuts),60)
    def test_corpus_rights_and_canonical_language_scope(self):
        obj=source_record(source_id=WORKS["3-relacion-de-chimalpahin"]["id"],
           folio="140r",article=2,chunk=1,
           text="Nican yn iuh quitohua huehuetque.",
           url="https://temoa.iib.unam.mx/3-relacion-de-chimalpahin/140r",
           metadata=WORKS["3-relacion-de-chimalpahin"])
        item=inspect_record(obj)
        self.assertIsNone(item.translation)
        self.assertEqual(item.rights,"fair_use_assessed")
        self.assertEqual(item.work_id,"chimalpahin-third-relacion-bnf-mex74")
        self.assertEqual(item.split,"train")

if __name__=="__main__":
    unittest.main()

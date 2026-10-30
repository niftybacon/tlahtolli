"""Manuscript-aware, source-separated historical Nahuatl training from Temoa.

Research only: the digital transcriptions are editorial UNAM works; no
public redistribution, bypassing website controls, Spanish translation
training, or manuscript/English-gold certification. See the separate
source-specific assessment in docs/TEMOA_CHIMALPAHIN_RESEARCH.md.
"""
from __future__ import annotations
from collections import Counter
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import requests
from .corpus import load_corpus

BASE="https://temoa.iib.unam.mx"
ASSESSMENT_URL="https://github.com/niftybacon/tlahtolli/blob/main/docs/TEMOA_CHIMALPAHIN_RESEARCH.md"
RIGHTS_NOTE=(
    "Noncommercial, private linguistic research on legally accessible scholarly "
    "paleographic transcription with work-specific manuscript locators. Source "
    "edition and original manuscript have distinct protections. Historic content "
    "is processed transiently; no original transcription, translation or modern "
    "editorial annotation is publicly redistributed. Output model release and "
    "market-substitution risks require independent reassessment."
)

# Explicit independent *works*, not the entire mixed-language Temoa database.
# Separate Chimalpahin texts, not one aggregated 'Chimalpahin' source. The
# short Project Gutenberg Culhuacan lineage was previously trained but is NOT
# re-imported. Florentine pages, Cantares, French lexica, graphic codices and
# Ayert sermons are explicitly out of scope.
WORKS={
    "3-relacion-de-chimalpahin":{
        "id":"chimalpahin-third-relacion-bnf-mex74",
        "title":"Chimalpahin, Third Relación (BNF Mex. 74)",
        "era":"early seventeenth century, Nahuatl historical account",
        "group":"chimalpahin","split":"train",
    },
    "8-relacion-de-chimalpahin":{
        "id":"chimalpahin-eighth-relacion-bnf-mex74",
        "title":"Chimalpahin, Eighth Relación (BNF Mex. 74)",
        "era":"early seventeenth century, Nahuatl historical account",
        "group":"chimalpahin","split":"train",
    },
    "cuauhtitlan-anales":{
        "id":"anales-de-cuauhtitlan-codice-chimalpopoca",
        "title":"Anales de Cuauhtitlan (Códice Chimalpopoca)",
        "era":"sixteenth-century Nahuatl historical annals, modern paleography",
        "group":"independent_historical_prose","split":"train",
    },
    "la-leyenda-de-los-soles":{
        "id":"leyenda-de-los-soles-codice-chimalpopoca",
        "title":"Leyenda de los Soles (Códice Chimalpopoca)",
        "era":"1558 written Nahuatl cosmogonic narrative, modern paleography",
        "group":"independent_historical_prose","split":"train",
    },
    "anales-mexicanos":{
        "id":"anales-mexicanos-bnf-source",
        "title":"Anales Mexicanos (historical annals)",
        "era":"colonial Nahuatl historical annals, document date to be verified",
        "group":"independent_historical_prose","split":"dev",
    },
}
# Temoa source .article.nahuatl often contains long paragraphs, some whole
# manuscript blocks. A JSONL span is a technical byte-training container,
# NEVER a claim of historical sentence, morpheme, or transcription boundary.
CHUNK_CHARS=6000
TEXT_LIMIT=2_600_000
START_WORDS={"yn","in","auh","nic","nican","ca","inic","tla","ye","oncan","ynic","ihuan","yhuan","ynipan","axcan","ynin","y"}
FOLIO=re.compile(r"\d{1,4}[rv]?")
SPAN_HASH=re.compile(r"[a-zA-ZÀ-ÿ]")


def paths_for_work(html:str,slug:str)->list[str]:
    soup=BeautifulSoup(html,"html.parser")
    heading=soup.select_one("h2")
    if not heading:raise ValueError(f"Temoa source {slug} lacks work title")
    hrefs=[]
    for node in soup.select("a[href]"):
        href=urljoin(BASE,node.get("href",""))
        parsed=urlparse(href)
        if parsed.netloc!="temoa.iib.unam.mx": continue
        prefix=f"/{slug}/"
        if not parsed.path.startswith(prefix): continue
        folio=parsed.path[len(prefix):].strip("/")
        if not FOLIO.fullmatch(folio):continue
        if href not in hrefs: hrefs.append(href)
    # For unified articles such as Cuauhtitlan Anales, Temoa uses a single
    # virtual folio 0 and has no separate physical-page links.
    if not hrefs:return [f"{BASE}/{slug}"]
    if len(hrefs)>180:raise ValueError("Unexpected excessive source folio links")
    return hrefs


def extract_page(html:str, *, slug:str,expected_folio:str|None=None)->tuple[list[str],dict]:
    soup=BeautifulSoup(html,"html.parser")
    h2=soup.select_one("h2")
    if not h2 or h2.get_text(" ",strip=True).casefold()!=(
        "3 relacion de chimalpahin" if slug=="3-relacion-de-chimalpahin" else
        "8 relacion de chimalpahin" if slug=="8-relacion-de-chimalpahin" else
        "cuauhtitlan anales" if slug=="cuauhtitlan-anales" else
        "la leyenda de los soles" if slug=="la-leyenda-de-los-soles" else
        "anales mexicanos"):
        raise ValueError(f"{slug}: wrong historical work identity")
    folio_tag=soup.select_one("h3")
    folio=folio_tag.get_text(" ",strip=True).removeprefix("folio:").strip() if folio_tag else ""
    if expected_folio is not None and folio!=expected_folio:
        raise ValueError(f"{slug}: folio route {expected_folio} differs from source {folio}")
    items=[]
    seen=set()
    rejected=0
    for article in soup.select("article.nahuatl"):
        # This DOM selector is critical: modern Spanish/French translator
        # markup lives in separate panels, not 'article.nahuatl'.
        for tag in article(["script","style","sup","button"]):tag.decompose()
        t=" ".join(article.stripped_strings)
        # Do NOT add accents, segment morphemes, fix source spelling, or
        # fill missing folios with imaginary words.
        t=" ".join(t.split())
        if len(t)<48 or not SPAN_HASH.search(t):
            rejected+=1
            continue
        if t in seen:
            rejected+=1
            continue
        seen.add(t)
        # Reject obvious Spanish/French-dominant material; short-code
        # switches in historical Nahuatl are not claimed resolved.
        words=re.findall(r"[a-zA-ZÀ-ÿ]+",t.casefold())
        nah_hits=sum(w in START_WORDS for w in words)
        if len(words)>30 and nah_hits<3:
            rejected+=1
            continue
        items.append(t)
    if not items:
        return [],{"folio":folio,"articles_total":len(soup.select("article.nahuatl")),
                  "articles_excluded":rejected,"text_sha256":None}
    digest=hashlib.sha256("\n".join(items).encode("utf-8")).hexdigest()
    return items,{"folio":folio,"articles_total":len(soup.select("article.nahuatl")),
                  "articles_excluded":rejected,"text_sha256":digest}


def technical_spans(text:str, cap:int=CHUNK_CHARS):
    if cap<64:raise ValueError("Chunk limit too small")
    for start in range(0,len(text),cap):
        span=text[start:start+cap]
        if span:yield span


def source_record(*, source_id:str,folio:str,article:int,chunk:int,
                  text:str,url:str,metadata:dict)->dict:
    obj={
        "record_id":f"temoa-{source_id}-{folio.replace('/','_')}-a{article:04d}-c{chunk:03d}",
        "work_id":source_id,
        "source_url":url,
        "source_date":metadata["era"],
        "variety":"Classical Nahuatl",
        "transcription_status":"editorial",
        "original":text,
        "split":metadata["split"],
        "rights":"fair_use_assessed",
        "acquisition_url":url,
        "assessment_url":ASSESSMENT_URL,
        "assessment_note":RIGHTS_NOTE,
        "no_source_redistribution":True
    }
    return obj


def collect(*,output:str,slugs:list[str]|None=None,delay:float=0.3)->dict:
    if delay<0:raise ValueError("Delay cannot be negative")
    names=slugs or list(WORKS)
    if not names or len(set(names))!=len(names) or any(n not in WORKS for n in names):
        raise ValueError("Only reviewed Temoa historical source works allowed")
    sess=requests.Session()
    sess.headers.update({"User-Agent":"Tlahtolli manuscript noncommercial academic research (https://github.com/niftybacon/tlahtolli)","Accept":"text/html"})
    def fetch(url):
        error=None
        for attempt in range(3):
            try:
                r=sess.get(url,timeout=65,allow_redirects=True)
                r.raise_for_status()
                if urlparse(r.url).netloc!="temoa.iib.unam.mx" or not 500<len(r.content)<TEXT_LIMIT:
                    raise ValueError("Unexpected Temoa URL or response content")
                return r.content.decode("utf-8-sig")
            except (ValueError,requests.RequestException) as exc:
                error=exc
                time.sleep(1+attempt)
        raise RuntimeError(f"Cannot inspect historical source {url}: {error}")
    rows=[]
    count={}
    duplicates=set()
    for slug in names:
        meta=WORKS[slug];index=f"{BASE}/{slug}"
        listing=fetch(index)
        locators=paths_for_work(listing,slug)
        if len(locators)<1:raise ValueError(f"Empty Temoa work index {slug}")
        source_units=0;copied=0;hashes=[];folio_articles=0;empty=0
        for n,url in enumerate(locators,1):
            html=listing if url.rstrip("/")==index else fetch(url)
            expected=urlparse(url).path.rsplit("/",1)[-1] if url!=index else None
            source,stat=extract_page(html,slug=slug,expected_folio=expected)
            if not source:empty+=1
            hashes.append({"folio":stat["folio"],"url":url,"html_sha256":hashlib.sha256(html.encode("utf-8")).hexdigest(),
                           "nahuatl_sha256":stat["text_sha256"],"articles":len(source)})
            folio_articles+=len(source)
            for i,text in enumerate(source,1):
                source_units+=len(text)
                for ci,part in enumerate(technical_spans(text),1):
                    # Exact duplicate records across source pages/works are
                    # not allowed to teach the model the same excerpt twice.
                    digest=hashlib.sha256(part.encode("utf-8")).hexdigest()
                    if digest in duplicates:copied+=1;continue
                    duplicates.add(digest)
                    rows.append(source_record(source_id=meta["id"],folio=stat["folio"],
                                             article=i,chunk=ci,text=part,url=url,metadata=meta))
            if delay:time.sleep(delay)
        count[slug]={"historical_work":meta["title"],"identity":meta["id"],
                     "work_group":meta["group"],"split":meta["split"],
                     "source_folio_pages":len(locators),"empty_or_short_pages":empty,
                     "editorial_articles":folio_articles,"source_chars_before_dedupe":source_units,
                     "duplicate_chunks_discarded":copied,"pages":hashes}
        print("TEMOA_HISTORICAL_WORK",slug,
              "folios",len(locators),"editorial_articles",folio_articles,
              "source_chars",source_units,"duplicate_chunks",copied,flush=True)
    folder=Path(output);folder.parent.mkdir(parents=True,exist_ok=True)
    folder.write_text("\n".join(json.dumps(row,ensure_ascii=False) for row in rows)+"\n",encoding="utf-8")
    validated=load_corpus(folder)
    summary={
        "format":"temoa-historical-nahuatl-prose-research-v1",
        "works":count,
        "source_works":len(names),
        "source_records":len(validated),
        "source_chars_in_admitted_records":sum(len(r["original"]) for r in rows),
        "source_english_or_spanish_pairs":0,
        "prior_translation_checkpoint_retained":True,
        "metadata_source":"Temoa UNAM digital editions; modern editorial transcription, not manuscript facsimile independently collated",
        "source_rights":"source-specific preliminary noncommercial fair-use research; no text or checkpoint public release",
        "independent_translation_accuracy":None
    }
    Path(output+".meta.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("TEMOA_HISTORICAL_INTAKE",json.dumps({
        k:v for k,v in summary.items() if k not in {"works"}},ensure_ascii=False),flush=True)
    return summary


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output",required=True)
    ap.add_argument("--slugs",nargs="*",default=None)
    ap.add_argument("--delay",type=float,default=0.3)
    args=ap.parse_args()
    collect(output=args.output,slugs=args.slugs,delay=args.delay)


if __name__=="__main__":
    main()

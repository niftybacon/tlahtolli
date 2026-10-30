"""Source-specific research intake for Sahagún's 64 Ayer 1485 sermons.

Respects UNAM's scholarly digital edition: historical Nahuatl transcription is
a distinct HTML panel, never the Spanish translation or editorial synopsis.
Public source references only; private trainer JSONL is never committed.

The original manuscript was first composed c. 1540, copied in 1548 and
amended in 1563. The 2022 scholarly edition belongs to UNAM under CC
BY-NC-SA 4.0 (repository catalog); the website has separate usage terms.
Research basis and limitations in docs/TENTLI_AYER1485_RESEARCH.md.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from .corpus import load_corpus

BASE = "https://sermonesenmexicano.unam.mx/sem/"
INDEX = urljoin(BASE, "ayer1485i")
UNAM_LICENSE_RECORD = "https://ru.historicas.unam.mx/handle/20.500.12525/3366?show=full"
REVIEW = "https://github.com/niftybacon/tlahtolli/blob/main/docs/TENTLI_AYER1485_RESEARCH.md"
ASSESSMENT = (
    "Private, noncommercial, attribution-retaining historical language research "
    "on the publicly accessible 2022 UNAM scholarly edition; historical source "
    "is separately identified from modern Spanish translations and web markup. "
    "No copyrighted source text, parallel translations or public-model weights "
    "will be redistributed. Publication and website terms require separate review."
)
NAHUATL = {
    "in", "yn", "auh", "inic", "ynic", "ca", "ma", "amo", "no", "axcan",
    "intla", "iz", "nican", "notlaçopilhuane", "yevatl", "iuh", "quim",
    "izcatqui", "amo", "tla", "iquac", "quetoa", "toteucyo", "tocnihuan",
}
MAX_PAGE_CHARS = 18000


def index_sermons(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    found = []
    for a in soup.select('a[href]'):
        href = a.get("href", "")
        m = re.search(r"ayer1485p\?s=ayer1485-(\d+)", href)
        if m:
            page = int(m.group(1))
            if not 1 <= page <= 210:
                raise ValueError("Unreasonable manuscript page index")
            found.append({"number": len(found)+1, "page": page,
                          "title": a.get_text(" ", strip=True)[:200]})
    if len(found) != 64 or len({r["page"] for r in found}) != 64:
        raise ValueError(f"Expected 64 independent historical sermon starts, got {len(found)}")
    if [r["page"] for r in found] != sorted(r["page"] for r in found):
        raise ValueError("Sermon order is not monotonic")
    if found[0]["page"] != 5 or found[-1]["page"] != 197:
        raise ValueError("The Ayer 1485 index changed from the inspected source")
    return found



def presentation_page_range(html: str, *, sermon: int, start: int, next_start: int) -> tuple[int, int]:
    """Get surviving folios from the source; don't invent missing pages."""
    soup=BeautifulSoup(html,"html.parser")
    heading=soup.find("h2")
    if heading is None or not re.search(r"\bSerm[oó]n\s+"+str(sermon)+r"\b",heading.get_text(" ",strip=True)):
        raise ValueError(f"Presentation heading mismatch for sermon {sermon}")
    txt=soup.get_text(" ",strip=True)
    match=re.search(r"\(\s*Ms\.?\s*1485[^)]{0,45}?\bp\.\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*\)",txt,re.I)
    if not match:
        raise ValueError(f"Missing historical manuscript page interval for sermon {sermon}")
    lo=int(match.group(1));hi=int(match.group(2) or lo)
    if lo!=start or hi<lo or hi>next_start or hi-lo>40:
        raise ValueError(f"Invalid source page span for sermon {sermon}: {lo}-{hi}; next starts {next_start}")
    return lo,hi

def score_nahuatl(text: str) -> tuple[int, float]:
    words = re.findall(r"[A-Za-zÀ-ÿ]+", text.casefold())
    if not words:
        return 0, 0.0
    hits = sum(word in NAHUATL for word in words)
    return hits, hits / len(words)


def page_source(html: str, *, expected_sermon: int) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.find("h2")
    if title is None:
        raise ValueError("Historical page has no sermon title")
    m = re.search(r"\bSerm[oó]n\s+(\d+)\b", title.get_text(" ",strip=True))
    if not m or int(m.group(1)) != expected_sermon:
        raise ValueError(f"Unexpected sermon: expected {expected_sermon}; heading = {title.get_text(' ',strip=True)[:100]}")
    transcript = None
    for heading in soup.find_all("h5"):
        if heading.get_text(" ", strip=True) == "Transcripción":
            card = heading.find_parent("div", class_="card")
            transcript = card.select_one("div.card-body.sem-manuscrito-texto") if card else None
            break
    if transcript is None:
        raise ValueError("No independent historical transcription panel")
    paragraphs = []
    seen = set()
    diagnostic = {"paragraphs_rejected_non_nahuatl_or_short": 0, "mixed_language_markup": False}
    # Preserving each p exactly as edited avoids falsely asserting word
    # boundaries, spelling normalization, or one-to-one Spanish alignment.
    for p in transcript.find_all("p", recursive=False):
        clone = BeautifulSoup(str(p), "html.parser")
        for tag in clone.find_all(["sup", "script", "style"]):
            tag.decompose()
        txt = " ".join(clone.get_text(" ", strip=True).split())
        if not txt:
            continue
        hits,ratio = score_nahuatl(txt)
        if len(txt) < 65 or hits < 3 or ratio < 0.025:
            diagnostic["paragraphs_rejected_non_nahuatl_or_short"] += 1
            continue
        if len(txt) > MAX_PAGE_CHARS:
            raise ValueError("Single source paragraph exceeds safety bound")
        if txt in seen:
            continue
        seen.add(txt)
        if re.search(r"(?:Luce|Mateo|Proverbios|Et tunc|capitulo|jesuchristo)",txt,re.I):
            diagnostic["mixed_language_markup"] = True
        paragraphs.append(txt)
    # Some manuscript pages contain only a very short incomplete opening
    # or Latin heading. The *sermon* must have source text; do not fabricate
    # a Nahuatl paragraph for an individual page.

    return {"sermon_number":expected_sermon,"paragraphs":paragraphs,
            "text_sha256":hashlib.sha256("\n".join(paragraphs).encode()).hexdigest(),
            "diagnostic":diagnostic}


def download_sermons(*, output: str, max_sermons: int = 64, delay: float = 0.27) -> dict:
    if not 1<=max_sermons<=64 or delay<0:
        raise ValueError("Invalid bounded research intake")
    session = requests.Session()
    session.headers.update({
        "User-Agent":"Tlahtolli Classical Nahuatl source research (https://github.com/niftybacon/tlahtolli)",
        "Accept":"text/html"
    })
    def get(url: str) -> str:
        error=None
        for attempt in range(3):
            try:
                response=session.get(url, timeout=45)
                response.raise_for_status()
                if len(response.content)>400000 or len(response.content)<1000:
                    raise ValueError("Unexpected sermon HTML byte size")
                if "sermonesenmexicano.unam.mx" not in response.url:
                    raise ValueError("Unexpected domain redirect")
                return response.content.decode("utf-8-sig")
            except (requests.RequestException, ValueError) as exc:
                error=exc
                time.sleep((attempt+1)*0.75)
        raise RuntimeError(f"Could not safely read source page {url}: {error}")
    starts=index_sermons(get(INDEX))
    rows=[];works=[];total_page=0;discarded=0;estimated_source_chars=0
    for i,spec in enumerate(starts[:max_sermons]):
        num,start=spec["number"],spec["page"]
        next_start=starts[i+1]["page"] if i+1<len(starts) else 199
        presentation=get(f"{BASE}ayer1485p?s=ayer1485-{start}")
        lo,hi=presentation_page_range(presentation,sermon=num,start=start,next_start=next_start)
        if delay:time.sleep(delay)
        # Entire sermon reserved as a single independent unit for dev,
        # preventing adjacent-page language memorization in evaluation.
        split="dev" if num % 8==0 else "train"
        locators=[];paragraphs=0;sermon_chars=0
        for page in range(lo,hi+1):
            url=f"{BASE}ayer1485c?p={page}&s=ayer1485-{start}"
            html=get(url)
            result=page_source(html,expected_sermon=num)
            total_page+=1
            found_page=0
            for j,span in enumerate(result["paragraphs"],1):
                rows.append({
                    "record_id":f"ayer1485-sermon-{num:02d}-page-{page:03d}-paragraph-{j:02d}",
                    "work_id":f"sahagun-ayer1485-sermon-{num:02d}",
                    "source_url":url,"source_date":"1548 copy of c. 1540 Nahuatl, revised 1563; UNAM 2022 edition",
                    "variety":"Classical Nahuatl","original":span,"split":split,
                    "transcription_status":"editorial",
                    "rights":"fair_use_assessed","acquisition_url":UNAM_LICENSE_RECORD,
                    "assessment_url":REVIEW,"assessment_note":ASSESSMENT,
                    "no_source_redistribution":True
                })
                found_page+=len(span)
            if found_page<=0:
                print("SERMON_PAGE_EXCLUDED_NO_NAHUATL",num,page,flush=True)
            estimated_source_chars+=found_page;sermon_chars+=found_page
            paragraphs+=len(result["paragraphs"])
            discarded+=result["diagnostic"]["paragraphs_rejected_non_nahuatl_or_short"]
            locators.append({"page":page, "source_sha256":hashlib.sha256(html.encode()).hexdigest(),
                             "transcription_sha256":result["text_sha256"],
                             "source_characters":found_page})
            if delay:
                time.sleep(delay)
        if sermon_chars < 1000:
            raise ValueError(f"Sermon {num} has insufficient historical Nahuatl: {sermon_chars} characters")
        works.append({
            "number":num, "name":spec["title"], "source_work_id":f"sahagun-ayer1485-sermon-{num:02d}",
            "split":split,"pages":locators,"paragraphs":paragraphs,"source_characters":sermon_chars
        })
        print("SERMON_INTAKE",num,"pages",len(locators),"paragraphs",paragraphs,
              "characters",sermon_chars,"split",split,flush=True)
    path=Path(output)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text("\n".join(json.dumps(r,ensure_ascii=False) for r in rows)+"\n",encoding="utf-8")
    valid=load_corpus(path)
    summary={
        "format":"tentli-sahagun-ayer1485-research-v1",
        "index_url":INDEX,"license_record_url":UNAM_LICENSE_RECORD,
        "sermons_found_in_live_index":len(starts),"sermons_imported":len(works),
        "pages":total_page,"Nahuatl_majority_editorial_paragraphs":len(rows),
        "historical_transcription_chars":estimated_source_chars,
        "non_nahuatl_or_short_paragraphs_excluded":discarded,
        "bilingual_targets":0,"language_of_modern_translation":"es_not_imported",
        "source_work_split":"sermon_disjoint","source_edition":"Sánchez Aguilera, UNAM 2022",
        "source_rights":"preliminary_private_fair_use_research_assessment",
        "independent_translation_accuracy":None,
        "sermons":works,"validated_records":len(valid)
    }
    (path.parent/(path.name+".meta.json")).write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("AYER1485_INTAKE_TOTALS",json.dumps({
      k:v for k,v in summary.items() if k not in {"sermons"}},ensure_ascii=False),flush=True)
    return summary


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",required=True)
    p.add_argument("--max-sermons",type=int,default=64)
    p.add_argument("--delay",type=float,default=0.27)
    a=p.parse_args()
    download_sermons(output=a.output,max_sermons=a.max_sermons,delay=a.delay)


if __name__=="__main__":
    main()

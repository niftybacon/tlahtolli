"""Source-bound extraction for two distinct U.S.-public-domain Nahuatl works.

Project Gutenberg #12219: Brinton's 27 Nahuatl poems, with optional
verse-number-paired English candidates. #21802: Chimalpahin historical prose.
Never feed English introduction, editor notes, glossary or licensing boilerplate.
No newly invented Nahuatl spelling, morphological facts, or English translation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path
from .corpus import load_corpus

POEMS_URL="https://www.gutenberg.org/ebooks/12219"
PROSE_URL="https://www.gutenberg.org/ebooks/21802"
ROMANS=("I","II","III","IV","V","VI","VII","VIII","IX","X",
        "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
        "XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII")
HEADING=re.compile(r"(?m)^([IVXLCDM]+)\.$")
VERSE=re.compile(r"^\s*(\d{1,2})\.\s+(.+)")
NOTES=re.compile(r"(?m)^NOTES\.\s*$")
EDITOR_NOTE=re.compile(r"\[[^\[\]]{0,300}\]")

def strip_gutenberg(text:str, ebook:int)->str:
    if f"eBook #{ebook}" not in text and f"eBook #{ebook}]" not in text:
        raise ValueError(f"Unexpected Gutenberg book number (wanted {ebook})")
    lines=text.splitlines()
    start=[i for i,line in enumerate(lines) if line.startswith("*** START OF THE PROJECT GUTENBERG EBOOK")]
    end=[i for i,line in enumerate(lines) if line.startswith("*** END OF THE PROJECT GUTENBERG EBOOK")]
    if len(start)!=1 or len(end)!=1 or end[0]<=start[0]:
        raise ValueError("Cannot distinguish actual source text from Gutenberg boilerplate")
    return "\n".join(lines[start[0]+1:end[0]])

def clean(text:str)->str:
    return " ".join(text.split())

def extract_poems(source:str, *, max_parallel_bytes:int=254):
    body=strip_gutenberg(source,12219)
    starts=list(re.finditer(r"(?m)^ANCIENT NAHUATL POEMS\.\s*$",body))
    if len(starts)!=1:
        raise ValueError("Poem-body header not found exactly once")
    body=body[starts[0].end():]
    note=NOTES.search(body)
    if not note:
        raise ValueError("Notes boundary missing; may absorb commentary")
    body=body[:note.start()]
    sections=list(HEADING.finditer(body))
    # Poem I repeats its Roman heading once above the Nahuatl title and
    # once above Brinton's English title. This is not a 28th manuscript
    # poem and must not trigger a false corpus failure.
    if len(sections)==28 and [m.group(1) for m in sections[:2]]==["I","I"]:
        between=body[sections[0].end():sections[1].start()].strip()
        if between.startswith("_") and between.endswith("_") and len(between)<150:
            sections.pop(1)
    found=[match.group(1) for match in sections]
    if found != list(ROMANS):
        raise ValueError(f"Missing/reordered poem headings: {found!r}")
    rows=[];paired=0;short=0;unpaired=0;long=0;verses_by_poem={}
    for i,h in enumerate(sections):
        section=body[h.end():sections[i+1].start() if i+1<len(sections) else len(body)]
        stanza=[]
        def append_numbered(number:int,nh:str,en:str|None):
            nonlocal paired,short,unpaired,long
            if not nh or len(nh)<4 or nh.startswith("[") or nh.startswith("_"):
                raise ValueError(f"Unclean Nahuatl stanza in {ROMANS[i]}:{number}")
            obj={
                "record_id":f"brinton12219-poem-{ROMANS[i]}-stanza-{number}",
                "work_id":"brinton1890-27-poems-all",
                "source_url":POEMS_URL,
                "variety":"Classical Nahuatl",
                "source_date":"1890 edition of colonial Nahuatl poetry",
                "original":nh,
                "transcription_status":"editorial",
                "rights":"public_domain",
                "split":"train"
            }
            if en:
                paired+=1
                # The source itself numbers two consecutive stanzas equally.
                # This is *weak* verse-level alignment, not literal/gloss gold.
                if len(nh.encode("utf-8"))<=max_parallel_bytes and len(en.encode("utf-8"))<=max_parallel_bytes:
                    obj["translation"]={
                        "text":en, "language":"en", "rights":"public_domain",
                        "source_url":POEMS_URL, "alignment":"candidate"}
                    short+=1
                else: long+=1
            else: unpaired+=1
            rows.append(obj)
        numbered=[]
        cur_num=None;fragments=[]
        for line in section.splitlines():
            matched=VERSE.match(line)
            if matched:
                if cur_num is not None:
                    numbered.append((cur_num,clean(" ".join(fragments))))
                cur_num=int(matched.group(1));fragments=[matched.group(2)]
            elif cur_num is not None and line.strip():
                fragments.append(line.strip())
        if cur_num is not None: numbered.append((cur_num,clean(" ".join(fragments))))
        if not numbered or numbered[0][0]!=1:
            raise ValueError(f"No anchored verse 1 in poem {ROMANS[i]}")
        j=0;last=0
        while j<len(numbered):
            num,nh=numbered[j]
            if num!=last+1:
                raise ValueError(f"Non-sequential Nahuatl verse in poem {ROMANS[i]}: {num} after {last}")
            en=None
            if j+1<len(numbered) and numbered[j+1][0]==num:
                en=numbered[j+1][1]
                j+=2
            else:
                # Do not misalign a missing English stanza with subsequent
                # Nahuatl verse, or invent English for incomplete edition.
                j+=1
            append_numbered(num,nh,en)
            last=num
        verses_by_poem[ROMANS[i]]=last
    if len(rows)<100 or paired<100 or short<1 or unpaired>12:
        raise ValueError(f"Suspicious poem extraction: {len(rows)} stanzas, {paired} paired, {short} short, {unpaired} unpaired")
    return rows,{
        "source":POEMS_URL,
        "source_sha256":hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "poems":len(ROMANS),"stanzas":len(rows),"verses_by_poem":verses_by_poem,
        "paired_verse_number_anchors":paired,"weak_parallel_trainable_short_pairs":short,
        "long_verse_pairs_not_silently_truncated":long,
        "unpaired_stanzas":unpaired,"independent_gold":0,"accuracy":None
    }

def extract_prose(source:str):
    body=strip_gutenberg(source,21802)
    # Transcriber's note explicitly marks the manuscript's editorial
    # overbars as tildes; preserve these rather than 'correcting' spelling.
    starts=list(re.finditer(r"(?m)^Yntemoca yntlacamecayo,",body))
    if len(starts)!=1:
        raise ValueError("Historical Nahuatl title must follow Spanish introduction exactly once")
    body=body[starts[0].start():]
    # Remove non-Nahuatl editorial annotation blocks only (not manuscript
    # spelling). Unbalanced brackets must fail rather than leak modern prose.
    if body.count("[")!=body.count("]"):
        raise ValueError("Unbalanced editor notes in prose")
    body=EDITOR_NOTE.sub(" ",body)
    if "[" in body or "]" in body:
        raise ValueError("Unremoved editorial notes")
    blocks=[clean(block) for block in re.split(r"\n\s*\n",body) if clean(block)]
    rows=[]
    for i,block in enumerate(blocks):
        if len(block)<12: continue
        if "Transcriber's" in block or "English translation is available" in block:
            raise ValueError("Editorial English leaked into source")
        rows.append({
            "record_id":f"chimalpahin21802-paragraph-{i+1:04d}",
            "work_id":"chimalpahin21802-culhuacan-lineages",
            "source_url":PROSE_URL,
            "variety":"Classical Nahuatl",
            "source_date":"colonial-era Chimalpahin witness, edited digitally 2007/2025",
            "original":block,
            "transcription_status":"editorial",
            "rights":"public_domain",
            "split":"train"
        })
    if len(rows)<30 or sum(len(r["original"]) for r in rows)<10000:
        raise ValueError("Chimalpahin prose seems truncated or improperly delimited")
    return rows,{
        "source":PROSE_URL,
        "source_sha256":hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "paragraphs":len(rows),"source_chars":sum(len(r["original"]) for r in rows),
        "translation_pairs":0,"independent_gold":0,"accuracy":None,
        "editor_note":"Project Gutenberg represents original overbars as tildes."
    }

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--poems",required=True)
    p.add_argument("--prose",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--max-parallel-bytes",type=int,default=254)
    a=p.parse_args()
    poetry,pmeta=extract_poems(Path(a.poems).read_text(encoding="utf-8-sig"),
                               max_parallel_bytes=a.max_parallel_bytes)
    prose,hmeta=extract_prose(Path(a.prose).read_text(encoding="utf-8-sig"))
    rows=poetry+prose
    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text("\n".join(json.dumps(x,ensure_ascii=False) for x in rows)+"\n",encoding="utf-8")
    load_corpus(out)
    summary={"format":"tentli-two-historical-works-v1","records":len(rows),
             "poetry":pmeta,"chimalpahin":hmeta,"trained_gold":0,
             "translation_accuracy":None}
    Path(str(out)+".meta.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("SOURCE_INTAKE_SUMMARY "+json.dumps(summary,ensure_ascii=False))

if __name__=="__main__":
    main()

#!/usr/bin/env python3
"""Extract only historic Nahuatl hymn stanzas from Brinton's 1890 US-PD text.

Not the Florentine Codex itself: Brinton mainly edits Sahagun's Madrid witness
and gives Florentine variants. No modern editorial English is automatically
assigned, and Brinton's English paraphrases are NOT asserted to be literal.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

SOURCE_URL = "https://www.gutenberg.org/ebooks/14993"
EDITION = "Brinton, Rig Veda Americanus (1890), Sahagun Madrid-based hymn edition"
HEADING = re.compile(r"^\s*([IVXLCDM]+)\.\s+_(.+?)_\s*$")
STANZA = re.compile(r"^\s{2,}(\d{1,2})\.\s+(.+)$")
STOP = re.compile(r"^\s*(?:_?(?:Var\.|Gloss\.|Translation\.|Notes?\.|Hymn\b)|\[Illustration|[IVXLCDM]+\.\s+_)", re.I)
ROMAN = ("I","II","III","IV","V","VI","VII","VIII","IX","X",
         "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX")


def extract(source: str) -> tuple[list[dict], dict]:
    if "RIG VEDA AMERICANUS" not in source.upper() or "Daniel G. Brinton" not in source:
        raise ValueError("Unexpected Gutenberg volume; reject source mismatch")
    lines = source.splitlines()
    starts = [i for i,s in enumerate(lines) if s.strip() == "RIG VEDA AMERICANA"]
    if len(starts)!=1:
        raise ValueError("Couldn't isolate the hymn body from the table of contents")
    beginning=starts[0]
    ends=[i for i in range(beginning+1,len(lines)) if lines[i].strip()=="GLOSSARY."]
    if len(ends)!=1:
        raise ValueError("Missing exact glossary boundary")
    body=lines[beginning+1:ends[0]]
    chapters: dict[str,list[tuple[int,str]]] = {}
    titles: dict[str,str] = {}
    current=None;active=False;number=None;chunks=[]
    def flush():
        nonlocal number,chunks
        if current is not None and number is not None:
            text=" ".join(chunks).strip()
            if not text or len(text)<8:
                raise ValueError("Empty or implausible stanza")
            chapters[current].append((number,text))
        number=None;chunks=[]
    for line in body:
        heading=HEADING.match(line)
        if heading and heading.group(1) in ROMAN:
            flush()
            current=heading.group(1)
            if current in chapters:
                raise ValueError("Duplicate hymn heading")
            chapters[current]=[];titles[current]=heading.group(2)
            active=True
            continue
        if current is None or not active:
            continue
        if STOP.match(line):
            flush();active=False
            continue
        stanza=STANZA.match(line)
        if stanza:
            flush()
            number=int(stanza.group(1))
            chunks=[stanza.group(2).strip()]
            continue
        if number is not None and line.strip():
            # Preserve the exact chosen Brinton spelling; join print-line wraps
            # but never normalize y/i, accents, spacing abbreviations or lemmas.
            chunks.append(line.strip())
    flush()
    if list(chapters)!=list(ROMAN) or any(not chapters[k] for k in ROMAN):
        raise ValueError("Expected all 20 ordered Brinton hymns with source verses")
    rows=[]
    for hymn in ROMAN:
        prev=0
        for verse,nh in chapters[hymn]:
            if verse<=prev:
                raise ValueError("Stanza numbering is not increasing for "+hymn)
            prev=verse
            rows.append({
                "record_id":f"brinton1890-hymn-{hymn}-stanza-{verse}",
                "work_id":"brinton1890-sahagun-hymns-all-20", "source_url":SOURCE_URL,
                "variety":"Classical Nahuatl", "source_date":"1890 edition of sixteenth-century Sahagun hymn witnesses",
                "original":nh, "transcription_status":"editorial", "rights":"public_domain",
                "split":"train"
            })
    summary={
        "source":SOURCE_URL,
        "editorial_witness":"Brinton 1890 reading; predominantly Madrid-based, Florentine variants separately cited",
        "source_sha256":hashlib.sha256(source.encode("utf-8")).hexdigest(),
        "hymns":len(chapters),"stanzas":len(rows),
        "per_hymn":{k:len(chapters[k]) for k in ROMAN},
        "translation_pairs":0,"independent_gold":0,
        "accuracy":None,"note":"Monolingual historical text only; Brinton English paraphrases not auto-aligned"
    }
    return rows,summary


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input",required=True,help="Original downloaded Project Gutenberg #14993 plain text")
    p.add_argument("--output",required=True,help="Local/private corpus JSONL path")
    a=p.parse_args()
    text=Path(a.input).read_text(encoding="utf-8-sig")
    rows,summary=extract(text)
    from neural.corpus import load_corpus
    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text("\n".join(json.dumps(row,ensure_ascii=False) for row in rows)+"\n",encoding="utf-8")
    load_corpus(out)
    out.with_suffix(out.suffix+".meta.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    print("HISTORICAL HYMNS "+json.dumps(summary))


if __name__=="__main__":
    main()

"""Source-locked intake of the previously scanned Florentine files and Axolotl.

This is for *private* historical-language research, not release of any source
edition. Rights review: docs/FC_AXOLOTL_RESEARCH_ASSESSMENT.md. Fair use is an
assessed claim under the existing research-only intake contract, not a license.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re

from .corpus import load_corpus
from tools.analyze_florentine_codex import BOOKS, RECORD

AXO_COMMIT="157f34300f4ca92c3d75b74ec14142916d75c30b"
AXO_SHA="90b7327fc4023ba529e1982f823ddeaee6e313e3"
AXO_URL=("https://github.com/ElotlMX/py-elotl/blob/"+AXO_COMMIT+
         "/elotl/corpora/axolotl.csv")
REVIEW="https://github.com/niftybacon/tlahtolli/blob/main/docs/FC_AXOLOTL_RESEARCH_ASSESSMENT.md"
SOURCE_NOTE=("Research-only study of lawfully downloaded public academic source. "
             "Copyright, editorial edition, acquisition and market effect reviewed "
             "for noncommercial language-model pattern study; no source redistribution "
             "or public model release is authorized by this metadata.")
FOLIO_HEADER=re.compile(r"(?i)^\s*(?:fo\.?\s*\d+|de los dioses\s+fo\.?\d*|de tlaloc.*fo\.?\d*|\s*fo\.\s*\d+)\s*$")
LATIN=re.compile(r"[A-Za-zÀ-ÿ]")
SOURCE_HOOK="https://zenodo.org/records/7213020"
MAX_SPAN=1350

def rights(obj:dict,url:str):
    obj.update({
        "rights":"fair_use_assessed",
        "acquisition_url":url,"assessment_url":REVIEW,
        "assessment_note":SOURCE_NOTE,"no_source_redistribution":True
    })


def florentine_rows(texts:dict[int,str],known:dict,*, dev_book:int=5):
    if set(texts)!={n for n,_ in BOOKS} or not 1<=dev_book<=12:
        raise ValueError("The source must contain all 12 already studied books")
    output=[]; counts={}
    for book,title in BOOKS:
        source=texts[book]
        sha=hashlib.sha256(source.encode("utf-8")).hexdigest()
        expected=next((b["source_sha256"] for b in known["books"] if b["book"]==book),None)
        if sha!=expected: raise ValueError(f"Florentine Book {book} differs from previous 12-book source scan")
        # A stable book-specific work identity ensures no folio or adjacent
        # text from the same book leaks to dev and train.
        split="dev" if book==dev_book else "train"
        work=f"florentine-zenodo7213020-book-{book}"
        # Preserve the printed line wrapping faithfully, instead of
        # inventing manuscript morpheme boundaries.
        lines=[]
        for raw in source.splitlines():
            s=raw.rstrip()
            if not s.strip():continue
            if FOLIO_HEADER.fullmatch(s):continue
            if not LATIN.search(s):continue
            lines.append(s)
        if len(lines)<40:
            raise ValueError(f"Florentine book {book}: no usable source transcription")
        buf=[];length=0;parts=[]
        for line in lines:
            if buf and length+len(line)+1>MAX_SPAN:
                parts.append("\n".join(buf));buf=[];length=0
            buf.append(line)
            length+=len(line)+1
        if buf:parts.append("\n".join(buf))
        for j,span in enumerate(parts,1):
            x={"record_id":f"florentine-{book:02d}-span-{j:05d}",
               "work_id":work,"source_url":f"https://zenodo.org/records/7213020",
               "variety":"Classical Nahuatl","source_date":"1577 manuscript; Berthoud 2022 digital transcription",
               "original":span,"transcription_status":"editorial","split":split}
            rights(x,SOURCE_HOOK)
            output.append(x)
        counts[str(book)]={"segments":len(parts),"split":split,"source_sha256":sha}
    return output,counts


def axolotl_rows(raw:bytes,*, max_bytes:int=254):
    git_sha=hashlib.sha1(f"blob {len(raw)}\0".encode()+raw).hexdigest()
    if git_sha!=AXO_SHA:
        raise ValueError(f"Pinned Axolotl git blob changed: {git_sha}")
    decoded=raw.decode("utf-8-sig")
    rows=list(csv.reader(io.StringIO(decoded)))
    if len(rows)!=16111:
        raise ValueError(f"Pinned Axolotl CSV expected 16,111 records, got {len(rows)}")
    valid=[(i,r) for i,r in enumerate(rows,1) if len(r)>=5 and
           r[2].strip()=="Classical Nahuatl" and r[4].strip()=="nci"]
    if len(valid)!=5993:
        raise ValueError(f"Expected 5,993 strict Classical Nahuatl/nci records, got {len(valid)}")
    results=[]; duplicate=set(); skipped=0; eligible=0
    for line,record in valid:
        spanish,nahuatl,variety,work,iso=(x.strip() for x in record[:5])
        if not nahuatl or not work or len(nahuatl)<5 or not LATIN.search(nahuatl):
            skipped+=1;continue
        normalized=(" ".join(nahuatl.casefold().split()),
                    " ".join(spanish.casefold().split()),work)
        if normalized in duplicate:skipped+=1;continue
        duplicate.add(normalized)
        name=hashlib.sha256(work.encode("utf-8")).hexdigest()[:16]
        x={
            "record_id":f"axolotl-source-row-{line:05d}",
            "work_id":f"axolotl-{name}","source_url":AXO_URL,
            "variety":"Classical Nahuatl",
            "source_date":"Historical Classical label from Axolotl; individual source date unverified",
            "original":nahuatl,"transcription_status":"editorial","split":"train",
        }
        rights(x,AXO_URL)
        # Spanish is ALWAYS labelled es, never pretended to be an English
        # target. No silent truncation or guessed sentence segmentation.
        if spanish and spanish.casefold()!=nahuatl.casefold() and (
            len(("es: "+nahuatl).encode("utf-8"))<=max_bytes and
            len(spanish.encode("utf-8"))<=max_bytes
        ):
            trans={"text":spanish,"language":"es","source_url":AXO_URL,"alignment":"candidate"}
            rights(trans,AXO_URL)
            x["translation"]=trans;eligible+=1
        results.append(x)
    return results,{
        "file_git_sha1":git_sha,"strict_classical_label_records":len(valid),
        "accepted_nahuatl_records":len(results),"duplicate_or_unusable":skipped,
        "short_candidate_spanish_pairs":eligible,
        "long_or_unaligned_retained_monolingual":len(results)-eligible,
        "source_work_count":len({r["work_id"] for r in results}),
        "independent_gold":0
    }


def write_manifest(output:str,items:list[dict],summary:dict):
    p=Path(output);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text("\n".join(json.dumps(r,ensure_ascii=False) for r in items)+"\n",encoding="utf-8")
    validated=load_corpus(p)
    summary["validated_records"]=len(validated)
    summary["no_genuine_english_pairs"]=True
    summary["independent_translation_accuracy"]=None
    Path(str(p)+".meta.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    return summary


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--florentine-dir",required=True)
    parser.add_argument("--prior-scan",default="research/florentine_codex/analysis.json")
    parser.add_argument("--axolotl-file",required=True)
    parser.add_argument("--output-dir",required=True)
    args=parser.parse_args()
    root=Path(args.florentine_dir)
    # read_text() silently normalizes CRLF to LF. Previous Tlahtōlli
    # scan hashes the original decoded UTF-8 bytes, so preserve newlines.
    allbooks={n:(root/f"Book {n} - {title}.txt").read_bytes().decode("utf-8-sig") for n,title in BOOKS}
    prior=json.loads(Path(args.prior_scan).read_text(encoding="utf-8"))
    fc,fcs=florentine_rows(allbooks,prior)
    ax,axs=axolotl_rows(Path(args.axolotl_file).read_bytes())
    target=Path(args.output_dir)
    fcs=write_manifest(str(target/"florentine.jsonl"),fc,{"source":SOURCE_HOOK,"books":fcs})
    axs=write_manifest(str(target/"axolotl.jsonl"),ax,{"source":AXO_URL,**axs})
    print("RESEARCH_CORPUS_COUNTS "+json.dumps({"florentine":fcs,"axolotl":axs}))


if __name__=="__main__":
    main()

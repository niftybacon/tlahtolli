#!/usr/bin/env python3
"""Batch 09: independently verified Class 2 stems with vowel-initial n- allomorph.

This is an additive canonical source edit, not a second grammar engine or
an inferred 60-cell paradigm. It cannot run twice as a write.
"""
import argparse
import json
import sys
from pathlib import Path
from build_dictionary import assemble,run as build

ROOT=Path(__file__).resolve().parents[1]
MANIFEST="research/batches/source_vowel_class2_batch09_2026_10_29.json"
SOURCE=["data/lexicon.json","data/morphology.json","data/evidence.json",
        "paradigms.json","references.json","release.json"]
REVIEWER="AI-assisted ODN lexicographic review; Lockhart/Molina/Karttunen locators; no original folio collation"

def read(p):return json.loads((ROOT/p).read_text(encoding="utf-8"))
def dump(p,x):(ROOT/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def check(x,msg):
 if not x:raise ValueError(msg)

def run(write=False):
 manifest=read(MANIFEST)
 check(manifest["format"]=="tlahtolli-vowel-boundary-class2-review-v1","Bad batch format")
 entries=manifest["entries"]
 check(len(entries)==2 and {e["word"] for e in entries}=={"iztlacati","ichtequi"},"Unexpected source review selection")
 lex,morph,ev,para,refs,release=(read(p) for p in SOURCE)
 check(len(lex["words"])==len(morph["entries"])==len(ev["entries"])==2142,"Canonical record count changed")
 lookup={w["word"]:i for i,w in enumerate(lex["words"])}
 check(len(lookup)==2142,"Duplicate headwords")
 for spec in entries:
  name=spec["word"]
  i=lookup[name]
  l,m,e=lex["words"][i],morph["entries"][i],ev["entries"][i]
  check(l["pos"]==spec["pos"] and l["source"]==spec["source"] and
        l["status"]=="Checked against source",name+": lexical review changed")
  check(spec["base1"]==name and spec["base1"]!=spec["base2"] and
        spec["base2"].startswith("i") and
        spec["preterite"]==spec["augment"]+"n"+spec["base2"],
        name+": n- vowel allomorph does not exactly reconstruct source 1sg")
  check(any(f["form"]==spec["preterite"] and f["evidence"]=="dictionary" and
            f["category"]=="Preterite 1sg" and f["source"]==spec["source"]
            for f in m["inflections"]),name+": no exact source-listed preterite")
  claim=next((c for c in e["claims"] if c["field"]=="stem"),None)
  check(claim is not None and claim["source"]==spec["source"],name+": existing claim/source mismatch")
  if write:
   check(not m["stem"] and claim["assessment"]=="unverified",name+": already promoted")
   m["stem"]=spec["base1"]+"-; "+spec["base2"]+"-"
   m["grammarNotes"]+=" | Batch 09: n- conditioned before initial vowel; source-linked Class 2 base pair. No transitive/weak-i extrapolation."
   claim.update(field="stem",assessment="dictionary",source=spec["source"],
       locator=spec["locator"],reviewer=REVIEWER,checkedAt="2026-10-29",
       note="Batch 09 source-documented Class 2 intransitive base pair. Exact "+spec["preterite"]+
            " = "+spec["augment"]+" augment + n- first-person before vowel + "+spec["base2"]+
            " past stem. Future and plural forms are ONLY grammar hypotheses. "+spec["note"])
  else:
   check(m["stem"]==spec["base1"]+"-; "+spec["base2"]+"-" and
         claim["assessment"]=="dictionary" and claim["locator"]==spec["locator"] and
         "Batch 09" in claim["note"],name+": reviewed source class missing")
 if not write:
  check(release["version"]==manifest["target"],"Release missing Batch 09")
  print("PASS: two source-graded vowel-initial Class 2 stems, no fabricated historical tokens")
  return
 check(release["version"]==manifest["baseline"],"Baseline edition changed")
 for document in (lex,morph,ev,para,refs,release):document["version"]=manifest["target"]
 check(release["headwords"]==2142,"Headword count unexpectedly changed")
 assemble(lex,morph,ev,para,refs,release)
 for path,obj in zip(SOURCE,(lex,morph,ev,para,refs,release)):dump(path,obj)
 build(write=True)
 print("PASS: committed two exact source-stem claims; canonical 2142 headwords unchanged")
if __name__=="__main__":
 ap=argparse.ArgumentParser()
 g=ap.add_mutually_exclusive_group()
 g.add_argument("--write",action="store_true")
 g.add_argument("--check",action="store_true")
 args=ap.parse_args()
 try:run(write=args.write)
 except (ValueError,KeyError,AssertionError,TypeError,IndexError) as exc:
  print("FAIL:",exc,file=sys.stderr)
  sys.exit(1)

#!/usr/bin/env python3
"""Batch 08: replay source-graded ODN lexical/stem decisions without guessed verbs.

All full forms stay dictionary-source listed; all productive forms stay hypotheses.
The frozen human-readable ledger supplies the ODN URL, an exact source locator,
recorded spelling, and distinct reasons for excluding unresolved classes.
"""
import argparse
import json
import re
import sys
from pathlib import Path
from build_dictionary import assemble, run as build

ROOT=Path(__file__).resolve().parents[1]
PATH="research/batches/source_stem_batch08_2026_10_29.json"
DATE="2026-10-29"
REVIEWER="Tlahtōlli Batch 08 AI-assisted ODN historical-dictionary review; not original folio collation or expert peer review"

def read(p): return json.loads((ROOT/p).read_text(encoding="utf8"))
def dump(x): return json.dumps(x,ensure_ascii=False,indent=2)+"\n"
def must(x,msg):
 if not x: raise ValueError(msg)
def claim(field,assessment,source,locator,note):
 return dict(field=field,assessment=assessment,source=source,
             locator=locator if assessment!="unverified" else "",
             note=note,reviewer=REVIEWER,checkedAt=DATE)
def has_form(m,f): return any(z["form"]==f for z in m["inflections"])
def add_form(m,source,locator,word,form,category,note):
 if not form:return
 must(not has_form(m,form),"Already stored form "+word+": "+form)
 m["inflections"].append(dict(form=form,category=category,
   gloss="Historical dictionary-listed completed form of "+word+"; spelling and person only",
   evidence="dictionary",source=source,note="ODN entry quotes "+locator+
   ". This exact token is source LISTED, not manuscript-collated. "+note))
def expect_provisional(l,m,e,word):
 must(l["status"]=="Archive-indexed; lexical review pending",word+" is no longer a provisional new candidate")
 must(l["pos"]=="verb (provisional archive index)",word+" POS unexpected")
 must(not m["stem"] and not m["inflections"],word+" has existing morphology")
 must({(c["field"],c["assessment"]) for c in e["claims"]} ==
      {("headword","inference"),("meaning","inference"),("pos","inference"),("stem","unverified")},
      word+" source evidence was already modified")

def update_review(spec,l,m,e):
 word=spec["word"]
 expect_provisional(l,m,e,word)
 source,locator=spec["source"],spec["locator"]
 must(locator and source.startswith("https://nahuatl.wired-humanities.org/content/"),
      word+": source locator missing")
 l["pos"]=spec["pos"]
 l["status"]="Checked against source"
 l["source"]=source
 l["notes"]+=( " | Batch 08 ODN historical entry review, quoting "+locator+
   ". This is lexicographic entry comparison, not original-folio verification. "+
   spec["note"])
 m["grammarSource"]=source
 m["grammarNotes"]="Batch 08: "+locator+". "+spec["note"]+" No whole sentence translation or 10×6 paradigm licensed."
 for c in e["claims"]:
  if c["field"]=="stem":continue
  field=c["field"]
  new=claim(field,"dictionary",source,locator,{
    "headword":"ODN historical lexicographic headword verified at the quoted entry; historical orthography and vowel lengths are not silently altered.",
    "meaning":"Only the existing short indexed sense is supported by the cited historical entry; semantic variants and era differences remain unresolved.",
    "pos":"The source supports precisely the labelled verb frame; impersonal, transitive, reflexive and other senses remain distinguished."
   }[field]+" "+spec["note"])
  c.clear();c.update(new)
 add_form(m,source,locator,word,spec["preterite"],spec["category"],spec["note"])
 if not spec["class"]:
  e["claims"][-1]["note"]="Source-reviewed lexical item, but no unique source-licensed productive stem class. "+spec["note"]
  return
 must(spec["class"] in ("1","2"),word+": unexpected class")
 base=spec["short_base"]
 if spec["class"]=="2":
  must(bool(base) and base!=word and spec["preterite"],word+": missing Class 2 exact form/base")
  must(re.fullmatch(r"[\w\u0100-\uffff]+",base,re.UNICODE),word+": invalid short base")
  # Only source-spelled augment, ni subject and exact historically reported object prefix.
  pre=spec["preterite"]
  must(pre[0] in ("o","ō") and pre[1:3]=="ni",word+": not source 1sg")
  suffix=pre[3:]
  if spec["pos"]=="verb (transitive)":
   obj= "tla" if "unspecified object" in spec["category"] else "c" if "specific object" in spec["category"] else None
   must(obj and suffix==obj+base,word+": Class 2 object/base mismatch")
  else:must(spec["pos"]=="verb (intransitive)" and suffix==base,word+": Class 2 base mismatch")
  m["stem"]=word+"-; "+base+"-"
  e["claims"][-1]=claim("stem","dictionary",source,locator,
    "Batch 08 explicit Class 2 / source-listed exact short preterite remainder. Source 1sg "+
    pre+"; long citation base "+word+"- and preterite remainder "+base+
    "-. No additional persons or English readings independently source-attested. "+spec["note"])
 else:
  must(not base and spec["preterite"],word+": Class 1 must not masquerade as Class 2")
  must(spec["preterite"][:3] in ("oni","ōni"),word+": no 1sg prefix")
  rest=spec["preterite"][3:]
  if spec["pos"]=="verb (transitive)":
   must("unspecified object" in spec["category"] and rest=="tla"+word+"c",word+": Class 1 transitive mismatch")
  else:must(spec["pos"]=="verb (intransitive)" and rest==word+"c",word+": Class 1 base/c mismatch")
  # Class 1 base 2 is the same base as base 1, followed by -c in the 1sg past.
  # A *single* base (not long;short) keeps Class 2 off this item.
  m["stem"]=word+"-"
  e["claims"][-1]=claim("stem","grammar",source,locator,
    "Batch 08 documented Class 1 singular -c: exact 1sg "+spec["preterite"]+
    " confirms this word's unchanged citation base "+word+"-. The -c is a suffix, "+
    "not a Class 2 short stem. Further generated forms are ONLY grammar hypotheses. "+spec["note"])

def update_prior(spec,l,m,e):
 word=spec["word"]
 must(l["status"]=="Checked against source" and l["pos"]=="verb (intransitive)",
      "Prior cohort changed: "+word)
 must(e["claims"][-1]["field"]=="stem" and e["claims"][-1]["assessment"]=="unverified",
      "Prior class was already upgraded: "+word)
 must(not m["stem"],word+" prior stem populated")
 if not has_form(m,spec["preterite"]):
  add_form(m,spec["source"],spec["locator"],word,spec["preterite"],"Preterite 1sg",spec["note"])
 must(spec["preterite"][:3] in ("oni","ōni") and spec["preterite"][3:]==word+"c",
      "Prior Class 1 exact spelling mismatch "+word)
 m["stem"]=word+"-"
 m["grammarSource"]=spec["source"]
 m["grammarNotes"]+=" | Batch 08 source-form-constrained Class 1; -c is a suffix, not a shorter stem. "+spec["note"]
 e["claims"][-1]=claim("stem","grammar",spec["source"],spec["locator"],
  "Batch 08 documented Class 1 singular -c, source-listed completed form "+spec["preterite"]+
  " and preserved citation base "+word+"-. Not a Class 2 base alternation. "+spec["note"])

def apply(write=False):
 manifest=read(PATH)
 must(manifest["format"]=="tlahtolli-verb-stem-evidence-batch08-v1","Bad manifest format")
 must(len(manifest["entries"])==manifest["reviewed_candidates"]==38,"Reviewed row count changed")
 must(len(manifest["older"])==4 and manifest["productive_class_count"]==17,"Class ledger changed")
 allrows=manifest["entries"]+manifest["older"]
 must(len({x["word"] for x in allrows})==len(allrows),"Duplicate candidate review")
 lex,morph,evid=(read(x) for x in ("data/lexicon.json","data/morphology.json","data/evidence.json"))
 p,refs,release=(read(x) for x in ("paradigms.json","references.json","release.json"))
 must(len(lex["words"])==len(morph["entries"])==len(evid["entries"])==2142,
      "Baseline record count or canonical alignment changed")
 ix={w["word"]:i for i,w in enumerate(lex["words"])}
 must(all(k in ix for k in (s["word"] for s in allrows)),"Source manifest contains unknown headword")
 if not write:
  must(release["version"]==manifest["target_version"],"Batch not yet applied to edition")
  for spec in manifest["entries"]:
   i=ix[spec["word"]];w=lex["words"][i];m=morph["entries"][i];e=evid["entries"][i]
   must(w["status"]=="Checked against source" and w["pos"]==spec["pos"] and w["source"]==spec["source"],"Source-reviewed entry mismatch")
   if spec["preterite"]:must(has_form(m,spec["preterite"]),"Missing source form "+spec["word"])
   if spec["class"]:must(any(c["field"]=="stem" and c["assessment"] in ("dictionary","grammar") for c in e["claims"]),"Missing stem evidence")
   else:must(not m["stem"],"Unlicensed stem "+spec["word"])
  for spec in manifest["older"]:
   i=ix[spec["word"]]
   must(morph["entries"][i]["stem"]==spec["word"]+"-","Prior Class 1 missing "+spec["word"])
  print("PASS: 38 source-review dispositions, 17 licensed verb stems, 6 explicit refusals")
  return
 must(release["version"]!=manifest["target_version"],"Already imported")
 for spec in manifest["entries"]:
  i=ix[spec["word"]]
  update_review(spec,lex["words"][i],morph["entries"][i],evid["entries"][i])
 for spec in manifest["older"]:
  i=ix[spec["word"]]
  update_prior(spec,lex["words"][i],morph["entries"][i],evid["entries"][i])
 for doc in (lex,morph,evid,p,refs,release):doc["version"]=manifest["target_version"]
 release["headwords"]=len(lex["words"])
 assemble(lex,morph,evid,p,refs,release)
 for path,obj in (("data/lexicon.json",lex),("data/morphology.json",morph),
                  ("data/evidence.json",evid),("paradigms.json",p),("references.json",refs),
                  ("release.json",release)):
  (ROOT/path).write_text(dump(obj),encoding="utf8")
 build(write=True)
 print("PASS: 38 source-reviewed lexemes, 34 exact newly stored preterites, 17 stem classes")

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 group=parser.add_mutually_exclusive_group()
 group.add_argument("--write",action="store_true")
 group.add_argument("--check",action="store_true")
 args=parser.parse_args()
 try:apply(write=args.write)
 except (ValueError,KeyError,TypeError,IndexError,AssertionError) as exc:
  print("FAIL:",exc,file=sys.stderr)
  sys.exit(1)

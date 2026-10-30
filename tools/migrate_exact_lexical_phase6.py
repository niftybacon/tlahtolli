#!/usr/bin/env python3
"""One-time, source-restricted canonical exact-form lexical migration.

This is NOT a learner, new parser, global spelling rewrite or authorizer of
Gold/Silver/translation labels. Run --write only on the isolated Phase-6 branch.
It reuses existing canonical data/lexicon, data/morphology, data/evidence and
the repository's own dictionary, morphology embed and runtime asset builders.
"""
import argparse
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OLD_VERSION="2026-10-29.9.0"
NEW_VERSION="2026-10-30.1.0"
DATE="2026-10-30"
DATA=["data/lexicon.json","data/morphology.json","data/evidence.json",
      "paradigms.json","references.json","release.json"]
SOURCE=[
 ("yehuan","independent third-person plural pronoun; contextual referent and syntactic scope unverified",
  "pronoun","https://nahuatl.wired-humanities.org/content/yehuantin",
  "James Lockhart, Nahuatl as Written (2001), p. 242; ODN orthographic variant yehuan",
  "Short independent third-person plural form as reported by Lockhart through ODN; UNAM GDN documents separate 1557 spelling yeuan. Neither historic spelling nor poetic yehuan Dios permits an automatic contextual pronoun referent."),
 ("tepilhuan","sons; daughters; children / offspring (poetic social context unreviewed)",
  "noun","https://nahuatl.wired-humanities.org/node/188794",
  "Molina, Vocabulario (1571), Nahuatl-Spanish Part II, fol. 103r, col. 1; transcribed through ODN",
  "Exact source-documented noun form. No verified possessive morphology or historical stanza translation. Reading a particular poetic occurrence as literal children rather than elite offspring requires additional source review."),
]
def check(condition,message):
 if not condition: raise ValueError(message)
def record(field,source,locator,remark):
 return {"field":field,"assessment":"dictionary","source":source,
         "locator":locator,"note":remark,
         "reviewer":"Tlahtōlli AI-assisted direct dictionary check; no independent human specialist approval",
         "checkedAt":DATE}
def migrate():
 files={p:json.loads((ROOT/p).read_text(encoding="utf-8")) for p in DATA}
 versions={p:d["version"] for p,d in files.items()}
 check(len(set(versions.values()))==1,"Canonical versions disagree before migration")
 current=next(iter(versions.values()))
 check(current in {OLD_VERSION,NEW_VERSION},"Refuse unrecognized release version")
 lex,morph,evid=(files[p] for p in DATA[:3])
 check(len(lex["words"])==len(morph["entries"])==len(evid["entries"]),"Misaligned source records")
 check([r["word"] for r in lex["words"]]==[r["word"] for r in morph["entries"]]==
       [r["word"] for r in evid["entries"]],"Existing lexical row ordering diverges")
 forms={w["word"] for w in lex["words"] if w["variety"]=="Classical Nahuatl"}
 if current==OLD_VERSION:
  check(len(lex["words"])==2142 and not any(f[0] in forms for f in SOURCE),
        "Two expected forms already exist; do not duplicate")
  for word,meaning,pos,url,locator,warning in SOURCE:
   lex["words"].append({
    "word":word,"meaning":meaning,"pos":pos,"original":word,
    "variety":"Classical Nahuatl","status":"Checked against source",
    "source":url,"example":"","translation":"",
    "notes":warning+" Lexical citation only; original editions/Gold and contextual syntax are NOT independently human-reviewed."})
   morph["entries"].append({
    "word":word,"variety":"Classical Nahuatl",
    "stem":"","number":"not_applicable","animacy":"not_applicable",
    "plural":"","pluralStatus":"no_attested_form","absolutive":"","possessed":"",
    "grammarSource":"","grammarNotes":"Dictionary exact wordform only; grammatical segmentation, possessor, referent, plural paradigm and syntactic role are not independently verified.",
    "inflections":[],"formsEdited":False})
   evid["entries"].append({"word":word,"variety":"Classical Nahuatl","claims":[
    record("headword",url,locator,
           "Exact historical wordform in cited source. Does not license variant rewrites or grammatical segmentation."),
    record("pos",url,locator,
           "Independent pronoun form" if pos=="pronoun" else "Historically documented noun form; no nominal morphology inferred."),
    record("meaning",url,locator,warning+" Dictionary gloss only; no verified full English translation.") ]})
  for d in files.values():d["version"]=NEW_VERSION
  files["release.json"]["headwords"]=len(lex["words"])
  for p,d in files.items():
   (ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 check(len(lex["words"])==2144,"Expected exactly 2144 canonical entries")
 for w in SOURCE:
  name=w[0]
  k=next((i for i,x in enumerate(lex["words"]) if x["word"]==name),None)
  check(k is not None and morph["entries"][k]["inflections"]==[] and
        len(evid["entries"][k]["claims"])==3, "Unapproved morphology or incomplete lexical citation: "+name)
 for cmd in [["tools/build_dictionary.py","--write"],
             ["tools/build_morphology_engine.py","--write"],
             ["tools/build_runtime_assets.py","--write"]]:
  subprocess.run(["python",*cmd],cwd=ROOT,check=True)
 print("PASS source-locked canonical lexical migration: exactly two headwords, zero productive morphology rules, zero historical bilingual approvals.")
if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--write",action="store_true")
 args=parser.parse_args()
 if not args.write:parser.error("--write required; no automatic import into main")
 migrate()

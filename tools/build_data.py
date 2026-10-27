#!/usr/bin/env python3
"""Build Tlahtolli's published dictionary from the three canonical data files."""
import argparse,csv,io,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FIELDS="word meaning pos stem original variety status source example translation notes number animacy plural pluralStatus absolutive possessed grammarSource grammarNotes inflections formsEdited claims".split()
MORPH="stem number animacy plural pluralStatus absolutive possessed grammarSource grammarNotes inflections formsEdited".split()
GRADES={"dictionary","text","grammar","inference","unverified"}
MARK="window.TLAHTOLLI_OFFLINE_SEED="
def read(p):return json.loads((ROOT/p).read_text(encoding="utf-8"))
def pretty(obj):return json.dumps(obj,indent=2,ensure_ascii=False)+"\n"
def indexed(items,allowed):
    d={}
    for x in items:
        key=(x["variety"],x["word"])
        if key in d or set(x)!=set(allowed):raise ValueError("Duplicate or wrong fields at "+repr(key))
        d[key]=x
    return d
def build():
    l,m,e=[read("data/"+n+".json") for n in ("lexicon","morphology","evidence")]
    p,r,release=read("paradigms.json"),read("references.json"),read("release.json")
    version=l["version"]
    if any(x["version"]!=version for x in (m,e,p,r,release)):raise ValueError("Source versions differ")
    a=indexed(l["words"],[f for f in FIELDS if f not in MORPH+["claims"]])
    b=indexed(m["entries"],["word","variety"]+MORPH)
    c=indexed(e["entries"],["word","variety","claims"])
    if set(a)!=set(b) or set(a)!=set(c):raise ValueError("Missing morphology/evidence pair")
    words=[]
    for key in a:
        x={**a[key],**b[key],**c[key]}
        for claim in x["claims"]:
            if claim["assessment"] not in GRADES:raise ValueError("Unknown evidence status")
            if claim["assessment"]!="unverified" and not (claim.get("source") and claim.get("locator")):
                raise ValueError("Missing claim source locator")
        words.append({f:x[f] for f in FIELDS})
    d={"format":"tlahtolli-published-dictionary","schema":1,"version":version,
       "variety":l["variety"],"editorial_policy":l["editorial_policy"],"words":words}
    if release["headwords"]!=len(words) or release["paradigms"]!=len(p["paradigms"]):
        raise ValueError("Release counts mismatch")
    output=io.StringIO(newline="")
    output.write("headword,claim_field,review_level,source_url,exact_locator_or_section,editorial_conclusion,reviewer,reviewed_date\n")
    wr=csv.writer(output,quoting=csv.QUOTE_ALL,lineterminator="\n")
    for w in words:
        for x in w["claims"]:
            wr.writerow([w["word"],x["field"],x["assessment"],x.get("source",""),
                         x.get("locator",""),x["note"],x.get("reviewer",""),x.get("checkedAt","")])
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    start=html.index(MARK)+len(MARK)
    old,length=json.JSONDecoder().raw_decode(html[start:])
    assert html[start+length]==";"
    seed={"words":words,"paradigms":p["paradigms"],"version":version}
    html=html[:start]+json.dumps(seed,ensure_ascii=False,separators=(",",":"))+html[start+length:]
    return {"dictionary.json":pretty(d),"claim_audit.csv":output.getvalue(),
            "index.html":html,"release.json":pretty(release)}
def run(write=False):
    stale=[]
    for file,expected in build().items():
        path=ROOT/file
        if path.read_text(encoding="utf-8")!=expected:
            stale.append(file)
            if write:path.write_text(expected,encoding="utf-8")
    print(("UPDATED" if write else "STALE")+": "+", ".join(stale) if stale else "PASS: generated source files match")
    return not stale or write
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--write",action="store_true")
    p.add_argument("--check",action="store_true")
    args=p.parse_args()
    try:sys.exit(0 if run(args.write) else 1)
    except (ValueError,KeyError,AssertionError) as exc:
        print("BUILD ERROR:",exc,file=sys.stderr);sys.exit(1)

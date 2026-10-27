#!/usr/bin/env python3
"""Published-data structural checks. Do not infer historical authenticity from a passing result."""
import json,sys
from pathlib import Path
from urllib.parse import urlparse
root=Path(__file__).resolve().parents[1]
d=json.loads((root/"dictionary.json").read_text(encoding="utf-8"))
p=json.loads((root/"paradigms.json").read_text(encoding="utf-8"))
issues=[]
def check(ok,msg):
    if not ok: issues.append(msg)
def url_ok(s):
    try:
        u=urlparse(s)
        return u.scheme in ("http","https") and bool(u.netloc)
    except Exception: return False
check(d.get("format")=="tlahtolli-published-dictionary" and d.get("schema")==1,"Invalid dictionary schema")
check(p.get("format")=="tlahtolli-verb-paradigms" and p.get("schema")==1,"Invalid paradigms schema")
check(d.get("version")==p.get("version"),"Dictionary/paradigm release mismatch")
seen=set()
for w in d.get("words",[]):
    key=(w.get("variety"),w.get("word"))
    check(key not in seen, "Duplicate lemma: "+str(key))
    seen.add(key)
    for field in ("word","meaning","pos","variety"): check(bool(w.get(field)),str(key)+": missing "+field)
    if w.get("status")=="Checked against source":check(url_ok(w.get("source","")),str(key)+": missing lexical URL")
    if w.get("pluralStatus")=="attested":check(bool(w.get("plural")),str(key)+": attested plural has no exact form")
    if "noun" not in w.get("pos","").lower():check(w.get("animacy") not in ("animate","inanimate"),str(key)+": nominal animacy on non-noun")
    for f in w.get("inflections",[]):
        check(bool(f.get("form")) and bool(f.get("category")),str(key)+": incomplete form")
        check(f.get("evidence") in ("dictionary","text","paradigm","stem","review"),str(key)+": invalid form evidence")
        if f.get("evidence")!="review":check(url_ok(f.get("source","")),str(key)+": form lacks source")
    for c in w.get("claims",[]):
        check(c.get("assessment") in ("dictionary","text","grammar","inference","unverified"),str(key)+": bad claim status")
        check(bool(c.get("note")),str(key)+": claim lacks note")
        if c.get("assessment")!="unverified":check(url_ok(c.get("source","")),str(key)+": claim lacks URL")
verbs={w.get("word") for w in d.get("words",[]) if "verb" in w.get("pos","").lower()}
for name,model in p.get("paradigms",{}).items():
    check(name in verbs,name+": paradigm without matching verb")
    cells=model.get("cells",[])
    check(len(cells)==10 and all(isinstance(row,list) and len(row)==6 for row in cells),name+": expected ten rows × six persons")
    check(url_ok(model.get("lemmaSource","")),name+": missing lexical source")
if issues:
    print("INVALID:",*issues,sep="\n - ")
    sys.exit(1)
print("PASS:",len(d["words"]),"entries;",len(p["paradigms"]),"verb paradigms; version",d["version"])
print("Structural checks do NOT establish accuracy or historical attestation.")

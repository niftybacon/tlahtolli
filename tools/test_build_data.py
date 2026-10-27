#!/usr/bin/env python3
"""Phase 2 regression: preserve all entries, morphological forms and evidence."""
import copy,csv,io,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from build_data import build,read,indexed
from collections import Counter
published=read("dictionary.json")
generated=build()
assert generated["dictionary.json"]==(ROOT/"dictionary.json").read_text(encoding="utf-8")
assert generated["claim_audit.csv"]==(ROOT/"claim_audit.csv").read_text(encoding="utf-8")
assert generated["index.html"]==(ROOT/"index.html").read_text(encoding="utf-8")
assert generated["release.json"]==(ROOT/"release.json").read_text(encoding="utf-8")
assert len(published["words"])==88
assert sum(len(w["inflections"]) for w in published["words"])==178
assert sum(len(w["claims"]) for w in published["words"])==674
claims=list(csv.DictReader(io.StringIO(generated["claim_audit.csv"])))
assert Counter(row["review_level"] for row in claims)==Counter(
    dictionary=324,grammar=129,text=15,inference=111,unverified=95)
assert len({(w["variety"],w["word"]) for w in published["words"]})==88
morph=read("data/morphology.json")
duplicate=copy.deepcopy(morph["entries"])
duplicate.append(copy.deepcopy(duplicate[0]))
try:
    indexed(duplicate,duplicate[0].keys())
    raise AssertionError("Duplicate source record accepted")
except ValueError:
    pass
print("PASS: 88 lemmas, 178 inflections, 674 claims, original offline seed and duplicate safety")

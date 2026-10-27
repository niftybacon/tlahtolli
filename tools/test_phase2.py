#!/usr/bin/env python3
"""Structural regression checks for the normalized source-of-truth architecture.

These tests do not verify historical linguistic accuracy or original folio readings.
"""
import copy
import csv
import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_dictionary import (read_json, assemble, audit_csv, embedded_seed,
                              render_seed, MORPH_KEYS)

lex = read_json(ROOT / "data" / "lexicon.json")
morph = read_json(ROOT / "data" / "morphology.json")
evid = read_json(ROOT / "data" / "evidence.json")
verbs = read_json(ROOT / "paradigms.json")
refs = read_json(ROOT / "references.json")
release = read_json(ROOT / "release.json")
legacy = read_json(ROOT / "dictionary.json")
generated = assemble(lex, morph, evid, verbs, refs, release)

assert generated == legacy, "Published JSON no longer matches the three authoritative sources"
assert len(generated["words"]) >= 88
assert len(verbs["paradigms"]) >= 12
assert sum(len(w["claims"]) for w in generated["words"]) >= 674
assert sum(len(w["inflections"]) for w in generated["words"]) >= 178

# Source boundaries are explicit and reversible, without loss of any legacy field.
for old, core, grammar, proof in zip(
    legacy["words"], lex["words"], morph["entries"], evid["entries"]
):
    assert (old["word"], old["variety"]) == (core["word"], core["variety"])
    assert (core["word"], core["variety"]) == (grammar["word"], grammar["variety"])
    assert (core["word"], core["variety"]) == (proof["word"], proof["variety"])
    assert "claims" not in core and "inflections" not in core
    assert not any(k in core for k in MORPH_KEYS)
    assert set(grammar) == set(MORPH_KEYS) | {"word", "variety"}
    assert set(proof) == {"word", "variety", "claims"}
    assert grammar["inflections"] == old["inflections"]
    assert proof["claims"] == old["claims"]

assert audit_csv(generated) == (ROOT / "claim_audit.csv").read_text(encoding="utf-8")
reader = list(csv.DictReader(io.StringIO(audit_csv(generated))))
assert len(reader) == sum(len(w['claims']) for w in generated['words'])
from collections import Counter
counts = Counter(row["review_level"] for row in reader)
assert all(counts[grade] >= minimum for grade,minimum in {
    "dictionary": 324, "grammar": 129, "text": 15,
    "inference": 111, "unverified": 95
}.items()), counts

html = (ROOT / "index.html").read_text(encoding="utf-8")
seed, _, _ = embedded_seed(html)
assert seed["words"] == generated["words"]
assert seed["paradigms"] == verbs["paradigms"]
assert seed["version"] == release["version"]
assert render_seed(html, generated, verbs) == html, "Build should leave up-to-date HTML byte-identical"
assert "tlahtolli_workspace_v1" in html
assert "tlahtolli_published_baseline_v11" in html
assert "else if(oldBase&&entriesIdentical" in html, "Do not regress protection of local edits"

def expect_rejected(message, a, b, c, d=verbs, e=refs, f=release):
    try:
        assemble(a,b,c,d,e,f)
    except (ValueError, TypeError, KeyError):
        return
    raise AssertionError("Incorrectly accepted " + message)

alter = copy.deepcopy(morph)
alter["entries"][1]["word"] = alter["entries"][0]["word"]
expect_rejected("miskeyed or duplicated morphology", lex, alter, evid)

alter = copy.deepcopy(evid)
alter["entries"].pop()
expect_rejected("missing evidence entry", lex, morph, alter)

alter = copy.deepcopy(lex)
alter["words"][0]["claims"] = []
expect_rejected("intermingled historical claims and lexical data", alter, morph, evid)

alter = copy.deepcopy(morph)
alter["entries"][0].pop("inflections")
expect_rejected("missing morphology field", lex, alter, evid)

alter = copy.deepcopy(release)
alter["version"] = "stale-edition"
expect_rejected("stale release manifest", lex, morph, evid, f=alter)

alter = copy.deepcopy(lex)
alter["words"].append(copy.deepcopy(alter["words"][0]))
expect_rejected("duplicate lexicon headword", alter, morph, evid)

print("PASS:",len(generated['words']),"normalized lemmas,",sum(len(w['inflections']) for w in generated['words']),"forms,",len(reader),"evidence claims, exact legacy")
print("      reconstruction, CSV/offline HTML parity, version locks, invalid-data rejection.")

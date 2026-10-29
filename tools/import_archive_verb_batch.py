#!/usr/bin/env python3
"""Admit a frozen Classical-labelled lexical candidate batch with evidence safeguards.

Default is --check. --write appends to the THREE existing canonical sources and
rebuilds the published dictionary in one batch, never one PR/commit per lemma.
Source form tags do not license morphological or historical claims.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = "research/batches/classical_archive_verb_batch05_2026_10_29.json"
STATUS = "Archive-indexed; lexical review pending"
POS = "verb (provisional archive index)"

def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def dump(obj):
    return json.dumps(obj, ensure_ascii=False, indent=2) + "\n"

def fold(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if not unicodedata.combining(c))

def ensure(ok, message):
    if not ok:
        raise ValueError(message)

def validate_ledger(manifest):
    ensure(manifest.get("format") == "tlahtolli-classical-archive-verb-intake-v1",
           "Unsupported source-index batch")
    entries = manifest.get("entries")
    ensure(isinstance(entries, list) and entries, "Empty candidate batch")
    ensure(len(entries) == manifest.get("new_candidates"), "Manifest count mismatch")
    shard_files = [read("research/amoxcalli_archive/kaikki_0%d.json" % n)["rows"]
                   for n in range(4)]
    seen = set()
    for item in entries:
        word, original = item["word"], item["source_word"]
        ensure(isinstance(word, str) and
               re.fullmatch(r"[^\W\d_][^\s/]{2,89}", word, flags=re.UNICODE),
               "Invalid headword " + repr(word))
        ensure(fold(word) not in seen, "Duplicate canonical candidate: " + word)
        seen.add(fold(word))
        row = shard_files[item["shard"]][item["row"]]
        ensure(row[0] == original and row[1:3] == ["verb", "nci"],
               "Source-locator mismatch: " + word)
        senses = row[3]
        ensure(any(s[0] and s[0][0] == item["gloss"] and
                   not {"form-of", "alt-of", "alternative", "obsolete",
                        "nonstandard"}.intersection(s[2]) for s in senses),
               "Source gloss not independently present in indicated nci row: " + word)
        canonical = [f[0] for f in row[4] if "canonical" in f[1]]
        ensure(word == original or (len(canonical) == 1 and word == canonical[0]),
               "Headword not verbatim/source-canonical: " + word)
    return entries

def make_entry(item):
    word, original = item["word"], item["source_word"]
    source = "https://en.wiktionary.org/wiki/" + quote(original, safe="")
    locator = ('Kaikki nci record "%s"; already imported shard %s, row %s'
               % (original, item["shard"], item["row"]))
    reviewer = "AI-assisted bulk source-index transfer; no independent historical source collation"

    def claim(field, assessment, note):
        return dict(field=field, assessment=assessment, source=source,
                    locator=locator if assessment != "unverified" else "",
                    note=note, reviewer=reviewer, checkedAt="2026-10-29")

    lex = dict(
        word=word, meaning=item["gloss"], pos=POS,
        original=original if word != original else "", variety="Classical Nahuatl",
        status=STATUS, source=source, example="", translation="",
        notes=("Kaikki/Wiktionary Classical-labelled (nci) verb index only; "
               "precise era, lexical sense, valency, conjugation and vowel length "
               "NOT independently verified. Source tags: %s. Shard %s, row %s. "
               "Wiktionary CC BY-SA 3.0/GFDL; derived Amoxcalli CC BY-SA 4.0."
               % (", ".join(item["tags"]) or "none", item["shard"], item["row"])))
    morph = dict(
        word=word, variety="Classical Nahuatl", stem="", number="not_applicable",
        animacy="not_applicable", plural="", pluralStatus="no_attested_form",
        absolutive="", possessed="", grammarSource="",
        grammarNotes="Source-index provisional lexeme only. No source-checked stem, valency, finite form or paradigm.",
        inflections=[], formsEdited=False)
    evid = dict(word=word, variety="Classical Nahuatl", claims=[
        claim("headword", "inference",
              "A lemma appears in a community source index, not an independently collated historical text."),
        claim("meaning", "inference",
              "Short source-reported gloss; not a verified lexical or contextual Classical translation."),
        claim("pos", "inference",
              "Community source labels row as verb; class, valency and period remain unresolved."),
        claim("stem", "unverified",
              "No source-verified base pair, finite form or justified productive morphology.")
    ])
    return lex, morph, evid

def run(manifest_path, write=False):
    manifest = read(manifest_path)
    entries = validate_ledger(manifest)
    lex = read("data/lexicon.json")
    morph = read("data/morphology.json")
    evid = read("data/evidence.json")
    release = read("release.json")
    indices = [fold(w["word"]) for w in lex["words"]]
    ensure(len(indices) == len(set(indices)),
           "Existing diacritic-fold duplicates need human resolution")
    lookup = {w: i for i, w in enumerate(indices)}
    ensure(len(lex["words"]) == len(morph["entries"]) == len(evid["entries"]),
           "Canonical source file inventories differ")
    missing = []
    for item in entries:
        key = fold(item["word"])
        if key not in lookup:
            missing.append(item)
            continue
        i = lookup[key]
        w, m, e = lex["words"][i], morph["entries"][i], evid["entries"][i]
        # Upgraded, separately reviewed entries are permitted on later releases:
        # the importer never overwrites independently reviewed data.
        if w["status"] != STATUS:
            continue
        ensure(w["word"] == item["word"] and w["meaning"] == item["gloss"]
               and w["pos"] == POS, "Provisional entry diverged: " + item["word"])
        ensure(not m["stem"] and not m["inflections"] and not m["formsEdited"],
               "Unverified entry has gained unlicensed morphology: " + item["word"])
        grade = {c["field"]: c["assessment"] for c in e["claims"]}
        ensure(grade == {"headword": "inference", "meaning": "inference",
                         "pos": "inference", "stem": "unverified"},
               "Evidence was silently promoted: " + item["word"])

    if not write:
        ensure(not missing, "%d manifest candidates absent; rerun with --write to append"
               % len(missing))
        ensure(release["headwords"] == len(lex["words"]), "Release manifest out of sync")
        print("PASS: %d archived verb index candidates verified; no new grammar licensed"
              % len(entries))
        return

    ensure(missing, "No new entries to append; no changes required")
    ensure(manifest["version"] != release["version"],
           "An imported batch must advance release version")
    old_count = len(lex["words"])
    for item in missing:
        l, m, e = make_entry(item)
        lex["words"].append(l)
        morph["entries"].append(m)
        evid["entries"].append(e)
    p = read("paradigms.json")
    r = read("references.json")
    for obj in (lex, morph, evid, p, r, release):
        obj["version"] = manifest["version"]
    release["headwords"] = len(lex["words"])
    release["paradigms"] = len(p["paradigms"])
    sys.path.insert(0, str(ROOT / "tools"))
    from build_dictionary import assemble, run as rebuild
    assemble(lex, morph, evid, p, r, release)
    for path, obj in (
        ("data/lexicon.json", lex),
        ("data/morphology.json", morph),
        ("data/evidence.json", evid),
        ("paradigms.json", p), ("references.json", r),
        ("release.json", release)
    ):
        (ROOT / path).write_text(dump(obj), encoding="utf-8")
    rebuild(write=True)
    print("PASS: %d → %d lexical entries; %d new source-index candidates"
          % (old_count, len(lex["words"]), len(missing)))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default=DEFAULT)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        run(args.manifest, write=args.write)
    except (KeyError, IndexError, ValueError, AssertionError, TypeError) as exc:
        print("FAIL:", exc, file=sys.stderr)
        sys.exit(1)

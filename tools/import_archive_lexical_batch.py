#!/usr/bin/env python3
"""Apply or validate the frozen Batch 07 nonverb archive index.

This is a source-index transfer, not a historical verification pass.
"""
import argparse
import json
import re
import sys
from pathlib import Path
from import_archive_verb_batch import read, dump, fold, ensure, make_entry, STATUS

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = "research/batches/classical_archive_lexical_batch07_2026_10_29.json"
ALLOWED = {"noun", "adj", "adv", "particle", "pron", "num", "intj"}

def validate(manifest):
    ensure(manifest.get("format") == "tlahtolli-classical-archive-lexical-intake-v1",
           "Wrong frozen manifest format")
    entries = manifest.get("entries")
    ensure(isinstance(entries, list) and len(entries) == manifest.get("new_candidates") and entries,
           "Candidate count mismatch")
    shards = [read("research/amoxcalli_archive/kaikki_0%d.json" % i)["rows"] for i in range(4)]
    seen, counts = set(), {}
    for item in entries:
        word, raw, pos = item["word"], item["source_word"], item["pos"]
        ensure(pos in ALLOWED and re.fullmatch(r"[^\W\d_][^\s/]{2,89}", word, flags=re.UNICODE),
               "Invalid headword/POS: " + word)
        ensure(fold(word) not in seen, "Duplicate manifest key: " + word)
        seen.add(fold(word))
        row = shards[item["shard"]][item["row"]]
        ensure(row[:3] == [raw, pos, "nci"], "Archive locator mismatch: " + word)
        ensure(any(s[0] and s[0][0] == item["gloss"] and s[2] == item["tags"]
                   for s in row[3]), "Source gloss/tag mismatch: " + word)
        can = [form[0] for form in row[4] if "canonical" in form[1]]
        ensure(word == raw or (len(can) == 1 and word == can[0] and fold(word) == fold(raw)),
               "Unsourced headword normalization: " + word)
        counts[pos] = counts.get(pos, 0) + 1
    ensure(counts == manifest["by_pos"], "POS count mismatch")
    return entries

def make(item):
    lex, morph, evidence = make_entry(item)
    pos = item["pos"]
    lex["pos"] = pos + " (provisional archive index)"
    lex["notes"] = (
        "Unreviewed Kaikki/Wiktionary nci-labelled %s source index only; source spelling, "
        "historical era, precise meaning and grammar are NOT independently verified. "
        "Source tags: %s. Shard %s, row %s. Wiktionary CC BY-SA 3.0/GFDL; "
        "derived Amoxcalli CC BY-SA 4.0."
        % (pos, ", ".join(item["tags"]) or "none", item["shard"], item["row"])
    )
    morph["grammarNotes"] = (
        "Archive lexical index only. No source-checked noun class, stem, animacy, "
        "plural, possession, verbal morphology or paradigm."
    )
    evidence["claims"][2]["note"] = (
        "Community archive reports %s; its precise Classical lexical category, "
        "historical period and inflection remain unverified." % pos
    )
    return lex, morph, evidence

def run(manifest_path, write=False):
    manifest = read(manifest_path)
    entries = validate(manifest)
    lex = read("data/lexicon.json")
    morph = read("data/morphology.json")
    evid = read("data/evidence.json")
    release = read("release.json")
    ensure(len(lex["words"]) == len(morph["entries"]) == len(evid["entries"]),
           "Canonical sources not aligned")
    existing = [fold(w["word"]) for w in lex["words"]]
    ensure(len(existing) == len(set(existing)), "Existing diacritic-fold collision")
    positions = {key: i for i, key in enumerate(existing)}
    missing = []
    for item in entries:
        i = positions.get(fold(item["word"]))
        if i is None:
            missing.append(item)
            continue
        current = lex["words"][i]
        if current["status"] != STATUS:
            continue  # Do not overwrite later independently source-reviewed entries.
        expected = make(item)
        ensure(current == expected[0] and morph["entries"][i] == expected[1]
               and evid["entries"][i] == expected[2],
               "Provisional source record changed without review: " + item["word"])
    if not write:
        ensure(not missing, "%d candidates still absent; use --write" % len(missing))
        ensure(release["headwords"] == len(lex["words"]), "Release headword count mismatch")
        print("PASS: %d exact source-row provisional nonverb candidates" % len(entries))
        return
    ensure(missing and manifest["version"] != release["version"],
           "Nothing new to import or release version is not advanced")
    for item in missing:
        l, m, e = make(item)
        lex["words"].append(l)
        morph["entries"].append(m)
        evid["entries"].append(e)
    paradigms = read("paradigms.json")
    references = read("references.json")
    for obj in (lex, morph, evid, paradigms, references, release):
        obj["version"] = manifest["version"]
    release["headwords"] = len(lex["words"])
    release["paradigms"] = len(paradigms["paradigms"])
    for path, obj in (
        ("data/lexicon.json", lex), ("data/morphology.json", morph),
        ("data/evidence.json", evid), ("paradigms.json", paradigms),
        ("references.json", references), ("release.json", release)
    ):
        (ROOT / path).write_text(dump(obj), encoding="utf-8")
    from build_dictionary import assemble, run as rebuild
    assemble(lex, morph, evid, paradigms, references, release)
    rebuild(write=True)
    print("PASS: imported %d provisional nonverb headwords, no new grammar" % len(missing))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default=DEFAULT)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        run(args.manifest, write=args.write)
    except (ValueError, KeyError, IndexError, TypeError, AssertionError) as exc:
        print("FAIL:", exc, file=sys.stderr)
        sys.exit(1)

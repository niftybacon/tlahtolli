#!/usr/bin/env python3
"""Build/check Tlahtōlli's legacy dictionary exports from separated editorial sources.

Canonical inputs: data/{lexicon,morphology,evidence}.json.
Generated compatibility artifacts: dictionary.json, claim_audit.csv,
and the embedded offline seed in index.html.
No grammatical/historical truth is inferred by this structural build.
"""
import argparse
import csv
import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MORPH_KEYS = (
    "stem", "number", "animacy", "plural", "pluralStatus", "absolutive",
    "possessed", "grammarSource", "grammarNotes", "inflections", "formsEdited"
)
WORD_ORDER = (
    "word", "meaning", "pos", "stem", "original", "variety", "status",
    "source", "example", "translation", "notes", "number", "animacy",
    "plural", "pluralStatus", "absolutive", "possessed", "grammarSource",
    "grammarNotes", "inflections", "formsEdited", "claims"
)
AUDIT_HEADER = (
    "headword", "claim_field", "review_level", "source_url",
    "exact_locator_or_section", "editorial_conclusion", "reviewer",
    "reviewed_date"
)
SEED_MARKER = "window.TLAHTOLLI_OFFLINE_SEED="


def expect(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def entry_key(entry):
    expect(isinstance(entry, dict), "Each entry must be a JSON object")
    word, variety = entry.get("word"), entry.get("variety")
    expect(isinstance(word, str) and bool(word.strip()), "Missing headword")
    expect(isinstance(variety, str) and bool(variety.strip()), "Missing variety")
    return word, variety


def ordered_keys(items, label):
    expect(isinstance(items, list), label + " must be an array")
    result = [entry_key(item) for item in items]
    expect(len(result) == len(set(result)), label + " has duplicate (headword, variety) keys")
    return result


def assemble(lexicon, morphology, evidence, paradigms, references, release):
    for document, kind in (
        (lexicon, "tlahtolli-lexicon-source"),
        (morphology, "tlahtolli-morphology-source"),
        (evidence, "tlahtolli-evidence-source")
    ):
        expect(document.get("format") == kind and document.get("schema") == 1,
               "Invalid source schema: " + kind)
    version = lexicon.get("version")
    expect(isinstance(version, str) and bool(version), "Missing source version")
    for name, doc in (
        ("morphology", morphology), ("evidence", evidence),
        ("paradigms", paradigms), ("references", references), ("release", release)
    ):
        expect(doc.get("version") == version, "Version mismatch in " + name)
    expect(release.get("format") == "tlahtolli-release-manifest" and release.get("schema") == 1,
           "Invalid release manifest")
    lems = lexicon.get("words")
    morphs = morphology.get("entries")
    evids = evidence.get("entries")
    keys = ordered_keys(lems, "lexicon")
    expect(keys == ordered_keys(morphs, "morphology"),
           "Morphology entries are missing, reordered or miskeyed")
    expect(keys == ordered_keys(evids, "evidence"),
           "Evidence entries are missing, reordered or miskeyed")
    expect(release.get("headwords") == len(keys), "Release headword count differs")
    expect(release.get("paradigms") == len(paradigms.get("paradigms", {})),
           "Release paradigm count differs")
    expect(isinstance(references.get("witnesses"), list), "Missing reference atlas")
    expect(len(keys) >= 88, "Founding dictionary entries cannot be removed")
    new_words = []
    for lex, morph, evid in zip(lems, morphs, evids):
        key = entry_key(lex)
        forbidden = set(MORPH_KEYS) | {"claims"}
        expect(not (set(lex) & forbidden), "Lexicon contains morphology/evidence for " + repr(key))
        expect(set(morph) == set(MORPH_KEYS) | {"word", "variety"},
               "Missing or extra morphology fields for " + repr(key))
        expect(set(evid) == {"word", "variety", "claims"},
               "Evidence fields misplaced for " + repr(key))
        expect(isinstance(morph["inflections"], list), "Inflections must be a list for " + repr(key))
        expect(isinstance(evid["claims"], list), "Claims must be a list for " + repr(key))
        expect(isinstance(morph["formsEdited"], bool), "formsEdited must be boolean for " + repr(key))
        expect(all(isinstance(c, dict) for c in evid["claims"]),
               "Non-object claim for " + repr(key))
        combined = {**lex, **morph, **evid}
        new_words.append({name: combined[name] for name in WORD_ORDER if name in combined}
                         | {name: value for name, value in combined.items() if name not in WORD_ORDER})
    dictionary = {
        "format": "tlahtolli-published-dictionary", "schema": 1,
        "version": version, "variety": lexicon.get("variety"),
        "editorial_policy": lexicon.get("editorial_policy"), "words": new_words
    }
    return dictionary


def audit_rows(dictionary):
    for w in dictionary["words"]:
        for c in w["claims"]:
            yield (
                w["word"], c.get("field", ""), c.get("assessment", ""),
                c.get("source", ""), c.get("locator", ""), c.get("note", ""),
                c.get("reviewer", ""), c.get("checkedAt", "")
            )


def audit_csv(dictionary):
    result = io.StringIO(newline="")
    result.write(",".join(AUDIT_HEADER) + "\n")
    writer = csv.writer(result, quoting=csv.QUOTE_ALL, lineterminator="\n")
    writer.writerows(audit_rows(dictionary))
    return result.getvalue()


def embedded_seed(html):
    start = html.find(SEED_MARKER)
    expect(start >= 0, "Missing offline seed in index.html")
    begin = start + len(SEED_MARKER)
    obj, used = json.JSONDecoder().raw_decode(html[begin:])
    expect(isinstance(obj, dict), "Offline seed is not an object")
    expect(html[begin + used:begin + used + 1] == ";", "Offline seed missing final semicolon")
    return obj, begin, begin + used


def render_seed(html, dictionary, paradigms):
    current, begin, end = embedded_seed(html)
    target = {
        "words": dictionary["words"],
        "paradigms": paradigms["paradigms"],
        "version": dictionary["version"]
    }
    if current == target:
        return html
    packed = json.dumps(target, ensure_ascii=False, separators=(",", ":"))
    return html[:begin] + packed + html[end:]


def check_or_write(path, expected, write=False, json_semantics=False):
    actual = path.read_text(encoding="utf-8")
    good = (json.loads(actual) == json.loads(expected)) if json_semantics else actual == expected
    if good:
        print("OK:", path.relative_to(ROOT))
        return
    if not write:
        raise ValueError("Generated artifact out of date: " + str(path.relative_to(ROOT))
                         + " (run python tools/build_dictionary.py --write)")
    path.write_text(expected, encoding="utf-8")
    print("UPDATED:", path.relative_to(ROOT))


def run(write=False):
    lexicon = read_json(DATA / "lexicon.json")
    morphology = read_json(DATA / "morphology.json")
    evidence = read_json(DATA / "evidence.json")
    paradigms = read_json(ROOT / "paradigms.json")
    references = read_json(ROOT / "references.json")
    release = read_json(ROOT / "release.json")
    dictionary = assemble(lexicon, morphology, evidence, paradigms, references, release)
    # No file mutations until all three source documents and version locks pass.
    check_or_write(ROOT / "dictionary.json",
                   json.dumps(dictionary, ensure_ascii=False, indent=2) + "\n",
                   write=write, json_semantics=True)
    check_or_write(ROOT / "claim_audit.csv", audit_csv(dictionary), write=write)
    current_html = (ROOT / "index.html").read_text(encoding="utf-8")
    check_or_write(ROOT / "index.html", render_seed(current_html, dictionary, paradigms),
                   write=write)
    print("PASS: normalized sources ->", len(dictionary["words"]),
          "headwords,", sum(len(w["claims"]) for w in dictionary["words"]),
          "evidence records,", sum(len(w["inflections"]) for w in dictionary["words"]),
          "forms. No historical attestation implied.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="fail if derived outputs are stale (default)")
    mode.add_argument("--write", action="store_true", help="regenerate legacy exports and offline HTML seed")
    args = parser.parse_args()
    try:
        run(write=args.write)
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print("FAILED:", exc, file=sys.stderr)
        sys.exit(1)

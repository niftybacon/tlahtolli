#!/usr/bin/env python3
"""Embed source-controlled morphological engine into offline HTML without data changes.

Usage: python tools/build_morphology_engine.py --write / --check
This modifies only the guarded JS region in index.html; Phase 2's dictionary
builder separately owns the offline lexicon/paradigm seed.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools" / "morphology_engine.js"
HTML = ROOT / "index.html"
BEGIN = "/* BEGIN SOURCE-CONTROLLED MORPHOLOGY ENGINE */"
END = "/* END SOURCE-CONTROLLED MORPHOLOGY ENGINE */"
ANCHOR = "renderSourceAtlas();syncSourceAtlas();render();"

def generate(html, code):
    block = BEGIN + "\n" + code.rstrip() + "\n" + END
    start = html.find(BEGIN)
    if start >= 0:
        finish = html.find(END, start)
        if finish < 0:
            raise ValueError("Morphology engine start marker lacks an end marker.")
        if html.find(BEGIN, start + len(BEGIN)) >= 0:
            raise ValueError("Duplicate morphology engine blocks.")
        return html[:start] + block + html[finish + len(END):]
    anchor = html.rfind(ANCHOR)
    if anchor < 0:
        raise ValueError("Cannot find end-of-application initialization.")
    return html[:anchor] + block + "\n" + html[anchor:]

def run(write=False):
    html = HTML.read_text(encoding="utf-8")
    code = SOURCE.read_text(encoding="utf-8")
    if "const TlahtolliMorphEngine" not in code:
        raise ValueError("Engine source appears incomplete")
    expected = generate(html, code)
    if expected == html:
        print("PASS: source-controlled morphology engine matches offline HTML")
    elif write:
        HTML.write_text(expected, encoding="utf-8")
        print("UPDATED: index.html source-controlled morphology engine")
    else:
        raise ValueError("Stale morphology-engine embed; run python tools/build_morphology_engine.py --write")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    g = parser.add_mutually_exclusive_group()
    g.add_argument("--write", action="store_true")
    g.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        run(write=args.write)
    except ValueError as exc:
        print("FAILED:", exc, file=sys.stderr)
        sys.exit(1)

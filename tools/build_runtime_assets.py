#!/usr/bin/env python3
"""Content-address script requests; report a reproducible code/data runtime ID.

Run --write after editing a local script or translator data, then --check in CI.
Hashes use UTF-8/LF text so Windows and Linux checkouts produce the same URLs.
This busts browser caches; GitHub Pages query URLs are not immutable releases.
"""
import argparse
import hashlib
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = ["dictionary.json", "paradigms.json", "tools/morphology_engine.js",
        "data/clause_grammar.json", "data/possessed_form_evidence.json",
        "data/source_finite_context.json", "data/passages.json",
        "research/translation_corpus/research_examples.json",
        "research/translation_corpus/source_reviews/ENL_BC16_1573.json"]
DYNAMIC = ["translator-sentence.js", "translator-english.js"]
SCRIPT = re.compile(r'<script\b[^>]*?\ssrc="\./([\w-]+\.js)(?:\?v=[a-f0-9]+)?"[^>]*>')


def generate(html, read):
    names = sorted(set(SCRIPT.findall(html)) | set(DYNAMIC) | set(DATA))
    hashes = {name: hashlib.sha256(read(name).replace('\r\n', '\n').encode('utf-8')).hexdigest()[:16]
              for name in names}
    runtime = hashlib.sha256('\n'.join(f'{n}:{hashes[n]}' for n in names).encode()).hexdigest()[:16]

    def replace(match):
        name = match[1]
        tag = re.sub(r'(?<=\s)src="[^"]+"', f'src="./{name}?v={hashes[name]}"', match[0], count=1)
        if name == 'translator-integrated.js':
            tag = re.sub(r' data-(?:sentence-src|english-src|runtime)="[^"]*"', '', tag)
            tag = tag[:-1] + (f' data-runtime="{runtime}"'
                f' data-sentence-src="./translator-sentence.js?v={hashes[DYNAMIC[0]]}"'
                f' data-english-src="./translator-english.js?v={hashes[DYNAMIC[1]]}">')
        return tag

    if 'translator-integrated.js' not in SCRIPT.findall(html):
        raise ValueError('Missing translator loader script')
    return SCRIPT.sub(replace, html)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = ROOT / 'index.html'
    html = target.read_text(encoding='utf-8')
    expected = generate(html, lambda n: (ROOT / n).read_text(encoding='utf-8'))
    if html != expected:
        if not args.write:
            raise SystemExit('Stale runtime URLs: run python tools/build_runtime_assets.py --write')
        target.write_text(expected, encoding='utf-8', newline='\n')
    print('PASS runtime script URLs and code/data identifier')

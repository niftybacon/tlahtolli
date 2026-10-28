#!/usr/bin/env python3
"""Research-only, aggregate lexical scan of all twelve Florentine Codex books.

Source: Berthoud (2022), Zenodo doi:10.5281/zenodo.7213020.
Reads downloaded texts transiently; exports NO raw text, sentences or translations.
Printed/page-wrapped lines in this source cause broken words: lexical-token counts
are rough orthographic-unit measurements, NOT reliable linguistic word counts.
No rights for redistribution or machine training are inferred from access.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import tempfile
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RECORD = "https://zenodo.org/records/7213020"
BOOKS = [
    (1, "The Gods"),
    (2, "Ceremonies"),
    (3, "The Origins of the Gods"),
    (4, "The Art of Divination"),
    (5, "The Omens"),
    (6, "Rhetoric and Moral Philosophy"),
    (7, "The Sun, Moon, Stars, and the Binding of the Years"),
    (8, "Kings and Lords"),
    (9, "The Merchants"),
    (10, "The People"),
    (11, "Earthly Things"),
    (12, "The Conquest of Mexico"),
]
TOKEN = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)*", re.UNICODE)
# Existing evidence-backed headwords; never silently mix modern varieties.
CLASSICAL = {"Classical Nahuatl", "Classical Nahuatl (historical dictionary lemma)"}
MAX_SOURCE_BYTES = 1_500_000


def fold(s: str) -> str:
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s.casefold())
                   if unicodedata.category(c) != "Mn")


def vocabulary(path: Path) -> set[str]:
    d = json.loads(path.read_text(encoding="utf-8"))
    result = set()
    for entry in d["words"]:
        if entry.get("variety") not in CLASSICAL:
            continue
        word = entry.get("word", "").strip()
        if word and len(TOKEN.findall(word)) == 1:
            result.add(fold(word))
        original = entry.get("original", "").strip()
        if original and len(TOKEN.findall(original)) == 1:
            result.add(fold(original))
    return result


def get_file(number: int, title: str) -> str:
    # Only the public research deposit is accessed; no crawling of Getty's edition.
    filename = f"Book {number} - {title}.txt"
    url = f"{RECORD}/files/{quote(filename)}?download=1"
    last_error = None
    for attempt in range(4):
        try:
            request = Request(url, headers={"User-Agent": "Tlahtolli-Codex-Research/0.1 (aggregate statistics only)", "Accept": "text/plain"})
            with urlopen(request, timeout=45) as response:
                data = response.read(MAX_SOURCE_BYTES + 1)
                if len(data) > MAX_SOURCE_BYTES:
                    raise ValueError(f"Book {number} exceeds size limit")
                if not data or b"<html" in data[:300].lower():
                    raise ValueError(f"Book {number}: unexpected HTML or empty file")
                return data.decode("utf-8-sig")
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Could not retrieve book {number} from Zenodo: {last_error}")


def analyze_book(book: int, title: str, text: str, known: set[str]) -> dict:
    if not text or len(text.strip()) < 120:
        raise ValueError(f"Book {book}: insufficient textual input")
    tokens = [fold(token) for token in TOKEN.findall(text)]
    tokens = [token for token in tokens if token]
    c = Counter(tokens)
    # Common words may also be text-wrapped fragments; avoid linguistically
    # asserting these are complete, correctly segmented Nahuatl words.
    recognized = sum(n for token, n in c.items() if token in known)
    return {
        "book": book,
        "title": title,
        "source_file": f"Book {book} - {title}.txt",
        "source": RECORD,
        "reference": f"https://florentinecodex.getty.edu/en/book/{book}",
        "approximate_orthographic_units": len(tokens),
        "unique_orthographic_forms": len(c),
        "lexicon_exact_or_diacritic_fold_hits": recognized,
        "lexicon_approximate_coverage_pct": round(recognized / len(tokens) * 100, 2) if tokens else 0,
        "top_orthographic_forms": [[term, freq] for term, freq in c.most_common(12)],
        "source_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "quality_warning": "Hard-wrapped source lines split some words; this is a preliminary orthographic scan, not a validated word/morpheme count.",
    }


def analyze_texts(texts: dict[int, str], lexicon: Path) -> dict:
    expected = {n for n, _ in BOOKS}
    if set(texts) != expected:
        raise ValueError(f"Expected all 12 books; found {sorted(texts)}")
    known = vocabulary(lexicon)
    books = [analyze_book(n, title, texts[n], known) for n, title in BOOKS]
    return {
        "format": "tlahtolli-codex-aggregate-analysis",
        "schema": 1,
        "created_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {
            "name": "Transcript of the Florentine Codex (Nahuatl)",
            "transcription_editor": "Valery A. Berthoud F.",
            "edition": "Zenodo, 2022, version 1.0",
            "record_url": RECORD,
            "doi": "10.5281/zenodo.7213020",
            "license_review": "No confirmed machine-training or redistribution permission. Do not commit source text or use it for model training without separate review.",
            "metadata_warning": "Zenodo's language label says Central Huasteca Nahuatl; the deposit describes the historical Florentine Codex. Verify transcriber, edition and tagging manually.",
            "text_quality": "Some special characters are missing; page-layout hard wraps split lexical words. No automatic word-joining has been validated.",
        },
        "scope": "All 12 downloaded historical transcription files, aggregate research scan only",
        "train_eligible": False,
        "verbatim_source_text_in_output": False,
        "method": "Unicode letter-run counter, case-folded and diacritic-folded; exact match against published Classical Nahuatl dictionary headwords/original spellings. No full sentence analysis.",
        "totals": {
            "books_checked": len(books),
            "approximate_orthographic_units": sum(b["approximate_orthographic_units"] for b in books),
            "lexicon_approximate_hits": sum(b["lexicon_exact_or_diacritic_fold_hits"] for b in books),
            "lexicon_matching_strings_indexed": len(known),
            "lexicon_headwords_indexed": sum(w.get("variety") in CLASSICAL for w in json.loads(lexicon.read_text(encoding="utf8"))["words"]),
        },
        "books": books,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--download-zenodo", action="store_true", help="Fetch public research deposit transiently, 12 files")
    group.add_argument("--input-dir", type=Path, help="Directory with 12 locally obtained .txt files")
    p.add_argument("--output", type=Path, default=ROOT / "research/florentine_codex/analysis.json")
    p.add_argument("--lexicon", type=Path, default=ROOT / "dictionary.json")
    args = p.parse_args()
    if args.download_zenodo:
        texts = {}
        for n, title in BOOKS:
            print(f"Fetching and analyzing {n}/12: {title}", flush=True)
            texts[n] = get_file(n, title)
            time.sleep(0.4)
    else:
        texts = {}
        for n, title in BOOKS:
            f = args.input_dir / f"Book {n} - {title}.txt"
            texts[n] = f.read_text(encoding="utf-8-sig")
    report = analyze_texts(texts, args.lexicon)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved aggregate research analysis for all {report['totals']['books_checked']} books"
          f" ({report['totals']['approximate_orthographic_units']} approximate orthographic units).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Verify that every candidate pair REALLY occurs in the pinned 1890 edition.

This is bibliographic/text-integrity verification, NOT independent semantic
alignment review or gold evaluation. It catches invented, shifted, truncated
or accidentally edited transcriptions before they enter neural research.
No original printed book, modern edition, or trained weights are vendored.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

SOURCE_REPO = (
    "GITenberg/Ancient-Nahuatl-Poetry-Containing-the-Nahuatl-Text-of-"
    "XXVII-Ancient-Mexican-Poems--13-Brinton__12219"
)
SOURCE_COMMIT = "ab90a087b33d8c767caa867674dbf33e0cee084f"
SOURCE_BLOB_SHA = "76b6a70282eb9c7cb973125661aa8113fe6cece1"
SOURCE_URL = f"https://raw.githubusercontent.com/{SOURCE_REPO}/{SOURCE_COMMIT}/12219.txt"
CANDIDATES = Path("research/neural_training/brinton_1890_poetry_weak_en.jsonl")
LINE = re.compile(r"#L([1-9][0-9]*)$")
POEM = re.compile(r"^\s*([IVX]+)\.\s*$")
VERSE = re.compile(r"^\s*([0-9]{1,2})\.\s*")


class AttestationError(ValueError):
    pass


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def fetch_pinned_source() -> bytes:
    req = Request(SOURCE_URL, headers={"User-Agent": "Tlahtolli-Historical-Source-Audit/1"})
    with urlopen(req, timeout=30) as response:
        # Real public-domain 1890 plaintext is ~277 KB. Never allow unbounded download.
        data = response.read(400001)
    if len(data) > 400000:
        raise AttestationError("Unexpected source size")
    return data


def _normalized(s: str) -> str:
    return " ".join(s.split())


def _line_number(url: str, label: str) -> int:
    if not isinstance(url, str):
        raise AttestationError(f"Missing {label} source URL")
    prefix = f"https://github.com/{SOURCE_REPO}/blob/master/12219.txt"
    if not url.startswith(prefix + "#L"):
        raise AttestationError(f"{label} pointer does not refer to the pinned source")
    match = LINE.search(url)
    if not match:
        raise AttestationError(f"Invalid {label} line reference")
    return int(match.group(1))


def _start_text(lines: list[str], n: int) -> str:
    if n < 1 or n > len(lines):
        raise AttestationError("Source line outside the pinned edition")
    return re.sub(r"^\s*[0-9]{1,2}\.\s*", "", lines[n - 1])


def _section_text(lines: list[str], start: int, stop: int) -> str:
    return _normalized("".join([_start_text(lines, start)] + lines[start:stop]))


def verify_record(row: dict, lines: list[str], *, prose_begin: int, prose_end: int) -> dict:
    source = row.get("original")
    translation = row.get("translation")
    if not isinstance(source, str) or not isinstance(translation, dict):
        raise AttestationError("Historical record is not a source/translation pair")
    if row.get("source_blob_sha") != SOURCE_BLOB_SHA:
        raise AttestationError(f"{row.get('record_id')}: source Git object SHA changed")
    if translation.get("alignment") != "candidate" or translation.get("language") != "en":
        raise AttestationError("Source text verifier cannot promote a candidate translation")
    n = _line_number(row.get("source_url"), "Nahuatl")
    t = _line_number(translation.get("source_url"), "English")
    if not prose_begin <= n < t < prose_end:
        raise AttestationError(f"{row.get('record_id')}: source and English must be in same printed poem section")
    record = row.get("record_id") or ""
    suffix = re.search(r"-([ivx]+)-([0-9]{2})$", record)
    if not suffix:
        raise AttestationError("Historical stanza ID does not specify poem and verse")
    poem_expected, verse_expected = suffix.group(1).upper(), int(suffix.group(2))
    # Check the actual printed poem label before this stanza.
    prior = next((m.group(1) for j in range(n - 1, prose_begin - 1, -1)
                  if (m := POEM.fullmatch(lines[j].strip()))), None)
    if prior != poem_expected:
        raise AttestationError(f"{record}: selected verse belongs to a different printed song ({prior})")
    # Some editions print stanza labels on a separate preceding line. The
    # next two physical lines still have to match the original stanza number.
    source_heading = next((int(m.group(1)) for j in (n - 1, n - 2, n - 3)
                           if j >= 0 and (m := VERSE.match(lines[j]))), None)
    english_heading = next((int(m.group(1)) for j in (t - 1, t - 2, t - 3)
                            if j >= 0 and (m := VERSE.match(lines[j]))), None)
    if source_heading != verse_expected or english_heading != verse_expected:
        raise AttestationError(f"{record}: not a genuine same-number printed stanza pair")
    # Nahuatl should occupy *exactly* the original lines preceding its
    # independently labelled English stanza, except whitespace.
    printed_source = _section_text(lines, n, t - 1)
    if printed_source != _normalized(source):
        raise AttestationError(f"{record}: Nahuatl differs from the printed historical source")
    # English may be followed by another stanza's number or a poem heading.
    # Stop at that exact boundary; never accept a short matching excerpt.
    last = t
    for j in range(t, prose_end):
        if VERSE.match(lines[j]) or POEM.fullmatch(lines[j].strip()):
            last = j
            break
    else:
        last = prose_end
    printed_english = _section_text(lines, t, last)
    if printed_english != _normalized(translation.get("text") or ""):
        raise AttestationError(f"{record}: English differs from the published stanza")
    return {"record_id": record, "song": poem_expected, "verse": verse_expected,
            "published_nahuatl_line": n, "published_english_line": t}


def verify_manifest(manifest: Path, original_bytes: bytes) -> dict:
    if git_blob_sha(original_bytes) != SOURCE_BLOB_SHA:
        raise AttestationError("Brinton source byte stream is not the pinned Git blob")
    text = original_bytes.decode("utf-8")
    lines = text.splitlines(keepends=True)
    begin = next((i for i, line in enumerate(lines)
                  if line.strip() == "ANCIENT NAHUATL POEMS." and i > 100), None)
    end = next((i for i, line in enumerate(lines)
                if begin is not None and i > begin and line.strip() == "NOTES."), None)
    if begin is None or end is None or end <= begin:
        raise AttestationError("Could not delimit original text and translation sequence")
    rows = [json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(rows) != 150:
        raise AttestationError("Changing historical corpus size requires explicit editorial audit")
    reviewed = []
    for row in rows:
        reviewed.append(verify_record(row, lines, prose_begin=begin, prose_end=end))
    if len({r["record_id"] for r in reviewed}) != len(reviewed):
        raise AttestationError("Duplicate original poem and stanza ID")
    return {
        "format": "tentli-brinton-pinned-source-collation-v1",
        "source_git_commit": SOURCE_COMMIT,
        "source_git_blob_sha": SOURCE_BLOB_SHA,
        "historical_alignment_candidates_collated": len(reviewed),
        "source_work_count": len({r["song"] for r in reviewed}),
        "original_transcription_collated": True,
        "english_stanza_spelling_collated": True,
        "exact_source_pointer_lines_checked": True,
        "independent_manuscript_facsimile_review": False,
        "verified_literal_translations": 0,
        "gold_translation_pairs": 0,
        "semantic_accuracy": None,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, default=CANDIDATES)
    p.add_argument("--source-file", type=Path, help="Optional local copy of the pinned 1890 plain text")
    a = p.parse_args()
    data = a.source_file.read_bytes() if a.source_file else fetch_pinned_source()
    print(json.dumps(verify_manifest(a.manifest, data), indent=2))


if __name__ == "__main__":
    main()

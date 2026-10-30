"""Prioritize source-linked bilingual review, without conferring linguistic authority.

Reads the project's own 44 source-checked glossary index and the existing
historical candidate corpus. Adds three independently located Molina/ODN
lexical anchors, including ambiguous *in*. Every score is an editorial
REVIEW PRIORITY, never a word-translation or sentence-correctness score.
Neither a lexical anchor nor a selected stanza becomes gold or train-approved.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import json
from pathlib import Path
import re
from typing import Any

from .corpus import load_corpus

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "research/verified_44_source_index.csv"
CANDIDATES = ROOT / "research/neural_training/brinton_1890_poetry_weak_en.jsonl"

# Short, independently source-located gloss descriptions: NOT copies of
# ODN's full editorial entries or unlicensed historical parallel passages.
# Original 1571 Molina folio locations are retained separately.
ADDITIONAL_ANCHORS = (
    {
        "headword": "atl", "part_of_speech": "noun",
        "glosses": ["water", "urine", "metaphorical warfare", "calendar sign"],
        "primary_gloss": "water",
        "source_url": "https://nahuatl.wired-humanities.org/content/atl",
        "historical_locator": "Alonso de Molina (1571), Nahuatl–Spanish II, fol. 8r",
        "context_sensitive": True,
    },
    {
        "headword": "xochitl", "part_of_speech": "noun",
        "glosses": ["flower", "calendar sign", "personal name", "figurative poetic flower"],
        "primary_gloss": "flower",
        "source_url": "https://nahuatl.wired-humanities.org/content/xochitl",
        "historical_locator": "Alonso de Molina (1571), Nahuatl–Spanish II, fol. 160r col. 2",
        "context_sensitive": True,
    },
    {
        "headword": "in", "part_of_speech": "particle",
        "glosses": [
            "demonstrative this", "article-like function",
            "subordinator", "discourse boundary marker", "often untranslated"
        ],
        "primary_gloss": None,
        "source_url": "https://nahuatl.wired-humanities.org/content/in",
        "historical_locator": "Molina (1571), II fol. 38r; Olmos; Lockhart, Nahuatl as Written p. 164",
        "context_sensitive": True,
    },
)

WORD = re.compile(r"[^\W\d_]+", flags=re.UNICODE)
FLOWER = re.compile(r"\bflowers?\b", flags=re.IGNORECASE)
WATER = re.compile(r"\bwater\b", flags=re.IGNORECASE)
MAX_PER_WORK = 4


def source_index_anchors(path: Path = INDEX) -> list[dict[str, Any]]:
    """Only a project's own source-checked index, NOT an archive scrape."""
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or not {
            "headword", "meaning", "pos", "lexicon_url", "lexicon_locator"
        }.issubset(reader.fieldnames):
            raise ValueError("Changed historical lexicon index schema")
        rows = list(reader)
    if len(rows) != 44:
        raise ValueError("Expected the existing 44 source-indexed entries; do not quietly reclassify new words")
    results = []
    seen = set()
    for row in rows:
        word = row["headword"].strip().casefold()
        if not word or " " in word or not WORD.fullmatch(word):
            raise ValueError("Ambiguous source-index headword spelling")
        if word in seen:
            raise ValueError("Duplicate source-index headword")
        seen.add(word)
        source_url = row["lexicon_url"].strip()
        locator = row["lexicon_locator"].strip()
        if not source_url.startswith("https://nahuatl.wired-humanities.org/") or not locator:
            raise ValueError("A historical lexicon index word is missing its citation")
        senses = [s.strip() for s in row["meaning"].split(";") if s.strip()]
        if not senses:
            raise ValueError("Historical lexicon index missing a meaning")
        results.append({
            "headword": word,
            "part_of_speech": row["pos"].strip(),
            "glosses": senses,
            "primary_gloss": senses[0] if len(senses) == 1 else None,
            "source_url": source_url,
            "historical_locator": locator,
            "context_sensitive": len(senses) != 1 or " or " in senses[0],
            "provenance_grade": "Tlahtolli_entry_level_source_checked_index",
            "lexical_practice_only": True,
            "historical_sentence_pair": False,
            "approved_gold": False,
        })
    return results


def load_anchors(index: Path = INDEX) -> list[dict[str, Any]]:
    anchors = source_index_anchors(index)
    seen = {x["headword"] for x in anchors}
    for item in ADDITIONAL_ANCHORS:
        if item["headword"] in seen:
            raise ValueError("Additional source anchor already occurs in checked index")
        if not item["source_url"].startswith("https://nahuatl.wired-humanities.org/"):
            raise ValueError("Source anchor requires a historic lexicon URL")
        anchors.append({
            **item,
            "provenance_grade": "Molina_1571_entry_located_secondary_index",
            "lexical_practice_only": True,
            "historical_sentence_pair": False,
            "approved_gold": False,
        })
    return sorted(anchors, key=lambda x: x["headword"])


def exact_tokens(source: str) -> list[str]:
    # Exact surface lookup only: no morphological guesses, no silent macron
    # restoration, no assumption that words embedded in compounds match.
    return [w.casefold() for w in WORD.findall(source)]


def prioritize(manifest: Path = CANDIDATES, *, max_items: int = 40,
               per_work: int = MAX_PER_WORK, index: Path = INDEX) -> dict[str, Any]:
    if not 1 <= max_items <= 200 or not 1 <= per_work <= 20:
        raise ValueError("Invalid bounded review size")
    anchors = {a["headword"]: a for a in load_anchors(index)}
    source = load_corpus(manifest)
    if any(r.split == "test" for r in source):
        raise ValueError("Candidate research must not use or inspect gold/test source rows")
    examined = Counter(r.split for r in source)
    by_work = defaultdict(list)
    matched = Counter()
    for row in source:
        # NEVER rank or inspect reserved development English for targeted
        # training selection; keep dev works entirely untouched by triage.
        if row.split != "train":
            continue
        if row.alignment != "candidate" or row.translation_language != "en":
            raise ValueError("Review selector only accepts weak English historical pairs")
        tokens = exact_tokens(row.original)
        content = sorted({t for t in tokens if t in anchors and t != "in"})
        n_in = tokens.count("in")  # intentionally NOT translated as 'the'
        flags = []
        if re.search(r"\[[^\]]+\]", row.original):
            flags.append("edition_diacritic_or_transcription_markup")
        if re.search(r"\b(?:Dios|Yesu|Cristo)\b", row.original, re.IGNORECASE):
            flags.append("mixed_period_religious_vocabulary")
        if "xochitl" in content and not FLOWER.search(row.translation or ""):
            flags.append("flower_word_not_literally_in_english")
        if "atl" in content and not WATER.search(row.translation or ""):
            flags.append("water_word_not_literally_in_english")
        if len(tokens) >= 30:
            flags.append("long_source_for_stanza_alignment")
        if row.original.count(";") >= 2 or row.original.count("?") >= 2:
            flags.append("multiple_clause_boundaries")
        # A high score means useful/uncertain for human review, NEVER that
        # the English is wrong or that the Nahuatl is verified.
        score = min(12, 3 * len(content)) + 5 * len(flags) + min(n_in, 3)
        if len(tokens) <= 13:
            score += 4  # prioritize a tractable manual review unit
        entry = {
            "record_id": row.record_id,
            "work_id": row.work_id,
            "split": row.split,
            "source_url": row.source_url,
            "translation_url": next(
                (x["translation"]["source_url"] for x in _read_raw(manifest)
                 if x["record_id"] == row.record_id), None),
            "review_priority_not_confidence": score,
            "exact_source_indexed_words": content,
            "ambiguous_in_particle_occurrences": n_in,
            "review_flags": flags,
            "suggested_status": "pending_source_and_translation_alignment_review",
            "train_eligibility_increased": False,
            "independent_gold": False,
        }
        by_work[row.work_id].append(entry)
        matched.update(content)
    # Sort globally with a work cap so even one high-frequency poetic
    # manuscript cannot crowd out all other historical reading tasks.
    all_entries = sorted((e for rows in by_work.values() for e in rows),
                         key=lambda e: (-e["review_priority_not_confidence"], e["record_id"]))
    selection = []
    work_counts = Counter()
    for e in all_entries:
        if work_counts[e["work_id"]] >= per_work:
            continue
        work_counts[e["work_id"]] += 1
        selection.append(e)
        if len(selection) >= max_items:
            break
    digest = hashlib.sha256(manifest.read_bytes()).hexdigest()
    return {
        "format": "tentli-historical-bilingual-review-queue-v1",
        "source_manifest_sha256": digest,
        "source_index_sha256": hashlib.sha256(index.read_bytes()).hexdigest(),
        "source_rows": len(source),
        "candidate_train_rows_considered": examined["train"],
        "reserved_development_rows_not_inspected_for_priority": examined["dev"],
        "source_indexed_lexical_anchors": len(anchors),
        "additional_anchors": [a["headword"] for a in ADDITIONAL_ANCHORS],
        "matched_exact_content_headwords": len(matched),
        "max_requested": max_items,
        "max_per_historical_work": per_work,
        "selected_for_human_review": len(selection),
        "review_work_count": len(work_counts),
        "approved_parallel_pairs_added": 0,
        "independent_gold_translation_accuracy": None,
        "output_is_training_or_gold": False,
        "queue": selection,
    }


def _read_raw(manifest: Path) -> list[dict]:
    # Only used for pointers to the *already licensed* source translation,
    # never for adding candidate training examples or reviewing held-out dev.
    return [json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, default=CANDIDATES)
    p.add_argument("--source-index", type=Path, default=INDEX)
    p.add_argument("--limit", type=int, default=40)
    p.add_argument("--max-per-work", type=int, default=MAX_PER_WORK)
    p.add_argument("--output", type=Path)
    p.add_argument("--anchors-output", type=Path)
    a = p.parse_args()
    report = prioritize(a.manifest, max_items=a.limit,
                        per_work=a.max_per_work, index=a.source_index)
    if a.output:
        a.output.parent.mkdir(parents=True, exist_ok=True)
        a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if a.anchors_output:
        a.anchors_output.parent.mkdir(parents=True, exist_ok=True)
        a.anchors_output.write_text(
            json.dumps({
                "format": "tentli-lexicographic-sense-anchors-v1",
                "review_status": "index_sourced_lexical_only_not_parallel_gold",
                "claims": load_anchors(a.source_index),
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "queue"},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

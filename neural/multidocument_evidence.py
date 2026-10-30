"""Scalable, rights-bounded checks of several historical Nahuatl *editions*.

Does not scrape scholarly English, mirror copyrighted transcriptions, merge
dialects, claim source paleography, or auto-promote training/Silver/Gold.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from .canonical_lexical_coverage import ROOT
from .primary_source_context import fetch_page, match_located_excerpt

CATALOG = ROOT / "research/translation_corpus/multidocument_context_probes_2026_10_30.json"
FORMAT = "tentli-multi-document-short-edition-probes-v1"
EXACT_WORKS = {
    "enl-bc16-1573": ("https://enl.wired-humanities.org/bc16", "1573"),
    "enl-bc26-early16": ("https://enl.wired-humanities.org/bc26/elements/bc26a/000", "editorial_estimate_not_exact_year"),
}
EXACT_PROBES = {
    "bc16-sale-ticnamaca": ("enl-bc16-1573", "ticnamaca", "ticnamaca y¯ totlal"),
    "bc16-necoc-measure": ("enl-bc16-1573", "necoc", "çan necoc cempohualli quahuitl"),
    "bc26-tecpancalli": ("enl-bc26-early16", "tecpancalli", "yn don juan tecpancalli ytech poviz"),
    "bc26-field-ordinal": ("enl-bc26-early16", "ocoçacapan", "ynic cecni ocoçacapan"),
}


def load_catalog(path: Path = CATALOG) -> dict:
    obj = json.loads(path.read_text(encoding="utf-8"))
    if obj.get("format") != FORMAT:
        raise ValueError("Unknown historical short-source catalog format")
    works, probes = obj.get("works"), obj.get("probes")
    if not isinstance(works, list) or not isinstance(probes, list):
        raise ValueError("Source works and independently anchored excerpts are mandatory")
    if {w.get("id") for w in works} != set(EXACT_WORKS) or len(works) != len(EXACT_WORKS):
        raise ValueError("Only explicitly reviewed and allowlisted historical works")
    if {p.get("id") for p in probes} != set(EXACT_PROBES) or len(probes) != len(EXACT_PROBES):
        raise ValueError("Only source-located and manually enumerated phrase probes")
    ids = {w["id"]: w for w in works}
    for w in works:
        url, date = EXACT_WORKS[w["id"]]
        if (w.get("source_url") != url
            or (w.get("date") if w["id"] == "enl-bc16-1573" else w.get("date_precision")) != date
            or not w.get("work_id") or not w.get("collection_id")
            or w.get("variety") != "early_colonial_central_nahuatl"
            or w.get("training_eligible") is not False
            or w.get("gold_eligible") is not False
            or w.get("original_image_independently_collated") is not False
            or not w.get("editor") or not w.get("original_repository")
            or not w.get("rights")):
            raise ValueError("Work date, rights or historical period changed without review")
    for p in probes:
        work, form, phrase = EXACT_PROBES[p["id"]]
        if ((p.get("work_id"), p.get("form"), p.get("exact_short_nahuatl")) !=
            (work, form, phrase)):
            raise ValueError("Historical excerpt or form cannot silently change")
        if (p.get("review_status") != "pending"
            or not p.get("printed_edition_locator")
            or not p.get("lexical_sense_source_status")
            or not p.get("context_role")
            or not p.get("note")
            or len(p["exact_short_nahuatl"].split()) > 6):
            raise ValueError("Context lacks source locator or claims unearned review")
        if p["work_id"] not in ids:
            raise ValueError("Unknown historical work in context")
    saf = obj.get("safeguards", {})
    for key, value in {
        "exact_quote_only": True,
        "unreviewed_editorial_interpretations_not_gold": True,
        "promote_to_dictionary": False,
        "promote_to_silver": False,
        "training_eligible": False,
        "whole_work_reserved_from_gold": False,
        "source_documents_exposed_for_research": True,
    }.items():
        if saf.get(key) is not value:
            raise ValueError("Tampered source evidence provenance, approval or Gold policy")
    return obj


def original_language_section(text: str, work_id: str) -> str:
    """Require the actual Nahuatl transcription region, not English translation or
    editor's introduction, to match. Avoid overclaiming word matches from prose.
    """
    if work_id == "enl-bc16-1573":
        marker, end = "Transcriptions and Translations", "[Transcription by James Lockhart]"
        start = text.find(marker)
        finish = text.find(end, start + len(marker))
    elif work_id == "enl-bc26-early16":
        marker, end = "Analytic Transcription", "[Transcription by James Lockhart"
        start = text.rfind(marker)
        finish = text.find(end, start + len(marker))
    else:
        raise ValueError("No approved original-language section parser for this work")
    if start < 0 or finish < start:
        raise ValueError("Historical web edition missing an inspectable Nahuatl transcription section")
    return text[start + len(marker):finish]


def inspect_documents(*, live: bool = False, fetcher=fetch_page,
                      path: Path = CATALOG) -> dict:
    doc = load_catalog(path)
    work_by_id = {w["id"]: w for w in doc["works"]}
    pages: dict[str, str] = {}
    records = []
    for probe in doc["probes"]:
        work = work_by_id[probe["work_id"]]
        row = {
            "probe_id": probe["id"], "form": probe["form"],
            "work_id": work["work_id"], "source_collection_id": work["collection_id"],
            "date": work["date"], "date_precision": work["date_precision"],
            "variety": work["variety"], "source_url": work["source_url"],
            "short_original_edition_phrase": probe["exact_short_nahuatl"],
            "contextual_role_lead": probe["context_role"],
            "original_transcription_live_verified": None,
            "independent_manuscript_collation": False,
            "semantic_english_alignment_verified": False,
            "silver_approved": False, "gold_approved": False,
            "training_eligible": False,
        }
        if live:
            url = work["source_url"]
            if url not in pages:
                pages[url] = original_language_section(fetcher(url), probe["work_id"])
            if not match_located_excerpt(pages[url], probe["exact_short_nahuatl"]):
                raise ValueError("Historical edited source excerpt mismatch: " + probe["id"])
            row["original_transcription_live_verified"] = True
        records.append(row)
    return {
        "format": "tentli-multi-document-source-collation-result-v1",
        "source_catalog_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "historical_works_consulted": len(doc["works"]),
        "contextual_form_probes": len(records),
        "live_original_edition_passages_checked": sum(r["original_transcription_live_verified"] is True for r in records),
        "distinct_source_pages_fetched": len(pages),
        "early_colonial_nahuatl_works": len(doc["works"]),
        "independent_human_reviewed_translation_pairs": 0,
        "manuscript_images_collated": 0,
        "gold_created": 0,
        "automatic_training_examples": 0,
        "training_or_dictionary_modified": False,
        "contexts": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live-check", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = inspect_documents(live=args.live_check)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k != "contexts"}, indent=2))


if __name__ == "__main__":
    main()

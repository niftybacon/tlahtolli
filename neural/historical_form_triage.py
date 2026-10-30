"""Source-grade Brinton song vocables and particles for human investigation.

This is a proposal-only literary/contextual audit, never a lexical importer.
It uses EXACT tokens from already licensed training stanzas and only the
source-linked catalog. Development poems and Gold translation works cannot
be turned into research leads. Even cataloged particles receive no invariant
English training label.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

from .canonical_lexical_coverage import MANIFEST, inspect, tokens
from .corpus import load_corpus

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "research/translation_corpus/brinton_contextual_form_leads_2026_10_30.json"
EXPECTED = {"ohuaya", "zan", "ye", "ya", "aya", "y", "a", "o", "ohuaye", "huia"}
DOCUMENTED = {
    "documented_song_vocable",
    "documented_contextual_particle",
    "documented_historical_variant_with_context_risk",
}
UNCERTAIN = {
    "unresolved_poetic_or_grammatical_surface",
    "unresolved_poetic_or_orthographic_surface",
}


def read_catalog(path: Path = CATALOG) -> dict[str, dict]:
    obj = json.loads(path.read_text(encoding="utf-8"))
    if (obj.get("format") != "tentli-brinton-contextual-form-leads-v1" or
            obj.get("independent_human_review_count") != 0 or
            obj.get("approved_training_examples_added") != 0):
        raise ValueError("Form catalog cannot claim human review or approved training")
    forms = obj.get("forms")
    if not isinstance(forms, list) or len(forms) != len(EXPECTED):
        raise ValueError("Unexpected scope of curated Brinton source leads")
    found = {}
    for row in forms:
        surface = row.get("surface")
        if not isinstance(surface, str) or surface.lower() != surface or surface not in EXPECTED:
            raise ValueError("Unreviewed form or unsafe spelling normalization")
        if surface in found:
            raise ValueError("Duplicate historical form lead")
        cls = row.get("class")
        evidence = row.get("evidence")
        if cls not in DOCUMENTED | UNCERTAIN:
            raise ValueError("Unknown editorial evidence class")
        if (row.get("lexicon_promotion") is not False or
            row.get("training_eligible") is not False or
            row.get("independent_manuscript_review") is not False or
            row.get("contextual_translation_verified") is not False or
            row.get("fixed_english_target") is not None):
            raise ValueError("Cataloged source form is NOT automatically reviewed bilingual supervision")
        sources = row.get("sources")
        if not isinstance(sources, list) or not sources:
            raise ValueError("Catalog source pointers required")
        for ref in sources:
            url, loc = ref.get("url"), ref.get("locator")
            if (not isinstance(url, str) or not url.startswith("https://") or
                    not isinstance(loc, str) or len(loc.strip()) < 15):
                raise ValueError("Invalid historical dictionary or source-locator citation")
            if cls in DOCUMENTED and "nahuatl.wired-humanities.org/" not in url:
                raise ValueError("Documented lexical status requires located historical dictionary source")
        if cls in UNCERTAIN and not evidence.startswith("printed_source_only"):
            raise ValueError("Undetermined sung syllables cannot acquire dictionary evidence")
        if cls == "documented_song_vocable" and surface != "ohuaya":
            raise ValueError("New song-vocable finding requires independent source investigation")
        found[surface] = row
    if set(found) != EXPECTED:
        raise ValueError("Missing pinned historical word-form leads")
    return found


def contextual_audit(manifest: Path = MANIFEST, *, catalog_path: Path = CATALOG,
                     limit: int = 40, max_per_work: int = 4) -> dict:
    if not 1 <= limit <= 200 or not 1 <= max_per_work <= 20:
        raise ValueError("Contextual review must be bounded")
    catalog = read_catalog(catalog_path)
    baseline = inspect(manifest, limit=limit, per_work=max_per_work)
    rows = load_corpus(manifest)
    if any(r.split == "test" for r in rows):
        raise ValueError("Unreviewed poetic-form triage cannot inspect test/Gold source")
    counted = Counter()
    work_ids = defaultdict(set)
    examples = defaultdict(list)
    priorities = []
    for record in rows:
        if record.split != "train":
            continue
        if record.translation_language != "en" or record.alignment != "candidate":
            raise ValueError("Only traceable weak historical English data can be triaged")
        spelled = tokens(record.original)
        matches = Counter(t for t in spelled if t in catalog)
        if not matches:
            continue
        for form, n in matches.items():
            counted[form] += n
            work_ids[form].add(record.work_id)
            if len(examples[form]) < 4:
                examples[form].append({
                    "record_id": record.record_id,
                    "work_id": record.work_id,
                    "printed_source_url": record.source_url,
                })
        # Purpose: direct the next human context review to different
        # potentially confusing evidence types, not manufacture labels.
        form_kinds = {catalog[k]["class"] for k in matches}
        score = len(matches) * 3 + len(form_kinds) * 2 + min(3, matches["ohuaya"])
        priorities.append({
            "record_id": record.record_id,
            "work_id": record.work_id,
            "printed_source_url": record.source_url,
            "form_leads": dict(sorted(matches.items())),
            "editorial_priority_not_accuracy": score,
            "translation_alignment": "published_editorial_candidate_only",
            "contextual_review": "pending_human_source_review",
            "eligible_for_training_or_gold": False,
        })
    priorities.sort(key=lambda r: (-r["editorial_priority_not_accuracy"], r["record_id"]))
    group_counter = Counter()
    bounded = []
    for item in priorities:
        if group_counter[item["work_id"]] >= max_per_work:
            continue
        group_counter[item["work_id"]] += 1
        bounded.append(item)
        if len(bounded) >= limit:
            break
    if len(bounded) != limit:
        raise ValueError("Not enough source-disjoint review contexts for requested limit")
    # Ohuaya has an explicit historical-song vocable finding (ODN/Bierhorst)
    # yet this does NOT establish semantic alignments in each Brinton stanza.
    vocables = counted["ohuaya"]
    raw_unmatched = (baseline["train_token_occurrences"] -
                     baseline["matched_exact_or_cited_witness_token_occurrences"])
    if vocables > raw_unmatched:
        raise ValueError("Cannot remove a documented vocable from a lexicon-gap workload if it is already analyzed")
    report = {
        "format": "tentli-contextual-historical-form-audit-v1",
        "manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "catalog_sha256": hashlib.sha256(catalog_path.read_bytes()).hexdigest(),
        "train_stanzas_only": baseline["train_stanzas_examined"],
        "untouched_development_stanzas": baseline["dev_stanzas_reserved"],
        "lexical_training_token_occurrences": baseline["train_token_occurrences"],
        "baseline_unmatched_surface_occurrences": raw_unmatched,
        "documented_song_vocable_occurrences_flagged_not_deleted": vocables,
        "unmatched_occurrences_excluding_flagged_vocable_as_workload_estimate":
            raw_unmatched - vocables,
        "proposed_human_context_reviews": len(bounded),
        "context_review_historical_works": len(group_counter),
        "source_cited_forms": sum(row["class"] in DOCUMENTED for row in catalog.values()),
        "unresolved_editorial_forms": sum(row["class"] in UNCERTAIN for row in catalog.values()),
        "human_approved_bilingual_examples_created": 0,
        "independent_gold_accuracy": None,
        "train_weights_changed": False,
        "live_translator_changed": False,
        "no_global_spelling_rewrites": True,
        "no_fixed_english_target": True,
        "forms": [
            {
                "surface": name,
                "evidence_class": row["class"],
                "evidence_grade": row["evidence"],
                "citation_links": row["sources"],
                "interpretation_caveat": row["comment"],
                "training_token_occurrences": counted[name],
                "training_historical_work_count": len(work_ids[name]),
                "example_pointers": examples[name],
                "verified_english_translation": None,
                "independent_human_reviewed": False,
                "approve_lexicon_or_train": False,
            } for name, row in sorted(catalog.items())
        ],
        "review_queue": bounded,
        "notice": "Only source-cited research leads: no independent literal translations, Gold, or reviewed training labels."
    }
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=MANIFEST)
    parser.add_argument("--catalog", type=Path, default=CATALOG)
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument("--max-per-work", type=int, default=4)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = contextual_audit(args.manifest, catalog_path=args.catalog,
                              limit=args.limit, max_per_work=args.max_per_work)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in {"forms", "review_queue"}},
                     indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

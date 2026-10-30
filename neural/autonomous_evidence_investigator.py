"""Bounded, autonomous *research* on 40 Classical Nahuatl written forms.

Uses 36,543 already archived, source-attributed dictionary records, canonical
source claims, historical poem occurrences and human feedback. The investigator
does real exact-headword cross-indexing and flags likely disagreement, but does
NOT certify meanings, infer inflection, conflate historical eras, auto-publish
translations, or evaluate its own Gold. All evidence sources are cited.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import unicodedata

from .canonical_lexical_coverage import MANIFEST, EVIDENCE, LEXICON, WITNESSES, source_claims
from .canonical_lexical_coverage import inspect, tokens, witness_forms, clean

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "research/amoxcalli_archive"
MANIFEST_FILE = ARCHIVE / "manifest.json"
FEEDBACK = ROOT / "research/translation_corpus/project_director_provisional_feedback.json"
BRINTON = "brinton-1890-poetry-v-01"
HISTORIC_ODN = "https://nahuatl.wired-humanities.org/node/172083"
FORMAT = "tentli-autonomous-lexical-evidence-investigation-v1"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _short(value: object, n: int = 105) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.split())[:n]


def _index_file(file: Path, family: str, result: dict, stats: Counter) -> None:
    doc = json.loads(file.read_text(encoding="utf-8"))
    expected = ("tlahtolli-amoxcalli-simeon-v1" if family == "simeon"
                else "tlahtolli-amoxcalli-kaikki-v1")
    if doc.get("format") != expected or not isinstance(doc.get("rows"), list):
        raise ValueError("Unrecognized archive format or untraceable lexical family")
    if family == "simeon" and doc.get("review") != "ocr-unverified":
        raise ValueError("Do not upgrade OCR archival records silently")
    if family == "kaikki" and doc.get("review") != "source-derived-not-expert-reviewed":
        raise ValueError("Do not upgrade community lexical records silently")
    for i, row in enumerate(doc["rows"]):
        stats[family + "_total"] += 1
        if not isinstance(row, list) or len(row) < (3 if family == "simeon" else 4):
            raise ValueError("Unexpected source archive record layout")
        head = row[0]
        if not isinstance(head, str) or not head.strip():
            continue
        if family == "kaikki" and row[2] != "nci":
            stats["nonclassical_community_excluded"] += 1
            continue
        if family == "kaikki":
            # Kaikki tuples: [headword, POS, ISO-code, [[glosses, raw_glosses, tags],...],...].
            # Never convert their community gloss into historical attestation.
            senses = row[3]
            if not isinstance(senses, list):
                raise ValueError("Kaikki senses are not a list")
            glosses = []
            for s in senses[:2]:
                if isinstance(s, list) and s and isinstance(s[0], list):
                    glosses.extend(_short(v) for v in s[0][:2] if isinstance(v, str))
            pos = _short(row[1], 35)
            grade = "community_classical_variety_not_independent_primary_source"
            preview = glosses[:2]
        else:
            pos = _short(row[2], 35)
            grade = "1885_historical_dictionary_2026_unreviewed_OCR_French"
            preview = [_short(row[1])] if isinstance(row[1], str) else []
        entry = {
            "form": head,
            "dictionary_family": family,
            "source_record_id": f"{file.name}:{doc['start']+i}",
            "archive_path": "research/amoxcalli_archive/" + file.name,
            "citation_url": result["_manifest"][family]["source_url"],
            "license": result["_manifest"][family]["license"],
            "source_grade": grade,
            "pos_as_recorded": pos,
            "short_gloss_leads_not_reviewed": preview,
            "historical_semantics_verified": False,
        }
        result[family][clean(head)].append(entry)
        stats[family + "_indexable"] += 1


def build_indexes(archive: Path = ARCHIVE) -> tuple[dict, Counter]:
    meta = json.loads((archive / "manifest.json").read_text(encoding="utf-8"))
    if meta.get("format") != "tlahtolli-amoxcalli-archive-manifest-v1":
        raise ValueError("Unknown source archive manifest")
    indexes = {"simeon": defaultdict(list), "kaikki": defaultdict(list),
               "_manifest": meta}
    stats: Counter = Counter()
    for fam in ("simeon", "kaikki"):
        files = meta.get(fam, {}).get("files")
        if not isinstance(files, list) or not files or len(set(files)) != len(files):
            raise ValueError("Missing or duplicate source-family archive files")
        for name in files:
            if "/" in name or "\\" in name or not name.endswith(".json") or not name.startswith(fam + "_"):
                raise ValueError("Unsafe lexical archive file reference")
            _index_file(archive / name, fam, indexes, stats)
        if stats[fam + "_total"] != meta["source_rows"][fam]:
            raise ValueError(f"Archive {fam} count differs from published provenance manifest")
    if stats["simeon_total"] + stats["kaikki_total"] != meta["source_rows"]["total"]:
        raise ValueError("Two source archive families do not match the provenance total")
    return indexes, stats


def load_feedback(path: Path = FEEDBACK, *, candidates: list[dict]) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("format") != "tentli-human-feedback-provisional-v1":
        raise ValueError("No recognized project-director observation schema")
    by_id = {x["record_id"]: x for x in candidates}
    if len(by_id) != len(candidates):
        raise ValueError("Candidate corpus contains duplicate record IDs")
    out = {}
    for row in data.get("entries", []):
        if not isinstance(row, dict):
            raise ValueError("Invalid user-observation entry")
        ref = by_id.get(row.get("record_id"))
        word = row.get("exact_written_form")
        # This particular human note was about *zanio*, not arbitrary
        # words elsewhere in the same stanza (e.g. xochitl).
        if row.get("record_id") != BRINTON or word != "zanio":
            raise ValueError("Provisional feedback's exact lexeme and stanza scope changed")
        if (ref is None or ref.get("split") != "train" or
                not isinstance(word, str) or word != clean(word) or
                word not in tokens(ref["original"]) or
                row.get("original_url") != ref["source_url"] or
                row.get("published_translation_url") != ref["translation"]["source_url"]):
            raise ValueError("Provisional user note is not bound to the printed training passage")
        if (row.get("second_human_review") is not False or
                row.get("grammatical_sentence_analysis_complete") is not False or
                row.get("historical_alignment_approved") is not False or
                row.get("gold") is not False or row.get("training_eligible") is not False):
            raise ValueError("Project-director observation is NOT independent approved Silver or Gold")
        source = row.get("independent_lexicographic_reference")
        if not isinstance(source, dict) or not str(source.get("url", "")).startswith("https://nahuatl.wired-humanities.org/"):
            raise ValueError("Historical dictionary citation is not linked")
        if word in out:
            raise ValueError("Duplicate editorial judgment on the same surface")
        out[word] = row
    return out


def investigate(*, max_cases: int = 40, archive: Path = ARCHIVE,
                feedback_path: Path = FEEDBACK,
                manifest: Path = MANIFEST) -> dict:
    if not 1 <= max_cases <= 200:
        raise ValueError("The investigator requires a bounded review batch")
    baseline = inspect(manifest, limit=40, per_work=4)
    lex = json.loads(LEXICON.read_text(encoding="utf-8"))
    evid = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    refs = json.loads(WITNESSES.read_text(encoding="utf-8"))
    canonical = source_claims(lex, evid)
    witnessed = witness_forms(refs, canonical)
    rows = [json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines()
            if line.strip()]
    feedback = load_feedback(feedback_path, candidates=rows)
    indexes, archive_stats = build_indexes(archive)
    preferred = list(baseline["proposed_unmatched_surface_review"])
    selected = preferred[:max_cases]
    # Explicit feedback must be investigated, not silently lost because it
    # did not reach a frequency-only cut-off.
    for form in sorted(feedback):
        if not any(x["written_surface"] == form for x in selected):
            same = next((x for x in preferred if x["written_surface"] == form), None)
            if same is None:
                occurrences = [
                    {"record_id": r["record_id"], "work_id": r["work_id"],
                     "printed_source_url": r["source_url"]}
                    for r in rows if r["split"] == "train" and form in tokens(r["original"])
                ]
                if not occurrences:
                    raise ValueError("Human feedback not attested in research train")
                same = {
                    "written_surface": form,
                    "token_occurrences_in_training_poems": sum(
                        tokens(r["original"]).count(form) for r in rows if r["split"] == "train"),
                    "distinct_training_work_count": len({r["work_id"] for r in rows
                                                        if r["split"] == "train" and form in tokens(r["original"])}),
                    "training_source_examples": occurrences[:4]
                }
            selected = selected[:max_cases-1] + [same]
    if len(selected) != max_cases or len({x["written_surface"] for x in selected}) != len(selected):
        raise ValueError("Could not construct exactly the bounded unique investigation set")
    records = []
    family_hits = Counter()
    for target in selected:
        form = target["written_surface"]
        sym = clean(form)
        sim = indexes["simeon"].get(sym, [])[:2]
        wik = indexes["kaikki"].get(sym, [])[:2]
        family_hits["both" if sim and wik else
                    "simeon_only" if sim else "kaikki_only" if wik else "neither"] += 1
        can = canonical.get(sym)
        source_witnesses = witnessed.get(sym, [])
        user = feedback.get(sym)
        evidence = {
            "canonical_checked_lemma": ({
                "headword": can["lemma"],
                "part_of_speech": can["pos"],
                "headword_claims": can["headword_claims"][:2],
                "pos_claims": can["pos_claims"][:2],
                "contextual_sense_verified_here": False,
            } if can else None),
            "documented_early_witness_forms": source_witnesses[:2],
            "simeon_1885_french_ocr": sim,
            "kaikki_community_classical_only": wik,
            "project_director_single_review": ({
                "passage": user["record_id"],
                "claimed_sense": user["word_assessment"],
                "original_url": user["original_url"],
                "historical_dictionary_url": user["independent_lexicographic_reference"]["url"],
                "historical_source_locator": user["independent_lexicographic_reference"]["historical_underlying_source"],
                "reviewer_independence": "not_verified",
                "second_human_review": False,
                "whole_stanza_silver_approved": False,
            } if user else None),
        }
        pos = {e["pos_as_recorded"].casefold() for e in sim + wik
               if e["pos_as_recorded"] and e["pos_as_recorded"].casefold() not in {"other", "unknown"}}
        if can and isinstance(can["pos"], str):
            pos.add(can["pos"].casefold())
        pos_divergence = len(pos) > 1
        provenance = len({e["dictionary_family"] for e in sim + wik})
        if user:
            band = "historical_dictionary_locator_plus_single_project_feedback_not_independently_adjudicated"
        elif can:
            band = "canonical_headword_and_pos_claims_source_checked_context_unverified"
        elif sim and wik:
            band = "two_secondary_lexical_indexes_one_unreviewed_OCR_not_two_historical_attestations"
        elif sim:
            band = "one_unreviewed_1885_historical_dictionary_OCR"
        elif wik:
            band = "one_community_classical_index_only"
        else:
            band = "no_exact_dictionary_headword_match"
        if user or pos_divergence:
            next_action = "verify_conflicting_or_contextual_senses_against_original_source"
        elif can or sim:
            next_action = "check_original_historical_source_and_context_before_any_promotion"
        elif wik:
            next_action = "find_independent_primary_historical_witness"
        else:
            next_action = "investigate_segmentation_inflection_vocable_and_spelling_with_primary_source"
        records.append({
            "form": form,
            "training_work_count": target["distinct_training_work_count"],
            "training_token_count": target["token_occurrences_in_training_poems"],
            "sampled_source_locations": target["training_source_examples"][:4],
            "candidate_category": band,
            "source_families_exact_headword_matched": provenance,
            "source_family_pos_variation_flag_for_review": pos_divergence,
            "cross_language_semantic_equivalence_auto_verified": False,
            "global_spelling_normalization_performed": False,
            "needs_contextual_human_scholarship": bool(user or pos_divergence),
            "next_research_action": next_action,
            "evidence": evidence,
            "candidate_translation": None,
            "lexicon_entry_approved": False,
            "silver_approved": False,
            "gold": False,
            "training_eligible": False,
        })
    escalations = [r["form"] for r in records if r["needs_contextual_human_scholarship"]]
    hashes = {
        "brinton_manifest": sha256(manifest),
        "canonical_lexicon": sha256(LEXICON),
        "canonical_claims": sha256(EVIDENCE),
        "historical_witnesses": sha256(WITNESSES),
        "archived_source_manifest": sha256(archive / "manifest.json"),
        "human_feedback": sha256(feedback_path),
    }
    return {
        "format": FORMAT,
        "scope": "public_domain_Brinton_train_only_exact_surface_evidence",
        "provenance_sha256": hashes,
        "investigation_count": len(records),
        "historical_development_stanzas_excluded": baseline["dev_stanzas_reserved"],
        "historical_training_stanzas": baseline["train_stanzas_examined"],
        "archive_record_counts": dict(archive_stats),
        "source_family_hit_summary": dict(family_hits),
        "high_priority_manual_context_escalations": escalations[:12],
        "escalation_count": len(escalations),
        "independent_primary_source_checks_completed": 0,
        "machine_verified_meanings": 0,
        "human_reviewed_silver_added": 0,
        "gold_added": 0,
        "canonical_source_changes": 0,
        "training_weights_updated": False,
        "limitations": (
            "Siméon 1885 OCR and Kaikki/Wiktionary 2026 are different evidence "
            "families, not two independent sixteenth-century manuscripts; "
            "exact written-form match is NOT resolved morphology or semantic agreement."),
        "investigations": records,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--limit", type=int, default=40)
    p.add_argument("--output", type=Path)
    args = p.parse_args()
    report = investigate(max_cases=args.limit)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "investigations"},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

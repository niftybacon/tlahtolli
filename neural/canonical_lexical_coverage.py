"""Audit *existing* Classical lexeme claims against historical candidate tokens.

No invented translations, fuzzy spellings, dictionary writes, or gold labels.
Canonical headwords require independently source-graded headword/POS claims.
Unaccented/variant spellings are recognized ONLY by individually source-located
sixteenth-century witnesses already in references.json, not global macron removal.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import unicodedata

from .corpus import load_corpus

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / "data/lexicon.json"
EVIDENCE = ROOT / "data/evidence.json"
WITNESSES = ROOT / "references.json"
MANIFEST = ROOT / "research/neural_training/brinton_1890_poetry_weak_en.jsonl"
TOKEN = re.compile(r"[^\W\d_]+", re.UNICODE)
CHECKED = {"dictionary", "grammar", "text"}
EARLY_WITNESSES = {"dfc", "enl"}
EXCLUDED_WITNESSES = {"lucas1833"}  # later Puebla-area material, not early Classical


def clean(word: str) -> str:
    return unicodedata.normalize("NFC", word).casefold().strip()


def tokens(text: str) -> list[str]:
    return [clean(w) for w in TOKEN.findall(text)]


def source_claims(lexicon: dict, evidence: dict) -> dict[str, dict]:
    if lexicon.get("format") != "tlahtolli-lexicon-source" or evidence.get("format") != "tlahtolli-evidence-source":
        raise ValueError("Unexpected canonical separated evidence schemas")
    if lexicon.get("version") != evidence.get("version"):
        raise ValueError("Source/evidence versions differ")
    left, right = lexicon.get("words"), evidence.get("entries")
    if not isinstance(left, list) or not isinstance(right, list) or len(left) != len(right):
        raise ValueError("Source/evidence rows are not aligned")
    found = {}
    for source, proof in zip(left, right):
        if (source.get("word"), source.get("variety")) != (proof.get("word"), proof.get("variety")):
            raise ValueError("Source/evidence keys do not align")
        if source.get("status") != "Checked against source":
            continue
        if source.get("variety") != "Classical Nahuatl":
            continue
        lemma = source.get("word")
        if not isinstance(lemma, str) or not lemma or not TOKEN.fullmatch(lemma):
            continue
        original_url = source.get("source", "")
        claims = proof.get("claims", [])
        if not isinstance(claims, list) or not isinstance(original_url, str) or not original_url.startswith("https://"):
            continue
        verified = {}
        for field in ("headword", "pos"):
            records = [claim for claim in claims if claim.get("field") == field
                       and claim.get("assessment") in CHECKED
                       and isinstance(claim.get("source"), str)
                       and claim["source"].startswith("https://")
                       and isinstance(claim.get("locator"), str) and claim["locator"].strip()]
            if not records:
                break
            verified[field] = [{"source_url": c["source"], "locator": c["locator"],
                                "grade": c["assessment"]} for c in records]
        if len(verified) != 2:
            continue
        key = clean(lemma)
        if key in found:
            # This report must not silently collapse homonymous reviewed entries.
            raise ValueError("Duplicate Classical checked lemma: " + key)
        found[key] = {
            "lemma": lemma,
            "pos": source.get("pos"),
            "source_url": original_url,
            "headword_claims": verified["headword"],
            "pos_claims": verified["pos"],
            "meaning_read_from_canonical_entry_not_verified_translation": source.get("meaning"),
            "independent_english_gloss_review": False,
            "historical_sentence_translation": False,
        }
    if len(found) < 100:
        raise ValueError("Unexpectedly few canonical source-checked Classical lexemes")
    return found


def witness_forms(refs: dict, lexemes: dict[str, dict]) -> dict[str, list[dict]]:
    if refs.get("format") != "tlahtolli-source-atlas":
        raise ValueError("Missing historical witness atlas")
    result = defaultdict(list)
    for witness in refs.get("witnesses", []):
        sid = witness.get("sourceId")
        if sid in EXCLUDED_WITNESSES or sid not in EARLY_WITNESSES:
            continue
        if witness.get("evidence") != "transcription-occurrence":
            continue
        lemma, form = witness.get("lemma"), witness.get("form")
        source_url, locator = witness.get("url"), witness.get("locator")
        if not isinstance(lemma, str) or not isinstance(form, str) or not TOKEN.fullmatch(form):
            continue
        if not isinstance(source_url, str) or not source_url.startswith("https://"):
            continue
        if not isinstance(locator, str) or not locator:
            continue
        key = clean(lemma)
        if key not in lexemes:
            # A witness occurrence does not automatically upgrade an
            # index-only headword to a source-checked dictionary entry.
            continue
        occurrence = {
            "lemma": lexemes[key]["lemma"], "historical_form": form,
            "witness_url": source_url, "locator": locator, "source_id": sid,
            "grade": "transcription_occurrence_only_no_contextual_sense_or_morphology",
            "human_sentence_translation_reviewed": False,
        }
        result[clean(form)].append(occurrence)
    return dict(result)


def build_lookup(lexemes: dict, witnesses: dict) -> dict[str, list[dict]]:
    lookup = defaultdict(list)
    for normalized, entry in lexemes.items():
        lookup[normalized].append({
            "lemma": entry["lemma"], "match": "exact_source_checked_citation_headword",
            "source_url": entry["headword_claims"][0]["source_url"],
            "locator": entry["headword_claims"][0]["locator"],
            "historical_witness": False,
        })
    for written, records in witnesses.items():
        for row in records:
            lookup[written].append({
                "lemma": row["lemma"], "match": "individually_cited_early_historical_form",
                "source_url": row["witness_url"], "locator": row["locator"],
                "historical_witness": True, "source_id": row["source_id"],
            })
    return dict(lookup)


def inspect(manifest: Path = MANIFEST, *, limit: int = 40, per_work: int = 4,
            lexicon_path: Path = LEXICON, evidence_path: Path = EVIDENCE,
            witnesses_path: Path = WITNESSES) -> dict:
    if not 1 <= limit <= 200 or not 1 <= per_work <= 20:
        raise ValueError("Bounded review must have 1..200 items and 1..20 per work")
    lexicon = json.loads(lexicon_path.read_text(encoding="utf-8"))
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    refs = json.loads(witnesses_path.read_text(encoding="utf-8"))
    lexemes = source_claims(lexicon, evidence)
    witnessed = witness_forms(refs, lexemes)
    lookup = build_lookup(lexemes, witnessed)
    rows = load_corpus(manifest)
    if any(row.split == "test" for row in rows):
        raise ValueError("Candidate corpus may not contain Gold/test examples")
    raw = {row["record_id"]: row for row in
           (json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip())}
    by_work = defaultdict(list)
    total_tokens = 0
    matched_tokens = 0
    unique_recognized = set()
    unknown_counts = Counter()
    ambiguous_count = 0
    witness_only = 0
    for item in rows:
        if item.split != "train":
            continue
        if item.alignment != "candidate" or item.translation_language != "en":
            raise ValueError("Only historically sourced, unreviewed English training candidates are admissible")
        written_tokens = tokens(item.original)
        unknown = Counter()
        matched = []
        ambiguity = []
        for word in written_tokens:
            total_tokens += 1
            options = lookup.get(word, ())
            if not options:
                unknown[word] += 1
                unknown_counts[word] += 1
                continue
            matched_tokens += 1
            unique_recognized.add(word)
            distinct = {x["lemma"] for x in options}
            if len(distinct) > 1:
                ambiguous_count += 1
                ambiguity.append(word)
            if all(x["match"] == "individually_cited_early_historical_form" for x in options):
                witness_only += 1
            if word != "in":
                matched.append(word)
        score = min(18, sum(unknown.values())) + 2 * len(set(ambiguity))
        if 5 <= len(written_tokens) <= 25:
            score += 3
        # This is REVIEW effort/priority, not confidence or semantic accuracy.
        if "in" in written_tokens:
            score += 1  # frequent polyfunctional particle needs context
        src = raw[item.record_id]
        by_work[item.work_id].append({
            "record_id": item.record_id, "work_id": item.work_id,
            "printed_source_url": item.source_url,
            "printed_english_url": src["translation"]["source_url"],
            "review_priority_not_accuracy": score,
            "tokens_total": len(written_tokens),
            "exact_supported_token_occurrences": len(written_tokens) - sum(unknown.values()),
            "unmatched_headword_surface_candidates": sorted(unknown),
            "candidate_ambiguous_forms": sorted(set(ambiguity)),
            "lexical_surface_examples_only": sorted(set(matched))[:12],
            "verification_required": [
                "inspect_historical_spelling_and_word_boundary",
                "review_clause_roles_and_context",
                "independently_check_published_english_interpretation",
            ],
            "review_status": "pending_not_approved",
            "model_gold_or_train_promotion": False,
        })
    ordered = sorted((x for group in by_work.values() for x in group),
                     key=lambda x: (-x["review_priority_not_accuracy"], x["record_id"]))
    chosen, grouped = [], Counter()
    for item in ordered:
        if grouped[item["work_id"]] >= per_work:
            continue
        grouped[item["work_id"]] += 1
        chosen.append(item)
        if len(chosen) >= limit:
            break
    return {
        "format": "tentli-canonical-source-checked-lexical-coverage-v1",
        "canonical_release": lexicon["version"],
        "evidence_sha256": {name: hashlib.sha256(p.read_bytes()).hexdigest()
                            for name, p in (("lexicon", lexicon_path), ("claims", evidence_path),
                                             ("historical_witnesses", witnesses_path), ("bilingual_manifest", manifest))},
        "source_checked_classical_lemmas": len(lexemes),
        "early_cited_witness_form_spellings": len(witnessed),
        "later_variety_sources_excluded": sorted(EXCLUDED_WITNESSES),
        "train_stanzas_examined": sum(r.split == "train" for r in rows),
        "dev_stanzas_reserved": sum(r.split == "dev" for r in rows),
        "train_token_occurrences": total_tokens,
        "matched_exact_or_cited_witness_token_occurrences": matched_tokens,
        "witness_form_only_token_occurrences": witness_only,
        "ambiguous_surface_token_occurrences": ambiguous_count,
        "unique_recognized_surfaces": len(unique_recognized),
        "common_unmatched_surfaces": unknown_counts.most_common(30),
        "review_queue_size": len(chosen),
        "review_work_groups": len(grouped),
        "approved_historical_translation_pairs_added": 0,
        "independent_gold_accuracy": None,
        "neural_weights_updated": False,
        "notice": ("Exact citation-form and individually linked historical witness coverage only; "
                   "does not resolve morphology, contextual sense, or Nahuatl-English alignment"),
        "review_queue": chosen,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, default=MANIFEST)
    p.add_argument("--limit", type=int, default=40)
    p.add_argument("--per-work", type=int, default=4)
    p.add_argument("--output", type=Path)
    a = p.parse_args()
    report = inspect(a.manifest, limit=a.limit, per_work=a.per_work)
    if a.output:
        a.output.parent.mkdir(parents=True, exist_ok=True)
        a.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: val for key, val in report.items() if key != "review_queue"},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

"""Controlled, source-located primary *edition* contexts, not auto-certified Gold.

Finds narrowly permitted Nahuatl expressions in original-source edited
transcription pages. Never infers suffix meanings from arbitrary substrings,
generalizes orthographic spellings, or mirrors modern copyrighted editions.
Real image/facsimile checking and translations still require independent work.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from .canonical_lexical_coverage import ROOT, clean, tokens

CATALOG = ROOT / "research/translation_corpus/primary_context_findings_2026_10_30.json"
SCHEMA = "tentli-controlled-primary-context-evidence-v1"
EXPECTED = {
    "enl-bc19-numbered-can": ("can", "yniquexcan", "numbered_locative_suffix",
                               "enl-bc19-coyoacan-1621"),
    "enl-bc19-ayac": ("ayac", "ayac", "negative_indefinite_pronoun",
                      "enl-bc19-coyoacan-1621"),
    "dfc-book10-cujcatl": ("cuicatl", "cujcatl", "noun_song_or_singing",
                           "florentine-codex"),
}
PERMITTED_DOMAINS = {"enl.wired-humanities.org", "florentinecodex.getty.edu"}
GRAMMAR_ROLES = {
    "can-interrogative": ("can", "independent_interrogative_or_locative"),
    "can-optative": ("-cān", "plural_optative_verb_suffix"),
    "can-abundance": ("-yocan", "abundant_locative_derivation"),
    "ayac-alternate": ("ayac", "documented_historical_spelling_variant"),
    "cuicatl-derivation": ("cuīcatl", "noun_related_to_verb_cuīca"),
}


class VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.chunks: list[str] = []

    # Keep inline <span>/<b> boundaries *within words*; a digital edition
    # can use an individual tag for each syllable. Insert word boundaries
    # only for actual block-like text separators, not for all HTML tags.
    BLOCKS = {"p", "div", "br", "li", "td", "tr", "table", "h1", "h2",
              "h3", "h4", "h5", "h6", "section", "article", "blockquote"}

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip += 1
        if tag in self.BLOCKS and not self.skip:
            self.chunks.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.BLOCKS and not self.skip:
            self.chunks.append(" ")
        if tag in {"script", "style", "noscript", "svg"} and self.skip:
            self.skip -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.chunks.append(data)


def norm(s: str) -> str:
    return " ".join(s.casefold().split())


def _url_ok(url: object, *, source_only: bool = False) -> bool:
    if not isinstance(url, str):
        return False
    p = urlparse(url)
    return (p.scheme == "https" and bool(p.hostname) and
            not p.username and not p.password and
            (not source_only or p.hostname in PERMITTED_DOMAINS))


def read_catalog(path: Path = CATALOG) -> dict:
    doc = json.loads(path.read_text(encoding="utf-8"))
    if doc.get("format") != SCHEMA:
        raise ValueError("Unrecognized controlled historical edition schema")
    collection = doc.get("source_collections")
    rows = doc.get("contexts")
    grams = doc.get("grammar_claims")
    if not isinstance(collection, list) or len(collection) != 2 or not isinstance(rows, list) or len(rows) != 3:
        raise ValueError("Exactly two source collections and three anchored edition examples required")
    by_coll = {s["id"]: s for s in collection}
    if len(by_coll) != 2 or set(by_coll) != {"enl-bc19-coyoacan-1621", "florentine-codex"}:
        raise ValueError("Unexpected work/collection provenance")
    for key, meta in by_coll.items():
        if (not _url_ok(meta.get("source_url"), source_only=True)
            or meta.get("manuscript_image_collated") is not False
            or meta.get("training_allowed") is not False
            or meta.get("gold_holdout_eligible") is not False
            or not meta.get("work_id") or not meta.get("date")
            or not meta.get("variety") or not meta.get("transcription_editor")):
            raise ValueError("Historical date, work and editorial/rights provenance required")
    if not isinstance(grams, list) or len(grams) != 5:
        raise ValueError("Missing separate historical morphology/lexicography evidence")
    found_grammar = set()
    for row in grams:
        ident = row.get("id")
        if ident not in GRAMMAR_ROLES or ident in found_grammar:
            raise ValueError("Unrecognized or duplicate historical grammar finding")
        found_grammar.add(ident)
        if ((row.get("headword"), row.get("function")) != GRAMMAR_ROLES[ident] or
             not _url_ok(row.get("source_url")) or
             not row.get("source_reference") or
             not row.get("evidence_grade") or
             not row.get("do_not_conflate_with")):
            raise ValueError("Morpheme function and evidence must remain separate")
        if ident == "can-optative" and "optative" not in row["evidence_grade"] + " "+row["function"]:
            raise ValueError("Optative can not be recast as place")
    if found_grammar != set(GRAMMAR_ROLES):
        raise ValueError("Historical grammatical categories missing")
    found = {}
    for row in rows:
        ident = row.get("id")
        if ident not in EXPECTED or ident in found:
            raise ValueError("Unknown or duplicate anchored historical context")
        form, written, role, work = EXPECTED[ident]
        if ((row.get("form"), row.get("written_form"), row.get("role"),
             row.get("primary_collection_id")) != (form, written, role, work)):
            raise ValueError("Unapproved historical spelling or grammatical role substitution")
        if row.get("source_url") != by_coll[work]["source_url"]:
            raise ValueError("Unanchored historical work URL")
        src = row.get("exact_short_source_phrase")
        if (not isinstance(src, str) or not src.strip() or len(src.split()) > 10
                or written not in src.split()):
            raise ValueError("Only short source-anchored exact passage contexts allowed")
        if any(row.get(k) is not False for k in
               ("independent_manuscript_facsimile_checked",
                "english_alignment_human_reviewed")):
            raise ValueError("Neither independent manuscript reading nor bilingual Gold was conducted")
        if row.get("source_text_edited_transcription_only") is not True or row.get("not_a_general_rule") is not True:
            raise ValueError("A located surface may not be generalized into an unreviewed grammar rule")
        if not row.get("source_locator") or not row.get("source_grade") or not _url_ok(row.get("external_lexical_reference")):
            raise ValueError("Missing historical source locator/grade")
        found[ident] = row
    if set(found) != set(EXPECTED):
        raise ValueError("One or more primary textual contexts missing")
    guard = doc.get("global_guardrails", {})
    if (guard.get("manuscript_images_verified_count") != 0 or
        guard.get("whole_clauses_independently_translated") != 0 or
        guard.get("human_silver_approved") != 0 or guard.get("gold_created") != 0 or
        guard.get("automatic_lexicon_promotion") is not False or
        guard.get("automatic_source_language_semantic_accuracy") is not None or
        guard.get("allow_bulk_copyrighted_transcription") is not False):
        raise ValueError("Research cannot certify manuscripts/meaning, Silver/Gold or broad rights")
    return doc


def match_located_excerpt(visible_edition_text: str, phrase: str) -> bool:
    """Only exact short published-transcription text; never accept partial substring
    fragments inside another word or erase diacritics / alter apostrophes.
    """
    text = norm(visible_edition_text)
    wanted = norm(phrase)
    return bool(re.search(r"(?<!\w)" + re.escape(wanted).replace(r"\ ", r"\s+") + r"(?!\w)", text))


def fetch_page(source_url: str) -> str:
    if not _url_ok(source_url, source_only=True):
        raise ValueError("Refuse external/mutable or unsafe source URL")
    req = Request(source_url, headers={
        "User-Agent": "Tlahtolli-Primary-Edition-Context-Check/1.0",
        "Accept": "text/html",
    })
    with urlopen(req, timeout=25) as r:
        data = r.read(6_000_001)
        if len(data) > 6_000_000:
            raise ValueError("Edited historical page is unexpectedly large")
        if "text/html" not in r.headers.get("Content-Type", ""):
            raise ValueError("Not a historical HTML transcription page")
    parser = VisibleText()
    parser.feed(data.decode("utf-8", errors="replace"))
    # Full fetched page remains in memory only and is never written out,
    # published or used as a newly approved neural training example.
    return "".join(parser.chunks)


def examine(*, catalog: Path = CATALOG, live: bool = False, page_fetcher=fetch_page) -> dict:
    doc = read_catalog(catalog)
    pages: dict[str, str] = {}
    investigations = []
    for row in doc["contexts"]:
        work = row["primary_collection_id"]
        result = {
            "id": row["id"],
            "form": row["form"],
            "literal_edited_form": row["written_form"],
            "morphological_role_hypothesis": row["role"],
            "exact_short_source_phrase": row["exact_short_source_phrase"],
            "primary_collection_id": work,
            "source_url": row["source_url"],
            "source_locator": row["source_locator"],
            "contextual_source_edition": row["source_grade"],
            "lexical_reference_url": row["external_lexical_reference"],
            "exact_visible_edition_phrase_checked": None,
            "independent_manuscript_image_read": False,
            "contextual_english_translation_certified": False,
            "source_based_silver_approved": False,
            "cannot_generalize_spelling_or_suffix": True,
            "training_eligible": False,
        }
        if live:
            url = row["source_url"]
            if url not in pages:
                pages[url] = page_fetcher(url)
            if not match_located_excerpt(pages[url], row["exact_short_source_phrase"]):
                raise ValueError("Edition text or cited contextual phrase no longer matches: "+row["id"])
            result["exact_visible_edition_phrase_checked"] = True
        investigations.append(result)
    return {
        "format": "tentli-primary-edition-context-collation-audit-v1",
        "catalog_sha256": hashlib.sha256(catalog.read_bytes()).hexdigest(),
        "primary_edited_source_collections": 2,
        "specific_short_historical_contexts": len(investigations),
        "morphology_and_variant_source_index_claims": len(doc["grammar_claims"]),
        "network_source_pages_checked": len(pages),
        "live_edition_text_checks": sum(x["exact_visible_edition_phrase_checked"] is True for x in investigations),
        "independent_manuscript_facsimile_collations": 0,
        "historical_source_accuracy_independently_certified": False,
        "new_approved_silver_translations": 0,
        "new_gold_translations": 0,
        "approved_dictionary_changes": 0,
        "model_weights_updated": False,
        "note": ("Checks whether three short quoted spellings genuinely appear on two "
                 "digitized edited historical Nahuatl documents; not manuscript "
                 "paleography or a translation accuracy judgment."),
        "investigations": investigations,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--live-check", action="store_true", help="Fetch and test two allowlisted edited historical original-source pages")
    ap.add_argument("--output", type=Path)
    args = ap.parse_args()
    report = examine(live=args.live_check)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k!="investigations"},ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()

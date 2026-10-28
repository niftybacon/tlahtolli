#!/usr/bin/env python3
"""Strict independent validator for Tlahtolli's Florentine Codex close-readings.

This validator checks integrity and prevents automated promotion of provisional
editorial readings into bilingual model-training examples. It cannot prove
that a transcription or grammatical interpretation is historically correct.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/florentine_codex/close_reading.json"
FOLIO = re.compile(r"^[0-9]{1,3}[rv]$")
WORD = re.compile(r"[^\W\d_]+", re.UNICODE)
CERTAINTIES = {"lexicon_supported", "provisional"}

def url_good(value):
    try:
        u = urlparse(value)
        return u.scheme == "https" and bool(u.netloc) and not (u.username or u.password)
    except (TypeError, ValueError):
        return False

def validate(path=SOURCE):
    try:
        doc = json.loads(Path(path).read_text(encoding="utf-8"))
    except (ValueError, OSError) as exc:
        return [f"read error: {exc}"], {}
    errors, stats, seen = [], {"passages": 0, "word_occurrences": 0, "facsimile_checked": 0, "approved_pairs": 0}, set()
    if doc.get("format") != "tlahtolli-codex-close-reading" or doc.get("schema") != 1:
        errors.append("unrecognized corpus schema")
    if doc.get("train_eligible") is not False:
        errors.append("public research close readings must be globally training-ineligible")
    if not url_good(doc.get("facsimile_base")):
        errors.append("missing facsimile reference")
    passages = doc.get("passages")
    if not isinstance(passages,list) or not passages:
        return errors + ["no passages"], stats
    for i, p in enumerate(passages):
        ident = p.get("id", f"entry {i}")
        stats["passages"] += 1
        if not isinstance(ident,str) or ident in seen:
            errors.append(f"{ident}: duplicate/missing ID")
        seen.add(ident)
        if not isinstance(p.get("book"),int) or not 1 <= p["book"] <= 12:
            errors.append(f"{ident}: invalid book")
        if not FOLIO.fullmatch(p.get("folio","")):
            errors.append(f"{ident}: folio missing/invalid")
        if not url_good(p.get("source_url")) or not url_good(p.get("source_facsimile")):
            errors.append(f"{ident}: bad source URL")
        if p.get("facsimile_checked") is not False:
            # Only a separate, documented editorial signoff can change this file's status.
            errors.append(f"{ident}: independently verified facsimile status not documented in this research dataset")
        if p.get("manuscript_line_number") is not None:
            errors.append(f"{ident}: manuscript line number invented before line collation")
        if p.get("train_eligible") is not False or p.get("training_status") != "not_approved":
            errors.append(f"{ident}: research fragment improperly marked trainable")
        if p.get("translation_rights") != "not_cleared":
            errors.append(f"{ident}: missing rights gate")
        if p.get("review_level") != "lexical_crosscheck_only" or p.get("reviewed_by") is not None:
            errors.append(f"{ident}: reviewer improperly represented")
        for k in ("source_reading","normalized","provisional_english","notes","source_edition","locator"):
            if not isinstance(p.get(k),str) or not p[k].strip():
                errors.append(f"{ident}: missing {k}")
        toks=p.get("tokens")
        if not isinstance(toks,list) or not toks:
            errors.append(f"{ident}: no lexical analysis");continue
        expected=[x.lower() for x in WORD.findall(p.get("source_reading",""))]
        got=[]
        for j,t in enumerate(toks):
            stats["word_occurrences"]+=1
            if not isinstance(t,dict):
                errors.append(f"{ident}: token {j} not object");continue
            got.append(str(t.get("surface","")).lower())
            for k in ("surface","lemma","gloss","morph","role"):
                if not isinstance(t.get(k),str) or not t[k].strip():
                    errors.append(f"{ident}: token {j} missing {k}")
            if t.get("certainty") not in CERTAINTIES:
                errors.append(f"{ident}: token {j} invalid certainty")
            if t.get("dictionary_url") and not url_good(t["dictionary_url"]):
                errors.append(f"{ident}: token {j} invalid lexicon URL")
        if expected != got:
            errors.append(f"{ident}: token order/surfaces do not match source reading: {expected} != {got}")
    # Independent visual comparison records MUST NOT silently become training data.
    visual_path=Path(path).with_name("folio_visual_collation.json")
    if visual_path.exists():
        try:
            evidence=json.loads(visual_path.read_text(encoding="utf-8"))
            if evidence.get("format")!="tlahtolli-manuscript-visual-collation" or evidence.get("schema")!=1:
                errors.append("visual collation schema unrecognized")
            if evidence.get("train_eligible") is not False or evidence.get("gold_standard") is not False or evidence.get("certified_lines")!=0:
                errors.append("partial visual page observations cannot be marked verified/training approved")
            refs=set()
            for folio in evidence.get("folios",[]):
                if not FOLIO.fullmatch(folio.get("folio","")) or not url_good(folio.get("source_url")) or not url_good(folio.get("manuscript_image_reference")):
                    errors.append("visual evidence missing folio/HTTPS image locator")
                if folio.get("status")!="visual_partial_not_certified":
                    errors.append("visual evidence status is overstated")
                for block in folio.get("regions",[]):
                    ref=block.get("id")
                    if not ref or ref in refs:
                        errors.append("missing or duplicate visual evidence region ID")
                    refs.add(ref)
                    if not block.get("visual_observation") or not block.get("uncertain_characters") or not block.get("locator"):
                        errors.append(f"{ref}: visual uncertainty/locator missing")
                    if block.get("word_boundary_certified") is not False or block.get("interpretation_certified") is not False:
                        errors.append(f"{ref}: visually checked excerpt falsely certified")
            stats["partial_visual_regions"]=len(refs)
            for p in passages:
                ref=p.get("visual_evidence_ref")
                if ref and ref not in refs:
                    errors.append(f"{p['id']}: visual evidence reference does not resolve")
                if p.get("facsimile_visual_comparison")=="partial_image_inspection_not_line_certified" and not ref:
                    errors.append(f"{p['id']}: missing visual comparison locator")
        except (ValueError,OSError,TypeError,AttributeError) as exc:
            errors.append(f"visual collation could not be validated: {exc}")
    else:
        errors.append("folio_visual_collation.json is missing")
    return errors,stats

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path",nargs="?",type=Path,default=SOURCE)
    args=ap.parse_args()
    errors,stats=validate(args.path)
    print(f"Close readings: {stats.get('passages',0)} excerpts; {stats.get('word_occurrences',0)} word analyses; "
          f"{stats.get('facsimile_checked',0)} independently certified lines; "
          f"{stats.get('partial_visual_regions',0)} partial folio-image observations; "
          f"{stats.get('approved_pairs',0)} approved training pairs.")
    for e in errors: print("ERROR:",e)
    if not errors: print("PASS: source-linked preliminary examples, all excluded from training.")
    return 1 if errors else 0

if __name__ == "__main__":
    raise SystemExit(main())

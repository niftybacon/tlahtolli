#!/usr/bin/env python3
"""Fail-closed documentation contract for the current Tēntli contributor roadmap.

This only tests presence and cross-link consistency, NOT scholarly correctness,
whether an agent really read the policy, or whether a PR is substantial.
"""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
ROADMAP = ROOT / "docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md"
AGENTS = ROOT / "AGENTS.md"
TEMPLATE = ROOT / ".github/PULL_REQUEST_TEMPLATE.md"
AUDIT = ROOT / "research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md"

PHASE_TERMS = (
    "Stabilize the engines",
    "Establish bilingual evidence",
    "Expand grammar teacher",
    "Stronger English",
    "Persistent learning",
    "Historical coverage",
)

def must(condition: bool, description: str) -> None:
    if not condition:
        raise AssertionError(description)

def has_link(text: str, destination: str) -> bool:
    return f"]({destination})" in text

def read(path: Path) -> str:
    must(path.is_file(), f"Missing required contributor document: {path.relative_to(ROOT)}")
    text = path.read_text(encoding="utf-8")
    must(text.strip() != "", f"Empty contributor document: {path.relative_to(ROOT)}")
    return text

def check() -> None:
    readme = read(README)
    roadmap = read(ROADMAP)
    agents = read(AGENTS)
    template = read(TEMPLATE)
    audit = read(AUDIT)

    must("## Required development roadmap" in readme, "README must prominently state the mandatory roadmap")
    must("MANDATORY FOR ALL CURRENT AND FUTURE" in readme, "README lacks mandatory agent warning")
    must("## Six overlapping workstreams" in roadmap, "Roadmap missing six-phase authoritative table")
    must("Multi-agent coordination: must follow" in roadmap, "Roadmap missing change notification protocol")
    must("Mandatory six-phase plan" in agents, "AGENTS.md missing mandatory six-phase plan")
    must("Substantial change classification and notification record" in template, "PR template missing notification evidence")
    must("Historical material" in audit and "public translator" in audit.lower(), "Expected engine consumption audit is incomplete")

    for filename, text in (("README", readme), ("roadmap", roadmap), ("AGENTS", agents)):
        for phase in PHASE_TERMS:
            # Wording differs slightly in phase tables (e.g. 'Expand the grammar teacher',
            # 'Give Tēntli stronger English', 'Build persistent learning').
            key = {"Stabilize the engines": "Stabilize",
                   "Establish bilingual evidence": "bilingual evidence",
                   "Expand grammar teacher": "grammar teacher",
                   "Stronger English": "English",
                   "Persistent learning": "learning",
                   "Historical coverage": "historical" }[phase]
            must(key.lower() in text.lower(), f"{filename} is missing phase '{phase}'")

    for filename, text in (("README", readme), ("roadmap", roadmap), ("AGENTS", agents)):
        for label in ("Gold", "Silver", "Bronze", "Monolingual"):
            must(label in text, f"{filename} missing evidence level: {label}")

    for expected in (
        "docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md",
        "research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md",
    ):
        must(has_link(readme, expected), f"README must link to {expected}")
        must((ROOT / expected).is_file(), f"README link target missing: {expected}")

    must(has_link(readme, "AGENTS.md"), "README does not link to AGENTS.md")
    must(has_link(agents, "docs/TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md"), "AGENTS missing canonical roadmap link")
    must(has_link(agents, "README.md#required-development-roadmap-october-30-2026"), "AGENTS missing README roadmap entrypoint")
    must("both" in agents.lower() and "readme.md" in agents.lower() and "TENTLI_CONSOLIDATED_LEARNING_ROADMAP" in agents,
         "Agents must update both canonical roadmap locations for substantial changes")

    for filename, text in (("README", readme), ("roadmap", roadmap), ("AGENTS", agents), ("PR template", template)):
        must("notif" in text.lower(), f"{filename} missing coordination/notification requirement")

    for filename, text in (("README", readme), ("roadmap", roadmap), ("AGENTS", agents)):
        must("abstain" in text.lower() or "abstention" in text.lower(),
             f"{filename} missing requirement to protect abstention")
        must("accuracy" in text.lower(), f"{filename} missing independent accuracy limits")

    must("notify" in template.lower() or "notified" in template.lower(), "PR template missing explicit notification checkbox")
    must("README.md" in template and "TENTLI_CONSOLIDATED_LEARNING_ROADMAP" in template,
         "PR template must require updating both roadmap locations when substantive")

    print("Tēntli roadmap governance: required docs, six workstreams, trust tiers, cross-links and notices OK")
    print("NOTE: this check cannot certify human review, historical meaning, agent behavior or Gold accuracy.")

if __name__ == "__main__":
    try:
        check()
    except (AssertionError, OSError, UnicodeError) as exc:
        print(f"Tēntli roadmap governance FAILED: {exc}", file=sys.stderr)
        sys.exit(1)

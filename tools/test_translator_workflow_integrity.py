#!/usr/bin/env python3
"""Fail CI when translator push/PR filters drift or the same test step runs twice.

Dependency-free on purpose: this checks the exact, repository-owned workflow syntax,
not the historical accuracy of any translator proposal.
"""
from collections import Counter
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github/workflows/translator-regressions.yml").read_text(encoding="utf-8")


def event_paths(event):
    match = re.search(
        rf"(?m)^  {re.escape(event)}:\n    paths:\n(?P<rows>(?:      - '[^']+'\n)+)",
        workflow,
    )
    assert match, f"Missing or unexpectedly formatted {event} paths block"
    paths = re.findall(r"(?m)^      - '([^']+)'$", match.group("rows"))
    assert paths, f"{event} should have nonempty path filters"
    assert len(paths) == len(set(paths)), f"Duplicate {event} path filters"
    return set(paths)


push_paths = event_paths("push")
pr_paths = event_paths("pull_request")
assert push_paths == pr_paths, (
    "Translator CI trigger drift: "
    f"push-only={sorted(push_paths - pr_paths)}, "
    f"PR-only={sorted(pr_paths - push_paths)}"
)

needed = {
    "translator-*.js",
    "data/clause_grammar.json",
    "data/possessed_form_evidence.json",
    "tools/test_translator_workflow_integrity.py",
    "tools/test_declarative_grammar.js",
    "tools/test_morphology_clause_bridge.js",
}
assert needed <= push_paths, f"Critical translator paths missing: {sorted(needed - push_paths)}"

steps = re.findall(r"(?m)^      - name: (.+)$", workflow)
counts = Counter(steps)
duplicates = sorted(name for name, count in counts.items() if count != 1)
assert not duplicates, f"Duplicate workflow steps: {duplicates}"

print(f"PASS translator workflow integrity: {len(push_paths)} symmetric PR/push "
      f"filters, {len(steps)} unique steps, and critical grammar paths covered")

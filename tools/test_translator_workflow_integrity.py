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

# YAML folds a plain-scalar 'run:' continuation into a single shell line.
# Thus 'run: node first.js\n          node second.js' runs only first.js;
# 'second.js' is passed as an ignored argument. Catch this across the workflow.
folded_shell_command = re.search(
    r"(?m)^        run: (?![|>]\s*$)[^\n]+\n {10,}(?:node|python|npm|bash|pytest|curl|git)\b[^\n]*$",
    workflow,
)
assert not folded_shell_command, (
    "A YAML-folded run continuation would silently skip a shell command: "
    + folded_shell_command.group(0) if folded_shell_command else ""
)

# Protect exact historical source-form tests from accidentally becoming
# ignored argv to the earlier source morphology adapter check.
for required in (
    "node tools/test_source_morphology.js",
    "node tools/test_phase6_canonical_exact_forms.js",
):
    assert workflow.count(required) == 1, f"Expected exactly one test invocation: {required}"
    assert re.search(rf"(?m)^          {re.escape(required)}$", workflow), (
        f"Source evidence test must run as its own shell command: {required}"
    )

print(f"PASS translator workflow integrity: {len(push_paths)} symmetric PR/push "
      f"filters, {len(steps)} unique steps, and critical grammar paths covered")

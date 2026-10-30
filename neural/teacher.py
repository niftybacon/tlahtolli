"""Validate synthetic knowledge distilled from current canonical Tēntli engines.

Never conflate a teacher's grammar-derived form or English rendering with an
independent Nahuatl manuscript or a human-reviewed translation.
"""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path

GRADE_WEIGHT = {
    "grammar-paradigm": 0.65,
    "source-checked-lexeme": 0.8,
    "source-listed-form": 0.8,
    "grammar-composed-English": 0.2,
}
GRADE_TASK = {
    "grammar-paradigm": "analyze",
    "source-checked-lexeme": "analyze",
    "source-listed-form": "analyze",
    "grammar-composed-English": "translate",
}
CHECKED = ("dictionary.json", "paradigms.json", "translator-sentence.js",
           "translator-english.js", "translator-grammar-ir.js")


@dataclass(frozen=True)
class TeacherExample:
    task: str
    input: str
    target: str
    grade: str
    weight: float
    source_urls: tuple[str, ...]


def load_teacher(file: str | Path, *, root: str | Path | None = None) -> tuple[list[TeacherExample], dict]:
    file = Path(file)
    meta = json.loads(Path(str(file) + ".meta.json").read_text(encoding="utf-8"))
    if meta.get("format") != "tentli-teacher-v1" or meta.get("accuracy") is not None or meta.get("independent_gold") != 0:
        raise ValueError("Not a source-graded teacher export")
    if root is not None:
        root = Path(root)
        for name in CHECKED:
            expected = meta.get("source_sha256", {}).get(name)
            actual = hashlib.sha256((root / name).read_bytes()).hexdigest()
            if not expected or actual != expected:
                raise ValueError("Canonical teacher source changed: " + name)
        release = json.loads((root / "release.json").read_text(encoding="utf-8"))
        if release.get("version") != meta.get("release"):
            raise ValueError("Teacher release does not match canonical release")
    rows: list[TeacherExample] = []
    unique: set[tuple[str, str, str, str]] = set()
    for line in file.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        x = json.loads(line)
        if x.get("grade") not in GRADE_WEIGHT or x.get("task") != GRADE_TASK.get(x.get("grade")):
            raise ValueError("Unsupported teacher grade/task or attempted gold promotion")
        if x.get("weight") != GRADE_WEIGHT[x["grade"]] or x.get("split") != "train":
            raise ValueError("Teacher weights or training status altered")
        if not isinstance(x.get("input"), str) or not isinstance(x.get("target"), str) or not x["input"] or not x["target"]:
            raise ValueError("Blank teacher analysis")
        if not isinstance(x.get("source_urls"), list) or not x["source_urls"] or any(
            not isinstance(url, str) or not url.startswith("https://") for url in x["source_urls"]
        ):
            raise ValueError("Teacher lacks canonical sources")
        if "synthetic teacher signal" not in x.get("provenance", ""):
            raise ValueError("Missing teacher-only evidence limitation")
        key = x["task"], x["input"], x["target"], x["grade"]
        if key in unique:
            raise ValueError("Duplicated teacher task")
        unique.add(key)
        rows.append(TeacherExample(x["task"], x["input"], x["target"], x["grade"],
                                   x["weight"], tuple(x["source_urls"])))
    if not rows or len(rows) != meta.get("examples"):
        raise ValueError("Incomplete teacher export")
    if not any(r.task == "analyze" for r in rows):
        raise ValueError("Missing structural teacher supervision")
    return rows, meta

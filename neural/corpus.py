"""Source-level historical text intake for experimental neural learning.

Traceable, legally reusable historical transcription MAY train an unlabeled
language model without individual lemma, morphology or translation approval.
This does NOT license publishing speculative lexical claims or unlicensed text.
"""
from __future__ import annotations
from collections import Counter
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

ALLOWED_RIGHTS = {"public_domain", "cc0", "cc_by_4_0", "permission_documented", "fair_use_assessed"}
ALLOWED_TRANSCRIPTION = {"unreviewed", "editorial", "facsimile_checked", "reviewed"}
ALLOWED_SPLITS = {"train", "dev", "test"}
ALLOWED_ALIGNMENTS = {"candidate", "reviewed"}
MAX_TEXT_CHARS = 20000


class CorpusError(ValueError):
    """Refuse undocumented sources, unlicensed editions or contaminated splits."""


def _valid_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    u = urlparse(value)
    return u.scheme in ("https", "http") and bool(u.netloc)


def _check_rights(obj: dict, record_id: str, label: str) -> str:
    """Classify source rights without pretending a model automatically clears law.

    The fair-use tier is a *documented human legal assessment*, not a license,
    a judge's finding, or blanket permission to scrape a website. Only private
    training inputs may use the tier; release requires separate assessment.
    """
    rights = _required_string(obj, "rights")
    if rights not in ALLOWED_RIGHTS:
        raise CorpusError(f"{record_id}: {label} rights are undocumented")
    if rights == "permission_documented" and not _valid_url(obj.get("permission_url")):
        raise CorpusError(f"{record_id}: {label} permission_documented requires permission_url")
    if rights == "fair_use_assessed":
        if not _valid_url(obj.get("acquisition_url")):
            raise CorpusError(f"{record_id}: {label} fair use requires lawfully acquired source URL")
        if not _valid_url(obj.get("assessment_url")):
            raise CorpusError(f"{record_id}: {label} fair use requires a source-specific review locator")
        if obj.get("no_source_redistribution") is not True:
            raise CorpusError(f"{record_id}: {label} restricted source cannot be redistributed")
        if not isinstance(obj.get("assessment_note"), str) or len(obj["assessment_note"].strip()) < 30:
            raise CorpusError(f"{record_id}: {label} fair-use basis must be explained")
    return rights


def _required_string(obj: dict, field: str) -> str:
    value = obj.get(field)
    if not isinstance(value, str) or not value.strip():
        raise CorpusError(f"Missing nonempty {field}")
    return value.strip()


@dataclass(frozen=True)
class Example:
    record_id: str
    work_id: str
    source_url: str
    original: str
    split: str
    transcription_status: str
    rights: str
    translation: str | None
    alignment: str | None
    translation_weight: float
    fingerprint: str

    @property
    def experimental_parallel(self) -> bool:
        return self.translation is not None


def inspect_record(obj: dict, *, allow_test_fixture: bool = False) -> Example:
    if not isinstance(obj, dict):
        raise CorpusError("Corpus row must be a JSON object")
    record_id = _required_string(obj, "record_id")
    work_id = _required_string(obj, "work_id")
    url = _required_string(obj, "source_url")
    if not _valid_url(url):
        raise CorpusError(f"{record_id}: invalid source URL")
    variety = _required_string(obj, "variety")
    if variety != "Classical Nahuatl" and not (allow_test_fixture and variety == "synthetic_test_only"):
        raise CorpusError(f"{record_id}: only Classical Nahuatl historical learning is enabled")
    _required_string(obj, "source_date")
    original = _required_string(obj, "original")
    if len(original) > MAX_TEXT_CHARS:
        raise CorpusError(f"{record_id}: historical excerpt exceeds length bound")
    if any(ord(c) < 32 and c not in "\n\t\r" for c in original):
        raise CorpusError(f"{record_id}: control characters are disallowed")
    rights = _check_rights(obj, record_id, "source transcription")
    transcription = _required_string(obj, "transcription_status")
    if transcription not in ALLOWED_TRANSCRIPTION:
        raise CorpusError(f"{record_id}: invalid transcription status")
    split = obj.get("split", "train")
    if split not in ALLOWED_SPLITS:
        raise CorpusError(f"{record_id}: invalid train/dev/test split")
    trans = obj.get("translation")
    translation_text = alignment = None
    weight = 0.0
    if trans is not None:
        if not isinstance(trans, dict):
            raise CorpusError(f"{record_id}: translation must be an object")
        translation_text = _required_string(trans, "text")
        if len(translation_text) > MAX_TEXT_CHARS:
            raise CorpusError(f"{record_id}: translation exceeds length bound")
        if _required_string(trans, "language") != "en":
            raise CorpusError(f"{record_id}: only English parallel targets supported in this experiment")
        _check_rights(trans, record_id, "English translation")
        if not _valid_url(trans.get("source_url")):
            raise CorpusError(f"{record_id}: source-specific translation URL required")
        alignment = _required_string(trans, "alignment")
        if alignment not in ALLOWED_ALIGNMENTS:
            raise CorpusError(f"{record_id}: invalid alignment grade")
        weight = 0.15 if alignment == "candidate" else 1.0
    digest = hashlib.sha256((record_id + "\0" + work_id + "\0" + original +
                             "\0" + (translation_text or "")).encode("utf-8")).hexdigest()
    return Example(record_id, work_id, url, original, split, transcription,
                   rights, translation_text, alignment, weight, digest)


def load_corpus(path: str | Path, *, allow_test_fixture: bool = False) -> list[Example]:
    seen_ids: set[str] = set()
    seen_written: dict[str, str] = {}
    works: dict[str, str] = {}
    rows: list[Example] = []
    for i, raw in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        try:
            example = inspect_record(json.loads(raw), allow_test_fixture=allow_test_fixture)
        except (ValueError, TypeError) as exc:
            raise CorpusError(f"Corpus line {i}: {exc}") from exc
        if example.record_id in seen_ids:
            raise CorpusError(f"Duplicate record_id {example.record_id}")
        seen_ids.add(example.record_id)
        old = works.setdefault(example.work_id, example.split)
        if old != example.split:
            raise CorpusError(f"Work {example.work_id} leaks between {old} and {example.split}")
        fingerprint = hashlib.sha256(" ".join(example.original.lower().split()).encode()).hexdigest()
        if fingerprint in seen_written and seen_written[fingerprint] != example.split:
            raise CorpusError("Identical historical span leaked across data splits")
        seen_written[fingerprint] = example.split
        rows.append(example)
    if not rows:
        raise CorpusError("Empty historical learning corpus")
    if not any(e.split == "train" for e in rows):
        raise CorpusError("No training rows")
    return rows


def summarize(rows: list[Example]) -> dict:
    by_split = Counter(r.split for r in rows)
    return {
        "records": len(rows),
        "works": len({r.work_id for r in rows}),
        "splits": dict(sorted(by_split.items())),
        "monolingual_training_records": sum(r.split == "train" for r in rows),
        "translation_training_records": sum(r.split == "train" and r.experimental_parallel for r in rows),
        "candidate_parallel_training_records": sum(r.split == "train" and r.alignment == "candidate" for r in rows),
        "historical_transcription_unreviewed": sum(r.transcription_status in {"unreviewed", "editorial"} for r in rows),
        "fair_use_assessed_source_records": sum(r.rights == "fair_use_assessed" for r in rows),
        "independent_translation_accuracy": None,
        "data_hash": hashlib.sha256("|".join(sorted(r.fingerprint for r in rows)).encode()).hexdigest(),
    }

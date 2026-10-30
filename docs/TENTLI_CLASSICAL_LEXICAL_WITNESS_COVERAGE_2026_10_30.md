# Tēntli — Source-checked Classical lexical evidence and historical witness audit
*Research-only, October 30, 2026. Stacked change: PR #100 after PR #97; no live translator changes.*

## Why this step

The previous research index held 44 source-linked lexical records plus three located example entries (`atl`, `xochitl`, `in`). That is insufficient to evaluate coverage of the 133 Brinton Nahuatl–English training stanzas, and indiscriminate macron stripping or treating a guessed inflection as a verified word would make the system appear more confident without improving the language.

The new audit **reuses canonical source claims**, rather than importing a second dictionary. `neural/canonical_lexical_coverage.py` reads `data/lexicon.json`, `data/evidence.json`, `references.json`, and the PR #97 source-printed-aligned candidate JSONL. It does not write a lexical record or English translation into any canonical source.

## Measured results on the pinned baseline

| Measure | Verified result | What it does not mean |
|---|---:|---|
| Existing canonical published source-checked headword records (README) | 225 | Not 225 validated English translation sentences |
| Records satisfying this audit's **stricter** Classical Nahuatl, headword-and-POS claim, citation URL and locator gates | **166** | Other entries are not necessarily wrong; these are a deliberately narrower subset |
| Cited early source-witness spellings recognized separately | **10** | A source occurrence does not prove a meaning, morphological analysis or translation |
| Brinton training stanzas examined | **133** | Only weak candidate stanza correspondence, not human Gold |
| Brinton poem-disjoint development stanzas untouched by triage | **17** | Not an independent historical evaluation |
| Whitespace-/punctuation-tokenized historic written-form occurrences examined | **2,646** | Tokens include particles, poetic vocables, editorial spellings and potentially inflected words |
| Exact citation-form or **individually cited early historical witness** matches | **317** (**12.0%**) | **Not** a translation accuracy, lemma recall, morphological coverage, or error rate |
| Witness-only matched occurrences (not exactly identical to checked canonical lemma) | **35** | Does not license a general historical spelling rewrite |
| Distinct supported spellings matched in the stanzas | **19** | Other source tokens need *analysis*, not immediate promotion into headwords |
| Human-reviewed historical English examples newly created | **0** | Human judgment cannot be synthesized by the audit |

[Successful source-checked audit workflow](https://github.com/niftybacon/tlahtolli/actions/runs/41069556210). These counts concern the exact pinned data revision documented in that workflow; they will change if source claims or historical stanzas are independently revised.

## Orthographic discipline

The lookup is **exact NFC/casefold** for checked citation forms. Any different historical spelling is included **only if the repository's own reference atlas cites its occurrence**, with manuscript/edition locator and source URL. Only explicitly early `dfc` (Florentine Codex) and `enl` (mid-sixteenth-century Early Nahuatl Library) witness records can supply additional spellings in this early Classical research audit.

For example, `atl` can be connected to source-checked `ātl` because a specific early text records `atl`; `xochitl` and `xōchitl` are likewise connected only by a cited early spelling. `Jn` and `yn` are *individually attested* written forms of the particle `in`; the code does **not** apply generalized `j→i`, `y→i`, `h` removal, macron stripping or other guessed mappings to arbitrary words. A particle occurrence cannot be reduced to one invariant English gloss.

The 1833 Puebla-area Luke witnesses remain explicitly excluded because their time and variety differ, even where they resemble colonial spellings. Nor does a Florentine Codex or ENL reading automatically prove Brinton's nineteenth-century printed poem had the same grammatical context.

## Forty research proposals — not forty automatic approvals

The audit selects **40 stanza review leads**, with up to four from each training poem, and separately returns **40 high-frequency unmatched written-form leads**. The latter include recurring surfaces such as `ohuaya`, `ye`, `zan`, `ya`, and `aya`. The tool does not determine whether each is a lyric refrain, independent particle, word, derived form, segmentation artifact, or variant: **all remain hypotheses for research**.

Every unmatched form is supported by counts, historical poem IDs and pinned original source-line links (limited training-work examples). Its `candidate_meaning` is always `null`, and `auto_source_checked` and `training_eligible` are both false. A reviewer can investigate high-frequency leads first, compare the exact Brinton original, check a specific historical dictionary and a manuscript, and record alternative analyses before proposing any higher confidence level.

**Gold remains zero.** No neural weights are updated, no production translator behavior changed, and no synthetic English translation was placed into a training corpus. The output is a reproducible *research proposal queue*, not an actual 40-step autonomous research/training loop.

## Reproduction

```bash
python -m unittest discover -s tools -p 'test_canonical_lexical_coverage.py' -v
python -m neural.canonical_lexical_coverage --limit 40 --per-work 4 \
  --output /tmp/tentli-canonical-lexical-audit.json
```

The audit records cryptographic SHA-256 hashes of the canonical lexicon, evidence claims, source witness atlas and bilingual manifest, permitting exact comparison across iterations. CI publishes the full JSON for external human review.

## Next research gate

1. **Sort high-frequency unknowns by source work and context**. Do not promote poetry exclamations or inflected forms into independent dictionary headwords simply because they recur.
2. **Investigate productive morphology and manuscript spellings independently**. An exact-lookup failure can reflect inflection, segmentation, copied script notation or an actual lexicon gap.
3. Create rights-cleared, **human-reviewed Silver literal or phrase-level alignments** from the previously located Brinton stanzas. Maintain separate provenance, spelling and edition fidelity; refrain from assuming Brinton's interpretive English is clause-literal.
4. Recruit external, source-work-disjoint human review for **Gold**. Until that exists, neural dev loss, token matches and generated English similarity are not semantic accuracy.
5. Only after genuine review promote evidence via the canonical source-claim/pairs approval mechanisms, preserving tests and rollback. The more ambitious autonomous 40-development-cycle investigator can propose claims and tests, but must never self-certify them.

This next phase is evidence acquisition, not repeated opaque model training.

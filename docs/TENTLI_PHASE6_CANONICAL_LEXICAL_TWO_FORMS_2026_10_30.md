# Phase 6 milestone — two exact historical wordforms promoted to the canonical lexicon

*October 30, 2026. Source-verified lexicographic headwords; **not** independent human-reviewed historical stanza interpretation or productive morphological rules.*

## Measurable advancement and evidence type

The existing Phase 6 investigator, source morphology research wrapper and 80-dossier packet had independently located historical lexical reference entries for written forms `yehuan` and `tepilhuan`. Until this milestone, the forms were **not** in the canonical 2,142-entry lexicon, so current actual-engine recognition still classified them among the **928** unconnected written forms in the unchanged 1,181-original-form Brinton research set. PR #112 added only a read-only source research adapter (0→2 research hints) and explicitly did **not** change canonical recognition.

This release makes a **bounded canonical *dictionary* change** with exactly two source-cited entries and matching evidence claims. The old **928** remains the valid *previous-release* baseline. The new current actual-engine source lookup has **926** unconnected written forms out of the same **1,181**. This is **+2 exact curated lexical lookups**, NOT 2 full morphological derivations, NOT 2 English translations, NOT a 2-word improvement in complete-clause grammar, and NOT a Gold score.

## Exact independent historical reference evidence

| Written headword | Historical reference | What the cited lexicography warrants | What remains unresolved |
| --- | --- | --- | --- |
| `yehuan` | [ODN/Lockhart, *Nahuatl as Written* (2001), p.242](https://nahuatl.wired-humanities.org/content/yehuantin), lists the shorter independent third-person plural form `yehuan`; [UNAM GDN `yehuan`](https://gdn.iib.unam.mx/diccionario/yehuan/188287) separately indexes 1557 `yeuan` and multiple other historical spellings | Only an **exact** independently cited pronominal written-form / isolated dictionary meaning | Whether `yehuan Dios` is a pronoun, title-related construction, direct address or another poetic structure **in its particular original passage**. No automatic `yeuan`→`yehuan` or vowel-length restoration |
| `tepilhuan` | [ODN/Molina (1571), Nahuatl-Spanish Part II, fol.103r col.1](https://nahuatl.wired-humanities.org/node/188794), identifies `tepilhuan` as *hijos, o hijas* | The exact historical lexical form, noun categorization and historical dictionary-level children/offspring gloss | Its morphophonemic segmentation, possessive/number paradigm, honorific/social nuance, particular poetic role and full-context English |

**Source distinctions:** Molina is a sixteenth-century printed dictionary; Lockhart is a modern scholarly grammar citing earlier language; the Online Nahuatl Dictionary is an edited index of those works, and UNAM indexes several other period/orthographic witnesses. We have **not** authenticated a new expert paleographic transcription or a whole-work-blind English Gold reviewer. The new entries say `Checked against source` because the cited dictionary's *specific headword and gloss* were checked directly, **not** because a specialist approved any Brinton stanza reading.

## Canonical data / builds

The one-time source-constrained `tools/migrate_exact_lexical_phase6.py --write` operation added **only** these two literal words to the three aligned source tables and bumped version `2026-10-29.9.0` → `2026-10-30.1.0`. It used the existing standard build commands to regenerate `dictionary.json`, `claim_audit.csv`, the offline dictionary seed in `index.html`, and versioned runtime URLs; it updated `references.json`, `paradigms.json` and `release.json` version locks. The temporary branch-specific write-enabled GitHub workflow was retired immediately after successful generation, so **no new scheduler or privileged persistent build automation remains**.

For both new entries:
- `data/lexicon.json` contains the independently located headword, cautious multiple isolated meanings, citation and unresolved contextual interpretation.
- `data/evidence.json` contains exactly three cited `dictionary` claims — `headword`, `pos`, `meaning` — with the exact Lockhart/Molina locator, explicit **AI-assisted and not independently specialist reviewed** status.
- `data/morphology.json` contains **no** productive stem, inflection, plural/possessive paradigm, or reconstructed historical spelling. Only exact headword identification is possible.
- The original source-based `huiya` verb/vocable disagreement remains untouched.

## Pinned before/after validation (not an accuracy score)

| Cohort | Previous main (PR #112) | This release |
| --- | ---: | ---: |
| Distinct original Brinton training written forms examined | 1,181 | 1,181 |
| Canonical published dictionary headwords | 2,142 | 2,144 |
| Unmatched actual lexical/grammar/paradigm written-form surfaces | 928 | 926 |
| Independently verified whole-stanza English translations added | 0 | 0 |
| Productive morphology rules and inferred variants added | 0 | 0 |
| Independently approved Silver/Gold cases added | 0 | 0 |

These counts are **surface coverage** on an already inspected research corpus, not independent bilingual accuracy. The two new headwords cannot be ranked as manuscript-attested grammatical interpretations or licensed whole-clause English output.

## Safety and negative tests

`tools/test_phase6_canonical_exact_forms.js` tests exact entry/source/claim provenance, no unseen inflections, unresolved English ambiguity, no `yeuan`, `yehuān`, `yehuantin`, `tepiltzin`, `tepilhuantzin` or other invented spelling promotions, and no complete English or finite clause analyses for `yehuan Dios`. The existing source-morphology wrapper still labels earlier research observation metadata as unreviewed; this is independent of the dictionary's *separate* cited headword claims.

The existing `tools/investigator_engine_bridge.js`, `tools/triage_unresolved_historical_forms.js`, `tools/build_phase6_historical_dossiers.js` and corresponding CLI, CI and tests preserve both the **historical pinned 928 prior baseline** and the **current 926 unconnected**. The 80 research dossiers are recomputed from the remaining unrecovered forms; the two newly recognized headwords remain in the earlier research record, not counted as unresolved *current* forms.

## Next (Phase 6 / Phase 2 dependency)

Before asserting any improvement in **complete grammatical composition** or source-licensed English, inspect distinct original poem contexts, independently compare other grammars/editions, record roles and ambiguity in the Phase 5 ledger after genuine external editorial review, and propose separately tested bounded canonical syntax/rule integration. New blind Gold remains **zero**. This exact headword release must not bypass independent semantic or source-grading checks described by [Issue #95](https://github.com/niftybacon/tlahtolli/issues/95) and [Issue #98](https://github.com/niftybacon/tlahtolli/issues/98).

See the [README](../README.md), [mandatory roadmap](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md), [engine consumption audit](../research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md), and [Issue #111](https://github.com/niftybacon/tlahtolli/issues/111). This is only the *first lexical source promotion* of that issue, not completion of its independent contextual-review/grammar goals.

# Phase 6 — independent documentary parallels for `ayac tle quitoz` (research, not productive grammar)
_October 30, 2026. Not a Gold/Silver example, manuscript collation or approved contextual English._

Two independently indexed colonial legal-document excerpts carry the same exact core sequence:
- **1621 Coyoacán donation:** `ayac tle quitoz oncan tlatoz` ([Early Nahuatl Library BC19, folio a](https://enl.wired-humanities.org/bc19/elements/bc19a/000)), Lockhart's analytical transcription.
- **1569 testament of Antonio Quauitencatl:** `omito ayac tle quitoz yuh niquitohua` ([UNAM Gran Diccionario Náhuatl, documents [1157]](https://gdn.iib.unam.mx/diccionario/ayac/185330)), an independently indexed historical document.
- **Lexical comparison:** [ODN `ayac`](https://nahuatl.wired-humanities.org/content/ayac) cites Molina 1571 II 3r, Lockhart 2001 p.211 and related primary historical contexts.

**Shared evidence:** original documentary word order and the indexed negative-indefinite lexical sense. **Unresolved:** whether `ayac` is the formal grammatical subject in both, the role/scope of `tle`, finite morphological analysis of `quitoz`, and the function of each different following sequence. The GDN Spanish paraphrase is not independently reviewed as a literal translation. Both witnesses are already exposed to research and thus are **not blind Gold**.

## Testable next engineering step
The new source pack stores each original excerpt, distinct work ID, URL, locator, competing interpretations and non-promotion flags. Run `node tools/test_attested_ayac_contexts.js` to exercise both **actual original-language contexts** through the existing `diagnose_historical_sentences.js` → lexical → canonical sentence → English → grammar-IR adapters; this regression specifically requires **abstention**, not a fabricated full translation. Negative controls protect against silent generalization to `aiaac`, `ayāc`, `tlen`, etc.

Independent source and morphology review must precede any `translator-sentence.js` / `translator-grammar-ir.js` productive grammar change. After a justified rule exists, compare pinned 1,181-form diagnostics and genuine *whole clauses* before/after, and preserve all uncertainty in the engine. This milestone **does not reduce the 926 unmatched forms**, add a headword, certify a whole-clause grammar analysis or approve Silver/Gold.

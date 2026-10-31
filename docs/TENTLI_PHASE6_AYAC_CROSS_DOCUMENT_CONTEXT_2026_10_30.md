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

## Follow-up: actually consumed by canonical context-sensitive grammar (October 30, 2026)

The research pack now has **three separately identifiable historical documents**: ENL Coyoacán 1621 and GDN 1569 preserve `ayac tle quitoz`, while GDN's 1585 Melchor de Parada possession record [911] preserves `ayac tle oquito ayac otlachallani`. All three are individually source-located quotations; neither UNAM's Spanish editorial paraphrase nor ENL's English editorial translation is an independently signed Silver or Gold reference.

**Wiring:** `translator-integrated.js` fetches the pack for the *existing* `TlahtolliSentence.create` optional final argument. Its source-locked matcher recognizes only complete originally indexed short windows and returns the original contextual word-order observations, **never** a guessed person, tense, scope, object or English sense. `translator-grammar-ir.js` independently verifies the historical IDs, original written tokens and unresolved fields and records exactly three ordered token relations per witness without certifying an entire clause. `translator-english.js` explicitly declines unsupported English. The page presents source links; `tools/diagnose_historical_sentences.js` uses the same engine.

Run `node tools/test_attested_ayac_contexts.js` for 3 positive documented contexts, adversarial source/IR modification and context/spelling swaps, abstention and original finite-word regression. The evidence supports **3 historically witnessed contextual structures, 0 independently certified full grammatical analyses, 0 historical English**. The original 926/1,181 unmatched lexical/grammar-route metric, 2,144 headwords and Gold/Silver=0 remain unchanged; the existing productive morphology analyzer and English generation rules are unmodified.

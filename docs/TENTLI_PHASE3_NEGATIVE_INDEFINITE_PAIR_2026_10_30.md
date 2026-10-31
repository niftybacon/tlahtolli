# Phase 3 — source-graded productive **local** `ayac tle` negative-indefinite grammar

_October 30, 2026. Stacked on draft Phase 6 PR #114; not a translation accuracy or human-review promotion._

## Independent grammatical licensing

This narrow structural feature is backed by **two different reference types** and **five separately indexed colonial document contexts**.

- **Linguistic description:** George Bedell, *The Nahuatl Language*, `Language in India` 11:11 (November 2011), **§14, printed p.19**, [original article PDF](https://languageinindia.com/nov2011/bedellnawatorugo.pdf), describes `ayâc` as a negative person-indefinite and the rule that with more than one negative indefinite, the negative prefix can appear only on the first, while both remain relevant to negative scope. **Original spelling in this scholarly phonemic transcription is not silently rewritten to `ayac`.**
- **Lexicographic construction:** Wimmer (2004), indexed by the [UNAM Gran Diccionario Náhuatl under `ayac`](https://gdn.iib.unam.mx/diccionario/ayac/41417), includes **`ayâc tle`** and a Sahagún *Book XII*, chapter 6 source quotation **`ayâc tle quihtoa`**. This supports a *local two-indefinite grammatical relationship*, but does **not** authorize automatic future/preterite parsing or English alignment for a different document.
- **Molina/Lockhart lexical crosscheck:** [Online Nahuatl Dictionary `ayac`](https://nahuatl.wired-humanities.org/content/ayac), citing Molina (1571) part II f.3r and Lockhart (2001), supports the negative-person-indefinite lexical identity; an individual contextual subject/negation reading still requires source review.

## Original-language documentary controls (research-exposed; NOT blind Gold)

| Indexed work / edition | Short source-language window | Source |
| --- | --- | --- |
| 1621 Coyoacán donation, Early Nahuatl Library BC19 fol. a | `ayac tle quitoz oncan tlatoz` | [ENL BC19](https://enl.wired-humanities.org/bc19/elements/bc19a/000) |
| 1569 Antonio Quauitencatl testament, Docs_México [1157] | `omito ayac tle quitoz yuh niquitohua` | [UNAM GDN](https://gdn.iib.unam.mx/diccionario/ayac/185330) |
| 1585 Melchor de Parada possession, Docs_México [911] | `ayac tle oquito ayac otlachallani` | [UNAM GDN](https://gdn.iib.unam.mx/diccionario/ayac/185330) |
| 1587 Lorenzo Diego / Juana Petronila possession, Docs_México [555] | `ayac otlachallani ayac tle oquito` | [UNAM GDN](https://gdn.iib.unam.mx/diccionario/yocoxca%2B%2B%2B/187163) |
| 1587 Isabel María proclamation, Docs_México [657] | `ayac tle oquito yn ixpan` | [UNAM GDN](https://gdn.iib.unam.mx/diccionario/ayac/185330) |

These edited colonial transcriptions and modern lexicon index excerpts were *located and compared*, not independently collated against facsimiles. Short phrases are quoted for linguistic comparison, never entire source texts; check editorial reuse rights before collecting further passages. The two 1587 forms are **separate dated documentary records** from the same GDN indexed textual collection, not necessarily disjoint independent transmission traditions.

## Existing-engine implementation and exact permitted generalization

1. **`translator-sentence.js`:** A *local* recognition candidate for contiguous **exact** original `ayac tle`, preserving individual original written word surfaces, token offsets, original spelling and the three scholarly/lexical citations. It admits a phrase within a longer, previously unseen passage (bounded 12 candidate windows / 512 words / 7000 chars). It does **not** resolve global clause polarity, any verbal morphology, grammatical subject, object, referent or translation, or automatically accept `ayāc`, `ayâc`, `aiaac`, `tleh`, `tlē`, `tlen`, or another spelling.
2. **`translator-grammar-ir.js`:** Independently verifies the original token sequence, locations, original capitalization, exact cited provenance and every epistemic flag. Records a **`negative-indefinite-pair-candidate`** with two source-backed token edges. It adds **zero** whole-clause candidate analyses or new semantic referent identities.
3. **`translator-english.js`:** Explicitly refuses English for a passage containing the unresolved pair; no one-to-one or complete-clause realization is inferred. The browser shows the actual source grammar links and explains the unresolved interpretation.
4. **`tools/diagnose_historical_sentences.js`:** Reuses existing engines, adding *separate* counts of local grammatical pair observations and corresponding grammar-IR nodes. The original exact lexical route cohort is not recounted as translation accuracy.
5. **`tools/test_negative_indefinite_pair.js`:** Tests the five original indexed contexts through the production sentence/IR/English and historical diagnostic paths, a bounded novel synthetic pair, duplicate phrase windows, preserved capitalization, 20+ near-orthographic/repunctuated negative controls, forged source/scope/person/English fields, and the existing positive `nichōca` English control.

**Quantified claims:** **one source-licensed local grammatical structure** with five historical source-window tests and positive new-input recognition, **not five complete grammatical parses, not five approved translations, not five added lexemes**. No new finite paradigms or morphology rules. The fixed development 1,181-form lexical-route gap remains **926 unmatched**; canonical dictionary **2,144** headwords; approved reviewed Silver **0**, untouched Gold **0**, neural training changes **0**. Before claiming productive *whole-clause* syntax, independently check person, overt `tle` role/valency, future versus completed morphology, scope, and human-reviewed contextual semantics using distinct held-out works. Update the Phase 5 ledger only upon real editorial authorization.

## Coordination

This change is deliberately a **stacked PR based on draft #114**, not a racing edit to its source-exact `ayac` witness pack or to PR #2's canonical lexical claims. It changes the existing sentence/grammar-IR/English JS, public reader and diagnostic, README/roadmap/audit and browser cache hashes. Keep #114's source-exact quotation observations distinct from this source-supported two-token *general* grammatical candidate; notify #95 semantic verifier, #98 Gold-evaluation and #111 historical spelling owner of the difference. No source file, Gold set, dictionary, lexical form, generated morphology, model weight or neural training changes.

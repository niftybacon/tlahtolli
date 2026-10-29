# Classical Nahuatl locative and relational-noun interpretation

**Implementation:** `translator-locative.js`, wired through the optional fifth argument to `TlahtolliSentence.create(dictionary, paradigms, morphology, researchExamples, locative)` and shown in the native Translator tab.

**Status:** a source-graded **nonfinite phrase** interpreter, not a completed free-text Classical Nahuatl translator or a measured accuracy improvement.

## Independent historical and lexical evidence

- Florentine Codex Book 11, folio 62r, contains the short source-spelled fragment **`atl yitic nemjnj`**, in a description of fish. Its [Nahuatl editorial transcription and parallel translation](https://florentinecodex.getty.edu/book/11/folio/62r) are attributed to Anderson and Dibble, 1953–1982. They are already indexed as one unapproved example in `research/translation_corpus/research_examples.json`; no new manuscript image decipherment was performed.
- [Online Nahuatl Dictionary, `itic`](https://nahuatl.wired-humanities.org/content/itic): Molina 1571, II, f. 42v, “inside [something]”; Rebecca Horn's Lockhart notes document the spelling **`ça yitic`** and identify the `y` as the possessor. The [bound relational form `-itic`](https://nahuatl.wired-humanities.org/content/itic-0) is described by Lockhart as “within, inside of”; Carochi and further examples document relational possession.
- [Online Nahuatl Dictionary, `itech`](https://nahuatl.wired-humanities.org/content/itech): Molina 1571 II f. 42r, Karttunen 1992 p. 107; relational third-person `ī-` plus a relational base, with multiple senses (“next to,” “on,” “attached to,” “concerning,” etc.). Our curated dictionary already contains exact historical `itech` from Florentine Codex Book 11, folio 217r. **No automatic `ytech` variant is produced.**
- [Online Nahuatl Dictionary, `nemini`](https://nahuatl.wired-humanities.org/content/nemini): Molina 1571, II f. 67v, “one who lives/dwells in some place”; Karttunen 1992 p. 166 cautions that a historically cited form may also be verbal. Therefore **`nemjnj` must not be interpreted automatically as a finite predicate**.

The user-facing interface references the exact source for each proposed location and distinguishes an **existing consulted editorial fragment** from a **newly composed but unattested grammatical combination**.

## Implemented reusable grammar

`[optional exact in] [unique source-indexed noun] [exact supported relational form] [optional source-indexed nemini-family form]`

Currently the supported relational headwords are `itic` and `ītech`, plus the narrowly source-listed historical forms `yitic` (FC Book 11, fol. 62r) and `itech` (FC Book 11, fol. 217r). The place noun is identified only from the separately curated Classical Nahuatl dictionary. It may be written with its exact headword spelling, listed original spelling, or individually source-located non-stem form.

A final optional agentive form is recognized **only** as `nemini` or explicitly source-listed `nemjnj`; the tool leaves its grammatical function unresolved and **never** generates full-sentence English. The third-person possessor on the relational item is annotated, but its linkage to the preceding noun remains a **proposed co-reference**, not a proven syntactic relationship.

| Input | Output | Evidence limitations |
| --- | --- | --- |
| `atl yitic nemjnj` | Historical locative fragment; optional exact editorial contextual note | Manuscript's published translation has been consulted; NOT clean evaluation gold. `nemjnj` unresolved noun/verb. |
| `ātl itic` | Tentative “within/inside + [water senses]” | Constructed grammar hypothesis, no independent text attestation claimed |
| `calli itic` | Tentative “inside/within + [house/building/dwelling]” | Dictionary-linked, not asserted as an attested written sequence; source also records fused `calitic` elsewhere, but this parser does not generate contractions |
| `cihuātl ītech` | Tentative “on/by/attached to/concerning/from + [woman/wife]” | Competing `ītech` senses are **not resolved** by simple adjacency |
| `atl ytech nemjnj` | No relational candidate | `ytech` is not independently source-listed in the curated inflections and no normalization is invented |

## Integrity and testing

- This engine is invoked **only** when there is no existing completed sentence candidate. It outputs `locativeInterpretations` while `complete` remains false.
- All source form entries are exact, not constructed from macros or modern dialect substitutions; source-grade, original written form, and cited references are displayed.
- A unique noun reading is required; colliding headwords or unknown inflections cause abstention.
- No extra constituents or question scope are accepted. The article `in` is accepted only when written before the noun.
- `tools/test_locative_relations.js` covers the historical example, 8 additional multi-noun compositions, noun collisions, false modern-variety evidence, metadata tampering, unsupported particles, extra words, and old sentence/comparison regressions.
- `tools/test_translator_browser.py` checks the **actual UI** presentation, citations, exact editorial note, alternate senses, and unknown-word refusal.
- No new source-aligned English training pair or held-out reference is admitted, and `translation_accuracy` remains `null`.

**Next:** source-audit more relational bases and independently attested suffixal locatives before broadening grammar. In particular, literal stand-alone `itic` and fused `calitic` need to be distinguished rather than treated as interchangeable.

# Tlahtōlli translator capability map (2026-10-28)

This file is a **source-controlled handoff record** for the next development session. Read code and test results before trusting descriptions from chat memory. None of the claimed testing is a gold-standard Classical Nahuatl adequacy benchmark.

## What exists — authoritative files

| Component | Source | Coverage and role |
| --- | --- | --- |
| Curated word lookup and compositional snippets | `translator-engine.js` | 115 source-checked/AI-assisted Classical-period headwords, recorded inflected forms, spelling variants, literal bracketed glosses, deliberate unknown/sense/length abstention, and 3 *candidate* historical passages |
| Clause/sentence analysis | `translator-sentence.js` | 12 verbs; 72 present + 72 future indexed finite cells, simple optional initial `ahmo`, some `in` + cited noun phrase patterns, third-person subject/object ambiguity, explicit refusals for incomplete clauses |
| Canonical reverse morphology | `tools/morphology_engine.js` | All 720 grammar-generated cells, source-recorded finite/noun forms, bounded transitive object substitution, guarded possessive analogies, stem and absolutive segmentation; candidate provenance and tentative ranks |
| History-sensitive morphology bridge | `translator-historical-morphology.js` | Tentative orthographic substitutions and aggregate codex/Luke occurrence evidence, not verified exact manuscript readings |
| Archive comparison | `amoxcalli-archive.js` | 36,543 unreviewed Siméon/Kaikki records with dialect safeguards, source-listed forms and exact-lemma cross-reference; never silently changes curated glosses |
| Browser orchestration and evidence display | `translator-integrated.js` | Links lexical results, sentence analyses, token-level morphology proposals, historical evidence, linked sources and unreviewed caveats |
| Manuscript study | `manuscript-reading-desk.js`, `parallel-reading-*.js` | Personal, unverified editorial-text study and manual alignment; never model training |
| Independent benchmark gate | `tools/evaluate_translation_readiness.js` | 0 approved held-out pairs, no measurable translation accuracy; existing Florentine examples and 1573 ENL source excluded from clean test results |

## New milestone: sentence analyzer consumes source-grade morphology

Previous issue: `translator-sentence.js` indexed only the **present and future** rows of the 12 paradigms; it ignored the other already-curated source-listed verb tokens independently recognized by the canonical morphology engine.

`TlahtolliSentence.create(dictionary, paradigms, morphologyAnalyzer)` now accepts an **optional bounded analyzer**. Its old two-argument API remains supported.

When an entire clause contains only one written token, the new bridge may display the existing dictionary entry's **exact recorded finite-form gloss** if all of the following are true:

1. The original token matches the source-listed inflection's written form **exactly** (Unicode NFC + case folding only). No new spelling substitution, guessed prefix or generated paradigmatic expansion.
2. The canonical morphological proposal agrees on lemma, precise inflection label, source URL, recorded-form evidence, and at least a lexical/manuscript evidence grade.
3. The source-linked form's label explicitly identifies a person and preterite/present/future, or is the exact named historical first-person completed-writing category. Other forms and unknown grammatical labels are **not licensed**.
4. The source record contains a non-empty English gloss and its own URL. This is displayed as **source-listed finite-form gloss (unverified in context)**, not a newly composed sentence or proof of manuscript occurrence.
5. No added noun, particle, unknown word, sentence-wide negation, punctuation inside the token, or invented English role is appended. Unsupported multiword clauses remain `complete:false`.

Examples from current checked-in lexical inflections: `onicoch` (existing source gloss “I slept”), `ōniccac`, `onitlacac`, `ōniyah`, `niauh`, and `onitlahcuiloh` (source-specific category). The bridge does **not** claim to add tense/mood composition to all 720 cells.

When a clause cannot be analyzed fully, the sentence result may additionally carry `morphologicalClues`: bounded, source-graded **token-level proposals** from the same canonical analyzer. The Translator tab shows these in a disclosure explicitly labeled **NOT a sentence translation**; no verb/argument structures or glosses are fabricated from the partial clues. Source links are retained and speculative proposal grades remain speculative.

**What is NOT solved:** complex morphology across word boundaries, possession within general sentence grammar, arbitrary clausal word order, subordinate/relative clauses, incorporation/derivation, clitic scope, negation of source-listed preterites, manuscript spelling abbreviations, compositional contextual sense disambiguation, and independent measure of translation accuracy.

## Verification and limitations

- `node tools/test_translator_sentence.js` checks all supported original grammar cases, 8 source-listed standalone historical forms, exact-source/label matching, and rejection of unsupported extensions.
- `python tools/test_translator_browser.py` exercises the actual integrated translator and checks that a source-listed historical gloss appears while `onicoch in cihuātl` and `ahmo onicoch` do **not** magically become translated sentences.
- `.github/workflows/translator-regressions.yml` and full-project CI are the actual build authorities. Check latest commit SHA before declaring success.
- The imported archival dictionaries are source-linked background, **not** verified grammar and not neural-model training pairs.

## Next milestone: source-crosschecked morphology enters the actual translator

New `translator-source-morphology.js` is a **generic, fail-closed adapter** for explicitly documented token-level analyses in the existing manuscript source-review records. It is not a productive inflection generator, not a gold benchmark, and not an independent second linguist.

- The 1573 Coyoacán review now records four explicit analyses for three manuscript-spelled units: `ticnamaca` (both **1pl** and **2sg** subject possibilities), `y¯` (nasal abbreviation with proposed `yn/in` expansion, never substituted in original text), and `totlal` (1pl possessed noun with an independent 1563 historical comparison).
- `translator-integrated.js` reads the source record in the same initialization batch as the dictionary and combines its bounded analyses with the canonical Tēntli morphology provider. Both the morphology panel and the sentence engine's **incomplete-clause clues** now show these evidence-linked proposals.
- The source adapter only accepts the exact recorded spelling, recomposes every proposed token from separately cited morpheme parts, requires its claims to have valid external source URLs, and refuses any promotion to training/gold, human-reviewed, or facsimile-collated status. It outputs `grade:'unreviewed'` regardless of editorial prose.
- Neither a new curated headword nor any lexical working gloss is inserted. The existing sentence analyzer cannot declare the 1573 phrase `complete`; it cannot select between 1pl/2sg on the written verb alone; and it cannot automatically substitute `in` for the original `y¯`.
- `tools/test_source_morphology.js` and the headless Chromium Translator regression check exact readings, 1pl/2sg ambiguity, cited 1563 support, preservation of original abbreviation, and strict rejection of invented spellings, modified metadata, and ungrounded English.
- This mechanism can process additional source-review records **once their own explicit cited token analyses are carefully prepared**. It does not generalize new verb or possessive morphology without separate evidence.

**Next priority after this milestone:** implement small, independently grammar-licensed noun-phrase and agreement rules that consume vetted candidate analyses while preserving alternative subject roles and failures for incomplete clauses. That requires positive *and* negative historical examples, not simply copying Lockhart's English interpretation.

## Agreement-constrained noun-phrase composition milestone

The clause analyzer (`translator-sentence.js`) now has a **separate, explicitly incomplete** `agreementProposals` result. It combines the separately sourced, exact-token `translator-source-morphology.js` analysis with one noun phrase, but it deliberately **does not** add a complete English sentence candidate or set `complete:true`. This is a genuinely reusable agreement filter, not a static match for the 1573 excerpt or a new neural model.

The constraints, all enforced before a proposal appears:

- An exact-token **source-crosschecked verb hypothesis** must carry explicit non-third-person singular/plural subject agreement (`1sg`, `2sg`, `1pl`, `2pl`), **3sg object** agreement, original reconstructed morpheme parts and direct external source links. A guessed/generated verb, unindexed inflection, or incompatible 3pl object **cannot** pass.
- Exactly one **source-crosschecked possessed-noun form** OR **unique, curated lexical noun headword** must be fully consumed. Bare unmarked nouns are not silently assigned roles; for a curated noun, an explicit `in` marker is required.
- A noun phrase can be introduced by written `in` or by a **source-crosschecked abbreviation** carrying the *specific proposed* `yn/in` expansion. The original `y¯` remains unchanged, clearly flagged **HYPOTHESIS**. The possessed source-noun form can also occur without an article.
- Every written token must participate in the single verb + one noun phrase construction. There is **no support yet** for extra constituents, non-initial negation, unlisted noun forms, two noun phrases, or punctuation embedded in a token. Matching other word orders is possible only if the NP remains contiguous.
- The nominal may be labeled **possible direct object** (not categorical object) when it is compatible with the verb's explicit 3sg object slot and the subject is independently first/second person. A noun's `1pl` *possessor* is not used to force a `1pl` **verb subject**.
- Every available source-licensed `ti-` reading stays visible, including both `1pl` and `2sg`; candidate order is not a ranking. No contextual English is generated, the original lexical gloss still marks unknowns, and the results are not translation quality scores.

Typical supported **argument-linking proposals**, not gold sentences: `ticnamaca y¯ totlal`, `totlal ticnamaca`, `ticnamaca in cihuātl`. The older sentence parser's independently supported 12-verb present/future grammar remains unchanged. Negative tests include `ahmo ticnamaca y¯ totlal`, `ticnamaca cihuātl`, multiple NPs, a missing noun, and forged morphology with wrong agreement or source provenance.

**Tests:** `node tools/test_source_morphology.js` checks exact-form and person ambiguities, 1-NP agreement, marker and word-order permutations, and explicit failure cases. The Translator Chromium regression checks that both readings and their source links are visible in the **Provisional agreement and noun-phrase links** disclosure, without a complete English sentence.

**Remaining constraint:** using the agreement of an externally supported morphological token is not independent verification of its parsing. New constructions require independent historical positive and negative evidence; no original handwriting was newly deciphered during this milestone.

## Highest-impact next work

1. Extend source-linked grammar **only** from independent Classical-era citation/negative evidence, not templates derived from modern dialects or the published English answer.
2. Improve sentence consumption of vetted morphological analyses **by documented valency and agreement constraints**, one construction at a time, while preserving all alternatives and explicit `complete:false` for unsupported clauses.
3. Collect manuscript-grouped independent human-reviewed historical passages for quality evaluation. Until then, report diagnostic coverage and abstention, **never an accuracy score**.
4. Keep the corpus and translator distinct: a quotation already examined during development is not a blind test.

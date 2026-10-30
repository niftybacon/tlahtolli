# Phase 6 — exact, source-indexed historical lexical forms through the existing research engines

*October 30, 2026. Bounded initial implementation for [Issue #111](https://github.com/niftybacon/tlahtolli/issues/111). **NOT** canonical headword approval, productive morphology or full historical translation.*

## Why this is different from another research list

The source-linked dictionary comparisons for `yehuan` and `tepilhuan` already existed in [the five-lead historical research file](../research/translation_corpus/unresolved_high_frequency_source_leads_2026_10_30.json) and [PR #110's source-fingerprinted 80-dossier artifact](TENTLI_PHASE6_80_SOURCE_DOSSIERS_2026_10_30.md). Previously, these observations were **only data in a research report**. The **existing** `translator-source-morphology.js` source-evidence adapter did not return them for a programmatic query. Its research caller therefore could not connect the exact dictionary reference to the original token being investigated.

This change adds a **second optional class of source leads within that same existing adapter**, not a new grammar parser, duplicate dictionary or second morphological engine. Source-indexed lexical-form proposals are labeled separately from actual morphology, and no claim is automatically entered into `data/lexicon.json`, `data/morphology.json`, `data/evidence.json`, `dictionary.json` or the browser translation interface. The engine retains all existing source-reviewed ENL token analyses and their unresolved readings.

## Two externally located exact forms

| Exact historical written surface | Source dictionary evidence | Research-only classification | What remains unverified |
| --- | --- | --- | --- |
| `yehuan` | [ODN/Lockhart, *Nahuatl as Written* (2001), p. 242](https://nahuatl.wired-humanities.org/content/yehuantin): `yehuan` is a recorded shorter written form of `yehuantin`; [UNAM GDN](https://gdn.iib.unam.mx/diccionario/yehuan/188287) indexes colonial material including a separately written `yeuan` | Exact historical pronoun-form lexicographic *lead* | The referent, person and syntax in an individual Brinton poem, especially `yehuan Dios`. Original `yeuan` is **not** silently normalized to `yehuan` |
| `tepilhuan` | [ODN/Molina (1571), Part II, fol. 103r, col. 1](https://nahuatl.wired-humanities.org/node/188794) records a lexical headword translated as children / offspring | Exact historical noun-form lexicographic *lead* | The social or kinship force of a particular poetic use, possessors, segmentation and English clause meaning |

These are **lexicographic source observations**, not independently facsimile-collated manuscript occurrences or qualified human approval of a contextual translation. The source sites aggregate material of differing provenance, so the attached locator and original written form matter. The newly added file `research/translation_corpus/exact_source_lexical_surface_leads_2026_10_30.json` records the two source URLs, source editions and caveats with **all** approval/translation/morphology flags false.

The source adapter refuses a malformed or promotion-bearing optional pack and returns:
```js
{
  kind: 'Source-indexed exact lexical written form (NOT morphology)',
  grade: 'unreviewed',
  features: { grammarRole: 'unresolved', referent: 'unresolved',
    morphologicalSegmentation: 'not-verified' },
  // original written surface + exactly the external citation(s)
}
```
This is an example of its *status*, not an independently certified parse. The existing sentence engine can include these in **partial source evidence clues**; it is not allowed to create a complete person/number/possessor agreement or English sentence from the external headword citation alone.

## Measured effect on the previously pinned 1,181-form research diagnostic

| Measure | Before | After | Meaning |
| --- | ---: | ---: | --- |
| Exact forms with an adapter-connected external historical *lexical* research lead | **0** | **2** | Actual read-only source adapter can now return the two cited observations by exact written form |
| Original written forms without a linked **canonical lexical/paradigm/morphological grammar** route | **928** | **928** | **No** productive historical grammar gap has been closed |
| English clauses independently verified from these two forms | **0** | **0** | No forced interpretation of `yehuan Dios` or `tepilhuan` |
| New verified canonical dictionary entries / grammar rules / trained pairs / Gold | **0** | **0** | No self-approval, no learning from guessed forms |

In `tools/investigator_engine_bridge.js`, the new *nonexclusive* `source_indexed_exact_lexical_surface_research_leads` counter measures these two forms. It is **excluded** from the sum of the original mutually exclusive engine-recognition routes. Their `analysis_route` stays `no_linked_engine_surface_match` until a separate source-licensed analysis actually supports a productive lexical/morphological/grammatical route. The project must never describe the new counter as reducing the 928.

`tools/diagnose_historical_sentences.js` now passes this optional pack into the **existing** source-morphology adapter. The browser runtime `translator-integrated.js` and curated lexical lookup remain unchanged, because these records are **not** independently approved dictionary claims. The independent Gold evaluation remains at zero.

## Exact spelling, defensive gates and CI

- Only the exact `yehuan` and `tepilhuan` forms are loaded (case/NFC matching only); **`yeuan`**, `yehuān`, `yehuantin`, `tepiltzin`, fictional `tepilhuantzin`, or the poetic verb/vocable `huiya` receive **no new analysis**.
- The optional evidence set must match both bounded form IDs, source URLs, historic locators and explicit never-approved flags. Tampering with a source, lemma, review state, manuscript status, original spelling, or inserting an extra record rejects **both** records, without disabling the already cited ENL morphology.
- The existing source-morphology tests now cover the two indexed entries, defensive copies, 16 adversarial source changes, source-spelled *non-equivalences*, and sentence-level abstention. The existing 1,181-form real-engine bridge test asserts **two separate research leads and the same 928 productive gaps**, not an invented translation gain.
- Run `node tools/test_source_morphology.js`, `node tools/test_investigator_engine_bridge.js`, `node tools/test_unresolved_historical_form_triage.js` (last two use the existing 1,181-form investigator), and the standard translator workflow. A weekly or PR historical audit must preserve source fingerprints, excluded Brinton development passages, and no Gold exposure.

## Next milestone

This change is **partial** progress on Issue #111. Before calling `yehuan` or `tepilhuan` a *curated* headword or using its role to produce English, verify additional original sixteenth-century contexts, preserve historical spelling distinctions and review contextual alternatives. Use the established Phase 5 ledger for authentic editorial decisions and a separate source-licensed canonical lexicon/grammar PR with regression and source-work-disjoint evaluation. A model cannot approve itself. The longer-term goal is a demonstrable reduction in **actual** 928 productive grammar misses and improvement in complete source-covered clauses, not ever larger unverified lexical candidate lists.

The [mandatory roadmap](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md), [agent instructions](../AGENTS.md), [engine-consumption audit](../research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md), and Issue #98 Gold evidence restrictions remain binding.

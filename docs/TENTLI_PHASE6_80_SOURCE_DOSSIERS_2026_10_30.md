# Phase 6 — source-locked investigation dossiers from the 928 historical analysis gaps

*October 30, 2026 · Research prioritization milestone, **not 80 verified words, 80 approved grammar rules, or a new English benchmark.***

## What this changes

The canonical [928-form unresolved triage](../research/translation_corpus/UNRESOLVED_928_HISTORICAL_TRIAGE_2026_10_30.md) already investigates all distinct original written forms and reports existing lexical/grammar engine routes. It separately assembles a **small optional human question queue**. That queue deliberately avoids asking the project director to adjudicate every historical homograph.

This Phase 6 batch now adds **source-grounded machine research dossiers**, built with `tools/build_phase6_historical_dossiers.js` using the **same existing source investigator and actual canonical engine bridge**, not a competing parser. Dossiers document what to inspect and what evidence already exists; **they do not assert new linguistic answers**. An 80-form research packet does not mean that 80 forms have been successfully translated, independently reviewed, or accepted into productive grammar.

The existing Monday `.github/workflows/tentli-full-source-worklist.yml` workflow (not an additional scheduler) now:

1. Enumerates the **1,181** distinct forms from the already allowed source training material; the 17 Brinton development stanzas remain excluded.
2. Reuses the actual lexical, indexed verb, source-morphology, browser-morphology, sentence, English and shared-IR diagnostic bridge to count **928** unlinked written surfaces at the source-pinned baseline.
3. Reuses `buildTriage` to cross-check original source fingerprints, rejected source training/Gold claims, previous poetic investigations and independently located historical dictionary leads.
4. Exports up to **80 high-priority, poem-diversified source research dossiers** into the existing 30-day GitHub Actions artifact, with their exact original short source contexts, document/work and edition URLs, comparison leads, ambiguity classifications and *proposed next investigation*. It does not silently write these into the lexicon, grammar or model weights.
5. Runs negative-control tests on altered original source, unlicensed Gold claims, fake dictionary approval, invented surface, historical dev-work contamination and altered evidence URLs.

This is intentionally **more than the earlier 12 optional director questions** but is **not** 80 new human questions. Most machine research, source comparison and repeated-spelling investigation should be completed before requesting scarce expert attention. Source and dictionary comparisons should be grouped, not assumed to be independent attestations.

## Research selection and categories

The input universe is all 928 actual unlinked original written surfaces. The initial pool favors recorded independent dictionary leads, recurrence across **poem units within the same nineteenth-century printed edition**, original historical-document context, and source-checked headword resemblance. It limits the number initially drawn from any one poem and then fills remaining places by deterministic research priority.

Each dossier preserves:

- The **original written surface** (not a new lemma), prior source identifiers, up to four short original-language examples with printed-edition URLs, number of occurrences and same-edition poem-unit counts.
- Whether a high-frequency form has an *independently located historical dictionary lead*. It carries the locator and the exact caution that **the meaning of its original stanza is not verified**.
- Existing poetic/particle research, morphological string-shape clues and source-lemma spelling comparisons. Similar spellings are **not** attested equivalence; `ni-` or `-tl` by appearance is **not** a grammar rule.
- One bounded **next research action**, not a guessed English target or a manufactured source claim.
- Immutable source-fingerprint linkage back to the older investigator and engine bridge, and explicit zero-valued flags for newly approved dictionary rules, English sentence translations, human Silver/Gold and neural model updates.

The independently located starting leads are **`yehuan`, `tepilhuan`, `noyollo`, `ipalnemohua`, `huiya`**. They are not all the same kind of problem: pronoun referent, possessed/kinship noun meaning, deity title versus related form, and a **verb/vocable homograph** are different categories. In particular, the two earlier `huiya` poetic-context assessments do **not** generalize to all nine Brinton occurrences, and the `yauh` verbal form remains a valid competing reading outside those exact contexts. These five source leads existed **before** this batch; the new capability is durable, diversified, source-linked structured review of a larger set of high-impact forms, not another five invented discoveries.

**No original facsimile was newly collated, no independent translator scored, and no productive grammar was modified.** The written-form "928 gaps" baseline is unchanged until a separate source-licensed engine PR and repeated diagnostics justify changing it. Any increase or decrease in that count must be measured on the same pinned training source material and reported distinctly from full-clause accuracy.

## Run, inspect and reproduce

```sh
python -m neural.paged_historical_investigator --all --output /tmp/tentli-forms.json
node tools/investigator_engine_bridge.js \
  --input /tmp/tentli-forms.json --output /tmp/tentli-bridge.json
node tools/build_phase6_historical_dossiers.js \
  --source /tmp/tentli-forms.json --bridge /tmp/tentli-bridge.json \
  --output /tmp/tentli-80-research-dossiers.json --limit 80
node tools/test_unresolved_historical_form_triage.js
```

The test suite deliberately uses source material already admitted to the research set. The workflow saves the dossier JSON with the other historical investigator outputs; it does **not** add the 17 Brinton development stanzas, previously unseen Gold works, or private feedback to source research. Any printed English alignment remains unreviewed until a **separate** qualified human review and reuse-rights assessment.

## Next substantive development milestone

The **next step is not to count another 80**. For the high-impact forms the dossiers identify, inspect original manuscript/edition contexts and independent dictionaries, preserve competing senses and orthography, and separate exact word-form source identification from productive morphological hypotheses. Only independently warranted constructions should be offered to the **existing** canonical source-claim, morphological, sentence, grammar-IR and English components, with positive and negative tests and before/after engine diagnostics. Link that change through the Phase 5 review ledger **after** source/editorial review; never self-certify an LLM suggestion. The committed review ledger currently contains no human approvals.

The mandatory [six-phase roadmap](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md), [root agent contract](../AGENTS.md), and [engine-consumption audit](../research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md) continue to govern all subsequent agents and revisions. A substantial change to phase status, evidence use, or approved claims requires synchronized README/roadmap updates and explicit notice in the related PR/issue.

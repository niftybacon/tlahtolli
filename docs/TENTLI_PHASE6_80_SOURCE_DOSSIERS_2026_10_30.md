# Phase 6 — source-locked investigation dossiers from 926 current historical analysis gaps

*October 30, 2026 · Research prioritization milestone, **not 80 verified words, 80 approved grammar rules, or a new English benchmark.***

## What this changes

The original [928-form unresolved triage](../research/translation_corpus/UNRESOLVED_928_HISTORICAL_TRIAGE_2026_10_30.md) already investigates all distinct original written forms and reports existing lexical/grammar engine routes. It separately assembles a **small optional human question queue**. That queue deliberately avoids asking the project director to adjudicate every historical homograph.

This Phase 6 batch now adds **source-grounded machine research dossiers**, built with `tools/build_phase6_historical_dossiers.js` using the **same existing source investigator and actual canonical engine bridge**, not a competing parser. Dossiers document what to inspect and what evidence already exists; **they do not assert new linguistic answers**. An 80-form research packet does not mean that 80 forms have been successfully translated, independently reviewed, or accepted into productive grammar.

The existing Monday `.github/workflows/tentli-full-source-worklist.yml` workflow (not an additional scheduler) now:

1. Enumerates the **1,181** distinct forms from the already allowed source training material; the 17 Brinton development stanzas remain excluded.
2. Reuses the actual lexical, indexed verb, source-morphology, browser-morphology, sentence, English and shared-IR diagnostic bridge to measure **926** currently unlinked written surfaces on the same pinned source cohort, after two narrowly recognized exact lexical forms reduced the earlier 928 misses in PR #113.
3. Reuses `buildTriage` to cross-check original source fingerprints, rejected source training/Gold claims, previous poetic investigations and independently located historical dictionary leads.
4. Exports up to **80 high-priority, poem-diversified source research dossiers** into the existing 30-day GitHub Actions artifact, with their exact original short source contexts, document/work and edition URLs, comparison leads, ambiguity classifications and *proposed next investigation*. It does not silently write these into the lexicon, grammar or model weights.
5. Runs negative-control tests on altered original source, unlicensed Gold claims, fake dictionary approval, invented surface, historical dev-work contamination and altered evidence URLs.

This is intentionally **more than the earlier 12 optional director questions** but is **not** 80 new human questions. Most machine research, source comparison and repeated-spelling investigation should be completed before requesting scarce expert attention. Source and dictionary comparisons should be grouped, not assumed to be independent attestations.

## Research selection and categories

The input universe is the **926** currently unlinked original written surfaces (the earlier 928 count predates the exact recognition of `yehuan` and `tepilhuan`). The initial pool favors recorded independent dictionary leads, recurrence across **poem units within the same nineteenth-century printed edition**, original historical-document context, and source-checked headword resemblance. It limits the number initially drawn from any one poem and then fills remaining places by deterministic research priority.

Each dossier preserves:

- The **original written surface** (not a new lemma), prior source identifiers, up to four short original-language examples with printed-edition URLs, number of occurrences and same-edition poem-unit counts.
- Whether a high-frequency form has an *independently located historical dictionary lead*. It carries the locator and the exact caution that **the meaning of its original stanza is not verified**.
- Existing poetic/particle research, morphological string-shape clues and source-lemma spelling comparisons. Similar spellings are **not** attested equivalence; `ni-` or `-tl` by appearance is **not** a grammar rule.
- One bounded **next research action**, not a guessed English target or a manufactured source claim.
- Immutable source-fingerprint linkage back to the older investigator and engine bridge, and explicit zero-valued flags for newly approved dictionary rules, English sentence translations, human Silver/Gold and neural model updates.

The independently located starting leads are **`yehuan`, `tepilhuan`, `noyollo`, `ipalnemohua`, `huiya`**. They are not all the same kind of problem: pronoun referent, possessed/kinship noun meaning, deity title versus related form, and a **verb/vocable homograph** are different categories. In particular, the two earlier `huiya` poetic-context assessments do **not** generalize to all nine Brinton occurrences, and the `yauh` verbal form remains a valid competing reading outside those exact contexts. These five source leads existed **before** this batch; the new capability is durable, diversified, source-linked structured review of a larger set of high-impact forms, not another five invented discoveries.

**No original facsimile was newly collated, no independent translator scored, and no productive grammar was modified.** The source-locked research worklist is now pinned to **926** gaps after PR #113's two exact dictionary matches; this refinement does **not** further change that count. Any additional coverage gain requires a separate source-licensed engine PR and before/after diagnostics. Any increase or decrease in that count must be measured on the same pinned training source material and reported distinctly from full-clause accuracy.

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

## Phase 6 refinement: overlapping failure *signals* and witness-independence audit

The original 80-case dossier generator now emits a **nonexclusive set of investigative
signals for every source-written form**, without changing its deterministic candidate
selection, original triage, 926-miss baseline or underlying engine analyses.
Possible source-indexed lexical ambiguity, poetic-vocable context, spelling
comparison, morpheme-boundary resemblance, other original-document lead and
repeat appearances across units of **the same Brinton edition** may coexist.
A seventh fallback explicitly instructs a researcher to read the original clause
before diagnosing an unknown shape. These categories are **questions to check,
not independently verified grammatical failure labels**.

Each dossier now carries an explicit source-independence accounting: distinct
poem units in a single editorial collection remain **one edition**, and external
historical-document references are *located research leads* until their
independence and exact contexts have been checked. A dictionary entry is not
independent attestation of the intended poetic referent. The source-locked report
also summarizes overlapping signals for **all 926 unmatched written surfaces**
and for the **80 selected dossiers**; category totals are not expected to sum
to 926 or 80, respectively. New adversarial tests reject forged manuscript
source grades and auto-approved similar-spelling claims.

This makes it easier to choose evidence-gathering tasks without conflating
lexical lookup, morphosyntax, original spelling, document provenance and
English translation. **No new dictionary headword, source morphology,
productive clause, reviewed English pair, manuscript collation, neural
training, Silver or Gold approval is claimed.** The 926 development misses
remain 926; human semantic evaluation remains unavailable.

## Phase 6 source-indexed contextual contrast batch: `yehua`, `antepilhuan`, `huel`

A deliberately bounded **three-form original-clause follow-up** now connects
source comparisons to the **same 926-form triage → 80-case research dossier**
path. The new source-fingerprinted input is
[`phase6_contextual_contrast_leads_2026_10_30.json`](../research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json).
It does not add a new grammar engine, rewrite original source strings or
claim complete translations. The dossier builder checks that each proposed
Brinton window belongs to its **existing train-only** source row and rejects
untrusted dictionary URLs, altered witness identifiers, fabricated snippets,
claims of independently verified meaning or false manuscript-image review.

- **`yehua`** — Brinton VI.2 writes it twice in close proximity. Molina
  f.35r / [ODN demonstrative and person-reference](https://nahuatl.wired-humanities.org/content/yehua-0)
  contrasts with Molina f.36r, Olmos and
  [ODN adverb/pronoun discussion](https://nahuatl.wired-humanities.org/content/yehua);
  [GDN's Carochi index](https://gdn.iib.unam.mx/diccionario/yehua/18920)
  separately documents temporal usage. **Neither occurrence has a reviewed
  selected function.** These contrasts do **not** prove `yehua` equals the
  now-canonical, distinctly written `yehuan`, or establish an antecedent.
- **`antepilhuan`** — Brinton V.4 and the separately indexed
  [Cantares Mexicanos fol.32r §595](https://temoa.iib.unam.mx/cantares-cantares-mexicanos/32r)
  contain the original written surface. [Molina f.103r's `tepilhuan` entry](https://nahuatl.wired-humanities.org/node/188794)
  and [Lockhart's social-context notes](https://nahuatl.wired-humanities.org/content/tepiltzin)
  provide lexical alternatives, *not* a documented productive segmentation
  of `antepilhuan`. The Temoa Spanish translation is interpretive evidence
  needing review, not Gold or a universally approved English noun.
- **`huel`** — Brinton VI.2 places it in a larger original clause; the
  [Molina/Karttunen index](https://nahuatl.wired-humanities.org/content/huel-0)
  and [Olmos/Carochi discussion](https://nahuatl.wired-humanities.org/node/172127)
  document scalar and possibility uses. A separate
  [GDN-indexed Cantares fol.13v §205 excerpt](https://gdn.iib.unam.mx/diccionario/ixpa/184708)
  places it beside `ayac`, but does **not** independently resolve negation,
  ability or English scoping. This is not a license to modify the draft
  `ayac tle` grammar in #114/#115.

These are **three research leads with source locators and competing questions**,
not three source-certified complete clauses, new wordforms or new morphological
derivations. Each record retains the original edited excerpt, source family,
distinct witness limitations, negative equivalence controls, and zero approvals.
Original historical folio images remain uncollated; expert semantic alignment,
Silver and Gold remain **0**. The existing Phase 6 test suite now also rejects
altered citation hosts, original windows, review claims, and false evidence
upgrades. **Follow-up requires human/editorial source review and a separate,
regression-tested canonical implementation before claiming historical coverage
improvement.** This batch itself leaves **926 misses and 2,144 headwords**.

## Next substantive development milestone

The **next step is not to count another 80**. For the high-impact forms the dossiers identify, inspect original manuscript/edition contexts and independent dictionaries, preserve competing senses and orthography, and separate exact word-form source identification from productive morphological hypotheses. Only independently warranted constructions should be offered to the **existing** canonical source-claim, morphological, sentence, grammar-IR and English components, with positive and negative tests and before/after engine diagnostics. Link that change through the Phase 5 review ledger **after** source/editorial review; never self-certify an LLM suggestion. The committed review ledger currently contains no human approvals.

The mandatory [six-phase roadmap](TENTLI_CONSOLIDATED_LEARNING_ROADMAP_2026_10_29.md), [root agent contract](../AGENTS.md), and [engine-consumption audit](../research/translation_corpus/ENGINE_EVIDENCE_CONSUMPTION_AUDIT_2026_10_30.md) continue to govern all subsequent agents and revisions. A substantial change to phase status, evidence use, or approved claims requires synchronized README/roadmap updates and explicit notice in the related PR/issue.

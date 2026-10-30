# Investigation of the 928 source-written forms without connected engine analysis
*October 30, 2026 — an extension of the existing weekly full-worklist audit, not a second scheduler or grammar engine.*

## Autonomy: what really happens with no user present

Only [`.github/workflows/tentli-full-source-worklist.yml`](../../.github/workflows/tentli-full-source-worklist.yml) is scheduled: **09:11 UTC on Mondays**, subject to GitHub Actions scheduling delays and repository settings. It is also invoked when relevant source or workflow files change, and on manual request. This is a bounded and auditable batch, not an LLM that decides spontaneously to search other websites.

Until this extension, the weekly worklist did not automatically invoke the existing `tools/investigator_engine_bridge.js`. This change composes the existing operations **within the same job**: original source scan → existing lexical and morphology engines → grammar/English/IR historical-context diagnostics → unresolved-form research triage. The prior bridge workflow remains for **code-change and manual regression only**, with no added recurring schedule.

No unattended write to `dictionary.json`, `data/morphology.json`, `data/clause_grammar.json`, `pairs.csv` or model checkpoints occurs. The generated weekly audit remains a **30-day GitHub Actions artifact**, not permanently accumulated new linguistic memory. If meaningful long-term learning is wanted, a separately approved promotion/review system must be built; simply rerunning a source report does not teach a model.

## Exact research scope

The inherited [PR #105](../../research/translation_corpus/INVESTIGATOR_ENGINE_INTEGRATION_2026_10_30.md) checked 1,181 distinct forms from Brinton's 133 training stanzas and seven already cited original Nahuatl snippets against current source-indexed morphology and lexicon. **928** had no linked existing-engine analysis, but this does *not* mean 928 unrelated missing dictionary headwords.

`tools/triage_unresolved_historical_forms.js` processes all **928** from the **same actual, source-fingerprinted** full-worklist and engine-bridge reports, preserving each form and its Brinton original song-work and record IDs.

It does NOT attempt 928 English meanings. Instead it marks independently reviewable, **non-exclusive research leads**:

- Historical poetic sounds, particles and unresolved one-letter vocables **already studied** by `neural/historical_form_triage.py` and the ten-entry existing Brinton contextual evidence catalog; previously studied material does not become a new human chore or a forced lexical label.
- Same-edition recurring spellings across different Brinton **poem units**, which are **not** independent historical textual collections.
- Written-surface resemblance to the **existing source-checked dictionary headword claims** with exact citation and locator. Conservatively mark the distance-0 **vowel-quantity-insensitive comparison** or distance-1 spelling comparison only; these are *hypotheses to examine*, not historical variants and not license to strip macrons in the translator.
- Common *prefix- or suffix-looking strings* that should be investigated using the **existing** morphology engine and source texts. Mere initial `ni-` or terminal `-tl` is not evidence of an inflection, case, lexeme, grammatical class or noun-stem segmentation.
- Cases with no meaningful morphology or lexical leads, where the first research action is an **original-source contextual reading**, not a speculative new paradigm.

It ranks by actual source occurrences, diversity of poetry units in the same edition, and source-linked investigation leads. It creates a **bounded, diversified, optional review queue (up to 12)** and does **not re-ask the project director to verify `zanio`**, already recorded separately; nor does it re-ask for previously graded `ohuaya`, `zan`, `ye`, etc. Every item remains an unverified candidate; the human should focus on difficult, consequential contextual interpretations.

All 17 Brinton dev stanzas remain outside this targeted train-word investigation. Both original historical and related modern editorial works already consulted remain excluded from independent Gold, as in the existing corpus source-exposure gate. No bilingual training data, approved Silver, Gold, grammatical rule or English reference translation is created.

## Run without duplicating engines or jobs

```sh
python -m neural.paged_historical_investigator --all \
  --output /tmp/current-forms.json
node tools/investigator_engine_bridge.js \
  --input /tmp/current-forms.json --output /tmp/current-engine-analysis.json
node tools/triage_unresolved_historical_forms.js \
  --source /tmp/current-forms.json --bridge /tmp/current-engine-analysis.json \
  --output /tmp/unresolved-triage.json
node tools/test_unresolved_historical_form_triage.js
```

The triage rejects an altered source fingerprint, invented word not in the original training set, falsely approved morphology/Silver/Gold, apparently unresolved form with actual engine analysis or archived source claim, untraceable historical passage URL, and previously investigated spelling promoted to a new lexical truth.

This is a **Phase 2/3/6** workflow from the original roadmap: better historical evidence, a source-graded language teacher and more original document analysis. It contributes precise error-localization data to Phase 4/5 without claiming that neural model training, validated interactive self-learning, or independent Gold accuracy has already been achieved.

The next task after this audit is to compare the highest-value source-cited morphological alternatives in their original stanzas, paying special attention to syllabic poetry, inflection, noun incorporation, historical `-cān` functions, and editorial punctuation. Only a small group of genuinely ambiguous cases needs project-director input; linguistic confidence cannot come from an unreviewed model proposal.

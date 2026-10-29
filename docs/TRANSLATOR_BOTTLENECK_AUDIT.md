# Translator bottleneck audit — 2026-10-29

Audited against main `898fb934b27bc89755e9d1b00383dfccf9ab7db4`, including the other contributor's #62 complete token inventory and #63 curated function words. This change reuses those diagnostics; it does not add a parallel parser or training set.

## Findings and repairs

1. **Deployment visibility and caching.** A fresh live tab correctly produced the location draft added by #44. Direct HTTP inspection of `translator-sentence.js` returned `Cache-Control: max-age=600`. The page requested unversioned static and dynamically inserted scripts. This permits stale or mixed cached assets and is consistent with the earlier session, but the exact cause of that old session cannot be proved retrospectively. Script URLs now carry deterministic content hashes, including the two dynamic modules. The Translator status exposes a code/data runtime ID. CI rejects stale generated URLs. An already open page still requires a reload; cached HTML can still be old. Query URLs on GitHub Pages are cache keys, **not immutable release artifacts** or an atomic deployment guarantee. The dictionary edition is a separate data version.

2. **Sentence-boundary integration.** `nichōca auh nitlacua` produced English, while adding a period disabled the coordination analyzer. Mixed paragraphs similarly lost internal clause relationships. A sentence-group layer now applies existing clause analyzers within written period/exclamation/newline boundaries, flattens the English choices without dropping clauses, and preserves local connector edges in the grammar graph. Semicolons remain available to the existing conditional parser. Up to 24 clauses can be composed, replacing the arbitrary three-clause coordination limit. Unknown units, questions, unsupported conditionals and invalid attachments still cannot become complete drafts.

3. **Repeated computation.** On the constructed input `unknown mystery unknown mystery unknown mystery`, main called the morphology provider **268 times**; this change calls it **2 times**. This is a provider-call measurement, not a speed or translation-quality score. Overlapping grammar windows now reuse exact-spelling results within a single request, bounded to 2,048 entries. No result is reused across requests, spellings, or models. The existing 7,000-character input bound remains.

4. **Diagnostic drift.** The batch diagnostic omitted the source-linked morphology provider and relational-location analyzer used by the site, and inspected nonexistent `sourceAgreementProposals` and `possessedArgumentProposals` fields. It now wires the live grammar providers, measures the English composer after the same grammar-graph audit, and reads actual structural fields. Isolated fixtures verify these paths. Bilingual sentence lookup remains excluded; paired Spanish is never parser input. Mechanical `complete` grammar coverage and available draft English are reported separately.

## Reproduced historical development result

The existing pinned Axolotl source has Git blob SHA `90b7327fc4023ba529e1982f823ddeaee6e313e3`. Reused the exact 36 row IDs from #62, across 17 work titles. Source records may be fragments, dates or names rather than complete linguistic sentences. Run:

```text
node tools/diagnose_axolotl_development.js /path/to/pinned/axolotl.csv --limit 36 --audit-36
```

| Measure | Result after #63 and this repair |
| --- | ---: |
| Lexical token occurrences | 365 |
| Curated matches | 102 |
| Unknown occurrences | 263 |
| Unknown with exact Classical archive evidence | 36 |
| Unknown with only historical OCR archive evidence | 34 |
| Unknown without direct archive evidence | 193 |
| Tentative historical-spelling archive candidates (overlapping category) | 5 |
| Unknown with morphology proposals | 1 |
| Full grammar candidate records | 0 |
| Audited draft English records | 0 |
| Records with supported partial windows | 0 |

The previous 90/365 became 102/365 because of **#63's three source-backed words**, not this PR. These fixes do not improve full-sentence coverage on this cohort. There is no independently reviewed held-out accuracy measurement, no model training, and no expert validation claimed here.

## Highest-impact next work

The archive's 36,543 records are evidence lookup material, not the parser's productive vocabulary. The curated dictionary now has 118 headwords; finite English still largely relies on 12 indexed present/future verb paradigms. More renderer rules cannot supply the missing historical morphology.

The next engineering milestone should connect **source-backed analyses of historical inflected predicates to the existing clause roles and English renderer**. Start with actual failed finite forms in this development inventory, not invented phrase templates. Establish their lemma, stem, person/object marking, tense/aspect and source location before admitting analyses. Preterite, directional and honorific forms are candidate work areas requiring historical source review, not analyses already established by this audit. Preserve competing analyses and original spellings; do not treat dropped vowel length, `y/i` substitution, OCR, proper names or Spanish words as automatically resolved. Broaden the same morphology-to-clause interface instead of adding one whole-phrase rule per example.

Then test the integration on different source works kept out of development, with reviewed alignments and lexical/grammatical judgments. Track lemma recovery, feature/role agreement, source-span coverage, and English adequacy separately. The present 36 records are development material and cannot become an independent accuracy test by renaming them.

## Historical limits and provenance

The longer constructed tests are software regression controls, not attested manuscript readings. Punctuation is supplied by the input and is not verified historical segmentation. No new Nahuatl grammatical construction is asserted. Existing *auh* alternatives remain unranked: the [Online Nahuatl Dictionary entry](https://nahuatl.wired-humanities.org/content/auh) cites Molina and Carochi/Lockhart for conjunction/discourse use. The [*intla* entry](https://nahuatl.wired-humanities.org/content/intla) supports its conditional classification, but neither establishes English conditional force for arbitrary input. This change keeps conditional English unavailable. Third-person identity, relation attachment, lexical sense and discourse force remain unresolved choices.

## Maintaining deployment keys

After editing JavaScript or translator data, run:

```text
python tools/build_runtime_assets.py --write
python tools/build_runtime_assets.py --check
```

Commit the resulting `index.html` changes alongside the source. Hashes use UTF-8 text with LF newlines for cross-platform reproducibility. Other generated embeds still use their existing builders. Browser tests exercise the versioned dynamic URLs, longer mixed paragraphs, connector choices, unsupported-unit refusal and failed optional-module loading.

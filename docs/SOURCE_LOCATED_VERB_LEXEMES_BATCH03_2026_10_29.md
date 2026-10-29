# Amoxtli lexical expansion 03 — ten Classical verb lexemes (2026-10-29)

## Scope and methodological boundary

This change adds **10 new source-located lexical headwords and 10 explicit present/preterite stem pairs** to the three established authoritative files `data/{lexicon,morphology,evidence}.json`. It does **not** add another morphology system, fabricate full inflection tables, or copy unknown words from the 36,543-record Kaikki archive. The 12 existing full 10×6 matrices (720 grammar-derived cells) remain unchanged. The version is `2026-10-29.2.0`, with 128 headwords (31 verb headwords).

The corpus authority is the [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/) (University of Oregon / Stephanie Wood, ed.), which transcribes or indexes **Molina (1571)** and gives analytical **Karttunen (1992)** and **Lockhart (2001)** citations. This is *source location and secondary-edition checking*, **not independent collation of an original 1571 folio**. Macrons and the ō- augment in normalized pedagogical forms are *editorial*, not necessarily in original spellings. A dictionary-listed 1sg preterite is **lexical evidence**, not an independently verified contextual manuscript occurrence.

| Curated lexical headword | Source-identified stem pair | Source-listed 1sg preterite | ODN link / located source |
|---|---|---|---|
| tēmi | tēn- / tēmi- | ōnitēn | [ODN](https://nahuatl.wired-humanities.org/content/temi), Lockhart p.233, Molina II f.98r |
| huetzi | huetz- / huetzi- | ōnihuetz | [ODN](https://nahuatl.wired-humanities.org/content/huetzi), Lockhart p.218, Molina II f.156v |
| tlācati | tlācat- / tlācati- | ōnitlācat | [ODN](https://nahuatl.wired-humanities.org/content/tlacati), Lockhart p.235, Molina II f.115v |
| nāhuati | nāhuat- / nāhuati- | ōnināhuat | [ODN](https://nahuatl.wired-humanities.org/content/nahuati), Lockhart p.226, Molina II f.63v |
| tlatzihui | tlatziuh- / tlatzihui- | ōnitlatziuh | [ODN](https://nahuatl.wired-humanities.org/node/176525), Lockhart p.239, Molina II f.143r |
| patlāni | patlān- / patlāni- | ōnipatlān | [ODN](https://nahuatl.wired-humanities.org/content/patlani), Lockhart p.229, Molina II f.80r |
| tlanahui | tlanauh- / tlanahui- | ōnitlanauh | [ODN](https://nahuatl.wired-humanities.org/content/tlanahui), Lockhart p.237, Molina II f.127v; note differing dialect vowel quantities |
| tequi | tec- / tequi- | onitlatec; ōnictec | [ODN](https://nahuatl.wired-humanities.org/content/tequi), Molina II f.105r; Karttunen p.232; Lockhart p.234; object prefix depends on argument type |
| tlachia | tlachix- / tlachia- | onitlachix | [ODN](https://nahuatl.wired-humanities.org/content/tlachia), Molina II f.117r; 1sg/base division is editorial, not separately source-witnessed |
| tītlani | tītlan- / tītlani- | ōnictītlan | [ODN](https://nahuatl.wired-humanities.org/content/titlani), Karttunen p.241; Lockhart p.235; transitive specific-object context |

The `stem` field and its located claim document the **lexeme-specific bases**. The surface analyzer may apply only its pre-existing, restricted `ni-/ti-`, preterite, indefinite-object and future rules to these bases. Its generated whole forms remain explicitly `grade: hypothesis` and do **not** become `grade: manuscript`, approved lexicon forms, sentence translations, or scored development-corpus lexical matches. The 1833 Luke and modern-variety archive material are NOT treated as Classical evidence.

## Reproducibility and source protection

The existing normalized three-file source architecture is preserved. The derived `dictionary.json`, `claim_audit.csv`, and embedded offline seed in `index.html` are regenerated; the common release version and headword count are updated. **No new full paradigms** are appended.

```bash
python tools/build_dictionary.py --check
python tools/build_morphology_engine.py --check
node tools/test_curated_verb_expansion03.js
node tools/test_source_stem_class_morphology.js
node tools/test_source_stem_plural_morphology.js
node tools/test_axolotl_development.js
```

The dedicated new tests require all ten independent source-located headword/POS/stem claims and the expected exact dictionary 1sg preterite, assert newly composed form candidates are **not** prelisted in source inflections, test several wrong-macron and unauthorized-object counterexamples, remove source claims or preterite exemplars to verify fail-closed behavior, and confirm no hypothesized form upgrades to complete sentence grammar/English.

### Evaluation rules

Compare curated lexical coverage, *documentary* form lookup coverage, canonical productive morphological candidates and fully warranted sentence interpretation **separately**. Do not score an archive OCR hit or generated hypothetical inflection as a verified translation. The existing pinned Axolotl 36-row development set was neither consulted for choosing these ten entries nor used to construct their rules. A changed score should be reported as an incidental observation only, not held-out accuracy. Independent manuscripts still need their own verification.

### Next iteration

Before growing toward hundreds of entries, independently inspect primary historical folios and add held-out contrastive examples, resolve dialectal vowel quantity and imperfect/stem class differences, and audit false positives. The 36,543-record archive is a candidate discovery layer, **not** a source of automatically verified lexical truth.

# Source-cited `zan` / `çan` bilingual English and contextual safeguards (2026-10-31)

**Status:** Two historically attested English function families are already known; this change makes them available through the **existing public translator**. It is **not** a new automatic Classical Nahuatl grammar rule or an independently adjudicated historical sentence translation.

## Why this word

The existing Brinton research-only bilingual candidate corpus (150 numbered stanzas, 133 train and 17 development) contains **70 case-folded exact `zan` tokens in 53 distinct stanzas**, versus 13 exact `yehua`. These counts are from this edited poetic corpus, not an unbiased global Classical Nahuatl frequency survey. The source-locked record is [`phase6_zan_english_context_2026_10_31.json`](../research/translation_corpus/phase6_zan_english_context_2026_10_31.json).

## Historical English is available

- [**ODN `zan`**](https://nahuatl.wired-humanities.org/content/zan), citing **Molina (1571 II f.14r)**: `zan. solamente. (aduerbio.)` supports **“only / just / merely”**; *separately*, `çan. mas, o empero, coniunction aduersatiua.` supports **“but / however.”** The recorded `çan` is a specifically cited historical variant, NOT permission for general orthographic cedilla rewriting.
- The same ODN entry cites **Olmos, *Arte*, ed. Siméon, p.181**, distinguishing restrictive, pronoun-like, affirmative and ornamental uses; it also cites **Carochi 1645 and Lockhart 2001 pp. 213, 499** for restrictive and adversative functions. There is no proof that an ornamental `zan` must carry either English function overtly in every song.
- [**ODN `zan ye`**](https://nahuatl.wired-humanities.org/content/zan-ye): **Molina 1571 II f.14r c.2** records an adversative expression `zanye` / `çan ye` as “but/however/yet.” It is a **documented phrase alternative**, not a default translation for all adjacent `zan ye` tokens.
- [**ODN `zan ye no`**](https://nahuatl.wired-humanities.org/content/zan-ye-no), based on **Carochi/Lockhart**, records the longer `çan ye nō` cluster as **“likewise / the same.”** The translator tests this longer expression before `zan ye` so it cannot mislabel the whole as merely adversative. Plain written `no` carries no inference about original vowel quantity.
- The ODN `zan` entry's **`amo tlatla, zan quintocaya`** gives an explanatory contrast for **“not ... but ...”** from Haskett/Wood/Lockhart discussions. This is valid grammatical **comparison evidence**, not a Brinton stanza or new certified Gold.

## Why an automatic `zan ye = but` rule is wrong

Actual published editorial contrasts within [Brinton's 1890 poetry](https://www.gutenberg.org/files/12219/12219-h/12219-h.htm):

- **Song XI stanza 8**, original `zan tontemiqui`, Brinton's published English includes **“we only dream.”** This supports a source-specific *restrictive editorial comparison*, not a new verified complete original clause.
- **Song X stanza 1**, original `zan ye in cuicatlin`, Brinton's published English includes **“the only songs.”** An automatic longest-neighbor **`zan ye = however`** would conflict with his editorial interpretation. Our translator shows *both* its published `zan ye` dictionary phrase **and** Brinton's separate restrictive editorial comparison, with source links; neither automatically wins in the clause composer.
- The previous director-reviewed **`zanio` / `zaniyo`** is *not* segmented or overwritten to `zan`; neither are `zancuel`, `zanye`, `zān`, `za`, `çan-ye` or unlicensed cedilla/length variants.

## Production engine contract

`translator-engine.js` reads the new optional source-locked JSON **as a fourth argument** to the same `TlahtolliTranslator.create` already used for the `yehua` evidence (third argument). It validates cited Molina/Olmos English functions and URLs, dedicated `zan ye` and `zan ye no` entries, exact original Brinton readings, explicit nonpromotion and anti-overgeneralization guards. It annotates every original exact written `zan` or `çan` token with both unranked English alternatives. An adjacent phrase is a **separate** dictionary phrase comparison, not a new scope/antecedent assignment. A matching originally printed Brinton word window displays the edition's English as a **separate editorial comparison**. This also updates the native `translator-integrated.js` source panel and interlinear lexical gloss.

**Preserved:** Original token count, existing canonical dictionary and lexical-recognition stats, vowel length and `ç` distinctions, existing source-backed English for `yehua`, existing sentence parser and shared grammar IR, no forced lexical deletion and no unsupported whole-clause English. The study's **926 original historical unmatched written surfaces out of 1,181** remains a separate pinned count; no independently approved Silver, Gold, or trainable bilingual cases are created. The new English options are source-indexed **lexical**, not certified contextual accuracy.

**Validation:** [`tools/test_phase6_zan_english_options.js`](../tools/test_phase6_zan_english_options.js) runs actual lexical analysis of original clauses, independent `yehua` path and proof-corruption negatives; [`tools/test_phase6_zan_english_browser.py`](../tools/test_phase6_zan_english_browser.py) runs headless Chromium on the real public translator. Both are part of the existing `check-dictionary.yml` workflow.

**Future substantive question for the director:** When `zan` participates in poetic `zan ye` expressions outside X.1, consider the whole stanza and editorial English. The visible evidence is strong enough to show known English without requiring a new translation from the director. If a disputed stanza seems to require a distinct grammatical classification, request only that *specific* judgment; never ask for a universal `zan` gloss.

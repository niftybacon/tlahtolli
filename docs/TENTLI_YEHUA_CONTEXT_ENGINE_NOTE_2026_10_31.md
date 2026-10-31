# `yehua`: safe historical translation / engine note (2026-10-31)

**Status:** Published lexical meanings and editorial verse translations **available**; the exact function of `yehua` in the cited songs is **not fully resolved**. This is **source-bounded review guidance**, **not a new grammar production rule or independently authenticated English translation**. Linked to the existing [Phase 6 three-form source pack](../research/translation_corpus/phase6_contextual_contrast_leads_2026_10_30.json) in `editorial_yehua_engine_note`. The existing 926-form investigator/dossier pipeline reads that field as protected research metadata. The canonical dictionary, morphology, sentence, grammar IR, English realizer, and neural trainer do **not** adopt a new `yehua` rule in this change.

## Evidence we already possess — no compulsory new translation project

1. **Molina 1571 II f.35r c.1:** [ODN `yehua`](https://nahuatl.wired-humanities.org/content/yehua-0), `aquel, aquella, aquello` — demonstrative / third-person referring sense.
2. **Molina 1571 II f.36r c.1:** [ODN `yehua`](https://nahuatl.wired-humanities.org/content/yehua), `denantes, o ahora poco ha` — temporal sense. The same entry cites **Olmos, *Arte*, ed. Siméon, p.183**, explicitly distinguishing temporal-adverb use from a syncopated third-person pronoun (`aquel`). **This is documented polyfunctionality**, not an editor's invented new gloss.
3. **Brinton 1890**, [*Ancient Nahuatl Poetry*, Song VI stanza 2](https://www.gutenberg.org/files/12219/12219-h/12219-h.htm): `noyollo, yehua cuix ic nepohualoyan`, one of **two** `yehua` tokens in that stanza. Brinton's translation incorporates a subordinate-clause English **“that”** after “my heart.” That is evidence for *Brinton's rendering*, **not proof** that `yehua` is a general Nahuatl complementizer. The comma is **editorial punctuation**, not verified original syntax. The two tokens need not have identical local functions.
4. **Brinton 1890, Song XI stanza 4**, [same published edition](https://www.gutenberg.org/files/12219/12219-h/12219-h.htm): `In can on nemian noyollo yehua?`. The [UNAM GDN `nochan` page](https://gdn.iib.unam.mx/diccionario/nochan) indexes the related **Cantares Mexicanos** folio 5v line and a Spanish editorial question about the heart's dwelling. Both published interpretations render the verse naturally **without forcing an independent English word for `yehua`**. The Nahuatl word is nonetheless present: English smoothing is not permission to delete it from the parse.
5. **Brinton 1890, Song XVII stanzas 13–14**, [same published edition](https://www.gutenberg.org/files/12219/12219-h/12219-h.htm): recurring `quen conchihuaz noyollo yehua onentacico`. Brinton's published English conveys grief and departure; it is an **editorial whole-line interpretation**, not word-level certification of a temporal or pronominal role. The recurring `noyollo yehua` sequence can motivate a *resumptive/emphatic hypothesis*, not a productive grammar rule.
6. `miztemoa noyollo` is **not evidence** for the grammatical value of `yehua` in any of these passages. Related emotional themes do not establish the same syntactic behavior.

All three Brinton song references belong to the **same edited 1890 collection**. Repeated printed poems are **not automatically independent manuscript witnesses**. Brinton himself cautions that his translations are imperfect; retain his scholarly renderings **as recorded editorial evidence**, neither discard them nor treat them as a blind independent reference corpus.

## Engine behavior contract (strict)

| Evidence state | What is allowed | What is prohibited |
| --- | --- | --- |
| Dictionary lookup | List both demonstrative/pronominal and temporal families with separate cited authorities | Hard-code `yehua = that`, `yehua = then`, or `yehua = third-person he` for every passage |
| Source-specific historical research | Record exact `yehua` token, original context, Brinton or Temoa editorial rendering, and competing referent/temporal/discourse hypotheses | Assign a referent or clause attachment from the comma, nearby `noyollo`, or the published English alone |
| Complete original passage | Preserve **every** `yehua` source token; when syntax/roles are unlicensed, retain alternative readings and **abstain** from automatic full-clause English | Drop repeated `yehua` as “filler,” force temporal interpretation, invent a new complementizer, or output unsupported definitive prose |
| Orthography and lexicon | Keep exact `yehua` distinct while separately comparing indexed spellings as research | Merge `yehua` with canonical `yehuan`, `yehuatl`, or unrelated `yegua` by unlicensed normalization |
| Evidence governance | Preserve cited edition/folio references and editorial translations in research records | Treat them as independent Gold, approved Silver, verified English word alignment, automatically accepted grammar or training data |

### Practical engineering acceptance

**Now:** the existing Phase 6 dossier attaches the precise note to `yehua`. The source-pack validator refuses false source hosts, missing alternatives, invented verified roles, newly approved grammar, forced default glosses, loss of original words, and claims that repeated poems are independently certified. Tests cover deliberate forgeries.

**Later, only if the existing sources warrant it:** add a narrowly scoped, provenance-labeled alternative to the **existing** morphology/sentence/IR system, with an exact original positive context and negative controls. Require explicit agreement on role attachment and preserve source-token coverage; if a whole clause is still unresolved, the English engine must abstain. Never create a shortcut matching `noyollo yehua` to a fixed English phrase.

**Do not reopen this search repeatedly.** The project director has already reviewed the highest-utility dictionaries and Brinton/Temoa contexts; uncertainty is an acceptable final research state until a *genuinely new* primary source or grammatical distinction changes the evidence. Modern Nahuatl usage or community suggestions may be useful external comparisons, but they are **not a prerequisite for Classical Nahuatl sense promotion**.

**Quantitative effect of this documentation-only change:** **0** newly verified complete historical translations, **0** new productive `yehua` rules, **0** Gold/Silver promotions, **no** change to **926** unmatched forms.

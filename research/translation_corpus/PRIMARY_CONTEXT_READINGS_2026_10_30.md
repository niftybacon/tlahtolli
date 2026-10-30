# Source-located early Nahuatl contexts — can, ayac and cuīcatl
*October 30, 2026. Controlled primary-edition reading, not independent facsimile scholarship or Gold.*

## What was actually located

Two authentic historical-source **works** are linked by the exact digital edition URL and concise original Nahuatl excerpts, without mirroring modern rights-restricted editorial translations.

| Form / role | Historical source context | What this shows | What it cannot show |
| --- | --- | --- | --- |
| Numbered locative **-cān** | [Early Nahuatl Library, 1621 Coyoacán land donation, BC19](https://enl.wired-humanities.org/BC19): `yniquexcan mani tlalli calpilco` | The edited 1621 source reads `yniquexcan`; the linked editor's English describes a third parcel at Calpilco. The numeral/ordinal construction supports a locative/numbered-place analysis. | This is **not** evidence that every ending `-can` is a locative or that it always means an English place. |
| **ayac** | [Same ENL BC19 document](https://enl.wired-humanities.org/BC19): `ayac tle quitoz oncan tlatoz` | Independent word `ayac` occurs in the context of nobody speaking or challenging the donation. [Molina 1571 II fol. 3r, via the Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/ayac), documents negative-indefinite senses; `aiaac` is a separately indexed historical spelling. | No universal translation of the complete clause; `aiaac` was **not** the spelling in this particular 1621 segment. |
| **cuīcatl**, written **cujcatl** | [Digital Florentine Codex, Book 10 folio 118v](https://florentinecodex.getty.edu/book/10/folio/118v): `qujioltevujaia in cujcatl` | The Digital Florentine Codex's scholarly edition, available through a rendered web viewer, supplies a sixteenth-century text context where this documented spelling appears in a passage about Tolteca songs. [Molina 1571 II fol. 26v](https://nahuatl.wired-humanities.org/content/cuicatl) supports *song/singing/music*, paired with the related verb `cuīca`. | The **CI live static-HTML reader cannot see Getty's dynamically loaded Nahuatl transcription**. That particular excerpt therefore remains *source-linked, externally located, but **not automatically re-collated by our pipeline***; no independent manuscript-image paleography was performed. |

The **first two** short expressions were live-checked word-for-word against the ENL document via ordinary HTTP retrieval. They are separate **passages in one source work**, not two independent manuscripts. For the Getty page, an ordinary HTTP fetch returns the shell of the web application; only rendered scholarly page access presently exposes the relevant editorial transcription. CI refuses to count an absent excerpt as a passed text collation.

## Crucial functional distinctions

Historical grammar and lexical reference entries explicitly distinguish different grammatical functions in what may look like the same Roman letters:

1. **`can`** — independent interrogative/locative *where?*, attested in [Molina 1571 II fol. 12r (ODN)](https://nahuatl.wired-humanities.org/content/can-0).
2. **`-cān`** — a **bound locative/number-of-places suffix**, documented with examples including *yniquexcan*. [ODN historical reference](https://nahuatl.wired-humanities.org/node/175908) cites Lockhart, *Nahuatl as Written* (2001), p. 213, and Carochi (1645; Lockhart edition 2001), p. 499.
3. **`-cān`** — a **different plural optative verbal ending**, see [ODN verbal entry](https://nahuatl.wired-humanities.org/content/can) citing Carochi/Lockhart and historical `macamo motequipachocan`. Do not infer a locative reading solely from the written suffix.
4. **`-yocan`** — an **abundance/locative derivation** (e.g. a place characterized by an abundance of something). [ODN](https://nahuatl.wired-humanities.org/content/yocan) cites Gordon Whittaker, *Deciphering Nahuatl Hieroglyphs* (2021), p. 100. This batch has **no individually collated historical `-yocan` token**.
5. **`cuīcatl`** — an attested noun (song, music, singing), with derivative/related `cuīca` (to sing) as indexed by [Molina 1571](https://nahuatl.wired-humanities.org/content/cuicatl). The sixteenth-century edited historical spelling **`cujcatl`** is a **specific witness**, not permission to globally replace `j` with `i` in all texts.

These referenced grammar/sense entries are historically source-located, but the *book pages themselves* have not all been newly inspected against original printed facsimiles in this experiment; such claims remain graded as indexed references, not separate completed primary-text collations.

## Autonomous controls and provenance

Run the live edited-source check:

```sh
python -m neural.primary_source_context --live-check --output /tmp/primary-ctx.json
python -m neural.autonomous_evidence_investigator --limit 40 --output /tmp/40-source-investigations.json
python -m unittest discover -s tools -p 'test_primary_source_context.py' -v
```

The context checker permits only predeclared ENL and Getty HTTPS domains, fetches **no more than six megabytes** per page, retains only word-presence results rather than full scholarly text, and refuses tampered forms, dates, roles, conflicting URLs or false human review. It requires the two exact source phrases from the 1621 digital edition and reports the absent Getty static transcription **explicitly** as unverified.

The existing 40-case investigator now attaches these precisely located source-context references to the corresponding **`can`, `ayac`, `cuicatl`** written forms. This adds source-specific investigative evidence to its automated dictionary searches, not three automatically approved English translations. Its ordinary weekly batch can recheck the context definitions and separately re-check actual source HTML live, without unbounded web search.

**Gold contamination prevention:** because both historic works have been consulted during development, the independent Gold validator now excludes **all of the Florentine Codex collection** and the **1621 BC19 document/collection** from use as a supposedly untouched human Gold benchmark. This includes the excerpt words, plus independently already used Brinton and Bronze texts.

[GitHub Actions verified run](https://github.com/niftybacon/tlahtolli/actions/workflows/tentli-controlled-primary-context.yml) runs unit tests and the genuine edited-source checks. No manuscript image was deciphered, independent human-approved Silver or Gold was obtained, or neural model/production dictionary changed.

### Next improvements

Add a legitimate rendered-browser/source-provided transcription feed for Getty, with rights restrictions and exact folio-level pointers; verify the optative `-cān` in its own historical verb context rather than mixing suffix functions; and investigate the remaining 37 high-frequency forms. Only after source-context and bilingual meaning are independently validated should selected examples enter reviewed Silver; reserve an entirely untouched historical collection for Gold.

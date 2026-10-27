# Existing-vocabulary source review and morphology — initial follow-up

## Scope and research standard

The scope is **only the 88 already published headwords**. Each has been included
in `research/phase4_existing_88_claim_queue.csv`, along with the remaining
specific evidence questions and their priority. The prior audit is an archival
snapshot (222 initially questioned records, of which 206 were still open); it
is **not** rewritten to pretend that all historical questions are settled.

The current 674 field-claim ledger has three narrower promotions from
`inference` to `dictionary`, based on locatable lexical segmentation and
colonial compounds. **Only these three fields change.** There remain 203
inferences/unverified records (108 + 95). The 88 lemmas, forms, and 12 verb
paradigms stay numerically unchanged.

## Three explicitly located combining bases

| Existing lemma | Newly located lexical base | Source and locators | Limitation |
| --- | --- | --- | --- |
| `calli` | `cal-` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/calli), Karttunen (1992) p. 22 `CAL-LI`; sixteenth-century `ichalchiuhcal`, `iteucujtlacal`, *Florentine Codex* Book 11 (Anderson/Dibble ed. 1978), p. 13 | Evidence for a combining base, not a complete independently free-standing token or every possessed construction |
| `tlālli` | `tlāl-` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/tlalli), Karttunen (1992) p. 275 `TLĀL-LI`, and land compounds `calpollali`, `chiauhtlalli`, `teuhtlalli`, *Florentine Codex* Book 3 (Anderson/Dibble ed. 1978) p. 8 | Colonial spelling does not independently fix all long-vowel distinctions; not proof of animacy or number |
| `tēpetl` | `tēpe-` | [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/content/tepetl), Karttunen (1992) p. 230 `TEPĒ-TL`, possessed base `-TEPĒUH`; Lockhart (2001), p. 234 | A lexicographic morphological base, not a license to create unverified full-word plural or possessive tokens |

Source-location work is AI-assisted. Published transcriptions cited by the
dictionary were checked, **not** independently re-collated against original
manuscript folio images. Orthography, sense, date, and manuscript witness must
remain independently auditable. No expert peer review is implied.

## Research reviewed but deliberately NOT promoted

- `ātl` plural: source explicitly provides the possessed `-ĀUH` and a
  number-insensitive water use, not a specific historically documented overt
  plural; leave plural unresolved.
- `cuīcatl` plural: Molina f. 26v, Karttunen p. 71 and cited uses do not
  establish a general lexeme-specific overt plural; leave unverified.
- `ilhuicatl` possessed: a quoted `ilhuicame` is plural heavenly realms,
  not a complete possessed singular form; leave possessed unresolved.
- `cītlalin` possessed: Karttunen's `CĪCĪTLALTIN` is a cited plural;
  it is not a possessed form. Do not conflate the fields.
- General animacy hypotheses cannot be upgraded solely from English glosses.
  Personified mountains, stars and socially significant nouns require
  sense-specific examples.

## What the morphological analyzer can now do

The pre-existing Form Probe supported source-tagged exact forms and a strictly
limited generator of present-tense subject + object + indexed stem hypotheses.
This pass adds **morpheme-level explanation** for:

- Indexed verb paradigm cells (up to 720), including subject/person selection,
  optional past augment, the transitive model's fixed object marker, its
  indexed lexical base and *undecided* residual tense/person material.
- Citation-form noun stem and absolutive ending, with the **current exact
  evidence grade** for the proposed stem.
- Ambiguous surface forms: present all matching analyses; do not force one.

The analyzer still does **not** claim a fully productive, validated finite-state
transducer. Its remaining research program includes: surface allomorphy,
person-object combinations, voice, irregular preterites, directional forms,
derivation, reduplication, dialect/century differences, and manual gold-standard
word token evaluation. Do not copy the 2023 Highland Puebla transducer into a
Classical Nahuatl engine: that is a different variety.

## Evidence references

- Stephanie Wood, editor, [Online Nahuatl Dictionary](https://nahuatl.wired-humanities.org/).
- Michel Launey, *An Introduction to Classical Nahuatl* (2011), Lessons 1–3,
  8–10; edition cataloged by the [Smithsonian](https://www.si.edu/object/introduction-classical-nahuatl-michel-launey-translated-and-adapted-christopher-mackay%3Asiris_sil_970857).
- D. K. Jordan, [Nahuatl Grammar Notes](https://pages.ucsd.edu/~dkjordan/nahuatl/nahugram.html),
  affix tables and verbal/noun morphology, a supplementary student reference,
  not independent manuscript attestation.
- Pugh and Tyers (2023), [Highland Puebla Nahuatl finite-state analyzer](https://aclanthology.org/2023.americasnlp-1.12/), **engineering comparison only**.

## Next evidence gates

Work the 203 remaining field claims in priority order using the new 88-row
queue. Require specific pages or folios, literal source spelling, translation,
period, variety and a strictly bounded assertion. Prioritize full possessed
tokens, lexeme-specific overt plurals, then sense-dependent animacy; evaluate
source-based irregular verb morphology before expanding production rules.
Keep uncertain or negative search results as open research questions, not
as evidence of impossibility.

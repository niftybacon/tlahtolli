# Tēntli historical corpus expansion: Sahagún's Ayer MS 1485 sermons

## Source and historical identity

**Historical source:** Bernardino de Sahagún and Nahua collaborators,
*Siguense unos sermones de dominicas y de sanctos en lengua mexicana*,
Newberry Library Ayer Collection manuscript **1485**. The texts were drafted
around 1540, copied in 1548 and altered in 1563. The extant manuscript
contains **64 sermons** (57 temporal, 7 sanctoral), including incomplete
material; no 65th sermon is invented.

**Modern edition:** Mario Alberto Sánchez Aguilera, ed., transcription
and Spanish translation, with Berenice Alcántara Rojas and Ben Leeming,
UNAM, 2022. The [UNAM repository catalog](https://ru.historicas.unam.mx/handle/20.500.12525/3366?show=full)
identifies this edition as **CC BY-NC-SA 4.0**, an open-access but
noncommercial, attribution-and-share-alike licensed scholarly publication.
The [web edition](https://sermonesenmexicano.unam.mx/sem/ayer1485i)
separately declares copyright and noncommercial reproduction conditions.
The public-domain sixteenth-century manuscript is **not** the same as
the copyrighted transcription or its modern Spanish translation.

## Research training use and rights

This batch is a noncommercial, experimental computer-assisted study of
historical Nahuatl linguistic forms. We retrieve only the source-visible
**Transcripción** card from each manuscript page, and **exclude** the
separately presented **Traducción** card, sermon presentations, scholarly
footnotes, Spanish-only headings, short Latin rubrics and paratext wherever
the page structure makes their boundary distinguishable.

The text is not artificially asserted to be pure Nahuatl: the original
sixteenth-century sermon includes Latin religious citations, Spanish
loanwords, scribal amendments and marginal notes. Some embedded editorial
material remains in Nahuatl-majority paragraphs and is explicitly
labeled `editorial`; neither normalized readings nor manuscript-certified
attestations are added to the canonical dictionary.

The sources are retrieved over HTTPS from the published UNAM site, not
from pirate mirrors, and used transiently for a private corpus manifest
within the CI runner, not checked into the public Git repository. The
`fair_use_assessed` schema tier expresses a provisional source-specific
research-purpose and access/market analysis **not** a license, a lawyer's
opinion or authority to republish the edition. No full Nahuatl text,
modern Spanish translation or paired sentences are uploaded as source
artifacts. This CI experiment is not authorization to ship a commercially
distributed model. Public model release must be independently reviewed
for acquisition terms, license obligations, memorization and market harm
using `neural/release_audit.py`.

The model continues from the previously trained **Florentine + Axolotl**
weights rather than rebuilding the Tēntli canonical morphological/grammar
engines. Entire sermons (rather than random pages) form the separated
train/dev groups: sermon IDs divisible by eight are withheld from
optimization and used for **self-supervised dev loss only**, not claimed
translation quality. The importer first verifies all 64 start pages
(the first p. 5, the last p. 197; sermon 64 ends p. 198), enforces
source-specific sermon headings, strips the Spanish translation panel,
checks sufficient Nahuatl-majority paragraphs and records per-page
SHA-256 hashes.

## Controls / caveats

- Authorial source text and 2022 transcription remain distinct. Verse,
  page, sermon and editorial spellings do not turn into reviewed gold data.
- The sermon site's "manuscript/transcription/translation" tabs all
  render inside a single HTML document; naïve webpage scraping would
  accidentally train on modern Spanish. The extraction uses the specific
  **Transcripción** card only.
- This collection adds long complex prose, conditionals, second-person
  plural imperatives, discourse markers and historical Christian
  rhetoric, but it has a strong religious topical bias.
- A modern Spanish translation is visible, but it is not used for
  bilingual training without passage-level validated alignment. The
  older Nahuatl–Spanish Axolotl corpus remains a distinct training source.
- No held-out, human-reviewed translation scores are available. Model
  success means genuine optimization, not proof of accurate translation.
- Pages and manuscript paragraphs may include Latin/Spanish intermixed
  with Nahuatl; future annotation should classify mixed spans more
  granularly rather than pretending they are fully Classical.
- All preexisting original phonology, source grammar, agreement,
  possession, and grammar-IR engines are preserved unchanged.

## How to reproduce

Run [the source-bound Ayer 1485 research workflow](../.github/workflows/tentli-ayer1485-training.yml)
or the source-only intake:
```sh
python -m pip install requests beautifulsoup4
python -m neural.intake_sahagun_sermons \
  --max-sermons 64 \
  --output /tmp/ayer1485-private.jsonl
```

The JSONL is research-only and must not be committed. The accompanying
`.meta.json` includes work identity, independent source URLs, hashes,
date/witness distinctions, split, accepted and excluded amounts and
human-translation-accuracy `null`. The existing neural training
script then consumes that manifest from the isolated runner.

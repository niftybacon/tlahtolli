# Source intake: dictionary evidence and r/nahuatl community material

The translator is historical-first. **A text being visible online does not mean it is historical Classical Nahuatl, linguistically verified, or licensed for bulk training.**

## Existing Tlahtōlli dictionary: evidence already usable

The published [dictionary.json](../../dictionary.json) currently holds 115 Classical Nahuatl headwords plus source pointers, editorially recorded historical spellings, grammar/lexical claims, and inflection records. The [correction script](../../tools/clean_segment_luke1833.py) now consults only that **existing, curated index** for candidate OCR line-break joins.

Each proposed patch includes the original OCR spelling, a proposed written form, the original character offset, a reason, whether it was mechanically applied, and up to two relevant lexical evidence links. Published dictionary entries, even with citations, are NOT proof a word occurs at any particular position in the Gospel. Rule-generated and unverified inflections do not license automated corrections.

The published dictionary's own AI-assisted source assessments are not specialist peer review. When choosing what to trust, separately audit a manuscript citation, an early lexicon, a modern scholarly grammar, and a productive hypothesis; do not flatten them all into “attested.”

Existing useful evidence pointers include the Online Nahuatl Dictionary (Stephanie Wood, ed., University of Oregon), source-linked Molina/Siméon references, grammar citations, and our own primary manuscript examples. Modern digitizations and editorial prose have independent intellectual-property conditions. **Do not scrape a third-party dictionary wholesale** merely because Tlahtōlli links to it.

## r/nahuatl: useful for source discovery and orthography, not historical training by default

- [Community home](https://www.reddit.com/r/nahuatl/) — mixed modern varieties, speakers, educators, and learners.
- [Community discussion: spelling standards](https://www.reddit.com/r/nahuatl/comments/18m78fs/) — points to coexistence of colonial-influenced, SEP, and INALI orthographies; these represent different traditions and sometimes different varieties.
- [Community discussion: variant comparisons](https://www.reddit.com/r/nahuatl/comments/omuewy/) — suggests a useful **research question** about Classical and modern central varieties; not an independently reviewed parallel corpus.
- [Community discussion: understanding vowel length](https://www.reddit.com/r/nahuatl/) — community-wide issues around macrons, speaker use and competing conventions. Look for source-linked grammar and speaker feedback before adopting rules.

**Default policy:** preserve URLs and high-level research notes only. Do not bulk ingest usernames, personal stories, posts, or comments into training data. A speaker's contribution needs consent or an appropriate license, as well as documented **variety, date, orthography, source, and permitted use**. Community claims can prompt verification, never automatically override a historical source.

## 1833 Luke cleanup workflow

- [1833 source record](luke_1833_source.json) — public-domain original publication, southern Puebla historical variety.
- [OCR working draft](luke_1833_working_ocr.txt) — **unreviewed**, public-domain-source automated transcription, not a critical edition.
- [Correction and verse candidate queue](luke_1833_review_queue.json) — hyphen repairs with reasons, conservative spaced-word proposals, source links, and tentative verse markers.
- [Tlahtōlli Translator](https://niftybacon.github.io/tlahtolli/) — expand the 1833 Luke atlas and load the correction review queue. Local choices do not change the public corpus; export the review decisions when ready.
- [Original facsimile](https://archive.org/details/elevangeliodeslu00pazy) — **authoritative page-image comparison**, not the uncorrected OCR.

Working-draft line-break joins only apply automatically when our published dictionary already indexes the fused form or it appears unsplit at least twice elsewhere in OCR. Printed whitespace (including separated person prefixes) is **never silently removed**. Hundreds of unresolved candidates remain. Chapter and verse labels are candidates until manually aligned to the original page images. This is **not** an independently verified, fully corrected edition or bilingual training set.

## Next independent-review priorities

1. Compare the 1833 page images with OCR for first-chapter numbered verse markers and running headers.
2. Review unresolved hyphen joins and interword spaces against the image, not just a possible dictionary gloss.
3. Build an explicit orthography map with a provenance label (1833 edition, 16th-century Codex, or modern variant).
4. Review at least one full chapter's verse boundaries with source-image locators.
5. Only then align original Nahuatl passages with independently sourced, rights-cleared English or Spanish translations and evaluate the grammar engine on withheld verses.

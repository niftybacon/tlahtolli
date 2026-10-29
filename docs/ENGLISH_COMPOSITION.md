# Compositional English drafts

The English layer realizes structures already proposed by the sentence analyzer.
It does not parse arbitrary Nahuatl, rank senses, resolve references, or change
the analyzer's completeness/evidence grades. The new public `englishParts`
field records subject, inflected English verb phrase and object separately;
the existing simple-clause English strings remain identical.

## Supported composition

- Indexed present/future clauses retain all supported roles, negation and senses.
- A finite matrix with a headed `in` relative can receive English wording.
  Subject gaps become “that cries”; object gaps become “that I see”.
  Both matrix roles and relative gaps survive when the analyzer proposes both.
- Two/three finite clauses linked by the existing `auh` analysis can be read
  as separate English statements, with “and”, or with “but”. Every connector
  is independently selectable. The default statement boundary is an editorial
  display choice, not a preferred interpretation.
- Punctuation-delimited supported clauses can be composed into a longer passage
  (up to 24 units). Each unit retains its own subject and tense. A possible
  antecedent never substitutes a noun or gendered pronoun in another clause.

The interface offers separate choices for every clause and connector instead
of enumerating an exponentially growing list. All supported combinations remain
selectable. Unknown material anywhere prevents a whole-passage draft; individual
analyses remain visible. Unsupported conditional force, ambiguous nominal
subordination, nested dependencies, locatives and possessed constructions are
not promoted to English merely because structural proposals exist.

## Provenance and implementation limits

The relative structure and agreement constraints come from the existing
`relativeClauseProposals`, with their original source links. The realizer
queries the existing finite+NP analyzer for structured English wording, then
fills the authorized relative gap and matrix slot. These internal synthetic
queries are engineering composition, never corpus examples or attestations.
“That”, English articles, lexical senses and the restrictive relative reading
are editorial choices. Other analyses of `in` remain possible.

For `auh`, the Online Nahuatl Dictionary entry
https://nahuatl.wired-humanities.org/content/auh (consulted 2026-10-28) identifies
additive, contrastive and new-statement uses. Its cited sources include Molina
(1571), part 2, f.9r, Carochi/Lockhart (2001), pp.458–59, and Lockhart (2001),
p.211. This is consultation of the dictionary's source-located transcription
and discussion, not independent manuscript inspection. The selected three
renderings do not exhaust its discourse functions.

Lexical senses, full noun meanings, and source URLs remain visible. No new
Nahuatl forms, verified manuscript readings, training data, expert review, or
historical accuracy claim are introduced. Scope is compositional English
realization over a bounded parser, not general contextual understanding.

## Constructed engineering examples and validation

- `niquitta in cihuātl in chōca`: “I see the woman that cries.”
- `chōca in cihuātl in niquitta`: “The woman that I see cries.”
- `nichōca auh ahmo niquittaz in cihuātl auh nitlacua`: selectable readings
  such as “I cry, and I will not see the woman, but I eat.”

These are synthetic regression inputs, not attested historical sentences.
Node tests preserve English for all 144 indexed present/future cells in both
polarities (288 checks), exercise both relative gaps and both matrix slots,
choice independence, future agreement, source retention and negative controls.
Browser tests exercise the actual dropdowns, reversible roles, displayed full
meanings, safe text rendering and loss of the optional English script.
This is software validation, not a held-out translation accuracy measurement.

# Explicit location context in English drafts

The existing parser proposes finite clauses containing one source-checked
relational phrase and at most one overt noun argument. The English composer
now uses those structures to produce selectable readings in a sentence or
an existing multi-clause sequence. It does not introduce a new locative parser.

For example, the synthetic input
`niquitta in cihuātl in calli itic` offers:

- “Inside the house, I see the woman” — event relation.
- “I see the woman inside the house” — the location describes the object.

When third-person argument roles are reversible, subject-attached, object-attached
and event-related readings stay separate. Dropdown labels expose the intended
attachment even where English wording itself could be ambiguous. No candidate
is ranked by plausibility. Fronting the event relation is an editorial English
presentation choice; it does not recover Nahuatl information structure.

## Evidence and constraints

The renderer requires an existing fully consumed
`complexClauseProposals` entry, matching present/future predicate, person,
polarity and argument roles. It reuses the finite renderer and a new
`describeNoun` API for the existing citation-noun English wording. Exact
source-listed inflections do not automatically inherit singular citation
wording. Duplicate/conflicting nouns remain unresolved.

The `itic` and `ītech` sense options are the existing locative analyzer's
editorial subset, not new dictionary evidence. The English layer requires those
declared senses and carries original sources and full noun meanings.

Consulted 2026-10-28:

- https://nahuatl.wired-humanities.org/content/itic — dictionary discussion and
  source-located Molina (1571), part 2, f.42v, plus later historical examples.
  Interior relations can have directional or other contextual values beyond
  the selected inside/within/interior wording.
- https://nahuatl.wired-humanities.org/content/itech — source-located Molina
  (1571), part 2, f.42r, and Karttunen (1992), p.107. Contact, attachment and
  other readings depend on context; the entry also records idiomatic uses.

This is consultation of a scholarly dictionary's transcriptions and discussion,
not independent inspection of historical manuscripts. Existing parser sources
remain attached to each reading. A source for a word or grammatical ingredient
does not attest any generated sentence.

## Unresolved context

Linking the relational third-person possessor to the adjacent place is still a
hypothesis. The composer does not identify that possessor, inherit a place from
another clause, decide event versus noun attachment, resolve idioms, select a
semantic sense or establish the scope of negation. It supplies conditional
English readings of the proposed structures, not certified sentence meanings.
English articles and selected noun senses are editorial.

Unsupported units still prevent a whole-passage draft. Conditional, nominal,
nested or possessed structures are not promoted solely by these changes.
The original analyzer's `complete:false` and evidence grades are preserved.
The negative-token count in the multi-clause linker is corrected: locative
proposals count post-negation tokens, while the enclosing clause retains the
initial negative token. This permits the already-supported negative clause
inside an `auh` sequence without relaxing coverage.

## Validation

Synthetic tests exercise all 144 indexed present/future cells with a place,
both affirmatively and negatively (288 cases), argument-role and attachment
alternatives, selected relational senses, retained lexical meanings and sources,
multi-clause composition, no implicit place inheritance, conflicting entries,
unrenderable inflections, malformed adapters and unsupported material.
Browser tests exercise the actual choices, clause linking and negative controls.
No verified manuscript readings, expert review, model training, new gold data
or measured historical translation accuracy are claimed.

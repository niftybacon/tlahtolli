# Source-gated verb analyses in English sentence drafts

The canonical morphology engine already supplied many source-labelled finite
analyses, but the English sentence path admitted only the small indexed paradigm
set. This change connects those analyses to the existing declarative clause,
relative-clause, location and passage composers. It does not add another Nahuatl
conjugator or change the other agent's lexical material or neural training.

## Evidence and provenance

`data/predicate_english.json` contains 82 **editorial English realizations** keyed
to the current canonical lemma, part of speech, full dictionary meaning and source
URL. These are selected senses and English inflections, not newly verified
historical glosses, exhaustive dictionary translations, or corpus sentence pairs.
Alternative listed senses remain unranked choices. English wording was prepared
for this engineering change; no external expert review or manuscript collation
was performed. The pack copies repository source identifiers rather than claiming
that this change independently verified those sources.

Admission requires one matching canonical lexical entry, its existing
`Checked against source` status, and located headword/meaning/POS claims. Changes
to its meaning, source or POS invalidate the English mapping until reviewed.
Personal or duplicate homographs do not silently inherit a reading. A missing or
invalid optional pack leaves the old indexed grammar available.

Each additional surface is obtained from the existing canonical morphology
provider. Only explicitly permitted source-template/class hypotheses with person,
tense and object information are accepted; their parts must reconstruct the
exact normalized spelling. Stem-class analyses also require a located stem claim
and recorded first-person preterite. Exact recorded past forms require exact
dictionary spelling, matching source/category, and an explicit `Preterite 1sg`
label. Accent-folded morphology matches alone cannot license this route.
Archive guesses, unreviewed labels and speculative lemma matches cannot enter it.

The original word grade (`hypothesis` or `lexical`, for the tested data), source,
locator and full lexical meaning travel into the sentence frame and visible
composition evidence. The grammar audit re-requests the productive reading and
rejects altered/removed evidence or mismatched tense/person. The provider remains
the trusted morphology implementation; this is provenance checking, not a new
independent linguistic proof. English composition never promotes a hypothesis
to an attested word, a manuscript reading or a verified sentence.

## Behavior and constraints

Supported forms can supply present, future or preterite predicates, singular and
plural agreement, negation, compatible overt subjects, bounded headed relatives,
relational locations, and existing passages of up to 24 units. English copular
agreement and irregular past forms come from English realization data. These
constructed examples demonstrate software behavior, **not historical attestation**:

| Constructed input | First draft |
| --- | --- |
| `ōnicoch auh nitlapāca` | I slept. I wash something. |
| `ahmo nimiquiz` | I will not die. |
| `niquitta in cihuātl in cochiz` | I see the woman that will sleep. |
| `nicochi in calli itic` | Inside the house, I sleep. |

The alternatives are not ranked for contextual likelihood. `auh` continues to
offer the existing editorial connector choices. This does not resolve discourse
referents, infer English gender, decide lexical senses from surrounding prose,
or recover missing manuscript spelling.

An indefinite object stays `someone` or `something`. It cannot be replaced by an
overt noun or become a relative head gap. Productive relative support currently
uses intransitives; additional specific-object/reflexive valencies require their
own source-backed treatment. Unsupported words or units still block a complete
English passage rather than disappearing. Conditional, nested and coordinated
subject structures do not acquire English support merely from this connection.
Three mapped entries (`cocoa`, `nequi`, `petzcoa`) have no admitted form in the
present/past probe inventory; English mapping alone grants no morphology.

The tenth argument to `TlahtolliSentence.create` enables the optional pack. The
live desk and corpus diagnostic supply it; older consumers remain compatible.
The grammar-IR constructor receives that sentence model as its fourth argument
to validate productive frames. New productive frames fail closed without it.

## Validation and measured limits

`node tools/test_productive_predicate_english.js` exercises 41 constructed
sentence/paragraph cases, negative controls for object role, spelling, number,
negation, missing/stale/duplicate provenance, malformed optional data, provider
failure, forged English-frame evidence, unsupported middle units and the
24-unit boundary. Broad integration probes reach 79 of the 82 mapped entries:
79 exact recorded past probes, 76 canonical present hypotheses, and 296 further
licensed future/present-plural cells. These counts overlap in lemmas and are
**software coverage, never translation accuracy**. The legacy JS suite also
passes, including the existing indexed paradigms and morphology abstention tests.

The browser regression checks real rendering, source links, alternatives, missing
optional data and renderer isolation. It holds archive requests until after a
reader selects English and opens provenance, then releases them and verifies
that the redraw preserves both. This addresses the source-panel visibility race
seen in recent full-data CI runs without removing the visibility assertion.

The existing historical diagnostic was rerun on the same pinned 200 development
records (17 works), CSV Git blob
`90b7327fc4023ba529e1982f823ddeaee6e313e3`, against baseline main
`fbd5b3050d9cc72a08ba4de1413e16554e2843ec` plus this change:

| Measure | Before | With bridge |
| --- | ---: | ---: |
| Tokens | 1,998 | 1,998 |
| Curated lexical matches | 552 | 552 |
| Tokens without curated matches | 1,446 | 1,446 |
| Unknown tokens with canonical morphological proposals | 111 | 111 |
| Full grammar candidates | 0 | 0 |
| Audited draft English records | 0 | 0 |

Reproduce with `node tools/diagnose_axolotl_development.js /path/to/pinned/axolotl.csv --limit 200 --json`.
The CSV is pinned by the diagnostic's existing upstream manifest. These records
overlap development material, are not certified complete linguistic sentences,
and have no reviewed gold English reference; no accuracy claim is possible.

The next context work should be driven by source-located clauses from those
failures: identify exact spelling, finite predicates, argument roles and clause
boundaries, then test a general clause rule against contrasting roles and
unrelated passages. Lexical expansion alone cannot supply complement/subordinate
structure or discourse reference. Historical spelling resolution also needs
located evidence; silently deleting vowel length would reintroduce ambiguity.
The new bridge provides a reusable endpoint for such work but does not itself
make arbitrary historical paragraphs translatable.

Runtime hashes include the optional English pack. The narrowly scoped
`prepare-predicate-runtime.yml` workflow regenerates only `index.html` on this
feature branch using the existing builder before the PR is opened. Full PR CI
must pass on that final generated head before merging.

## Compatibility with subsequent research integration

On resuming this PR, main also contained the source-gated neural candidate
bridge, optional pretrained English realizer and reviewed-correction pipeline.
Those files are preserved without modification. Their canonical bridge already
accepts this optional predicate pack and passes its tests with it present,
including `nicochi`, `ōnicoch` and `ahmo nimiquiz`. Sixteen Python tests covering
hybrid inference, pretrained output gates and the review loop also pass with
the integrated tree. This verifies interfaces and safeguards, not new model
training or real pretrained-weight execution in this PR.

The old integrated-browser expectation for isolated `onicoch` and negated
`ahmo onicoch` is updated to the intentionally expanded draft behavior. It now
asserts exact English, retained lexical grade, Molina attribution and the
unattested-sentence label. The incompatible `onicoch in cihuātl` control still
must fail: a first-person intransitive cannot absorb that overt noun.

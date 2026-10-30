# Tēntli: independent historical Silver reviews and blind Gold protocol
*October 30, 2026 • Phase 2 of the consolidated roadmap. A source candidate is not a human-validated translation.*

## Verified baseline and why the next review gate matters

- **150** Brinton 1890 printed-edition Nahuatl/English numbered-stanza correspondences have immutable source links, rights tags, and machine-checked printed line identities. **133** occur in the research training split; **17** are development poems. The correspondence is published/editorial, not verified clause-literal translation.
- **40** source-linked training-stanza contexts are assembled as a reproducible **Silver review worksheet** by `tools.prepare_silver_review`; no development poems enter the worksheet. A reviewer should inspect each source sentence, punctuation, poetic vocables, scope of negation, subject/object person, clause boundary, orthography and the nineteenth-century English interpretive choices.
- **0** independent reviewers have signed these 40 cases in the repository; **0** new certified Silver translations and **0** independent Gold translations currently exist. This step establishes their **process**, not fabricated human scholarship. Do not claim it has already achieved Silver/Gold targets.

## Silver — reviewed *training candidates* from published works

The machine-readable review packet preserves each originally printed Nahuatl segment, Brinton's printed English wording, source line URL, English line URL, exact source collection, edition blob SHA, historical poem identifier, editorial flags, immutable fingerprint, and fields explicitly marked pending.

Generate **40** source pointers and worksheet entries (not yet training data):

```sh
python -m tools.prepare_silver_review \
  --limit 40 --max-per-work 4 \
  --output /tmp/brinton-pending-review.json
```

To assess independently **hand-filled** reviewer decisions, pass the optional `--decisions /private/manual-silver-decisions.json`. Each decision binds to the exact printed source fingerprint. Three allowed statuses are `reviewed_silver_candidate`, `reject_alignment`, and `needs_more_evidence`. For the first, require:

- Two distinct, named human reviewers responsible separately for printed transcription and contextual Nahuatl→English semantics; software cannot independently verify a person's qualifications or actual work merely from their name.
- Exact edition and English source URLs, independent comparison notes, grammatical/contextual alignment scope, explicit manuscript-facsimile comparison status, printed-translation literalness assessment, rights for both source and English, and a reviewed English text.
- A statement that the decision is **not Gold and not automatically training-eligible**. A valid review-decision schema only marks *possible evidence for a second editorial approval*, not permission for the neural optimizer or promotion into `pairs.csv`.

Never substitute the model's own outputs, a source spelling match, an online bilingual dictionary's isolated word gloss, or a single editorial translation for two independent reviews. If source context or manuscript spelling differs, retain the disputed alternatives and decline the alignment until checked. A rejected or unresolved case remains excluded.

## Gold — truly unseen historical collection, blind semantic evaluation

Gold **cannot** be assembled from Brinton song XXV–XXVII: even though those songs were not used for gradient updates, the entire Brinton printed collection was explored during research and dataset development. **Collection-level exposure** matters more than narrow song-ID groupings.

`tools.independent_gold_gate` is a **private-dataset** validator and human-adjudicated scorer. By default it reports zero registered real Gold cases:

```sh
python -m tools.independent_gold_gate
```

A future Gold reference must be from an independently selected, never-trained, never-tuned, rights-cleared Classical Nahuatl *collection* and contain exact source/translation provenance, distinct human text and translation reviewers, source context, unambiguous split/holdout assurances, and reviewed reference wording. Keep private reference labels **outside public GitHub Actions, PRs, issue bodies and training files**.

To register private source evidence without evaluating a model:

```sh
python -m tools.independent_gold_gate --private-gold /private/gold-references.json
```

To evaluate the model **after** that Gold reference is frozen, prepare a prediction set keyed by Gold ID and a separately prepared third-party **human semantic adjudication** set. Both must carry the frozen reference's SHA-256; each item must be scored `faithful`, `partial`, `incorrect`, or `abstained`. The adjudicator must be independently named and distinct from both reference reviewers. Evaluate only after at least 10 human-reviewed cases (an early minimum, not a reliable 100–200-item benchmark), across multiple independent works:

```sh
python -m tools.independent_gold_gate \
  --private-gold /private/gold-references.json \
  --predictions /private/blind-model-outputs.json \
  --judgments /private/third-party-meaning-adjudications.json
```

The scorer never uses string equality as a semantic correctness substitute. It computes a conservative human-scored faithful rate, abstention rate, four-way error counts, and Wilson interval. It **does not output original or translated Gold content**, only aggregated results and an evidence fingerprint. The minimum meaningful future goal is **100–200 work-disjoint, independently reviewed examples**, but do not imply they already exist.

### Important limits of machine checks

A script can verify source URLs, copied text, hashes, rights *declarations*, source-collection separation, non-AI reviewer *names*, and scoring completeness. It **cannot** certify that a reported reviewer is qualified, actually performed the review, that the source was truly never discussed in external research, that a claimed license is legitimate, or that two translations express the same nuanced meaning. A human review committee must check these independently.

In addition to the coded ban on Brinton and synthetic work IDs, explicitly audit any other previously consulted manuscripts, dictionaries, corpus publications, model demonstrations, research notes, baseline tests, and future training sources **before** freezing new Gold examples. The present exposure registry is a conservative baseline, not proof it captures every historical text anyone has viewed.

### No data leakage or bogus claims

`research/translation_corpus/pairs.csv` remains unchanged (no approved rows). Gold is for **evaluation only**, never fit or prompt revision. Research Silver candidates may be included in a later training proposal only after separate editorial approval, independent source-collection grouping, and the existing canonical approved-pair validator. Synthetic Bronze is unreviewed constructed grammar; it must never become historical attestation or Gold.

GitHub workflow `.github/workflows/tentli-human-silver-gold-gates.yml` checks all gates with **explicitly fictional synthetic test fixtures**, generates the 40 *pending* Brinton review worksheets, publishes the public-domain review queue, and asserts no independent Gold has been created. **No real human review, model training, or public translator upgrade happens in this workflow.**

The next work is human scholarship: begin with a small number of the flagged short stanzas, independently examine manuscript/edition differences, document person/aspect/negation and vocable status, obtain permissions for any modern editorial translations, then consider specifically reviewed Silver approval. For Gold, select a different, never-used historical collection through a qualified reviewer and lock the reference before any model prediction is shown.

# Complete historical worklist and additional primary-edition documents

*October 30, 2026 • Source investigation, not automatic translation certification.*

## Why the old system was "weekly 40"

The first automated Brinton lexical researcher intentionally investigated **40 written forms on each run** using a small, source-locked, fail-closed review queue. The Monday timer was only a check for reproducibility, **not** a linguistic reason to stop at forty. In fact, the old `neural.canonical_lexical_coverage.inspect` returns only the first 40 unfamiliar written forms, so repeated weekly runs would revisit essentially the same forms. The old scheduled run has been **retired**. The legacy 40-case tool remains available as a narrow regression.

The replacement `neural.paged_historical_investigator` enumerates *every distinct written form* in the **133 historical Brinton training stanzas**, without reading the **17 reserved development stanzas**, and adds the individually cited forms from the prior source registers and the two new documents below. It groups by the original written form, not a guessed dictionary lemma. The English Brinton translations are never indexed as word meanings or used to self-approve the record.

All **36,543** existing archival lexical records are indexed once per execution, keeping Siméon 1885 French OCR separate from Kaikki/Wiktionary English community data and rejecting non-Classical varieties. Canonical source-graded headword/part-of-speech evidence and original source-word locators are attached to each result, but an exact spelling match is **not** evidence of correct syntactic analysis or semantic equivalence.

Use a **200-form page** for manageable reading, any page up to **1,000**, or process *all* distinct forms in a single run:

```sh
python -m neural.paged_historical_investigator \
  --batch-size 200 --output /tmp/page-0.json
python -m neural.paged_historical_investigator \
  --batch-size 200 --offset 200 --output /tmp/page-1.json
python -m neural.paged_historical_investigator \
  --batch-size 200 --previous /tmp/page-0.json \
  --output /tmp/next-unreviewed-page.json
python -m neural.paged_historical_investigator \
  --all --output /tmp/all-available-forms.json
```

The optional `--previous` method checks the original records and SHA-256 of the **19 original archived dictionary source JSONs**, the canonical lexicon, evidence, word-form atlas, candidate training corpus, project-director feedback and source-context catalogs. It refuses to silently resume on changed material, on an unsafe imported review decision, or when the previously evaluated form is no longer traceable to the current source. The output itself is a research audit, **not** model memory or verified training. Consequential conflicts may be escalated to a person, but *every* form does not require routine personal approval.

## Two newly investigated primary historical works

The two source pages below are **different original historical documents from the same Beyond the Codices editorial collection**. They are separate historical work IDs, not claimed as independent historical language regions. The English and transcriptions were edited by **James Lockhart**; the repository quotes only short identifying Nahuatl spans and links the scholarly translations for context.

| Work | Date, archive and link | Short original-language probes and uncertainty |
| --- | --- | --- |
| [BC16: Coyoacán land sale to Spaniard](https://enl.wired-humanities.org/bc16) | **1573**, AGN Tierras 1735 exp. 2 f. 122 | `ticnamaca y¯ totlal`: land-sale context, original abbreviated mark preserved. `çan necoc cempohualli quahuitl`: parcel dimensions, not a generalized *necoc* dictionary rule |
| [BC26: Don Juan de Guzmán household, Folio A](https://enl.wired-humanities.org/bc26/elements/bc26a/000) | **1540s/early–mid-sixteenth century** (editorially estimated, **not** precise 1549), AGN Tierras 1735 exp. 2 | `yn don juan tecpancalli ytech pohuiz`: institutional ruler's household, not always the physical palace. `ynic cecni ocoçacapan`: numbered cultivated-field context, not the verbal optative `-cān` |

The short `BC26` source spelling is **pohuiz** as published in the Nahuatl transcription, not *poviz*. The first live-source check caught this distinction and it was corrected before validation. The documents have explicit date precision, locality, original manuscript archive, editorial provenance and rights notes, so they cannot quietly become nineteenth-century spellings or modern dialect attestations.

`neural.multidocument_evidence` fetches **only two predeclared HTTPS ENL pages**, verifies that the exact phrase occurs **inside the actual Nahuatl analytic-transcription portion** and not merely an introduction or English translation, and writes only the short cited excerpt and pass/fail status. It does **not** mirror Lockhart's full edited transcriptions, copy an English parallel dataset, decipher original manuscript photographs, or claim an independently verified translation.

```sh
python -m neural.multidocument_evidence \
  --live-check --output /tmp/new-historical-works.json
python -m unittest discover -s tools \
  -p 'test_paged_multi_document_investigator.py' -v
```

The prior 1621 BC19 document and Florentine Codex references remain separately graded. The Florentine Codex published transcription continues to need a compatible rendered-page check; the project does **not** count it as independently static-HTML verified.

## Respecting Gold, Silver, Bronze

**Gold** still requires a truly untouched independently human-adjudicated historical collection. Because we have now researched BC16 and BC26, the Gold gate excludes both complete works and the larger Beyond the Codices editorial collection, in addition to already-exposed Brinton/BC19/Florentine sources.

**Silver** remains historically source-supported but unapproved where the English alignment has not been independently checked. There are no new human-signed Silver or Gold pairs and no training permission from these short original-language excerpts.

**Bronze** remains machine-generated grammar practice from separately source-graded grammar rules. No model checkpoint, teacher sentence, approved dictionary meaning or production translator code changes in this PR.

The new [complete-worklist GitHub Actions workflow](https://github.com/niftybacon/tlahtolli/actions/workflows/tentli-full-source-worklist.yml) runs a **full-form scan**, not a weekly forty-form replay, when source code or evidence changes, on manual dispatch, and once a week as an evidence-drift/reproducibility check. A weekly run by itself does **not** discover new unseen off-site works: adding historical documents is a separate, rights-checked source-intake process. No GitHub Action self-commits speculative lexical meanings.

The next step is to expand the allowlisted original-language collection incrementally to genuinely independent historical periods/regions, improve parsing of inflected forms, and prioritize a small collection of meaningful disputes for human attention. Do not conflate the number of forms scanned with correct English translations.

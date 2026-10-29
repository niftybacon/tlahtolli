# Tlahtōlli — Advanced local spaced repetition and Anki exports

Tlahtōlli includes an **Anki-inspired, configurable spaced-repetition system**
for vocabulary and its existing 720 grammar-derived verb paradigm cards.
It operates offline, using the browser's local study workspace; public
visitors **cannot change the published dictionary or anyone else's reviews**.

## Scope and transparency

**FSRS-5 is available as an opt-in alternative; the classic SM-2-family scheduler remains the default.** Classic mode uses an adaptive *SM-2-family* interval
scheduler with Anki-like learning steps and practical controls. Its intervals
are useful study reminders, **not** statistically calibrated predictions of
future recall. Anki's FSRS optimizes stability/difficulty/retention from review
history, which this implementation does not do.

Both vocabulary reviews and conjugation cards now use **one scheduler**.
Previously they advanced through hard-coded day ladders, independent of
settings or recall history.

### Available controls

| Category | Settings | Defaults |
| --- | --- | --- |
| Daily study | New/day; review grades/day | 10 new; 100 review grades |
| Learning | Learning steps | 1 minute, 10 minutes |
| Relearning | Again/lapse steps | 10 minutes |
| Graduation | Good graduation; Easy graduation | 1 day; 4 days |
| Long-term review | Starting ease; Hard factor; Easy bonus; interval modifier | 2.5; 1.2; 1.3; 1.0 |
| Lapses | Lapse interval multiplier; minimum lapse interval | 0.2; 1 day |
| Protection | Maximum interval; leech threshold/action | 36,500 days; 8 lapses; mark difficult |
| Review order | Earliest due; new first; alphabetical | Earliest due |
| Sibling suppression | Bury other same-verb conjugations reviewed on that day | On |

Four selectable presets are included: **Balanced**, **Intensive**, **Gentle** and
**Light (2 new/5 reviews)**, the latter matching the limits in the reference Anki screenshot. Individual values can be customized. All defaults can be
restored by selecting Balanced and saving. Settings modify **future** grading;
existing due timestamps are not forcibly rescheduled.

Learning-step syntax is space-separated intervals such as `1m 10m`, `30s`,
or `2h`; invalid, zero, or excessive durations revert to the defaults.

**Again** signifies failure; **Hard** signifies successful recall with
difficulty (the same distinction emphasized in the [Anki manual](https://docs.ankiweb.net/deck-options.html)).
After a passed final learning step, a card graduates. Failed review cards enter
relearning, reduce ease, and eventually may be marked difficult or suspended.
Actual grade intervals are previewed on the four review buttons.

The **Any dictionary word** / **Practice any** modes are now non-scheduling
cram modes: practice reviews don't alter the due dates or review history.
`Undo last review` restores the immediately preceding card schedule within
the current page session. Review shortcuts: **Space** reveals a vocabulary
card; **1–4** grade Again, Hard, Good, Easy once revealed.

### Migration, backups, and privacy

The existing `tlahtolli_study_progress_v14` record key is reused:
`reps`, `lapses`, `last`, `due` all survive. New records add a
learning/relearning phase, step, ease, interval, leech state, timestamp and
bounded review history. Old records are treated as already-reviewing cards
when their legacy counters indicate previous success. No attempt is made to
reconstruct nonexistent historical reviews.

The settings live separately in `tlahtolli_srs_settings_v2` in localStorage.
Full-project JSON backup **version 6** includes all study records **and**
study settings; older backups remain accepted. The study-record CSV includes
review history as structured JSON, but a full-project backup is preferred
for actual restoration. Export and save backups before clearing browser data.

The app sends **no local review history** to GitHub, an API or another device.
It is **not** account-synchronized. If localStorage is cleared without a
backup, review progress is lost. Sibling burying applies only to multiple
cards of a *single indexed conjugation lemma*, not to independently generated
noun stems.

### Anki interoperability

Within **Study → Anki vocabulary** or **Anki conjugations**, download a
UTF-8, tab-separated `.tsv` file containing:

- **Vocabulary**: front=headword, back=English gloss, lexical category,
  evidence status and linked historical source, tags.
- **Conjugations**: front=lemma + tense/person, back=the indexed form,
  explicitly labeled **grammar-derived, not individually manuscript-attested**,
  tags.

The file uses documented Anki text-file headers:
`#separator:Tab`, `#html:true`, `#notetype:Basic`,
`#deck:Tlahtōlli::Vocabulary` or
`#deck:Tlahtōlli::Verb Paradigms`, and three field names/tags.
Import with Anki's **File → Import**, verify the field mapping and Basic
note type in the preview, and choose whether to update duplicates or create
new notes. The export does **not** embed arbitrary runnable HTML/JavaScript
and preserves Classical Nahuatl diacritics.

**Important:** TSV exports are study *content*, not an Anki collection
database. They **cannot transfer due dates, review logs, FSRS parameters,
ease factors or card learning state** into Anki. Anki schedules newly imported
notes using its own settings. Use Tlahtōlli's project JSON backup for preserving
in-app study progress.

See [Anki's text import manual](https://docs.ankiweb.net/importing/text-files.html)
and [Anki deck options](https://docs.ankiweb.net/deck-options.html).

### Testing and maintenance

The canonical source is `tools/srs_engine.js` plus
`tools/srs_ui.js`, embedded into standalone `index.html` using
`tools/build_srs.py`.

Run:

```bash
python tools/build_srs.py --write
python tools/build_srs.py
python tools/build_dictionary.py --check
python tools/test_srs.py
```

CI also runs all existing dictionary, source evidence, reader, search, and
morphology regressions. Future enhancements could include a **properly tested
FSRS implementation**, device-to-device sync controlled by the user, separate
study presets per subject, and a faithful Anki review-log transfer format. None
of these is implied by the present version.


### Session mastery retries (October 29, 2026)

A review session must not claim to be finished simply because an **Again** or **Hard** card is temporarily scheduled in the future. The vocabulary, reverse-vocabulary and indexed conjugation queues now retain session-local retries (surviving a reload of the same tab via `sessionStorage`) and show a **Still learning** countdown if no other cards can be shown yet. A timer refreshes the queue when the next step is ready.

- **Again** follows the configured learning/relearning delay, then returns. A previously learned review receives a normal lapse and relearning state.
- **Hard** in learning/relearning follows the scheduler's delay. **Hard** on an established review uses its normal future interval **plus** a one-minute, session-only mastery check. This check is not another long-term SRS review; **Good/Easy** passes it without extending the interval, **Hard** repeats it, and **Again** records a real lapse.
- **Good** that advances an unfinished *learning step* remains pending until the next learning step; **Good/Easy** that completes learning or a session-only check closes that retry.
- Paused retries do not bypass timers. Daily new/review caps and conjugation sibling burying do not hide a retry already introduced in this session. Suspended leeches remain suspended until explicitly resumed; **Practice any** remains non-scheduling.
- Retry state is tab-scoped and expires after 24 hours; persistent `studyRecords` still preserve all normal learning/relearning due dates and history if a tab is closed or restarted. Undo restores both the schedule and the pending session retry.

Test with `node tools/test_srs_session.js`, alongside existing SRS/FSRS regression suites. This is a Tlahtōlli-specific mastery workflow, not a claim that native Anki requires a same-session Good grade for every Hard card.

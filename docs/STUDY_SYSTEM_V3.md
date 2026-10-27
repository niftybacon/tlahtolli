# Tlahtōlli study system v3 — customizable local SRS and Anki export

## What is implemented

The existing local-only adjustable **SM-2-family** scheduler remains the
authority for scheduling inside Tlahtōlli. No recorded review, due date,
learning step, lapse or study session is silently migrated or reset.

### Study options

- Independent daily caps for new cards and reviews.
- Learning steps and relearning steps, graduation/easy intervals.
- Starting ease, easy bonus, hard factor, interval modifier, lapse multiplier,
  minimum lapse interval, maximum interval.
- Leech flagging/suspension and manual resume, plus card sibling burial.
- New cards: lexicon order, alphabetical or deterministic daily shuffle.
- Review cards: oldest due, lowest recorded ease or daily shuffle.
- Explicit review-first/new-first preference.
- Answer timer (0 = disabled) that counts seconds while the question is
  visible. Optional auto-reveal after expiration **never grades a card**.
- Previous study/verb-drill controls, shortcuts and undo are retained.
- 30-day empirical first-review recall (a reported percentage, not a
  predicted probability); seven-day visualization of already scheduled
  due cards, excluding suspended cards. Forecast does not simulate learning,
  rescheduling or the effects of new introductions.

Study records and preferences are saved in existing browser localStorage keys.
They are not sent to GitHub or other viewers. Export a full project backup
before clearing site data or using a different browser.

## Anki compatibility

The three existing export actions (vocabulary, reverse vocabulary,
verb conjugations) remain available. They now emit tab-separated UTF-8
text with explicit Anki import headers, a **stable GUID column**, note
fields, and tags. The GUID is generated deterministically from the
dictionary entry or indexed conjugation identity, plus the destination
export deck. Repeating the same export gives the same note IDs; editing
a headword itself changes that note's identity.

Anki text import supports headers such as `#separator:Tab`,
`#guid column:1`, `#tags column:4` and `#deck:`. When importing,
confirm Anki's field mapping and **update existing notes** behavior.
Imported notes receive **Anki's own SRS scheduling**. A TSV cannot
transport Tlahtōlli's grade history, Anki scheduling intervals, or Anki's
native FSRS model. Exporting an .apkg that retains Anki review history
requires native Anki collection metadata and is **not implemented**.
Reverse notes and conjugations are separate export sets.

- [Anki manual: plain text imports](https://docs.ankiweb.net/importing/text-files.html)
- [Anki manual: FSRS and deck settings](https://docs.ankiweb.net/deck-options.html)
- [Anki manual: exporting](https://docs.ankiweb.net/exporting.html)

## Research and product limits

This update does **not** purport to implement FSRS, FSRS-6,
Anki's parameter fitting, AnkiConnect, AnkiWeb syncing, or Anki's
native collection export. Existing local scheduling remains explicitly
SM-2-family, with user-adjustable short- and long-term interval
parameters. Real learning algorithms should not be advertised as
equivalent without validated implementation and benchmarking.

The screenshot-inspired controls are opt-in and default to a simple
workflow. No custom audio playback or synthesized Nahuatl pronunciations
are enabled; source-verified audio would require separately licensed
recordings and consent.

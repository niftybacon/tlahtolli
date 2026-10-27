# Phase 1 — Lightweight release checks and responsive search

Tlahtōlli v2.3.1 now avoids fetching the same 88-lemma dataset twice on normal page loading.

## Delivery and offline behavior

- `index.html` contains an exact, validated **embedded offline seed** of the dictionary and verb paradigms. It is intentionally retained for direct `file://` use, offline use, and fallback if the network is unavailable.
- Online startup requests a tiny `release.json` manifest with `cache:'no-cache'`, permitting standard HTTP revalidation.
- **Matching version:** uses the already-embedded seed for the three-way merge of published entries, protected local changes, and intentionally hidden words. No redundant download of `dictionary.json` or `paradigms.json` occurs.
- **Newer manifest:** requests both published JSON files with versioned query strings and ordinary caching, checks both versions and schemas, then applies the established protected-edit merge. A broken or partially deployed update leaves saved data intact.
- `references.json` is requested at a release-versioned URL with normal browser caching; the source atlas remains available when loaded successfully.
- Manual “Check updates” performs the small manifest check again; the app does not schedule background polling.
- Local learning records, annotations, full JSON backups, intentional deletions, and manually edited forms are unchanged.

## UI efficiency

- One browser animation-frame batch per burst of search input. Filtering still updates the results immediately on the next paint.
- If the selected word did not change during typing, the detail pane, currently selected tab, evidence ledger and its event handlers are preserved instead of unnecessarily reconstructed.
- Result-list selection is handled by one delegated click listener rather than recreating dozens of event handlers after each keystroke.
- Pack coverage uses a set membership lookup instead of a nested scan through the complete dictionary.

## Release maintenance

**Important:** When changing any of `dictionary.json`, `paradigms.json` or `references.json`, increment the shared release version in the three files, in the HTML embedded seed, and in `release.json`. The validator rejects mismatched versions, counts or offline seed data. Otherwise same-version embedded data would conceal newer published content.

## Verification

Run:

```bash
python tools/validate.py
python tools/test_claim_audit.py
python tools/test_data.py
```

Automated structural tests do not establish historical accuracy or a measured real-device loading speed. For practical testing on mobile, verify first-load and subsequent page-load network requests, manual update checks, direct offline HTML opening, and intact local edits after a new release.

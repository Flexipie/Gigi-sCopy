# Gigi's Copy Tool — Planning & Requirements (First Checkpoint)

This document captures the SDLC planning, scope, requirements, architecture, and test plan for a new, distinct feature to be added to the existing Chrome MV3 extension project. It is designed to be testable using only the Chrome extension (no native helper required) for the first checkpoint.

## 1) Project overview

- Base project: Chrome MV3 extension that saves text selections and manages them in an in-page overlay (`ChromeExtension/`), with optional macOS native helper for desktop capture (`GigiCopyHelper/`).
- New distinct feature (to be graded independently): Smart Deduplication + Auto-Tag Rules (extension-only).
- Goal for checkpoint: Deliver clear scope, requirements (FR/NFR), architecture, and a test plan that can be executed with only the extension enabled.

## 2) Chosen SDLC model and justification

- Model: Agile mini-iterations (lightweight Scrum)
  - Short, timeboxed iterations with clear increments: planning → design → implement → test → demo.
  - Rapid feedback from manual testing in the extension (no CI required at this stage).
  - Easy to show progress for grading (distinct commits per sub-feature: dedup, tags, filters).

## 3) Application scope (new feature)

- Feature name: Smart Deduplication + Auto-Tag Rules
- Problem: Multiple identical or near-identical clips create clutter; users want clips auto-organized by source or keywords.
- Solution:
  - Deduplicate on save by computing a normalized hash of the clip text (whitespace-collapsed, lowercase, trimmed). If a duplicate is saved again, increment a `dupCount` field instead of creating a new row.
  - Auto-tags: configurable rules that tag clips based on URL domain or text pattern (e.g., rules like: domain contains `stackoverflow.com` → add tag `StackOverflow`; text matches `/\bTODO\b/` → add tag `Notes`).
  - Filter by tag in the overlay UI.
- Out of scope (for checkpoint): cloud sync, backend services, OCR, import/export, quick compose. These can be considered stretch goals later.

## 4) Functional requirements (FR)

- FR1: Deduplication on save
  - When a user saves a selection, the extension normalizes the text and computes a hash.
  - If a clip with the same hash already exists, do not create a new item; instead, update the existing item’s `dupCount` and `updatedAt`.
- FR2: Auto-tag rules editor
  - Provide a simple UI (overlay settings popover) to add/remove rules:
    - Rule types: “URL contains <substring> → add tag(s)”, “Text matches regex → add tag(s)”.
    - Store rules in `chrome.storage.local`.
- FR3: Tag application on save
  - On save, evaluate rules to add tags to the new (or updated) clip.
  - Ensure tags are unique per clip.
- FR4: Tag filtering in overlay
  - Provide a tag filter control (dropdown or chips) to narrow the visible list to clips containing a selected tag.
- FR5: Backward compatibility
  - Existing stored clips without `hash`, `dupCount`, or `tags` remain visible and functional.
  - A one-time migration populates defaults where missing.

## 5) Non-functional requirements (NFR)

- NFR1: No new extension permissions needed (operates entirely in `chrome.storage.local`).
- NFR2: Performance: saving/reading clips remains responsive (<100ms typical operations on realistic clip counts).
- NFR3: Reliability: in case of any rule evaluation error, saving still succeeds (rule errors logged, not fatal).
- NFR4: Usability: tag UI is minimal, predictable, and unobtrusive; dedupe behavior visible via a small `×N` indicator or meta line.
- NFR5: Maintainability: isolated helpers for normalization, hashing, rule evaluation; defensive coding with try/catch around untrusted regex.

## 6) Success criteria

- Selecting and saving the same text twice should not create a second clip; the existing item indicates a duplicate count increment.
- Adding an auto-tag rule and saving a matching selection should result in new clips tagged accordingly.
- Filtering by a tag should show only the matching subset of clips.
- Works with the extension alone; no native helper required.

## 7) Minimal architecture overview

The new feature lives in the extension only and reuses existing files.

```mermaid
flowchart LR
  subgraph Extension
    B[background.js\n(save-selection, storage)]
    O[overlay/overlay.js\n(UI: list, settings, tags filter)]
    S[(chrome.storage.local\nclips, folders, settings, rules)]
  end

  B -->|on save| S
  B -->|apply dedupe + rules| S
  O <-->|render + filter| S
  O -->|edit rules| S
```

- Data model additions in `chrome.storage.local`:
  - Clip: `{ id, text, title, url, createdAt, updatedAt?, folderId?, starred?, hash?, dupCount?, tags?: string[] }`
  - Rules: `[{ id, type: 'url-contains'|'text-regex', pattern: string, tags: string[] }]`

## 8) High-level design

- Normalization & hashing
  - Normalize: trim, collapse internal whitespace to single spaces, lowercase.
  - Hash: fast string hash (e.g., 32-bit) stored as `hash`.
- Rule evaluation pipeline
  - For each rule, run the matcher over `clip.url` (for URL rules) or `clip.text` (for regex rules).
  - Accumulate matched tags (dedupe tags).
- UI changes
  - Overlay: add a compact tag filter (dropdown or chip list) in the toolbar.
  - Overlay settings: add a “Tag Rules” mini-editor to add/remove rules.
  - Clip item: show `dupCount` (e.g., `×3`) and tag chips (small, non-intrusive).
- Storage migration
  - On startup, ensure all clips have default fields (`dupCount = 1`, `tags = []`) if missing.

## 9) Test plan (manual, extension-only)

- Setup
  - Load the extension unpacked from `ChromeExtension/` at `chrome://extensions` (Developer Mode enabled).
  - Assign shortcuts at `chrome://extensions/shortcuts` if needed.
- Tests
  - T1 Dedup basic: Save the same selection twice on a web page → list shows one item with `×2`.
  - T2 Dedup with whitespace variations: Save text with extra spaces/newlines vs normal → still deduped.
  - T3 Tag rule (URL contains): Add rule `stackoverflow.com → tag: StackOverflow`. Save selection on a StackOverflow page → clip shows tag `StackOverflow`.
  - T4 Tag rule (regex): Add regex rule `/\bTODO\b/ → tag: Notes`. Save selection containing `TODO` → clip shows tag `Notes`.
  - T5 Tag filter: Choose tag `Notes` in the toolbar filter → only matching clips remain visible.
  - T6 Backward compatibility: Existing clips in storage remain visible; saving new ones doesn’t break old data.
  - T7 Failure handling: Add a bad regex. Save still works; an error is logged; no crash.

## 10) Milestones & timeline (indicative)

- M1 Planning & design (this document)
- M2 Storage schema update + migration helper
- M3 Dedup logic on save in `background.js`
- M4 Rules storage + evaluator
- M5 Overlay UI: tag chips + filter; settings: rules editor
- M6 Manual test pass + polish

## 11) Version control plan

- Branching: `main` for this checkpoint (planned branch `feature/dedup-autotag` for future iterations)
- Commits (at least 3 meaningful):
  - "feat(dedup): normalized hashing and dupCount on save"
  - "feat(tags): rules editor and rule evaluation on save"
  - "feat(overlay): tag filter UI and dupCount display + migration"
- PR description includes summary, screenshots/GIF of behavior.

## 12) Risks & mitigations

- Risk: Over-aggressive normalization causes false-positive dedupe.
  - Mitigation: Keep normalization simple; document rules; option to disable dedupe per rule in future.
- Risk: User-provided regex crashes matcher.
  - Mitigation: Wrap in try/catch; skip failing rules; log error.
- Risk: UI clutter.
  - Mitigation: Minimal chips and compact filter; keep settings in a popover.

## 13) Setup instructions (for checkpoint testing)

- No native helper required.
- Steps:
  1) Open Chrome → `chrome://extensions` → enable Developer Mode.
  2) Load unpacked → select `ChromeExtension/`.
  3) Assign shortcuts at `chrome://extensions/shortcuts` (Save selection; Toggle overlay).
  4) Navigate to any web page, select text, and save.
  5) Open the overlay; observe dedupe counts, tags, and tag filtering.

---

Appendix: Existing file references
- `ChromeExtension/manifest.json` — MV3 config and permissions
- `ChromeExtension/background.js` — selection handling and storage integration
- `ChromeExtension/overlay/overlay.js` — UI where new tag/dedupe indicators and rules UI will be added

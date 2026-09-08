# Calendar presentation/state display-correction schedule

Status: complete execution record  
Adopted: 2026-09-08  
Completed: 2026-09-08  
Work ID: `WHR-CAL-PRESENTATION-STATE-001`  
Canonical parent schedule: `docs/project-roadmap-2026-09-08-addendum.md`  
Canonical presentation specification: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Canonical display refinement: `docs/specs/calendar-row-rank-live-localization-2026-09-08.md`

This schedule records the completed presentation corrections discovered after the initial Calendar state/view merge. It is a bounded continuation of `WHR-CAL-PRESENTATION-STATE-001`, not a new acquisition/data-quality programme.

## 1. Required execution order

```text
1. authority/specification sync
2. current-main implementation audit
3. B+ evidence-boundary state correction
4. stream-row presentation simplification
5. shared locale/display-name layer
6. List/Filters/Month/Map integration
7. regression validators/tests
8. desktop/mobile browser verification
9. Representative Visual Audit
10. merge and post-merge verification
```

All ten steps are complete. Agents must continue to re-read the canonical files after any scope or acceptance change and before PR/merge.

## 2. Authority/specification sync

Completed outcome:

- `docs/specs/calendar-row-rank-live-localization-2026-09-08.md` is present and active;
- `AGENTS.md` points Calendar presentation agents to the refinement and this schedule;
- implementation PRs list both documents under canonical documents reviewed;
- conversation-only rules are not used as execution authority.

## 3. Current-main audit

The implementation audit covered at minimum:

```text
src/components/TimetableMeetingList.astro
src/components/MeetingStatePolicy.astro
src/components/CalendarFilters.astro
src/components/CalendarMeetingMap.astro
src/components/CalendarViewControls.astro
src/data/timetableMeetingRows.ts
src/lib/timetable/meetingLifecycleState.mjs
src/lib/timetable/meetingStreamState.mjs
src/lib/timetable/publicCoverageState.mjs
src/styles/calendar-presentation.css
src/styles/calendar-mock-v1.css
src/styles/meeting-list-compact-v1.css
relevant EN/JA Calendar pages
relevant Calendar visual-audit/check scripts
```

Correct source-local lifecycle and exact-date stream-detector behavior were preserved.

## 4. B+ evidence-boundary state correction

Implemented canonical rank boundary:

```text
B+ / A / A+ current-day with sufficient first/last evidence:
  before first -> Upcoming / 開催前
  running -> Racing now / 開催中
  after last -> Finished / 終了

B / C current-day:
  Today meeting / 本日開催
  no precise upcoming/running/finished inference from incomplete timing
```

Implemented presentation colors:

```text
B+/A/A+ before first -> warm yellow
B/C current-day -> warm yellow
B+/A/A+ running -> warm red
B+/A/A+ finished -> gray
unknown/unsupported -> neutral
```

The text label distinguishes `開催前` from `本日開催`; yellow is not a rank color.

## 5. Stream-row simplification

The standalone stream-live badge was removed.

Implemented link labels:

```text
verified live:
  EN ● Live now ↗
  JA ● 公式配信中 ↗

not verified live, official destination known:
  EN Official stream ↗
  JA 公式配信 ↗
```

Stream/site semantic actions remain present even when hrefs are equal. URL-based action deduplication was not added.

Exact-date/fail-closed detector behavior and reviewed landing-page-only public links remain unchanged.

## 6. Shared localization/display-name layer

A reviewed presentation layer is in place for:

```text
country display names by locale
authority compact labels
racecourse reviewed EN/local/JA names
name_ja review status
search aliases
```

Japanese racecourse policy:

```text
reviewed Japanese/established name
-> reviewed Japanese transliteration when appropriate
-> otherwise official Latin/English fallback
```

Machine transliteration of all foreign racecourses is prohibited. Mixed forms such as `Kocaeli競馬場` are not generated unless that exact reviewed public name exists.

## 7. Surface integration

The same reviewed resolver is used by Calendar identity surfaces including:

```text
List
Filters
Month context where applicable
Map selected/popup content
selected card
```

Known UI labels on `/ja/` are Japanese; proper nouns/recognized abbreviations may remain Latin.

## 8. Regression tests

Regression coverage includes:

```text
A+/B+ current-day upcoming/running/finished
B current-day -> Today meeting / 本日開催
C current-day -> Today meeting / 本日開催
B first-time-only does not authorize running
stream exact live label
stream known-not-live label
no standalone stream-live badge
wrong-date/stale detector fail-closed
no detector-derived direct watch URL
same stream/site href keeps both actions
JA known UI translation
JA country localization
JA reviewed racecourse name
JA Latin fallback for unreviewed foreign venue
List/Filters/Map naming parity
```

## 9. Browser and visual acceptance

Completed representative matrix:

```text
EN desktop List
JA desktop List
EN mobile 393×852 List
JA mobile 393×852 List
Month
Map
current-day B/C example
current-day B+ or higher upcoming example
running + verified-live presentation path
future/non-live example
```

Verified visual observations:

- no `Racing now / Official stream live / Live now` triple emphasis;
- B/C current-day uses `Today meeting / 本日開催`;
- B+ or higher before first uses `Upcoming / 開催前`;
- running remains visually distinct;
- Japanese UI labels/country names are localized;
- reviewed racecourse naming follows the canonical fallback order;
- no horizontal overflow at 393×852;
- an actual meeting row remains in the first mobile List viewport when meetings exist.

## 10. Merge gate

This display-correction unit is complete:

- canonical refinement and schedule merged;
- implementation preserved acquisition/canonical/rank/source/coordinate boundaries;
- B+ evidence boundary implemented and tested;
- B/C current-day `Today meeting / 本日開催` implemented and tested;
- redundant standalone stream-live badge removed;
- exact live link text is `● Live now` / `● 公式配信中`;
- same-href stream/site actions are not deduplicated;
- locale-aware country/authority/racecourse presentation is shared across Calendar surfaces;
- automatic Katakana transliteration is absent;
- EN/JA desktop/mobile browser checks passed;
- Representative Visual Audit screenshots were inspected;
- PR #920 merged as `b6879d0074d06f8e4aadbb7f31138634208757cd`;
- exact merge SHA post-merge validation and Cloudflare Pages deployment passed.

## 11. Ongoing agent rule

For every subsequent Calendar-visible PR:

1. begin with `AGENTS.md` and `START-HERE.md`;
2. re-read `docs/governance/document-authority.md`;
3. re-read `docs/project-roadmap-2026-09-08-addendum.md`;
4. re-read both Calendar presentation specifications and this completed execution record when Calendar-visible behavior is affected;
5. inspect current `main` before editing;
6. if behavior/acceptance changes, update canonical authority first;
7. re-read the documents before opening/updating a PR and before merge;
8. after merge, verify the exact merge SHA and active Work ID before continuing.

Agent memory, screenshots, issue comments, and conversation history may explain context but are not substitutes for these repository documents.

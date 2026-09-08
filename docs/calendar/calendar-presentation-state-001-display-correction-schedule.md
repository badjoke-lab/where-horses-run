# Calendar presentation/state display-correction schedule

Status: complete execution record  
Adopted: 2026-09-08  
Completed: 2026-09-08  
Base Work ID: `WHR-CAL-PRESENTATION-STATE-001`  
Completed amendment Work ID: `WHR-CAL-PRESENTATION-COLOR-001`  
Canonical parent schedule: `docs/project-roadmap-2026-09-08-addendum.md`  
Canonical presentation specification: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Canonical display refinement: `docs/specs/calendar-row-rank-live-localization-2026-09-08.md`

This schedule records the completed presentation corrections discovered after the initial Calendar state/view merge and the completed bounded color-state amendment that keeps `Today meeting / 本日開催` distinct from precise `Upcoming / 開催前` in both List and Map. It is presentation-only work, not a new acquisition/data-quality programme.

## 1. Required execution order

Base correction:

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

All ten base steps are complete. Agents must continue to re-read the canonical files after any scope or acceptance change and before PR/merge.

Color-state amendment:

```text
1. update canonical display refinement with distinct List/Map state colors
2. split Calendar List `upcoming` and `today` selectors
3. preserve Calendar Map `today` as a first-class status key
4. add `Today meeting / 本日開催` Map legend and marker treatment
5. lock List + Map behavior with regression validation
6. inspect EN/JA desktop + 393×852 List/Map screenshots
7. merge only after exact-head CI and visual acceptance
8. verify exact merge SHA after merge
```

All eight amendment steps are complete.

## 2. Authority/specification sync

Completed outcome:

- `docs/specs/calendar-row-rank-live-localization-2026-09-08.md` is present and active;
- `AGENTS.md` points Calendar presentation agents to the refinement and this schedule;
- implementation PRs list both documents under canonical documents reviewed;
- conversation-only rules are not used as execution authority;
- the refinement explicitly fixes `#fff9e9` for precise current-day `Upcoming / 開催前`;
- it fixes `#fffcf4` for day-only B/C `Today meeting / 本日開催`;
- it requires the same distinction on Calendar Map and forbids collapsing `today` into `upcoming`.

## 3. Current-main audit

The implementation audit covered at minimum:

```text
src/components/TimetableMeetingList.astro
src/components/MeetingStatePolicy.astro
src/components/CalendarFilters.astro
src/components/CalendarMeetingMap.astro
src/components/RacecourseMap.astro
src/components/CalendarViewControls.astro
src/data/timetableMeetingRows.ts
src/lib/timetable/meetingLifecycleState.mjs
src/lib/timetable/meetingPresentationState.mjs
src/lib/timetable/meetingStreamState.mjs
src/lib/timetable/publicCoverageState.mjs
src/styles/calendar-presentation.css
src/styles/calendar-mock-v1.css
src/styles/meeting-list-compact-v1.css
relevant EN/JA Calendar pages
relevant Calendar visual-audit/check scripts
```

Correct source-local lifecycle and exact-date stream-detector behavior are preserved. The amendment audit found two presentation defects only: List used one warm-yellow selector for `upcoming` and `today`, and Map collapsed `today` into the `upcoming` status key.

## 4. B+ evidence-boundary state correction

Canonical rank boundary remains:

```text
B+ / A / A+ current-day with sufficient first/last evidence:
  before first -> Upcoming / 開催前
  running -> Racing now / 開催中
  after last -> Finished / 終了

B / C current-day:
  Today meeting / 本日開催
  no precise upcoming/running/finished inference from incomplete timing
```

Implemented color-state amendment:

```text
Calendar List
B+/A/A+ current day, before first -> #fff9e9
B/C current-day                  -> #fffcf4
B+/A/A+ running                  -> #fff7f6
B+/A/A+ finished                 -> #f6f7f8, attenuated
unknown/unsupported              -> #ffffff

Calendar Map
running       -> #c40000
upcoming      -> #d18a00
Today meeting -> #fffcf4 with dark warm outline/ring
future        -> #111111
ended         -> #666666
```

`Today meeting / 本日開催` is not an alias of `Upcoming / 開催前`. It is a separate presentation state in List selectors, Map state keys, legend, and selected-card status. These colors are not rank colors.

A future/generic lifecycle value of `upcoming` does not by itself authorize the `#fff9e9` List background; the current-day relation is also required.

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

The same presentation-state model drives List and Calendar Map. Map does not invent or collapse a state solely for marker convenience.

Known UI labels on `/ja/` are Japanese; proper nouns/recognized abbreviations may remain Latin.

## 8. Regression tests

Base regression coverage includes:

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

The color-state amendment additionally locks:

```text
List upcoming + today -> #fff9e9
List day-only today -> #fffcf4
List future/generic upcoming is not highlighted solely from lifecycle
Map day-only today -> distinct `today` key
Map today marker -> #fffcf4 + dark warm outline/ring
Map upcoming marker -> #d18a00
Map legend contains both Today meeting / 本日開催 and Upcoming / 開催前
selected Map card keeps the same presentation-state label as List
```

## 9. Browser and visual acceptance

Representative matrix covered:

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

The color-state amendment was inspected in the Representative Visual Audit before merge and again on the exact merge SHA. Verified observations:

- precise `Upcoming / 開催前` and day-only `Today meeting / 本日開催` are independent presentation states;
- precise upcoming retains the stronger `#fff9e9` List treatment and orange Map marker;
- day-only today uses the paler `#fffcf4` treatment and distinct Map key/marker outline;
- Map legend/pins preserve both states independently;
- running/ended/neutral colors retain their established meanings;
- no horizontal overflow was observed at 393×852;
- an actual meeting row remains in the first mobile List viewport when meetings exist;
- the old triple-emphasis live presentation does not return.

## 10. Merge gate

The base display-correction unit is complete:

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

The `WHR-CAL-PRESENTATION-COLOR-001` amendment is complete:

- canonical refinement contains the exact List/Map color split;
- runtime List and Map use distinct `upcoming` and `today` states;
- regression validation passed;
- PR #923 exact head `932bb4147c52fba2990751fdbd58b68a4c30cb4b` passed Race Acquisition Check, Calendar unified official refresh, and Representative Visual Audit before merge;
- PR #923 was squash merged as `305f8fa80ee1d1b5a232387049c38c2de0c38fcb`;
- exact merge-SHA Race Acquisition Check run `34203474219` completed successfully;
- exact merge-SHA Representative Visual Audit run `34203474118` completed successfully and artifact `10046820939` was inspected;
- Cloudflare Pages check `101987713045` deployed exact commit `305f8fa` successfully with deployment id `1ebbcd9c-96f6-455a-ab87-994f96e1f2d8` and preview `https://1ebbcd9c.where-horses-run.pages.dev`;
- subsequent generated timetable refreshes remain a separate Calendar data lane and do not reopen this presentation amendment.

## 11. Ongoing agent rule

For every subsequent Calendar-visible PR:

1. begin with `AGENTS.md` and `START-HERE.md`;
2. re-read `docs/governance/document-authority.md`;
3. re-read `docs/project-roadmap-2026-09-08-addendum.md`;
4. re-read both Calendar presentation specifications and this execution record when Calendar-visible behavior is affected;
5. inspect current `main` before editing;
6. if behavior/acceptance changes, update canonical authority first;
7. re-read the documents before opening/updating a PR and before merge;
8. after merge, verify the exact merge SHA and active Work ID before continuing.

Agent memory, screenshots, issue comments, and conversation history may explain context but are not substitutes for these repository documents.

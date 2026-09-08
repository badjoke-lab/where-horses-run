# Where Horses Run project roadmap — 2026-09-08 Calendar state/view addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-08  
Last amended: 2026-09-08  
Supersedes for current execution state: `docs/project-roadmap-2026-09-06-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Calendar presentation authority: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Calendar display/context refinement: `docs/specs/calendar-row-rank-live-localization-2026-09-08.md`  
Calendar presentation schedule: `docs/calendar/calendar-presentation-state-001-display-correction-schedule.md`

This addendum preserves the map-first site programme and the independent Calendar quality/coverage lane. `UI-006` and `UI-007` are complete and `UI-008` remains the current primary UI Work ID. A bounded Calendar presentation correction, `WHR-CAL-PRESENTATION-CONTEXT-001`, is active and takes execution priority before UI-008 runtime work resumes.

It does not change acquisition authority, reviewed public ranks, source promotion rules, racecourse coordinates, or automatic-publication policy.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Primary product/UI lane: map_first_site_ui
Completed UI Work ID: UI-006
Completed UI Work ID: UI-007
Current UI Work ID: UI-008 [runtime paused during bounded Calendar correction]
Next UI Work ID: UI-009
Parallel Calendar quality lane: calendar_quality_and_coverage
Completed Calendar presentation correction: WHR-CAL-PRESENTATION-STATE-001
Completed Calendar color-state amendment: WHR-CAL-PRESENTATION-COLOR-001
Active Calendar context-state amendment: WHR-CAL-PRESENTATION-CONTEXT-001
Automatic publication: disabled
Human review bypass: prohibited
```

`UI-008` remains the current primary UI Work ID. `UI-006` delivered the Racecourses primary index/search surface and `UI-007` delivered the shared bilingual racecourse-detail composition. Before UI-008 runtime work continues, the Calendar context-state amendment must remove the remaining Today/Calendar/Map state inconsistencies and pass exact-head plus post-merge visual/deployment verification.

## Why the active context-state amendment exists

The earlier Calendar corrections correctly established:

1. source/venue-local lifecycle truth independent of display timezone;
2. exact-date fail-closed official stream state independent of meeting lifecycle;
3. List/Month/Map as presentations of the same reviewed public meeting set;
4. B+ as the evidence boundary for precise current-day lifecycle presentation;
5. `Today meeting / 本日開催` as a separate B/C current-day presentation state;
6. distinct List colors (`Upcoming #fff9e9`, `Today meeting #fffcf4`) and Map markers.

A later public screenshot audit exposed that the state split was not propagated through the whole UI. Today summary/group headings still merged `Upcoming` and `Today meeting`, current-day rows could fall into `Scheduled`, and shared Map legend/selected-state logic could still expose an invalid current-day category.

Therefore `WHR-CAL-PRESENTATION-CONTEXT-001` is a bounded presentation correction, not a data/acquisition change.

## Required execution order for WHR-CAL-PRESENTATION-CONTEXT-001

```text
1. specification/governance/state-pointer update
2. merge documentation authority before runtime changes
3. re-read merged AGENTS / START-HERE / governance / roadmap / Calendar specs / schedule
4. audit current main Today + Calendar + Map implementation
5. centralize context-aware presentation-state consumption
6. split Today summary and List group headings
7. remove current-day Scheduled fallback
8. define Today / Tomorrow / 7-days context behavior
9. define Calendar selected-today vs selected-future behavior
10. synchronize Map marker / legend / selected card with List state
11. extend validators/regression tests
12. extend semantic Representative Visual Audit
13. inspect EN/JA desktop + 393×852 screenshots
14. merge only after exact-head acceptance
15. verify exact merge SHA CI + Cloudflare deploy
16. re-read authority and resume UI-008
```

## Current-day presentation contract

B+/A/A+ with sufficient reviewed first/last timing:

```text
before first -> Upcoming / 開催前
within window -> Racing now / 開催中
after last -> Finished / 終了
```

B/C or another reviewed day-level-only current-day meeting:

```text
Today meeting / 本日開催
```

A current-day B/C meeting must not become `Scheduled / 開催予定` merely because precise timing evidence is absent.

## Today surface contract

### Today range

Only these public state groups are valid:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

Forbidden:

```text
Upcoming / racing today
開催前・本日開催
Scheduled / 開催予定 as a current-day group
```

### Tomorrow range

Tomorrow meetings are future schedule items:

```text
Scheduled / 開催予定
```

### Seven-day range

```text
current day -> current-day presentation states
later days -> Scheduled / 開催予定
```

Future days must not be flattened into the current-day `Upcoming` bucket.

## Calendar date-focus contract

Calendar selected today:

```text
Racing now / Upcoming / Today meeting / Finished
```

Calendar selected future date:

```text
Scheduled / 開催予定
```

List and Map consume the same presentation state for the same meeting/date context.

## List and Map colors

Calendar/Today List:

```text
running   #fff7f6
upcoming  #fff9e9
today     #fffcf4
ended     #f6f7f8
future    #ffffff
unknown   #ffffff
```

Calendar/Today Map:

```text
running   #c40000
upcoming  #d18a00
today     #fffcf4 + dark warm outline/ring
future    #111111
ended     #666666
```

The two warm states remain deliberately distinct. They are presentation states, not rank colors.

## Map legend contract

Today Map and Calendar Map with today selected:

```text
Racing now
Upcoming
Today meeting
Finished
```

Do not show `Scheduled` in this current-day legend.

Calendar Map with a future date selected:

```text
Scheduled / 開催予定
```

Do not show current-day state categories for a future selected date.

Map selected-card status must equal the corresponding List row state.

## Shared presentation-state consumer rule

The following surfaces must consume one context-aware presentation-state model rather than maintain independent state dictionaries:

```text
Today summary counts
Today/List state headings
row state badge/background
Calendar List
Map marker
Map legend
Map selected card
```

Underlying lifecycle state, display timezone, official stream state, and acquisition/publication rank remain separate dimensions.

## Regression gate

Required new assertions include:

```text
no `Upcoming / racing today`
no `開催前・本日開催`
Today range current-day rows cannot group as Scheduled
B/C current-day cannot collapse into Upcoming from partial timing
Today Map legend excludes Scheduled
Calendar selected-today Map legend excludes Scheduled
Calendar selected-future Map legend excludes current-day states
Map selected card equals List presentation state
future rows do not receive #fff9e9 solely from later start time
```

All previous lifecycle/timezone, stream fail-closed, reviewed-name, same-href stream/site, direct-watch-URL, B+ boundary, and mobile-density regression requirements remain in force.

## Representative Visual Audit gate

Visible changes require actual semantic screenshot/browser inspection, not only artifact existence or overflow checks.

Minimum matrix for the active amendment:

```text
EN desktop Today List
JA desktop Today List
EN mobile 393×852 Today List
JA mobile 393×852 Today List
EN/JA Today Map
EN/JA Calendar selected-today List + Map
EN/JA Calendar selected-future List + Map
Month representative view
```

The reviewer must explicitly verify that:

- `Upcoming` and `Today meeting` are separate headings/counts;
- `#fff9e9` and `#fffcf4` remain distinct;
- Today current-day view has no Scheduled group;
- Today/current-day Map legend has no Scheduled item;
- future Calendar Map uses Scheduled rather than current-day states;
- Map selected status matches List;
- EN/JA semantics match;
- no horizontal overflow occurs at 393×852;
- actual meeting rows remain reachable in the first List viewport where meetings exist.

## Previous completion evidence retained

`WHR-CAL-PRESENTATION-STATE-001` remains complete for its delivered scope, including PR #920 merge `b6879d0074d06f8e4aadbb7f31138634208757cd` and exact-SHA post-merge validation/deployment.

`WHR-CAL-PRESENTATION-COLOR-001` remains complete for the row/marker color split delivered in PR #923 merge `305f8fa80ee1d1b5a232387049c38c2de0c38fcb`, with exact merge-SHA Race Acquisition Check `34203474219`, Representative Visual Audit `34203474118`, and Cloudflare deployment `1ebbcd9c-96f6-455a-ab87-994f96e1f2d8`.

The active context-state amendment exists because those earlier acceptance criteria did not sufficiently cover Today grouping and context-sensitive legend semantics.

## Ongoing agent execution rule

For every subsequent UI or Calendar PR:

1. start from `AGENTS.md` and `START-HERE.md`;
2. re-read `docs/governance/document-authority.md` and this active roadmap addendum;
3. read the applicable parent Calendar specification, display/context refinement, and active schedule;
4. compare current runtime behavior to those documents before editing;
5. if scope/behavior changes, update authority first;
6. re-read after relevant `main` movement;
7. re-read before PR creation/material update and before merge;
8. after merge, verify exact merge SHA/deployment and re-read current/next Work ID before continuing.

Conversation history is not execution authority.

## Next work

The primary UI lane remains:

```text
UI-006 — Racecourses primary index/search UI  [complete]
UI-007 — racecourse-detail composition         [complete]
UI-008 — secondary reference-page simplification [current; runtime paused]
UI-009 — EN/JA responsive release verification   [next]
```

Execution priority before UI-008 resumes:

```text
WHR-CAL-PRESENTATION-CONTEXT-001 — Today/Calendar/List/Map context-state correction [active]
```

Calendar quality/coverage continues independently under its canonical contracts and acquisition-control-plane rules.

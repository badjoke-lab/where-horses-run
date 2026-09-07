# Where Horses Run project roadmap — 2026-09-08 Calendar state/view addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-08  
Supersedes for current execution state: `docs/project-roadmap-2026-09-06-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Calendar presentation authority: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`

This addendum preserves the map-first site programme and the independent Calendar quality/coverage lane while inserting a bounded Calendar presentation/state correction before further Calendar-visible behavior is treated as stable.

It does not change acquisition authority, reviewed public ranks, source promotion rules, racecourse coordinates, or automatic-publication policy.

## Current stage

```text
Current stage: reviewed_incremental_maintenance
Primary product/UI lane: map_first_site_ui
Current UI Work ID: UI-006
Next UI Work ID: UI-007
Parallel Calendar quality lane: calendar_quality_and_coverage
Active Calendar presentation correction: WHR-CAL-PRESENTATION-STATE-001
Automatic publication: disabled
Human review bypass: prohibited
```

`UI-006` remains the current primary UI Work ID. This addendum does not renumber Racecourses/racecourse-detail work. The Calendar correction is a bounded parallel lane because the defect affects shared Calendar/Today meeting-state and stream semantics and must be fixed against canonical specification rather than conversation memory.

## Why this addendum exists

The 2026-09-06 UI specification correctly established a rolling 30-day Calendar discovery scope, List-first mobile behavior, and shared meeting truth. Subsequent implementation/audit work exposed two specification gaps and one presentation mismatch:

1. meeting lifecycle truth must be explicitly separated from the selected display timezone;
2. official-stream state must be explicitly separated from meeting lifecycle state and bound fail-closed to the expected event/date identity;
3. a rolling 30-day browsing scope does not require the List view to render the entire 30-day set at once; List is now one-day-at-a-time, with Month providing compact date overview/navigation and Map remaining geographic discovery.

The canonical correction is `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`.

## Required execution order

Do not skip directly to CSS or a visual-only patch. Execute this Work ID in this order:

```text
1. specification/governance update
2. existing implementation audit
3. meeting lifecycle correction
4. official stream-state correction
5. state × stream × timezone regression tests
6. Calendar List / Month / Map structure correction
7. desktop + mobile presentation refinement
8. Representative Visual Audit and browser interaction review
9. merge only after acceptance conditions are demonstrated
```

The documentation/governance step is a preceding docs change. Code implementation begins only after that authority is merged.

## Step 1 — specification/governance update

Required repository changes:

```text
AGENTS.md
docs/governance/document-authority.md
START-HERE.md
docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md
docs/project-roadmap-2026-09-08-addendum.md
scripts/check-project-governance-docs.mjs
```

Completion conditions:

- repository agents are instructed to read `START-HERE.md`, governance, latest roadmap, and applicable feature spec before work;
- agents re-read authority after scope changes, before PR, before merge, and after relevant main movement;
- current roadmap pointers no longer stop at 2026-09-05/2026-08-25;
- governance validator fails if the new entry/spec/schedule markers disappear;
- no internal-only memo is copied into the public repository.

## Step 2 — existing implementation audit

Before modifying runtime behavior, inspect at minimum:

```text
TimetableMeetingList meeting/source timezone attributes and projection code
meeting-state calculation shared by Calendar/Today/map surfaces
CalendarLivePlayers and /api/live-status binding behavior
live detector mapping and freshness behavior
Calendar List/Map view state and URL state
current visual-audit workflow/screenshot matrix
```

Record which existing behavior already satisfies the new contract and which behavior is actually defective. Do not rewrite correct code merely because the specification became more explicit.

## Step 3 — meeting lifecycle correction

Required outcome:

- lifecycle is decided from reviewed venue/source-local date/time plus source timezone converted to instants;
- selected display timezone affects formatting/grouping only, not upcoming/running/finished truth;
- missing/ambiguous timing fails closed;
- cross-midnight behavior is explicit and tested; presentation code does not invent an end date.

## Step 4 — official stream-state correction

Required outcome:

- meeting `running` and stream `live` remain independent states;
- verified live requires the configured detector and expected source/event date identity;
- stale/mismatched/unavailable detector data fails closed;
- an official destination that is known but not verified live is not labeled live;
- no new media publication/embed permission is introduced by this Work ID.

## Step 5 — regression tests

Required matrix includes:

```text
upcoming/running/finished × supported display timezones
running × verified-live / known-not-live / no-verified-stream
wrong-date shared detector
stale previous-live payload
missing race-time evidence
cross-midnight representable/neutral behavior
```

A timezone-selector change must not be able to turn the same current meeting from running to upcoming/finished merely by changing display projection.

## Step 6 — List / Month / Map

Calendar remains bounded to the rolling 30-day public browsing window.

```text
List  = one focused day, one meeting per row
Month = compact overview/date navigation for the rolling window
Map   = geographic discovery from the same filtered public meeting records
```

Filters/timezone/date/view state remain synchronized. No view may create a second meeting set or map-only truth.

## Step 7 — desktop/mobile presentation

Mobile acceptance is information-density driven, not a scaled desktop layout.

At 393×852, when the focused date has meetings, the first Calendar List viewport must contain an actual meeting row. Nested horizontal gutters, excessive hero copy, repeated toolbar labels, and large inactive map surfaces are not acceptable reasons to push the list below the first viewport.

Desktop must preserve clear grouping and useful density without leaving large dead regions.

## Step 8 — Representative Visual Audit

Visible changes require actual screenshot/browser inspection. CI success alone is not acceptance.

Minimum representative set:

```text
EN desktop: List / Month / Map
JA desktop: representative Calendar
EN mobile 393×852: List / Month / Map
JA mobile: representative Calendar
```

Also verify view switching, date focus, timezone change, filters, map/list synchronization, and no horizontal overflow.

## Step 9 — merge gate

`WHR-CAL-PRESENTATION-STATE-001` is complete only when all of the following are true:

- canonical spec and active schedule are merged and referenced by repository agent instructions;
- implementation audit is recorded;
- lifecycle truth is independent of display timezone;
- stream state is independent of lifecycle state and fail-closed on detector mismatch/staleness;
- List is one-day-at-a-time while rolling 30 days remains the Calendar browsing scope;
- Month is present as the compact overview/date-navigation role;
- state × stream × timezone regression tests pass;
- EN/JA desktop/mobile browser interaction checks pass;
- Representative Visual Audit screenshots have been manually inspected;
- 393×852 List first viewport shows an actual meeting row when meetings exist;
- acquisition/canonical/rank/coordinate/publication boundaries were not silently changed.

## Ongoing agent execution rule

For every subsequent UI or Calendar PR:

1. start from `AGENTS.md` and `START-HERE.md`;
2. re-read `docs/governance/document-authority.md` and the active roadmap addendum;
3. read the applicable canonical feature contract/specification;
4. compare intended runtime behavior to those documents before editing;
5. if scope/behavior changes, update authority before continuing;
6. re-read before PR and before merge;
7. after merge, confirm the active Work ID/state before beginning the next unit.

Conversation history is not execution authority.

## Next work

After `WHR-CAL-PRESENTATION-STATE-001` completes, the primary UI lane remains:

```text
UI-006 — Racecourses primary index/search UI
UI-007 — racecourse-detail composition
UI-008 — secondary reference-page simplification
UI-009 — EN/JA responsive release verification
```

Calendar quality/coverage continues independently under its canonical contracts and acquisition-control-plane rules.

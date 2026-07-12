# Calendar Public v1 surface audit

Status: source and rendered-fixture audit foundation ready  
Work ID: `WHR-CAL-PUBLIC-V1`  
Audit ID: `PUBLIC-V1-SURFACE-AUDIT-01`  
Last reviewed: 2026-07-12

## Purpose

This audit is the first Calendar Public v1 implementation unit.

It verifies that Calendar, Today, and Tomorrow use the completed Dynamic Dates contract and the shared public meeting-list boundary before the project proceeds to approved-pilot record reconciliation and final release QA.

The reviewed public routes are:

```text
/calendar/
/ja/calendar/
/today/
/ja/today/
/tomorrow/
/ja/tomorrow/
```

## Finding: validator drift

The public pages have already moved to:

```text
getTimetableDateContext
+ CalendarDateStatus
+ TimetableMeetingList
```

The older source-level UI validators still described the fixed June calendar and the pre-shared-component page implementation. They were no longer suitable as Public v1 evidence.

This unit replaces those historical assumptions in:

```text
scripts/check-calendar-30d-timetable-ui.mjs
scripts/check-today-timetable-ui.mjs
scripts/check-tomorrow-timetable-ui.mjs
```

The revised validators check the current shared-component architecture, bilingual route pairing, explicit reference date and timezone, rank-aware list fields, official-source confirmation, and prohibited public fields.

## One meeting per list row

All six routes delegate list rendering to `src/components/TimetableMeetingList.astro`.

The list contract is:

```text
one TimetableMeetingRow
-> one <li class="meeting-card">
```

Calendar may group rows by date, but it must not expand race-by-race programme rows in a Calendar, Today, or Tomorrow list.

## Rank-aware list boundary

The shared list applies:

```text
C   -> no first or last race time
B   -> first race time
B+  -> first and last race time
A   -> first and last race time; race-by-race times remain on meeting detail
A+  -> first and last race time; approved programme summary remains on meeting detail
```

Every list row may also show:

- racecourse;
- authority or racing system;
- country or region;
- public rank;
- source status;
- last checked date;
- meeting detail link;
- official source link.

## Dynamic and rendered evidence

The dedicated workflow runs the current source-level audit and then rebuilds the six routes for two reproducible fixtures:

```text
2026-06-06 / Asia/Tokyo
expected: current_window_available

2026-07-01 / Asia/Tokyo
expected: stale_generation_with_window_records
```

The rendered checker confirms the reference date, timezone, dynamic titles, reviewed meeting visibility, safe empty Tomorrow handling, and removal of fixed-June leakage from the active window.

## Public exclusions

Calendar, Today, and Tomorrow do not display:

- participant lists or names;
- racecard bodies;
- odds or betting guidance;
- results, payouts, or predictions;
- raw source content;
- embedded video or direct stream URLs.

## Preserved boundaries

This audit does not write canonical or public data.

It does not enable automatic acquisition, approval, promotion, or unattended publication.

## Next unit

After this surface audit, Calendar Public v1 proceeds to maintained approved-pilot record reconciliation:

```text
visible source
+ coverage
+ freshness
+ public rank
+ honest partial-coverage state
```

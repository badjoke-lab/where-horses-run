# Public timetable list contract

Status: roadmap PR-9  
Scope: shared filters and scoped list component only

## Purpose

This contract defines how public timetable meeting-list data can be reused by pages without changing page-specific layout decisions.

The contract is intentionally separate from country and racecourse page insertion. Those pages may use this later, but they are not modified by this PR.

## Source of truth

All list surfaces must read from:

```text
data/generated/timetable/public/meeting-list.json
```

through:

```text
src/lib/timetable/publicTimetableViewModel.ts
src/lib/timetable/publicTimetableFilters.ts
```

Pages must not directly import legacy timetable JSON, normalized samples, source snapshots, or canonical data.

## Filters

`src/lib/timetable/publicTimetableFilters.ts` exposes:

```text
getPublicTimetableRowsForDate(date)
getPublicTimetableRowsByCountry(country_id)
getPublicTimetableRowsByRacecourse(racecourse_id)
getPublicTimetableRowsByScope(scope)
groupPublicTimetableRowsByDate(rows)
```

The shared scope type supports:

```text
all
date
country
racecourse
```

## Display rules

List surfaces are meeting-level only.

```text
C   meeting / racecourse / source only
B   first race time may be shown
B+  first and last race time may be shown
A   detail link may be shown, but no race rows in list
A+  detail link may be shown, but no race rows in list
```

The list contract must not expose:

```text
race rows
race names
distance
surface
course
entries
odds
results
payouts
predictions
tips
```

Those belong only to approved public detail pages where policy allows them.

## Scoped component

`src/components/PublicTimetableScopedList.astro` is a reusable section-level component.

It accepts:

```text
scope
heading
intro
lang
limit
emptyLabel
```

It is intended for later use by:

```text
country timetable section
racecourse timetable section
other scoped timetable sections
```

## Non-goals

This PR does not:

- insert the component into country pages
- insert the component into racecourse pages
- migrate meeting detail pages
- change source fetching
- delete legacy input files

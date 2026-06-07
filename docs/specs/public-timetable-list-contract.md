# Public timetable list contract

Status: PR-260 contract foundation  
Last updated: 2026-06-08

This document defines the reusable list contract for Where Horses Run timetable surfaces.

The contract is intentionally created before country and racecourse page insertion. Country and racecourse pages may use this later, but they are not modified in this PR.

---

## Source of truth

Public list components must read from:

```text
data/generated/timetable/public/meeting-list.json
```

through:

```text
src/lib/timetable/publicTimetableViewModel.ts
src/lib/timetable/publicTimetableFilters.ts
```

They must not read source snapshots, manual seed files, normalized samples, or canonical data directly.

---

## Reusable filter API

`src/lib/timetable/publicTimetableFilters.ts` exposes:

- `getPublicTimetableRowsForDate(date)`
- `getPublicTimetableRowsByCountry(countryId)`
- `getPublicTimetableRowsByRacecourse(racecourseId)`
- `getPublicTimetableRowsByDateRange({ startDate, endDate })`
- `getPublicTimetableRowsForScope(scope)`
- `groupPublicTimetableRowsByDate(rows)`
- `limitPublicTimetableRows(rows, limit)`
- `sortPublicTimetableRows(rows)`

These helpers return publication-policy-resolved public rows only.

---

## Display boundary

Any list surface using this contract must keep one row or card per meeting.

Allowed list fields:

- date
- racecourse
- authority / system
- country when applicable
- effective public rank
- first race time when rank is B or higher
- last race time when rank is B+ or higher
- meeting detail link when `detail_path` exists
- official source link
- source status / last checked metadata

Forbidden list fields:

- race-by-race timetable rows
- race names
- distance lists
- surface/course lists
- entries
- runners
- horses
- jockeys
- trainers
- odds
- results
- payouts
- predictions or tips
- raw source page content

A/A+ list rows must not expand race-level data. A+ programme-summary fields belong on meeting detail pages only.

---

## Scoped component contract

`src/components/PublicTimetableScopedList.astro` accepts:

```ts
type Props = {
  rows: readonly PublicTimetableMeetingRow[];
  lang?: 'en' | 'ja';
  headingId?: string;
  emptyLabel?: string;
  limit?: number;
};
```

The component does not fetch data by itself. Parent pages decide the scope by calling the public filter helpers.

Initial intended future use:

```text
country page -> getPublicTimetableRowsByCountry(country_id)
racecourse page -> getPublicTimetableRowsByRacecourse(racecourse_id)
```

Country and racecourse insertion may be delayed until those page specifications are stable.

---

## Non-goals in this PR

This PR does not change:

- `/countries/{slug}/`
- `/ja/countries/{slug}/`
- `/tracks/{slug}/`
- `/ja/tracks/{slug}/`
- `/timetable/meetings/{meeting_id}/`

This PR also does not add source acquisition, canonical conversion changes, public JSON generation changes, or legacy input deletion.

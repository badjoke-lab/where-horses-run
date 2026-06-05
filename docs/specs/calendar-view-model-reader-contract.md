# Calendar view model reader contract

Status: draft foundation  
Last updated: 2026-06-05

This specification defines the public-safe reader/helper contract that projects Normalized Timetable Record data into monthly and day calendar meeting summaries.

It does not add real meeting records, calendar UI changes, adapters, scrapers, parsers, runtime fetch logic, scheduler logic, live source fetching, racecards, odds, results, payouts, predictions, tips, full entries, raw source body/html, or private/internal notes.

---

## 1. Purpose

The calendar view model reader sits between the [normalized timetable output schema](normalized-timetable-output-schema.md) and public monthly/day calendar display.

It answers this public-safe display question:

```text
Which meeting-level summaries can the calendar show for a date or date range, and which official source should users use for confirmation?
```

The reader must preserve source and route provenance while enforcing capability-rank display limits before any monthly or day calendar surface consumes the data.

---

## 2. Input contract

The reader accepts a normalized timetable file or an array of normalized timetable records. The current placeholder file is `data/generated/normalized-timetable.json`, and the schema is `data/generated/normalized-timetable.schema.json`.

Input records must conform to the Normalized Timetable Record shape:

```ts
type NormalizedTimetableRecord = {
  meeting_id: string;
  country_id: string;
  authority_id: string;
  racecourse_id: string;
  date: string;
  timezone: string;
  source_id: string;
  route_id: string | null;
  source_status: "verified" | "partial" | "not_verified" | "stale" | "unavailable";
  capability_rank: "C" | "B" | "B+" | "A";
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  last_checked_date: string | null;
  display_status: "displayable" | "partial" | "hidden" | "stale" | "unavailable";
  notes: string;
};
```

---

## 3. Output contract

Calendar meeting summaries are display-safe meeting-level projections only. They contain exactly the public summary fields needed by monthly and day calendar views:

```ts
type CalendarMeetingSummary = {
  meeting_id: string;
  country_id: string;
  authority_id: string;
  racecourse_id: string;
  date: string;
  timezone: string;
  source_id: string;
  route_id: string | null;
  source_status: "verified" | "partial" | "not_verified" | "stale" | "unavailable";
  capability_rank: "C" | "B" | "B+" | "A";
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  last_checked_date: string | null;
  display_status: "displayable" | "partial" | "hidden" | "stale" | "unavailable";
  notes: string;
};
```

The summary contract intentionally excludes race-by-race fields, entries, runners, odds, results, payouts, predictions, tips, racecard bodies, raw source markup, and private/internal notes.

---

## 4. Display rules

The reader must apply capability-rank rules before returning summaries:

| Capability rank | Monthly/day calendar summary rule |
| --- | --- |
| `C` | Do not expose `first_race_time_local` or `last_race_time_local`; both values must be returned as `null`. |
| `B` | Expose `first_race_time_local` only when present; `last_race_time_local` must be returned as `null`. |
| `B+` | Expose `first_race_time_local` and `last_race_time_local` when present. |
| `A` | Monthly/day summaries expose only summary fields. Do not expose race-by-race detail. Summary first/last race times may be returned when present. |

The reader must not infer missing race times. If a normalized record has `null`, the summary keeps `null`.

---

## 5. Helper functions

This contract lives at `docs/specs/calendar-view-model-reader-contract.md`. The TypeScript helper lives at `src/lib/timetable/calendar-view-model.ts`.

Public helper functions:

- `toCalendarMeetingSummary(record)` projects one normalized record into one display-safe meeting summary.
- `createCalendarMeetingSummaries(records)` projects and sorts an array of normalized records.
- `readCalendarMeetingSummariesFromNormalizedTimetable(file)` reads the `records` array from a normalized timetable file object and returns sorted summaries.
- `filterCalendarMeetingSummariesByDate(summaries, date)` returns summaries for one `YYYY-MM-DD` date.
- `filterCalendarMeetingSummariesByDateRange(summaries, startDate, endDate)` returns summaries between inclusive `YYYY-MM-DD` dates.
- `groupCalendarMeetingSummariesByDate(summaries)` returns summaries keyed by local meeting date.
- `sortCalendarMeetingSummaries(summaries)` sorts by date, country, racecourse, first race time when present, then meeting id.

---

## 6. Sorting and grouping

Calendar summaries should be sorted deterministically by:

1. `date` ascending;
2. `country_id` ascending;
3. `racecourse_id` ascending;
4. `first_race_time_local` ascending when present, with missing times after present times for otherwise identical date/country/racecourse groups;
5. `meeting_id` ascending as a stable tie-breaker.

Date-range filtering is inclusive because calendar views commonly request closed monthly/day windows.

---

## 7. Public-safe exclusions

This reader contract explicitly excludes:

- adding real meeting records;
- changing public calendar UI;
- adapters, scrapers, parsers, runtime fetch logic, scheduler logic, or live source fetching; this helper performs no live source fetching;
- racecards, odds, results, payouts, predictions, tips, full entries, or raw source body/html; this helper stores no raw source body/html;
- private/internal notes;
- any race-by-race detail in monthly/day calendar summaries.

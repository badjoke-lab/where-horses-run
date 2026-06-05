# Normalized timetable output schema

Status: draft foundation  
Last updated: 2026-06-05

This specification defines the public-safe normalized timetable output records that sit between extracted meeting candidates and the calendar view model.

Canonical spec file: [normalized-timetable-output-schema.md](normalized-timetable-output-schema.md).

The schema is a normalized meeting-summary contract only. The generated file now contains a first small set of manually reviewed public-safe meeting samples for JRA, NAR/local-government-racing, and HKJC. It still does not implement calendar UI changes, adapters, scrapers, parsers, runtime fetch logic, scheduler logic, live source fetching, generated writeback automation, raw source body/html storage, racecards, odds, results, payouts, predictions, tips, full entries, or private/internal notes.

---

## Files

```text
data/generated/normalized-timetable.schema.json
data/generated/normalized-timetable.json
scripts/check-normalized-timetable-output-schema.mjs
```

`normalized-timetable.schema.json` defines the allowed normalized timetable output fields, enums, display rules, safe summary fields, and explicit exclusions. `normalized-timetable.json` now carries first manually reviewed, summary-only meeting samples; follow-up PRs can add additional reviewed, dry-run, or route-derived meeting facts after review.

---

## Data-flow position

Normalized timetable output records occupy this position in the timetable contract:

```text
Authority Source Inventory
  -> Acquisition Route Inventory
  -> Fetch / Manual Snapshot / Dry Run
  -> Extracted Meeting Candidate
  -> Normalized Timetable Record
  -> Calendar View Model
  -> Monthly / Day Calendar Display
```

A normalized record is the public-safe meeting-level shape that a future calendar view model reader can consume. It must preserve provenance through `source_id` and `route_id` without carrying raw source content or race-by-race detail.

---

## Record shape

Each normalized timetable record uses this shape:

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
  source_status: SourceStatus;
  capability_rank: CapabilityRank;
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  last_checked_date: string | null;
  display_status: DisplayStatus;
  notes: string;
};
```

The stable record key is:

```text
meeting_id
```

`meeting_id` values must identify one country, authority, racecourse, and local meeting date. IDs and notes must remain public-safe and must not encode private workflow, budget, monetization, or internal strategy details.

---

## Required fields

| Field | Type | Purpose |
| --- | --- | --- |
| `meeting_id` | string | Stable public-safe identifier for one authority, racecourse, and local-date meeting. |
| `country_id` | string | Stable country identifier shared with country and timetable datasets. |
| `authority_id` | string | Stable racing authority identifier within the country scope. |
| `racecourse_id` | string | Stable racecourse identifier for the meeting location. |
| `date` | `YYYY-MM-DD` | Local meeting date. |
| `timezone` | IANA timezone string | Timezone used to interpret local race times. |
| `source_id` | string | Stable official source identifier from source inventory or reviewed candidate provenance. |
| `route_id` | string \| null | Stable acquisition route identifier used to produce or verify the record; use `null` only when no route contract exists yet. |
| `source_status` | enum | Public source verification/freshness status applied to the normalized meeting fact. |
| `capability_rank` | enum | Capability rank controlling which time summary fields can be exposed to monthly/day calendar display. |
| `first_race_time_local` | `HH:MM` \| null | Local first race time when supported by source status and capability rank; otherwise `null`. |
| `last_race_time_local` | `HH:MM` \| null | Local last race time when supported by source status and capability rank; otherwise `null`. |
| `official_source_url` | URL string | Official confirmation URL for the source or meeting. |
| `last_checked_date` | `YYYY-MM-DD` \| null | Date the normalized meeting fact was last checked, or `null` when not checked yet. |
| `display_status` | enum | Calendar display readiness/status label. |
| `notes` | string | Public-safe notes for limitations, partial coverage, or source caveats. |

---

## Enums

### Source status

```ts
type SourceStatus =
  | "verified"
  | "partial"
  | "not_verified"
  | "stale"
  | "unavailable";
```

### Capability rank

```ts
type CapabilityRank = "C" | "B" | "B+" | "A";
```

### Display status

```ts
type DisplayStatus =
  | "displayable"
  | "partial"
  | "hidden"
  | "stale"
  | "unavailable";
```

---

## Display rules

Capability rank controls which summary time fields can appear in monthly/day calendar displays:

| Rank | Time-field rule | Calendar display boundary |
| --- | --- | --- |
| `C` | `first_race_time_local` and `last_race_time_local` must be `null`. | Show that the meeting exists only. |
| `B` | `first_race_time_local` may be set; `last_race_time_local` must be `null`. | Show meeting summary plus first race time only when verified. |
| `B+` | `first_race_time_local` and `last_race_time_local` may be set. | Show meeting summary plus first/last time only when verified. |
| `A` | `first_race_time_local` and `last_race_time_local` may be set. | Monthly/day calendar summary must not expose race-by-race detail; only safe summary fields are allowed. |

Safe monthly/day calendar summary fields are limited to:

```text
meeting_id
country_id
authority_id
racecourse_id
date
timezone
source_id
route_id
source_status
capability_rank
first_race_time_local
last_race_time_local
official_source_url
last_checked_date
display_status
notes
```

A-level source capability is not permission to republish all source content. Any future A-level detail must use a separate public-safe detail contract before it can be displayed anywhere.

---

## Validation rules

The validator enforces the schema and reviewed-sample contract:

- schema version, required field order, record key, enums, display rules, safe summary fields, and explicit exclusions;
- manually reviewed sample presence for JRA, NAR/local-government-racing, and HKJC using the approved source and route IDs;
- record object shape, duplicate `meeting_id` checks, `YYYY-MM-DD` date checks, `HH:MM` time checks, URL checks, and enum checks;
- capability-rank display rules for `C`, `B`, `B+`, and `A`;
- public-safe key guardrails so raw source body/html, racecard, odds, result, payout, prediction, tip, full-entry, or private/internal fields cannot enter normalized output records;
- package script and `npm run check` wiring.

Run the schema validator with:

```text
npm run validate:normalized-timetable-output-schema
```

---

## Relationship to existing specs

- The [authority source inventory schema](authority-source-inventory-schema.md) defines source-candidate metadata.
- The [timetable acquisition route schema](timetable-acquisition-route-schema.md) defines route inventory metadata.
- The [timetable data flow and display contract](timetable-data-flow-and-display-contract.md) defines the broader flow into calendar view models.
- This normalized timetable output schema defines the validated public-safe output layer between extracted meeting candidates and calendar-displayable records.

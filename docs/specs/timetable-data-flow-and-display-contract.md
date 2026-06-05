# Timetable data flow and display contract

Status: draft foundation  
Last updated: 2026-06-05

This specification defines the public-safe contract that connects authority source inventory records to displayed timetable and calendar records. It also defines where future acquisition routes, dry runs, manual snapshots, extracted candidates, normalizers, and refresh jobs fit without implementing any adapter, scraper, parser, runtime fetcher, or scheduled update in this PR.

The contract is global-first. JRA, NAR, HKJC, and overseas national, regional, state, provincial, racecourse-operator, or other official authorities use the same flow and display boundary.

This contract must not add entries, odds, results, payouts, predictions, tips, full racecards, private feeds, paid feeds, raw source body storage, or internal/private strategy notes.

---

## 1. Purpose

The timetable layer should answer one public question:

```text
Which official racing meetings are known for a date, where are they, what verified summary time detail is available, and where can the user confirm the source?
```

This contract fills the gap between:

- reviewed authority source inventory records;
- future acquisition route records;
- optional manual snapshots, dry runs, or scheduled candidates;
- normalized meeting-level timetable records; and
- monthly and day calendar display.

It does not define a racecard, odds, results, payout, prediction, tip, or full-entry product.

---

## 2. End-to-end flow

```text
Authority Source Inventory
  -> Acquisition Route Inventory
  -> Fetch / Manual Snapshot / Dry Run
  -> Extracted Meeting Candidate
  -> Normalized Timetable Record
  -> Calendar View Model
  -> Monthly / Day Calendar Display
```

Each stage should be auditable from public-safe metadata and should preserve provenance back to the official source.

### 2.1 Authority Source Inventory

Authority source inventory records describe official source candidates before acquisition or adapter selection. They answer:

- Which country and authority owns or operates the source?
- Which official URL is being reviewed?
- What kind of source is it?
- What public timetable capability rank is currently known?
- What source status and last checked date apply?

The inventory is review metadata only. It does not imply that a route, parser, adapter, scheduled refresh job, or generated timetable record exists.

### 2.2 Acquisition Route Inventory

Acquisition route inventory records describe how a reviewed official source may be checked in the future. A route is allowed to be manual-only, dry-run-only, scheduled-candidate, or disabled.

Routes are not source truth by themselves. A route must point back to an authority source inventory record through `authority_id` and `official_source_id`, and any normalized output must retain `source_id` and `route_id` provenance.

### 2.3 Fetch / Manual Snapshot / Dry Run

This stage is the controlled acquisition boundary.

Allowed public-safe modes are:

- `manual_snapshot`: a human-reviewed, limited source observation used to create or verify public-safe meeting-level facts.
- `dry_run`: a non-writing check that reports whether a route appears usable and what public-safe candidate facts could be extracted.
- `scheduled_candidate`: a route that may later be eligible for a scheduled refresh job after separate review and implementation.
- `disabled`: a known route that must not run until its status changes.

This stage must not store raw source body/html as project data. If future tooling needs transient source access for validation, the public contract only permits public-safe extracted candidates and status metadata to continue downstream.

### 2.4 Extracted Meeting Candidate

An extracted meeting candidate is a provisional, source-derived meeting-level fact set. It is not yet a displayed timetable record.

A candidate may contain public-safe meeting fields such as country, authority, racecourse, date, timezone, official URL, source status, capability rank, first race time, and last race time when those are supported by the source capability. It must not contain entries, odds, results, payouts, predictions, tips, full racecards, or raw source content.

Candidates should be reviewed or normalized before display. Candidates that cannot be mapped to stable country, authority, and racecourse identifiers should remain out of public calendar data.

### 2.5 Normalized Timetable Record

A normalized timetable record is the meeting-level output eligible for generated timetable datasets and calendar view-model construction. It must use stable project identifiers, date/time values in local meeting time, source provenance, and display-safe status fields.

The normalized output shape is defined in [section 5](#5-normalized-timetable-output-expectations).

### 2.6 Calendar View Model

The calendar view model is a display-oriented projection of normalized timetable records. It groups records by date and locale, applies capability-rank display rules, and prepares source labels, freshness labels, and safe official-source links.

The view model must not add additional source facts beyond the normalized records. It may hide unsupported time fields, format known times, sort meetings, and attach user-facing labels for source status, display status, and capability rank.

### 2.7 Monthly / Day Calendar Display

Monthly and day calendar display surfaces show meeting summaries only:

- monthly calendar: compact date-level meeting summaries;
- day page: meeting list for one date with source, status, freshness, and capability summary;
- no race-by-race detail in monthly/day calendar summaries;
- no entries, odds, results, payouts, predictions, tips, full racecards, or raw source excerpts.

A-level race-by-race capability must be routed to a separate detail contract before it is displayed anywhere.

---

## 3. Capability rank to display mapping

Capability rank describes verified official source capability. It is not permission to republish all source content.

| Rank | Verified capability | Monthly / day calendar display |
| --- | --- | --- |
| `C` | Meeting date and racecourse are known. | Show that the meeting exists only. Do not show first or last race time. |
| `B` | Meeting exists and first race time is available. | Show meeting summary plus first race time only. |
| `B+` | Meeting exists and first and last race times are available. | Show meeting summary plus first / last race time only. |
| `A` | Source has race-by-race or racecard-level capability. | Monthly/day calendar still shows summary only. Any A-level detail must be separate and must follow a separate public-safe detail contract. |

Display implementations must treat missing or unsupported time values conservatively. A record should not show a first or last race time unless the normalized record has the field and the capability rank allows that field to be displayed.

---

## 4. Future acquisition route contract

Future acquisition route inventory records should use this public-safe shape:

```ts
type TimetableAcquisitionRoute = {
  route_id: string;
  authority_id: string;
  official_source_id: string;
  source_url: string;
  acquisition_mode: AcquisitionMode;
  output_target: OutputTarget;
  allowed_refresh_scope: AllowedRefreshScope;
  last_checked_date: string | null;
  status: AcquisitionRouteStatus;
  notes: string;
};
```

The stable route key is:

```text
route_id
```

`route_id` values should be globally stable and should not encode private workflow information.

### 4.1 Required route fields

| Field | Type | Purpose |
| --- | --- | --- |
| `route_id` | string | Stable public-safe identifier for this acquisition route. |
| `authority_id` | string | Authority identifier matching the authority source inventory record. |
| `official_source_id` | string | Official source identifier matching the authority source inventory record. |
| `source_url` | URL string | Official source URL or stable official route URL used for checking. |
| `acquisition_mode` | enum | Whether the route is manual-only, dry-run-only, scheduled-candidate, or disabled. |
| `output_target` | enum | The highest public-safe output this route may produce. |
| `allowed_refresh_scope` | enum | The maximum refresh scope allowed by this route contract. |
| `last_checked_date` | `YYYY-MM-DD` \| null | Date the route was last checked, or `null` when not checked yet. |
| `status` | enum | Route readiness/status label. |
| `notes` | string | Public-safe notes about route limitations or review state. |

### 4.2 Route enums

```ts
type AcquisitionMode =
  | "manual_snapshot"
  | "dry_run"
  | "scheduled_candidate"
  | "disabled";
```

```ts
type OutputTarget =
  | "extracted_meeting_candidate"
  | "normalized_timetable_record"
  | "calendar_view_model"
  | "status_only";
```

```ts
type AllowedRefreshScope =
  | "none"
  | "single_date"
  | "date_range"
  | "month"
  | "source_defined_window";
```

```ts
type AcquisitionRouteStatus =
  | "not_reviewed"
  | "candidate"
  | "verified_manual"
  | "dry_run_only"
  | "scheduled_candidate"
  | "blocked"
  | "disabled"
  | "stale";
```

### 4.3 Route acceptance rules

A route may be promoted only when all of the following are true:

- it links to an existing authority source inventory record;
- it uses an official or authority-owned source URL;
- it declares an acquisition mode and allowed refresh scope;
- it declares the highest public-safe output it may produce;
- it preserves source and route provenance into downstream records;
- it does not require storing raw source body/html as repository data;
- it does not create entries, odds, results, payouts, predictions, tips, full racecards, or private feed records.

---

## 5. Normalized timetable output expectations

Normalized timetable records eligible for calendar display should use this public-safe shape:

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

### 5.1 Required normalized fields

| Field | Type | Purpose |
| --- | --- | --- |
| `meeting_id` | string | Stable meeting identifier for one authority/racecourse/date meeting. |
| `country_id` | string | Stable country identifier. |
| `authority_id` | string | Stable authority identifier. |
| `racecourse_id` | string | Stable racecourse identifier. |
| `date` | `YYYY-MM-DD` | Local meeting date. |
| `timezone` | IANA timezone string | Local timezone used to interpret displayed race times. |
| `source_id` | string | Official source identifier from inventory. |
| `route_id` | string \| null | Acquisition route identifier, or `null` for legacy/manual records without a route contract. |
| `source_status` | enum | Source status inherited from verified source review or normalized candidate review. |
| `capability_rank` | enum | Capability rank used by display rules. |
| `first_race_time_local` | `HH:MM` \| null | Local first race time when rank and source support it; otherwise `null`. |
| `last_race_time_local` | `HH:MM` \| null | Local last race time when rank and source support it; otherwise `null`. |
| `official_source_url` | URL string | Official confirmation link for the meeting/source. |
| `last_checked_date` | `YYYY-MM-DD` \| null | Date the displayed fact was last checked. |
| `display_status` | enum | Calendar display readiness/status label. |
| `notes` | string | Public-safe notes for limitations, partial coverage, or source caveats. |

### 5.2 Normalized enums

```ts
type SourceStatus =
  | "verified"
  | "partial"
  | "not_verified"
  | "stale"
  | "unavailable";
```

```ts
type CapabilityRank = "C" | "B" | "B+" | "A";
```

```ts
type DisplayStatus =
  | "display_ready"
  | "partial_display"
  | "source_link_only"
  | "under_review"
  | "hidden";
```

### 5.3 Normalization rules

- `meeting_id` must identify one country, authority, racecourse, and local date combination.
- `country_id`, `authority_id`, and `racecourse_id` must map to existing stable records before public display.
- `date` is the local meeting date, not the UTC date of a fetch job.
- `first_race_time_local` and `last_race_time_local` use local `HH:MM` values only when the source and capability rank support them.
- `C` records must keep both race time fields `null` for monthly/day display.
- `B` records may set `first_race_time_local` and must keep `last_race_time_local` `null` unless promoted to `B+` or `A` with summary-safe last-time support.
- `B+` and `A` records may set first and last race times, but monthly/day display must not show race-by-race detail.
- `official_source_url` must point users to the official source for confirmation.
- `display_status` must remain conservative when source freshness, mapping confidence, or route status is incomplete.
- `notes` must be public-safe and must not contain private workflow, budget, monetization, or internal strategy details.

---

## 6. Calendar view model contract

Calendar view models may derive fields for presentation, but only from normalized timetable records and static reference data.

Recommended display projection:

```ts
type CalendarMeetingSummary = {
  meeting_id: string;
  date: string;
  country_id: string;
  authority_id: string;
  racecourse_id: string;
  racecourse_label: string;
  country_label: string;
  capability_rank: CapabilityRank;
  display_status: DisplayStatus;
  source_status: SourceStatus;
  time_summary: "meeting_only" | "first_race" | "first_last";
  first_race_time_local: string | null;
  last_race_time_local: string | null;
  official_source_url: string;
  last_checked_date: string | null;
};
```

The view model may translate labels, sort by local time where available, group by country or racecourse, and mark stale/partial status. It must not infer unverified race times or race-by-race detail.

---

## 7. Refresh and update positioning

Future refresh jobs should be thin orchestration around acquisition route records:

1. select eligible routes by `acquisition_mode`, `status`, and `allowed_refresh_scope`;
2. run only the allowed manual, dry-run, or scheduled-candidate scope;
3. emit public-safe extracted meeting candidates or status-only output;
4. normalize eligible candidates into meeting-level records;
5. update calendar view models or generated timetable files only after validation;
6. preserve source and route provenance in every displayed record.

Scheduled refresh is a future implementation detail. This contract only defines the public-safe shape and boundaries needed before implementation.

---

## 8. Public-safe exclusions

This contract explicitly excludes:

- real NAR, JRA, HKJC, or other new authority records in this PR;
- adapters, scrapers, parsers, runtime fetch logic, or scheduled jobs;
- racecards, odds, results, payouts, predictions, tips, or full entries;
- raw source body/html storage in repository data;
- private feeds, paid feeds, or private/internal source arrangements;
- JRA-centered field names, workflows, or architecture assumptions;
- internal strategy, budget, monetization, or private workflow notes.

---

## 9. Relationship to existing specs

- The authority source inventory schema defines reviewed source-candidate metadata.
- This contract defines the downstream route, candidate, normalization, and display boundaries.
- The global-first timetable architecture defines the broader multi-authority strategy and capability rank model.
- Future adapter-specific specifications must conform to this contract before producing public calendar display records.

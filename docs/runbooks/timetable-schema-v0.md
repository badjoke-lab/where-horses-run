# Timetable schema v0

Status: global-first timetable foundation
Phase: expansion reset

This runbook defines the first safe timetable data shape for future Today, Tomorrow, 30-day, and monthly calendar pages. It now sits under the global-first timetable architecture and multi-authority source inventory described in `docs/specs/global-timetable-architecture.md`.

---

## Purpose

The product goal is to help users answer where horse racing is happening today, tomorrow, and in the next 30 days without making one country or authority the center of the architecture.

`timetable-schema-v0` is the safe foundation for that goal. It stores only meeting-level timetable facts, source provenance, status, freshness, and capability labels. It is not a racecard model and does not support betting, prediction, result, or payout content.

---

## Generated file

The generated file is:

```text
data/generated/timetables.json
```

The file starts in manual fallback mode. Country-specific records remain partial until date-level meeting facts are source-reviewed under the common source inventory. JRA is one reusable verified source / adapter candidate, not the center of the timetable model.

---

## Allowed timetable record fields

Timetable entries may use only these fields:

| Field | Meaning |
| --- | --- |
| `country_id` | Static country id, such as `japan`. |
| `racecourse_id` | Static racecourse id when known. |
| `racecourse_name` | Public racecourse name. |
| `date` | Local meeting date at calendar level. |
| `start_time_local` | Local start time or start-time-level text when verified. |
| `timezone` | IANA timezone for the local date and start time. |
| `racing_type` | Safe racing category such as thoroughbred flat or Banei. |
| `source_id` | Official source id from the source registry. |
| `source_url` | Official source link users should open for final confirmation. |
| `last_checked_at` | Date-time when the safe timetable fact was last checked. |
| `last_checked_date` | Source inventory and display freshness date as `YYYY-MM-DD` when available. |
| `status` | Safe operational state such as verified, partial, not_verified, stale, unavailable, fallback, skipped, or cancelled. |
| `source_status` | Shared source inventory status when available: verified, partial, not_verified, stale, or unavailable. |
| `confidence` | Confidence label for the timetable fact. |
| `capability_rank` | Shared rank when available: C, B, B+, or A. |
| `notes` | Short safety or verification note. |

When a timetable record is present, it must include `source_id`, `source_url`, `status`, `confidence`, and `last_checked_at` so consumers can show provenance and freshness.


---

## Global capability rank matrix

The shared timetable architecture uses one capability matrix across countries and authorities:

| Rank | Required verified capability | Display boundary |
| --- | --- | --- |
| C | Meeting date and racecourse only. | Show that a meeting exists. |
| B | First race time is available. | Show the first race time only. |
| B+ | First and last race time are available. | Show first / last race time only. |
| A | Race-by-race / racecard-level detail is available from the official source. | Keep A detail separate from monthly and day summary views. |

Capability rank is a source capability label, not permission to republish full racecard content.

---

## Common display contract

Public timetable display must remain meeting-summary first:

- Monthly calendar pages show meeting summaries only.
- Day pages show the meeting list, official source, source status, last checked date, and capability rank.
- A-level detail is separate from the monthly calendar and day summary views.
- B+ meetings show first and last race time only.
- B meetings show first race time only.
- C meetings show that the meeting exists only.
- Unverified source candidates show `partial` or `not_verified` status.

---

## Forbidden fields and content

Timetable data must not include:

- Racecard body content.
- Entries or runners.
- Horse names.
- Jockey names.
- Odds.
- Results.
- Payouts or dividends.
- Prediction content.
- Tips or betting advice.
- Raw HTML.
- Body text copied from official pages.
- Saved official page content or response bodies.

The validator rejects forbidden field names and obvious raw markup markers such as HTML document, body, script, and table tags.

---

## Why the boundary exists

The timetable layer is meant to answer a narrow scheduling question: where racing appears to be happening, on what date, at what local start-time level, and where the user can confirm it.

Racecards, entries, odds, results, payouts, and tips are excluded because they are higher-risk data classes with stronger publication, licensing, freshness, and user-harm concerns. They are also outside the immediate Today / Tomorrow / 30-day timetable need.

---

## Official links remain final confirmation

Every timetable record must point back to an official source. The UI should present the generated timetable fact as a convenience summary and keep the official link as the final confirmation point.

If the generated data is fallback, manual, stale, uncertain, or unverified, the UI should say so clearly and direct the user to the official source before they rely on it.

---

## Future Today / Tomorrow / 30-day support

This schema gives later UI work a safe set of fields for:

- Today pages grouped by country and racecourse.
- Tomorrow pages using the same timetable record shape.
- 30-day and monthly calendar pages using the same date, local time, timezone, source, status, freshness, capability rank, and confidence fields.

The next UI PR should implement the common calendar display contract without adding parser logic, live fetch logic, or raw source-body storage.

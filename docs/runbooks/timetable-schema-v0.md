# Timetable schema v0

Status: M3 real-data readiness foundation
Phase: PR-050

This runbook defines the first safe timetable data shape for future Today, Tomorrow, and 30-day pages.

---

## Purpose

The product goal is to help users answer where horse racing is happening today, tomorrow, and in the next 30 days.

`timetable-schema-v0` is the safe foundation for that goal. It stores only meeting-level timetable facts and official confirmation links. It is not a racecard model and does not support betting, prediction, result, or payout content.

---

## Generated file

The generated file is:

```text
data/generated/timetables.json
```

The file starts in manual fallback mode. Japan is represented by an empty safe structure until date-level timetable records are source-reviewed.

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
| `status` | Safe operational state such as fallback, unverified, verified, skipped, or cancelled. |
| `confidence` | Confidence label for the timetable fact. |
| `notes` | Short safety or verification note. |

When a timetable record is present, it must include `source_id`, `source_url`, `status`, `confidence`, and `last_checked_at` so consumers can show provenance and freshness.

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
- 30-day calendar pages using the same date, local time, timezone, source, status, and confidence fields.

The next UI PR can read the same safe fields without adding parser logic, live fetch logic, or raw source-body storage.

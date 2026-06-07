# Timetable canonical data model

Status: PR-241 canonical model foundation  
Last updated: 2026-06-07

This specification defines the canonical timetable data model used between source normalization and public view generation.

It does not convert existing JSON, generate public view JSON, change page inputs, or add source fetching.

---

## Target pipeline

```text
source config
↓
fetch / snapshot
↓
normalize / canonical
↓
publication policy
↓
public view model / public JSON
↓
pages
```

Canonical data sits between normalized source data and publication policy.

Pages must eventually read only public view data, not canonical data directly.

---

## Core types

The canonical model is defined in `src/lib/timetable/canonicalTypes.ts`.

Required exported types:

- `CapabilityRank`
- `SourceTrace`
- `Freshness`
- `CanonicalMeeting`
- `CanonicalMeetingDetail`
- `CanonicalRaceTimetableRow`
- `MeetingSummaryRecord`
- `MeetingDetailRecord`
- `CanonicalTimetableDataset`
- `CanonicalMeetingDetailDataset`

---

## CapabilityRank

Canonical capability rank describes what the project has stored after normalization.

Allowed ranks:

```text
not_listed < D < C < B < B+ < A < A+
```

Minimum meaning:

| Rank | Meaning |
| --- | --- |
| `not_listed` | Do not include in public timetable output. |
| `D` | Known source route or candidate only; not enough for public meeting display. |
| `C` | Meeting date and racecourse are known. |
| `B` | First race time is stored. |
| `B+` | First and last race times are stored. |
| `A` | Public-safe race labels and post times are stored in meeting detail rows. |
| `A+` | A fields plus allowed programme summary fields are stored. |

Capability rank is not the same as public rank. Public rank is resolved later by publication policy.

---

## CanonicalMeeting

`CanonicalMeeting` is the meeting-level canonical record.

It is used for list, calendar, country, racecourse, today, tomorrow, and current timetable surfaces after policy conversion.

Required fields:

- `meeting_id`
- `country_id`
- `authority_id`
- `racecourse_id`
- `date`
- `timezone`
- `capability_rank`
- `display_status`
- `source_trace`
- `freshness`

Optional summary fields:

- `first_race_time_local`
- `last_race_time_local`
- `notes`

A `CanonicalMeeting` must not contain raw source HTML, entries, runners, odds, results, payouts, predictions, tips, or video links.

---

## CanonicalMeetingDetail

`CanonicalMeetingDetail` stores approved race-by-race public-safe timetable rows.

It is used only after policy conversion to public detail output.

Required fields:

- `meeting_id`
- `country_id`
- `authority_id`
- `racecourse_id`
- `date`
- `timezone`
- `capability_rank`
- `source_trace`
- `freshness`
- `timetable_rows`

`capability_rank` must be `A` or `A+`.

---

## CanonicalRaceTimetableRow

Allowed fields:

- `label`
- `post_time_local`
- `race_name`
- `distance_m`
- `surface`
- `course_label`
- `metadata_status`
- `source_label`

For A rows, only `label` and `post_time_local` are required.  
For A+ rows, programme fields may be stored, but display is still controlled later by publication policy.

---

## SourceTrace

`SourceTrace` records where the canonical record came from.

Required fields:

- `source_id`
- `source_status`
- `official_source_url`

Optional fields:

- `route_id`
- `source_label`
- `extraction_method`
- `source_snapshot_path`
- `normalized_from_path`

Source trace must point to official or approved source evidence. It must not store raw page bodies.

---

## Freshness

`Freshness` records when the underlying source or normalized output was checked.

Required field:

- `last_checked_date`

Optional fields:

- `generated_at`
- `stale_after_date`
- `freshness_note`

---

## JRA section split connection

The JRA section split schema remains valid and should map into this model as follows:

- `meeting_summary_record` becomes `CanonicalMeeting`.
- `meeting_detail_record` becomes `CanonicalMeetingDetail`.
- JRA B+ summary output must not contain race rows.
- JRA A detail output may contain race rows only in `CanonicalMeetingDetail`.
- Monthly calendar and day summary pages must consume public list output, not detail rows.

---

## Non-goals in this PR

This PR does not add:

- conversion from existing JSON to canonical output
- `data/generated/timetable/canonical/meetings.json`
- `data/generated/timetable/canonical/meeting-details.json`
- publication policy resolver
- public view generation
- page input migration
- source fetching
- source snapshots
- new source coverage

The next roadmap item is PR-4: existing JSON to canonical conversion.

# Parser interface

Status: public specification
Phase: Generated Data Foundation

This document defines the baseline parser interface for Where Horses Run / 競馬どこ？.

---

## Purpose

Parsers will eventually transform public source information into generated schedule JSON.

This specification defines the interface boundary before parser implementation starts.

The parser layer must not imply live coverage when no live process exists.

---

## Scope

Parser work may eventually support:

- source-specific extraction
- normalized meeting objects
- generated calendar files
- fetch status updates
- freshness labels
- fallback behavior

Parser work must not republish:

- full racecards
- odds
- results
- payouts
- tips
- private or paid feeds

---

## Input

A parser input should include:

- source_id
- country_id
- source_type
- data_type
- source_url
- fetched_at
- raw_content_ref
- parser_version

Notes:

- raw_content_ref may point to a local fixture or fetched content reference.
- raw source content should not be committed unless it is safe and public.
- source_url should come from data/static/sources.json.

---

## Output

A parser output should include:

- parser_version
- source_id
- generated_at
- status
- meetings
- warnings
- errors

The meetings field must be an array.

Empty meetings arrays are allowed.

---

## Meeting shape

A normalized meeting item should eventually include:

- meeting_id
- country_id
- track_id
- track_name
- local_date
- timezone
- source_id
- source_url
- status

Optional fields may include:

- first_race_time_local
- last_race_time_local
- meeting_name
- racing_type
- notes

---

## Status values

Parser output status values:

- ok
- partial
- empty
- stale
- failed
- skipped
- unknown

Meanings:

- ok: parser produced usable meeting data.
- partial: parser produced some data but coverage is incomplete.
- empty: parser ran but produced no meetings.
- stale: source or generated data is older than expected.
- failed: parser failed.
- skipped: parser intentionally skipped the source.
- unknown: parser status is unknown.

---

## Warnings and errors

Warnings are public-safe messages for non-fatal issues.

Examples:

- missing expected field
- unknown track name
- incomplete timetable
- timezone not confirmed

Errors are public-safe messages for failed parsing.

Errors must not include:

- credentials
- private access details
- internal strategy
- sensitive request details

---

## Generated file connection

Parser outputs may later feed:

- data/generated/today.json
- data/generated/tomorrow.json
- data/generated/calendar-30d.json
- data/generated/fetch-status.json

Generated files must stay valid JSON.

If parser output is missing or failed, fallback files should remain usable.

---

## Fixture-first rule

Before live fetching starts, parser behavior should be tested with fixtures.

Fixtures should be:

- public-safe
- minimal
- source-specific
- small enough for review
- clearly marked as test fixtures

---

## Out of scope

This specification does not implement:

- parser code
- live fetching
- scheduled workflows
- external API calls
- historical storage
- alerting

# Reviewed source coverage state

`data/static/calendar-reviewed-source-coverage-v1.json` is the durable, human-reviewed record for source date windows that were actually inspected and completed even when no meeting was discovered.

This state exists because a public calendar cannot represent an empty source window with a fake meeting. Without a separate reviewed coverage record, the live planner derives its source horizon only from the latest public meeting and can repeatedly schedule the same known-empty date.

## Admission boundary

A record is eligible only when all of the following are true:

- the source observation says `coverage_claim: source_window_complete`;
- the observed scope is an exact date window;
- unresolved dates, unresolved meetings, and source errors are all empty;
- a human review has explicitly promoted the observation into this static state;
- the source matches the system's registered schedule source;
- the record retains the originating run, PR, branch, path, and blob SHA as provenance.

The stored schema can retain the discovered-record count, but **only reviewed complete windows with `records_discovered: 0` are allowed to extend the planner horizon**. A window that discovered meetings cannot hide missing public coverage; those meetings still require the normal candidate review and bounded promotion path.

## Planner behavior

The live planner starts with the horizon implied by the latest public meeting. Reviewed empty windows may extend that horizon only when they overlap or begin exactly at the current horizon. This creates a contiguous proof chain and prevents a later reviewed window from bridging an unknown gap.

Example:

- latest public HKJC meeting: 2026-09-20
- public horizon end-exclusive: 2026-09-21
- reviewed empty source window: 2026-09-21..2026-09-22
- resulting planner horizon end-exclusive: 2026-09-22

A reviewed 2026-09-22..2026-09-23 window by itself would **not** extend a 2026-09-21 horizon because 2026-09-21 would remain unknown.

## Publication boundary

Reviewed source coverage does not:

- create a meeting;
- create race detail;
- approve a candidate;
- write canonical meeting data;
- write public projection data;
- publish or deploy anything.

It only prevents the due-job planner from treating a human-reviewed, proven-empty source day as unobserved.

## Initial record

The initial record captures the HKJC 2026-09-21 source window from PR #559. The acquisition artifact reported zero discovered meetings, zero unresolved dates, zero unresolved meeting IDs, zero source errors, and `source_window_complete`. The official September 2026 HKJC fixture evidence shows no meeting on September 21; the next listed meeting is September 23 at Happy Valley.

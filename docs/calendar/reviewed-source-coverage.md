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

Current HKJC example:

- latest public HKJC meeting: 2026-09-20
- public horizon end-exclusive: 2026-09-21
- reviewed empty source window: 2026-09-21..2026-09-22
- reviewed empty source window: 2026-09-22..2026-09-23
- resulting planner horizon end-exclusive: 2026-09-23

A reviewed 2026-09-22..2026-09-23 window by itself would **not** extend a 2026-09-21 horizon because 2026-09-21 would remain unknown. The two current HKJC records extend the horizon transitively only because both empty days have independent reviewed evidence.

## Activation freshness signal

The daily activation status keeps `public_horizon_end_date` as the raw maximum date present in the public meeting projection. That field must not be moved forward by inventing an empty meeting.

`publication_review_required` is different: when the daily run has a valid live planner state, it follows reviewed calendar coverage rather than the raw public meeting maximum. A review is required when any system has a planner `coverage_gap` or a reviewed season state is `unknown`. If the planner state is unavailable because planning failed before it could be produced, the status writer falls back to the conservative raw public-horizon comparison.

This distinction allows a date that is independently proven empty to count as reviewed coverage without pretending that a meeting exists. The planner state used for the decision is the same `.calendar-live-state.json` artifact produced by the canonical daily acquisition run; the status writer does not reimplement source-window planning.

## Publication boundary

Reviewed source coverage does not:

- create a meeting;
- create race detail;
- approve a candidate;
- write canonical meeting data;
- write public projection data;
- publish or deploy anything.

It only prevents the due-job planner from treating a human-reviewed, proven-empty source day as unobserved.

## Initial reviewed records

The first record captures the HKJC 2026-09-21 source window from PR #559. The acquisition artifact reported zero discovered meetings, zero unresolved dates, zero unresolved meeting IDs, zero source errors, and `source_window_complete`.

The next daily acquisition run, `32677768701`, planned HKJC 2026-09-22..2026-09-23 after the September 21 empty window had been persisted. Its HKJC acquisition artifact again reported zero discovered meetings, zero unresolved dates, zero unresolved meeting IDs, zero source errors, and `source_window_complete`. That second observation is reviewed separately and extends the contiguous empty-source horizon through September 22 without creating a fake meeting.

After both records were reviewed, canonical daily run `32688744520` produced no HKJC collection job. Its planner state showed `source_visible_horizon_end_exclusive: 2026-09-23` and zero coverage gaps for every system in the 30-day planning window.

The official September 2026 HKJC fixture evidence lists the next meeting on September 23 at Happy Valley.

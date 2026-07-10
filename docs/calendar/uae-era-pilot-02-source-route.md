# UAE ERA PILOT-02 source-route and parser evidence

Status: bounded live evidence implementation  
Work ID: `WHR-CAL-UAE-ERA`  
Implementation unit: `UAE-PILOT-02`  
Last reviewed: 2026-07-11

## Purpose

PILOT-01 established a no-network C-level artifact core from the existing reviewed Calendar Readiness boundary.

PILOT-02 asks a separate question:

> Can the official ERA source route be observed and parsed into that exact C-level boundary without inventing venue IDs, time fields, or Registry capability?

## Source routes

Two official publication routes are treated separately.

### Official article HTML

The official ERA article is the primary bounded parser route.

The parser observes only public-safe season-summary structure:

- season years;
- opening date;
- opening venue label;
- closing date;
- total race meetings;
- total racecourses;
- meeting counts per named venue;
- official PDF URL presence.

The parser does not extract participants, betting, results, payouts, predictions, or streams.

### Fixture PDF endpoint

The PDF endpoint is a secondary source-route probe.

PILOT-02 records only:

- HTTP status;
- final URL host;
- content type;
- response byte count;
- `%PDF-` magic marker;
- network error when present.

The PDF body is not persisted.

PDF reachability is not required for the article HTML evidence to remain valid.

## Mapping boundary

The official article identifies the season opening at Abu Dhabi Turf Club and the closing meeting at Meydan Racecourse.

PILOT-01 trusted canonical mapping currently includes only:

```text
Meydan Racecourse -> meydan-racecourse
```

Therefore the article parser produces:

```text
mapped C candidate:
  uae-meydan-racecourse-2027-03-27

unresolved venue observation:
  date: 2026-10-22
  venue label: Abu Dhabi Turf Club
  reason: canonical_racecourse_id_not_reviewed
```

The unresolved opening venue remains explicit. It is not dropped and is not assigned an invented ID.

## Season-summary closure checks

Before candidate artifacts are built, the article parser requires:

```text
season: 2026-2027
opening date observed
closing date observed
total meetings: 64
total racecourses: 5
all five venue meeting counts observed
venue meeting count sum: 64
```

Any structural mismatch fails closed.

The parser supports the article's word-form racecourse count such as `five racecourses`; it does not require the count to be written numerically.

## Candidate effect

PILOT-02 routes parsed meeting identity through the accepted PILOT-01 C-level core.

Expected live article result:

```text
records discovered: 1
rank counts: C=1, B/B+/A/A+=0
coverage: partial
unresolved date: 2026-10-22
candidate review state: needs_review
promotion target: null
```

Coverage remains partial because the opening venue identity is not yet mapped into the trusted canonical racecourse ID set.

## Live evidence boundary

The live workflow:

1. validates permanent parser fixtures;
2. hashes protected Registry/canonical/public state;
3. fetches the official article into memory;
4. parses the article and builds C-level review artifacts in memory;
5. probes the PDF endpoint without persisting the PDF;
6. writes only a public-safe JSON evidence summary under `/tmp`;
7. uploads only that summary artifact;
8. verifies protected hashes;
9. proves the repository worktree remains clean.

## Non-activation rule

Registry activation remains false throughout PILOT-02.

PILOT-02 does not:

- add a UAE Acquisition Registry profile;
- activate an automated runner;
- claim complete season-date extraction;
- map all five racecourses;
- claim time fields;
- approve candidates;
- promote candidates;
- write canonical/public data;
- publish timetable changes.

## Next decision

After reviewed live evidence, the next unit must decide whether:

1. the article HTML route is accepted as a bounded C-level schedule evidence path;
2. PDF route reachability should be retained only as secondary evidence or developed into a separate reviewed parser route;
3. canonical venue-ID mapping review should proceed before broader season-calendar candidate generation;
4. any Acquisition Registry profile should remain deferred until source coverage and runner semantics are explicitly proved.

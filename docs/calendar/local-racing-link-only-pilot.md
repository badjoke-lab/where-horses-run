# Calendar local racing link-only pilot

Status: active foundation  
Work ID: `WHR-CAL-JAPAN-NAR`  
Started: 2026-07-01

## Purpose

The regional local-racing source is not equivalent to the JRA programme source.

Canonical Calendar Readiness currently defines this source as:

```text
readiness: link_only
Technical Rank: C
Public Ceiling: C
confirmed fields: meeting date and racecourse only
```

The first pilot slice therefore proves the link-only boundary. It does not build an adapter, normalized timetable, active candidate, canonical record, or public projection.

## Canonical source

```text
source key:
japan/nar-local-government-racing/nar-monthly-convene-info

official route:
https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop
```

The authority inventory records the monthly convening route as a partial calendar source. Its inventory discovery rank does not override the reviewed C-level Calendar Readiness decision.

## Legacy candidate quarantine

The repository previously contained:

```text
data/candidates/japan-nar-candidates.json
```

It was a `timetable-candidates-v0` dry-run artifact generated on 2026-05-29 from the legacy safe timetable overlay. It used the historical `nar` system ID, `japan-nar-home` source ID, and descriptive text instead of Pipeline v1 meeting/timetable fields.

It is retained for traceability at:

```text
data/archive/timetable/candidates/japan-nar-candidates.v0.json
```

The active candidate path is now absent. The old generator command has been replaced by a guard:

- `--check` confirms link-only control, active-file absence, and archive integrity;
- direct execution fails until Calendar Readiness is reviewed and changed.

The archived 12 records remain `needs_review` historical evidence. They are not active candidates and cannot be promoted.

## Control

```text
data/static/local-racing-pilot-control.json
```

The control fixes:

- system identity `japan-nar-system`;
- official hosts;
- link-only readiness;
- C technical and public boundaries;
- disabled acquisition, normalization, candidate, canonical-write, public-write, and schedule modes;
- prerequisites that must be reviewed before any readiness change.

## Review

```text
node scripts/timetable/build-local-racing-pilot-review.mjs --dry-run
```

The committed deterministic baseline is:

```text
data/generated/timetable/local-racing-pilot-review.json
```

It records `foundation.pass: true` and `activation.ready: false`, together with the archived candidate digest and the unchanged public-projection state.

The deterministic review verifies:

- unique Authority/Source and Calendar Readiness identity;
- official host;
- link-only state;
- C/C rank boundary;
- only meeting date and racecourse confirmed;
- `not_started` implementation state;
- official-link fallback;
- absence of an active local-racing candidate file;
- presence, integrity, count, and digest of the archived v0 artifact;
- absence of local-racing public meetings and details;
- explicit isolation from JRA capability.

The review separates two states:

```text
foundation.pass = true
activation.ready = false
```

The current foundation is correct precisely because it refuses to manufacture a timetable implementation from incomplete evidence.

## Activation blockers

Activation remains blocked by:

- authority-specific timetable coverage not reviewed;
- stable scheduled-time source not confirmed;
- Calendar Readiness change required before candidate work.

## Required next research

Before a later implementation PR:

1. review authority- or venue-specific official sources;
2. preserve venue and operator differences;
3. verify stable date, venue, and scheduled-time pairing;
4. update Authority/Source and Calendar Readiness through review;
5. define a bounded fixture or import contract;
6. retain human review, fallback, rollback, and bilingual QA.

## Boundary

This foundation performs no network fetch and creates no normalized data, active candidate, canonical data, public projection, schedule, or publication.

It must not generalize JRA A/A+ capability to regional local racing. It also must not imply that one monthly convening page is a complete national timetable feed.

## Validation

```text
node scripts/check-local-racing-pilot-foundation.mjs
node scripts/check-japan-nar-candidate-generator.mjs
```

The validators prove deterministic review output, archive integrity, active candidate absence, direct-generator rejection, and unchanged archive/public files.

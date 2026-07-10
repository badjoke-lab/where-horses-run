# HKJC pilot reconciliation

Status: active transition contract  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Last reviewed: 2026-07-10

## Purpose

The HKJC pilot begins by reconciling two existing repository paths that were created at different stages of the Calendar programme.

Current repository state contains:

```text
shared control-plane bounded executor
+ legacy rolling live-fetch refresh pipeline
```

These paths are not equivalent.

The shared path is review-artifact oriented and has no publication effect.

The legacy path historically chained:

```text
live fixture/racecard fetch
-> normalize
-> build canonical timetable
-> merge HKJC normalized data into canonical
-> build public timetable view
```

That direct-write orchestration is not compatible with the current review-first Calendar operating boundary.

## Reconciliation decision

The adopted decision is:

```text
transition_legacy_refresh_to_shared_control_plane
```

The transition begins by quarantining the legacy direct canonical/public orchestration.

The existing fetch and normalization logic is not deleted. It remains migration input for later artifact-only adapters.

## Current shared control-plane path

The current HKJC Acquisition Registry profile remains provisional.

```text
system_id: hong-kong-hkjc-system
primary_runner: github_actions
fallback_runner: local
schedule_source_id: hkjc-fixture-list
detail_source_id: null
schedule_adapter_id: hong-kong-hkjc-dry-run-adapter
detail_adapter_id: null
public_ceiling: A
supported observation ranks: C
```

The existing bounded Actions executor is:

```text
hkjc-bounded-generator-actions
```

It currently reads the bounded dry-run candidate source and emits:

- candidate artifact;
- Coverage Observation;
- Collection Result Manifest;
- collection report;
- publication effect `none`.

Its current capability is C-level meeting identity only.

## Existing legacy evidence

Historical rolling evidence remains useful as migration evidence.

The reviewed repository artifacts show:

```text
route meetings: 10
normalized records: 10
A+ records: 1
C records: 9
historical A+ meeting: hkjc-happy-valley-racecourse-2026-06-10
```

This evidence proves that the historical source logic can produce public-safe timetable detail for at least one bounded meeting.

It does not automatically activate live detail acquisition in the current Registry.

It does not automatically justify A+ public display.

The historical report remains migration evidence, not current unattended operational authorization.

## Legacy orchestrator quarantine

The legacy orchestrator is:

```text
scripts/timetable/refresh-hkjc.mjs
```

Default execution now fails closed.

A reviewed research-only run requires:

```text
--legacy-research-only
```

Under that flag the orchestrator may run only:

```text
fetch-hkjc-racecards.mjs
normalize-hkjc-racecards.mjs
```

It must not call:

```text
build-canonical-timetable.mjs
merge-hkjc-normalized-into-canonical.mjs
build-public-timetable-view.mjs
```

The research-only mode is not an operational publication path.

## Why the legacy path is quarantined

The current Calendar flow is:

```text
source
-> bounded collection
-> candidate
-> Coverage Observation
-> Result Manifest
-> Review Queue
-> human review
-> promotion
-> deterministic public projection
```

A direct source-to-canonical/public chain skips the review and promotion boundaries.

The HKJC pilot therefore does not reactivate the historical direct-write path.

## Migration decisions

### Official source fetch logic

Decision:

```text
retain_for_reviewed_migration
```

Reason: existing fixture and racecard route logic, source-host checks, response classification, and bounded window handling are useful inputs to a new artifact-only acquisition bridge.

### Normalization logic

Decision:

```text
retain_for_adapter_migration
```

Reason: historical five-rank fallback and public-safe field extraction are useful, but the result must be bridged to current candidate, Coverage, Manifest, and Review Queue contracts.

### Legacy direct canonical/public orchestration

Decision:

```text
quarantine
```

Reason: it bypasses current candidate review, promotion, and public projection boundaries.

### Existing bounded Actions executor

Decision:

```text
retain_as_safe_fallback_foundation
```

Reason: it already produces isolated review artifacts with `publication_effect: none`.

## Public data boundary

The HKJC pilot keeps the existing public restrictions.

Acquisition and migration work must not produce public output for:

- starter or runner lists;
- horse names;
- jockey names;
- trainer names;
- weights;
- draw, gate, or post positions;
- odds;
- betting rank;
- results;
- payouts;
- predictions or tips;
- raw HTML;
- full racecard text;
- embedded video;
- direct stream URLs.

A+ remains a controlled meeting-detail-page summary boundary, not a complete racecard.

## Completion boundary for this reconciliation stage

This stage is complete when:

- the reconciliation audit matches the current Registry;
- the bounded executor remains publication-effect none;
- historical route, report, and normalized evidence counts are verified;
- historical rank counts are verified as A+ 1 / C 9;
- the legacy orchestrator fails closed by default;
- research-only mode contains only fetch and normalize steps;
- the legacy orchestrator no longer calls canonical or public writers;
- canonical and public file hashes remain unchanged when the default legacy command is rejected;
- normal Calendar build and release gates still pass;
- next unit is fixed as `HKJC-PILOT-02`.

## Next implementation unit

```text
HKJC-PILOT-02
HKJC artifact-only live fixture acquisition bridge
```

Goal:

Move official fixture-window acquisition into a bounded review-artifact path that feeds shared control-plane contracts without canonical or public writes.

The next unit should not begin with A+ detail activation. First it must establish a safe live schedule acquisition bridge and preserve explicit source-error/partial coverage semantics.

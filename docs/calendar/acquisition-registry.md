# Calendar Acquisition Registry

Status: active machine-readable routing registry  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Acquisition Registry is the routing source of truth for Calendar acquisition systems.

It separates:

```text
system identity
runner policy
source identity
adapter identity
technical capability
collection target
public ceiling
supported observation ranks
scope support
retry support
```

The operator must not reconstruct those facts from memory.

## Canonical files

```text
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
```

## Initial profiles

The first registry version contains:

```text
japan-jra-system
japan-nar-system
japan-banei-system
```

### JRA

```text
profile_status: active
primary_runner: local
fallback_runner: reviewed_import
schedule_source_id: jra-programme
detail_source_id: jra-programme
technical_capability_rank: A+
collection_target_rank: best_available
public_ceiling: A+
```

The profile does not claim selected-meeting, cross-month, source-visible-horizon, or rank-upgrade retry support before those paths are implemented and reviewed.

### NAR

```text
profile_status: active
primary_runner: github_actions
fallback_runner: local
schedule_source_id: nar-monthly-schedule-grid
detail_source_id: nar-race-list-deba-table
technical_capability_rank: A+
collection_target_rank: best_available
public_ceiling: A+
supported_observation_ranks: C, A+
```

NAR supports:

- date windows;
- cross-month windows;
- selected meetings;
- source-visible horizon state;
- rank-upgrade retry planning.

The current source-specific observed outcomes C and A+ do not narrow the global C/B/B+/A/A+ model.

### Banei

The initial Banei profile is provisional.

```text
profile_status: provisional
primary_runner: reviewed_import
schedule_source_id: banei-official-schedule
schedule_adapter_id: japan-banei-dry-run-adapter
detail_source_id: pending
detail_adapter_id: pending
fallback_runner: pending
```

This profile records only current evidence. It does not infer NAR-compatible detail acquisition, runner fallback, arbitrary windows, selected-meeting support, source-visible horizon support, or rank-upgrade retry support.

## Rank rules

Rank order is:

```text
C < B < B+ < A < A+
```

The registry keeps these facts separate:

```text
technical_capability_rank
collection_target_rank
public_ceiling
supported_observation_ranks
```

`collection_target_rank` may be `best_available` or an explicit rank not above technical capability.

Public Ceiling must not exceed the approved system policy ceiling.

## Provisional profile rule

A provisional profile may use null source, adapter, or fallback values only when every null field is explicitly listed in `pending_fields`.

An active profile must have complete Schedule and Detail source/adapter identities and no pending fields.

A provisional profile is not a shortcut for invented capability.

## Validation boundary

The validator rejects at least:

- unknown runner classes;
- impossible rank values;
- target rank above technical capability;
- public ceiling above approved policy;
- selected-meeting support without an active adapter path;
- missing primary runner;
- duplicate system IDs;
- unresolved authority/source identities;
- unsupported adapter identities;
- provisional null fields that are not explicitly declared pending.

The validator cross-checks the initial Japan profiles against:

```text
data/static/calendar-readiness-japan-v2.json
data/static/japan-a-plus-policy.json
Authority/Source inventory and supplements
concrete adapter implementation evidence
```

## Loader boundary

The loader provides deterministic system profile lookup.

Unknown `system_id` values are rejected. Duplicate system IDs are rejected.

The loader does not choose a runner dynamically, fetch sources, create jobs, approve batches, promote data, or publish.

## Safety boundary

The Registry contains routing and capability metadata only.

It must not contain:

- source bodies or raw HTML;
- participant or horse data;
- jockey or trainer data;
- betting or odds data;
- result or payout data;
- prediction or tip data;
- credentials, cookies, tokens, or bypass instructions.

Registry changes have no approval, promotion, public projection, or deployment side effect.

## Next stage

The next control-plane implementation stage is the Collection Job schema.

Collection Jobs will reference `system_id` and consume Registry routing metadata without duplicating source-specific runner knowledge inside every job.

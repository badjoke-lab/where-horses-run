# Calendar pipeline v1 — release gate

Status: complete  
Work ID: `WHR-CAL-PIPELINE-V1`  
Completed: 2026-07-01  
Next Work ID: `WHR-CAL-DYNAMIC-DATES`

## Completion scope

Pipeline v1 establishes the reviewed data boundary from candidate generation through static public rendering.

```text
reviewed source adapter or manual import
-> timetable-candidate-v1
-> deterministic validation
-> human review
-> canonical promotion
-> deterministic public projection
-> public-only runtime imports
-> read-only static build
```

The grouped release gate does not activate live source scheduling or unattended publication.

## Completed layers

### Static build boundary

Astro reads committed public projection only. A build cannot run candidate, canonical, or public-data generators as configuration side effects.

### Candidate contract

The shared candidate envelope fixes stable IDs, date windows, rank-specific fields, source provenance, review state, and prohibited-field rejection.

### Canonical promotion

Only approved candidates with reviewer, review time, canonical target, registry identity, rank, confirmed fields, freshness, and collision checks may enter canonical meeting data.

### Public projection

Public output is generated deterministically from canonical data, display policy, Calendar Readiness Public Ceiling, and reviewed source aliases. Promotion and publication remain separate writes.

### Runtime import boundary

Production pages may read only the public meeting-list and meeting-detail JSON files. Candidate, canonical, seed, normalized, snapshot, and preview-era data are blocked from every page dependency graph.

### JRA reference adapter

The first source-specific adapter emits four deterministic JRA candidate records. They remain `needs_review`; their source snapshot is older than the current reviewed registry state and therefore cannot be promoted until refreshed.

### Rendered public release QA

The reviewed public projection contains 23 meeting rows and five detail routes. English/Japanese core routes and detail pages passed rendered QA, including removal of link-only rows and A+ field suppression under Public Ceiling A.

## Grouped validation

The release gate runs these validators in order:

```text
check-calendar-build-boundary.mjs
check-calendar-pipeline-v1-candidate-contract.mjs
check-calendar-pipeline-v1-promotion.mjs
check-calendar-pipeline-v1-public-projection.mjs
check-calendar-runtime-import-boundary.mjs
check-japan-jra-candidate-generator.mjs
```

CI then runs the static build, rendered public-projection QA, Calendar contracts, governance checks, and a clean-worktree assertion.

The machine-readable completion record is:

```text
data/audits/calendar-pipeline-v1-release-gate.json
```

## Explicitly not completed

Pipeline v1 does not complete:

- current-date Today and Tomorrow selection;
- a rolling Calendar window;
- timezone-aware date boundaries;
- scheduled source collection;
- automatic stale/source-health operation;
- pilot live refresh activation;
- unattended publication.

These remain under `WHR-CAL-DYNAMIC-DATES`, `WHR-CAL-OPS-V1`, and later pilot Work IDs.

## Next phase

`WHR-CAL-DYNAMIC-DATES` replaces fixed June 2026 current-view assumptions with explicit build-date/timezone rules, rolling windows, and safe empty/stale states. It must not reactivate source scheduling.

# Calendar validation responsibility contract

Status: active cross-system contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-06

## Purpose

This contract turns the validation split defined by the incremental coverage contract into enforceable implementation responsibilities.

Calendar validation has four separate roles:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

A validator may call lower-level pure helpers, but each public validator entry point must have one primary responsibility. A source-specific validator must not silently convert incompleteness in one role into a failure condition belonging to another role.

## 1. Batch Validation

Batch Validation answers:

> Are the records produced by this run structurally valid, source-safe, rank-consistent, and internally coherent?

It may reject:

- malformed stable IDs;
- invalid dates or times;
- records outside the declared candidate window;
- duplicate records inside the batch;
- unsupported rank shapes;
- invalid source provenance;
- prohibited participant, betting, result, raw-source, or direct-stream fields;
- unsafe state transitions encoded inside the batch.

It must not fail only because:

- a requested month is incomplete;
- the source exposes a shorter horizon than requested;
- another meeting elsewhere remains unresolved;
- a later retry has not yet been performed;
- the run is partial or overlaps an earlier run.

Batch Validation must not write canonical or public data.

## 2. Promotion Validation

Promotion Validation answers:

> May this human-approved candidate safely update canonical meeting data?

It validates:

- approved review state;
- reviewer and review time;
- promotion target;
- authority/source inventory identity;
- Calendar Readiness state;
- stable meeting identity;
- rank shape and confirmed fields;
- source host and freshness constraints;
- deterministic and idempotent canonical merge behavior.

### Normal promotion rule

Normal promotion is monotonic with respect to reviewed rank.

For the same stable meeting identity:

```text
C -> B      allowed
B -> A      allowed
A -> A+     allowed
A+ -> A+    allowed update
A+ -> C     rejected in normal promotion
A -> B+     rejected in normal promotion
```

A later lower-detail observation is not enough to remove previously reviewed detail.

### Corrective downgrade rule

A downgrade may occur only through explicit `corrective_downgrade` mode with a reviewed reason.

Allowed corrective reason classes are:

```text
official_correction
discovered_data_error
source_invalidation
publication_policy_change
rollback
```

Corrective downgrade remains human-reviewed and canonical-only. It does not automatically rewrite public projection data.

The ordinary promotion CLI remains normal-mode only. Corrective downgrade is a separately controlled path and must never be inferred from a lower-rank ordinary candidate.

## 3. Coverage Audit

Coverage Audit answers:

> What did the operator request, what source scope was observed, and what remains unresolved or should be retried?

Coverage Audit may report:

- shorter observed source horizon;
- unresolved dates;
- unresolved meeting IDs;
- source errors;
- pending detail;
- retry targets;
- coverage claim state.

Coverage Audit incompleteness is reportable state. It must not block unrelated valid Batch or Promotion Validation and must not block unrelated valid partial promotions.

Coverage Audit does not claim a whole month or season complete unless a separate Completion Audit proves that claim.

## 4. Completion Audit

Completion Audit answers:

> Is an explicit declared scope complete according to its reviewed authoritative schedule expectation?

Examples:

```text
July 2026 NAR coverage complete
2026 season schedule complete
selected reviewed meeting set complete
```

Only Completion Audit may require every expected meeting inside its declared scope to be resolved.

Completion Audit failure:

- keeps the completion claim false;
- reports gaps and retry targets;
- does not invalidate unrelated valid partial promotions;
- does not delete existing reviewed meeting data.

## Machine-readable responsibility map

The active map is:

```text
data/static/calendar-validation-responsibilities-v1.json
```

It records the four roles, blocking semantics, canonical validators, and known source-specific completion auditors.

The validator is:

```text
scripts/check-calendar-validation-responsibilities.mjs
```

## Current canonical role anchors

### Batch

```text
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
```

This is the shared candidate structural/safety anchor.

### Promotion

```text
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
```

Normal promotion must reject rank regression. Explicit corrective downgrade must require corrective mode and an allowed reason.

### Coverage

```text
scripts/check-calendar-coverage-observation-schema.mjs
scripts/timetable/coverage-observation-validation.mjs
```

These establish requested/observed scope, partial-success, source-error, and coverage-claim boundaries. Source-specific coverage-audit output is added during operator integration.

### Completion

The current source-specific anchor is:

```text
scripts/check-calendar-nar-full-month-candidate-set.mjs
```

This remains a bounded NAR July completion-audit validator. It must not be imported as a normal Batch or Promotion gate for arbitrary incremental NAR updates.

## NAR implementation consequence

After this responsibility split is active, NAR ordinary operation must be refactored so that:

```text
ordinary candidate batch
-> Batch Validation
-> human review
-> Promotion Validation

parallel:
Coverage Observation
-> Coverage Audit
-> retry targets

separate only when claimed:
July Completion Audit
```

The July full-month validator remains available for the completion claim but is removed from the conceptual normal-update gate.

## Banei and later systems

Banei, HKJC, UAE, and later systems inherit these roles.

They may have source-specific validators, but those validators must declare which role they perform and must not make normal partial promotion depend on whole-month or whole-season completeness.

# Calendar machine-readable contracts

Status: active canonical implementation contract  
Work ID: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-07-06

## Purpose

This document maps the active human-readable Calendar contracts to the schemas, machine-readable maps, and validators that enforce them.

Read together:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
```

The shared model is:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

Validation is separated into:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

## Canonical files

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
data/static/timetable-candidate-v1.schema.json
data/static/jra-final-program-intake.schema.json
scripts/timetable/coverage-observation-validation.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-contracts.mjs
scripts/check-authority-source-inventory-schema.mjs
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
scripts/check-calendar-pipeline-v1-promotion.mjs
.github/workflows/calendar-contracts.yml
.github/workflows/calendar-validation-responsibilities.yml
```

## Source capability and readiness

Source Test v2, authority/source inventory, and Calendar Readiness keep these states separate:

```text
Technical Rank
Public Ceiling
Calendar Readiness
Automation Mode
Implementation Status
Source Status
```

A source may support C, B, B+, A, or A+. A meeting may enter the pipeline directly at the highest reviewed rank supported by its evidence. No artificial C-only intermediate publication is required.

## Candidate windows

`timetable-candidate-v1` uses:

```text
candidate_window.start_date
candidate_window.end_date_exclusive
candidate_window.timezone
```

Candidate windows are not inherently monthly. Operators may use arbitrary windows, overlapping retries, one-date runs, or selected-meeting retries when their source-specific contract supports them.

A candidate window describes batch scope. It does not claim that every meeting in the range was available or collected.

## Coverage Observation

The active contract is:

```text
data/static/calendar-coverage-observation.schema.json
docs/calendar/coverage-observation-schema.md
scripts/timetable/coverage-observation-validation.mjs
scripts/check-calendar-coverage-observation-schema.mjs
```

It separates requested scope from observed source scope and records unresolved dates, unresolved meeting IDs, source errors, and coverage claim.

Coverage claims are:

```text
none
partial
source_window_complete
audited_complete
```

`partial` is a normal valid state. `audited_complete` requires an audit reference and zero unresolved items or source errors. `not_observed` does not mean no meeting exists.

Coverage Observation cannot directly delete or downgrade canonical/public data.

## Validation responsibility map

The machine-readable role map is:

```text
data/static/calendar-validation-responsibilities-v1.json
```

Its validator is:

```text
scripts/check-calendar-validation-responsibilities.mjs
```

### Batch Validation

Anchor:

```text
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
```

Checks current-batch structure and safety. It may block a malformed current batch but may not require whole-month completeness or block unrelated valid batches.

### Promotion Validation

Anchors:

```text
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
```

Normal promotion is monotonic by reviewed rank. A lower-rank ordinary candidate cannot overwrite higher reviewed canonical rank.

A corrective downgrade is a separate explicit core mode and requires one reviewed reason from the responsibility map. The ordinary promotion CLI does not expose corrective mode. Corrective downgrade remains canonical-only.

### Coverage Audit

Anchors:

```text
scripts/check-calendar-coverage-observation-schema.mjs
scripts/timetable/coverage-observation-validation.mjs
```

Coverage incompleteness is reportable state. It does not block unrelated valid promotion.

### Completion Audit

Current source-specific anchor:

```text
scripts/check-calendar-nar-full-month-candidate-set.mjs
```

This is a bounded NAR July completion-audit validator. It is not an ordinary Batch or Promotion gate.

## Rank and merge rules

Normal incremental behavior:

```text
A+ + later C observation -> keep A+
A + later B+ observation -> keep A
C + later reviewed A+ -> promote to A+
```

A reviewed downgrade requires the separately controlled corrective path. Freshness and source-health changes remain separate from rank.

## Validation commands

```text
node scripts/check-calendar-contracts.mjs
node scripts/check-calendar-coverage-observation-schema.mjs
node scripts/check-calendar-validation-responsibilities.mjs
node scripts/check-authority-source-inventory-schema.mjs
node scripts/check-calendar-pipeline-v1-candidate-contract.mjs
node scripts/check-calendar-pipeline-v1-promotion.mjs
node scripts/check-jra-final-program-intake-schema.mjs
```

These validators prove schema consistency, stable references, partial shorter source horizons, selected-meeting retry observations, completion-claim boundaries, four-role separation, normal rank-regression rejection, and corrective-path isolation.

## Current next implementation

The shared contract and validator responsibility foundations are complete.

Next:

1. refactor NAR ordinary collection away from fixed July completion gating;
2. support arbitrary windows and overlap-safe retries;
3. support selected-meeting retries;
4. emit Coverage Observation and explicit retry targets;
5. continue NAR incremental review and promotion;
6. keep July full-month validation as a separate completion audit.

## Change discipline

Changes to enums, stable IDs, merge rules, coverage claims, validation responsibilities, corrective downgrade rules, or completion conditions must update the affected machine-readable schema/map, human contract, validator, and roadmap together.

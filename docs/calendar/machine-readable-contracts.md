# Calendar machine-readable contracts

Status: active canonical implementation contract  
Work ID: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-07-06

## Purpose

This document connects the human-readable Source Test v2, Calendar Readiness, candidate, Coverage Observation, and source-inventory contracts to the schemas and validators that enforce them.

## Governing acquisition contract

All Calendar acquisition and maintenance work must review:

```text
docs/calendar/incremental-coverage-contract.md
```

The common model separates:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

A source may emit C, B, B+, A, or A+ directly when reviewed evidence supports that rank. The logical separation does not require an artificial C-only intermediate publication step.

Normal operator updates may use arbitrary and overlapping windows. A partial source horizon is a valid successful outcome when correctly labelled. Month-wide or season-wide completeness must not be a precondition for batch acceptance or promotion of otherwise valid reviewed records.

## Files

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-coverage-observation.schema.json
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
data/static/timetable-candidate-v1.schema.json
data/static/jra-final-program-intake.schema.json
scripts/timetable/coverage-observation-validation.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-contracts.mjs
scripts/check-authority-source-inventory-schema.mjs
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
scripts/check-jra-final-program-intake-schema.mjs
.github/workflows/calendar-contracts.yml
```

The Calendar contracts workflow validates the shared contract/registry set, Coverage Observation schema, and authority-source compatibility together.

## Source Test v2 schema

`data/static/source-test-v2.schema.json` defines:

- country-level summary fields;
- system/source-level decision fields;
- C / B / B+ / A / A+ ranks;
- source format and access mode;
- automation mode;
- refresh classes;
- Calendar Readiness;
- implementation status;
- fallback;
- public-safe exclusions.

Future Source Test v2 outputs use:

```text
docs/timetable-source-tests/<delivery>-<slug>/source-test-v2.json
```

Entries 01-52 predate this schema. Their existing reviewed summaries remain valid evidence and were converted during the completed backfill Work IDs.

## Calendar Readiness registry

`data/static/calendar-readiness-registry.json` is the canonical machine-readable readiness registry.

Actual records are added only by evidence-based backfill or Source Test v2 work. Parser names, intended cadences, old Auto Level labels, and candidate status do not by themselves justify a readiness record.

## Authority source inventory relationship

`data/static/authority-source-inventory.schema.json` and `data/static/authority-source-inventory.json` define the reviewed source records that Calendar Readiness may reference.

The authority inventory records source capability and candidate status. It does not claim Calendar Readiness, implementation status, or a live fetch path. Its capability rank enum is aligned to C / B / B+ / A / A+.

## Candidate contract and arbitrary windows

`data/static/timetable-candidate-v1.schema.json` defines a candidate envelope with:

```text
candidate_window.start_date
candidate_window.end_date_exclusive
candidate_window.timezone
```

The candidate window is not inherently monthly. Source-specific operators may request arbitrary windows, overlapping retries, one-date runs, or selected-meeting retries when their contracts permit them.

A candidate window describes the batch scope. It does not itself assert that every meeting in that range was publicly available or collected.

## Coverage Observation contract

The machine-readable Coverage Observation contract is:

```text
data/static/calendar-coverage-observation.schema.json
docs/calendar/coverage-observation-schema.md
scripts/timetable/coverage-observation-validation.mjs
scripts/check-calendar-coverage-observation-schema.mjs
```

A Coverage Observation distinguishes:

```text
requested scope
observed source scope
collection mode
records discovered
records updated
unresolved dates
unresolved meeting IDs
source errors
coverage claim
completion audit reference
```

Supported collection modes are:

```text
date_window
single_date
selected_meetings
source_visible_horizon
```

Supported coverage claims are:

```text
none
partial
source_window_complete
audited_complete
```

`partial` is a normal valid state. Requested scope and observed scope may differ.

`audited_complete` is the only coverage claim that requires `completion_audit_ref`. It must contain no unresolved dates, unresolved meeting IDs, or source errors.

The schema supports `not_observed` as an observed-scope state when the source scope could not be established safely. This does not mean no meeting exists.

Coverage Observation is operational evidence. It cannot directly delete or downgrade canonical/public data.

## Validation responsibility split

Calendar validation is divided into four roles.

### Batch validation

Checks the current batch for structural validity, safe fields, valid identities, source provenance, duplicate records, supported ranks, and source-specific invariants.

A batch validator must not fail only because the requested month, season, or arbitrary date range is incomplete.

### Promotion validation

Checks whether reviewed records may update canonical data. It validates review state, source/readiness gates, stable identity, rank shape, collision safety, freshness requirements, and deterministic merge behavior.

Valid partial batches must be promotable independently.

### Coverage audit

Reports known gaps, pending detail, unavailable source routes, parser failures, and retry targets for a defined scope.

Coverage audit incompleteness does not block unrelated valid partial promotions.

### Completion audit

Validates an explicit claim such as a complete month, season, or selected meeting set. Only this audit may require every expected meeting in the declared scope to be resolved.

Completion is a claim, not a prerequisite for ordinary incremental maintenance.

## Rank and merge semantics

System-level Technical Rank and Public Ceiling remain separate from meeting-level evidence.

For the same stable meeting identity, a lower-detail later observation must not automatically overwrite higher reviewed detail.

Normal incremental examples:

```text
A+ + later C observation -> keep A+
A + later B+ observation -> keep A
C + later reviewed A+ -> promote to A+
```

A reviewed downgrade remains possible for official correction, discovered data error, source invalidation, publication-policy change, or rollback.

Freshness and source-health changes are separate from capability rank.

## JRA final-program intake

`data/static/jra-final-program-intake.schema.json` defines the closed input accepted before JRA final confirmation. The companion validator rejects unknown keys, invalid identity/date/time structures, duplicate meetings, unreviewed approval metadata, prohibited detail fields, and any claimed candidate/canonical/public write.

## Stable references

Each readiness record links to:

- `country_id` from `docs/country-pages/98-country-tracker.tsv`;
- the matching tracker `delivery_no`;
- optional `authority_source_key` in the form `country_id/authority_id/official_source_id`;
- optional racecourse IDs from `data/static/racecourses.json`;
- a public-safe source-test summary under `docs/timetable-source-tests/`.

The stable readiness ID uses:

```text
country--system--source-or-scope
```

## State separation

The registry keeps these separate:

```text
Technical Rank
Public Ceiling
Calendar Readiness
Automation Mode
Implementation Status
Source Status
Coverage Observation / Coverage Claim
```

`ready` does not mean `public_active`. Likewise, `partial` coverage does not mean a failed batch, and `audited_complete` must not be inferred from a successful fetch alone.

## Validation

Run:

```text
node scripts/check-calendar-contracts.mjs
node scripts/check-calendar-coverage-observation-schema.mjs
node scripts/check-authority-source-inventory-schema.mjs
node scripts/check-calendar-pipeline-v1-candidate-contract.mjs
node scripts/check-jra-final-program-intake-schema.mjs
```

The validators check:

- enum agreement across Source Test v2, Calendar Readiness, and authority inventory rank schemas;
- Coverage Observation schema/validation-core agreement;
- valid shorter observed horizons under `partial`;
- selected-meeting retry observations;
- `audited_complete` audit-reference and no-unresolved-item rules;
- public-safe exclusion of raw, participant, betting, credential, and direct-stream key families;
- 98-country tracker references;
- authority/source keys;
- racecourse IDs;
- date and record-key formats;
- Public Ceiling not exceeding Technical Rank;
- readiness/automation/fallback closure rules;
- registry counts;
- current and next Work IDs in roadmap documents.

The next shared implementation work is the explicit batch/promotion/coverage/completion validator separation, followed by NAR ordinary-operator refactoring.

## Change discipline

Any PR that changes an enum, required field, closure rule, stable ID, reference source, merge rule, coverage claim, or completion condition must update together:

- the affected machine-readable schema;
- the human-readable contract;
- this document;
- the validator;
- the registry when existing records are affected;
- the project roadmap when the Work ID or completion condition changes.

# Calendar machine-readable contracts

Status: active canonical implementation contract  
Work ID: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

This document connects the human-readable Source Test v2 and Calendar Readiness contracts to the files and validators that enforce them.

## Files

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
data/static/jra-final-program-intake.schema.json
scripts/check-calendar-contracts.mjs
scripts/check-authority-source-inventory-schema.mjs
scripts/check-jra-final-program-intake-schema.mjs
.github/workflows/calendar-contracts.yml
```

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

Entries 01-52 predate this schema. Their existing reviewed summaries remain valid evidence and are converted during the three backfill Work IDs. Do not rename or rewrite all historical summaries merely to satisfy the new filename.

## Calendar Readiness registry

`data/static/calendar-readiness-registry.json` is the canonical machine-readable readiness registry.

The initial registry deliberately contains no country records. This is not missing work hidden as success. It records:

```text
bootstrap_status: pending_backfill_01_52
countries_with_closed_decision: 0
readiness_records: 0
```

Actual records are added only by evidence-based backfill or Source Test v2 work. Parser names, intended cadences, old Auto Level labels, and candidate status do not by themselves justify a readiness record.

## Authority source inventory relationship

`data/static/authority-source-inventory.schema.json` and `data/static/authority-source-inventory.json` define the reviewed source records that Calendar Readiness may reference.

The authority inventory records source capability and candidate status. It does not claim Calendar Readiness, implementation status, or a live fetch path. Its capability rank enum is aligned to C / B / B+ / A / A+.

## JRA final-program intake

`data/static/jra-final-program-intake.schema.json` defines the closed input accepted before JRA final confirmation. The companion validator rejects unknown keys, invalid identity/date/time structures, duplicate meetings, unreviewed approval metadata, prohibited detail fields, and any claimed candidate/canonical/public write. No actual final fixture is committed by the schema foundation.

## Stable references

Each readiness record links to:

- `country_id` from `docs/country-pages/98-country-tracker.tsv`;
- the matching tracker `delivery_no`;
- optional `authority_source_key` in the form `country_id/authority_id/official_source_id`, which must exist in `data/static/authority-source-inventory.json`;
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
```

`ready` does not mean `public_active`. A source can be ready for implementation while no parser or scheduler exists.

## Validation

Run:

```text
node scripts/check-calendar-contracts.mjs
node scripts/check-authority-source-inventory-schema.mjs
node scripts/check-jra-final-program-intake-schema.mjs
```

The validators check:

- exact enum agreement across Source Test v2, Calendar Readiness, and authority inventory rank schemas;
- 98-country tracker references;
- authority/source keys;
- racecourse IDs;
- date and record-key formats;
- Public Ceiling not exceeding Technical Rank;
- readiness/automation/fallback closure rules;
- registry counts;
- public-safe exclusions;
- current and next Work IDs in the roadmap and entry point;
- future `source-test-v2.json` files when they are added.

The dedicated GitHub Actions workflow runs without dependency installation and does not request a Cloudflare deployment.

## Change discipline

Any PR that changes an enum, required field, closure rule, stable ID, or reference source must update together:

- the affected machine-readable schema;
- the human-readable contract;
- this document;
- the validator;
- the registry when existing records are affected;
- the project roadmap when the Work ID or completion condition changes.

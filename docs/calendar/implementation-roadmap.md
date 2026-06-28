# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-06-28

## Purpose

This roadmap begins after Calendar Readiness is defined and continues through maintained public calendar operation.

It does not assume that the repository starts from zero. Existing timetable schemas, candidate generators, generated datasets, validators, refresh commands, and public pages must be audited and reused where valid.

## Stage 1 — contract implementation

Work ID: `WHR-CAL-CONTRACT-02`

Deliver:

- machine-readable Source Test v2 and Calendar Readiness schemas;
- readiness registry and summary generation;
- stable system/source keys;
- reference validation against country, authority, source, and racecourse IDs;
- enum consistency checks for rank, source status, automation, readiness, refresh, and fallback;
- roadmap and documentation-link validation.

No live acquisition or public display change belongs in this stage.

## Stage 2 — readiness backfill and new research

Backfill entries 01-52 from reviewed evidence, then use Source Test v2 for entries 53-98.

A backfill may conclude that an existing registry parser name is only planned, not implemented. It must record the proven state, not the intended state.

## Stage 3 — combined research handoff

Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Generate:

- readiness registry;
- readiness summary by country and system;
- automatic, semi-automatic, manual, link-only, blocked, and not-applicable counts;
- implementation priority matrix;
- blocked and revalidation report;
- source freshness report;
- country-page completion report.

## Stage 4 — existing baseline reconciliation

Work ID: `WHR-CAL-BASELINE-RECONCILE`

Audit:

- source inventories and source registries;
- acquisition route records;
- local/manual snapshot contracts;
- adapters, parser fixtures, candidate generators, and promotion tools;
- canonical and public generated timetable data;
- publication display policies;
- Calendar, Today, Tomorrow, country, racecourse, and meeting-detail readers;
- refresh commands and workflows;
- fixed dates, seeds, sample assets, and PR-specific scripts.

Classify each item as:

```text
retain
repair
migrate
replace
archive
```

Required output is a migration map, not immediate deletion.

## Stage 5 — pipeline v1

Work IDs:

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
```

### Pipeline

Standardize:

```text
official source
-> reviewed adapter or manual import
-> extracted candidate
-> normalization
-> validation
-> human promotion
-> canonical meeting data
-> public display projection
-> static build
```

### Date behaviour

Replace preview-era fixed dates with:

- build-date aware Today and Tomorrow;
- rolling Calendar window;
- explicit timezone rules;
- empty-state wording that does not claim absence of racing;
- historical and future-window handling.

### Operations

Implement:

- candidate-generation schedules;
- source-health and stale reports;
- reviewable generated-update PRs;
- no routine direct self-publication;
- rollback and pause controls;
- seasonal rollover procedures;
- source-breakage runbook.

## Stage 6 — pilot activation

Activate one reviewed system at a time:

```text
WHR-CAL-JAPAN-JRA
WHR-CAL-JAPAN-NAR
WHR-CAL-JAPAN-BANEI
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Each pilot requires:

```text
[ ] reviewed source and readiness record
[ ] stable IDs
[ ] fixture-backed extraction
[ ] bounded candidate output
[ ] prohibited-field guard
[ ] normalized output validation
[ ] human promotion path
[ ] public rank enforcement
[ ] freshness and stale handling
[ ] fallback and rollback
[ ] English/Japanese rendered QA
[ ] operations documentation
```

A pilot may be automatic, semi-automatic, or manual. The mode must match the evidence.

## Stage 7 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria:

- Calendar, Today, and Tomorrow use dynamic dates;
- approved pilots provide maintained records;
- one meeting remains one list row;
- C / B / B+ / A / A+ display boundaries pass;
- coverage, source status, and last checked date are visible where required;
- stale or failed sources downgrade safely;
- official links remain available;
- no entries, odds, results, payouts, predictions, complete racecards, raw source text, embedded video, or direct streams are published;
- bilingual routes and responsive rendering pass;
- operational ownership and recovery steps are documented.

## Stage 8 — expansion cohorts

Select systems from the priority matrix. Do not select solely by country fame.

Priority factors:

1. official-source stability;
2. source coverage completeness;
3. useful timetable depth;
4. bounded implementation complexity;
5. sustainable refresh cost;
6. publication safety;
7. seasonal timing;
8. user value.

A cohort may mix:

- automatic A/A+ systems;
- automatic or semi-automatic C/B/B+ systems;
- manual PDF/import systems;
- link-only systems.

## Stage 9 — steady-state maintenance

Daily:

- candidate and extraction-error review;
- Today/Tomorrow sanity check;
- approve, hold, or reject changes.

Weekly:

- stale and source-health review;
- manual/semi-automatic updates;
- broken-link triage.

Monthly:

- source and readiness revalidation;
- adapter and fixture review;
- priority matrix update.

Seasonally:

- annual fixture rollover;
- off-season and restart handling;
- archive and discontinued-source review.

## Deployment rule

Follow `docs/operations/deployment-and-ci-policy.md`.

- research, contracts, schemas, fixtures, candidates, and non-public runtime work use GitHub validation and no Cloudflare preview;
- rendered Calendar changes use one final preview when materially required;
- production deployment occurs only after the approved publish/release merge.

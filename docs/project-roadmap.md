# Where Horses Run project roadmap

Status: active canonical project roadmap  
Current Work ID: `WHR-PUB-53-60`  
Next Work ID: `WHR-ST2-61-68`  
Last reviewed: 2026-06-29

## Purpose

This roadmap covers the full product, not only the 98-country page programme.

```text
official-source research
-> capability and publication decisions
-> bilingual country pages
-> Calendar Readiness
-> reviewed acquisition and candidate generation
-> human-approved public timetable data
-> Calendar / Today / Tomorrow / country / racecourse / meeting views
-> recurring maintenance and expansion
```

## Product destination

Where Horses Run is a bilingual, static-first world racing calendar and timetable guide that:

- publishes English and Japanese pages for all 98 tracked countries and regions;
- identifies racing systems, authorities, racecourses, and official sources;
- shows the maximum reviewed timetable detail available for each source;
- keeps Technical Rank separate from Public Ceiling;
- supports automatic, semi-automatic, manual, link-only, blocked, and not-applicable treatments;
- publishes only reviewed meeting and timetable fields;
- directs users to official sources for final confirmation.

## Current position

```text
published country pages:       52
profile_ready:                  8
note_reviewed:                  0
source_tested:                  0
not_started:                   38
total countries/regions:       98
published routes:              52 EN + 52 JA = 104
final bilingual route target:  98 EN + 98 JA = 196
```

Publication debt:

- entries 29-36 are published after the approved rendered preview;
- entries 37-44 are published after the approved rendered preview;
- entries 45-52 are published after the approved rendered preview.

Calendar baseline already exists:

- Calendar, Today, Tomorrow, and meeting-detail surfaces;
- C / B / B+ / A / A+ display handling;
- canonical and public generated timetable datasets;
- source, fixture, normalizer, candidate, promotion, and UI validators;
- Japan JRA, NAR, and Banei candidate work;
- Hong Kong and UAE acquisition work;
- a major-country source registry and refresh commands.

The baseline is not yet a complete continuously updated calendar:

- Calendar/date helpers still contain June 2026 preview assumptions;
- generated records include seed and preview dates;
- the shared refresh core still reports `skeleton_no_live_fetch`;
- registered parsers and cadences do not prove live acquisition;
- Calendar Readiness decisions are closed through entry 60, covering 60 countries and 78 system/source records.

## Governing rules

### Research drives both country pages and Calendar

```text
official source test
-> system and coverage split
-> Technical Rank
-> Public Ceiling
-> acquisition and maintenance decision
-> reviewed note
-> bilingual Profile v2
-> page QA and publication
```

### Country and Calendar completion are separate

A country page may be published while a calendar source remains manual, link-only, blocked, or not applicable. Both states use stable IDs but are tracked separately.

### Candidate generation is not publication

```text
official source
-> adapter or reviewed import
-> candidate
-> validation
-> human review
-> promotion
-> public generated data
-> static build
```

## Work identification

Use stable Work IDs. GitHub PR numbers are recorded after creation but do not define the schedule.

Every substantive PR records the Work ID, canonical documents reviewed, tracker/registry changes, runtime behaviour, display boundary, deployment requirement, completion conditions, and next Work ID.

Historical transition record from the state closed by PR #323:

> Current Work ID: `WHR-CAL-BACKFILL-37-52`  
> Next Work ID: `WHR-CP-PROFILE-45-52`

## Phase 0 — governance alignment

Completed through PR #314 and PR #315:

- document authority;
- project roadmap;
- Calendar contracts and implementation roadmap;
- local/raw source boundary;
- documentation indexes and governance validation.

## Phase 1 — machine-readable Calendar contracts

Completed Work ID: `WHR-CAL-CONTRACT-02` via PR #316.

Delivered:

- `data/static/source-test-v2.schema.json`;
- `data/static/calendar-readiness.schema.json`;
- bootstrap `data/static/calendar-readiness-registry.json`;
- stable country, authority/source, and racecourse reference rules;
- C / B / B+ / A / A+ enum alignment;
- automation, readiness, implementation, refresh, fallback, and source-status enums;
- `scripts/check-calendar-contracts.mjs`;
- dedicated GitHub Actions validation;
- no live acquisition and no invented readiness records.

Completion moves the programme to `WHR-CP-PUB-29-36`.

## Phase 2 — clear publication debt

Completed:

- `WHR-CP-PUB-29-36` via PR #317 after immutable rendered-preview approval.
- `WHR-CP-PUB-37-44` via PR #319 after rendered-preview approval.
- `WHR-CP-PUB-45-52` via PR #325 after rendered-preview approval.

The publication debt for entries 29-52 is closed.

## Phase 3 — Calendar Readiness backfill

Completed:

- `WHR-CAL-BACKFILL-01-20` via PR #321 with 20 closed countries and 30 system/source records.
- `WHR-CAL-BACKFILL-21-36` via PR #322 with 16 additional countries and 21 additional system/source records.
- `WHR-CAL-BACKFILL-37-52` via PR #323 with 16 additional countries and 19 additional system/source records.

Calendar Readiness backfill 01-52 is complete.

Next programme Work ID: `WHR-ST2-53-60`

```text
WHR-CAL-BACKFILL-01-20
WHR-CAL-BACKFILL-21-36
WHR-CAL-BACKFILL-37-52
```

Reuse reviewed evidence. Do not invent automation claims, parser availability, or nationwide coverage.

## Phase 4 — finish entries 45-52

Completed: `WHR-CP-PROFILE-45-52` via PR #324 and `WHR-CP-PUB-45-52` via PR #325.

```text
WHR-CP-PROFILE-45-52
WHR-CP-PUB-45-52
```

## Phase 5 — complete entries 53-98 under Source Test v2

Completed: `WHR-ST2-53-60` via PR #326, `WHR-NOTE-53-60` via PR #327, and `WHR-PROFILE-53-60` via PR #328.

Current Work ID: `WHR-PUB-53-60`

```text
WHR-ST2-53-60 -> WHR-NOTE-53-60 -> WHR-PROFILE-53-60 -> WHR-PUB-53-60
WHR-ST2-61-68 -> WHR-NOTE-61-68 -> WHR-PROFILE-61-68 -> WHR-PUB-61-68
WHR-ST2-69-76 -> WHR-NOTE-69-76 -> WHR-PROFILE-69-76 -> WHR-PUB-69-76
WHR-ST2-77-84 -> WHR-NOTE-77-84 -> WHR-PROFILE-77-84 -> WHR-PUB-77-84
WHR-ST2-85-92 -> WHR-NOTE-85-92 -> WHR-PROFILE-85-92 -> WHR-PUB-85-92
WHR-ST2-93-98 -> WHR-NOTE-93-98 -> WHR-PROFILE-93-98 -> WHR-PUB-93-98
```

Each wave remains Source Test, Reviewed Note, Profile v2, and QA/Publish, but Source Test v2 also closes the Calendar decision.

## Phase 6 — combined 98-country and readiness audit

Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Required outcomes:

- 98 tracker rows and 196 published bilingual routes;
- every country has a calendar decision;
- every reviewed system/source has a closed readiness state;
- Technical Rank, Public Ceiling, automation mode, fallback, freshness, and revalidation are recorded where applicable;
- no unexplained unknown state remains;
- implementation priority and blocked/link-only reports are generated.

This closes the 98-country research/page programme. It does not close the product.

## Phase 7 — reconcile the existing Calendar baseline

Work ID: `WHR-CAL-BASELINE-RECONCILE`

Classify schemas, registries, generated data, candidate paths, display policies, refresh commands, fixed dates, seed data, and PR-specific scripts as:

```text
retain
repair
migrate
replace
archive
```

## Phase 8 — activate the reviewed pipeline

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
```

Deliver one adapter contract, fixture-backed parsing, candidate/promotion gates, dynamic dates, rolling window, stale/failure handling, scheduled candidate generation, reviewable update PRs, pause, and rollback.

## Phase 9 — pilot source activation

```text
WHR-CAL-JAPAN-JRA
WHR-CAL-JAPAN-NAR
WHR-CAL-JAPAN-BANEI
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Each pilot must pass acquisition, normalization, validation, human promotion, display, stale handling, fallback, and rollback documentation.

## Phase 10 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Require dynamic Calendar, Today, and Tomorrow dates; maintained pilot data; visible source, coverage, and freshness; rank boundaries; official fallback; bilingual QA; and operations runbooks.

## Phase 11 — expansion and steady-state operations

Choose cohorts from Calendar Readiness using source stability, completeness, timetable depth, maintenance cost, publication safety, season timing, and user value.

Ongoing operation includes daily candidate/failure review, weekly stale review, monthly source revalidation, seasonal fixture rollover, controlled rank changes, adapter maintenance, and country/racecourse/glossary/search improvements.

## Required reading

Every PR:

1. `docs/governance/document-authority.md`
2. this roadmap
3. `docs/operations/deployment-and-ci-policy.md`

Country-page work also reads the country roadmap, active addendum, completion contract, Calendar addendum, and tracker.

Calendar work also reads Source Test v2, Calendar Readiness, machine-readable contracts, implementation roadmap, applicable records, and global timetable architecture.

## Maintenance

Update this roadmap in the same PR whenever the current or next Work ID, phase boundary, completion condition, material tracker/readiness count, component status, or deployment model changes.

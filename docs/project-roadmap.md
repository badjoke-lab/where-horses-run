# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Current Work ID: `WHR-CAL-JAPAN-JRA`  
Next Work ID: `WHR-CAL-JAPAN-NAR`  
Last reviewed: 2026-07-01

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
published country pages:       98
published routes:              98 EN + 98 JA = 196
Profile v2 records:            98
Calendar Readiness countries:  98
Calendar Readiness records:   116
Authority/source records:     116
country-page programme: complete
```

The 98-country bilingual publication programme and its final canonical audit are complete. Transition overlays remain as historical evidence; active state is read from the canonical tracker and registries.

The existing Calendar baseline, Pipeline v1 foundation, Dynamic Dates, and Operations v1 are complete. The current product phase is the JRA source pilot: obtain a fresh reviewed official fixture, generate bounded candidates, retain human promotion, and prove fallback and rollback without unattended publication.

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

Completed publication waves:

- entries 53-60: PRs #326-#329;
- entries 61-68: PRs #330-#333;
- entries 69-76: PRs #335, #336, #338, and #340;
- entries 77-84: PRs #341-#345;
- entries 85-92: PRs #346-#351;
- entries 93-98: PRs #352-#356.

Every wave completed Source Test v2, reviewed notes, bilingual Profile v2, rendered QA, and publication. Source Test v2 also closed the Calendar Readiness decision for each reviewed system/source.

## Phase 6 — combined 98-country and readiness audit

Completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Completed outcomes:

- 98 canonical tracker rows and 196 published bilingual routes;
- 98 countries with closed Calendar Readiness decisions;
- 116 canonical authority/source records;
- 116 canonical Calendar Readiness records;
- canonical state no longer depends on transition overlays at runtime;
- legacy wave validators are archived behind explicit opt-in;
- Profile v2 runtime no longer depends on final-wave loader mutation;
- final governance, Calendar, runtime, and production-build checks pass.

This closes the 98-country research/page programme. It does not close the product.

## Phase 7 — reconcile the existing Calendar baseline

Status: complete  
Work ID: `WHR-CAL-BASELINE-RECONCILE`

Completed through the reviewed human-readable and machine-readable migration map:

- 37 component groups classified as retain, repair, migrate, replace, or archive;
- normal production build/check made read-only;
- incomplete daily refresh schedule paused;
- no broad deletion before provenance and assertion migration;
- no Technical Rank, Public Ceiling, or readiness change.

Canonical result:

```text
docs/calendar/baseline-reconciliation-map.md
data/audits/calendar-baseline-migration-map.json
scripts/check-calendar-baseline-reconciliation.mjs
```

## Phase 8 — activate the reviewed pipeline

Status: Pipeline v1, Dynamic Dates, and Operations v1 complete; JRA pilot current  
Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`  
Current Work ID: `WHR-CAL-JAPAN-JRA`  
Next Work ID: `WHR-CAL-JAPAN-NAR`

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
```

Pipeline v1 delivered the read-only build boundary, candidate v1 contract, human canonical promotion, deterministic public projection, production runtime import guard, JRA reference adapter, rendered public release QA, and grouped release gate.

Dynamic Dates replaced fixed preview dates with explicit date/timezone rules. Operations v1 delivered source-health status, review packages, pause/rollback controls, seasonal rollover, and source-breakage escalation. The JRA pilot now starts from a freshness-blocked reference candidate and requires fresh reviewed evidence.

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

# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Last reviewed: 2026-07-02

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

The 98-country bilingual publication programme and its final canonical audit are complete. Transition overlays remain historical evidence; active state is read from canonical trackers and registries.

The existing Calendar baseline, Pipeline v1 foundation, Dynamic Dates, and Operations v1 are complete. The JRA implementation foundation is complete. Japan policy now approves Technical Rank A+ and Public Ceiling A+ separately for JRA central racing, NAR/local-government racing, and Banei Tokachi. The current phase reconciles older C/A assumptions in active registries, profiles, source summaries, validators, roadmaps, and generated public data before new pilot activation proceeds.

Current implementation plan:

- `docs/calendar/japan-a-plus-reconciliation-plan.md`.

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

A country page may be published while a Calendar source remains manual, link-only, blocked, or not applicable. Both states use stable IDs but are tracked separately.

### System ceiling and meeting evidence are separate

A system-level Technical Rank or Public Ceiling defines the maximum reviewed capability. It does not raise an individual meeting above the highest rank supported by reviewed canonical fields.

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

Scheduled and unattended canonical/public writes remain disabled unless separately approved.

## Work identification

Use stable Work IDs. GitHub PR numbers are recorded after creation but do not define the schedule.

Every substantive PR records the Work ID, canonical documents reviewed, specifications reviewed, tracker/registry changes, runtime behaviour, display boundary, deployment requirement, validation results, out-of-scope work, completion conditions, and next Work ID.

Historical transition record from the state closed by PR #323:

> Current Work ID: `WHR-CAL-BACKFILL-37-52`  
> Next Work ID: `WHR-CP-PROFILE-45-52`

## Phase 0 — governance alignment

Status: complete

Completed through PR #314 and PR #315:

- document authority;
- project roadmap;
- Calendar contracts and implementation roadmap;
- local/raw source boundary;
- documentation indexes and governance validation.

## Phase 1 — machine-readable Calendar contracts

Status: complete  
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

## Phase 2 — clear publication debt

Status: complete

- `WHR-CP-PUB-29-36` via PR #317 after immutable rendered-preview approval;
- `WHR-CP-PUB-37-44` via PR #319 after rendered-preview approval;
- `WHR-CP-PUB-45-52` via PR #325 after rendered-preview approval.

The publication debt for entries 29-52 is closed.

## Phase 3 — Calendar Readiness backfill

Status: complete

- `WHR-CAL-BACKFILL-01-20` via PR #321 with 20 closed countries and 30 system/source records;
- `WHR-CAL-BACKFILL-21-36` via PR #322 with 16 additional countries and 21 additional system/source records;
- `WHR-CAL-BACKFILL-37-52` via PR #323 with 16 additional countries and 19 additional system/source records.

Calendar Readiness backfill 01-52 is complete. Reuse reviewed evidence. Do not invent automation claims, parser availability, or nationwide coverage.

## Phase 4 — finish entries 45-52

Status: complete

`WHR-CP-PROFILE-45-52` completed via PR #324 and `WHR-CP-PUB-45-52` via PR #325.

## Phase 5 — complete entries 53-98 under Source Test v2

Status: complete

Completed publication waves:

- entries 53-60: PRs #326-#329;
- entries 61-68: PRs #330-#333;
- entries 69-76: PRs #335, #336, #338, and #340;
- entries 77-84: PRs #341-#345;
- entries 85-92: PRs #346-#351;
- entries 93-98: PRs #352-#356.

Every wave completed Source Test v2, reviewed notes, bilingual Profile v2, rendered QA, and publication. Source Test v2 also closed the Calendar Readiness decision for each reviewed system/source.

## Phase 6 — combined 98-country and readiness audit

Status: complete  
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
Completed Work ID: `WHR-CAL-BASELINE-RECONCILE`

Completed through the reviewed human-readable and machine-readable migration map:

- 37 component groups classified as retain, repair, migrate, replace, or archive;
- normal production build/check made read-only;
- incomplete daily refresh schedule paused;
- no broad deletion before provenance and assertion migration;
- no Technical Rank, Public Ceiling, or readiness change during baseline reconciliation.

Canonical result:

```text
docs/calendar/baseline-reconciliation-map.md
data/audits/calendar-baseline-migration-map.json
scripts/check-calendar-baseline-reconciliation.mjs
```

## Phase 8 — activate the reviewed pipeline

Status: Pipeline v1, Dynamic Dates, and Operations v1 complete  
Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`

Pipeline v1 delivered the read-only build boundary, candidate v1 contract, human canonical promotion, deterministic public projection, production runtime import guard, JRA reference adapter, rendered public release QA, and grouped release gate.

Dynamic Dates replaced fixed preview dates with explicit date/timezone rules. Operations v1 delivered source-health status, review packages, pause/rollback controls, seasonal rollover, and source-breakage escalation.

## Phase 9 — Japan A+ policy reconciliation

Status: current  
Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

Approved policy:

| Japan system | Technical Rank | Public Ceiling |
| --- | --- | --- |
| JRA central racing | A+ | A+ |
| NAR and local-government racing | A+ | A+ |
| Banei Tokachi | A+ | A+ |

The three systems remain separate. Current work aligns:

- the active Calendar Readiness registry and Japan v2 readiness records;
- authority/source inventory;
- Japan Source Test v2 summary;
- Japan Profile v2;
- legacy pilot controls and validators;
- public projection and JRA A+ detail output;
- canonical project and Calendar roadmaps.

Completion does not enable unattended publication. Individual meeting records remain evidence-bound.

## Phase 10 — Japan pilot activation

```text
WHR-CAL-JAPAN-JRA-A-PLUS
WHR-CAL-JAPAN-NAR-A-PLUS
WHR-CAL-JAPAN-BANEI-A-PLUS
WHR-CAL-JAPAN-INTEGRATION
```

Each pilot must pass source review, acquisition or reviewed import, fixture-backed extraction, normalization, validation, prohibited-field guards, human promotion, public-rank enforcement, freshness/stale handling, fallback/rollback, bilingual rendered QA, and operations documentation.

### JRA A+

Use a fresh reviewed final fixture and the existing Pipeline v1 foundation. Regenerate public projections so reviewed A+ meetings may expose approved A+ programme-summary fields on meeting detail pages.

### NAR A+

Build authority- and racecourse-specific route mapping. Do not flatten local-government racing into a JRA-like national feed.

### Banei A+

Use Banei-specific source routes and terminology. Do not impose flat-racing surface and course assumptions.

### Japan integration

Validate same-day three-system output across Calendar, Today, Tomorrow, country, racecourse, and meeting pages with source health, freshness, fallback, rollback, and bilingual QA.

## Phase 11 — additional pilot activation

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Each pilot follows Pipeline v1, human promotion, display-boundary, freshness, stale, fallback, rollback, and bilingual QA requirements.

## Phase 12 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Require:

- dynamic Calendar, Today, and Tomorrow dates;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible source, coverage, and freshness;
- safe stale/failure downgrade and official fallback;
- bilingual responsive QA;
- operations and recovery ownership;
- no participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, or direct-stream output.

## Phase 13 — racecourse pages and page-link architecture

Strengthen racecourse pages after Calendar Public v1:

- one canonical page per racecourse;
- current and next meeting state;
- recent reviewed meetings;
- course and distance profile;
- official sources and freshness;
- country, Calendar, racing-type, and glossary links;
- bilingual responsive QA.

Implementation follows the racecourse-page specification and page-link architecture documents.

## Phase 14 — glossary, racing types, search, filtering, and SEO

Implement reviewed terminology, local names, readings and pronunciation metadata where supported, racing-type navigation, search and filters, no-JavaScript fallback, responsive navigation, sitemap, canonical/hreflang, structured data, methodology, coverage, and known-limitations pages.

## Phase 15 — expansion and steady-state operations

Choose cohorts from Calendar Readiness using source stability, completeness, timetable depth, maintenance cost, publication safety, season timing, and user value.

Ongoing operation includes daily candidate/failure review, weekly stale review, monthly source revalidation, seasonal fixture rollover, controlled rank changes, adapter maintenance, and country/racecourse/glossary/search improvements.

## Required reading

Every PR:

1. `docs/governance/document-authority.md`;
2. this roadmap;
3. `docs/calendar/implementation-roadmap.md` for Calendar work;
4. the active implementation plan, including `docs/calendar/japan-a-plus-reconciliation-plan.md` while current;
5. `docs/operations/deployment-and-ci-policy.md`;
6. applicable machine-readable policies, readiness records, controls, source records, profiles, and display-boundary specifications.

Country-page work also reads the country roadmap, active addendum, completion contract, Calendar addendum, and tracker.

Calendar work also reads Source Test v2, Calendar Readiness, machine-readable contracts, applicable records, and global timetable architecture.

## Maintenance

Update this roadmap in the same PR whenever the current or next Work ID, phase boundary, completion condition, material tracker/readiness count, component status, deployment model, or active canonical plan changes.

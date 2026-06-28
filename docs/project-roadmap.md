# Where Horses Run project roadmap

Status: active canonical project roadmap  
Current Work ID: `WHR-GOV-ROADMAP-01`  
Last reviewed: 2026-06-28

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

Where Horses Run is a bilingual, static-first world racing calendar and timetable guide. It should:

- publish English and Japanese pages for all 98 tracked countries and regions;
- identify racing systems, authorities, racecourses, and official sources;
- show the maximum reviewed timetable detail available for each source;
- keep technical capability separate from public display permission;
- support automatic, semi-automatic, manual, link-only, blocked, and not-applicable treatments;
- publish only reviewed meeting and timetable fields;
- direct users to official sources for final confirmation.

## Current position

Country pages:

```text
published:       28
profile_ready:   16
note_reviewed:    8
not_started:     46
total:           98
published routes: 28 English + 28 Japanese = 56
final target:     98 English + 98 Japanese = 196
```

Publication debt:

- entries 29-36 and 37-44 have stale Draft gates and must be rebuilt from current `main`;
- entries 45-52 need Profile v2 and publication.

Calendar baseline already exists:

- Calendar, Today, Tomorrow, and meeting-detail surfaces;
- C / B / B+ / A / A+ public-rank handling;
- canonical and public generated timetable datasets;
- source, fixture, normalizer, candidate, promotion, and UI validators;
- Japan JRA, NAR, and Banei candidate work;
- Hong Kong and UAE acquisition work;
- a major-country source registry covering 13 countries and 24 active source groups;
- shared refresh commands.

The baseline is not yet a complete continuously updated calendar:

- Calendar and date helpers still contain June 2026 preview-era assumptions;
- generated records include seed and preview dates;
- the shared refresh core still reports `skeleton_no_live_fetch`;
- registered parsers and cadences do not by themselves prove live acquisition;
- Calendar Readiness is not yet closed for every country, system, authority, and source.

## Governing rules

### Research drives both products

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

Country pages are reader-facing results of the same research that prepares the calendar.

### Country and calendar completion are separate

A country page may be published while a calendar source remains manual, link-only, blocked, or not applicable. Both states use stable IDs but are tracked separately.

### Rank model

```text
Technical Rank = what the reviewed official source can provide
Public Ceiling = what Where Horses Run may display
Effective Public Rank = the lower approved rank applied to a public record
```

### No forced automation

A closed calendar decision may be:

```text
automatic
semi_automatic
manual_import
manual_confirmation
link_only
blocked
not_applicable
```

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

Every substantive PR records the Work ID, programme, canonical documents reviewed, tracker or registry changes, runtime behaviour, display boundary, deployment requirement, completion conditions, and next Work ID.

## Programme phases

### Phase 0 — governance and contract alignment

Current: `WHR-GOV-ROADMAP-01`

Create document authority, this roadmap, Calendar contracts, implementation roadmap, baseline audit, and aligned indexes and validators.

Next: `WHR-CAL-CONTRACT-02`

Implement the readiness schema, registry, validators, and consistency checks without activating live acquisition.

### Phase 1 — clear publication debt

```text
WHR-CP-PUB-29-36
WHR-CP-PUB-37-44
```

### Phase 2 — Calendar Readiness backfill

```text
WHR-CAL-BACKFILL-01-20
WHR-CAL-BACKFILL-21-36
WHR-CAL-BACKFILL-37-52
```

Reuse reviewed evidence. Do not invent automation claims.

### Phase 3 — finish entries 45-52

```text
WHR-CP-PROFILE-45-52
WHR-CP-PUB-45-52
```

### Phase 4 — complete entries 53-98 under Source Test v2

Each wave remains Source Test, Reviewed Note, Profile v2, and QA/Publish, but Source Test v2 also closes the calendar decision.

```text
WHR-ST2-53-60 -> WHR-NOTE-53-60 -> WHR-PROFILE-53-60 -> WHR-PUB-53-60
WHR-ST2-61-68 -> WHR-NOTE-61-68 -> WHR-PROFILE-61-68 -> WHR-PUB-61-68
WHR-ST2-69-76 -> WHR-NOTE-69-76 -> WHR-PROFILE-69-76 -> WHR-PUB-69-76
WHR-ST2-77-84 -> WHR-NOTE-77-84 -> WHR-PROFILE-77-84 -> WHR-PUB-77-84
WHR-ST2-85-92 -> WHR-NOTE-85-92 -> WHR-PROFILE-85-92 -> WHR-PUB-85-92
WHR-ST2-93-98 -> WHR-NOTE-93-98 -> WHR-PROFILE-93-98 -> WHR-PUB-93-98
```

### Phase 5 — combined 98-country and readiness audit

Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Required outcomes:

- 98 tracker rows and 196 published bilingual routes;
- every country has a calendar decision;
- every reviewed system or source has a closed readiness state;
- Technical Rank, Public Ceiling, automation mode, fallback, freshness, and revalidation are recorded where applicable;
- no unexplained unknown state remains;
- priority and blocked/link-only reports are generated.

This closes the 98-country research and page programme. It does not close the product.

### Phase 6 — reconcile the existing calendar baseline

Work ID: `WHR-CAL-BASELINE-RECONCILE`

Classify current schemas, registries, generated data, candidate paths, display policies, refresh commands, Calendar views, fixed-date logic, seed data, and PR-specific scripts as:

```text
retain
repair
migrate
replace
archive
```

### Phase 7 — activate the reviewed pipeline

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
```

Deliver one adapter contract, fixture-backed parsing, candidate and promotion gates, dynamic dates and rolling window, stale/failure behaviour, scheduled candidate generation, and reviewable update PRs.

### Phase 8 — pilot source activation

```text
WHR-CAL-JAPAN-JRA
WHR-CAL-JAPAN-NAR
WHR-CAL-JAPAN-BANEI
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Each pilot must pass acquisition, normalization, validation, human promotion, display, stale handling, and rollback documentation.

### Phase 9 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Require dynamic Calendar, Today, and Tomorrow dates; maintained pilot data; visible source, coverage, and freshness; rank boundaries; official fallback; bilingual QA; and operations runbooks.

### Phase 10 — expansion

Choose cohorts from Calendar Readiness using source stability, completeness, timetable depth, maintenance cost, publication safety, season timing, and user value.

### Phase 11 — steady-state operations

Daily candidate and failure review, weekly stale review, monthly source revalidation, seasonal fixture rollover, rank changes, adapter maintenance, and country/racecourse/glossary/search improvements.

## Required reading

Every PR:

1. `docs/governance/document-authority.md`
2. this roadmap
3. `docs/operations/deployment-and-ci-policy.md`

Country-page work also reads the country roadmap, completion contract, and tracker.

Calendar work also reads the Source Test v2 contract, Calendar Readiness contract, implementation roadmap, applicable records, and global timetable architecture.

## Maintenance

Update this roadmap in the same PR whenever the current or next Work ID, phase boundaries, completion conditions, material tracker/readiness counts, component status, or deployment model changes.

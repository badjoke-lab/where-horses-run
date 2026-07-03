# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-03

## Purpose

This roadmap covers the full product:

```text
official-source research
-> capability and publication decisions
-> bilingual country pages
-> Calendar Readiness
-> reviewed acquisition and candidates
-> human-approved public timetable data
-> Calendar / Today / Tomorrow / country / racecourse / meeting views
-> recurring maintenance and expansion
```

## Product destination

Where Horses Run is a bilingual, static-first world racing calendar and timetable guide. It publishes reviewed country, system, racecourse, meeting, and timetable information while directing users to official sources for final confirmation.

Technical Rank and Public Ceiling remain separate. A system ceiling never invents missing meeting fields. Candidate generation is not publication. Scheduled and unattended canonical/public writes remain disabled unless separately approved.

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

The 98-country programme, final country/readiness audit, Calendar baseline reconciliation, Pipeline v1, Dynamic Dates, Operations v1, JRA implementation foundation, and Japan A+ policy reconciliation are complete.

Current implementation plan:

- `docs/calendar/implementation-roadmap.md`;
- completed reconciliation record: `docs/calendar/japan-a-plus-reconciliation-plan.md`;
- active work: `WHR-CAL-JAPAN-JRA-A-PLUS`.

## Governing rules

### Research drives country pages and Calendar

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

A country page may be complete while a Calendar source remains manual, pending pilot, link-only, blocked, or not applicable.

### System ceiling and meeting evidence are separate

A system-level rank defines maximum reviewed capability. Individual meetings remain limited to reviewed canonical fields.

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

## Completed programme phases

### Governance and contracts

Completed through document authority, Source Test v2, Calendar Readiness schemas, stable identifiers, machine-readable contracts, and governance validation.

### Country publication and readiness

Entries 01-98 are complete. The final audit confirmed 98 canonical tracker rows, 196 bilingual routes, 116 authority/source records, and 116 Calendar Readiness records.

### Calendar baseline reconciliation

Completed Work ID: `WHR-CAL-BASELINE-RECONCILE`

Existing timetable components were classified as retain, repair, migrate, replace, or archive. Normal build/check became read-only and the incomplete schedule was paused.

### Calendar pipeline foundations

Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`

Pipeline v1 provides candidate validation, human promotion, deterministic public projection, runtime import boundaries, rendered release QA, and grouped gates. Dynamic Dates provides rolling date views. Operations v1 provides source-health, review packages, pause/rollback, rollover, and escalation.

### Japan A+ reconciliation

Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`

Approved policy:

| Japan system | Technical Rank | Public Ceiling | Runtime state |
| --- | --- | --- | --- |
| JRA central racing | A+ | A+ | active reviewed projection |
| NAR/local-government racing | A+ | A+ | pending separate pilot |
| Banei Tokachi | A+ | A+ | pending separate pilot |

The three systems remain separate. Active resolution uses the Japan v2 readiness and authority overlays plus runtime controls. Historical base records remain provenance, not active policy.

JRA July 2026 publication contains 24 reviewed A+ meetings and 300 public-safe timetable rows.

## Current phase — JRA A+ pilot completion

Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

The active work formalizes:

- the JRA A+ pilot completion contract;
- operator-triggered refresh ownership;
- source freshness and stale handling;
- fallback and rollback;
- release-gate and bilingual rendered QA;
- transition to the NAR A+ pilot.

Approved public meeting-detail fields are race label, scheduled post time, race name, distance, surface, and course label. Participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, and direct-stream data remain excluded.

## Next phases

```text
WHR-CAL-JAPAN-NAR-A-PLUS
-> WHR-CAL-JAPAN-BANEI-A-PLUS
-> WHR-CAL-JAPAN-INTEGRATION
-> WHR-CAL-HONG-KONG-HKJC
-> WHR-CAL-UAE-ERA
-> WHR-CAL-PUBLIC-V1
-> racecourse-page strengthening
-> glossary / racing types / search / filtering / SEO
-> expansion cohorts
-> steady-state maintenance
```

### NAR A+

Build authority- and racecourse-specific route mapping. Do not flatten local-government racing into a JRA-like national feed. Old branch PR #281 is not merged directly; only unique reusable parsing knowledge may be migrated.

### Banei A+

Use Banei-specific routes and terminology. Do not impose flat-racing assumptions.

### Japan integration

Validate same-day three-system output, page links, source health, freshness, fallback, rollback, and bilingual QA.

### Calendar Public v1

Require dynamic Calendar/Today/Tomorrow views, maintained approved pilots, one meeting per list row, visible source and freshness state, safe downgrade/fallback, bilingual responsive QA, and operations ownership.

### Racecourse pages and navigation

After Calendar Public v1, strengthen canonical racecourse pages with current/next meeting state, reviewed recent meetings, course and distance profiles, official sources, freshness, and cross-links.

## Historical transition markers

These labels are retained for completed release-gate compatibility and are not active:

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-NAR`  
> Next Work ID: `WHR-CAL-JAPAN-BANEI`

Historical transition from the country-page programme:

> Current Work ID: `WHR-CAL-BACKFILL-37-52`  
> Next Work ID: `WHR-CP-PROFILE-45-52`

## Per-PR requirements

Every substantive PR records its Work ID, canonical documents reviewed, specifications reviewed, registry/control changes, runtime behaviour, display boundary, deployment requirement, validation results, out-of-scope work, completion conditions, and next Work ID.

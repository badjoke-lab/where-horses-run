# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-01

## Purpose

This roadmap begins with Calendar Readiness and continues through maintained public operation. The repository already has timetable foundations; they must be reconciled and activated rather than duplicated.

## Stage 1 — contract implementation

Work ID: `WHR-CAL-CONTRACT-02`

Deliver machine-readable Source Test v2 and Readiness schemas, a readiness registry, stable system/source keys, reference validation, enum consistency checks, and roadmap/documentation validation. Do not activate live acquisition.

## Stage 2 — readiness backfill and new research

Backfill entries 01-52 from reviewed evidence. Use Source Test v2 for entries 53-98. A parser name or planned cadence is not proof that a live route works.

## Stage 3 — combined research handoff

Status: complete  
Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Generate readiness summaries, automation-mode counts, implementation priority, blocked/revalidation reports, source freshness, and country-page completion reports.

## Stage 4 — existing baseline reconciliation

Status: complete  
Work ID: `WHR-CAL-BASELINE-RECONCILE`

Audit source inventories, routes, local/manual snapshot contracts, adapters, fixtures, generators, promotion tools, generated data, display policies, pages, refresh commands, fixed dates, seeds, and PR-specific scripts.

Classify each component:

```text
retain
repair
migrate
replace
archive
```

Completed outputs:

- `docs/calendar/baseline-reconciliation-map.md`;
- `data/audits/calendar-baseline-migration-map.json`;
- `scripts/check-calendar-baseline-reconciliation.mjs`;
- read-only normal build/check;
- paused incomplete daily refresh schedule.

Broad deletion remains prohibited until provenance and assertion migration is complete.

## Stage 5 — pipeline v1

Pipeline v1 status: complete  
Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Current Work ID: `WHR-CAL-DYNAMIC-DATES`  
Next Work ID: `WHR-CAL-OPS-V1`

Work IDs:

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
```

Standard flow:

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

Completed Pipeline v1 outputs include one candidate contract, human promotion writer, deterministic public projection, public-only runtime imports, read-only builds, one JRA reference adapter, rendered release QA, and `data/audits/calendar-pipeline-v1-release-gate.json`.

### Dynamic Dates

Dynamic Dates status: complete  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`

The site now uses explicit reference-date and timezone rules, Today/Tomorrow selection, a rolling 30-day window, and visible current/stale/empty states.

### Operations v1

Operations v1 status: complete  
Completed Work ID: `WHR-CAL-OPS-V1`

Operations now include deterministic source-health status, review-package preparation, pause/rollback controls, seasonal rollover, source-breakage escalation, and grouped validation. Scheduled and unattended publication remain disabled.

### JRA pilot — current

Current Work ID: `WHR-CAL-JAPAN-JRA`  
Next Work ID: `WHR-CAL-JAPAN-NAR`

The pilot must obtain a fresh reviewed JRA source fixture before candidate approval or promotion.

## Stage 6 — pilot activation

Status: current — JRA pilot

```text
WHR-CAL-JAPAN-JRA
WHR-CAL-JAPAN-NAR
WHR-CAL-JAPAN-BANEI
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Each pilot requires reviewed source/readiness records, stable IDs, fixture-backed extraction, bounded candidates, prohibited-field guards, normalized validation, human promotion, public-rank enforcement, freshness/stale handling, fallback/rollback, bilingual rendered QA, and operations documentation.

A pilot may be automatic, semi-automatic, or manual. The mode must match evidence.

## Stage 7 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible coverage, source status, and freshness where required;
- safe stale/failure downgrade and official fallback;
- no participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, or direct-stream output;
- bilingual responsive QA;
- operations and recovery ownership.

## Stage 8 — expansion cohorts

Choose systems from the priority matrix using source stability, coverage completeness, timetable depth, bounded complexity, maintenance cost, publication safety, season timing, and user value.

Cohorts may mix automatic A/A+, automatic or semi-automatic C/B/B+, manual PDF/import, and link-only systems.

## Stage 9 — steady-state maintenance

Daily: candidate/error review and Today/Tomorrow sanity checks.  
Weekly: stale/source-health review, manual updates, broken-link triage.  
Monthly: source/readiness revalidation and priority updates.  
Seasonally: fixture rollover, off-season/restart handling, archive review.

## Deployment rule

Follow `docs/operations/deployment-and-ci-policy.md`. Research, contracts, fixtures, candidates, and non-public runtime work use GitHub validation without Cloudflare preview. Rendered releases use one final preview when materially required and one production deployment after approval.

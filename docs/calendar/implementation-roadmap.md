# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-03

## Current state

Completed Work IDs:

- `WHR-CAL-CONTRACT-02`
- `WHR-AUDIT-COUNTRY-CALENDAR-98`
- `WHR-CAL-BASELINE-RECONCILE`
- `WHR-CAL-PIPELINE-V1`
- `WHR-CAL-DYNAMIC-DATES`
- `WHR-CAL-OPS-V1`
- `WHR-CAL-JAPAN-A-PLUS-RECONCILE`

Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Standard Calendar flow

```text
official source
-> reviewed adapter or manual import
-> candidate
-> normalization
-> validation
-> human promotion
-> canonical meeting data
-> public projection
-> static build
```

Candidate generation is not publication. Normal build and check remain read-only. Scheduling and unattended canonical or public writes remain disabled.

## Completed foundations

### Contracts and 98-country readiness

Source Test v2, Calendar Readiness, stable system/source identifiers, the 98-country readiness backfill, and the combined audit are complete.

### Baseline reconciliation

The earlier timetable implementation was classified as retain, repair, migrate, replace, or archive. Normal production build/check became read-only and the incomplete scheduled refresh was paused.

### Pipeline v1

Pipeline v1 provides the candidate contract, human promotion, deterministic public projection, production runtime import boundary, JRA reference adapter, rendered QA, and grouped release gate.

### Dynamic Dates

Calendar, Today, and Tomorrow use explicit reference-date and timezone rules with a rolling 30-day window and visible current, stale, and empty states.

### Operations v1

Operations v1 provides source-health status, review packages, pause and rollback controls, seasonal rollover, and source-breakage escalation.

## Japan A+ policy reconciliation — complete

JRA central racing, NAR/local-government racing, and Banei Tokachi each have:

- Technical Rank A+;
- Public Ceiling A+;
- separate source identity and terminology;
- evidence-bound meeting output;
- review-controlled publication.

Active Japan state is resolved through:

- `data/static/calendar-readiness-japan-v2.json`;
- `data/static/authority-source-inventory-japan-v2.json`;
- `data/static/japan-a-plus-runtime-control.json`;
- `data/static/japan-a-plus-policy.json`.

The historical base registries remain provenance records. JRA projection is active. NAR and Banei remain pending separate pilots.

Completion records:

- `docs/calendar/japan-a-plus-reconciliation-plan.md`;
- `data/audits/japan-a-plus-reconciliation-completion.json`;
- `scripts/check-japan-a-plus-reconciliation-completion.mjs`.

## Japan pilot sequence

```text
WHR-CAL-JAPAN-JRA-A-PLUS
-> WHR-CAL-JAPAN-NAR-A-PLUS
-> WHR-CAL-JAPAN-BANEI-A-PLUS
-> WHR-CAL-JAPAN-INTEGRATION
```

### JRA A+ — current

The July 2026 implementation contains 24 reviewed A+ meetings and 300 public-safe timetable rows. The current stage formalizes the pilot completion contract, refresh ownership, freshness, fallback, rollback, and release gate.

Approved public meeting-detail fields are limited to race label, scheduled post time, race name, distance, surface, and course label.

### NAR A+ — next

Build authority- and racecourse-specific route mapping. Do not flatten local-government racing into a JRA-like national feed. The old NAR branch is not merged directly; only unique reusable knowledge may be migrated into Pipeline v1.

### Banei A+

Use Banei-specific routes and terminology. Do not impose flat-racing surface or course assumptions.

### Japan integration

Validate same-day three-system output across Calendar, Today, Tomorrow, country, racecourse, and meeting pages with freshness, fallback, rollback, and bilingual QA.

## Later stages

1. `WHR-CAL-HONG-KONG-HKJC`
2. `WHR-CAL-UAE-ERA`
3. `WHR-CAL-PUBLIC-V1`
4. racecourse-page and page-link strengthening
5. glossary, racing types, search, filtering, and SEO
6. expansion cohorts
7. steady-state maintenance

Calendar Public v1 requires dynamic date views, maintained approved pilots, one meeting per list row, visible source and freshness state, safe downgrade/fallback, bilingual responsive QA, and operations ownership.

Participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, and direct-stream output remain excluded.

## Historical transition markers

These exact labels are retained for completed-gate compatibility and are not active:

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-NAR`  
> Next Work ID: `WHR-CAL-JAPAN-BANEI`

## Per-PR review

Each Calendar PR records its Work ID, canonical documents reviewed, registry/control changes, runtime behaviour, display boundary, validation results, out-of-scope work, and next Work ID. Deployment follows `docs/operations/deployment-and-ci-policy.md`.

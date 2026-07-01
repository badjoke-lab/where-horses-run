# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-02

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
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`  
Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

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

Operations include deterministic source-health status, review-package preparation, pause/rollback controls, seasonal rollover, source-breakage escalation, and grouped validation. Scheduled and unattended publication remain disabled.

### Japan A+ policy

Approved policy:

- JRA central racing: Technical Rank A+ / Public Ceiling A+;
- NAR and local-government racing: Technical Rank A+ / Public Ceiling A+;
- Banei Tokachi: Technical Rank A+ / Public Ceiling A+.

The three systems remain separate. Individual meetings remain limited to the highest rank supported by reviewed canonical fields. System-level A+ does not invent unavailable meeting details.

### Japan A+ reconciliation — current

Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

The repository contains approved A+ policy and v2 controls, but older active registry records, Profile v2 text, Source Test summaries, validators, roadmap text, and JRA public projection still contain earlier C/A assumptions. The current work aligns those layers before new pilot acquisition work proceeds.

Canonical implementation plan:

- `docs/calendar/japan-a-plus-reconciliation-plan.md`.

Completion requires active documents, registries, profiles, source summaries, controls, validators, and generated public data to agree without enabling unattended publication.

### Superseded pilot transition

The following exact labels record the earlier local-racing C-pilot state. They are retained only for completed release-gate compatibility and are not the active state above:

> Current Work ID: `WHR-CAL-JAPAN-NAR`  
> Next Work ID: `WHR-CAL-JAPAN-BANEI`

## Stage 6 — Japan pilot activation

Status: follows reconciliation

```text
WHR-CAL-JAPAN-JRA-A-PLUS
WHR-CAL-JAPAN-NAR-A-PLUS
WHR-CAL-JAPAN-BANEI-A-PLUS
WHR-CAL-JAPAN-INTEGRATION
```

### JRA A+ pilot

Use a fresh reviewed official final fixture, generate a bounded Pipeline v1 candidate, validate and promote it by human approval, then regenerate the public meeting list and meeting detail projection. Reviewed A+ meetings may show race label, post time, race name, distance, surface, and course on meeting detail pages only.

### NAR A+ pilot

Build authority- and racecourse-specific route mapping. Do not flatten local-government racing into a JRA-like national feed. Candidate generation and promotion remain evidence-bound and human-controlled.

### Banei A+ pilot

Use Banei-specific source routes and terminology. Do not impose flat-racing surface/course assumptions. Candidate generation and promotion remain evidence-bound and human-controlled.

### Japan integration

Verify same-day three-system handling, Calendar/Today/Tomorrow output, country and racecourse links, source health, freshness, fallback, rollback, and bilingual rendered QA.

Each pilot requires reviewed source/readiness records, stable IDs, fixture-backed extraction, bounded candidates, prohibited-field guards, normalized validation, human promotion, public-rank enforcement, freshness/stale handling, fallback/rollback, bilingual rendered QA, and operations documentation.

A pilot may be automatic, semi-automatic, or manual. The mode must match evidence. Scheduling and unattended publication remain disabled unless separately approved.

## Stage 7 — additional pilot activation

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

HKJC and UAE follow the same Pipeline v1, human-promotion, display-boundary, stale, fallback, rollback, and bilingual QA requirements.

## Stage 8 — Calendar public v1

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

## Stage 9 — racecourse pages and product navigation

After Calendar Public v1, strengthen racecourse pages and the page-link architecture:

- one canonical page per racecourse;
- current and next meeting state;
- recent reviewed meetings;
- course and distance profile;
- official sources and freshness;
- country, Calendar, racing-type, and glossary links;
- bilingual responsive QA.

## Stage 10 — glossary, racing types, search, filtering, and SEO

Implement the reviewed glossary and terminology boundary, local names, readings and pronunciation metadata where supported, racing-type navigation, search/filter controls, no-JavaScript fallback, metadata, sitemap, canonical/hreflang, structured data, and methodology/coverage pages.

## Stage 11 — expansion cohorts

Choose systems from the priority matrix using source stability, coverage completeness, timetable depth, bounded complexity, maintenance cost, publication safety, season timing, and user value.

Cohorts may mix automatic A/A+, automatic or semi-automatic C/B/B+, manual PDF/import, and link-only systems.

## Stage 12 — steady-state maintenance

Daily: candidate/error review and Today/Tomorrow sanity checks.  
Weekly: stale/source-health review, manual updates, broken-link triage.  
Monthly: source/readiness revalidation and priority updates.  
Seasonally: fixture rollover, off-season/restart handling, archive review.

## Per-PR document review

Each Calendar PR reviews:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. this roadmap;
4. the active phase plan, including `docs/calendar/japan-a-plus-reconciliation-plan.md` while that Work ID is current;
5. `docs/operations/deployment-and-ci-policy.md`;
6. applicable machine-readable policies, readiness records, controls, source records, profile records, and public display boundaries.

The PR records its Work ID, documents and specifications reviewed, registry/control changes, runtime behaviour, display boundary, validation results, out-of-scope work, and next Work ID.

## Deployment rule

Follow `docs/operations/deployment-and-ci-policy.md`. Research, contracts, fixtures, candidates, and non-public runtime work use GitHub validation without Cloudflare preview. Rendered releases use one final preview when materially required and one production deployment after approval.

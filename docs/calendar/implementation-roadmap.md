# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-06

## Purpose

This roadmap begins with Calendar Readiness and continues through maintained public operation. The repository already has timetable foundations; they must be reconciled and activated rather than duplicated.

All active and future Calendar source work follows `docs/calendar/incremental-coverage-contract.md`.

The common operating model separates:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

Ordinary updates may be partial, irregular, overlapping, and retried. A complete month or season is an audited claim, not a prerequisite for valid partial batch promotion.

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
Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

Standard flow:

```text
official source
-> reviewed adapter or manual import
-> extracted candidate
-> normalization
-> batch validation
-> human review
-> promotion validation
-> canonical meeting data
-> deterministic public display projection
-> static build

parallel operational view:
coverage observation
-> coverage audit
-> retry targets
-> optional completion audit for explicit scope claims
```

Completed Pipeline v1 outputs include one candidate contract, human promotion writer, deterministic public projection, public-only runtime imports, read-only builds, one JRA reference adapter, rendered release QA, and `data/audits/calendar-pipeline-v1-release-gate.json`.

### Dynamic Dates

Dynamic Dates status: complete  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`

The site uses explicit reference-date and timezone rules, Today/Tomorrow selection, a rolling 30-day window, and visible current/stale/empty states.

### Operations v1

Operations v1 status: complete  
Completed Work ID: `WHR-CAL-OPS-V1`

Operations include deterministic source-health status, review-package preparation, pause/rollback controls, seasonal rollover, source-breakage escalation, and grouped validation. Scheduled and unattended publication remain disabled.

### Shared incremental coverage contract — prerequisite implementation inside the active NAR phase

The cross-system contract is:

```text
docs/calendar/incremental-coverage-contract.md
```

Completed shared prerequisite work:

1. preserve arbitrary candidate windows and allow irregular operator timing — contract complete;
2. introduce a common Coverage Observation contract and machine-readable schema — complete;
3. validate partial shorter source horizons, selected-meeting retries, and audited-complete reference rules — complete.

Active shared implementation sequence:

1. separate batch, promotion, coverage, and completion validation responsibilities;
2. ensure valid partial batches can be promoted without month-wide completeness;
3. ensure absence in one run is not deletion or implicit cancellation in operator merge behavior;
4. prevent accidental rank regression from lower-detail later observations;
5. refactor NAR normal incremental acquisition away from the July completion audit;
6. emit Coverage Observation and retry-target outputs from the ordinary operator path;
7. use the same common contract for Banei, HKJC, UAE, and later systems.

The active top-level Work ID remains `WHR-CAL-JAPAN-NAR-A-PLUS` while this prerequisite is implemented because it was discovered during the NAR pilot and blocks safe continuation of that pilot. It is not a NAR-only exception.

### Japan A+ policy

Approved policy:

- JRA central racing: Technical Rank A+ / Public Ceiling A+;
- NAR and local-government racing: Technical Rank A+ / Public Ceiling A+;
- Banei Tokachi: Technical Rank A+ / Public Ceiling A+.

The three systems remain separate. Individual meetings remain limited to the highest rank supported by reviewed canonical fields. System-level A+ does not invent unavailable meeting details.

The acquisition architecture does not require a C-only intermediate publication. A meeting may enter at C, B, B+, A, or A+ according to reviewed evidence.

### Japan A+ reconciliation — complete

Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`

The approved A+ policy, v2 controls, Profile v2, Source Test summary, resolved registries, reviewed note, validators, roadmaps, and JRA public projection are aligned. Historical base records remain provenance and are superseded for active Japan resolution.

Canonical implementation plan:

- `docs/calendar/japan-a-plus-reconciliation-plan.md`.

Completion is recorded by `data/audits/japan-a-plus-reconciliation-completion.json` without enabling unattended publication.

## Stage 6 — Japan pilot activation

Status: current  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

```text
WHR-CAL-JAPAN-JRA-A-PLUS
WHR-CAL-JAPAN-NAR-A-PLUS
WHR-CAL-JAPAN-BANEI-A-PLUS
WHR-CAL-JAPAN-INTEGRATION
```

### JRA A+ pilot — complete

Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`. The operator-triggered local refresh, 24 July meetings, 288 July rows, synchronized layers, fallback, rollback, and release gate are recorded in `docs/calendar/jra-a-plus-pilot-completion.md`.

### NAR A+ pilot — current

Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`.

Completed so far:

- source architecture;
- bounded route probe;
- candidate adapter;
- all-fourteen compatibility review;
- 14/14 complete fixture set;
- first reviewed partial A+ promotion through 2026-07-04;
- July full-month schedule collector and audit path;
- dedicated generated full-month candidate PR validation;
- cross-system incremental coverage contract;
- Coverage Observation schema and validator foundation.

Current sequence:

1. split batch, promotion, coverage, and completion validation responsibilities;
2. refactor NAR acquisition into ordinary incremental batches plus a separate July completion audit;
3. support arbitrary windows, overlap-safe retries, and selected-meeting retries in the ordinary operator;
4. emit Coverage Observation and explicit retry targets;
5. collect the next available NAR schedule/detail batch;
6. review and promote valid records independently of unresolved dates elsewhere in July;
7. run July completion audit only when claiming July coverage complete;
8. perform public projection, freshness, rollback, and bilingual QA.

Do not flatten local-government racing into a JRA-like national feed. Candidate generation and promotion remain evidence-bound and human-controlled.

### Banei A+ pilot

Banei follows the same shared incremental coverage contract but uses Banei-specific source routes, terminology, and detail semantics.

The Banei sequence is:

1. implement schedule and detail acquisition under arbitrary-window and partial-success semantics;
2. allow direct higher-rank candidates when the official source supports them;
3. preserve meeting existence when detail is pending;
4. review and promote valid partial batches independently;
5. maintain retry targets and coverage observations;
6. use a separate July completion audit only when claiming July coverage complete;
7. complete freshness, rollback, and bilingual QA.

Do not impose flat-racing surface/course assumptions.

### Japan integration

Verify same-day three-system handling, Calendar/Today/Tomorrow output, country and racecourse links, source health, freshness, fallback, rollback, arbitrary-window overlap safety, and bilingual rendered QA.

Each pilot requires reviewed source/readiness records, stable IDs, fixture-backed extraction, bounded candidates, prohibited-field guards, normalized validation, human promotion, public-rank enforcement, freshness/stale handling, fallback/rollback, bilingual rendered QA, operations documentation, and compliance with the incremental coverage contract.

A pilot may be automatic, semi-automatic, or manual. The mode must match evidence. Scheduling and unattended publication remain disabled unless separately approved.

## Stage 7 — additional pilot activation

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

HKJC and UAE follow the same Pipeline v1, incremental coverage, human-promotion, display-boundary, stale, fallback, rollback, and bilingual QA requirements.

The source adapter may be split into schedule/detail routes or may emit the highest available rank directly. Neither system may use month-wide completeness as a prerequisite for ordinary valid partial promotions.

## Stage 8 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible coverage, source status, and freshness where required;
- partial coverage represented honestly without blocking valid reviewed records;
- safe stale/failure handling and official fallback;
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

Every implemented system inherits the shared incremental coverage contract. Expansion planning must distinguish source capability from source horizon and completion claims.

## Stage 12 — steady-state maintenance

The operating schedule is a priority guide, not a guarantee that every action occurs on a fixed date.

Operator-triggered maintenance may be irregular. Valid operations include arbitrary-window collection, overlapping retries, selected-meeting retries, and source-visible-horizon runs.

Recommended review rhythms remain:

- frequent: candidate/error review and Today/Tomorrow sanity checks when an operator run occurs;
- weekly target: stale/source-health review, manual updates, broken-link triage;
- monthly target: source/readiness revalidation, coverage audit review, and priority updates;
- seasonal target: fixture rollover, off-season/restart handling, archive review.

Missing a nominal maintenance day does not invalidate later incremental updates.

## Per-PR document review

Each Calendar PR reviews:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. this roadmap;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/coverage-observation-schema.md` when acquisition or coverage state changes;
6. the active system-specific phase plan;
7. `docs/operations/deployment-and-ci-policy.md`;
8. applicable machine-readable policies, readiness records, controls, source records, profile records, and public display boundaries.

The PR records its Work ID, documents and specifications reviewed, registry/control changes, runtime behaviour, display boundary, validation results, out-of-scope work, and next Work ID.

## Deployment rule

Follow `docs/operations/deployment-and-ci-policy.md`. Research, contracts, fixtures, candidates, and non-public runtime work use GitHub validation without Cloudflare preview. Rendered releases use one final preview when materially required and one production deployment after approval.

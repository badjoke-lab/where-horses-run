# Where Horses Run documentation

This directory contains the active roadmaps, contracts, schemas, reviewed research, decisions, runbooks, and operations rules for Where Horses Run / 競馬どこ？.

## Start here

1. [Documentation authority](governance/document-authority.md) + [2026-09-06 UI authority addendum](governance/document-authority-2026-09-06-addendum.md)
2. [Project roadmap](project-roadmap.md)
3. [2026-09-06 active project-roadmap addendum](project-roadmap-2026-09-06-addendum.md)
4. [Map-first site UI specification](specs/map-first-site-ui-2026-09-06.md)
5. [Deployment and CI policy](operations/deployment-and-ci-policy.md)

Parallel programme authority is listed below; a parallel addendum does not supersede the current top-level UI execution pointer unless it explicitly says so.

## Programme sections

- [Country page programme](country-pages/README.md) — roadmap, tracker, completion contract, and active addenda
- [Calendar programme](calendar/README.md) — Source Test v2, Calendar Readiness, implementation roadmap, and baseline audit
- [Glossary programme](glossary/README.md) — world racing terminology master, multilingual/regional knowledge model, evidence rules, and deferred public-page lane
- [Specifications](specs/README.md) — product, data, UI, display, acquisition, and operations specifications
- [Research](research/README.md) — country/source surveys and feasibility notes
- [Decisions](decisions/README.md) — accepted project decisions
- [PR plans](pr-plans/README.md) — scoped implementation plans; top-level execution remains controlled by the project roadmap/addendum
- [Runbooks](runbooks/README.md) — repeatable operational procedures
- [Operations](operations/README.md) — deployment, CI, branch, preview, and merge rules

## Current canonical documents

Overall:

- [Project roadmap](project-roadmap.md)
- [2026-09-06 active project-roadmap addendum](project-roadmap-2026-09-06-addendum.md) — current map-first site-UI execution state; inherits reviewed incremental-maintenance/publication controls unless explicitly changed
- [2026-09-09 glossary knowledge-master addendum](project-roadmap-2026-09-09-glossary-addendum.md) — parallel glossary lane; master/list construction now, new public glossary expansion/redesign later
- [Map-first site UI specification](specs/map-first-site-ui-2026-09-06.md) — current public information architecture, navigation, responsive/mobile behavior, map status presentation, and page-role contract
- [Map UI integration decision](decisions/map-ui-integration-2026-09-05.md)
- [Documentation authority](governance/document-authority.md)
- [2026-09-06 UI authority addendum](governance/document-authority-2026-09-06-addendum.md) — sets the current top-level execution pointer and canonical UI document set without replacing other governance/Calendar authority lists
- [Internal source handling boundary](governance/internal-source-handling.md)
- [Deployment and CI policy](operations/deployment-and-ci-policy.md)

Current map-first UI execution plan:

- [Map-first UI PR plan](pr-plans/map-first-ui-pr-plan-2026-09-06.md) — bounded implementation sequence for `UI-001` through `UI-009`; the top-level roadmap/addendum remains authoritative

Glossary:

- [Glossary programme index](glossary/README.md)
- [World racing terminology master specification](glossary/world-racing-terminology-master-spec.md) — current authority for concept-first worldwide terminology, local-language/original-script labels, regional usage, equivalence, slang/historical terms, evidence, and search-discovery metadata
- [2026-09-09 glossary knowledge-master addendum](project-roadmap-2026-09-09-glossary-addendum.md) — current glossary execution sequence `GLOSSARY-MASTER-001` through `GLOSSARY-MASTER-006`; public implementation is explicitly deferred pending readiness review

Country pages:

- [Country programme roadmap](country-pages/programme-roadmap.md)
- [2026-06-28 country roadmap addendum](country-pages/programme-roadmap-2026-06-28-addendum.md)
- [98-country tracker](country-pages/98-country-tracker.tsv)
- [Country completion contract](country-pages/completion-contract.md)
- [Calendar handoff addendum](country-pages/completion-contract-calendar-addendum.md)

Calendar:

- [Acquisition completion contract](calendar/acquisition-completion-contract.md) — canonical rule separating valid C/B/B+/A observations from acquisition-cycle completion and requiring explicit higher-detail disposition
- [Source Test v2 contract](calendar/source-test-v2-contract.md)
- [Calendar Readiness contract](calendar/calendar-readiness-contract.md)
- [Calendar implementation roadmap](calendar/implementation-roadmap.md)
- [2026-08-09 active Calendar implementation addendum](calendar/implementation-roadmap-2026-08-09-addendum.md)
- [Daily acquisition implementation schedule](calendar/daily-acquisition-implementation-schedule.md)
- [Current Calendar baseline audit](calendar/current-baseline-audit.md)
- [Global timetable architecture](specs/global-timetable-architecture.md)
- [2026-06-28 architecture addendum](specs/global-timetable-architecture-2026-06-28-addendum.md)

Racecourse pages:

- [Identity reconciliation](racecourses/identity-reconciliation.md)
- [Public timetable connection](racecourses/public-timetable-connection.md)
- [Profile evidence](racecourses/profile-evidence.md)
- [Page-link architecture](racecourses/page-link-architecture.md)
- [2026-08-09 current-state addendum](racecourses/current-state-2026-08-09-addendum.md) — current 37/74 growth state and identity-only rules
- [Map-first site UI specification](specs/map-first-site-ui-2026-09-06.md) — current racecourse-page composition, high-zoom location map, Today/Next/Upcoming, reviewed profile fields, mobile order, and navigation role

The v0 specification and early PR plans are historical product/planning baselines. Current active contracts, schemas, roadmaps, adopted addenda, and the active map-first UI specification override them when they differ.

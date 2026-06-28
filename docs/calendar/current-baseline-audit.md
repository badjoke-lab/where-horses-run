# Current Calendar baseline audit

Status: reviewed baseline for roadmap planning  
Work ID: `WHR-GOV-ROADMAP-01`  
Reviewed against main: `b3110b8dd065f5112aacd97f8992305b98127456`  
Review date: 2026-06-28

## Summary

Where Horses Run already contains substantial Calendar and timetable foundations. The next implementation phase must reconcile and activate them rather than create a second parallel architecture.

The baseline supports reviewed static/generated display, but it is not yet a complete continuously maintained world calendar.

## Existing public surfaces and flow

Present:

- English/Japanese Calendar, Today, and Tomorrow routes;
- country timetable integration;
- meeting-detail support for A/A+;
- one-meeting-per-row components and official-source links;
- rank-aware first/last time and detail links;
- canonical meeting data, publication policies, public meeting-list/detail JSON, and public view models.

The public view model already carries Technical Rank, maximum and effective public rank, local times, source status, official URL, last-checked date, and optional detail path.

## Existing acquisition foundations

Present in scripts, data, or validators:

- safe source pipeline and adapter interface;
- parser fixtures and normalization checks;
- generated-update dry run;
- JRA, NAR, and Banei candidate generators;
- candidate promotion;
- Hong Kong and UAE work;
- cross-country candidate validation;
- acquisition-route, manual-snapshot, normalized-output, and calendar-reader contracts;
- source-health and update-report outputs;
- annual, rolling, race-time, promotion, archive, build, and report commands.

`data/source-registry/major-country-sources.json` records 13 countries, 24 active groups, one legacy group, source kinds, parser names, target levels, and cadences. These are valuable planning inputs, but a registered parser name or cadence is not proof of active stable acquisition.

## Existing local research model

`docs/timetable-source-tests/` stores public-safe derived research. Raw captures referenced under `.whr-local-source-tests/` remain outside the repository.

Allowed repository material includes official URLs, HTTP/format metadata, tested counts, field availability, capability decisions, hashes, and reviewed summaries. Raw HTML, PDF/API bodies, complete programmes, participant data, restricted details, and private risk notes remain local/internal.

The supplied `timetable-source-tests.zip` is treated as a backup of public-safe derived results, not as a repository artifact. Referenced raw response bodies are not included in the public summaries and remain local-only.

## Main gaps

### Governance and tracking

- no project-wide roadmap previously connected country pages to Calendar activation;
- Readiness was not a required outcome for all 98 countries;
- page status and calendar implementation status were not formally separated;
- PR-number schedules drift when preview/operations PRs consume numbers.

### Contract consistency

- some older specifications stop at A while runtime supports A+;
- automation, readiness, fallback, and refresh decisions are inconsistent across tests/registries;
- existing tests vary because they predate Source Test v2.

### Runtime and freshness

- shared refresh core reports `skeleton_no_live_fetch`;
- public data includes seed/preview dates;
- Calendar/date helpers retain June 2026 assumptions;
- scheduled candidate generation and human-review operations are not yet one completed production path.

### Legacy and duplication risk

- many PR-number-specific validators/fixtures remain;
- timetable-era schemas and registries may overlap;
- components need classification before deletion or replacement.

## Required reconciliation

`WHR-CAL-BASELINE-RECONCILE` classifies each file/subsystem as:

```text
retain
repair
migrate
replace
archive
```

No broad deletion occurs before the migration map is reviewed.

## Immediate consequence

The next work after this documentation PR is `WHR-CAL-CONTRACT-02`, followed by publication debt and Readiness backfill. It is not a new adapter PR.

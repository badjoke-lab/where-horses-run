# Current Calendar baseline audit

Status: reviewed baseline for roadmap planning  
Work ID: `WHR-GOV-ROADMAP-01`  
Reviewed against main: `b3110b8dd065f5112aacd97f8992305b98127456`  
Review date: 2026-06-28

## Summary

Where Horses Run already contains substantial Calendar and timetable foundations. The next implementation phase must reconcile and activate them rather than create a second parallel architecture.

The current baseline supports reviewed static and generated timetable display, but it is not yet a complete continuously maintained world calendar.

## Existing public surfaces

Present:

- English and Japanese Calendar routes;
- English and Japanese Today routes;
- English and Japanese Tomorrow routes;
- country timetable integration;
- meeting-detail support for A/A+ records;
- one-meeting-per-row display components;
- official-source links;
- rank-aware first/last time and detail links.

Current limitation:

- Calendar labels and helper logic contain June 2026 preview-era assumptions;
- the current-date helper falls back to `2026-06-07` outside June 2026;
- the rolling public Calendar is therefore not yet a durable current-date product.

## Existing public data flow

Present:

```text
canonical meeting data
-> publication display policy
-> public meeting-list and meeting-detail JSON
-> public timetable view model
-> Calendar / Today / Tomorrow / detail components
```

The public view model already carries:

- Technical Rank;
- maximum public rank;
- effective public rank;
- first and last local times;
- source status;
- official URL;
- last checked date;
- optional detail path.

## Existing acquisition and candidate foundations

Present in scripts, data, or validators:

- safe source pipeline and adapter interface;
- parser fixtures and normalization checks;
- generated update dry run;
- JRA, NAR, and Banei candidate generators;
- timetable candidate promotion;
- Hong Kong and UAE source/candidate work;
- cross-country candidate validator;
- acquisition-route, manual-snapshot, normalized-output, and calendar-reader schemas;
- source-health and update-report outputs;
- annual, rolling, race-time, promotion, archive, build, and report commands.

## Existing source coverage planning

`data/source-registry/major-country-sources.json` records:

- 13 countries;
- 24 active source groups;
- one legacy source group;
- annual, rolling, and racecard source kinds;
- parser names;
- target levels;
- refresh cadences;
- a proposed fetch/parse/normalize/promote/build/validate/update-PR path.

This registry is valuable planning input, but a registered parser name or cadence is not proof that the live route is implemented or stable.

## Existing local research model

`docs/timetable-source-tests/` contains public-safe derived research for early countries. Detailed raw captures are referenced under `.whr-local-source-tests/` and remain outside the repository.

Allowed repository material includes source URLs, HTTP/format metadata, tested counts, field availability, capability decisions, and public-safe summaries. Raw HTML, PDF bodies, API response bodies, complete programmes, participant data, and restricted details remain local-only.

A supplied `timetable-source-tests.zip` was reviewed as a backup of these public-safe derived results. It does not include the raw `.whr-local-source-tests/` response bodies referenced by the summaries.

## Main gaps

### Governance and tracking

- no canonical project-wide roadmap connected the country programme to Calendar activation;
- Calendar Readiness was not a required closed outcome for all 98 countries;
- country-page status and calendar implementation status were not formally separated;
- PR-number-based schedules were vulnerable to preview/operations PR number drift.

### Contract consistency

- some older specifications define capability only through A while runtime types support A+;
- automation, readiness, fallback, and refresh decisions are not consistently represented across source tests and registries;
- existing source tests vary in detail because they predate Source Test v2.

### Runtime and data freshness

- shared refresh core remains `skeleton_no_live_fetch`;
- current public data includes seed and preview-era dates;
- Calendar date handling is fixed to the June 2026 development window;
- scheduled candidate generation and human-review operations are not yet one complete documented production path.

### Legacy and duplication risk

- many PR-number-specific validators and fixtures remain in the repository;
- multiple timetable-era schemas and registries may overlap;
- existing components must be classified before deletion or replacement.

## Required reconciliation classification

The future `WHR-CAL-BASELINE-RECONCILE` work must classify each relevant file or subsystem as:

```text
retain     correct and canonical
repair     correct direction, incomplete or stale
migrate    useful data or logic must move to the canonical model
replace    incompatible with the adopted contract
archive    historical evidence, no longer active
```

No broad deletion should occur before that migration map is reviewed.

## Immediate consequence

The next work after this documentation PR is not a new adapter. It is `WHR-CAL-CONTRACT-02`, followed by publication debt and Calendar Readiness backfill as defined in the project roadmap.

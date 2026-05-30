# Current status

Status: public project note
Last updated: 2026-05-30

This document summarizes the public-safe project state for Where Horses Run / 競馬どこ？.

---

## Project

Where Horses Run / 競馬どこ？ is a static-first guide to official horse racing calendars, timetables, racecourses, glossary entries, generated schedule status, source links, and public-safe pipeline status.

The project does not republish entries, odds, results, payouts, tips, full racecards, private feeds, or paid feeds.

---

## Repository and deployment

Repository: badjoke-lab/where-horses-run
Default branch: main
Deployment: Cloudflare Pages
Current phase: M3 v0 generator foundation release gate

---

## M3 v0 release position

M3 v0 generator foundation is complete for the internal release-gate milestone.

Public coverage remains partial. The release gate verifies the generator-based timetable candidate foundation only; it does not certify complete country coverage or complete public coverage for Japan, Hong Kong, UAE, or any other country.

No public complete coverage claim is made in this status note.

No racecards, odds, results, payouts, predictions, or tips are stored.

Related release note: [M3 v0 Generator Foundation Status](m3-v0-status-release-note.md).

Related timetable ingestion plan: [PR-102 Major-country timetable ingestion v0 plan](pr-102.md).

Related annual fixture layer: [PR-103 Major-country annual fixtures v0](pr-103.md).

Related rolling racecard layer: [PR-104 Major-country rolling racecards v0](pr-104.md).

---

## Completed recent PRs

* PR-073 added Hong Kong HKJC candidate generation.
* PR-074 added the Hong Kong active-window approved candidate bundle.
* PR-075 added the CI Node version preflight and clarified Japanese seed-audit wording.
* PR-076 added UAE ERA candidate generation with season-gap handling.
* PR-077 added the UAE active-window approved candidate bundle while preserving the season gap state.
* PR-078 added the cross-country candidate validator.
* PR-079 added the M3 v0 release gate.
* PR-080 added the M3 v0 status release note.

---

## Current implementation state

* English and Japanese root pages exist.
* Countries pages exist.
* Tracks pages exist.
* Glossary pages exist.
* Sources and archive pages exist.
* Calendar fallback pages exist.
* About and disclaimer pages exist.
* Validation scripts exist.
* SEO metadata exists.
* Mobile pass completed.
* Accessibility pass completed.
* Generated data schema exists.
* Fetch status model exists.
* Source registry specification exists.
* Parser interface specification exists.
* Parser fixture test specification exists.
* Manual generated schedule seed exists.
* Calendar page shows generated data freshness and fallback states.
* Generated data validation is hardened.
* Parser fixtures directory exists.
* First Hong Kong parser fixture exists.
* Parser fixture output validation exists.
* Fixture parser harness exists.
* Parser output normalizer exists.
* Source fetch abstraction exists.
* Generated data dry-run GitHub Actions workflow exists.
* First safe source pipeline candidate exists.
* Japan, Hong Kong, and UAE generator-based candidate files exist for M3 v0 review.
* Cross-country candidate validation exists.
* M3 v0 release-gate validation exists.

---

## Current data state

Static datasets currently include:

* countries
* racecourses
* glossary
* sources
* archive
* i18n dictionaries
* country racing inventory
* major-country timetable ingestion v0
* major-country annual fixtures v0
* major-country rolling racecards v0

Generated datasets currently include:

* latest
* today
* tomorrow
* calendar-30d
* fetch-status
* live-fetch-probe-status
* timetables
* Japan active timetable records
* major-country annual fixture candidate meetings for the 2026-05-30 to 2026-06-30 static/manual window
* major-country rolling/racecard confirmations, pending racecard states, and rolling-source coverage gaps for the same static/manual window

Candidate datasets currently include:

* Japan JRA candidates
* Japan NAR candidates
* Japan Banei candidates
* Japan generator-backed active-window candidate bundle exists
* Hong Kong HKJC generator candidates
* Hong Kong active-window approved bundle exists
* UAE ERA generator candidates
* UAE approved bundle exists, but UAE is season gap / no active-window meetings and its current active-window approved records are empty

Generated schedule data remains partial and public-safe.

---

## Current pipeline state

The generated pipeline is dry-run only.

It currently supports:

* generated data shape validation
* parser fixture validation
* fixture parser harness checks
* parser output normalization checks
* source fetch plan creation
* skipped fetch result checks
* GitHub Actions dry-run validation
* safe source pipeline candidate verification
* Japan candidate generator checks
* Hong Kong candidate generator and approved-bundle checks
* UAE candidate generator and season-gap approved-bundle checks
* cross-country candidate validation
* M3 v0 release-gate validation

It does not currently support:

* live network fetching; no live fetch is enabled
* source-specific live parsing; no source page parsing
* generated file writeback automation
* scheduled automatic updates
* raw live page storage; no raw source body storage
* public overlay replacement from the M3 candidate bundles
* PR-105 user-facing merge of the PR-103 annual layer and PR-104 rolling/racecard layer

---

## Current country state

### Japan

Japan has generator-backed JRA, NAR, and Banei candidate files and a generator-backed active-window candidate bundle exists.

This is partial active-window foundation work. It is not complete Japan coverage.

### Hong Kong

Hong Kong has an HKJC candidate generator and an active-window approved bundle exists.

This is partial active-window foundation work. It is not complete Hong Kong coverage.

### UAE

UAE has an ERA candidate generator and an approved bundle exists, but the current window is a season gap. The approved bundle intentionally keeps `records: []` for the active window because UAE is season gap / no active-window meetings.

This is season-gap documentation and generator-foundation validation. It is not complete UAE coverage.

---

## Current product position

The project currently focuses on:

* official source routing
* readable timetable guidance
* racecourse discovery
* glossary education
* generated data status visibility
* lightweight static operation
* bilingual presentation
* safe generated pipeline groundwork
* internal M3 v0 generator foundation validation

The project is not currently:

* a betting platform
* a live odds platform
* a results mirror
* a replay platform
* a racecard redistribution service
* a live feed service
* a complete public coverage product

---

## Current limitation summary

* Public coverage remains partial.
* Runtime fetching does not exist yet.
* Live parsers do not exist yet.
* GitHub Actions dry-run does not write generated files.
* Country and racecourse coverage is not complete.
* UAE active-window approved records are empty because the current window is a season gap.
* Visual guide assets are not started.

---

## Next phase

Next PR:

```text
PR-105 merge annual fixtures and rolling/racecards into the user-facing major-country timetable
```

PR-105 should merge the PR-103 annual candidate-meeting layer and the PR-104 rolling/racecard confirmation layer into `data/static/major-country-timetable-v0.json`, then add `/major-countries/timetable/` with country, system/operator, date, racecourse, first-race time, available race times, annual source, rolling/racecard source, `source_capture_date`, `last_checked`, and stale/pending status.

## PR-105 — Major country timetable v0 UI

- Added merged static/manual timetable v0 data at `data/static/major-country-timetable-v0.json`.
- Added the user-facing timetable page at `/major-countries/timetable/`.
- Preserved confirmed race times, pending official racecard states, explicit coverage gaps, and Singapore legacy visibility.
- Added `npm run validate:major-country-timetable-v0` and wired it into `npm run check`.
- Next: PR-106 should add the static/manual 13-country timetable v0 completion gate.

## PR-106 — Major country timetable v0 completion gate

PR-106 adds the static/manual-driven 13-country timetable v0 completion gate. The gate verifies the source-plan, annual candidate fixture, rolling/racecard confirmation, merged display timetable, and `/major-countries/timetable/` UI chain, while preserving explicit pending records, coverage gaps, Singapore legacy/no active racing, official source links, source capture dates, last-checked values, and stale/pending status.

The gate remains clear that this is static/manual timetable v0: not live coverage, not full automation, not odds, not payouts, not predictions, and not tips.


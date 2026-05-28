# Current status

Status: public project note
Last updated: 2026-05-29

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
Current phase: M2b Generated Pipeline Foundation Release

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

---

## Current data state

Static datasets currently include:

* countries
* racecourses
* glossary
* sources
* archive
* i18n dictionaries

Generated datasets currently include:

* latest
* today
* tomorrow
* calendar-30d
* fetch-status

Generated schedule data is still manual placeholder-level.

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
* first safe source pipeline candidate verification

It does not currently support:

* live network fetching
* source-specific live parsing
* generated file writeback automation
* scheduled automatic updates
* raw live page storage

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

The project is not currently:

* a betting platform
* a live odds platform
* a results mirror
* a replay platform
* a racecard redistribution service
* a live feed service

---

## Current limitation summary

* Generated schedule data is manual placeholder data.
* Runtime fetching does not exist yet.
* Live parsers do not exist yet.
* GitHub Actions dry-run does not write generated files.
* Country and racecourse coverage is still seed-level.
* Visual guide assets are not started.

---

## Next phase

Next phase:

```text
M3 v0 Alpha timetable coverage
```

M3 should expand alpha coverage using:

* source notes
* static source records
* parser or link-first fallback
* FetchStatus coverage
* UI verification
* official source fallback

Live fetching should remain disabled until a source-specific reviewed fetcher is added safely.

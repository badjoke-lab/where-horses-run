# Current status

Status: public project note
Last updated: 2026-05-29

This document summarizes the public-safe project state for Where Horses Run / 競馬どこ？.

---

## Project

Where Horses Run / 競馬どこ？ is a static-first guide to official horse racing calendars, timetables, racecourses, glossary entries, generated schedule status, and source links.

The project does not republish entries, odds, results, payouts, tips, full racecards, private feeds, or paid feeds.

---

## Repository and deployment

Repository: badjoke-lab/where-horses-run
Default branch: main
Deployment: Cloudflare Pages
Current phase: Generated Data Foundation Release

---

## Current implementation state

- English and Japanese root pages exist.
- Countries pages exist.
- Tracks pages exist.
- Glossary pages exist.
- Sources and archive pages exist.
- Calendar fallback pages exist.
- About and disclaimer pages exist.
- Validation scripts exist.
- SEO metadata exists.
- Mobile pass completed.
- Accessibility pass completed.
- Generated data schema exists.
- Fetch status model exists.
- Source registry specification exists.
- Parser interface specification exists.
- Parser fixture test specification exists.
- Manual generated schedule seed exists.
- Calendar page shows generated data freshness and fallback states.

---

## Current data state

Static datasets currently include:

- countries
- racecourses
- glossary
- sources
- archive
- i18n dictionaries

Generated datasets currently include:

- latest
- today
- tomorrow
- calendar-30d
- fetch-status

Generated schedule data is still manual placeholder-level.

---

## Current product position

The project currently focuses on:

- official source routing
- readable timetable guidance
- racecourse discovery
- glossary education
- generated data status visibility
- lightweight static operation
- bilingual presentation

The project is not currently:

- a betting platform
- a live odds platform
- a results mirror
- a replay platform
- a racecard redistribution service
- a live feed service

---

## Current limitation summary

- Generated schedule data is manual placeholder data.
- Runtime fetching does not exist yet.
- Parsers do not exist yet.
- Fixture parser tests are specified but not implemented.
- Country and racecourse coverage is still seed-level.
- Visual guide assets are not started.

---

## Next phase candidates

- expand source registry entries
- add parser fixtures
- implement minimal fixture parser
- improve generated meeting display
- expand countries and racecourses
- expand glossary entries
- prepare visual guide assets
- prepare multilingual expansion

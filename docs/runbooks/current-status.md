# Current status

Status: public project note  
Last updated: 2026-05-27

This document summarizes the public-safe project state for Where Horses Run / 競馬どこ？. It intentionally focuses on product, implementation, deployment, and next technical steps.

---

## Project

Where Horses Run / 競馬どこ？ is a static-first guide to official horse racing calendars, timetables, tracks, sources, and glossary entries.

The project does not republish entries, odds, results, payouts, tips, or full racecards. Race details should be confirmed on official sources whenever available.

---

## Repository and deployment

```text
Repository: badjoke-lab/where-horses-run
Default branch: main
Deployment: Cloudflare Pages
Current phase: Static MVP
```

---

## Completed implementation steps

```text
PR-003: Initialized the Astro application shell.
PR-005: Added static data skeletons and generated data placeholders.
PR-004: Split the initial CSS into theme, base, layout, components, and utilities layers.
```

Current app baseline:

```text
- Astro application shell exists.
- English root page exists.
- Japanese root page exists.
- Static data skeletons exist.
- Generated data placeholder files exist.
- Split CSS layer structure exists.
- Cloudflare Pages deployment is connected.
```

---

## Current data state

Static data skeletons include:

```text
data/static/countries.json
data/static/racecourses.json
data/static/sources.json
data/static/glossary.json
data/static/archive.json
data/static/i18n/en.json
data/static/i18n/ja.json
```

Generated placeholder files include:

```text
data/generated/latest.json
data/generated/today.json
data/generated/tomorrow.json
data/generated/calendar-30d.json
data/generated/fetch-status.json
```

Runtime fetching, parsers, and scheduled data updates have not started yet.

---

## Current technical status

The project is in the early Static MVP phase.

The next technical goal is to make the static and generated JSON files safer to edit by adding validation scripts before more pages consume the data.

---

## Next planned steps

Recommended next sequence:

```text
PR-006: Add data validation foundation.
PR-007: Wire validation into the baseline check workflow.
PR-008: Add i18n and data utility helpers.
PR-009: Implement countries index and detail pages.
PR-010: Implement tracks index and detail pages.
PR-011: Implement glossary index and detail pages.
PR-012: Implement archive and sources pages.
PR-013: Implement calendar fallback page.
```

---

## PR-006 target

PR-006 should add a validation script for JSON files.

Expected scope:

```text
- Validate JSON parseability.
- Check required fields for countries, racecourses, sources, glossary entries, archive entries, and generated placeholders.
- Check enum values such as status, coverage level, auto level, source type, and image status.
- Check basic references such as country_id and related terms where applicable.
- Check basic URL and timezone field shapes where present.
```

Out of scope for PR-006:

```text
- Runtime fetching.
- Source parsers.
- Scheduled workflows.
- Cloudflare Workers or Pages Functions.
- Database work.
- Image asset generation.
```

---

## Public data boundary

The public project should continue to follow this boundary:

```text
Show:
- countries and regions
- racecourses
- official source links
- calendar and timetable coverage where available
- coverage and auto labels
- glossary entries
- data freshness and fallback status

Do not republish:
- entries
- odds
- results
- payouts
- tips
- full racecards
- private or paid data feeds
```

---

## Deployment notes

The site is static-first. Cloudflare Pages can build and deploy the static Astro output from the repository.

Expected build settings:

```text
Build command: npm run build
Build output directory: dist
Production branch: main
```

---

## Current limitation summary

```text
- Only the root and Japanese root pages are implemented so far.
- Static data exists but is not yet fully rendered across pages.
- Generated data files are placeholders.
- No live source fetching or parsers exist yet.
- More pages are required before the static MVP is complete.
```

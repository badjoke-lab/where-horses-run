# Current status

Status: public project note  
Last updated: 2026-06-05

This document summarizes the public-safe project state for Where Horses Run / 競馬どこ？.

---

## Project

Where Horses Run / 競馬どこ？ is a static-first guide to official horse racing calendars, timetables, racecourses, racing types, glossary entries, generated schedule status, and source links.

The project does not republish entries, odds, results, payouts, tips, full racecards, private feeds, or paid feeds.

---

## Repository and deployment

Repository: badjoke-lab/where-horses-run  
Default branch: main  
Deployment: Cloudflare Pages  
Current phase: public page architecture and non-calendar discovery foundation

---

## Current public page architecture

The public site now has these core English routes:

```text
/
/today/
/tomorrow/
/calendar/
/countries/
/countries/[slug]/
/tracks/
/tracks/[slug]/
/types/
/types/[slug]/
/glossary/
/glossary/[slug]/
/sources/
/sources/[country]/
/about/
/disclaimer/
```

Japanese equivalents are available under `/ja/` for the same main discovery areas.

---

## Completed public-facing areas

The current public-facing foundation includes:

- bilingual root pages
- today / tomorrow / calendar pages
- country index and country detail pages
- racecourse index and racecourse detail pages
- racing type index and racing type detail pages
- glossary index and glossary detail pages
- source index and country source pages
- about and disclaimer pages
- generated schedule status visibility
- data validation scripts
- generated data dry-run checks

---

## Racecourse pages

Racecourse pages use one page per racecourse:

```text
/tracks/[slug]/
/ja/tracks/[slug]/
```

They currently display:

- basic racecourse information
- today status
- upcoming meeting status
- upcoming race-condition empty states
- course profile fields
- distance profile fields
- notable race placeholder sections
- seasonality
- official links
- data status
- related glossary terms
- related sources
- country source registry links

Racecourse pages do not republish entries, odds, results, payouts, tips, or full racecards.

---

## Racecourse index pages

The racecourse index pages now support browsing by:

- country / region
- racing type
- surface

They also show basic racecourse card data, schedule status, course profile status, and internal links to racecourse detail pages and racing type pages.

---

## Racing type pages

Racing types are independent navigation targets, not glossary-only entries.

```text
/types/
/types/[slug]/
/ja/types/
/ja/types/[slug]/
```

Racing type detail pages currently connect:

- racing type overview
- related racecourses
- related countries
- surface tags
- related glossary terms
- main glossary context

Glossary remains separate and is used for terminology explanations.

---

## Source pages

Source pages currently include:

```text
/sources/
/sources/[country]/
/ja/sources/
/ja/sources/[country]/
```

Country source pages show source entries and related racecourses for a country. Racecourse detail pages link back to their country source registry.

Source pages are for routing and confirmation. Official or licensed source pages should be used for entries, odds, results, payouts, tips, and full racecards.

---

## Current data state

Static datasets currently include:

- countries
- racecourses
- glossary
- sources
- archive
- i18n dictionaries
- country racing inventory
- major-country timetable v0 support files

Generated datasets currently include:

- latest
- today
- tomorrow
- calendar-30d
- fetch-status
- live-fetch-probe-status
- timetables

Generated schedule data remains partial and public-safe.

---

## Current pipeline state

The generated pipeline remains dry-run oriented.

It currently supports:

- generated data shape validation
- racecourse page-field validation
- related glossary/source reference validation
- parser fixture validation
- fixture parser harness checks
- parser output normalization checks
- source fetch plan checks
- skipped fetch result checks
- GitHub Actions dry-run validation

It does not currently support:

- live network fetching as a public runtime feature
- source-specific live parsing as a public runtime feature
- generated file writeback automation
- scheduled automatic updates
- raw live page storage
- entries, odds, results, payouts, predictions, tips, or full racecard redistribution

---

## Current product position

The project currently focuses on:

- official source routing
- readable timetable guidance
- racecourse discovery
- racing type discovery
- glossary education
- source registry navigation
- generated data status visibility
- lightweight static presentation
- bilingual presentation
- safe generated pipeline groundwork

The project is not currently:

- a betting platform
- a live odds platform
- a results mirror
- a replay platform
- a racecard redistribution service
- a live feed service
- a complete public coverage product

---

## Current limitation summary

- Public coverage remains partial.
- Runtime fetching is not available as a public feature.
- Live parsers are not available as a public feature.
- GitHub Actions dry-run does not write generated files.
- Country and racecourse coverage is not complete.
- Many racecourse course-profile fields are still unconfirmed placeholders.
- Visual guide assets are not started.

---

## Next public-safe work

Recommended next work:

1. Enrich a small set of selected racecourse profiles with verified official-source course details.
2. Add source-safe course profile references for those selected racecourses.
3. Improve racecourse data status notes where official details are still pending.
4. Continue improving glossary coverage for racing and timetable terms.
5. Keep timetable and calendar data clearly marked as partial unless coverage is verified.

Near-term candidate:

```text
Enrich one selected Japan racecourse profile first, then reuse the pattern for additional racecourses.
```

All future additions should remain source-first and should not republish entries, odds, results, payouts, tips, or full racecards.

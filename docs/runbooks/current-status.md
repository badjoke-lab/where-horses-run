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
Current phase: M3 v0 generator foundation release gate

---

## M3 v0 release gate status

M3 v0 generator foundation is complete.

Release-gate public wording:

- public coverage remains partial
- UAE is season gap / no active-window meetings
- no live fetch is enabled
- no source page parsing
- no raw source body storage
- No public complete coverage claim
- No racecards, odds, results, payouts, predictions, or tips are stored

This gate reflects the generator foundation plus first reviewed normalized samples only. It does not change live/replay coverage data, production calendar coverage claims, post-time coverage claims, racecards, odds, entries, results, payouts, or acquisition behavior. The timetable data-flow and display contract now documents how future source inventory, acquisition routes, normalized meeting records, and calendar summaries should connect before additional real authority records are added. The [normalized timetable output schema](../specs/normalized-timetable-output-schema.md) now defines the generated Normalized Timetable Record layer and includes first manually reviewed public-safe JRA, NAR/local-government-racing, and HKJC meeting samples before calendar view model projection. The [Calendar view model reader contract](../specs/calendar-view-model-reader-contract.md) and `src/lib/timetable/calendar-view-model.ts` helper now define the reusable public-safe projection from Normalized Timetable Record data to monthly/day meeting summaries. Those first normalized JRA, NAR/local-government-racing, and HKJC samples are now preview-readable through the calendar view model reader on the Major Country Timetable Preview monthly/day surface, with no live fetch, parser, scheduler, writeback, race-by-race detail, or complete calendar coverage claim.

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
- normalized timetable output schema validation
- calendar view model reader validation

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
- global-first timetable architecture notes
- [authority source inventory schema](../specs/authority-source-inventory-schema.md), [timetable acquisition route schema](../specs/timetable-acquisition-route-schema.md), [normalized timetable output schema](../specs/normalized-timetable-output-schema.md), [Calendar view model reader contract](../specs/calendar-view-model-reader-contract.md), [timetable data flow and display contract](../specs/timetable-data-flow-and-display-contract.md), Authority Source Inventory and Acquisition Route Inventory records for the initial peer JRA, NAR/local-government-racing, and HKJC route candidates, plus first reviewed public-safe Normalized Timetable Record samples

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
- live acquisition route fetching or scheduled acquisition route execution
- generated file writeback automation
- scheduled automatic updates
- raw live page storage
- entries, odds, results, payouts, predictions, tips, or full racecard redistribution

---

## Timetable refresh dry-run skeleton

The timetable refresh/acquisition route layer now includes a dry-run/status-only skeleton at `scripts/dry-run-timetable-acquisition-routes.mjs`, wired through `npm run validate:timetable-refresh-dry-run-skeleton`.

Current boundaries:

- dry-run/status-only route wiring validation
- no live fetching
- no scheduler
- no generated writeback
- no parser, scraper, adapter, or source-specific acquisition implementation
- no raw source body/html storage
- no racecards, odds, results, payouts, predictions, tips, full entries, or private/internal notes

Initial public-safe JRA, NAR/local-government-racing, and HKJC route records now exist as peer candidates in the Acquisition Route Inventory and link to reviewed Authority Source Inventory pairs. Future route records can be checked through this skeleton before implementation. The skeleton reads the Acquisition Route Inventory, Acquisition Route schema, Authority Source Inventory, and Normalized Timetable Record output, then reports whether route records link to reviewed `authority_id` + `official_source_id` pairs and stay inside allowed acquisition mode, output target, and refresh-scope enums. The route records remain dry-run/status-only and do not add live fetching, adapter logic, parser logic, scheduler behavior, or generated writeback automation; the normalized samples were manually reviewed and are summary-only.

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
- global-first timetable architecture
- multi-authority source inventory schema validation
- public-safe timetable data-flow, display, acquisition-route, Normalized Timetable Record, and Calendar view model reader contract
- multi-authority source inventory planning

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
- The global timetable source inventory has initial peer JRA, NAR/local-government-racing, and HKJC route candidates plus first manually reviewed normalized meeting samples only; the adapter selection matrix is not implemented yet, and the common Calendar view model reader contract is not wired to public calendar UI yet.
- Many racecourse course-profile fields are still unconfirmed placeholders.
- Visual guide assets are not started.

---

## Next public-safe work

Recommended next work:

1. Review the first normalized meeting samples against source and route records before expanding coverage.
2. Add multi-country source candidates for overseas authorities at the same inventory level.
3. Add additional reviewed normalized timetable records only after source and route review.
4. Keep validating normalized records through the common calendar display reader contract before UI wiring.
5. Create the adapter selection matrix.
6. Keep the first adapter candidates limited to JRA / NAR / HKJC as peer candidates.

Near-term candidate:

```text
Continue from the initial JRA, NAR/local-government-racing, and HKJC source-route records, then add overseas source candidates under the same source status, last checked date, and capability rank model after public-safe review.
```

JRA remains a reusable verified source and adapter candidate. It is not the center of the timetable architecture. All future additions should remain source-first and should not republish entries, odds, results, payouts, tips, or full racecards.

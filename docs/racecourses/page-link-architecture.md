# Racecourse page-link architecture

Status: implemented for review

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`

## Purpose

A racecourse page is the bilingual hub between reviewed public meetings, country context, racing types, glossary explanations, official sources, and coverage methodology. Every link must resolve to an existing internal page or a reviewed official external route.

## Discovery baseline

The rendered audit covered all 36 English and 36 Japanese racecourse pages.

```text
country links: 72 / 72
Calendar links: 72 / 72
racing-type links: 72 / 72
existing related-glossary links: 72 / 72
country source-registry links: 72 / 72
official external links: 68 / 72
surface links: 0 / 52 applicable pages
direction links: 0 / 46 applicable pages
rendered meeting-date links: 0
data-status methodology links: 0 / 72
unresolved surface/direction glossary concepts: 8
```

The initial audit also reported 72 broken internal links. Those were Astro CSS asset hrefs, not page routes. The permanent gate distinguishes built assets from navigable pages.

## Implemented link contract

Every racecourse page now provides the applicable links below.

- Country → localized country page.
- Racing type → localized type page.
- Surface → localized glossary page.
- Direction → localized glossary page.
- Meeting date → localized Calendar date query.
- Official information → external official route plus localized country source registry.
- Data status and last checked → localized About explanation plus country source registry.
- Related terms → localized glossary pages.
- Back navigation → localized racecourse index.

The surface and direction glossary concepts added by this unit are:

- Turf;
- Dirt;
- All-weather course;
- Jump course;
- Left-handed course;
- Right-handed course;
- Course using both directions;
- Straight course.

## Official-route amendments

The discovery found two racecourse pages without a venue-level official external link.

- Hipódromo Chile → `https://www.hipodromo.cl/`
- Seoul Racecourse → `https://park.kra.co.kr/`

These amendments add official home routes only. They do not authorize parsing, timetable extraction, participant data, betting data, live-stream embedding, or unattended publication.

## Meeting-date behavior

Today, Next, and upcoming meeting dates remain one meeting per row. The date itself links to the localized Calendar using a `date=YYYY-MM-DD` query. No race-level programme data is expanded on the racecourse page.

The deterministic 2026-07-14 fixture renders meeting dates on 38 bilingual pages, and all 38 pages link every displayed Today, Next, and upcoming date to the localized Calendar.

## Implemented result

```text
bilingual racecourse pages: 72
official external links: 72 / 72
surface glossary links: 52 / 52 applicable pages
direction glossary links: 46 / 46 applicable pages
rendered meeting-date links: 38 / 38 applicable pages
data-status methodology links: 72 / 72
broken internal page links: 0
unresolved glossary concepts: 0
```

## Internal-link integrity

The permanent rendered gate validates:

- all 72 bilingual racecourse pages;
- every applicable country, type, glossary, Calendar, About, and source-registry link;
- every localized meeting-detail link inherited from the public meeting panel;
- every internal page href against the built `dist` tree;
- built CSS and other asset hrefs as assets rather than page routes;
- zero unresolved surface/direction glossary concepts.

The gate remains a permanent read-only pull-request and main-branch check for glossary concepts, official-route amendments, meeting-date links, racecourse pages, and the public meeting panel.

## Public boundary

This unit preserves the existing public display boundary. Racecourse pages remain list-shaped and do not display entries, horse names, jockeys, trainers, odds, results, payouts, predictions, complete racecards, raw source bodies, embedded video, or direct stream URLs.

The permanent gate performs no network request, timetable write, automatic source acceptance, publication, or deployment.

## Next unit

`RACECOURSE-PAGE-BILINGUAL-QA-01` will validate responsive presentation, language parity, metadata, accessibility markers, and final racecourse-page release readiness.

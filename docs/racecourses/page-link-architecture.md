# Racecourse page-link architecture

Status: implemented for review; extended by current map UI decision

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`

Current extension authority: `docs/decisions/map-ui-integration-2026-09-05.md`

## 2026-09-05 map/navigation extension

The original link contract below remains historical evidence of the completed pre-map racecourse-page unit. Current racecourse-page navigation is extended by the 2026-09-05 map UI decision.

A racecourse page now treats verified location/map presentation as a first-class page element. The map must resolve from the reviewed racecourse identity/location master and must not create a separate racecourse identity or meeting dataset.

Current requirements:

- one verified racecourse point per racecourse detail page;
- high initial zoom appropriate to the venue and immediate surroundings;
- normal zoom/pan interaction;
- no runtime geocoding for normal rendering;
- racecourse address/region/country context where verified;
- map failure must preserve ordinary racecourse, meeting, Calendar, country/context, and official-source links;
- map selection must lead to existing racecourse/meeting navigation rather than a map-only route;
- map popup/card content is list-level only and must not expand race-level A/A+ programme rows;
- Today and Calendar map views reuse the same public meeting records and racecourse identities as their list views.

The full location schema, Home/Today/Calendar behavior, mobile behavior, public display boundary, runtime-network exception, implementation order, and completion definition are governed by `docs/decisions/map-ui-integration-2026-09-05.md` and `docs/project-roadmap-2026-09-05-addendum.md`.

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

The map UI extension does not weaken this boundary. The only runtime-network exception it permits is rendering resources required by an approved basemap implementation; runtime racing-data acquisition remains prohibited.

## Next unit

The historical next unit was `RACECOURSE-PAGE-BILINGUAL-QA-01`, which is complete. Current racecourse-page map work follows `MAP-001` through `MAP-010` in `docs/project-roadmap-2026-09-05-addendum.md`.

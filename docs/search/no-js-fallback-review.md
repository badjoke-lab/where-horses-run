# No-JavaScript fallback review

Status: complete  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `NO-JS-FALLBACK-REVIEW-01`  
Reviewed: 2026-07-17

## Purpose

The five bilingual discovery surfaces have been reviewed as complete static pages with JavaScript disabled.

The existing pages already rendered every record before client-side filtering. The review found one cross-page usability defect: search and filter forms remained visible even though a static deployment cannot process those forms without JavaScript. Submitting a form only changed the URL and then returned the same complete list.

The fallback now removes those inert controls from the no-JavaScript experience while retaining the complete linked directories and localized explanations.

## Reviewed surfaces

Ten routes are covered:

```text
/search/
/ja/search/
/countries/
/ja/countries/
/tracks/
/ja/tracks/
/sources/
/ja/sources/
/glossary/
/ja/glossary/
```

Frozen record counts per locale are:

```text
Global search: 182
Countries and regions: 98
Racecourses: 36
Sources: 171
Glossary: 48
Total per locale: 535
Bilingual total: 1,070
```

## Shared fallback style

`BaseLayout.astro` now contains one `noscript` stylesheet identified by:

```text
data-no-js-fallback-style
```

The body carries:

```text
data-no-js-fallback="complete-list-v1"
```

When JavaScript is disabled, the stylesheet hides:

- five client-side form types;
- five live-result count types;
- the country region navigation whose query links require client-side restoration;
- the glossary category navigation whose query links require client-side restoration.

This prevents users from being offered controls that cannot alter a static page.

## Content preserved

The fallback does not hide result containers or records.

Each locale retains:

- all 182 global-search records;
- all 98 country and region records;
- all 36 racecourse records;
- all 171 source records;
- all 48 glossary records.

Every record retains at least one primary link. Empty-result sections retain their HTML `hidden` attribute and therefore do not appear when filtering code is absent.

## Localized explanation

Each of the ten reviewed routes already contains a localized `noscript` explanation stating that the complete linked list remains available. Those messages remain visible because only the inert form, live count, and query-only navigation selectors are hidden.

The English and Japanese messages do not claim that server-side filtering is available.

## Navigation and accessibility

The native mobile menu remains a `details` and `summary` control. It does not require JavaScript and remains closed by default on mobile while its navigation is exposed by the completed desktop stylesheet above 720 pixels.

The Skip to content / 本文へ移動 link remains before the shared site shell on every reviewed route.

## Public and privacy boundary

The implementation adds no:

- server-side filtering endpoint;
- external search service;
- cookies;
- client storage;
- fallback interaction logging;
- analytics;
- automatic publication;
- deployment behavior.

All existing source, glossary, country, racecourse, timetable, search, and publication boundaries remain unchanged.

## Validation

The permanent checker is:

```text
scripts/check-no-js-fallback-review.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/no-js-fallback-review.yml
```

The gate builds the complete bilingual site, preserves all completed search, filter, glossary, mobile, and desktop contracts, validates the shared `noscript` style, counts all 1,070 record cards, rejects initially hidden records or missing primary links, verifies localized fallback messages, confirms empty states stay hidden, checks native navigation and skip links, and proves the repository remains clean.

## Next implementation unit

```text
UX-POLISH-RELEASE-01
```

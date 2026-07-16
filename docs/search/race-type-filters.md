# Race type filters

Status: implemented for review  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `RACE-TYPE-FILTERS-01`  
Reviewed: 2026-07-16

## Purpose

The bilingual racecourse directory now provides static-first discovery across all 36 published racecourses.

English route:

```text
/tracks/
```

Japanese route:

```text
/ja/tracks/
```

The implementation follows the racecourse link architecture:

```text
Search by name
Filter by country
Filter by racing type
Filter by surface
```

The filters only change which existing cards are visible. They do not fetch records, modify racecourse data, or publish new pages.

## Filter controls

Four controls are available:

1. keyword (`q`);
2. country or region (`country`);
3. racing type (`racing_type`);
4. surface (`surface`).

All controls can be combined. State is restored from the URL and written back with `history.replaceState`.

Keyword matching uses:

```text
Unicode normalization: NFKC
case handling: insensitive
whitespace: collapsed and trimmed
```

The keyword index contains public racecourse identifiers, slugs, English names, Japanese names, local names, country labels, city, region, racing types, surfaces, direction, publication status, schedule status, and course-profile status.

## Static-first behavior

All 36 linked racecourse cards are rendered before JavaScript runs.

When JavaScript is available:

- filters update immediately;
- the visible result count updates through an `aria-live` region;
- a zero-result message is shown when necessary;
- the clear button restores the full list;
- URL parameters preserve the selected state.

When JavaScript is disabled:

- the complete list of 36 linked racecourse records remains visible;
- all 72 English and Japanese racecourse detail routes remain reachable;
- no external filter service or server endpoint is required.

## Linked navigation

Each racecourse card preserves links to:

- its English or Japanese racecourse detail page;
- its English or Japanese country page;
- reviewed English or Japanese racing-type pages when a matching type exists.

The English racecourse route pattern is:

```text
/tracks/{slug}/
```

The Japanese racecourse route pattern is:

```text
/ja/tracks/{slug}/
```

## Public and privacy boundary

Allowed:

- public racecourse names;
- public country, city, region, racing-type, surface, direction, and status metadata;
- internal links to existing racecourse, country, and racing-type pages.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, or payouts;
- predictions;
- copied raw source bodies.

The implementation adds no external filtering service, server filter endpoint, query logging, cookies, analytics, live fetching, automatic generation, automatic publication, or deployment behavior.

## Validation

The permanent checker is:

```text
scripts/check-race-type-filters.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/race-type-filters.yml
```

The gate builds the site, preserves the glossary public v1, global search, and country-filter contracts, validates both rendered racecourse directories, compares rendered option sets against card metadata, checks all 72 racecourse detail routes, checks country and racing-type links, and proves the repository remains clean.

## Roadmap correction

The canonical PR roadmap sequence is:

```text
COUNTRY-FILTERS-01
-> RACE-TYPE-FILTERS-01
-> REGION-FILTERS-01
```

The earlier `RACECOURSE-FILTERS-01` next-unit label was an incorrect local name and is corrected in this implementation unit.

## Next implementation unit

```text
REGION-FILTERS-01
```

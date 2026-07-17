# Source status filters

Status: complete  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `SOURCE-STATUS-FILTERS-01`  
Reviewed: 2026-07-17

## Purpose

The bilingual source directory now exposes the reviewed public source registry as a static-first, filterable directory.

The implementation covers 171 unique reviewed public source records across 98 countries and regions. It does not fetch source pages, copy source bodies, infer permissions, or alter publication status.

## Routes

English directory:

```text
/sources/
```

Japanese directory:

```text
/ja/sources/
```

Each rendered source card links to the public country source route for its country or region. The release therefore preserves 196 bilingual country source routes:

```text
/sources/{country-slug}/
/ja/sources/{country-slug}/
```

## Filters

Seven controls are available in both locales:

1. keyword: `q`
2. country or region: `country`
3. source type: `source_type`
4. data type: `data_type`
5. automation level: `auto_level`
6. terms risk: `risk`
7. registry status: `status`

The current reviewed option sets are:

```text
source_type: official
data_type: link_only
auto_level: B, C
risk: unknown
status: alpha_link_first, not_recorded, pending_reachability
```

A missing `m3_status` value is represented explicitly as `not_recorded`. The UI does not silently treat missing registry metadata as approved, reachable, or safe for automation.

## User behavior

The directory supports:

- Unicode NFKC keyword normalization;
- case-insensitive and whitespace-normalized matching;
- combined use of all seven controls;
- live result counts;
- a visible zero-result state;
- one clear-filters action;
- query-parameter restoration after navigation;
- country source links and official external source links on every record.

The query string is updated with `history.replaceState`. No query is sent to a server or external search service.

## Static-first behavior

All 171 records are rendered into each locale before JavaScript runs.

When JavaScript is available, the controls hide and reveal the already-rendered records.

When JavaScript is disabled, the complete linked source list remains readable. The page does not require a filter endpoint, client storage, cookies, or an external index.

## Public and privacy boundary

Allowed:

- public source IDs;
- official public source URLs;
- public country source links;
- reviewed source metadata already present in the public registry;
- client-side URL state.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, or payouts;
- predictions;
- raw source bodies;
- automatic source acceptance or publication.

The implementation adds no live fetch, server filter endpoint, query logging, cookies, analytics, automatic generation, automatic publication, or deployment behavior.

## Validation

The temporary discovery workflow measured 172 rendered rows and exposed one duplicate source ID. The duplicate `chile-hipodromo-chile-home` amendment record was removed while its canonical country-source record and racecourse relationship were preserved. The released contract therefore freezes 171 unique source records.

The temporary discovery workflow was removed before release.

The permanent checker is:

```text
scripts/check-source-status-filters.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/source-status-filters.yml
```

The gate builds the site, preserves the glossary, global-search, country-filter, race-type-filter, and region-filter contracts, validates both source directories, checks the frozen option sets, verifies all 196 bilingual country source routes, rejects duplicate source IDs or missing filter attributes, confirms the temporary workflow is absent, and proves the repository remains clean.

## Next implementation unit

```text
GLOSSARY-SEARCH-IMPROVEMENT-01
```

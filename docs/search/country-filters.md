# Country filters

Status: implemented for review  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `COUNTRY-FILTERS-01`  
Reviewed: 2026-07-16

## Purpose

The bilingual country directory now provides static-first filtering across all 98 published countries and regions.

English route:

```text
/countries/
```

Japanese route:

```text
/ja/countries/
```

The filters reduce the visible list only. They do not fetch new records, change publication status, or create new country pages.

## Filter controls

Five controls are available:

1. keyword (`q`);
2. region (`region`);
3. racing type (`racing_type`);
4. publication status (`status`);
5. coverage level (`coverage`).

All filters can be combined. The current state is restored from the URL and written back with `history.replaceState`.

Keyword matching uses:

```text
Unicode normalization: NFKC
case handling: insensitive
whitespace: collapsed and trimmed
```

The keyword index contains public country identifiers, slugs, English names, Japanese names, local names, summaries, region, status, automation level, and racing-type identifiers.

## Static-first behavior

All 98 linked country cards are rendered before JavaScript runs.

When JavaScript is available:

- filters update immediately;
- the visible result count updates through an `aria-live` region;
- a zero-result message is shown when necessary;
- the clear button restores the full list;
- URL parameters preserve the selected state.

When JavaScript is disabled:

- the complete list of 98 linked records remains visible;
- every country page remains reachable;
- no filter service or server endpoint is required.

## Localized display

Both routes use the same canonical 98 records.

The English route links to:

```text
/countries/{slug}/
```

The Japanese route links to:

```text
/ja/countries/{slug}/
```

Japanese display labels are provided for common racing-type and broad region values. Unmapped reviewed source labels remain visible rather than being guessed or discarded.

## Public and privacy boundary

Allowed:

- public country and region names;
- public summaries;
- public region, racing-type, status, coverage, and automation labels;
- internal links to existing country pages.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, or payouts;
- predictions;
- copied raw source bodies.

The implementation adds no:

- external filter service;
- server filter endpoint;
- query logging;
- cookies;
- analytics;
- live fetching;
- automatic generation;
- automatic publication;
- deployment behavior.

## Validation

The permanent checker is:

```text
scripts/check-country-filters.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/country-filters.yml
```

The gate builds the site, preserves the glossary public v1 and global search contracts, validates both rendered country directories, compares rendered filter option sets against card metadata, checks all 196 bilingual country detail links, and proves the repository remains clean.

## Next implementation unit

```text
RACE-TYPE-FILTERS-01
```

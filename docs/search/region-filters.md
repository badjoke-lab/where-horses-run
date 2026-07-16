# Region filters

Status: implemented for review  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `REGION-FILTERS-01`  
Reviewed: 2026-07-16

## Purpose

The country directory now treats broad regions as reviewed facets instead of requiring an exact match against a compound source label.

A country whose source value is:

```text
Europe / Middle East
```

is discoverable through both:

```text
Europe
Middle East
```

The original public region label remains visible on the country card.

## Region facets

Eight broad facets are released:

```text
Africa
Asia
Caribbean
Europe
Middle East
North America
Oceania
South America
```

Each facet shows its current country-and-region count. Counts are derived from the same 98 static country records used by the directory.

## Routes

English directory:

```text
/countries/
```

Japanese directory:

```text
/ja/countries/
```

Region links use the existing `region` query parameter:

```text
/countries/?region=Asia
/ja/countries/?region=Asia
```

No new country records or detail routes are created.

## User behavior

The bilingual directory now provides:

- a visible Browse by region / 地域から探す section;
- eight region cards per locale;
- a current count on every region card;
- direct region-filter links;
- region options with counts inside the existing filter form;
- URL restoration after navigation;
- an `aria-current="page"` marker on the selected region link;
- continued combination with keyword, racing type, status, and coverage filters.

## Static-first behavior

All 98 country cards are still rendered before JavaScript runs.

When JavaScript is available, a region link restores the region selector and filters records whose region-membership list contains that facet.

When JavaScript is disabled, the complete list remains readable and every country detail link remains available. The query parameter does not hide static fallback content.

## Localization

The same eight canonical IDs are used in both locales. Japanese labels are display-only translations:

```text
Africa -> アフリカ
Asia -> アジア
Caribbean -> カリブ海地域
Europe -> ヨーロッパ
Middle East -> 中東
North America -> 北米
Oceania -> オセアニア
South America -> 南米
```

URLs and machine-readable attributes continue to use the canonical English IDs.

## Public and privacy boundary

Allowed:

- reviewed public region labels;
- aggregate country counts;
- public country links;
- URL-based client-side filter state.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, or payouts;
- predictions;
- raw source bodies.

The implementation adds no external filter service, server filter endpoint, query logging, cookies, analytics, live fetching, automatic generation, automatic publication, or deployment behavior.

## Validation

The permanent checker is:

```text
scripts/check-region-filters.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/region-filters.yml
```

The gate builds the site, preserves the glossary, global search, country-filter, and race-type-filter contracts, validates the eight region IDs, compares navigation counts against rendered card memberships, checks all 16 bilingual region links, and proves the repository remains clean.

## Next implementation unit

```text
SOURCE-STATUS-FILTERS-01
```

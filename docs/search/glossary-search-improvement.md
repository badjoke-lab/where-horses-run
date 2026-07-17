# Glossary search improvement

Status: complete  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `GLOSSARY-SEARCH-IMPROVEMENT-01`  
Reviewed: 2026-07-17

## Purpose

The English and Japanese glossary directories now provide static-first search and category filtering across the existing Glossary Public v1 release.

The change does not add, remove, redefine, translate automatically, or reclassify glossary concepts. It improves discovery of the reviewed 48 concepts, nine categories, 57 relationships, and 96 bilingual detail routes.

## Routes

English directory:

```text
/glossary/
```

Japanese directory:

```text
/ja/glossary/
```

Category navigation uses the reviewed category IDs:

```text
/glossary/?category=role
/ja/glossary/?category=role
```

Existing detail routes remain unchanged:

```text
/glossary/{slug}/
/ja/glossary/{slug}/
```

## Search fields

Keyword search uses Unicode NFKC normalization, case-insensitive matching, and whitespace normalization.

Every record is searchable through:

- concept ID and slug;
- English and Japanese canonical terms;
- English and Japanese summaries;
- English and Japanese aliases;
- Japanese reading;
- English pronunciation when recorded;
- paired beginner explanations;
- category ID;
- English and Japanese category labels.

Searching is intentionally bilingual in both locale pages. An English query can find a concept on the Japanese directory, and a Japanese query can find the same concept on the English directory.

## Category filters

The nine reviewed categories and counts are preserved:

```text
race_type: 10
breed: 4
horse_type: 1
role: 8
data_term: 8
official_source: 5
governance_term: 3
track_term: 5
surface: 4
```

Each locale renders nine category cards and nine selector options. A category link restores the selector through the `category` query parameter and marks the active category with `aria-current="page"`.

Keyword and category filters work together. The `q` and `category` parameters are restored on page load and updated with `history.replaceState` without sending the query to a server.

## User behavior

The bilingual directories provide:

- one keyword input;
- one category selector;
- live result counts;
- a visible zero-result state;
- one clear-filters action;
- direct navigation through all nine category cards;
- links to all 48 detail pages in each locale;
- continued access to the 57-edge relationship graph.

## Static-first behavior

All 48 glossary cards are rendered in each locale before JavaScript runs.

When JavaScript is available, filtering only hides or reveals records that are already present in the page.

When JavaScript is disabled, the complete list of 48 concepts and every detail link remain readable. Category query parameters do not remove fallback content.

## Public and privacy boundary

Allowed:

- reviewed definitions and navigation;
- reviewed bilingual terms, readings, aliases, summaries, and beginner explanations;
- aggregate category counts;
- local client-side filter state in the URL.

Not allowed:

- participant datasets;
- complete racecards;
- odds, results, or payouts;
- predictions or betting advice;
- raw source bodies;
- automatic translation, generation, acceptance, or publication.

The implementation adds no external search service, server search endpoint, query logging, cookies, client storage, analytics, live fetch, or deployment behavior.

## Validation

The permanent checker is:

```text
scripts/check-glossary-search-improvement.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/glossary-search-improvement.yml
```

The gate builds the site, preserves Glossary Public v1 and the completed discovery contracts, validates both directories, verifies all category IDs and counts, checks all 18 category links and 96 bilingual detail routes, rejects duplicate IDs or missing search text, and proves the repository remains clean.

## Next implementation unit

```text
MOBILE-NAVIGATION-IMPROVEMENT-01
```

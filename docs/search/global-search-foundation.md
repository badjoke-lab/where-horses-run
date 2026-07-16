# Global search foundation

Status: implemented for review

Work ID: `WHR-SEARCH-FILTER-SEO-V1`

Implementation unit: `GLOBAL-SEARCH-FOUNDATION-01`

Last reviewed: 2026-07-16

## Purpose

Provide one bilingual search entry point for the public country, racecourse, and glossary layers before adding narrower country and racing-type filters.

## Indexed scope

```text
countries and regions:  98
racecourses:            36
glossary concepts:      48
total records:         182
locales:                 2
search routes:           2
```

The English route is `/search/` and the Japanese route is `/ja/search/`.

## Indexed fields

Country records index English, Japanese, and local names, region, racing types, and reviewed summaries.

Racecourse records index English, Japanese, and local names, country names, city, region, racing types, surfaces, and course direction.

Glossary records index English and Japanese terms, Japanese readings, language-specific aliases, summaries, beginner explanations, and category IDs.

The index uses the released merged glossary rather than the protected baseline glossary file, so all 48 public v1 concepts are searchable.

## User-visible behavior

The search page provides:

- one keyword field;
- a type filter for Country or region, Racecourse, and Glossary term;
- live client-side filtering;
- form submission behavior;
- restoration from the `q` and `type` URL parameters;
- a live result count;
- a clear zero-result state;
- language-specific result links;
- the complete linked list when JavaScript is unavailable.

Search normalization uses Unicode NFKC normalization, case-insensitive comparison, and collapsed whitespace. This allows Japanese full-width text and common Latin-script case differences to match the same reviewed record text.

## No-JavaScript boundary

All 182 result cards are rendered into the static HTML in both languages. JavaScript only hides non-matching records after the page loads.

When JavaScript is disabled, the user can still read and follow every indexed link. Search is an enhancement, not a requirement for accessing the underlying pages.

## Privacy and infrastructure

The implementation uses no external search service, server query endpoint, cookies, analytics, or query logging.

The current query is stored only in the browser URL so that the visible state can be copied or restored. No query is sent to Where Horses Run infrastructure beyond the normal static page request.

## Public boundary

The index contains only labels, public summaries, public descriptive fields, and internal links already used by the site.

It does not index or publish participant data, complete racecards, entries, odds, results, payouts, predictions, betting advice, or raw source bodies.

## Validation

The permanent gate:

- builds both search routes and the complete site;
- preserves the `WHR-GLOSSARY-V1` release contract;
- verifies 98 country records, 36 racecourse records, and 48 glossary records per locale;
- verifies all 182 records have localized labels, links, types, and normalized search text;
- checks the NFKC, query-parameter, type-filter, zero-result, and no-JavaScript contracts;
- confirms the shared navigation and bilingual alternate routes include Search;
- proves the repository remains clean;
- performs no publication or deployment.

## Next unit

`COUNTRY-FILTERS-01` will add reviewed country-list filters without changing this global search contract.

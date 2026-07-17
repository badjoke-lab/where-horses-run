# Glossary page metadata

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `GLOSSARY-PAGE-METADATA-01`  
Reviewed: 2026-07-17

## Purpose

All 48 English and Japanese glossary term pairs now expose conservative page-specific JSON-LD derived only from metadata visible in the final rendered pages.

The implementation adds machine-readable term identity without changing definitions, routes, related-term links, source IDs, public-boundary notices, or the released glossary graph.

## Entity type

Each glossary concept uses schema.org `DefinedTerm`.

This type represents a word, name, acronym, phrase, or other concept with a formal definition. The page-specific layer uses only the released term name, visible summary, visible aliases, paired-language name, visible review date, and locale-matched glossary directory.

Related-term links are not converted into synonyms or identity relationships. The public pages already state that related concepts are not necessarily synonyms, so the metadata layer preserves that distinction by omitting `sameAs`, synonym properties, and inferred equivalence claims.

## Build integration

The dependency-free integration is:

```text
scripts/glossary-page-metadata-integration.mjs
```

It is registered after the sitemap, country-page, and racecourse-page metadata integrations in:

```text
astro.config.mjs
```

During `astro:build:done`, it scans only:

```text
/glossary/{slug}/
/ja/glossary/{slug}/
```

It explicitly excludes:

```text
/glossary/
/ja/glossary/
/glossary/relationships/
/ja/glossary/relationships/
```

The integration requires exactly:

```text
48 slugs
48 English detail pages
48 Japanese detail pages
96 detail pages in total
```

A build fails on missing locale partners, canonical mismatch, missing visible names or summaries, invalid review dates, missing baseline JSON-LD, or duplicate metadata markers.

## Visible source fields

The metadata layer reads only:

- rendered canonical URL;
- rendered page title;
- rendered meta description;
- rendered HTML language;
- visible term heading;
- visible hero summary;
- visible alias lists in both locales;
- visible `Last reviewed` / `最終確認日` time value.

No hidden glossary field, candidate content, internal note, source-body content, or automated inference is promoted into structured data.

## JSON-LD graph

Every term detail page receives one script:

```html
<script
  type="application/ld+json"
  data-glossary-page-metadata="collection-defined-term-v1"
>
```

The script contains exactly two nodes.

### CollectionPage

```text
@type: CollectionPage
@id: {canonical-url}#webpage
url: rendered canonical URL
name: rendered title
description: rendered meta description
inLanguage: rendered HTML language
isPartOf: https://whr.badjoke-lab.com/#website
lastReviewed: visible review date
about: {canonical-url}#defined-term
mainEntity: {canonical-url}#defined-term
```

The page ID reuses the `WebPage` identity from `STRUCTURED-DATA-BASELINE-01`.

### DefinedTerm

```text
@type: DefinedTerm
@id: {canonical-url}#defined-term
url: rendered canonical URL
name: visible localized term heading
description: visible hero summary
alternateName: paired-language term and visible aliases from both locale pages
inDefinedTermSet: locale-matched glossary directory identity
mainEntityOfPage: {canonical-url}#webpage
```

The term-set identities are:

```text
https://whr.badjoke-lab.com/glossary/#defined-term-set
https://whr.badjoke-lab.com/ja/glossary/#defined-term-set
```

Duplicate and empty alternate names are removed. The current reviewed scope contains 260 alternate-name values across 96 locale pages.

## Frozen scope

Discovery validated:

```text
Term entities: 48
English pages: 48
Japanese pages: 48
Metadata scripts: 96
Valid JSON scripts: 96
CollectionPage nodes: 96
DefinedTerm nodes: 96
Graph nodes: 192
Baseline links: 96
Term-set links: 96
Visible review dates: 96
Alternate-name arrays: 96
Alternate-name values: 260
Relationship pages excluded: 2
Relationship-page metadata scripts: 0
```

Measured errors were zero for:

- canonical mismatch;
- page title, description, or language mismatch;
- visible term-name mismatch;
- visible summary mismatch;
- missing alternate names;
- unexpected schema types;
- `sameAs` claims;
- inferred `termCode` claims;
- unsafe less-than characters.

## Claims intentionally excluded

This unit does not add:

- `sameAs` links;
- inferred term codes;
- synonyms inferred from related-term edges;
- a metadata entity on the relationship graph pages;
- participant, horse, jockey, trainer, racecard, odds, result, payout, prediction, or betting entities;
- hidden glossary, candidate, private-note, or source-body data.

## Privacy and automation boundary

The integration adds no visitor identifier, interaction logging, cookies, client storage, analytics, external schema service, automatic entity inference, content generation, publication, or deployment.

It is a deterministic transformation of reviewed static output.

## Validation

The permanent checker is:

```text
scripts/check-glossary-page-metadata.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/glossary-page-metadata.yml
```

The checker reconstructs all 48 bilingual pairs from rendered HTML, compares every JSON-LD field with visible content, validates locale-matched term-set links and all 260 alternate-name values, confirms that the two relationship pages remain excluded, preserves all previous SEO metadata units and the permanent glossary Public v1 release chain, and proves that validation leaves the repository clean.

## Next implementation unit

```text
CANONICAL-HREFLANG-REVIEW-01
```

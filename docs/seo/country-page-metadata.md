# Country page metadata

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `COUNTRY-PAGE-METADATA-01`  
Reviewed: 2026-07-17

## Purpose

The 98 English and Japanese country or region detail pairs now expose conservative page-specific JSON-LD derived only from metadata already visible in each rendered page.

The implementation does not change routes, page copy, public timetable fields, source links, or publication ceilings. It adds machine-readable identity for the existing guide pages without inventing facts that the visible page does not state.

## Why the entity type is AdministrativeArea

The `/countries/` programme includes countries as well as regions and territories. A single `Country` type would therefore make a sovereignty or classification claim that is not correct for every one of the 98 entries.

Every entity uses the shared `AdministrativeArea` type. This describes the geographic subject of the page without asserting that every entry is a sovereign country.

The implementation deliberately publishes no `sameAs` field. Horse-racing authorities and racecourse operators linked on the page are official information sources for racing, but they are not necessarily canonical identity URLs for the geographic area itself.

## Build integration

The dependency-free integration is:

```text
scripts/country-page-metadata-integration.mjs
```

It is registered after the sitemap integration in:

```text
astro.config.mjs
```

During `astro:build:done`, it scans only these rendered detail routes:

```text
/countries/{slug}/
/ja/countries/{slug}/
```

The country directory routes themselves are not included.

The integration requires exactly:

```text
98 slugs
98 English detail pages
98 Japanese detail pages
196 detail pages in total
```

A build fails if a locale partner is missing, a canonical path differs, a visible name or review date cannot be read, the baseline JSON-LD is absent, or a duplicate metadata marker already exists.

## Visible source fields

The metadata layer reads only values already present in the final HTML:

- canonical URL;
- page title;
- meta description;
- HTML language;
- the visible page heading;
- the visible `Local name` / `現地名` field;
- the visible `Profile reviewed` / `プロフィール確認日` field.

No hidden profile field, source registry assertion, candidate record, internal note, or acquisition result is promoted directly into structured data.

## JSON-LD graph

Every country or region detail page receives one additional script:

```html
<script
  type="application/ld+json"
  data-country-page-metadata="collection-administrative-area-v1"
>
```

The script contains exactly two nodes.

### CollectionPage

```text
@type: CollectionPage
@id: {canonical-url}#webpage
url: rendered canonical URL
name: rendered title
content description: rendered meta description
inLanguage: rendered HTML language
isPartOf: https://whr.badjoke-lab.com/#website
lastReviewed: visible profile-review date
about: {canonical-url}#administrative-area
mainEntity: {canonical-url}#administrative-area
```

The `@id` intentionally reuses the `WebPage` identity created by `STRUCTURED-DATA-BASELINE-01`. JSON-LD processors can combine the baseline `WebPage` description with the page-specific `CollectionPage` type and relationships.

### AdministrativeArea

```text
@type: AdministrativeArea
@id: {canonical-url}#administrative-area
url: rendered canonical URL
name: visible localized page-heading name
alternateName: paired-language visible name and visible local name
mainEntityOfPage: {canonical-url}#webpage
```

Duplicate or empty alternate names are removed.

## Frozen scope

Discovery validated:

```text
Area entities: 98
English pages: 98
Japanese pages: 98
Metadata scripts: 196
Valid JSON scripts: 196
CollectionPage nodes: 196
AdministrativeArea nodes: 196
Graph nodes: 392
Baseline links: 196
```

Measured errors were zero for:

- canonical mismatch;
- page title, description, or language mismatch;
- visible area-name mismatch;
- missing alternate names;
- missing visible review dates;
- unexpected schema types;
- `Country` type claims;
- `sameAs` claims;
- unsafe less-than characters.

## Claims intentionally excluded

This unit does not add:

- a universal `Country` classification;
- sovereignty or political-status claims;
- `sameAs` links to racing authorities or operators;
- `Organization` or `Person` identities;
- `Event` or `SportsEvent` identities;
- participant, horse, jockey, trainer, racecard, odds, result, payout, prediction, or betting entities;
- data inferred from private or candidate material.

Page-specific racecourse and glossary metadata remain separate implementation units.

## Privacy and automation boundary

The integration adds no visitor identifier, interaction logging, cookies, client storage, analytics, external schema service, automatic entity inference, content generation, publication, or deployment.

It runs only as a deterministic transformation of the reviewed static build.

## Validation

The permanent checker is:

```text
scripts/check-country-page-metadata.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/country-page-metadata.yml
```

The checker rebuilds the contract from all 196 rendered detail pages, verifies each locale pair, compares every graph field with visible HTML, rejects unsupported types and claims, preserves the Phase 10, sitemap, and structured-data baseline contracts, and proves that validation leaves the repository clean.

## Next implementation unit

```text
RACECOURSE-PAGE-METADATA-01
```

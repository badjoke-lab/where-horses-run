# Racecourse page metadata

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `RACECOURSE-PAGE-METADATA-01`  
Reviewed: 2026-07-17

## Purpose

All 36 English and Japanese racecourse detail pairs now expose conservative page-specific JSON-LD derived only from metadata visible in the final rendered pages.

The implementation adds machine-readable venue identity without changing page copy, routes, timetable fields, source links, meeting panels, or publication ceilings.

## Why the entity type is Place

A racecourse is a physical venue, but the public pages do not establish that every entry should be represented as a `LocalBusiness` or a more specific `SportsActivityLocation` business subtype.

The shared entity type is therefore `Place`. This captures the fixed physical venue while avoiding unsupported claims about business status, ownership, operation, public access, opening hours, events, or commercial offers.

The integration does not publish `sameAs`. Official schedule, venue, course, access, racecard, or result links are useful source links, but the implementation does not assume that every one is an unambiguous canonical identity URL for the venue.

## Build integration

The dependency-free integration is:

```text
scripts/racecourse-page-metadata-integration.mjs
```

It is registered after the sitemap and country-page metadata integrations in:

```text
astro.config.mjs
```

During `astro:build:done`, it scans only:

```text
/tracks/{slug}/
/ja/tracks/{slug}/
```

It requires exactly:

```text
36 slugs
36 English detail pages
36 Japanese detail pages
72 detail pages in total
```

A build fails on missing locale partners, canonical mismatch, missing visible fields, invalid country-page links, missing baseline JSON-LD, or duplicate metadata markers.

## Visible source fields

The metadata layer reads only:

- rendered canonical URL;
- rendered page title;
- rendered meta description;
- rendered HTML language;
- visible racecourse heading;
- visible local name when present in the hero summary;
- visible country or region link and link text;
- visible `City / region` or `都市 / 地域` text.

No hidden profile field, source registry assertion, operator identity, candidate record, internal note, or acquisition result is promoted directly into structured data.

## JSON-LD graph

Every racecourse detail page receives one script:

```html
<script
  type="application/ld+json"
  data-racecourse-page-metadata="collection-place-v1"
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
about: {canonical-url}#place
mainEntity: {canonical-url}#place
```

The page ID reuses the `WebPage` identity from `STRUCTURED-DATA-BASELINE-01`.

### Place

```text
@type: Place
@id: {canonical-url}#place
url: rendered canonical URL
name: visible localized racecourse heading
alternateName: paired-language heading and visible local name
address: visible city / region text
containedInPlace: linked country or region AdministrativeArea identity
mainEntityOfPage: {canonical-url}#webpage
```

The `containedInPlace` ID is derived from the visible country-page link and points to the locale-matched `{country-page-canonical}#administrative-area` identity created by `COUNTRY-PAGE-METADATA-01`.

## Frozen scope

Discovery validated:

```text
Racecourse entities: 36
English pages: 36
Japanese pages: 36
Metadata scripts: 72
Valid JSON scripts: 72
CollectionPage nodes: 72
Place nodes: 72
Graph nodes: 144
Baseline links: 72
Country or region links: 72
Visible address values: 72
```

Measured errors were zero for:

- canonical mismatch;
- page title, description, or language mismatch;
- visible place-name mismatch;
- missing alternate names;
- unexpected schema types;
- `SportsActivityLocation` claims;
- `sameAs` claims;
- unsafe less-than characters.

## Claims intentionally excluded

This unit does not add:

- `SportsActivityLocation` or another business classification;
- venue owner or operator identity;
- `sameAs` links;
- opening hours, offers, prices, access guarantees, or public-access flags;
- `Event` or `SportsEvent` nodes;
- racecards, participant data, horse names, jockeys, trainers, odds, results, payouts, predictions, or betting advice;
- hidden profile, candidate, private-note, or acquisition data.

## Privacy and automation boundary

The integration adds no visitor identifier, interaction logging, cookies, client storage, analytics, external schema service, automatic entity inference, content generation, publication, or deployment.

It is a deterministic transformation of reviewed static output.

## Validation

The permanent checker is:

```text
scripts/check-racecourse-page-metadata.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/racecourse-page-metadata.yml
```

The checker reconstructs all 36 bilingual pairs from rendered HTML, compares every JSON-LD field with visible content, validates the country or region relationship, rejects unsupported business, identity, event, and participant claims, preserves all previous SEO metadata units and the permanent racecourse bilingual QA chain, and proves that validation leaves the repository clean.

## Next implementation unit

```text
GLOSSARY-PAGE-METADATA-01
```

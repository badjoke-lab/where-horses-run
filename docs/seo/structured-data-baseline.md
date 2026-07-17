# Structured data baseline

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `STRUCTURED-DATA-BASELINE-01`  
Reviewed: 2026-07-18  
Scope updated by: `FAQ-CONTENT-PAGES-01`

## Purpose

Every public canonical page exposes one conservative JSON-LD baseline derived from its rendered title, description, canonical URL, and language.

## Current baseline inventory

```text
769 public pages
English pages: 386
Japanese pages: 383
Baseline JSON-LD scripts: 769
WebSite nodes: 769
WebPage nodes: 769
Baseline graph nodes: 1,538
```

Each marked baseline script contains exactly:

- one stable `WebSite` node for Where Horses Run / 競馬どこ？;
- one `WebPage` node matching the current page’s canonical, title, description, and language.

The shared implementation is `src/components/StructuredDataBaseline.astro`, delegated from `src/layouts/BaseLayout.astro`.

## Page-specific scripts

Page-specific structured data remains separate from the baseline. The bilingual FAQ pages add:

```text
FAQPage scripts: 2
FAQ Question nodes: 24
```

Those nodes are generated from the same visible question-and-answer arrays and are not duplicated inside the shared baseline graph.

The baseline itself does not infer Organization, Person, SearchAction, Event, SportsEvent, Place, Country, DefinedTerm, FAQPage, or BreadcrumbList entities.

## Serialization contract

- format: JSON-LD;
- context: `https://schema.org`;
- script marker: `data-structured-data-baseline="website-webpage-v1"`;
- one baseline script per public page;
- two baseline graph nodes per page;
- valid JSON required;
- literal less-than characters are escaped before insertion.

## Verification

Permanent checker:

```text
scripts/check-structured-data-baseline.mjs
```

Read-only Actions gate:

```text
.github/workflows/structured-data-baseline.yml
```

The checker scans all 769 sitemap pages, compares the baseline `WebPage` identity with rendered metadata, verifies the stable `WebSite` identity, and confirms that the two FAQ scripts remain separate.

## Boundaries

No unverified organization or event identity, participant dataset, betting or prediction claim, visitor identifier, analytics, cookie, client storage, external schema service, automatic inference, publication, or deployment is introduced.

Next implementation unit: `COUNTRY-PAGE-METADATA-01`.

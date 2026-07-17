# Structured data baseline

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `STRUCTURED-DATA-BASELINE-01`  
Reviewed: 2026-07-18  
Scope updated by: `METHODS-DATA-POLICY-01`

## Purpose

Every public canonical page exposes one conservative JSON-LD baseline derived from its rendered title, description, canonical URL, and language.

## Current baseline inventory

```text
771 public pages
English pages: 387
Japanese pages: 384
Baseline JSON-LD scripts: 771
WebSite nodes: 771
WebPage nodes: 771
Baseline graph nodes: 1,542
```

Each marked baseline script contains exactly one stable `WebSite` node and one `WebPage` node matching the current page’s canonical, title, description, and language.

## Page-specific scripts

Page-specific structured data remains separate from the baseline:

```text
FAQPage scripts: 2
FAQ Question nodes: 24
Methods page-specific scripts: 0
```

The Methods pages use the shared `WebPage` baseline only. The baseline itself does not infer Organization, Person, SearchAction, Event, SportsEvent, Place, Country, DefinedTerm, FAQPage, or BreadcrumbList entities.

## Serialization contract

- format: JSON-LD;
- context: `https://schema.org`;
- script marker: `data-structured-data-baseline="website-webpage-v1"`;
- one baseline script per public page;
- two baseline graph nodes per page;
- valid JSON required;
- literal less-than characters are escaped.

## Verification

Permanent checker: `scripts/check-structured-data-baseline.mjs`  
Read-only gate: `.github/workflows/structured-data-baseline.yml`

The checker scans all 771 sitemap pages, compares `WebPage` identity with rendered metadata, verifies the stable `WebSite` identity, confirms the two FAQ scripts remain separate, and confirms the Methods pair adds no unsupported page-specific schema.

## Boundaries

No unverified organization or event identity, participant dataset, betting or prediction claim, visitor identifier, analytics, cookie, client storage, external schema service, automatic inference, publication, or deployment is introduced.

Next implementation unit: `COUNTRY-PAGE-METADATA-01`.

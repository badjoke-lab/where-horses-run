# Structured data baseline

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `STRUCTURED-DATA-BASELINE-01`  
Reviewed: 2026-07-17

## Purpose

Every public canonical page now exposes one conservative JSON-LD baseline derived from metadata that already exists in the rendered page.

The baseline establishes stable site and page identities before country, racecourse, glossary, and other page-specific metadata are added in later Phase 11 units.

## Shared implementation

The baseline is rendered by:

```text
src/layouts/BaseLayout.astro
```

Every public page receives one script identified by:

```html
<script
  type="application/ld+json"
  data-structured-data-baseline="website-webpage-v1"
>
```

The JSON is serialized from static page metadata and escapes less-than characters before insertion into the script element.

## Graph contract

Each script uses:

```text
@context: https://schema.org
```

and contains exactly two graph nodes.

### WebSite

The stable site node is:

```text
@type: WebSite
@id: https://whr.badjoke-lab.com/#website
url: https://whr.badjoke-lab.com/
name: Where Horses Run
alternateName: 競馬どこ？
inLanguage: en, ja
```

The same site identity appears on every page.

### WebPage

Each page node uses:

```text
@type: WebPage
@id: {canonical-url}#webpage
url: existing canonical URL
name: existing page title
description: existing meta description
inLanguage: existing html lang
isPartOf: https://whr.badjoke-lab.com/#website
```

No new title, summary, language, or canonical source is introduced by the structured-data layer.

## Frozen scope

Discovery validated all 767 public pages currently present in the sitemap:

```text
English pages: 385
Japanese pages: 382
JSON-LD scripts: 767
Valid JSON scripts: 767
WebSite nodes: 767
WebPage nodes: 767
Total graph nodes: 1,534
```

Measured mismatches were all zero for:

- missing or duplicate scripts;
- invalid JSON;
- schema context;
- site IDs;
- page IDs;
- canonical URLs;
- page languages;
- missing names;
- missing descriptions;
- unexpected schema types.

## Claims intentionally excluded

This baseline does not publish:

- `Organization` or `Person` ownership claims;
- `SearchAction` claims for the client-side static search;
- `Event` or `SportsEvent` claims;
- `Place` or `Country` page-specific claims;
- `DefinedTerm` glossary claims;
- `BreadcrumbList` navigation claims.

Those types require page-specific contracts or additional reviewed facts. Country, racecourse, and glossary metadata are assigned to PR-123, PR-124, and PR-125 rather than inferred globally.

The anonymous project identity is not converted into an unverified organization entity.

## Public and privacy boundary

Allowed:

- public website identity;
- public page identity;
- existing canonical URL, title, description, and language.

Not allowed:

- unverified organization or event claims;
- page-specific entity inference in the shared baseline;
- participant dataset claims;
- betting or prediction claims;
- visitor identifiers, logging, cookies, storage, or analytics;
- external schema services;
- automatic entity inference, content generation, publication, or deployment.

## Validation

The permanent checker is:

```text
scripts/check-structured-data-baseline.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/structured-data-baseline.yml
```

The checker parses every public rendered HTML page, requires exactly one marked JSON-LD script and two graph nodes, compares the WebPage node with the page's canonical, title, description, and language, validates the stable WebSite node, rejects unsupported types, verifies script-safe serialization, and preserves both the Phase 10 release and sitemap contracts.

## Next implementation unit

```text
COUNTRY-PAGE-METADATA-01
```

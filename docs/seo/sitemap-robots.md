# Sitemap and robots

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `SITEMAP-ROBOTS-01`  
Reviewed: 2026-07-18  
Scope updated by: `FAQ-CONTENT-PAGES-01`

## Purpose

The production sitemap is generated from the completed static build. Rendered public HTML and its self-canonical link are the source of truth; a hand-written sitemap is not used.

## Current public inventory

```text
769 public canonical URLs
English URLs: 386
Japanese URLs: 383
Route families: 16
FAQ routes: 2
```

Major route totals:

```text
Countries: 198
Sources: 198
Meeting details: 158
Glossary: 100
Racecourses: 74
Racing types: 18
Major-country routes: 5
```

Detail-route totals:

```text
Country detail routes: 196
Source-country routes: 196
Meeting detail routes: 158
Glossary term routes: 96
Glossary relationship routes: 2
Racecourse detail routes: 72
Racing type detail routes: 16
FAQ content routes: 2
```

## Generation contract

`scripts/sitemap-robots-integration.mjs` runs at `astro:build:done` and:

- scans rendered HTML;
- excludes the rendered 404 page and any future `noindex` page;
- requires one same-origin HTTPS canonical without query or fragment;
- requires trailing-slash public paths;
- deduplicates and deterministically sorts URLs;
- writes `dist/sitemap.xml` and `dist/robots.txt`;
- uses no external sitemap service or package.

`robots.txt` allows public crawling and points to:

```text
https://whr.badjoke-lab.com/sitemap.xml
```

The FAQ routes `/faq/` and `/ja/faq/` are public, self-canonical, bilingual, and included in the generated sitemap.

## Verification

Permanent checker:

```text
scripts/check-sitemap-robots.mjs
```

Read-only Actions gate:

```text
.github/workflows/sitemap-robots.yml
```

The checker proves that the generated sitemap exactly matches the complete rendered canonical set and that duplicate, foreign-origin, query, fragment, non-HTTPS, missing-trailing-slash, 404, and noindex errors remain zero.

## Boundaries

No private, candidate, query-state, or automatically published routes are included. No crawler tracking, cookies, client storage, analytics, external sitemap service, or deployment action is introduced.

Next implementation unit: `STRUCTURED-DATA-BASELINE-01`.

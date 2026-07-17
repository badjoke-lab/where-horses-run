# Sitemap and robots

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `SITEMAP-ROBOTS-01`  
Reviewed: 2026-07-17

## Purpose

The production sitemap is now generated from the completed static build instead of maintained as a hand-written route list.

The former `public/sitemap.xml` contained only 14 manually selected URLs. It omitted most country, source, racecourse, glossary, racing-type, and meeting-detail pages and would become stale whenever a public route was added or removed.

The new build integration treats rendered public HTML and its canonical link as the source of truth.

## Build integration

The integration is:

```text
scripts/sitemap-robots-integration.mjs
```

It is registered in:

```text
astro.config.mjs
```

The integration runs during `astro:build:done` and scans the completed output directory. No sitemap package or external service is required.

For each rendered HTML file it:

1. excludes the rendered `404.html` page;
2. excludes any document with a robots `noindex` directive;
3. reads the canonical link;
4. requires the production origin `https://whr.badjoke-lab.com`;
5. rejects query parameters and fragments;
6. de-duplicates URLs;
7. sorts URLs deterministically by path;
8. writes the final `dist/sitemap.xml`;
9. writes the final `dist/robots.txt`.

A build fails rather than silently publishing an empty sitemap, a missing canonical, a foreign origin, or a canonical URL with query state.

## Frozen sitemap scope

Discovery measured 767 public canonical URLs:

```text
English URLs: 385
Japanese URLs: 382
```

Route-family counts are:

```text
Countries: 198
Sources: 198
Meeting details: 158
Glossary: 100
Racecourses: 74
Racing types: 18
Major-country routes: 5
Roots: 2
About: 2
Archive: 2
Calendar: 2
Disclaimer: 2
Search: 2
Today: 2
Tomorrow: 2
```

Detail-route counts include:

```text
Country detail routes: 196
Source-country routes: 196
Meeting-detail routes: 158
Glossary term routes: 96
Glossary relationship routes: 2
Racecourse detail routes: 72
Racing-type detail routes: 16
```

The English and Japanese counts differ by three because the current Major Countries legacy timetable, source-health, and retired-preview routes have no Japanese counterparts. They remain public canonical pages in this release and are therefore included. If a future page receives a `noindex` directive, the generator excludes it automatically.

## Sitemap output

The final sitemap uses:

```text
https://whr.badjoke-lab.com/sitemap.xml
```

Every entry:

- uses HTTPS;
- uses the production origin;
- contains no query or fragment;
- follows the site's trailing-slash contract;
- corresponds to a rendered non-404, non-`noindex` HTML canonical;
- appears only once.

The output uses the standard sitemap namespace:

```text
http://www.sitemaps.org/schemas/sitemap/0.9
```

## Robots output

The final robots file is:

```text
User-agent: *
Allow: /

Sitemap: https://whr.badjoke-lab.com/sitemap.xml
```

No `Disallow` directive is added. Publication and indexing boundaries remain controlled by which routes are publicly rendered and by page-level robots metadata when explicitly present.

The committed `public/robots.txt` remains as the static source copy. The build integration writes the same reviewed content into the final output to keep sitemap and robots generation under one release contract.

## Public and automation boundary

Allowed:

- public canonical routes;
- public `sitemap.xml`;
- public `robots.txt`.

Not allowed:

- query-state URLs;
- candidate or private routes;
- rendered 404 pages;
- `noindex` routes;
- automatic creation of routes or content;
- external sitemap services;
- deployment behavior.

The implementation adds no analytics, crawler-request logging, cookies, or client storage.

## Validation

The permanent checker is:

```text
scripts/check-sitemap-robots.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/sitemap-robots.yml
```

The checker rebuilds the rendered canonical set independently, compares it exactly with the generated sitemap, validates all 767 entries and route-family counts, checks robots content, confirms the manual public sitemap is absent, rejects external sitemap dependencies, confirms the temporary discovery workflow is removed, and preserves the completed Phase 10 release contract.

## Next implementation unit

```text
STRUCTURED-DATA-BASELINE-01
```

# Title and description normalization

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `TITLE-DESCRIPTION-NORMALIZATION-01`  
Reviewed: 2026-07-18  
Scope updated by: `FAQ-CONTENT-PAGES-01`

## Purpose

The complete public route set has a rendered title and description uniqueness contract. Measured duplicate metadata is corrected without imposing one arbitrary character limit across English and Japanese content.

## Current inventory

```text
Public pages: 769
English pages: 386
Japanese pages: 383
Meeting-detail pages: 158
Country-detail pages: 196
Normalized country descriptions: 4
FAQ pages: 2
Missing titles: 0
Missing descriptions: 0
Duplicate title groups: 0
Duplicate description groups: 0
```

## Meeting-detail normalization

The 79 English and 79 Japanese meeting-detail pages use visible racecourse name, meeting date, and page kind in their titles. Descriptions include the visible racecourse and date plus official-source and publication-policy context.

No race row, participant, odds, result, payout, prediction, or source-body content is added.

## Country duplicate resolution

The Algeria and Egypt descriptions in both languages preserve the reviewed hero summary and add the visible country name as a metadata prefix. Visible page body copy is unchanged by the normalizer.

## FAQ metadata

The two FAQ pages have distinct English and Japanese titles and descriptions:

```text
/faq/
/ja/faq/
```

Their title and description values remain aligned with Open Graph, Twitter, and baseline `WebPage` JSON-LD metadata.

## Length policy

No generic SEO character count is enforced. Reviewed long glossary definitions are not truncated, and concise Japanese titles are not padded with filler. Uniqueness, accuracy, clean whitespace, and metadata alignment are the enforced conditions.

## Implementation

Deterministic final-render transform:

```text
scripts/title-description-normalization-integration.mjs
```

Permanent checker:

```text
scripts/check-title-description-normalization.mjs
```

Read-only Actions gate:

```text
.github/workflows/title-description-normalization.yml
```

The checker scans all 769 sitemap pages and verifies one title and description, zero duplicates, clean whitespace, 158 date-specific meeting pages, four country-prefix resolutions, two unique FAQ pages, and Open Graph, Twitter, and JSON-LD alignment.

## Boundaries

The normalizer does not rewrite visible page body content, add racing facts, copy official-source text, create visitor identifiers, use analytics, cookies, client storage, external SEO or content-generation services, automatic translation, publication, or deployment.

Next implementation unit: `FAQ-CONTENT-PAGES-01`.

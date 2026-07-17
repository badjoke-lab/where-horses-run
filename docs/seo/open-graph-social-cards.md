# Open Graph social cards

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `OPEN-GRAPH-SOCIAL-CARDS-01`  
Reviewed: 2026-07-18  
Scope updated by: `FAQ-CONTENT-PAGES-01`

## Purpose

Every public page exposes complete Open Graph and Twitter preview metadata backed by one locally generated 1200×630 PNG.

## Current rendered scope

```text
Public pages: 769
Paired pages: 766
Unpaired pages: 3
FAQ pages: 2
Open Graph image references: 769
Open Graph locale alternates: 766
Twitter summary_large_image cards: 769
```

The FAQ pages reuse their rendered page title, description, canonical URL, language, localized image alt, and the same site-owned brand card as all other public pages.

## Generated image

```text
Public URL: https://whr.badjoke-lab.com/social/whr-social-card-v1.png
Format: PNG
Dimensions: 1200×630
Bit depth: 8
Color type: truecolor RGB
Bytes: 9,437
IDAT bytes: 9,380
SHA-256: 9e3c63e186f6681197b6e0cde8cdd3368e4d041b7f9dda79e33e940bd99861bd
```

`scripts/social-card-integration.mjs` generates the image deterministically using Node standard-library code, an embedded bitmap alphabet, and geometric drawing. It requires no external font, image service, browser renderer, or additional package.

## Metadata contract

Each public page has one value for:

- `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, and `og:locale`;
- `og:image`, secure URL, MIME type, width, height, and localized alt;
- `twitter:card`, title, description, image, and localized alt.

`og:locale:alternate` is emitted only on the 766 pages that have a verified localized counterpart. The three English-only legacy pages omit it.

## Verification

Permanent checker:

```text
scripts/check-open-graph-social-cards.mjs
```

Read-only Actions gate:

```text
.github/workflows/open-graph-social-cards.yml
```

The checker regenerates the PNG in memory, verifies byte equality and checksum, parses its PNG structure, and scans all 769 sitemap pages for complete and aligned Open Graph and Twitter metadata.

## Boundaries

No third-party source image, participant or racecard imagery, odds/result/prediction content, remote image tracking, visitor identifier, analytics, cookie, client storage, external generation service, automatic source-image selection, publication, or deployment is introduced.

Next implementation unit: `TITLE-DESCRIPTION-NORMALIZATION-01`.

# Open Graph social cards

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `OPEN-GRAPH-SOCIAL-CARDS-01`  
Reviewed: 2026-07-17

## Purpose

Every public page now exposes a complete, deterministic Open Graph and Twitter social-preview layer backed by one locally generated 1200×630 PNG.

The implementation reuses each page's existing title, description, canonical URL, and language. It does not select source-site images, publish racecard imagery, or call an external image-generation service.

## Social card image

The final public image is:

```text
https://whr.badjoke-lab.com/social/whr-social-card-v1.png
```

The build output is:

```text
dist/social/whr-social-card-v1.png
```

Frozen image properties:

```text
Format: PNG
Width: 1200
Height: 630
Bit depth: 8
Color type: 2 (truecolor RGB)
Bytes: 9,437
IDAT bytes: 9,380
SHA-256: 9e3c63e186f6681197b6e0cde8cdd3368e4d041b7f9dda79e33e940bd99861bd
```

The design is a neutral monochrome site card containing the `WHR` mark, the full English site name, a stylized racecourse oval, and the labels `CALENDARS`, `RACECOURSES`, and `SOURCES`.

It does not lock the site to an unreviewed horse illustration or reuse a third-party photograph.

## Deterministic generator

The generator is:

```text
scripts/social-card-integration.mjs
```

It is registered in:

```text
astro.config.mjs
```

The generator uses only Node standard-library modules:

- `node:fs/promises`;
- `node:path`;
- `node:zlib`;
- `node:url`.

It implements the required PNG chunks, CRC-32 checksums, RGB scanlines, a small embedded bitmap alphabet, and simple geometric drawing operations. No external font, image package, remote image API, or binary source asset is required.

The image is written during `astro:build:done`. Validation checks both the source generator and the resulting PNG checksum.

## Open Graph contract

Every one of the 767 public pages emits exactly one value for each required property:

```text
og:type
og:site_name
og:title
og:description
og:url
og:locale
og:image
og:image:secure_url
og:image:type
og:image:width
og:image:height
og:image:alt
```

Values are fixed as follows:

- `og:type`: `website`;
- `og:site_name`: `Where Horses Run`;
- title: existing rendered page title;
- description: existing rendered meta description;
- URL: existing rendered canonical URL;
- locale: `en_US` or `ja_JP` from the rendered page language;
- image and secure image: the generated absolute HTTPS URL;
- image type: `image/png`;
- image width and height: `1200` and `630`;
- image alt: localized English or Japanese text.

`og:locale:alternate` is emitted only on the 764 pages that have a verified localized counterpart. The three unpaired English pages omit it, preserving the localized-equivalence boundary established by `CANONICAL-HREFLANG-REVIEW-01`.

## Twitter contract

Every public page emits exactly one value for:

```text
twitter:card
twitter:title
twitter:description
twitter:image
twitter:image:alt
```

The card type is:

```text
summary_large_image
```

Title and description reuse the existing rendered values. The image URL and localized alt text match the Open Graph image.

## Localized image alternatives

English:

```text
Where Horses Run social card with a stylized racecourse oval.
```

Japanese:

```text
Where Horses Run / 競馬どこ？ のソーシャルカード。競馬場の楕円コースを図案化した画像。
```

The generated image itself is shared across locales. The accessible text is localized by page language.

## Frozen rendered scope

Discovery validated:

```text
Public pages: 767
Paired pages: 764
Unpaired pages: 3
Open Graph image references: 767
Open Graph locale alternates: 764
Twitter large-image cards: 767
Twitter image references: 767
Localized image-alt values: 2
Metadata errors: 0
```

Measured errors were zero for:

- duplicate required properties;
- title, description, canonical, or locale mismatch;
- false locale alternates;
- image URL, type, width, or height mismatch;
- localized image-alt mismatch;
- Twitter card, title, description, image, or alt mismatch.

## Public and privacy boundary

Allowed:

- reviewed page identity in social-preview metadata;
- one generated project card;
- localized accessible image text;
- locale alternates for verified page pairs.

Not allowed:

- participant, horse, jockey, trainer, racecard, odds, result, payout, prediction, or betting imagery;
- third-party official-source image republication;
- automatic source-image selection;
- remote image request tracking;
- visitor identifiers, logging, cookies, storage, or analytics;
- external image-generation services;
- automatic publication or deployment.

## Validation

The permanent checker is:

```text
scripts/check-open-graph-social-cards.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/open-graph-social-cards.yml
```

The checker regenerates the PNG in memory, verifies its checksum and structure, compares it with the built file, scans all 767 sitemap pages, validates every required Open Graph and Twitter property, preserves the canonical/hreflang and previous metadata contracts, and proves that validation leaves the repository clean.

## Next implementation unit

```text
TITLE-DESCRIPTION-NORMALIZATION-01
```

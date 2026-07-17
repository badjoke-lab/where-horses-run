# Title and description normalization

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `TITLE-DESCRIPTION-NORMALIZATION-01`  
Reviewed: 2026-07-18

## Purpose

The complete public route set now has a rendered title and description uniqueness contract.

This unit corrects measured duplicate metadata without imposing one arbitrary character limit across English and Japanese pages. Short Japanese navigation titles and longer glossary definitions remain valid when they are accurate, readable, and unique.

## Discovery result

The initial rendered audit covered all 767 sitemap pages.

It found:

```text
Public pages: 767
English pages: 385
Japanese pages: 382
Missing titles: 0
Missing descriptions: 0
Duplicate title-tag pages: 0
Duplicate description-meta pages: 0
Duplicate title groups: 36
Duplicate description groups: 4
Open Graph / Twitter / JSON-LD alignment errors: 0
Whitespace errors: 0
Newline errors: 0
```

The duplicate titles were limited to meeting-detail pages. Multiple dates at the same racecourse used the same racecourse-and-page-kind title.

The duplicate descriptions consisted of:

- one shared English meeting-detail description used by 79 pages;
- one shared Japanese meeting-detail description used by 79 pages;
- one English country-profile summary shared by Algeria and Egypt;
- one Japanese country-profile summary shared by Algeria and Egypt.

## Meeting-detail normalization

The 79 English and 79 Japanese meeting-detail pages now derive metadata from facts already visible on each page:

- racecourse name;
- meeting date;
- public page kind (`Race timetable`, `Programme summary`, `レース時刻表`, or `番組概要`).

English pattern:

```text
<Racecourse> — <YYYY-MM-DD> <Page kind> | Where Horses Run
```

Japanese pattern:

```text
<競馬場> — <YYYY-MM-DD> <ページ種別> | 競馬どこ？
```

Descriptions also include the visible racecourse name and date, official-source context, and the existing public-policy-controlled timetable boundary.

No race row, participant, odds, result, payout, prediction, or source-body content is added.

## Country-description normalization

Four country pages used a reviewed summary that was intentionally identical across Algeria and Egypt.

The underlying reviewed summary remains unchanged. The final metadata description gains the visible country or region name as a prefix:

```text
<Visible area name> — <Reviewed summary>
```

Affected routes:

```text
/countries/algeria/
/countries/egypt/
/ja/countries/algeria/
/ja/countries/egypt/
```

The visible hero summary is not rewritten.

## Metadata alignment

Whenever a normalized title or description is written, the same value is applied to:

- `<title>`;
- `<meta name="description">`;
- `og:title`;
- `og:description`;
- `twitter:title`;
- `twitter:description`;
- the baseline `WebPage` JSON-LD node;
- page-specific `CollectionPage` JSON-LD when present.

The final rendered audit reports zero alignment errors.

## Length policy

This unit does not treat a generic SEO character count as a publication rule.

The final measured ranges are:

```text
Titles, all pages: 10–76 characters
English titles: 15–76 characters
Japanese titles: 10–38 characters
Descriptions, all pages: 11–259 characters
English descriptions: 35–259 characters
Japanese descriptions: 11–101 characters
```

Long glossary definitions are not truncated automatically because they are reviewed public definitions. Short Japanese directory titles are not expanded with filler text merely to reach an English-oriented threshold.

Length outliers remain visible in audits, but uniqueness, accuracy, and metadata alignment are the enforced conditions.

## Implementation

The deterministic build transform is:

```text
scripts/title-description-normalization-integration.mjs
```

It runs after the page-specific JSON-LD and social-card integrations, reads the final rendered pages, and updates only the measured metadata fields.

The Astro page templates and visible body copy remain unchanged.

## Final result

```text
Public pages: 767
Duplicate title groups: 0
Duplicate description groups: 0
Missing titles: 0
Missing descriptions: 0
Open Graph title errors: 0
Open Graph description errors: 0
Twitter title errors: 0
Twitter description errors: 0
JSON-LD title errors: 0
JSON-LD description errors: 0
Whitespace errors: 0
Newline errors: 0
```

## Public and automation boundaries

This unit does not add:

- participant, horse, jockey, trainer, odds, result, payout, prediction, or betting data;
- copied official-source body text;
- visitor identifiers, analytics, cookies, or client storage;
- an external SEO service;
- automatic translation or content generation;
- automatic publication or deployment.

## Permanent verification

The permanent checker is:

```text
scripts/check-title-description-normalization.mjs
```

The read-only Actions gate is:

```text
.github/workflows/title-description-normalization.yml
```

The next roadmap implementation unit is `FAQ-CONTENT-PAGES-01`.

# Desktop layout improvement

Status: complete  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `DESKTOP-LAYOUT-IMPROVEMENT-01`  
Reviewed: 2026-07-17

## Purpose

The shared desktop shell now uses available width more predictably without changing the completed mobile navigation behavior.

The previous layout combined a flexible brand and a wrapping navigation inside one flex row, while general card lists used a fixed three-column grid. The fixed grid was acceptable at the widest size but produced narrow cards at intermediate desktop and tablet widths.

## Isolated desktop stylesheet

Desktop changes are contained in:

```text
src/styles/desktop-layout.css
```

The stylesheet is loaded after `mobile-navigation.css` and contains only media queries beginning at 721 pixels. It does not redefine the narrow-screen menu, toggle, list, or target-size rules.

## Shared header

At 721 pixels and above, the shared header uses two explicit grid columns:

```text
brand | navigation
```

The first column follows the intrinsic brand width. The second uses `minmax(0, 1fr)` so long bilingual navigation labels can shrink and wrap inside the available space rather than forcing the page wider.

At 960 pixels and above, the columns use a bounded brand share and a larger navigation share. The navigation list remains right-aligned.

## General card grids

The common `.section-grid` no longer relies on a fixed three-column desktop declaration.

Above 720 pixels it uses:

```text
repeat(auto-fit, minmax(min(100%, 17rem), 1fr))
```

This keeps cards readable across intermediate and wide desktop widths. Grid rows share equal height, cards stretch to fill their cells, and long URLs or identifiers can wrap instead of overflowing.

## Country grids

Country two-column and three-column variants also use `auto-fit`:

```text
country-grid--2: minimum 20rem
country-grid--3: minimum 16rem
```

The existing single-column mobile rules remain authoritative below 721 pixels.

## Reading rhythm

Desktop main-content spacing is increased without changing the 1120-pixel shared content maximum.

Hero summary text remains bounded to 58rem and receives a larger line height. At 960 pixels and above, heading width and summary size are adjusted modestly while card padding and section spacing become more consistent.

## Public and privacy boundary

The implementation changes only desktop presentation.

It adds no:

- layout telemetry;
- analytics;
- cookies;
- client storage;
- JavaScript layout dependency;
- external layout service;
- route or content changes;
- deployment behavior.

## Validation

The permanent checker is:

```text
scripts/check-desktop-layout-improvement.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/desktop-layout-improvement.yml
```

The gate builds the site, preserves all completed search, filter, glossary, and mobile navigation contracts, checks the isolated stylesheet and shared layout markers, verifies eight representative bilingual routes, rejects mobile overrides below 721 pixels, and proves the repository remains clean.

## Next implementation unit

```text
NO-JS-FALLBACK-REVIEW-01
```

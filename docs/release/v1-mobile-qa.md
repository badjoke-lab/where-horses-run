# Where Horses Run v1 mobile QA

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-MOBILE-QA-01`  
Reviewed: 2026-07-18

## Decision

The complete 771-page v1 candidate is browser-tested at 320, 375, and 720 CSS pixels. Every sitemap route is rendered at every width through a local static server and Chrome DevTools Protocol session.

```text
Public pages: 771
Viewports: 320 / 375 / 720 CSS px
Page-viewport checks: 2,313
Viewport height: 900 CSS px
Device scale factor: 1
```

The audit preserves the frozen v1 route and data scope. It changes responsive presentation only.

## Initial findings

The first complete browser pass found two material categories:

- page-level horizontal overflow on the legacy major-country timetable route at narrow widths;
- targets below 44 CSS pixels on country jump links, country disclosure summaries, meeting-detail back links, the legacy timetable navigation, and major-country browse summaries.

The browser diagnostics also identified table cells and nowrap descendants whose own scroll widths exceed their boxes. These are not page-level failures when the table is converted to a mobile block presentation or remains inside an explicit local scroll wrapper.

## Responsive corrections

The v1 mobile stylesheet now provides:

- 44-pixel minimum target dimensions for country jump links and disclosure summaries;
- 44-pixel minimum target dimensions for meeting-detail and legacy timetable navigation;
- 44-pixel minimum target dimensions for major-country browse summaries;
- `min-width: 0` and `max-width: 100%` across the major-country timetable grids and cards;
- `overflow-wrap: anywhere` for long status, source, and coverage text;
- explicit removal of the closed mobile navigation from layout;
- removal of the former 320-pixel body width floor;
- page-level horizontal containment on the main content while preserving explicit local table scrolling.

Files:

```text
src/styles/v1-mobile-qa.css
src/layouts/BaseLayout.astro
```

## Final required result

```text
Failed page loads: 0
Page-level horizontal overflow checks: 0
Pages with audited targets below 44px: 0
Small target instances: 0
Viewport meta errors: 0
Oversized visible image checks: 0
```

The target audit covers navigation links, disclosure summaries, buttons, visible form controls, explicit button roles, and card or button links. Ordinary inline content links are not converted into artificial 44-pixel blocks.

## Diagnostic inventory

```text
Pages containing tables: 176
Pages containing pre elements: 0
Pages containing code elements: 12
Pages containing forms: 10
```

Local table overflow is allowed only when it remains inside an explicit table-scroll region or the existing mobile table transformation. It must never produce page-level horizontal scrolling.

## Permanent verification

Browser runner:

```text
scripts/run-v1-mobile-qa-browser.mjs
```

Contract checker:

```text
scripts/check-v1-mobile-qa.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-mobile-qa.yml
```

The gate builds the complete static site, preserves Phase 10 UX, Phase 11 SEO, v1 Scope Freeze, and v1 Data Audit, renders all 2,313 page-width combinations, validates the report, uploads diagnostics, removes the temporary report, and proves the repository remains clean.

## Boundaries

This unit adds no route family, public data class, participant data, complete racecard, odds, results, payouts, predictions, betting advice, raw source body, analytics, cookies, client storage, automatic correction, automatic translation, automatic publication, or deployment.

## Next implementation unit

```text
V1-ACCESSIBILITY-QA-01
```

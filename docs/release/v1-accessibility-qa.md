# Where Horses Run v1 accessibility QA

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-ACCESSIBILITY-QA-01`  
Reviewed: 2026-07-18

## Decision

The complete 771-page v1 candidate has been audited in a real browser for baseline document semantics, accessible naming, keyboard entry, and reference integrity.

Every public sitemap route is served from a local static server and inspected through Chrome DevTools Protocol at 1280 by 900 CSS pixels.

```text
Public pages: 771
Browser DOM checks: 771
Failed page loads: 0
Pages with accessibility errors: 0
```

The audit preserves the frozen v1 route and data scope. No public content or feature family was added.

## Rules verified on every page

The permanent audit requires:

- a non-empty document title;
- an `html` language matching the English or Japanese route;
- exactly one `main` landmark with `id="main-content"`;
- exactly one skip link to `#main-content`;
- the skip link to be the first focusable element;
- exactly one `h1`;
- no heading-level jump greater than one level;
- no duplicate element IDs;
- all `aria-labelledby`, `aria-describedby`, and `aria-controls` references to resolve;
- every link to have an accessible name;
- every button, summary, and explicit button role to have an accessible name;
- every image to carry an `alt` attribute when images are present;
- every visible form control to have an explicit or wrapping label or an ARIA name;
- every `details` element to have a direct `summary` child;
- every table to contain header cells;
- every navigation landmark to have an accessible name;
- no nested interactive controls.

## Final measured result

```text
Title errors: 0
Language errors: 0
Main landmark errors: 0
Skip-link errors: 0
H1 errors: 0
Heading-jump instances: 0
Duplicate-ID instances: 0
Missing ARIA-reference instances: 0
Unnamed-link instances: 0
Unnamed-control instances: 0
Image-alt errors: 0
Form-label errors: 0
Details-summary errors: 0
Table-header errors: 0
Navigation-name errors: 0
Nested-interactive instances: 0
```

## Semantic inventory

```text
Images: 0
Visible form controls: 30
Details elements: 969
Tables: 180
Navigation landmarks: 1,127
```

The Source Policy review reduced the two Sources-directory forms from seven controls each to two controls each. Previous Visible form controls: 40. The current inventory is 30, and all controls remain labelled.

The performance review retired four obsolete browse disclosures from the legacy major-country timetable and added one named navigation landmark for the current public routes. The full accessibility audit still reports zero errors.

The zero image count reflects the rendered v1 page inventory. The social card is a generated crawler asset and is not embedded as an HTML content image.

## Existing foundations preserved

The audit confirms the shared `BaseLayout` already provides a correctly ordered skip link, named site and primary navigation, one main landmark, bilingual document language, and keyboard-reachable content.

Page templates already provide one H1, coherent heading order, named disclosures, labelled forms, table headings, unique IDs, and valid ARIA references. No source-level accessibility correction was required by this unit.

## Permanent verification

Browser runner:

```text
scripts/run-v1-accessibility-qa-browser.mjs
```

Contract checker:

```text
scripts/check-v1-accessibility-qa.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-accessibility-qa.yml
```

The gate builds all 771 pages, preserves Phase 10 UX, Phase 11 SEO, v1 Scope Freeze, v1 Data Audit, and v1 Mobile QA, executes the browser audit, validates the report against the frozen contract, uploads diagnostics, removes generated files, and proves the repository remains clean.

## Boundaries

This unit adds no route family, public data class, participant information, complete racecard, odds, results, payouts, predictions, betting advice, raw source body, analytics, cookies, client storage, automatic correction, automatic translation, automatic publication, or deployment action.

## Next implementation unit

```text
V1-PERFORMANCE-QA-01
```

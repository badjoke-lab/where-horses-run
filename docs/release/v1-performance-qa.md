# Where Horses Run v1 performance QA

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-PERFORMANCE-QA-01`  
Reviewed: 2026-07-18

## Decision

The complete 771-page static build has been measured with deterministic file and gzip calculations. The v1 performance gate does not depend on variable network timing.

```text
Public pages: 771
Rendered HTML pages: 771
Distribution files: 776
Distribution bytes: 10,453,195
Distribution gzip bytes: 2,437,594
HTML bytes: 10,367,299
HTML gzip bytes: 2,424,990
```

The audit preserves the frozen v1 route and data scope. The current measurement includes the Source Policy reduction of the bilingual Sources directories.

## Static-first result

The following figures are the historical 2026-07-18 v1 baseline:

```text
External runtime references: 0
Missing local references: 0
External JavaScript files: 0
Pages with script src references: 0
Shared CSS assets per page: 1
CSS bytes: 14,111
CSS gzip bytes: 2,875
```

Every page references the same generated CSS asset. At the historical v1 baseline, client-side discovery behavior remained inline and no third-party runtime was required.

## Google Analytics maintenance exception

On 2026-09-02, a bounded post-v1 maintenance exception was approved for site-usage measurement with Google Analytics 4.

```text
Measurement ID: G-79W3MF08Y9
Allowed external script: https://www.googletagmanager.com/gtag/js?id=G-79W3MF08Y9
Required coverage: every public page
Allowed external runtime references: exactly 1 per public page
Allowed script-src references: exactly 1 per public page
Additional aggregate gzip allowance: at most 100 bytes per public page
Additional inline bootstrap allowance: at most 160 bytes per public page
Other external runtime references: forbidden
```

This exception does not replace the historical v1 performance baseline. The permanent gate still rejects any other external runtime origin or URL, missing local asset, generated local JavaScript file, or unbounded analytics overhead. The GA4 bootstrap is kept intentionally small, and the existing page-size, CSS, element-count, and route-specific budgets continue to apply.

## Page distributions

```text
HTML bytes p50: 12,833
HTML bytes p95: 15,960
HTML bytes p99: 118,406
HTML bytes max: 291,083

HTML gzip bytes p50: 2,941
HTML gzip bytes p95: 4,104
HTML gzip bytes p99: 14,990
HTML gzip bytes max: 33,347

Element tags p50: 193
Element tags p95: 234
Element tags p99: 1,555
Element tags max: 5,187
```

The largest retained pages are the bilingual Current Timetable pages. They preserve the complete reviewed public list and remain below 300,000 raw bytes, 9,000 gzip bytes, and 5,300 element tags before any explicitly bounded current-maintenance allowance.

## Legacy timetable retirement

The old `/major-countries/timetable/` page rendered a large static/manual timetable with bulk race-level rows. It duplicated the current Calendar and Current Timetable routes and did not follow the v1 list-page boundary.

The route remains available, but now contains a lightweight retirement notice and links to Calendar, Today, Tomorrow, Current Timetable, and Countries.

```text
HTML bytes before: 496,330
HTML bytes after: 8,213
HTML bytes reduced: 488,117

Element tags before: 9,001
Element tags after: 93
Element tags reduced: 8,908

Distribution bytes before: 11,060,613
Historical post-retirement Distribution bytes: 10,572,496
Distribution bytes reduced by retirement: 488,117
```

No public route was removed.

## Source Policy reduction

The Source Policy review removed operational source metadata from the public directory projection and reduced the form from seven filters to keyword and country.

```text
Sources EN: 134,579 bytes / 19,219 gzip / 2,075 tags
Sources JA: 138,688 bytes / 20,003 gzip / 2,075 tags
Current distribution reduction from the previous performance baseline: 119,301 bytes
Current distribution gzip reduction: 3,908 bytes
```

Official links, public notes, 171 records per locale, and the complete no-JavaScript list remain available.

## Key page measurements

```text
Current timetable EN: 287,440 bytes / 7,638 gzip / 5,187 tags
Current timetable JA: 291,083 bytes / 8,183 gzip / 5,187 tags
Search EN: 153,217 bytes / 33,347 gzip / 1,552 tags
Search JA: 154,831 bytes / 32,043 gzip / 1,552 tags
Sources EN: 134,579 bytes / 19,219 gzip / 2,075 tags
Sources JA: 138,688 bytes / 20,003 gzip / 2,075 tags
Legacy timetable notice: 8,213 bytes / 2,245 gzip / 93 tags
```

## Regression budgets

The historical v1 budgets remain the base of the permanent gate:

- total distribution no larger than 11,000,000 raw bytes or 2,500,000 gzip bytes before page-count scaling and explicit maintenance allowances;
- total HTML no larger than 10,900,000 raw bytes or 2,500,000 gzip bytes before page-count scaling and explicit maintenance allowances;
- no page larger than 300,000 raw bytes, 35,000 gzip bytes, or 5,300 element tags, except the separately inventory-bounded Current Timetable raw-size maintenance rule;
- p95 page HTML no larger than 17,000 raw bytes, 4,500 gzip bytes, or 250 element tags;
- one CSS file no larger than 16,000 raw bytes or 3,200 gzip bytes;
- no generated local JavaScript file;
- exactly one approved GA4 script-src/external-runtime reference per public page and no other external runtime dependency;
- no missing local asset;
- no more than one local asset reference per page;
- inline script maximum 6,000 bytes and p95 2,300 bytes, plus only the bounded GA4 bootstrap allowance;
- inline style maximum 2,700 bytes;
- route-specific limits for the retired timetable, Current Timetable, Search, and Sources pages, plus only the bounded GA4 gzip allowance.

## Permanent verification

Runner:

```text
scripts/run-v1-performance-qa.mjs
```

Contract checker:

```text
scripts/check-v1-performance-qa.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-performance-qa.yml
```

The gate builds the complete site, preserves Phase 10 UX, Phase 11 SEO, v1 Scope Freeze, v1 Data Audit, v1 Mobile QA, and v1 Accessibility QA contracts, measures the complete distribution, validates all budgets and the exact GA4 exception, uploads diagnostics, removes generated files, and proves the repository remains clean.

## Boundaries

The 2026-07-18 v1 performance unit itself added no route family or public data class and added no participant data, complete racecard, odds, results, payouts, predictions, betting advice, raw source body, analytics, cookies, client storage, automatic reduction, automatic translation, automatic publication, or deployment action. The GA4 instrumentation documented above is a later, explicit current-maintenance exception and does not rewrite that historical audit evidence.

## Next implementation unit

```text
V1-SOURCE-POLICY-REVIEW-01
```

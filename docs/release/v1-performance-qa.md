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
Distribution bytes: 10,572,496
Distribution gzip bytes: 2,441,502
```

The audit preserves the frozen v1 route and data scope.

## Static-first result

```text
External runtime references: 0
Missing local references: 0
External JavaScript files: 0
Pages with script src references: 0
Shared CSS assets per page: 1
CSS bytes: 14,111
CSS gzip bytes: 2,875
```

Every page references the same generated CSS asset. Client-side discovery behavior remains inline and no third-party runtime is required.

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

The largest retained pages are the bilingual Current Timetable pages. They preserve the complete reviewed public list and remain below 300,000 raw bytes, 9,000 gzip bytes, and 5,300 element tags.

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
Distribution bytes after: 10,572,496
Distribution bytes reduced: 488,117
```

No public route was removed.

## Key page measurements

```text
Current timetable EN: 287,440 bytes / 7,638 gzip / 5,187 tags
Current timetable JA: 291,083 bytes / 8,183 gzip / 5,187 tags
Search EN: 153,217 bytes / 33,347 gzip / 1,552 tags
Search JA: 154,831 bytes / 32,043 gzip / 1,552 tags
Sources EN: 190,587 bytes / 20,585 gzip / 3,132 tags
Sources JA: 199,587 bytes / 21,600 gzip / 3,132 tags
Legacy timetable notice: 8,213 bytes / 2,245 gzip / 93 tags
```

## Regression budgets

The permanent gate enforces:

- total distribution no larger than 11,000,000 raw bytes or 2,500,000 gzip bytes;
- total HTML no larger than 10,900,000 raw bytes or 2,500,000 gzip bytes;
- no page larger than 300,000 raw bytes, 35,000 gzip bytes, or 5,300 element tags;
- p95 page HTML no larger than 17,000 raw bytes, 4,500 gzip bytes, or 250 element tags;
- one CSS file no larger than 16,000 raw bytes or 3,200 gzip bytes;
- no external JavaScript file or script-src reference;
- no external runtime dependency or missing local asset;
- no more than one local asset reference per page;
- inline script maximum 6,000 bytes and p95 2,300 bytes;
- inline style maximum 2,700 bytes;
- route-specific limits for the retired timetable, Current Timetable, Search, and Sources pages.

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

The gate builds the complete site, preserves Phase 10 UX, Phase 11 SEO, v1 Scope Freeze, v1 Data Audit, v1 Mobile QA, and v1 Accessibility QA contracts, measures the complete distribution, validates all budgets, uploads diagnostics, removes generated files, and proves the repository remains clean.

## Boundaries

This unit adds no route family or public data class. It adds no participant data, complete racecard, odds, results, payouts, predictions, betting advice, raw source body, analytics, cookies, client storage, automatic reduction, automatic translation, automatic publication, or deployment action.

## Next implementation unit

```text
V1-SOURCE-POLICY-REVIEW-01
```

# Phase 11 SEO QA release

Status: release ready  
Release ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `SEO-QA-RELEASE-01`  
Reviewed: 2026-07-18

## Release decision

Phase 11 is accepted as one reviewed SEO and public-content release.

The release combines generated sitemap and robots output, conservative shared JSON-LD, page-specific country, racecourse, and glossary metadata, bilingual canonical and hreflang review, deterministic social metadata, title and description normalization, public FAQ pages, and public Methods and Data Policy pages.

No new racing records, participant datasets, complete racecards, betting content, or automatic publication are introduced by this release unit.

## Completed implementation units

```text
SITEMAP-ROBOTS-01
STRUCTURED-DATA-BASELINE-01
COUNTRY-PAGE-METADATA-01
RACECOURSE-PAGE-METADATA-01
GLOSSARY-PAGE-METADATA-01
CANONICAL-HREFLANG-REVIEW-01
OPEN-GRAPH-SOCIAL-CARDS-01
TITLE-DESCRIPTION-NORMALIZATION-01
FAQ-CONTENT-PAGES-01
METHODS-DATA-POLICY-01
SEO-QA-RELEASE-01
```

The release contains ten underlying Phase 11 implementation units plus the aggregate Release unit.

## Frozen public inventory

```text
Public pages: 771
English pages: 387
Japanese pages: 384
Sitemap URLs: 771
Canonical links: 771
Paired pages: 768
Bilingual clusters: 384
Unpaired pages: 3
Hreflang links: 2,304
Baseline JSON-LD scripts: 771
WebSite nodes: 771
WebPage nodes: 771
Country metadata routes: 196
Racecourse metadata routes: 72
Glossary metadata routes: 96
FAQ pages: 2
FAQ visible questions: 24
FAQ structured questions: 24
Methods pages: 2
Methods visible sections: 18
Methods visible paragraphs: 36
Social-card images: 1
```

The deterministic social-card PNG remains:

```text
SHA-256: 9e3c63e186f6681197b6e0cde8cdd3368e4d041b7f9dda79e33e940bd99861bd
Dimensions: 1200×630
```

## Cross-contract release rules

The release requires:

- the sitemap URL set to match the complete rendered canonical set;
- one shared WebSite and WebPage baseline on every public page;
- all country, racecourse, and glossary page-specific metadata contracts to remain complete;
- all real English and Japanese counterparts to retain reciprocal `en`, `ja`, and `x-default` metadata;
- Open Graph and Twitter values to remain aligned with rendered page metadata;
- titles and descriptions to remain non-empty, unique, clean, and aligned;
- visible FAQ questions and answers to match their page-specific structured data;
- Methods content to retain its reviewed public-policy sections and publication boundaries;
- all temporary Phase 11 discovery workflows to be absent;
- every underlying checker to pass on the same complete static build;
- the release workflow to leave the repository clean.

## Checker chain

The read-only release gate first preserves the completed Phase 10 UX release, then runs every permanent Phase 11 checker in order:

```text
Phase 10 UX polish release
Sitemap and robots
Structured data baseline
Country page metadata
Racecourse page metadata
Glossary page metadata
Canonical and hreflang review
Open Graph social cards
Title and description normalization
FAQ content pages
Methods and data policy
SEO QA release
```

The aggregate checker is:

```text
scripts/check-seo-qa-release.mjs
```

The read-only Actions gate is:

```text
.github/workflows/seo-qa-release.yml
```

## Public boundary

Allowed:

- official-source priority;
- reviewed public metadata;
- verified bilingual public content;
- public explanation of data scope, update policy, publication ranks, and limitations.

Not allowed:

- participant datasets or complete racecards;
- odds, results, payouts, predictions, or betting advice;
- copied official-source bodies;
- revenue, budget, other-project, or internal-circumstance discussion;
- visitor identifiers, interaction logging, cookies, client storage, or analytics;
- external SEO services, automatic content generation, automatic translation, scheduled release, publication, or deployment.

## Phase 11 outcome

The release satisfies the roadmap objective:

```text
Search and crawler entry points are complete.
Public pages have stable and conservative metadata.
English and Japanese counterparts are correctly related.
Public FAQ and Methods content explain scope and limitations.
The full SEO and public-content layer is protected by one read-only release gate.
```

## Next implementation unit

```text
V1-SCOPE-FREEZE-01
```

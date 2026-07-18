# Methods and data policy pages

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `METHODS-DATA-POLICY-01`  
Reviewed: 2026-07-18

## Purpose

Where Horses Run now has bilingual public methods pages explaining how information is reviewed, interpreted, published, corrected, reduced, and limited.

The pages describe public methodology without exposing revenue, budget, other-project relationships, internal circumstances, or source-specific internal risk posture.

## Public routes

```text
/methods/
/ja/methods/
```

The two routes are public, self-canonical, reciprocal English/Japanese alternates, included in the 771-URL sitemap, and linked from the corresponding About pages.

## Visible content

Each page contains nine sections and eighteen paragraphs:

1. core principle;
2. official and reference source roles;
3. review before publication;
4. dates, local times, and timezones;
5. Today, Tomorrow, Calendar, and Current Timetable views;
6. C, B, B+, A, and A+ publication ranks;
7. the meaning of Last checked and update timing;
8. corrections, reduction, and removal;
9. excluded information and limitations.

The English and Japanese pages cover the same topics. Both pages link to About, FAQ, Disclaimer, and Official Sources.

## Public inventory

```text
Public pages: 771
English pages: 387
Japanese pages: 384
Paired pages: 768
Bilingual clusters: 384
Hreflang links: 2,304
Methods pages: 2
Visible sections: 18
Visible paragraphs: 36
```

## Public methodology boundary

The pages may explain:

- official-source priority;
- the limited role of reference sources;
- public review flow;
- local dates, times, and timezones;
- generated calendar views;
- publication ranks;
- last-checked meaning;
- correction, reduction, and removal;
- excluded content and limitations.

They do not expose:

- revenue or monetization purpose;
- budget or cost constraints;
- relationships to other projects;
- internal operating circumstances;
- source-specific internal risk posture;
- participant or complete racecard datasets;
- betting advice.

## Verification

Permanent checker:

```text
scripts/check-methods-data-policy.mjs
```

Read-only Actions gate:

```text
.github/workflows/methods-data-policy.yml
```

The gate builds the complete site, preserves the Phase 11 SEO chain, verifies all 18 visible sections and 36 paragraphs, checks the bilingual cluster and navigation, and proves the repository remains clean.

No visitor identifier, interaction logging, analytics, cookie, client storage, external content service, automatic policy generation, automatic translation, publication, or deployment is introduced.

Next implementation unit: `SEO-QA-RELEASE-01`.

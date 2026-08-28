# Racecourse pages — 2026-08-09 current-state addendum

Status: superseded historical racecourse-page addendum  
Superseded by: `docs/racecourses/current-state-2026-08-28-addendum.md`  
Base Work ID: `WHR-RACECOURSE-PAGES-V1`  
Current source-expansion Work ID at snapshot: `WHR-CAL-SOUTH-KOREA-KRA`

## Purpose

The Racecourse Pages v1 implementation documents preserve reviewed release evidence from the 36-racecourse / 72-bilingual-page release state. They are historical implementation snapshots for those units, not a permanent size ceiling.

This addendum records the growth rule and project state at the 2026-08-09 snapshot. It is retained for traceability and no longer controls the current racecourse-page count.

## Current state at the 2026-08-09 snapshot

After the reviewed Mizusawa identity addition:

```text
canonical racecourse identities: 37
English racecourse detail routes: 37
Japanese racecourse detail routes: 37
bilingual racecourse detail routes: 74
```

The historical v1 evidence remains:

```text
canonical racecourse identities at release: 36
bilingual racecourse detail routes at release: 72
```

Validators may use historical values as audit evidence but must derive current expected racecourse/page counts from current canonical registries rather than treating 36/72 or this 37/74 snapshot as a growth prohibition.

## Identity-only rule

A reviewed public timetable racecourse may be registered as identity-only when meeting identity is supported but profile facts are not.

Identity-only registration may include only reviewed facts such as:

- stable racecourse ID and slug;
- reviewed English/local/Japanese names where supported;
- country;
- timezone when supported by the authority/system contract;
- reviewed official source links;
- explicit identity/profile evidence status.

It must **not** invent city, region, street address, surface, direction, dimensions, distance profile, course layout, notable races, or other profile facts merely to make the page appear complete.

Missing facts remain null/unknown and the rendered page must tolerate that state.

## Timetable/public-display rule

Racecourse pages consume the reviewed public timetable projection. They do not consume internal Review Queue, Retry Queue, raw-source, reviewer, attempt-history, or operator state.

Summary surfaces may show only fields permitted by the effective reviewed public rank. A+ race-level detail belongs to the meeting-detail surface, not to a racecourse summary panel.

Prohibited public data remains excluded, including participants, horse/jockey/trainer data, draw, weights, odds, results, payouts, predictions, raw source bodies, and stream URLs.

## South Korea next gate at the snapshot

PR #568 generated reviewed Rank C candidates for:

- Seoul;
- Busan-Gyeongnam;
- Jeju.

The next KRA promotion unit at that snapshot was required to:

1. confirm Seoul identity compatibility;
2. register/review Busan-Gyeongnam and Jeju public timetable identities before promotion;
3. permit identity-only records where profile evidence is absent;
4. run identity reconciliation and public-timetable connection gates;
5. derive current racecourse/page/sitemap expectations from canonical registries;
6. keep the 32 KRA candidates at Rank C unless a separate reviewed evidence unit supported a higher rank.

No meeting may be promoted when its racecourse identity cannot resolve to the canonical bilingual page model.

## Page-link rule

Implemented page-link behavior is governed by `docs/racecourses/page-link-architecture.md` and its validator. The early `docs/specs/page-link-architecture.md` remains a design foundation only.

Every newly reviewed racecourse identity must preserve:

```text
country <-> racecourse
racecourse <-> Calendar/public meeting state
meeting detail -> racecourse
EN <-> JA language pair
racecourse -> reviewed official source
```

where the applicable linked public route exists.

## Historical required reading

This section records the required-reading set used by this snapshot. Current work must use the latest adopted racecourse current-state addendum instead of treating this file as active authority.

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap-2026-08-09-addendum.md`;
3. `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`;
4. `docs/racecourses/identity-reconciliation.md`;
5. `docs/racecourses/public-timetable-connection.md`;
6. `docs/racecourses/profile-evidence.md`;
7. `docs/racecourses/page-link-architecture.md`;
8. this historical addendum;
9. applicable Authority Source Inventory / Source Test / Calendar Readiness records;
10. current validators and deployment/CI policy.

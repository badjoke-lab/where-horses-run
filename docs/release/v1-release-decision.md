# Where Horses Run v1 release decision

Release ID: `WHR-V1`  
Preparation release ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-RELEASE-DECISION-01`  
Decision date: 2026-07-19  
Status: complete

## Decision

Where Horses Run v1 is accepted for reviewed static public release.

The accepted release is a bilingual, static-first guide built from reviewed public data. It helps visitors find horse-racing countries and regions, racecourses, racing types, calendars, timetable information, glossary explanations, and official-source links.

This decision accepts the frozen 771-page candidate prepared by `V1-RELEASE-READINESS-01`. It does not expand the route families, public data classes, participant-data boundary, or publication model.

## Accepted candidate

- public pages: 771;
- English pages: 387;
- Japanese pages: 384;
- route families: 17;
- official-source records: 171;
- countries and regions with sources: 98;
- racecourse records: 36;
- mobile page-viewport checks: 2,313;
- accessibility page checks: 771;
- performance-measured pages: 771;
- known-limitation categories: 12.

The accepted baseline commit is `57da4a73d0646603eb59e3f5faff9ceaf5a3213e`, which completed the release-readiness aggregation before this decision unit.

## Evidence accepted

The decision relies on the completed sequence:

1. `V1-SCOPE-FREEZE-01`;
2. `V1-DATA-AUDIT-01`;
3. `V1-MOBILE-QA-01`;
4. `V1-ACCESSIBILITY-QA-01`;
5. `V1-PERFORMANCE-QA-01`;
6. `V1-SOURCE-POLICY-REVIEW-01`;
7. `V1-KNOWN-LIMITATIONS-01`;
8. `V1-RELEASE-READINESS-01`.

Every required zero-error boundary remains zero. The complete static build, sitemap inventory, source registry, release notes, performance budgets, and repository-clean proof remain required by the permanent gate.

## Accepted operating model

The v1 operating model is:

```text
reviewed public data
-> deterministic static build
-> human-reviewed merge
-> production deployment from main
```

Ordinary coverage may remain incremental and partial. A complete month, season, country, or global coverage claim requires an explicit Completion Audit. The linked official source remains the final authority for current and complete information.

Unattended publication remains disabled. Candidate generation, source collection, review queues, retry queues, and internal operational state do not become public records without human review and an explicit publication step.

## Deployment decision

Production deployment is authorized when this decision is merged to `main`, following the repository Deployment and CI policy.

The release-decision gate itself remains read-only. It does not deploy, create a tag, create a GitHub Release, write canonical data, or mutate public datasets. Production confirmation must be performed after the merge through the platform or rendered site.

A `v1.0.0` tag is recommended for repository history, but tag creation is not a condition of accepting the reviewed static public release.

## Public boundary

The accepted v1 release does not publish:

- entries or complete racecards;
- horse, jockey, trainer, draw, weight, body-weight, or other participant fields;
- odds, popularity, results, payouts, predictions, selections, or betting advice;
- copied official-source page bodies or raw HTML;
- embedded video, direct stream URLs, unofficial mirrors, or redistributed recordings;
- user accounts, submissions, personalization, public write APIs, ticketing, wagering, payments, or other transactions;
- automatic translation, unreviewed generation, or unattended publication.

## Non-claims

The release does not claim:

- complete global racing coverage;
- complete detail coverage for every meeting;
- real-time or guaranteed-current information;
- automatic source freshness;
- automatic approval or publication;
- guaranteed viewing access.

## Privacy

The v1 release adds no visitor identifiers, interaction logging, query logging, analytics, cookies, or client storage.

## Next stage

The next stage is reviewed incremental maintenance. Corrections, removal of stale or unsupported information, source-link maintenance, accessibility and performance protection, and reviewed timetable updates remain allowed inside the accepted v1 scope. Any new route family, public data class, user feature, transactional feature, or publication mode requires a separate scope decision.

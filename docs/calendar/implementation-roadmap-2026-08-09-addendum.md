# Calendar implementation roadmap — 2026-08-09 active addendum

Status: active canonical Calendar programme addendum  
Adopted: 2026-08-09  
Base roadmap: `docs/calendar/implementation-roadmap.md`  
Current Work ID: `WHR-CAL-SOUTH-KOREA-KRA`

This addendum updates the active Calendar execution state after the reviewed August rolling-horizon recovery and the first South Korea implementation unit. Historical stage text and release-gate markers in the base roadmap remain preserved as historical evidence.

## Current operational baseline

PR #567 completed the reviewed rolling-horizon recovery through 2026-09-06 and restored the current public Calendar after publication review had fallen behind acquisition evidence.

Accepted current state:

```text
public horizon end: 2026-09-06
reviewed recovery additions: 96 Rank C meetings
JRA recovery: 18
NAR recovery: 69
Banei recovery: 8
HKJC recovery/wake-up: 1 Sha Tin meeting on 2026-09-06
stable review queue: Draft PR #559
unattended publication: disabled
```

The daily planner now supports a future reviewed active season window beginning inside an otherwise offseason rolling horizon. This is required for the HKJC 2026-09-06 wake-up case.

Mizusawa was added as a reviewed public timetable identity-only racecourse. Current racecourse growth must be treated as valid reviewed growth rather than as a violation of historical 36/72/771 v1 snapshots.

## Stage 13 — daily rolling-horizon recovery and acceptance

Work ID: `WHR-CAL-DAILY-ACQUISITION`

### DA-08 — reviewed Canonical/public recovery

Status: complete.

Completed evidence:

- PR #567 merged through the normal reviewed path;
- Canonical/public projection contains the reviewed recovery through 2026-09-06;
- bilingual/rendered and repository validation passed;
- normal production deployment completed;
- production freshness was verified after merge;
- historical v1 audits remain historical snapshots while current route/racecourse counts may grow through reviewed additions.

### DA-09 — steady-state acceptance

Status: active operating acceptance; daily workflow remains human-review-bound.

The permanent acceptance rule is:

```text
successful acquisition != completed maintenance cycle
```

A cycle remains actionable when the committed public horizon is stale or `publication_review_required=true`.

Draft PR #559 remains the stable human-review queue. It is never a publication PR and must not be merged merely because scheduled acquisition updates it.

## Stage 14 — South Korea / KRA

Current Work ID: `WHR-CAL-SOUTH-KOREA-KRA`

### KRA-RANK-C-CANDIDATE-GENERATION-01

Status: complete in PR #568.

Implemented:

- reviewed KRA 2026 operating-plan snapshot for 2026-08-07 through 2026-09-06;
- deterministic candidate adapter;
- 32 meeting identities at Rank C only;
- Seoul 11 / Busan-Gyeongnam 10 / Jeju 11;
- race times `null`;
- timetable rows empty;
- dedicated safety checker and CI gate;
- no automatic approval, Canonical write, public projection, merge, or deployment.

### KRA-PUBLIC-IDENTITY-PROMOTION-01

Status: current.

Required order:

1. review/register Busan-Gyeongnam public timetable identity;
2. review/register Jeju public timetable identity;
3. reconcile Seoul/Busan-Gyeongnam/Jeju against canonical racecourse identity and page-link requirements;
4. validate all 32 candidate meeting identities;
5. prepare a separate human-reviewed approved candidate/promotion unit;
6. run Promotion Validation;
7. apply Canonical/public projection only inside that reviewed unit;
8. run current-horizon, racecourse-connection, bilingual rendered, SEO/metadata, and deployment gates;
9. verify production freshness after reviewed merge.

Public ceiling for this unit is intentionally Rank C even though the reviewed Authority Source Inventory records higher technical KRA capability. Capability does not authorize publication of unsupported or unreviewed detail.

## Stage 15 — Turkey / TJK

Next Work ID: `WHR-CAL-TURKEY-TJK`

Current inventory state:

```text
authority: Türkiye Jokey Kulübü
source status: verified
technical capability: A+
adapter candidate status: candidate
reviewed note public cap: A
```

Because the inventory observation predates this addendum, first revalidate the current official programme/source behavior under Source Test v2. Then define the smallest safe source-specific adapter/candidate unit under the shared Acquisition Control Plane.

No TJK source capability may bypass Batch Validation, human review, Promotion Validation, Public Ceiling, or the prohibited-data boundary.

## Stage 16 — Morocco / SOREC source revalidation

Conditional Work ID: `WHR-CAL-MOROCCO-SOREC-REVALIDATION`

Current inventory state is blocked:

```text
source status: not_verified
adapter candidate status: blocked
known stable public meeting/timetable route: not confirmed
```

Therefore this stage is a source/research gate only until evidence changes.

If a stable official public timetable route is confirmed, update Source Test v2 / Readiness / Authority Source Inventory before defining candidates. If the source remains blocked, retain the blocked state and move to the next reviewed source-ready expansion candidate.

## Stage 17 — coverage and racecourse integration

After each source-system promotion:

- reconcile country coverage state;
- reconcile season/freshness/source state;
- register only reviewed racecourse identities;
- permit identity-only pages when profile facts are not verified;
- connect public meetings to racecourse pages;
- update current counts without rewriting historical release snapshots;
- run page-link, metadata, structured-data, bilingual, and sitemap gates.

Unknown city, region, address, surface, direction, course, distance, or other profile facts remain unknown. They must not be inferred solely to satisfy page completeness.

## Stage 18 — source-specific rank upgrades

Breadth and freshness come before aggressive detail publication.

Individual reviewed meetings may rise monotonically through:

```text
C < B < B+ < A < A+
```

A+ race-level detail is limited to meeting-detail pages. Calendar lists and racecourse summary surfaces remain summary-safe. Technical source capability alone never raises an individual public meeting rank.

## Stage 19 — steady-state multi-system expansion

The preferred automation stop point remains:

```text
automatic planning/acquisition
-> automatic public-safe normalization and validation
-> automatic review artifact preparation
-> HUMAN REVIEW REQUIRED
-> separate reviewed promotion/publication
```

Expansion priority is selected from current reviewed evidence using source stability, racecourse identity resolution, timetable depth, maintenance cost, publication safety, season timing, and user value.

## Required reading for subsequent source expansion

Every source-expansion PR must review:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md` and its active 2026-08-09 addendum;
3. `docs/calendar/implementation-roadmap.md` and this addendum;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/validation-responsibility-contract.md`;
6. `docs/calendar/acquisition-control-plane-contract.md`;
7. the applicable Source Test v2 / Readiness / Authority Source Inventory records;
8. applicable public-display and racecourse contracts;
9. `docs/operations/deployment-and-ci-policy.md`.

The same PR updates the applicable active roadmap/addendum, source implementation status, tracker/registry, contract, and validator when their current state or rule changes.

# Calendar implementation roadmap — 2026-08-09 active addendum

Status: active canonical Calendar programme addendum  
Adopted: 2026-08-09  
Current execution state reviewed: 2026-08-11  
Base roadmap: `docs/calendar/implementation-roadmap.md`  
Current Work ID: `WHR-CAL-TURKEY-TJK`

This addendum updates the active Calendar execution state after the reviewed KRA Rank C publication and the current TJK source revalidation. Historical stage text and release-gate markers in the base roadmap remain preserved as historical evidence.

## Current operational baseline

PR #567 completed the reviewed rolling-horizon recovery through 2026-09-06 and restored the current public Calendar after publication review had fallen behind acquisition evidence.

PR #572 subsequently added the reviewed KRA Rank C publication unit. Accepted current state:

```text
public horizon end: 2026-09-06
public meetings: 369
KRA reviewed publication: 32 Rank C meetings
KRA race-detail rows: 0
KRA identity-only additions: Busan-Gyeongnam, Jeju
stable review queue: Draft PR #559
unattended publication: disabled
```

The daily planner continues to support a future reviewed active season window beginning inside an otherwise offseason rolling horizon, including the HKJC 2026-09-06 wake-up case.

Mizusawa, Busan-Gyeongnam, and Jeju are reviewed public timetable identity-only racecourse additions. Current racecourse growth must be treated as valid reviewed growth rather than as a violation of historical 36/72/771 v1 snapshots.

## Stage 13 — daily rolling-horizon recovery and acceptance

Work ID: `WHR-CAL-DAILY-ACQUISITION`

### DA-08 — reviewed Canonical/public recovery

Status: complete.

Completed evidence:

- PR #567 merged through the normal reviewed path;
- Canonical/public projection contains the reviewed recovery through 2026-09-06;
- bilingual/rendered and repository validation passed;
- normal production deployment completed for that recovery unit;
- production freshness was verified after that recovery merge;
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

Work ID: `WHR-CAL-SOUTH-KOREA-KRA`

Status: complete for the reviewed 2026-08-07 through 2026-09-06 Rank C window.

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

### KRA-PUBLIC-IDENTITY-PROMOTION-01 / KRA-RANK-C-PROMOTION-REVIEW-01

Status: complete through PR #570 and PR #571 preparation, followed by reviewed publication in PR #572.

Reviewed publication effect:

```text
canonical meetings added: 32
public meetings added: 32
canonical/public detail rows added: 0
identity-only racecourses added: 2
public rank ceiling used: C
```

Busan-Gyeongnam and Jeju remain identity-only. Seoul reuses its existing canonical identity. No higher KRA technical capability was used to infer or publish race-time/race-level detail.

## Stage 15 — Turkey / TJK

Current Work ID: `WHR-CAL-TURKEY-TJK`

Current reviewed state:

```text
authority: Türkiye Jokey Kulübü
source status: verified
technical capability: A+
public ceiling: A
source revalidation: complete
current implementation unit: TJK-BOUNDED-ADAPTER-01
```

### TJK-SOURCE-REVALIDATION-01

Status: complete in the source-revalidation unit adopted with this roadmap update.

The 2026-08-11 source revalidation records a material route change before adapter implementation:

- annual programme route remains current;
- filtered annual-data route remains current;
- daily programme is now `https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami`;
- the historical `Info/Sehir/GunlukYarisProgrami` route is superseded;
- `SehirId`, `QueryParameter_Tarih`, and `SehirAdi` remain the reviewed query parameters;
- technical capability remains A+;
- public ceiling remains A;
- the current official annual programme resolves 2026-08-11 Ankara and Kocaeli links to the current `Info/Page` route;
- the parameterized 2026-08-11 daily body was not directly captured, so no fresh current-day Race 1-N body claim is made.

Evidence is recorded in `docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json` and synchronized to Authority Source Inventory / Calendar Readiness.

### TJK-BOUNDED-ADAPTER-01

Status: current next implementation unit; must be a separate PR after source revalidation is merged.

Required boundaries:

1. use the current `Info/Page/GunlukYarisProgrami` route;
2. preserve `SehirId`, `QueryParameter_Tarih`, and `SehirAdi` exactly;
3. use reviewed deterministic fixture evidence rather than inventing a fresh 2026-08-11 daily body;
4. preserve technical A+ / public A separation;
5. generate candidates only;
6. validate deterministic output and prohibited-data boundary;
7. do not write Canonical/public data;
8. do not approve, merge, or deploy automatically;
9. prepare any later promotion as a separate human-reviewed unit.

No TJK source capability may bypass Batch Validation, human review, Promotion Validation, Public Ceiling, or the prohibited-data boundary.

## Stage 16 — Morocco / SOREC source revalidation

Conditional next Work ID: `WHR-CAL-MOROCCO-SOREC-REVALIDATION`

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

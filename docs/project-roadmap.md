# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Next source-specific Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`
Last reviewed: 2026-07-08

## Purpose

Where Horses Run progresses through:

```text
official-source research
-> capability and publication decisions
-> bilingual country pages
-> Calendar Readiness
-> reviewed acquisition and candidate generation
-> human-approved public timetable data
-> Calendar / Today / Tomorrow / country / racecourse / meeting views
-> recurring maintenance and expansion
```

## Current position

```text
published country pages:       98
published routes:              98 EN + 98 JA = 196
Profile v2 records:            98
Calendar Readiness countries:  98
Calendar Readiness records:   116
Authority/source records:     116
Country-page programme: complete
```

Completed Calendar foundations:

- `WHR-CAL-CONTRACT-02`;
- `WHR-CAL-BASELINE-RECONCILE`;
- `WHR-CAL-PIPELINE-V1`;
- `WHR-CAL-DYNAMIC-DATES`;
- `WHR-CAL-OPS-V1`;
- `WHR-CAL-JAPAN-A-PLUS-RECONCILE`;
- `WHR-CAL-JAPAN-JRA-A-PLUS`.

The NAR source pilot publication sequence is complete and the Acquisition Control Plane is current.

Reviewed NAR schedule coverage through 2026-07-31 has been promoted and published. The July 8–31 batch contains:

```text
schedule-confirmed meetings: 82
A+ detail records:            11
C schedule records:           71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

The 71 C records remain explicit detail-retry work. Formal NAR `workflow_dispatch` acquisition is active with GitHub Actions as primary runner and local execution as fallback.

The July full-month tooling remains a bounded Completion Audit path, not the ordinary update gate.

## Governing Calendar model

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

Validation roles:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

Operational control is moving to:

```text
Collection Plan
-> independent Collection Jobs
-> runner routing
-> source-specific adapters
-> field observation
-> C/B/B+/A/A+ classification
-> Batch Validation
-> Coverage Observation
-> Review Queue
-> Rank-aware Retry Queue
-> human review
-> Promotion Validation
-> canonical update
-> public projection
```

Rules:

- source capability and individual meeting evidence are separate;
- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- direct promotion may skip intermediate ranks when evidence supports the higher rank;
- operator runs may be irregular;
- requested windows may vary, overlap, cross months, or target selected meetings;
- multiple systems in one campaign may use different requested scopes;
- shorter source horizons and valid partial batches are normal;
- absence from one run is not deletion or cancellation;
- normal promotion is monotonic by reviewed rank;
- corrective downgrade is a separately controlled reviewed path;
- runner choice does not change batch, rank, review, coverage, or promotion semantics;
- Completion Audit is the only role that may require every expected meeting in its declared scope.

Completion is an explicit audit claim.

Incremental maintenance is normal.

## Publication pipeline

```text
official source
-> runner
-> adapter or reviewed import
-> field observation
-> rank classifier
-> candidate
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical update
-> public projection
-> static build

parallel:
Coverage Observation
-> Coverage Audit
-> Rank-aware Retry Queue
-> optional Completion Audit
```

Candidate generation is not publication. Scheduled and unattended canonical/public writes remain disabled unless separately approved.

## Phase status

### Governance and contracts

Status: active extension.

Canonical common contracts include:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
```

The Acquisition Control Plane machine-readable Registry, Job, Plan, Result Manifest, Review Queue, and Rank-aware Retry Queue schemas are planned next.

### Country research and publication

Status: complete.

The 98-country research/page programme, Profile v2 publication, Calendar Readiness backfill, and final combined audit are complete.

### Calendar baseline and Pipeline v1

Status: complete.

Normal build/check is read-only. Dynamic Dates and Operations v1 are complete. Scheduled source refresh and unattended publication remain disabled.

### Japan A+ policy

Status: complete.

| Japan system | Technical Rank | Public Ceiling |
| --- | --- | --- |
| JRA central racing | A+ | A+ |
| NAR and local-government racing | A+ | A+ |
| Banei Tokachi | A+ | A+ |

System A+ is a ceiling, not invented meeting detail.

## Japan pilot activation

Status: NAR source pilot complete; shared control-plane foundation current
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Next source-specific Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

### JRA A+

Status: complete source pilot; steady-state runner integration pending.

The JRA reference implementation remains valid, but it does not create a rule requiring future fixed-month batch completeness.

Current acquisition direction:

```text
primary runner: local
```

JRA must later consume shared Collection Job/Plan semantics so local execution does not require the operator to reconstruct source-specific commands manually.

### NAR A+

Completed:

- source architecture;
- bounded route probe;
- candidate adapter;
- fourteen-racecourse compatibility review;
- 14/14 complete fixture set;
- first reviewed A+ promotion through 2026-07-04;
- July bounded Completion Audit tooling;
- full-month candidate PR validation;
- incremental coverage contract;
- Coverage Observation contract;
- validation responsibility split;
- monotonic normal promotion guard;
- NAR incremental core;
- arbitrary and cross-month date-window support;
- overlap-safe deterministic aggregation;
- selected-meeting scope support;
- Coverage Observation generation;
- explicit retry-target generation;
- local review-only operator;
- schedule-aware immutable v2 batch paths;
- Schedule Layer and Detail Layer combined observation;
- review, promotion, rendered QA, and publication for 10 incremental meetings on 2026-07-05 through 2026-07-07;
- July 8–31 immutable batch collection for 82 meetings;
- pinned human review and source-separated approved C/A+ envelopes;
- canonical promotion and public projection for all 82 reviewed meetings;
- rendered QA and Pipeline v1 release-gate validation;
- closure of temporary diagnostic PRs #430 and #435 without merge;
- formal Actions manual-dispatch operator with immutable review-artifact upload.

Current NAR maintenance state:

1. the July 8–31 batch is reviewed, promoted, projected, QA-validated, and published from main;
2. 11 meetings are A+ detail-complete;
3. 71 meetings remain C schedule identities and explicit detail retry targets;
4. formal Actions manual dispatch is the primary operator path;
5. local v2 execution remains the fallback and development path;
6. NAR now hands off into the shared Registry / Job / Plan / Review Queue / Retry Queue model.

Active operating profile:

```text
NAR primary runner: github_actions
NAR fallback runner: local
```

The current NAR source behavior may yield C and A+ in one batch. This source-specific outcome does not redefine the global five-rank model.

## Acquisition Control Plane foundation

Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`

This shared foundation is inserted between NAR completion and Banei implementation.

Purpose:

```text
stop managing systems by memory such as
"JRA is local" and "NAR is Actions"

and replace that with

Acquisition Registry
Collection Jobs
Collection Plans
runner routing
five-rank classification
Review Queue
Rank-aware Retry Queue
```

The foundation sequence is:

1. NAR formal Actions manual-dispatch path — complete;
2. Acquisition Registry schema and Japan profiles — current;
3. Collection Job schema and fixtures;
4. Collection Plan schema and fixtures;
5. common C/B/B+/A/A+ classifier contract tests;
6. Collection Result Manifest;
7. Review Queue foundation;
8. Rank-aware Retry Queue foundation;
9. Actions and local runner compatibility with common Job/Plan semantics.

Minimum gate before Banei resumes:

```text
Registry
Job schema
Plan schema
five-rank classifier contract
Review Queue foundation
Rank-aware Retry Queue foundation
runner-neutral result semantics
```

Full Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.

## Banei A+

Banei follows the minimum shared control-plane foundation.

Banei inherits common incremental, validation, Job/Plan, rank, review, and retry contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.

Banei must not inherit NAR flat-racing parser assumptions.

Ordinary Banei updates may be partial and irregular. July full-month completeness remains a separate Completion Audit claim.

## Multi-system operations expansion

After the minimum foundation and Banei start, the control-plane programme continues with:

```text
Actions multi-job execution
local multi-job execution
campaign result summaries
review cohort planner
automatic review PR preparation
due-job planner
scheduled regular refresh
scheduled rank-gap retry policy
Operations v2 operator view
```

The preferred automation stop point is:

```text
automatic acquisition
-> automatic normalization
-> automatic validation
-> automatic Coverage Audit
-> automatic bounded retry planning
-> automatic review PR preparation
-> HUMAN REVIEW REQUIRED
```

Unattended publication remains outside the current plan.

## Later pilots

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Later pilots inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, Acquisition Control Plane job semantics, five-rank classification, human review, display boundary, freshness, fallback, rollback, and bilingual QA requirements.

No pilot may require fixed-month completeness before ordinary valid partial promotion.

Every steady-state system must eventually declare:

```text
runner profile
source/adapter profile
technical capability rank
collection target rank
public ceiling
supported collection modes
retry support
```

## Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible source, coverage, and freshness;
- honest partial coverage states;
- safe stale/failure handling;
- bilingual responsive QA;
- operations and recovery ownership;
- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.

## Product follow-up phases

After Calendar Public v1:

1. strengthen racecourse pages and page-link architecture;
2. implement glossary, racing types, search, filters, and SEO;
3. expand by reviewed source/readiness priority;
4. operate steady-state incremental maintenance.

Steady-state maintenance may use arbitrary windows, overlap retries, selected-meeting retries, source-visible-horizon runs, multi-system Collection Plans, Actions jobs, local jobs, and rank-gap retries.

Nominal daily/weekly/monthly/seasonal rhythms are priorities and scheduling inputs, not prerequisites for later valid updates.

## Required reading

Every Calendar PR reads:

1. `docs/governance/document-authority.md`;
2. this roadmap;
3. `docs/calendar/implementation-roadmap.md`;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/coverage-observation-schema.md`;
6. `docs/calendar/validation-responsibility-contract.md`;
7. `docs/calendar/acquisition-control-plane-contract.md`;
8. `docs/calendar/acquisition-control-plane-implementation-plan.md`;
9. active system-specific plan;
10. deployment/CI policy;
11. applicable machine-readable policies, registries, controls, and public display boundaries.

## Historical transition markers

Completed historical implementation markers retained for release-gate compatibility:

Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`  
Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

Completed NAR transition:

> Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
> Next Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`

Completed JRA A+ transition:

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

Completed Japan A+ reconciliation transition:

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

Superseded compatibility marker:

> Current Work ID: `WHR-CAL-JAPAN-NAR`  
> Next Work ID: `WHR-CAL-JAPAN-BANEI`

## Maintenance

Update this roadmap in the same PR whenever current/next Work ID, phase boundary, completion condition, material tracker/readiness count, runner model, acquisition control model, deployment model, or active canonical plan changes.

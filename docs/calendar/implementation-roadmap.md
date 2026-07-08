# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-08

## Purpose

All Calendar work follows:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
```

The shared architecture is:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

Ordinary updates may be partial, irregular, overlapping, and retried. Completion is an explicit audited claim.

## Foundation stages

### Stage 1 — contracts

Completed Work ID: `WHR-CAL-CONTRACT-02`

Source Test v2, Calendar Readiness, authority/source identity, candidate contract, Coverage Observation, and validation responsibility foundations are implemented.

### Stage 2 — readiness backfill and research

Status: complete.

### Stage 3 — 98-country audit

Completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Status: complete.

### Stage 4 — baseline reconciliation

Completed Work ID: `WHR-CAL-BASELINE-RECONCILE`

Status: complete. Normal build/check is read-only and incomplete scheduled refresh remains paused.

## Stage 5 — reviewed Calendar pipeline

Pipeline v1 status: complete  
Dynamic Dates status: complete  
Operations v1 status: complete  
Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Next source-specific Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

Completed transition marker:
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`

Standard flow:

```text
official source
-> runner
-> adapter or reviewed import
-> field observation
-> C/B/B+/A/A+ classification
-> candidate
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical data
-> public projection
-> static build

parallel:
Coverage Observation
-> Coverage Audit
-> Rank-aware Retry Queue
-> optional Completion Audit
```

### Dynamic Dates

Dynamic Dates status: complete.

Calendar, Today, Tomorrow, and rolling 30-day views use explicit date/timezone rules and safe current/stale/empty states.

### Operations v1

Operations v1 status: complete.

Source health, review packages, pause/rollback, seasonal rollover, and source-breakage escalation are implemented. Scheduled and unattended publication remain disabled.

Operations v1 is not retroactively redefined by the Acquisition Control Plane. A later Operations v2 layer may expose Collection Plans, job state, Review Queue, Retry Queue, and campaign status.

## Shared incremental coverage implementation

Completed:

1. cross-system incremental coverage contract;
2. Coverage Observation schema and validator foundation;
3. requested/observed scope separation;
4. partial shorter source horizon validation;
5. selected-meeting retry observation support;
6. audited-complete reference and unresolved-item guards;
7. Batch / Promotion / Coverage / Completion responsibility split;
8. machine-readable validation responsibility map;
9. normal promotion rank-regression rejection;
10. explicit corrective-downgrade boundary and reason set;
11. NAR incremental core for arbitrary date windows;
12. cross-month window grouping;
13. deterministic overlap aggregation;
14. selected-meeting scope parsing;
15. ordinary Coverage Observation generation;
16. explicit NAR retry-target generation;
17. local review-only operator entry point;
18. dedicated NAR incremental operator CI workflow;
19. reviewed collection, promotion, rendered QA, and publication of NAR detail through 2026-07-07;
20. immutable batch-specific v2 paths;
21. Schedule Layer grid observation for known meeting identities;
22. Schedule-to-C and Detail-to-A+ candidate split for current NAR source behavior;
23. future `scheduled_pending_details` state;
24. past/current `detail_retry_required` state;
25. selected-meeting retry reconciliation;
26. July 8–31 NAR immutable review batch with 82 schedule-confirmed meetings;
27. successful bounded NAR acquisition from GitHub Actions;
28. reviewed promotion and publication of the July 8–31 82-meeting batch;
29. formal read-only Actions manual-dispatch operator with immutable review-artifact upload.

The validation responsibility split is complete.

The current NAR source implementation may observe C and A+ as its present output states. This does not define the shared global model, which remains five-rank capable.

## Promotion rule

Normal promotion is monotonic by reviewed rank.

```text
C < B < B+ < A < A+
```

Allowed examples:

```text
C -> B
C -> B+
C -> A
C -> A+
B -> B+
B -> A
B -> A+
B+ -> A
B+ -> A+
A -> A+
```

Rejected in normal promotion:

```text
A+ -> C
A -> B+
B+ -> B
```

A corrective downgrade is a separately controlled reviewed path. Ordinary source refresh must not infer downgrade from lower-detail observation.

## Japan A+ policy

Approved policy:

- JRA central racing: Technical Rank A+ / Public Ceiling A+;
- NAR and local-government racing: Technical Rank A+ / Public Ceiling A+;
- Banei Tokachi: Technical Rank A+ / Public Ceiling A+.

System-level A+ is a ceiling, not invented meeting detail. A meeting may enter at any reviewed supported rank.

## Stage 6 — Japan pilot activation

Status: NAR source pilot complete; shared control-plane foundation current
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Current Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Next source Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

```text
WHR-CAL-JAPAN-JRA-A-PLUS
WHR-CAL-JAPAN-NAR-A-PLUS
WHR-CAL-ACQUISITION-CONTROL-PLANE
WHR-CAL-JAPAN-BANEI-A-PLUS
WHR-CAL-JAPAN-INTEGRATION
```

### JRA A+ — complete source pilot

The JRA A+ reference implementation is complete. It remains a reference, not a rule requiring future fixed-month batch completeness.

Steady-state acquisition direction:

```text
primary runner: local
```

JRA later becomes the first required compatibility test for the shared local multi-job runner.

### NAR A+ — published source pilot with ongoing detail retries

Completed:

- source architecture;
- bounded route probe;
- candidate adapter;
- all-fourteen compatibility review;
- 14/14 complete fixture set;
- first reviewed partial A+ promotion through 2026-07-04;
- July full-month schedule collector and Completion Audit path;
- dedicated generated full-month candidate PR validation;
- cross-system incremental coverage contract;
- Coverage Observation schema and validator foundation;
- validation responsibility split;
- monotonic normal promotion guard;
- NAR incremental core implementation;
- arbitrary and cross-month date-window support;
- overlap-safe deterministic aggregation;
- selected-meeting scope support;
- Coverage Observation and retry-target artifact generation;
- local review-only operator;
- dedicated incremental operator CI definition;
- schedule-aware immutable v2 implementation;
- reviewed and published incremental NAR detail through 2026-07-07;
- July 8–31 review batch collection and immutable commit;
- pinned review and source-compatible C/A+ approval envelopes;
- canonical promotion and public projection of all 82 reviewed meetings;
- rendered bilingual QA and release-gate validation;
- temporary diagnostic PR closure without merge;
- formal Actions manual-dispatch operator with local fallback.

Current July 8–31 batch:

```text
schedule-confirmed meetings: 82
A+ detail candidates:         11
C schedule candidates:        71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

Current NAR maintenance state:

1. 82 reviewed July 8–31 meetings are promoted and projected;
2. 11 are A+ detail-complete;
3. 71 remain C schedule identities and explicit retry targets;
4. Actions manual dispatch is the primary acquisition runner;
5. local execution remains fallback;
6. shared Registry / Job / Plan / Queue integration is next.

Active NAR operating profile:

```text
primary runner: github_actions
fallback runner: local
```

Do not flatten local-government racing into a JRA-like feed.

## Stage 7 — Acquisition Control Plane foundation

Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`

Purpose:

```text
one shared operating model
for
local acquisition
GitHub Actions acquisition
reviewed import
multi-system collection plans
five-rank result classification
review state
rank-aware retry state
```

The foundation is implemented in this order:

### ACP-0 — documentation alignment

- canonical contract;
- implementation plan;
- roadmap and authority alignment;
- NAR runner transition documentation;
- five-rank operating semantics.

### ACP-1 — NAR formal workflow dispatch — complete

- bounded manual inputs;
- date-window and selected-meeting modes;
- immutable batch outputs;
- validation and artifact upload;
- no approval/promotion/publication;
- local fallback retained.

### ACP-2 — Acquisition Registry — complete

Implemented machine-readable routing/capability records for at least:

```text
japan-jra-system
japan-nar-system
japan-banei-system
hong-kong-hkjc-system (provisional bounded-generator profile)
```

Registry fields include runner profile, source/adapter profile, Technical Rank, Collection Target Rank, Public Ceiling, supported ranks, scope modes, and retry support.

### ACP-3 — Collection Job schema — complete

One schedulable request with:

```text
job identity
campaign identity
system identity
runner policy
scope mode
requested scope
rank strategy
target rank
reason
```

### ACP-4 — Collection Plan schema — complete

One campaign may contain many independent jobs with different:

```text
systems
runners
date windows
reasons
target ranks
```

### ACP-5 — five-rank classifier contract — complete

Test common C/B/B+/A/A+ shapes and direct monotonic transitions.

B and B+ are first-class states, not future placeholders.

### ACP-6 — Collection Result Manifest — complete

Every job receives one concise summary with five rank counts, coverage state, unresolved state, source errors, and artifact references.

### ACP-7 — Review Queue — complete

Expose validated batches awaiting review with:

```text
C count
B count
B+ count
A count
A+ count
coverage claim
unresolved counts
source error count
review state
promotion state
```

### ACP-8 — Rank-aware Retry Queue — complete

Represent rank gaps such as:

```text
C -> best available
B -> B+
B+ -> A
A -> A+
```

Retry records include current reviewed rank, latest observed rank, collection target rank, missing fields, reason, runner, adapter, backoff metadata, and attempt history.

### ACP-9 — shared runner semantics — complete

Runner-neutral compatibility foundation: complete.
Actions multi-job execution: complete.
Local multi-job execution: complete.

- Actions jobs consume Collection Jobs;
- local jobs consume the same Collection Jobs;
- runner selection does not create incompatible result models;
- JRA validates local compatibility;
- NAR validates Actions-primary/local-fallback compatibility.

## Banei handoff gate

Banei begins after the minimum control-plane foundation exists:

1. Acquisition Registry schema and initial records;
2. Collection Job schema;
3. Collection Plan schema;
4. five-rank classifier contract;
5. Review Queue foundation;
6. Rank-aware Retry Queue foundation;
7. runner-neutral batch/result semantics.

Minimum Banei handoff gate status: satisfied.

Full Actions matrix execution, full scheduler, and automatic PR generation are not required before Banei starts.

### Banei A+ — subsequent

Banei inherits the shared control-plane and incremental contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.

Banei sequence:

1. register runner/source/adapter profile;
2. implement arbitrary-window Schedule/Detail acquisition;
3. classify best available rank across C/B/B+/A/A+;
4. preserve meeting identity while higher detail is pending;
5. emit Coverage Observation and rank-aware retry state;
6. review/promote valid partial batches independently;
7. use July whole-month validation only for an explicit Completion Audit claim;
8. complete freshness, rollback, and bilingual QA.

## Stage 8 — multi-system execution

After the minimum foundation and Banei start:

### Actions multi-job execution — complete

- consume one Collection Plan;
- filter hosted-capable jobs;
- permit different scopes per system;
- isolate job failure;
- preserve independent batch artifacts;
- emit campaign summary.

### Local multi-job execution — complete

- consume the same Collection Plan;
- filter local jobs;
- route jobs to source-specific adapters;
- permit different scopes per system;
- preserve independent batches;
- continue bounded independent jobs after isolated failure where safe.

### Review cohort planner — current

Group review-ready batches by risk and compatibility, not merely by collection time.

One campaign may produce several review PRs.

## Stage 9 — review automation and scheduling

### Automatic review PR preparation

The system may prepare deterministic review PRs with candidate diffs, coverage summaries, rank distributions, and retry summaries.

The automation stop point remains:

```text
HUMAN REVIEW REQUIRED
```

### Due-job planner

Generate explicit jobs from:

```text
source freshness thresholds
meeting proximity
source publication horizon
season state
rank gaps
retry backoff
coverage gaps
source health
```

### Scheduled steady-state maintenance

Add regular refresh and bounded retry scheduling only after job generation, queue state, runner routing, and human review boundaries are stable.

Unattended publication remains disabled.

## Stage 10 — additional pilots

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

HKJC and UAE inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, Acquisition Control Plane Job/Plan semantics, five-rank classification, human review, public boundary, freshness, fallback, rollback, and bilingual QA requirements.

No pilot may require fixed-month completeness before ordinary valid partial promotion.

## Stage 11 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria include:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible source, coverage, and freshness;
- honest partial coverage;
- safe stale/failure handling;
- bilingual responsive QA;
- review and retry operations ownership;
- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.

## Later product stages

### Racecourse pages and product navigation

Strengthen canonical racecourse pages, current/next meeting state, recent reviewed meetings, course/distance profile, official sources, freshness, and cross-navigation.

### Glossary, racing types, search, filtering, SEO

Implement reviewed terminology, local names, readings/pronunciation metadata where supported, navigation, search/filtering, metadata, sitemap, canonical/hreflang, structured data, methodology, coverage, and limitations pages.

### Expansion cohorts

Choose systems by source stability, coverage, timetable depth, maintenance cost, publication safety, season timing, and user value. Every system inherits the common incremental and Acquisition Control Plane contracts.

### Steady-state maintenance

Valid operations include arbitrary windows, overlap retries, selected-meeting retries, source-visible-horizon runs, multi-system Plans, different scopes per job, Actions execution, local execution, and rank-gap retries.

Nominal daily, weekly, monthly, and seasonal rhythms are scheduling priorities, not prerequisites for later valid updates.

## Immediate execution order

From the current repository state:

```text
1. implement local multi-job execution and JRA shared local Job path
2. begin Banei source-specific implementation on the satisfied minimum gate
3. add review cohort planning
4. add automatic review PR preparation
5. add due-job planning and scheduled bounded retries
6. add Operations v2 operator view
```

## Per-PR document review

Calendar PRs review:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. this roadmap;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/coverage-observation-schema.md`;
6. `docs/calendar/validation-responsibility-contract.md`;
7. `docs/calendar/acquisition-control-plane-contract.md`;
8. `docs/calendar/acquisition-control-plane-implementation-plan.md`;
9. active source-specific plan;
10. deployment/CI policy;
11. applicable machine-readable policies, registries, controls, and display boundaries.

## Deployment rule

Research, contracts, fixtures, candidates, and non-public runtime work use GitHub validation without Cloudflare preview. Rendered releases use preview/production deployment only when materially required by deployment policy.

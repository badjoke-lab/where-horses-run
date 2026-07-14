# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Completed Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`
Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`
Completed Work ID: `WHR-CAL-UAE-ERA`
Completed Work ID: `WHR-CAL-PUBLIC-V1`
Current Work ID: `WHR-RACECOURSE-PAGES-V1`
Last reviewed: 2026-07-14

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

The NAR source pilot, Acquisition Control Plane foundation, Banei bounded operational integration, HKJC source-specific pilot handoff, UAE ERA source-specific sequence, and Calendar Public v1 release decision are complete. Banei, HKJC, and UAE continue under their accepted reviewed operating boundaries. Calendar Public v1 release decision accepted for reviewed static public operation. The current programme work is `WHR-RACECOURSE-PAGES-V1`, focused on canonical racecourse pages and page-link architecture; unattended publication remains disabled.

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

The Acquisition Registry, Collection Job, Collection Plan, shared five-rank classifier, Collection Result Manifest, Review Queue, Rank-aware Retry Queue, runner-neutral compatibility foundation, Actions multi-job execution, local multi-job execution with JRA shared local Job integration, Review Cohort Planner, deterministic review PR package preparation, policy-driven Due-job Planner with artifact-only daily scheduling, and Operations v2 operator view are implemented. Operations v2 also exposes retry due/deferred, attempt-count, next-eligible, backoff, and attempt-limit state without executing Jobs or mutating Queue state.

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

Status: JRA and NAR source pilots complete; Acquisition Control Plane complete; Banei operational integration current
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Completed Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Current Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`
Next source-specific Work ID: `WHR-CAL-HONG-KONG-HKJC`

### JRA A+

Status: complete source pilot; shared local runner integration complete.

The JRA reference implementation remains valid, but it does not create a rule requiring future fixed-month batch completeness.

Current acquisition direction:

```text
primary runner: local
```

JRA now consumes shared Collection Plan/Job semantics through the local multi-job runner, which isolates legacy collector writes in a temporary worktree and emits review-boundary batch artifacts.

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
2. Acquisition Registry schema and Japan profiles — complete;
3. Collection Job schema and fixtures — complete;
4. Collection Plan schema and fixtures — complete;
5. common C/B/B+/A/A+ classifier contract tests — complete;
6. Collection Result Manifest — complete;
7. Review Queue foundation — complete;
8. Rank-aware Retry Queue foundation — complete;
9. runner-neutral compatibility foundation across Job/Registry/Coverage/Manifest semantics — complete;
10. Actions multi-job execution — complete;
11. local multi-job execution and JRA shared local Job integration — complete;
12. Review Cohort Planner — complete;
13. automatic review PR preparation — complete;
14. due-job planner and artifact-only scheduling policy — complete;
15. Operations v2 operator view — complete, including retry attempt/backoff state.

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

Minimum Banei handoff gate status: satisfied.

Required first Runner Gate status: complete.

Full Actions matrix execution, scheduler, and automatic PR generation are not prerequisites for starting Banei.

## Banei A+

Status: handoff accepted; manual reviewed steady-state operation.

Banei follows the completed shared control-plane foundation and uses Banei-specific source routes, terminology, distance interpretation, and course semantics. It does not inherit NAR flat-racing parser assumptions. Ordinary Banei updates may be partial and irregular; July full-month completeness remains a separate Completion Audit claim.

Completed Banei foundations:

- July full-month schedule foundation with 12 reviewed meeting dates;
- shared control-plane bridge with C/B/B+ schedule evidence;
- Banei-specific RaceList/DebaTable A+ adapter;
- bounded live A+ evidence with 12 public-safe timetable rows;
- Banei detail Authority Source Inventory and Registry activation;
- GitHub Actions runner convergence for full-month schedule, date-window detail, and selected-meeting detail;
- shared Banei Actions executor with schedule fallback plus A+ replacement;
- rank-upgrade retry proof, bounded retry activation, and Due-job planning limits;
- Operations v2 due/deferred, attempt-count, next-eligible, backoff, and attempt-limit state;
- successful reviewed retry Job through the standard Actions planner and dispatcher;
- formal manual workflow_dispatch operator route for the reviewed retry Plan;
- proposal-only post-run Retry Queue reconciliation with input Queue immutability;
- guarded explicit Retry Queue state apply and rollback with reviewed approval artifact, exact SHA-256 stale-write guards, durable atomic replacement, pre-apply backup, and rollback evidence;
- freshness and rollback operating evidence connecting the successful reviewed Banei Job to Operations v2 freshness state, proving 1-hour current state, 168-hour freshness attention with source health still healthy, byte-for-byte rollback restore, and stale apply/rollback rejection;
- bilingual and public-display QA with separate Banei detail-source Readiness, legacy schedule-source link-only isolation, one-meeting-per-list-row enforcement, A/A+ downgrade and field-switch tests, Japanese meeting-detail routing, localized Banei list labels, and rendered English/Japanese fixture verification without committed public JSON mutation;
- Banei handoff accepted for manual reviewed steady-state operation with bounded operational integration complete, no July full-month completeness claim, no unattended execution/publication, and next Work ID `WHR-CAL-HONG-KONG-HKJC`.

Current Banei boundary:

```text
primary runner: github_actions
fallback runner: reviewed_import
date-window: enabled
selected-meeting: enabled
rank-upgrade retry planning: enabled
regular refresh planning: disabled
coverage-gap planning: disabled
source revalidation planning: disabled
scheduler Job execution: disabled
automatic approval/promotion/publication: disabled
```

Current handoff: Banei handoff accepted for manual reviewed steady-state operation. The accepted claim is bounded operational integration complete, not July full-month completeness. The separate July whole-month Completion Audit remains unperformed and is required only before an explicit July full-month completeness claim. The next Work ID is `WHR-CAL-HONG-KONG-HKJC`.

## HKJC pilot

Status: HKJC handoff accepted; bounded manual reviewed steady-state operation, overall Registry profile remains provisional, next source-specific Work ID is WHR-CAL-UAE-ERA while the global Current Work ID switch remains a separate entrypoint synchronization step.

Current Work ID: `WHR-CAL-HONG-KONG-HKJC`

The first HKJC reconciliation stage found two pre-existing paths: a shared-control-plane bounded C-level executor and a historical rolling live-fetch pipeline that directly chained normalization into canonical/public writes. The adopted decision is `transition_legacy_refresh_to_shared_control_plane`.

Completed HKJC reconciliation state:

- provisional Registry profile retained;
- GitHub Actions primary / local fallback retained;
- bounded date-window executor retained as safe C-level fallback foundation;
- historical rolling evidence verified at 10 route meetings, 10 normalized records, A+ 1 / C 9;
- historical A+ evidence retained as migration evidence only;
- legacy `refresh-hkjc.mjs` default execution changed to fail closed;
- explicit `--legacy-research-only` mode limited to fetch + normalize;
- direct canonical/public writer calls removed from the legacy orchestrator;
- current Registry detail source/adapter remain unactivated;
- public ceiling remains A;
- HKJC-PILOT-02 artifact-only live fixture bridge implemented;
- official fixture-window parser emits Rank C timetable-candidate-v1 plus Coverage Observation, Result Manifest, and collection report;
- repository-local output is rejected before network access;
- manual live execution uses workflow_dispatch and Actions artifact upload only;
- successful, partial, none, and parser-failure coverage semantics are fixture-tested;
- implementation alone does not activate the provisional Registry profile;
- HKJC-PILOT-03 connected the live fixture bridge to the shared Actions Job path;
- actual live evidence run 29094860976 completed the shared execution, artifact upload, protected-state hash check, cleanup, and clean-worktree proof;
- reviewed live result: coverage `none`, 0 discovered records, one `parser_failure` for `month:2026-08`, Job status `source_error`;
- Registry remains provisional and detail source/adapter remain unactivated;
- HKJC-PILOT-04 reviewed July, August, and September 2026 public-safe source structure and added fail-closed empty-window semantics;
- the repeated shared Actions live run 29102195265 completed successfully with coverage `source_window_complete`, 0 discovered records, 0 source errors, `valid_empty_months: ["2026-08"]`, protected-state hash pass, artifact upload, cleanup, and clean-worktree proof;
- the C-level date-window schedule source/adapter path is accepted as evidence-backed;
- the overall Registry profile remains provisional because `detail_source_id` and `detail_adapter_id` remain intentionally pending under the complete-path active-profile contract;
- HKJC-PILOT-05 added and permanently validated the artifact-only detail core, five-rank classifier fixtures, external review-artifact collector, and read-only bounded live evidence path;
- the first bounded hosted detail run remained C / coverage none with one unresolved meeting and one source_unavailable error while all protected-state and no-write boundaries passed;
- three reviewed meetings × three official route forms produced nine HTTP 200 responses with the same 120504-byte shell and no target post-time, race-name, distance, or surface shapes;
- browser-like headers, fixture warmup, and racecard-base warmup strategies also returned the same shell without target detail markers;
- the artifact-only core and collector foundation are accepted, but the GitHub Actions HTTP detail runner is not evidence-backed;
- the Registry profile remains provisional, detail source/adapter remain null, and supported observation ranks remain C only;
- HKJC-PILOT-06 removed the unimplemented system-level local fallback claim and returned fallback_runner to pending;
- PILOT-06 added strict external public-safe reviewed-import input, exact input SHA-256 binding, two-stage review semantics, and network-free package generation through the accepted PILOT-05 classifier;
- reviewed-import evidence run 29106908246 succeeded with external input SHA-256 4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b;
- reviewed evidence classified the explicitly incomplete one-race meeting observation as B with first time 18:30, no last-race claim, no timetable rows, coverage partial, one unresolved meeting, runner reviewed_import, candidate needs_review, and no network/canonical/public/publication side effects;
- the reviewed-import detail operator path is evidence-backed, but system-level fallback activation remains false because the current Registry cannot represent a detail-only reviewed-import route without overstating fallback semantics for the evidence-backed Actions schedule path;
- Registry detail source/adapter remain null and supported observation ranks remain C only;
- HKJC-PILOT-06B route-specific runner policy representation is complete and validated against Acquisition Registry, Collection Job, Collection Plan, Due-job Planner, runner compatibility, and Operations v2;
- the schedule route remains GitHub Actions / collection_job / C evidence with automatic execution disabled;
- the detail route remains reviewed_import / operator_only / B evidence and is rejected from generic Collection Job and Due-job Planner selection;
- system-level Registry fallback remains null and pending, Registry detail source/adapter remain null, and Registry supported observation ranks remain C only;
- HKJC handoff accepted for bounded manual reviewed steady-state operation;
- no full detail completeness, full-season completeness, automatic detail acquisition, system-wide fallback, or unattended publication claim is made;
- the next source-specific Work ID is `WHR-CAL-UAE-ERA`;
- the global Current Work ID switch remains a separate entrypoint synchronization step so historical release-gate current-state markers are updated deliberately rather than implicitly.

Handoff decision:

```text
HKJC-HANDOFF-01
accept_manual_reviewed_steady_state_handoff
completed Work ID: WHR-CAL-HONG-KONG-HKJC
next Work ID: WHR-CAL-UAE-ERA
```

HKJC maintenance may continue incrementally under explicit schedule Jobs and operator-reviewed detail imports without blocking UAE source-specific implementation.

## Multi-system operations expansion

After the minimum foundation and Banei start, the control-plane programme continues with:

```text
Actions multi-job execution
local multi-job execution
campaign result summaries
review cohort planner
automatic review PR preparation
due-job planner — complete
artifact-only scheduled planning — complete
scheduled acquisition execution — disabled
Operations v2 operator view — complete, including retry operational state
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

Status: complete.

Completed Work ID: `WHR-CAL-PUBLIC-V1`

Calendar Public v1 release decision accepted for reviewed static public operation. The decision is recorded in `docs/calendar/public-v1-release-decision.md` and `data/audits/calendar-public-v1-release-decision-v1.json`.

Completed release criteria:

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

Scheduled acquisition execution and unattended publication remain disabled.

## Product follow-up phases

Current Work ID: `WHR-RACECOURSE-PAGES-V1`
Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`
Completed implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`
Completed implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`
Current implementation unit: `RACECOURSE-PAGE-LINK-ARCHITECTURE-01`

Current product stage: all canonical racecourse pages show reviewed public meetings, and the thirteen former identity-only Japanese records now carry official location and high-level course evidence. Next complete bilingual page-link architecture without broadening the public data boundary.

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

Completed Public v1 transition retained for release-gate compatibility:

> Current Work ID: `WHR-CAL-PUBLIC-V1`  
> Next Work ID: `WHR-RACECOURSE-PAGES-V1`

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

# Calendar daily acquisition implementation schedule

Status: active implementation schedule  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Started: 2026-07-19  
Current stage: `DA-00` recovery audit and `DA-02` reviewed season-state correction; activation evidence pending

## Objective

Turn the existing artifact-only planner and manual Actions runners into one reviewed daily maintenance loop:

```text
current committed horizon
+ reviewed system season states
-> planning-only Due-job Plan
-> separately authorized supported official-source acquisition
-> immutable artifacts
-> one draft review PR
-> human review
```

The schedule does not authorize automatic publication.

## Stage DA-00 — current-horizon recovery audit

Status: implementation candidate; merge and CI evidence pending.

Deliverables:

1. audit the rolling 30-day window from the current production reference date;
2. list the per-system final committed public meeting date;
3. identify JRA, NAR, and Banei recovery tails;
4. distinguish missing horizon from reviewed HKJC and UAE offseason state;
5. record an explicit runner and execution disposition for every maintained system;
6. retain the audit without creating Canonical, public-projection, or deployment writes.

Canonical artifacts:

```text
docs/calendar/current-horizon-recovery-2026-07-19.md
data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json
data/static/calendar-system-season-state-v1.json
scripts/check-calendar-current-horizon-recovery.mjs
```

Completion condition:

```text
all five maintained systems have an explicit reviewed disposition
for the current 30-day public horizon
and the live planner reproduces those dispositions without public writes
```

DA-00 does not create one executable mixed-system Collection Plan. JRA local work, NAR hosted review work, Banei manual recovery, and season-suppressed systems have different authorization boundaries and must not be flattened merely for orchestration convenience.

## Stage DA-01 — canonical contract and documentation

Status: implementation candidate merged in PR #556; steady-state acceptance pending.

Deliverables:

- `daily-acquisition-contract.md`;
- `daily-acquisition-operations.md`;
- this implementation schedule;
- roadmap addendum;
- documentation-authority registration;
- README reference.

Completion condition:

```text
specification, schedule, operation, and publication boundaries agree
```

## Stage DA-02 — live planner-state builder

Status: reviewed season-state correction candidate.

Deliverables:

```text
scripts/timetable/build-calendar-live-planner-state.mjs
data/static/calendar-system-season-state-v1.json
```

Requirements:

- use committed public timetable data rather than test fixtures;
- derive latest meeting horizon per configured system;
- use reviewed last-checked evidence;
- use explicit reviewed `active`, `offseason`, or `unknown` system state;
- create tail-only coverage gaps for active systems only;
- emit no coverage gap for an offseason system;
- fail closed when the reviewed season-state window has expired or is missing;
- accept an explicit reviewed Retry Queue path when supplied;
- perform no network request and no repository write outside its output artifact.

Completion condition:

```text
fixture-free state generation produces valid planner input
for the current repository
and HKJC is season-suppressed in the 2026-07-19 recovery window
```

## Stage DA-03 — generated-plan runner compatibility

Status: implementation candidate merged in PR #556; operating evidence pending.

Deliverables:

- `plan-actions-multi-job.mjs --plan-file=...`;
- `summarize-actions-multi-job.mjs --plan-file=...`.

Requirements:

- accept either a fixture plan ID or one generated plan file;
- reject simultaneous `--plan-id` and `--plan-file`;
- accept a Due-job Plan wrapper or a bare Collection Plan;
- retain existing fixture-based validation compatibility.

Completion condition:

```text
one generated Due-job Plan can flow directly into
Actions compilation and campaign summarization
```

## Stage DA-04 — separate execution authorization

Status: implementation candidate merged in PR #556; operating evidence pending.

Deliverables:

```text
data/static/calendar-daily-acquisition-policy-v1.json
scripts/timetable/daily-acquisition-policy.mjs
scripts/timetable/validate-daily-acquisition-plan.mjs
scripts/check-calendar-daily-acquisition-policy.mjs
```

Requirements:

- keep the Due-job policy and Due-job Plan planning-only;
- authorize exact system/reason/mode/runner/executor combinations separately;
- authorize NAR and HKJC only within registered hosted modes when season state permits;
- reject Banei regular refresh while permitting reviewed selected-meeting rank retry;
- reject JRA hosted execution;
- keep approval, promotion, publication, merge, and deployment false;
- stop before source access when authorization fails.

Completion condition:

```text
every hosted Job is explicitly authorized by a machine-readable execution policy
without changing the planning-only Due-job boundary
```

## Stage DA-05 — scheduled hosted acquisition

Status: implementation candidate merged in PR #556; corrected activation evidence pending.

Deliverable:

```text
.github/workflows/calendar-daily-acquisition.yml
```

Schedule:

```text
03:17 UTC daily
12:17 JST daily
```

Required behavior:

1. validate scripts and current contracts;
2. validate current-horizon and reviewed season-state evidence;
3. derive live state;
4. generate planning-only Due-job Plan;
5. compile hosted-capable matrix;
6. validate the compiled Actions Plan against the separate execution policy;
7. run authorized Jobs independently with `fail-fast: false`;
8. upload all status and candidate artifacts;
9. preserve non-hosted exclusions, including JRA local-primary work;
10. execute a bounded activation cycle on a qualifying merge push to `main`.

Completion condition:

```text
one real main-branch activation, scheduled, or manual-dispatch run completes with
an auditable plan, independent Job outcomes, correct season suppression,
and no publication side effect
```

## Stage DA-06 — automatic draft review PR and CI evidence

Status: implementation candidate; real operating evidence pending.

Required behavior:

- maintain branch `automation/calendar-daily-acquisition-review`;
- create the PR as draft;
- update an existing draft rather than open one PR per day;
- retain planner state, exact Due-job Plan, exact authorized Actions Plan, status, summary, and candidate artifacts;
- state that human review is required;
- state that JRA local work remains separate;
- state that Banei regular refresh remains disabled;
- state that HKJC and UAE are season-suppressed for the reviewed window;
- give write permissions only to the review-PR job;
- never merge, approve, promote, project, or deploy.

Required scenarios:

1. valid live-state build;
2. no hosted Jobs;
3. one NAR success plus one independent source error;
4. JRA excluded as non-Actions runner;
5. Banei regular date-window rejected;
6. Banei reviewed selected-meeting retry accepted;
7. HKJC offseason produces no Job and no coverage gap;
8. UAE remains explicitly season-suppressed outside the daily Due-job policy;
9. planner, season-state, or execution-policy validation failure stops execution;
10. no Canonical/public/deployment commands exist in the scheduled workflow;
11. repeated run updates the same draft PR.

Completion condition:

```text
one main-branch activation or scheduled run creates or updates a draft review PR
with the exact generated artifacts and no public-data mutation
```

## Stage DA-07 — rolling-window recovery publication

Status: pending and separate from automation merge.

Sequence:

```text
produce JRA, NAR, and Banei recovery candidates through their authorized paths
-> inspect candidates and coverage
-> human approval
-> Promotion Validation
-> Canonical promotion
-> public projection
-> bilingual rendered QA
-> merge and deploy
```

This stage must not be collapsed into DA-05 or DA-06.

Completion condition:

```text
the public rolling 30-day window is restored through the reviewed target date
and the scheduled system is ready to produce the next review package
```

## Stage DA-08 — steady-state acceptance

Status: pending.

Acceptance requires:

- at least one successful main-branch activation or scheduled daily cycle;
- at least one source-error cycle without cross-job corruption;
- at least one draft PR update cycle;
- documented operator review and merge procedure;
- explicit JRA local maintenance ownership;
- explicit Banei regular-refresh decision retained;
- explicit HKJC and UAE seasonal ownership;
- reviewed season states renewed before their effective windows expire;
- no unattended publication permissions;
- production Calendar freshness confirmed after a reviewed publication.

Only after DA-08 may the Work ID be marked complete.

## PR sequence

The bounded sequence is:

```text
DA-PR-01 PR #556: contract, live-state foundation, execution policy, generated-plan runner, scheduled review workflow — merged
DA-PR-02: current-horizon audit, reviewed season states, season-aware planner correction, corrected activation evidence
DA-PR-03: JRA, NAR, and Banei recovery candidates through separate authorized paths
DA-PR-04: reviewed Canonical/public projection recovery
DA-PR-05: scheduled-cycle evidence and steady-state acceptance
```

Actual GitHub PR numbers after PR #556 do not need to match these programme labels.

## Current decision

PR #556 established and merged the two-policy workflow foundation, but DA-05 and DA-06 still require main-branch operating evidence. The current correction replaces recent-activity inference with reviewed system season states so that a completed season is not misclassified as a missing horizon. After this correction passes CI and is merged, its qualifying main push must run the bounded activation cycle. A failed activation does not authorize publication and requires a corrective PR or rollback.

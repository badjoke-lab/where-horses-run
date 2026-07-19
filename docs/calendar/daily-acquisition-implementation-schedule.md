# Calendar daily acquisition implementation schedule

Status: active implementation schedule  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Started: 2026-07-19  
Current stage: `DA-01` through `DA-06` implementation candidate; operating evidence pending

## Objective

Turn the existing artifact-only planner and manual Actions runners into one reviewed daily maintenance loop:

```text
current committed horizon
-> planning-only Due-job Plan
-> separately authorized supported official-source acquisition
-> immutable artifacts
-> one draft review PR
-> human review
```

The schedule does not authorize automatic publication.

## Stage DA-00 — current-horizon recovery audit

Status: required, not complete.

Deliverables:

1. audit the rolling 30-day window from the current production reference date;
2. list per-system final committed meeting date;
3. identify JRA, NAR, Banei, HKJC, and UAE coverage tails;
4. distinguish missing horizon from valid offseason or source-empty state;
5. create a reviewed recovery Collection Plan.

Completion condition:

```text
all five maintained systems have an explicit reviewed disposition
for the current 30-day public horizon
```

## Stage DA-01 — canonical contract and documentation

Status: implementation candidate.

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

Status: implementation candidate.

Deliverable:

```text
scripts/timetable/build-calendar-live-planner-state.mjs
```

Requirements:

- use committed public timetable data rather than test fixtures;
- derive latest meeting horizon per configured system;
- use reviewed last-checked evidence;
- create tail-only coverage gaps;
- preserve explicit unknown/offseason state;
- accept an explicit reviewed Retry Queue path when supplied;
- perform no network request and no repository write outside its output artifact.

Completion condition:

```text
fixture-free state generation produces valid planner input
for the current repository
```

## Stage DA-03 — generated-plan runner compatibility

Status: implementation candidate.

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

Status: implementation candidate.

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
- authorize NAR and HKJC only within registered hosted modes;
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

Status: implementation candidate.

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
2. derive live state;
3. generate planning-only Due-job Plan;
4. compile hosted-capable matrix;
5. validate the compiled Actions Plan against the separate execution policy;
6. run authorized Jobs independently with `fail-fast: false`;
7. upload all status and candidate artifacts;
8. preserve non-hosted exclusions, including JRA local-primary work;
9. execute the first activation cycle on the merge push to `main`.

Completion condition:

```text
one real main-branch activation, scheduled, or manual-dispatch run completes with
an auditable plan, independent Job outcomes, and no publication side effect
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
- state that UAE remains an explicit seasonal disposition;
- give write permissions only to the review-PR job;
- never merge, approve, promote, project, or deploy.

Required scenarios:

1. valid live-state build;
2. no hosted Jobs;
3. one NAR success plus one independent source error;
4. JRA excluded as non-Actions runner;
5. Banei regular date-window rejected;
6. Banei reviewed selected-meeting retry accepted;
7. HKJC valid empty source window;
8. planner or execution-policy validation failure stops execution;
9. no Canonical/public/deployment commands exist in the scheduled workflow;
10. repeated run updates the same draft PR.

Completion condition:

```text
one main-branch activation or scheduled run creates or updates a draft review PR
with the exact generated artifacts and no public-data mutation
```

## Stage DA-07 — rolling-window recovery publication

Status: pending and separate from automation merge.

Sequence:

```text
run recovery acquisition
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
- explicit UAE seasonal ownership;
- no unattended publication permissions;
- production Calendar freshness confirmed after a reviewed publication.

Only after DA-08 may the Work ID be marked complete.

## PR sequence

The recommended bounded sequence is:

```text
DA-PR-01 contract, live state, execution policy, generated-plan runner, scheduled review workflow
DA-PR-02 CI corrections and first main-branch activation operating evidence
DA-PR-03 current 30-day horizon recovery candidates
DA-PR-04 reviewed Canonical/public projection recovery
DA-PR-05 first scheduled-cycle evidence and steady-state acceptance
```

Actual GitHub PR numbers do not need to match these programme labels.

## Current decision

The current implementation branch is not sufficient operating evidence by itself. It establishes the contract, two-policy authorization boundary, and workflow candidate. It remains a draft until branch CI passes. After merge, the path-filtered push to `main` must run the first bounded activation cycle immediately; that run and its draft review PR are the required DA-PR-02 operating evidence. A failed activation run does not authorize publication and requires an immediate corrective PR or rollback.

# Calendar daily acquisition implementation schedule

Status: active implementation schedule  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Started: 2026-07-19  
Current stage: `DA-06` stable review-branch delivery correction; activation evidence pending

## Objective

Turn the reviewed static Calendar into a maintainable daily loop without enabling unattended publication:

```text
committed public horizon
+ reviewed system season states
-> planning-only Due-job Plan
-> separately authorized hosted acquisition
-> activation status and immutable review artifacts
-> stable review branch
-> Draft PR #559
-> human review
```

This schedule does not authorize automatic approval, Canonical promotion, public projection, merge, or deployment.

## Stage DA-00 — current-horizon recovery audit

Status: complete in PR #557.

Implemented artifacts:

```text
docs/calendar/current-horizon-recovery-2026-07-19.md
data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json
data/static/calendar-system-season-state-v1.json
scripts/check-calendar-current-horizon-recovery.mjs
```

Reviewed dispositions for 2026-07-19 through 2026-08-17:

```text
JRA: active / recovery required / local reviewed path
NAR: active / recovery required / authorized hosted path
Banei: active / bounded manual recovery / ordinary daily refresh disabled
HKJC: offseason / no recovery Job
UAE ERA: offseason / no recovery Job
```

Completion evidence:

- all five systems have explicit reviewed dispositions;
- HKJC and UAE are not misclassified as missing coverage;
- no Canonical/public/deployment write occurred.

## Stage DA-01 — canonical contract and documentation

Status: foundation merged in PR #556; stable-delivery correction current.

Canonical documents:

```text
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-roadmap-addendum.md
docs/calendar/daily-acquisition-operations.md
```

Current completion condition:

```text
contract, schedule, operation, machine-readable policy,
activation status, and workflow delivery behavior agree
```

## Stage DA-02 — season-aware live planner state

Status: complete in PR #557.

Implemented artifacts:

```text
scripts/timetable/build-calendar-live-planner-state.mjs
data/static/calendar-system-season-state-v1.json
```

Accepted behavior:

- uses committed public data rather than test fixtures;
- requires a reviewed active/offseason/unknown state covering the planning date;
- creates tail-only gaps for active systems;
- creates no gap for offseason systems;
- fails closed on missing or expired reviewed season state;
- accepts an explicit reviewed Retry Queue when supplied;
- performs no network request or authoritative data write.

## Stage DA-03 — generated-plan runner compatibility

Status: complete implementation in PR #556; operating evidence pending.

Implemented interfaces:

```text
plan-actions-multi-job.mjs --plan-file=<Due-job-or-Collection-Plan>
summarize-actions-multi-job.mjs --plan-file=<Due-job-or-Collection-Plan>
```

Acceptance requires a real daily plan to flow through compilation and summary without fixture substitution.

## Stage DA-04 — separate execution authorization

Status: complete implementation in PR #556; operating evidence pending.

Implemented artifacts:

```text
data/static/calendar-daily-acquisition-policy-v1.json
scripts/timetable/daily-acquisition-policy.mjs
scripts/timetable/validate-daily-acquisition-plan.mjs
scripts/check-calendar-daily-acquisition-policy.mjs
```

Accepted boundary:

- Due-job policy remains planning-only;
- hosted execution requires exact system/reason/mode/runner/executor permission;
- JRA hosted execution is rejected;
- Banei regular refresh and coverage-gap execution are rejected;
- reviewed Banei selected-meeting rank retry remains eligible;
- approval, promotion, publication, merge, and deployment remain false.

## Stage DA-05 — scheduled hosted acquisition

Status: workflow merged; first auditable activation result pending.

Workflow:

```text
.github/workflows/calendar-daily-acquisition.yml
```

Schedule:

```text
03:17 UTC daily
12:17 JST daily
```

Required run behavior:

1. validate current contracts, policy, audit, and season states;
2. derive live planner state;
3. generate planning-only Due-job Plan;
4. compile hosted-capable Jobs;
5. authorize every hosted Job separately;
6. execute independent Jobs with `fail-fast: false`;
7. retain plans, statuses, summaries, candidates, Coverage, Manifest, partial outcomes, and source errors;
8. preserve JRA as a non-hosted exclusion;
9. perform no approval or publication action.

Completion condition:

```text
one main-branch activation, scheduled run, or manual dispatch
produces an auditable activation result and exact plan evidence
```

## Stage DA-06 — stable Draft PR delivery and activation evidence

Status: implementation correction current.

### Stable review surface

The branch and Draft PR are bootstrapped once by an explicit operator:

```text
branch: automation/calendar-daily-acquisition-review
Draft PR: #559
```

The unattended workflow must not create pull requests. It requires no `pull-requests: write` permission.

The final workflow Job may use `contents: write` only to push review-safe evidence to the existing branch.

### Activation-status artifacts

```text
data/static/calendar-daily-acquisition-activation-status.schema.json
scripts/timetable/write-calendar-daily-acquisition-status.mjs
scripts/check-calendar-daily-acquisition-activation-status.mjs

data/generated/timetable/daily-acquisition-status/latest.json
data/generated/timetable/daily-acquisition-status/runs/<github-run-id>.json
```

Every activation must record:

- source SHA and ref;
- run ID and attempt;
- trigger event;
- planning result;
- execution result;
- hosted Job count or null;
- plan ID or null;
- stable review branch;
- all publication side effects as false.

### Required scenarios

1. successful plan and hosted execution;
2. planning failure with execution skipped;
3. hosted execution failure with independent outcomes retained;
4. zero-hosted-Job activation;
5. JRA exclusion;
6. Banei regular-refresh rejection;
7. HKJC and UAE season suppression;
8. repeated run updates the same branch and Draft PR;
9. no pull-request creation permission;
10. no Canonical/public/deployment command.

Completion condition:

```text
Draft PR #559 receives status and exact plan evidence
for a real main-branch activation or scheduled run,
including failure or zero-Job outcomes
```

## Stage DA-07 — recovery candidates

Status: partially complete.

Completed in PR #558:

```text
JRA: 18 C-rank needs_review meeting identities
Banei: 3 C-rank needs_review meeting identities
```

The candidate records claim no first/final race time and no timetable rows. They remain outside Canonical and public projection.

Pending:

```text
NAR August hosted acquisition artifacts
source and coverage review for all recovery candidates
exact approval envelopes
```

## Stage DA-08 — reviewed Canonical and public recovery

Status: pending.

Required sequence:

```text
review JRA, NAR, and Banei recovery evidence
-> exact approved envelopes
-> Promotion Validation
-> Canonical promotion
-> deterministic public projection
-> bilingual rendered QA
-> publication PR merge
-> Cloudflare Pages deployment
```

This stage is separate from the daily workflow and Draft PR #559.

Completion condition:

```text
the reviewed public Calendar covers the required rolling window
through 2026-08-17 without fabricated detail
```

## Stage DA-09 — steady-state acceptance

Status: pending.

Acceptance requires:

- at least one successful activation or scheduled cycle;
- at least one failure or source-error result retained without cross-Job corruption;
- at least one zero-Job result retained;
- repeated updates to Draft PR #559;
- documented operator review procedure;
- explicit JRA local ownership;
- explicit Banei ordinary-refresh prohibition;
- explicit HKJC and UAE seasonal ownership;
- renewal of season-state windows before expiry;
- no unattended publication permissions;
- production freshness confirmed after reviewed publication.

Only after DA-09 may `WHR-CAL-DAILY-ACQUISITION` be marked complete.

## PR history and current sequence

```text
PR #556 — two-policy workflow foundation — merged
PR #557 — season-aware planning and current-horizon audit — merged
PR #558 — JRA and Banei recovery candidates — merged
PR #559 — stable daily human-review queue — open Draft, never auto-merged
current correction — activation status and stable-branch push delivery
next — NAR hosted recovery evidence
next — reviewed Canonical/public recovery
next — scheduled-cycle and steady-state acceptance
```

## Current decision

The workflow foundation, season-aware planner, recovery audit, and JRA/Banei candidates are implemented. The operating system is not accepted yet because no auditable daily activation status has reached Draft PR #559. The current correction removes reliance on automatic pull-request creation and makes every activation outcome visible on the pre-created stable review branch. A failed activation does not authorize publication and must remain visible for correction.

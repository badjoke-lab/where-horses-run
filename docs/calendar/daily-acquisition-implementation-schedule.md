# Calendar daily acquisition implementation schedule

Status: operating evidence accepted through reviewed publication; steady-state scheduled-cycle evidence pending  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Started: 2026-07-19  
Last reviewed: 2026-07-20  
Current stage: `DA-09` steady-state acceptance; first scheduled cron cycle pending

## Objective

Maintain the reviewed public Calendar through a bounded daily loop without enabling unattended publication:

```text
committed public horizon
+ reviewed system season states
-> planning-only Due-job Plan
-> separately authorized hosted acquisition
-> activation status and immutable review artifacts
-> stable review branch
-> Draft PR #559
-> human review
-> separate Promotion Validation and publication PR
```

The daily workflow does not authorize automatic approval, Canonical promotion, public projection, merge, or deployment.

## Stage DA-00 — current-horizon recovery audit

Status: complete in PR #557.

Evidence:

- all five maintained systems received explicit reviewed dispositions;
- JRA, NAR, and Banei recovery tails were recorded;
- HKJC and UAE were season-suppressed rather than misclassified as missing data;
- no Canonical, public, or deployment write occurred.

## Stage DA-01 — canonical contract and documentation

Status: complete through PRs #556, #560, #561, #562, and #563.

Canonical documents:

```text
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-roadmap-addendum.md
docs/calendar/daily-acquisition-operations.md
```

The contract, schedule, operating procedure, machine-readable policy, activation status, and stable review-branch behavior now agree.

## Stage DA-02 — season-aware live planner state

Status: complete in PR #557.

Accepted behavior:

- uses committed public timetable data rather than a fixed fixture;
- requires a reviewed active, offseason, or unknown state covering the planning date;
- creates tail-only gaps for active systems;
- creates no gap for offseason systems;
- fails closed on missing or expired reviewed season state;
- accepts an explicit reviewed Retry Queue when supplied;
- performs no network request or authoritative data write.

## Stage DA-03 — generated-plan runner compatibility

Status: complete with operating evidence in PRs #556, #561, and #562.

Evidence:

- a real Due-job Plan flowed directly into Actions compilation;
- exact Collection Jobs were retained beside runner execution specifications;
- generated Job IDs were dispatched explicitly rather than resolved through test fixtures;
- campaign summarization consumed the generated plan without fixture substitution.

## Stage DA-04 — separate execution authorization

Status: complete with operating evidence in PR #556 and subsequent activation runs.

Accepted boundary:

- the Due-job policy remains planning-only;
- hosted execution requires an exact system, reason, mode, runner, and executor match;
- JRA hosted execution is rejected;
- Banei regular refresh and coverage-gap execution remain rejected;
- reviewed Banei selected-meeting rank retry remains eligible;
- approval, promotion, publication, merge, and deployment remain false.

## Stage DA-05 — scheduled hosted acquisition

Status: implementation and main-branch activation evidence complete.

Workflow:

```text
.github/workflows/calendar-daily-acquisition.yml
```

Schedule:

```text
03:17 UTC daily
12:17 JST daily
```

Operating evidence:

- run `29693356460`: planning failure retained; execution skipped;
- run `29693662687`: planning succeeded; two generated NAR Jobs exposed the fixture-only dispatcher defect;
- run `29695247741`: planning succeeded; two NAR hosted Jobs succeeded;
- run `29695788437`: successful repeated stable-branch delivery after artifact-layout correction.

The successful NAR acquisition produced 51 August meeting candidates, two Coverage Observations, two collection reports, two retry-target files, and two independent Job status records.

## Stage DA-06 — stable Draft PR delivery and activation evidence

Status: complete with repeated operating evidence.

Stable review surface:

```text
branch: automation/calendar-daily-acquisition-review
Draft PR: #559
```

Accepted behavior:

- the unattended workflow does not create pull requests;
- only the final evidence-delivery Job has bounded `contents: write` permission;
- planning failure, execution failure, success, and zero-hosted-Job states are representable;
- exact planner state, Due-job Plan, Actions Plan, campaign summary, status, Coverage, reports, retry targets, and candidate batches are retained when available;
- Draft PR #559 remains open, Draft, review-only, and must not be merged merely because it changed.

Real evidence already retained in PR #559 includes planning failure, execution failure, successful repeated activation, two successful NAR Jobs, and the full review-safe August NAR package.

## Stage DA-07 — recovery candidates

Status: complete.

Reviewed evidence:

```text
NAR:   51 Rank C meeting identities, 2026-08-01 through 2026-08-17
JRA:   18 Rank C meeting identities on 2026-08-01, 02, 08, 09, 15, and 16
Banei:  3 Rank C Obihiro meeting identities, 2026-08-15 through 2026-08-17
Total: 72 unique Rank C meeting identities
```

All records remained date-and-racecourse-only candidates. No first or final race time, per-race row, participant, betting, result, payout, prediction, raw source body, or direct stream URL was introduced.

## Stage DA-08 — reviewed Canonical and public recovery

Status: complete in PR #564.

Completed sequence:

```text
source and coverage review
-> exact approved Rank C envelopes
-> dry-run Promotion Validation
-> Canonical promotion
-> deterministic public projection
-> derived operations artifact regeneration
-> bilingual rendered QA
-> reviewed squash merge
-> normal Cloudflare Pages deployment
-> one-shot production HTTP verification
```

Result:

- 72 reviewed Rank C records were added;
- the public meeting list contains 241 meetings;
- the recovered public window reaches 2026-08-17;
- English and Japanese production Calendar pages display the final-day Obihiro meeting at Rank C;
- the final-day Rank C section exposes no first or final race time;
- the one-shot verification PR #565 was closed without merge after its temporary workflow was removed.

## Stage DA-09 — steady-state acceptance

Status: partially complete; first real scheduled cron cycle remains pending.

Completed acceptance evidence:

- successful main-branch activation;
- retained planning and execution failure evidence without cross-Job corruption;
- repeated updates to Draft PR #559;
- documented operator review and publication procedure;
- explicit JRA local-primary ownership;
- explicit Banei regular-refresh prohibition;
- explicit HKJC and UAE seasonal ownership;
- no unattended publication permissions;
- reviewed production freshness confirmed after publication.

Remaining evidence:

1. retain one real zero-hosted-Job activation after the recovered horizon removes NAR and Banei coverage gaps;
2. retain one successful execution from the scheduled `03:17 UTC` cron trigger rather than a merge-push activation.

The acceptance gate must not be marked complete merely because the workflow is capable of these states. The evidence must appear in Draft PR #559.

## PR history

```text
PR #556 — two-policy workflow foundation — merged
PR #557 — season-aware planning and current-horizon audit — merged
PR #558 — JRA and Banei recovery candidates — merged
PR #559 — stable daily human-review queue — open Draft, never auto-merged
PR #560 — stable review-branch delivery and activation status — merged
PR #561 — plan diagnostics and retained failure evidence — merged
PR #562 — generated Collection Job dispatch — merged
PR #563 — review artifact delivery correction — merged
PR #564 — reviewed Canonical/public horizon recovery — merged
PR #565 — one-shot production verification — closed without merge
```

## Current decision

The Calendar is no longer a static release with an unimplemented maintenance loop. Daily planning, authorized hosted acquisition, stable human review, reviewed publication, and production recovery have real evidence.

`WHR-CAL-DAILY-ACQUISITION` remains in `DA-09` only because the naturally scheduled cron cycle and the recovered zero-hosted-Job state have not yet both been retained as operating evidence. No source permission or publication boundary is broadened to obtain that evidence.

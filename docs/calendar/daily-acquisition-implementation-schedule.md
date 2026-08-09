# Calendar daily acquisition implementation schedule

Status: active implementation schedule  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Started: 2026-07-19  
Last reviewed: 2026-08-09  
Current stage: `DA-09` steady-state acceptance and publication-freshness operation; DA-08 recovery through 2026-09-06 complete

## Objective

Maintain a reviewed rolling Calendar without unattended publication:

```text
committed public horizon
+ reviewed system season states
-> planning-only Due-job Plan
-> separately authorized hosted acquisition
-> activation status and immutable review artifacts
-> stable review branch / Draft PR #559
-> human source and rank review
-> separately reviewed Promotion Validation
-> Canonical/public projection
-> rendered QA
-> reviewed publication merge
-> production freshness verification
```

Automatic approval, Canonical promotion, public projection, merge, and deployment remain prohibited in the daily workflow.

## Stage DA-00 — initial current-horizon recovery audit

Status: complete in PR #557; retained as a historical 2026-07-19 baseline.

The July audit proved the original five-system dispositions and the recovery requirement through 2026-08-17. `scripts/check-calendar-current-horizon-recovery.mjs` now treats that audit as historical evidence and allows current public data to advance beyond the July floor.

## Stage DA-01 — canonical contract and documentation

Status: complete; current operational wording aligned through the August recovery.

Canonical documents:

```text
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-roadmap-addendum.md
docs/calendar/daily-acquisition-operations.md
```

## Stage DA-02 — season-aware live planner state

Status: implemented and extended on 2026-08-08.

Accepted behavior:

- uses committed public data rather than fixed test fixtures;
- requires exactly one reviewed season-state window for the planning date;
- supports multiple non-overlapping reviewed season windows for one system;
- creates tail-only gaps for active systems;
- suppresses ordinary collection during offseason;
- if a reviewed future `active` window begins inside the rolling horizon, creates a gap only for that future active interval;
- fails closed on missing, overlapping, or expired reviewed season state;
- performs no network request or publication write.

August 8 proof:

```text
HKJC on 2026-08-08: offseason
reviewed future active start: 2026-09-06
planned wake-up gap: 2026-09-06..2026-09-07 only
UAE next active start: 2026-10-22, outside the current 30-day window
```

## Stage DA-03 — generated-plan runner compatibility

Status: complete and operating.

Real generated Collection Jobs are passed explicitly to executors. Fixture lookup is compatibility fallback only. This was proven during the July NAR activation sequence and is used by scheduled daily runs.

## Stage DA-04 — separate execution authorization

Status: complete and operating.

Current boundary:

- NAR hosted acquisition is allowed for declared refresh, coverage, retry, and revalidation modes;
- HKJC hosted bounded fixture acquisition is allowed when a reviewed active interval is due;
- JRA hosted execution remains excluded; reviewed local acquisition is required;
- Banei ordinary refresh, coverage-gap, and source-revalidation execution remain disabled;
- reviewed Banei selected-meeting rank retry remains eligible;
- no execution policy grants approval or publication authority.

South Korea KRA candidate generation introduced by PR #568 is not silently added to this daily execution policy. Any future KRA daily scheduling requires a separate reviewed policy/Registry decision after the public promotion unit.

## Stage DA-05 — scheduled hosted acquisition

Status: complete and operating.

Workflow:

```text
.github/workflows/calendar-daily-acquisition.yml
```

Schedule:

```text
03:17 UTC daily
12:17 JST daily
```

Observed evidence includes successful scheduled NAR acquisition on 2026-08-08. The daily system continued running after the July publication and correctly accumulated review artifacts in Draft PR #559.

## Stage DA-06 — stable Draft PR delivery and activation evidence

Status: complete and operating.

Stable review surface:

```text
branch: automation/calendar-daily-acquisition-review
Draft PR: #559
```

Draft PR #559 is an operating queue and must not be merged merely because automation updated it.

Every activation records:

- source SHA/ref and run identity;
- trigger event;
- plan and execution result;
- hosted Job count and plan identity;
- stable review branch;
- publication side effects as false;
- public-horizon freshness:
  - `public_horizon_end_date`;
  - `required_horizon_end_date`;
  - `publication_review_required`.

The freshness signal was added after the August 8 incident exposed a gap between successful acquisition and stalled human publication review.

## Stage DA-07 — recovery candidates and source review

Status: complete for the 2026-08-08 through 2026-09-06 recovery window.

Reviewed new Rank C identities:

```text
JRA:   18 meetings, 2026-08-22 through 2026-09-06
NAR:   69 meetings, 2026-08-18 through 2026-09-06
Banei:  8 meetings, 2026-08-22 through 2026-09-06
HKJC:   1 meeting, Sha Tin on 2026-09-06
Total: 96 meetings
```

All recovery envelopes are deliberately capped at Rank C:

- meeting date and racecourse only;
- no first/final race time;
- no per-race rows;
- no race names, distances, surfaces, runners, odds, results, payouts, predictions, raw HTML, or stream URLs.

Source acquisition and approval generation are reproducible through:

```text
scripts/timetable/build-calendar-august-2026-recovery-approved-candidates.mjs
data/generated/timetable/horizon-recovery-2026-08-08/
```

## Stage DA-08 — reviewed Canonical and public recovery

Status: complete in PR #567.

Verified and completed:

```text
new approved identities: 96
public meeting count after recovery: 337
public maximum meeting date: 2026-09-06
new public rank: C only
```

Completion sequence executed:

```text
normal repository CI
-> bilingual rendered QA
-> reviewed PR #567 merge
-> normal Cloudflare production deployment
-> production freshness verification
```

PR #567 also added the reviewed Mizusawa public timetable identity and made current racecourse/page/SEO validation growth-aware while retaining historical v1 audit snapshots.

## Stage DA-09 — steady-state acceptance

Status: active operating acceptance; not closed as a reason to stop monitoring publication freshness.

The August 8 incident established an additional acceptance requirement: a successful acquisition cycle is insufficient when the reviewed public horizon is stale.

Steady-state acceptance requires and now operates with:

- successful scheduled acquisition evidence;
- failure/source-error evidence retained without cross-Job corruption;
- repeated updates to Draft PR #559;
- explicit JRA local ownership;
- explicit Banei ordinary-refresh prohibition;
- reviewed seasonal ownership for HKJC and UAE;
- renewal of season-state windows before expiry;
- no unattended publication permission;
- every activation exposes whether the public 30-day horizon is complete;
- `publication_review_required=true` is treated as an operator action item, not a green steady state;
- production freshness is confirmed after each reviewed horizon publication.

DA-09 is the ongoing acceptance/operations stage. It does not block separately reviewed source expansion, but every new system must be explicitly added to Registry/execution policy before daily acquisition may schedule it.

## Source expansion handoff

The active Calendar expansion sequence is governed by:

```text
docs/project-roadmap-2026-08-09-addendum.md
docs/calendar/implementation-roadmap-2026-08-09-addendum.md
```

Current source-expansion Work ID:

```text
WHR-CAL-SOUTH-KOREA-KRA
```

PR #568 completed KRA Rank C candidate generation for 32 meetings. Its next gate is public timetable identity review for Busan-Gyeongnam and Jeju followed by a separate human-reviewed promotion unit. KRA is not automatically enrolled into the daily scheduled-execution policy by that candidate-generation merge.

## PR history

```text
PR #556 — two-policy daily workflow foundation — merged
PR #557 — season-aware planning and July horizon audit — merged
PR #558 — JRA/Banei July recovery candidates — merged
PR #559 — stable daily human-review queue — open Draft, never auto-merged
PR #560 — stable branch delivery correction — merged
PR #561 — plan/output diagnostics correction — merged
PR #562 — explicit generated Collection Job dispatch — merged
PR #563 — review-artifact delivery correction — merged
PR #564 — reviewed public recovery through 2026-08-17 — merged
PR #567 — reviewed recovery through 2026-09-06 + future-season wake-up + stale-publication signal — merged
PR #568 — South Korea KRA Rank C candidate generator — merged; separate from daily execution policy
```

## Current decision

Daily acquisition was not the component that stopped between July 19 and August 8. The review queue continued receiving scheduled evidence, but no reviewed publication continuation was performed, so production remained at the August 17 horizon. PR #567 restored the reviewed horizon through September 6 and made publication freshness visible on every daily activation without weakening the mandatory human publication boundary.

From this point, daily acquisition remains an operating maintenance programme while source expansion proceeds through separate reviewed units. Any change to automatic approval, Canonical promotion, public projection, merge, deployment, or source enrollment requires an explicit contract/policy decision rather than being inferred from adapter capability.

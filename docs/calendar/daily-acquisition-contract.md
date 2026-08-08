# Calendar daily acquisition review contract

Status: active canonical operating contract  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Last reviewed: 2026-08-08

## Purpose

This contract defines the reviewed daily acquisition system used to keep the public Calendar horizon maintainable without enabling unattended publication.

The system connects:

```text
Due-job policy
+ committed public meeting horizon
+ reviewed system season windows
+ Acquisition Registry
+ runner compatibility
+ daily acquisition execution policy
+ source-specific adapters
-> validated daily Collection Plan
-> independently authorized hosted acquisition Jobs
-> immutable review artifacts and activation status
-> stable human-review branch
-> Draft PR #559
```

The unattended system ends at the human-review boundary.

## Two-policy boundary

The Due-job policy is planning-only. It does not itself authorize source execution or publication.

Scheduled hosted execution is authorized separately by:

```text
data/static/calendar-daily-acquisition-policy-v1.json
```

A hosted Job may run only when its exact system, reason, collection mode, runner, and executor are allowed. Automatic approval, automatic Canonical promotion, automatic public projection, automatic merge, and automatic deployment must remain false.

## Reviewed season-window boundary

Reviewed state is supplied by:

```text
data/static/calendar-system-season-state-v1.json
```

One system may have multiple **non-overlapping** reviewed windows, for example:

```text
HKJC offseason: through 2026-09-05
HKJC active:    from 2026-09-06
```

For the planning date, exactly one reviewed record must resolve for every system in the Due-job policy. Missing, overlapping, or expired reviewed state fails closed.

A reviewed season record contains:

```text
system identity
active / offseason / unknown
bounded effective window
next known meeting date when available
checked date
official source
review note
```

Season state controls planning only. It never approves candidate data or changes public output.

## Offseason and future-season wake-up rule

Ordinary acquisition is suppressed while the planning date is `offseason`.

However, if all of the following are true:

1. a later non-overlapping reviewed record for the same system is `active`;
2. that future active window begins inside the current rolling planning horizon;
3. the system's Due-job rule permits coverage-gap planning;
4. the Registry profile supports bounded date-window acquisition;

then the planner may create a coverage gap **only for the future active interval**.

Example reviewed on 2026-08-08:

```text
HKJC current state: offseason
future active start: 2026-09-06
30-day required horizon: through 2026-09-06 inclusive
allowed wake-up gap: 2026-09-06..2026-09-07
forbidden gap: any 2026-08 offseason date
```

An `unknown` state is never converted to active automatically.

## Coverage-gap rule

For a currently active system, the live-state builder may propose only a tail gap after the latest committed public meeting date.

For a currently offseason system, it may propose no ordinary gap. The only exception is the reviewed future-season wake-up rule above.

The planner must not:

- invent internal holes because no meeting exists on an individual date;
- interpret one omitted date as cancellation;
- infer that a season continues from historical meetings alone;
- collect offseason dates simply because the 30-day window crosses them;
- infer a future active period without a reviewed season window.

## Required daily flow

```text
03:17 UTC / 12:17 JST scheduled trigger
-> load committed public horizon and reviewed season windows
-> derive live planner state
-> generate planning-only Due-job Plan
-> compile GitHub Actions-capable Jobs
-> validate hosted Jobs against the separate execution policy
-> preserve exclusions and failures explicitly
-> execute authorized hosted Jobs independently
-> retain plans, statuses, source errors, partials, candidates, Coverage, and Manifest evidence
-> write activation status
-> push review-safe evidence to the stable review branch
-> expose evidence through Draft PR #559
```

Planning and bounded acquisition may be automated. Approval and publication are not.

## Runner and source-policy boundary

The Acquisition Registry, reviewed season state, Due-job policy, runner compatibility, and daily execution policy are jointly authoritative.

Current reviewed behavior:

```text
JRA:
  active where scheduled
  planning allowed
  hosted execution excluded
  reviewed local acquisition/import required

NAR:
  active where scheduled
  authorized hosted date-window/source-horizon/retry/revalidation acquisition allowed

Banei:
  active where scheduled
  ordinary regular refresh / coverage-gap / source-revalidation execution disabled
  reviewed selected-meeting rank retry only under the ordinary daily policy

HKJC:
  ordinary acquisition suppressed while offseason
  reviewed future active interval may create a bounded season-wake-up Job

UAE:
  season windows remain reviewed
  not currently in the daily Due-job policy
  no automatic wake-up execution is authorized merely from season state
```

Executor capability alone does not activate a prohibited source path.

## Stable review branch contract

The stable review branch is:

```text
automation/calendar-daily-acquisition-review
```

It backs Draft PR #559.

The branch and PR are bootstrapped by an explicit operator. The unattended workflow must not require `pull-requests: write` and must not create, close, ready, merge, or delete pull requests.

The final review-delivery Job may use `contents: write` only to push review-safe evidence to the existing review branch. It must not push approved Canonical/public publication output.

Draft PR #559 is an operating queue and must not be merged merely because automation updated it.

## Activation-status contract

Every main-branch activation, scheduled run, or manual dispatch produces an activation-status record, including planning failure, execution failure, and zero-Job outcomes.

The schema is:

```text
data/static/calendar-daily-acquisition-activation-status.schema.json
```

The stable review branch stores:

```text
data/generated/timetable/daily-acquisition-status/latest.json
data/generated/timetable/daily-acquisition-status/runs/<github-run-id>.json
```

Status binds:

- source commit and ref;
- workflow run identity and attempt;
- event type;
- planning result;
- execution result;
- hosted Job count or null;
- plan identity or null;
- fixed review branch;
- publication freshness;
- explicit false values for automatic approval, Canonical write, public projection, automatic merge, and deployment.

## Publication-freshness contract

Every activation must calculate:

```text
publication_freshness.public_horizon_end_date
publication_freshness.required_horizon_end_date
publication_freshness.publication_review_required
```

For the 30-day Calendar, `required_horizon_end_date` is the activation date plus 29 calendar days.

If the committed public horizon ends before the required horizon:

```text
publication_review_required: true
```

This is an operator alert, not permission to auto-publish.

A green acquisition result with `publication_review_required=true` is **not** a complete maintenance cycle.

This rule was added after the 2026-08-08 review found that scheduled acquisition had continued successfully while production remained on the 2026-07-19 public projection ending 2026-08-17.

## Review-artifact contract

When planning succeeds, the review branch may contain:

- retained planner state and exact Due-job / Collection / Actions Plans;
- campaign summaries;
- independent Job status records;
- source-specific candidate batches;
- Coverage and Manifest artifacts;
- explicit source errors and partial results.

Only public-safe review artifacts may be pushed. Raw source bodies, secrets, cookies, credentials, participant data, betting data, results, payouts, predictions, and direct stream URLs remain prohibited.

## Mandatory prohibitions

The daily scheduled system must not:

- approve a candidate;
- mark human review complete;
- automatically promote to Canonical;
- automatically project public timetable data;
- merge a publication PR;
- deploy the site;
- delete existing meetings because one acquisition omitted them;
- fabricate missing race times or timetable rows;
- downgrade reviewed rank through ordinary refresh;
- infer active season state without reviewed evidence;
- publish raw source bodies, credentials, cookies, odds, results, payouts, predictions, participants, or direct stream URLs.

## Failure behavior

- Missing, invalid, overlapping, or expired reviewed season state stops planning.
- Planning or authorization failure prevents source execution.
- One independent Job failure must not cancel other Jobs.
- `source_error` remains `source_error`.
- A shorter observed source horizon remains partial coverage, not fabricated completeness.
- No hosted Job is an auditable zero-Job activation.
- Non-hosted JRA work remains visible as an exclusion.
- Planning and execution failures are still delivered to Draft PR #559.
- Review-branch push failure fails the workflow.
- No failure path writes Canonical or public data.

## Human review and publication continuation

When Draft PR #559 or the freshness signal indicates review work is due, the reviewed continuation is:

```text
human source and coverage review
-> exact approved candidate envelope
-> Promotion Validation
-> Canonical promotion
-> deterministic public projection
-> bilingual rendered QA
-> merge of a separate publication PR
-> normal Cloudflare production deployment
-> one production freshness check
```

## Completion gate

`WHR-CAL-DAILY-ACQUISITION` is accepted only when all of the following remain evidenced:

1. live planner state is derived without fixture substitution;
2. required systems have valid reviewed season windows;
3. ordinary offseason dates are suppressed;
4. a reviewed future active window inside the rolling horizon creates only a bounded wake-up gap;
5. generated Collection Plans are consumed directly by runners;
6. every hosted Job passes separate execution authorization;
7. NAR independent outcomes are retained;
8. Banei ordinary refresh remains prohibited;
9. JRA hosted exclusion remains explicit;
10. Draft PR #559 receives activation evidence without PR-creation permission;
11. success, failure, partial, and zero-Job outcomes remain auditable;
12. every activation reports publication freshness;
13. `publication_review_required=true` cannot be treated as a completed maintenance cycle;
14. no automatic approval, Canonical write, public projection, merge, or deployment occurs;
15. rolling-horizon recovery is reviewed separately before publication;
16. production freshness is checked after reviewed publication;
17. the implementation schedule and roadmap identify this Work ID and boundary.

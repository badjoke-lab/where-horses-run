# Calendar daily acquisition review contract

Status: proposed canonical operating contract  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Last reviewed: 2026-07-19

## Purpose

This contract defines the reviewed daily acquisition system used to keep the public Calendar horizon maintainable without enabling unattended publication.

The system connects:

```text
Due-job policy
+ committed public meeting horizon
+ reviewed system season states
+ Acquisition Registry
+ runner compatibility
+ daily acquisition execution policy
+ source-specific adapters
-> validated daily Collection Plan
-> independently authorized hosted acquisition Jobs
-> immutable review artifacts and activation status
-> stable human-review branch
-> existing Draft PR #559
```

The system ends at the human-review boundary.

## Two-policy boundary

The Due-job policy remains planning-only. Its machine-readable boundary continues to require:

```text
artifact_only: true
jobs_executed: false
automatic_approval: false
automatic_promotion: false
automatic_publication: false
automatic_deployment: false
```

Scheduled hosted execution is authorized separately by:

```text
data/static/calendar-daily-acquisition-policy-v1.json
```

That execution policy may authorize only exact combinations of system, reason, collection mode, runner, and executor. It must keep automatic approval, promotion, publication, merge, and deployment disabled. A generated Actions Plan must pass the execution-policy validator before any Job starts.

## Reviewed season-state boundary

The planner must not infer that a system is active merely because it had a meeting during a recent fixed lookback period.

Current reviewed state is supplied by:

```text
data/static/calendar-system-season-state-v1.json
```

Each maintained system record must declare:

```text
system identity
active / offseason / unknown
bounded effective window
next known meeting date when available
checked date
official source
review note
```

The live-state builder must fail closed when a required system has no reviewed record covering the planning date. It must not silently reuse an expired season state.

An `offseason` system must produce:

```text
season_state: offseason
coverage_gaps: []
```

A season-state record permits or suppresses planning only. It does not approve candidate data or change public output.

## Required daily flow

```text
03:17 UTC scheduled trigger
-> load committed public horizon and reviewed season states
-> derive current planner state
-> validate planner state
-> generate planning-only Due-job Plan
-> extract Collection Plan
-> compile GitHub Actions-capable Jobs
-> validate every hosted Job against the daily execution policy
-> preserve non-hosted or unauthorized Jobs as explicit exclusions or failures
-> execute authorized hosted Jobs independently
-> summarize success / partial / source_error / not_run
-> write activation status for every run outcome
-> push review-safe evidence to the stable review branch
-> expose it through existing Draft PR #559
```

Planning and bounded acquisition are automated. Approval and publication are not.

## State inputs

The daily planner state may use only reviewed or committed control inputs:

- committed public meeting-list horizon;
- reviewed system season-state records;
- reviewed `last_checked_date` values;
- Acquisition Registry profiles;
- Due-job policy;
- daily acquisition execution policy;
- an explicit reviewed Rank-aware Retry Queue when supplied;
- the workflow planning timestamp.

The implementation must not infer cancellation or an individual missing meeting from silence in one source run.

## Coverage-gap rule

The live-state builder may propose only a tail coverage gap after the latest committed meeting date for a system whose reviewed state is `active`.

Example:

```text
committed latest meeting: 2026-07-31
required rolling horizon: through 2026-08-18 exclusive
reviewed season state: active
proposed gap: 2026-08-01 through 2026-08-18 exclusive
```

It must not:

- create internal holes merely because no meeting exists on an individual date;
- create a coverage gap for an `offseason` system;
- convert `unknown` into `active` without reviewed evidence;
- interpret the last public meeting date as proof that a season continues.

## Runner and source-policy boundary

The Acquisition Registry, reviewed season state, Due-job policy, and daily execution policy are jointly authoritative.

- `github_actions` Jobs may execute only when all four layers permit the exact Job.
- local-primary Jobs remain excluded from hosted execution.
- reviewed-import Jobs remain human-controlled.
- no workflow may silently substitute a runner outside Registry and compatibility rules.
- executor capability does not by itself enable a system's regular scheduled refresh.
- active season state does not override a source-specific execution prohibition.

Current reviewed behavior for the 2026-07-19 through 2026-08-17 window:

```text
JRA: active; due work may be planned, but hosted execution is excluded; local/reviewed path required
NAR: active; authorized hosted acquisition is supported within declared modes and reasons
Banei: active; regular refresh remains disabled; only reviewed selected-meeting rank retry is authorized
HKJC: offseason; no coverage gap and no due Job
UAE ERA: offseason; outside the daily Due-job policy and no recovery Job in this window
```

## Stable review branch contract

The stable review branch is:

```text
automation/calendar-daily-acquisition-review
```

It backs Draft PR #559.

The branch and Draft PR are created once by an explicit operator action. The unattended workflow must not require `pull-requests: write` and must not create, close, reopen, ready, merge, or delete a pull request.

The workflow may use `contents: write` only in the final review-delivery Job to push review-safe evidence to the existing branch. It must not push Canonical timetable data, public projection data, approval decisions, or deployment state.

A later activation updates the same branch and Draft PR. It must not open one PR per day.

## Activation-status contract

Every main-branch activation, scheduled run, or manual dispatch must produce an activation-status record, including when:

- planning succeeds;
- planning fails;
- hosted execution succeeds;
- one or more hosted Jobs fail;
- execution is skipped because no hosted Job exists.

The schema is:

```text
data/static/calendar-daily-acquisition-activation-status.schema.json
```

The stable review branch stores:

```text
data/generated/timetable/daily-acquisition-status/latest.json
data/generated/timetable/daily-acquisition-status/runs/<github-run-id>.json
```

The status must bind:

- source commit and ref;
- workflow run identity and attempt;
- event type;
- planning result;
- execution result;
- hosted Job count or null when planning failed;
- plan identity or null when planning failed;
- the fixed review branch;
- explicit false values for automatic approval, Canonical write, public projection, automatic merge, and deployment.

A zero-Job activation still updates status and retained plans. It must not fabricate candidate artifacts.

## Review-artifact contract

When planning succeeds, the review branch may contain:

- retained planner state and exact Due-job and Actions Plans;
- campaign summaries;
- independent Job status records;
- source-specific candidate batches;
- Coverage and Manifest artifacts;
- explicit source errors and partial results.

Only public-safe, review-boundary artifacts may be pushed. Raw source bodies, secrets, cookies, credentials, participant data, betting data, results, payouts, predictions, and direct stream URLs remain prohibited.

## Mandatory prohibitions

The scheduled system must not:

- approve a candidate;
- mark human review complete;
- perform automatic Canonical promotion;
- perform automatic public projection;
- write public meeting-list or meeting-detail projection files;
- create or merge its own PR;
- deploy the site;
- delete existing meetings because one acquisition run omitted them;
- fabricate missing race times or timetable rows;
- downgrade a reviewed rank through an ordinary refresh;
- infer an active season from recent historical meetings alone;
- publish raw source bodies, credentials, cookies, odds, results, payouts, predictions, participants, or direct stream URLs.

## Failure behavior

- Missing, invalid, or expired reviewed season state stops planning.
- Planning or validation failure stops all execution.
- Execution-policy rejection stops all execution before source access.
- One independent Job failure must not cancel other Jobs.
- `source_error` remains `source_error`.
- A valid shorter source horizon remains partial coverage, not fabricated completeness.
- No hosted Job is recorded as an auditable zero-Job activation.
- Excluded JRA or other non-hosted work remains visible in the plan and campaign summary.
- Planning and execution failures must still be delivered to the stable review branch as activation status.
- Review-branch push failure fails the workflow and requires corrective operation.
- No failure path writes Canonical or public data.

## Human review and publication continuation

After Draft PR #559 receives new evidence, the existing reviewed publication pipeline remains:

```text
human review
-> exact approved candidate envelope
-> Promotion Validation
-> Canonical promotion
-> deterministic public projection
-> rendered QA
-> merge of a separate publication PR
-> Cloudflare Pages deployment
```

Draft PR #559 is an operating queue. It must not be merged merely because the workflow updated it.

## Completion gate

`WHR-CAL-DAILY-ACQUISITION` is complete only when all of the following are evidenced:

1. live planner state is derived without fixture input;
2. all required systems have current reviewed season-state records;
3. offseason systems create no coverage gap or due Job;
4. Due-job Plan validation passes against current Registry and planning policy;
5. generated Collection Plans can be consumed directly by the Actions runner;
6. every hosted Job passes the separate daily execution policy;
7. hosted NAR Jobs preserve independent outcomes and HKJC is correctly suppressed while offseason;
8. Banei regular refresh is rejected while reviewed selected-meeting retry remains eligible;
9. JRA local-primary exclusion is explicit;
10. stable review branch and Draft PR #559 exist before unattended delivery;
11. main-branch activation or scheduled run updates activation status on the stable review branch;
12. success, failure, and zero-hosted-Job outcomes remain auditable;
13. the workflow requires no pull-request write permission;
14. no automatic approval, Canonical write, public projection, merge, or deployment occurs;
15. the rolling horizon recovery run is reviewed separately before publication;
16. the canonical roadmap and implementation schedule identify this Work ID and boundary.

# Calendar daily acquisition review contract

Status: proposed canonical operating contract  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Last reviewed: 2026-07-19

## Purpose

This contract defines the reviewed daily acquisition system used to keep the public Calendar horizon maintainable without enabling unattended publication.

The system connects the already implemented components:

```text
Due-job policy
+ committed public meeting horizon
+ Acquisition Registry
+ runner compatibility
+ daily acquisition execution policy
+ source-specific adapters
-> validated daily Collection Plan
-> independently authorized hosted acquisition Jobs
-> immutable review artifacts
-> one human-review draft PR
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

## Required daily flow

```text
03:17 UTC scheduled trigger
-> derive current planner state
-> validate planner state
-> generate planning-only Due-job Plan
-> extract Collection Plan
-> compile GitHub Actions-capable Jobs
-> validate every hosted Job against the daily execution policy
-> preserve non-hosted or unauthorized Jobs as explicit exclusions or failures
-> execute authorized hosted Jobs independently
-> summarize success / partial / source_error / not_run
-> create or update one draft review PR
```

Planning and bounded acquisition are automated. Approval and publication are not.

## State inputs

The daily planner state may use only reviewed or committed control inputs:

- committed public meeting-list horizon;
- reviewed `last_checked_date` values;
- Acquisition Registry profiles;
- Due-job policy;
- daily acquisition execution policy;
- an explicit reviewed Rank-aware Retry Queue when supplied;
- the workflow planning timestamp.

The initial implementation must not infer cancellation or an individual missing meeting from silence in one source run.

## Coverage-gap rule

The initial live-state builder may propose only a tail coverage gap after the latest committed meeting date for a system.

Example:

```text
committed latest meeting: 2026-07-31
required rolling horizon: through 2026-08-18 exclusive
proposed gap: 2026-08-01 through 2026-08-18 exclusive
```

It must not create internal holes merely because no meeting exists on an individual date.

## Runner and source-policy boundary

The Acquisition Registry, Due-job policy, and daily execution policy are jointly authoritative.

- `github_actions` Jobs may execute only when all three layers permit the exact Job.
- local-primary Jobs remain excluded from hosted execution.
- reviewed-import Jobs remain human-controlled.
- no workflow may silently substitute a runner outside Registry and compatibility rules.
- executor capability does not by itself enable a system's regular scheduled refresh.

Current expected behavior:

```text
JRA: due work may be planned, but hosted execution is excluded; local/reviewed path required
NAR: authorized hosted acquisition is supported within declared modes and reasons
Banei: regular refresh remains disabled; only reviewed selected-meeting rank retry is authorized
HKJC: authorized hosted bounded schedule acquisition is supported
UAE ERA: not yet in the daily Due-job policy; seasonal disposition remains operator-controlled
```

## Review PR contract

The scheduled workflow maintains one draft PR on:

```text
automation/calendar-daily-acquisition-review
```

The draft PR may contain only review-boundary artifacts produced by supported acquisition Jobs, including:

- retained planner state and exact Due-job and Actions Plans;
- Job status records;
- source-specific candidate batches;
- Coverage and Manifest artifacts;
- campaign summaries;
- explicit source errors and partial results.

A later run may update the same open draft PR. It must not create one unattended PR per day when an existing review PR is open.

## Mandatory prohibitions

The scheduled system must not:

- approve a candidate;
- mark human review complete;
- perform automatic Canonical promotion;
- perform automatic public projection;
- write public meeting-list or meeting-detail projection files;
- merge its own PR;
- deploy the site;
- delete existing meetings because one acquisition run omitted them;
- fabricate missing race times or timetable rows;
- downgrade a reviewed rank through an ordinary refresh;
- publish raw source bodies, credentials, cookies, odds, results, payouts, predictions, participants, or direct stream URLs.

## Failure behavior

- Planning or validation failure stops all execution.
- Execution-policy rejection stops all execution before source access.
- One independent Job failure must not cancel other Jobs.
- `source_error` remains `source_error`.
- A valid shorter source horizon remains partial coverage, not fabricated completeness.
- Missing hosted-capable Jobs produces no draft PR mutation.
- Excluded JRA or other non-hosted work remains visible in the plan and campaign summary.
- No failure path writes Canonical or public data.

## Human review and publication continuation

After the draft PR is generated, the existing reviewed publication pipeline remains:

```text
human review
-> approved candidate envelope
-> Promotion Validation
-> Canonical promotion
-> deterministic public projection
-> rendered QA
-> merge
-> Cloudflare Pages deployment
```

This continuation is outside the scheduled daily acquisition workflow.

## Completion gate

`WHR-CAL-DAILY-ACQUISITION` is complete only when all of the following are evidenced:

1. live planner state is derived without fixture input;
2. Due-job Plan validation passes against current Registry and planning policy;
3. generated Collection Plans can be consumed directly by the Actions runner;
4. every hosted Job passes the separate daily execution policy;
5. hosted NAR and HKJC Jobs preserve independent outcomes;
6. Banei regular refresh is rejected while reviewed selected-meeting retry remains eligible;
7. JRA local-primary exclusion is explicit;
8. a main-branch activation or scheduled run creates or updates a draft review PR;
9. no automatic approval, Canonical write, public projection, merge, or deployment occurs;
10. source-error and no-hosted-job scenarios are tested;
11. the rolling horizon recovery run is reviewed separately before publication;
12. the canonical roadmap and implementation schedule identify this Work ID and boundary.

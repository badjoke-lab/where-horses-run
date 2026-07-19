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
+ source-specific adapters
-> validated daily Collection Plan
-> independent hosted acquisition Jobs
-> immutable review artifacts
-> one human-review draft PR
```

The system ends at the human-review boundary.

## Required daily flow

```text
03:17 UTC scheduled trigger
-> derive current planner state
-> validate planner state
-> generate Due-job Plan
-> extract Collection Plan
-> compile GitHub Actions-capable Jobs
-> preserve non-hosted Jobs as explicit exclusions
-> execute hosted Jobs independently
-> summarize success / partial / source_error / not_run
-> create or update one draft review PR
```

Planning and acquisition are automated. Approval and publication are not.

## State inputs

The daily planner state may use only reviewed or committed control inputs:

- committed public meeting-list horizon;
- reviewed `last_checked_date` values;
- Acquisition Registry profiles;
- Due-job policy;
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

## Runner boundary

The Acquisition Registry remains authoritative.

- `github_actions` Jobs may execute in the scheduled workflow.
- local-primary Jobs remain excluded from hosted execution.
- reviewed-import Jobs remain human-controlled.
- no workflow may silently substitute a runner outside Registry and compatibility rules.

Current expected behavior:

```text
JRA: planned when due, excluded from hosted execution, local/reviewed path required
NAR: hosted acquisition supported
Banei: hosted acquisition supported within declared modes
HKJC: hosted bounded schedule acquisition supported
UAE ERA: only declared supported source-horizon or selected-meeting modes may be planned
```

## Review PR contract

The scheduled workflow maintains one draft PR on:

```text
automation/calendar-daily-acquisition-review
```

The draft PR may contain only review-boundary artifacts produced by supported acquisition Jobs, including:

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
- promote candidate data into Canonical data;
- write public meeting-list or meeting-detail projection files;
- merge its own PR;
- deploy the site;
- delete existing meetings because one acquisition run omitted them;
- fabricate missing race times or timetable rows;
- downgrade a reviewed rank through an ordinary refresh;
- publish raw source bodies, credentials, cookies, odds, results, payouts, predictions, participants, or direct stream URLs.

## Failure behavior

- Planning or validation failure stops all execution.
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
2. Due-job Plan validation passes against current Registry and policy;
3. generated Collection Plans can be consumed directly by the Actions runner;
4. hosted NAR, Banei, and HKJC Jobs preserve independent outcomes;
5. JRA local-primary exclusion is explicit;
6. a scheduled run creates or updates a draft review PR;
7. no automatic approval, Canonical write, public projection, merge, or deployment occurs;
8. source-error and no-hosted-job scenarios are tested;
9. the rolling horizon recovery run is reviewed separately before publication;
10. the canonical roadmap and implementation schedule identify this Work ID and boundary.

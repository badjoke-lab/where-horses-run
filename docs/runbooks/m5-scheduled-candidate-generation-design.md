# M5 scheduled candidate generation design

Status: adopted design for the current roadmap PR-088  
Scope: design only; no scheduler, cron, promotion, public write, merge, or deployment is enabled by this document.

## 1. Purpose

M5 must reduce the amount of manual work required to keep Calendar candidate data fresh without weakening the existing review and publication boundaries.

The scheduled path therefore stops at **review-required candidate generation**. It may collect or derive public-safe candidate data from a source that is already authorized for that country, but it must not approve, promote, publish, merge, or deploy the result.

The required pipeline remains:

```text
official source
  -> bounded source fetch / reviewed source input
  -> country adapter
  -> candidate artifact
  -> validation
  -> human review
  -> separately controlled promotion
  -> Canonical timetable / public projection
  -> site display
```

A scheduled run implements only the portion through candidate validation.

## 2. Non-goals

PR-088 does not authorize or implement any of the following:

- GitHub Actions `schedule` / cron activation;
- automatic candidate approval;
- invocation of a promotion command from a scheduled generation job;
- Canonical timetable writes;
- public timetable projection writes;
- public racecourse identity writes;
- automatic pull-request merge;
- deployment;
- rank promotion;
- storage or republication of raw HTML/body, full racecards, participants, jockeys, trainers, owners, odds, results, payouts, predictions, tips, or stream URLs;
- treating a historical/manual seed as proof that a current source remains usable;
- treating an out-of-window candidate as current coverage.

Implementation of dry-run execution/logging starts in PR-089. GitHub Actions dry-run scheduling is a later PR-092 gate.

## 3. Existing implementation boundaries that the scheduler must preserve

### South Korea / KRA

The current KRA adapter is `scripts/timetable/kra-calendar-plan-adapter.mjs`.

It consumes a reviewed KRA plan, emits `timetable-candidate-v1`, caps the candidate at Rank C, leaves race times null and timetable rows empty, and leaves review status pending. The adapter does not publish.

For scheduled-generation purposes KRA is therefore **eligible only through an explicitly supported current/reviewed input contract**. Scheduling must not silently convert the existing reviewed 2026 plan into a claim of perpetual freshness.

### Turkey / TJK

The current collector is `scripts/timetable/tjk-current-future-candidates.mjs`.

It starts from the verified YarisSever daily-programme landing, follows only official page-discovered venue-detail links, excludes past dates, retains no raw response body, and emits a candidate-only batch with review required and both Canonical/public writes false.

TJK is therefore eligible for a future scheduled dry-run while this route contract remains verified. Route drift, host/path drift, invalid provenance, source failure, or validation failure must stop the run without creating a publication-capable result.

### Morocco / SOREC

The current source-test disposition is `pending_blocked`.

The official racing page and seven racecourses are verified, but a stable public official meeting/programme route is not. Current/future candidate generation is explicitly false and the adapter remains blocked.

SOREC is therefore **not eligible for scheduled candidate generation**. A scheduler must record/return a blocked disposition rather than fabricate Rank C meetings or infer dates from racecourse identity alone. Eligibility can change only after a separate reviewed source-verification and bounded-adapter change.

## 4. Scheduler eligibility model

Every country/source pair must resolve to one of these states before source execution:

| State | Meaning | Scheduled candidate generation |
| --- | --- | --- |
| `eligible` | Current bounded source/adapter contract is reviewed and the requested mode is allowed | May run candidate generation |
| `reviewed_input_only` | Adapter depends on a reviewed snapshot/plan rather than a current live source | May run only when an explicit in-window reviewed input is supplied |
| `offseason` | Reviewed season state says there is no expected current coverage | No source run; record a visible no-op disposition |
| `blocked` | Source route or adapter is not verified for current use | Must fail closed / record blocked; no candidate |
| `disabled` | Operations policy forbids ordinary scheduled execution | No source run |

Eligibility is an operations decision, not an inference from technical capability rank. A source being technically A or A+ does not authorize scheduled execution or public output.

## 5. Invocation contract

The scheduling layer must resolve all time-dependent values once and pass explicit values into the generator/collector. The deterministic generation layer must not decide its own hidden moving window when a reproducible argument can be supplied.

A future invocation record must bind at least:

- country ID;
- authority/source ID;
- adapter/collector ID and version or source commit SHA;
- requested run mode;
- resolved window start and end;
- reference timezone;
- one `run_at` timestamp;
- source route/entrypoint identity where applicable;
- execution eligibility state;
- output partition or artifact identity.

If a collector currently derives `today` from `new Date()`, the scheduled wrapper must supply the single captured `run_at`/clock input rather than allowing multiple time reads to disagree.

## 6. Candidate output contract

A successful scheduled generation result must remain a review artifact.

The output must:

- identify the country, source/authority, adapter and covered window;
- retain source provenance sufficient to reproduce or review the claim without retaining prohibited raw bodies;
- use stable ordering and stable identifiers where the underlying adapter supports them;
- state that human review is required;
- keep approval/reviewer fields empty or pending;
- state Canonical/public write effects as false where the schema supports those fields;
- validate against the applicable candidate and country-boundary checks before the run is considered successful;
- contain no hidden promotion instruction or implicit write target.

A generated candidate is not public evidence merely because generation succeeded.

## 7. Run-log boundary for PR-089

PR-089 will add dry-run generation logs. Volatile execution metadata belongs in the run log rather than being allowed to make an otherwise deterministic candidate payload change unnecessarily.

The future log should be able to distinguish at least:

- `success_candidate_generated`;
- `success_no_candidates` when the source is valid and an empty result is explicitly acceptable;
- `offseason_noop`;
- `blocked_source`;
- `disabled_by_policy`;
- `source_error`;
- `route_or_provenance_error`;
- `parse_error`;
- `candidate_validation_error`.

An empty candidate set must not automatically count as successful freshness. Each adapter/source contract must explicitly say whether zero candidates is valid for the resolved window.

## 8. Fail-close rules

The scheduled path must stop before producing a usable candidate artifact when any required condition fails.

At minimum, fail closed on:

- source/adapter not eligible for the requested mode;
- unverified or changed source route where the adapter requires a fixed/discovered route contract;
- non-success HTTP response;
- unexpected host, protocol, path, redirect target, or content type;
- missing required provenance;
- stale or future-window mismatch;
- malformed or contradictory date/racecourse identity;
- parser inconsistency or duplicate identity;
- candidate schema failure;
- public-rank boundary violation;
- prohibited field leakage;
- unexpected file/output path;
- attempt to invoke promotion, Canonical/public write, merge, or deploy from the generation job.

Failures must remain reviewable as logs/evidence but must not be transformed into guessed timetable records.

## 9. Information-retention boundary

Scheduled acquisition must follow the existing public/private handling rules.

Allowed retained artifacts are limited to reviewed public-safe derived fields, bounded provenance, hashes/identifiers where already supported, candidate JSON, validation results, and run metadata required for auditability.

The scheduled layer must not introduce a new durable raw-source archive. In particular it must not save or commit full HTML/body, racecard content, participants, betting data, results/payouts, predictions/tips, credentials, or stream material merely to make automation easier.

TJK's existing `raw_body_retained: false` behavior is the model to preserve.

## 10. Idempotence and output partitioning

Where a source snapshot is stable, the same country/source, adapter version, resolved window, and source evidence should produce the same semantic candidate payload.

Volatile fields such as workflow run ID, attempt, start/end timestamps, and elapsed time belong in the run log.

Future implementation must partition outputs so overlapping runs cannot silently overwrite one another. A partition must include enough identity to distinguish at least country/source and resolved window or run identity.

If two runs target the same logical partition, the later run must compare/replace through an explicit deterministic rule or fail rather than racing on a shared output path.

## 11. Concurrency boundary

The later GitHub Actions implementation must use a bounded concurrency policy. Two unattended jobs must not simultaneously mutate the same candidate/review branch or artifact partition.

PR-088 does not select the final Actions concurrency key, but PR-092 must bind it to the scheduled candidate-generation scope and must not cancel a human-review/promotion operation as a side effect.

## 12. Human review and promotion separation

Human review remains a separate gate after candidate validation.

The scheduled generation job must not call promotion code, including existing promotion commands or any future equivalent. Promotion must require a separately reviewable input/decision surface and remain able to reject pending, stale, contradictory, or policy-unsafe candidates.

A future automated PR may carry candidates to the human review surface, but opening/updating that PR is not approval and is not publication. PR-091 defines that runbook; PR-093 defines the human-review workflow.

## 13. Public display boundary

M5 automation does not change the timetable publication ranks.

- Rank C: meeting date + racecourse identity only.
- Rank A: race label/number + post time may be public.
- Rank A+: richer reviewed structured fields belong only on the applicable meeting detail surface.

Automation must never increase a candidate/public rank merely because a source exposes more fields. Technical capability, candidate ceiling, reviewed public rank, and actual public projection remain separate concepts.

The following remain outside the public timetable boundary: full racecards, horses/participants, jockeys, trainers, owners, weights/form, odds, betting material, results, payouts, predictions/tips, raw source bodies, and stream URLs.

## 14. Follow-on roadmap gates

PR-088 establishes only this contract.

- **PR-089 — Dry-run generation logs:** implement deterministic, reviewable run-result logging around candidate generation without publication.
- **PR-090 — Candidate diff page:** expose a human-reviewable difference surface between candidate state and the reviewed/public baseline without approving changes.
- **PR-091 — Auto PR generation runbook:** define how candidate artifacts can be carried to a review PR without auto-approval, auto-merge, or publication.
- **PR-092 — GitHub Actions dry-run:** add the actual bounded Actions dry-run/schedule path under the contract in this document.
- **PR-093 — Human review workflow:** make the approval/rejection step explicit and auditable.
- **PR-094 — Stale data warning:** make freshness/staleness visible instead of treating old reviewed data as current.
- **PR-095 — M5 release:** release only after the complete candidate -> review -> separately controlled publication boundary is proven.

## 15. PR-088 acceptance criteria

PR-088 is complete when:

1. scheduled generation is explicitly limited to candidate generation/validation;
2. KRA, TJK and SOREC are represented with their different current eligibility states rather than a single blanket country switch;
3. human review remains mandatory;
4. promotion, Canonical/public writes, merge and deployment are prohibited from the scheduled-generation job;
5. fail-close behavior covers source drift, invalid provenance, parsing/schema/policy errors and prohibited-field leakage;
6. raw source/body retention is not expanded;
7. deterministic time/window and output-partition requirements are defined;
8. PR-089 through PR-095 can implement their scopes without changing these publication boundaries.

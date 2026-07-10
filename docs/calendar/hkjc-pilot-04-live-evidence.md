# HKJC PILOT-04 live evidence decision

Status: completed evidence review; schedule path accepted, full Registry profile remains provisional  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-04`  
Last reviewed: 2026-07-10

## Purpose

PILOT-04 resolves the `parser_failure` outcome recorded by PILOT-03 for the bounded August 2026 HKJC fixture window.

The reviewed structure probe showed that the official source can return a valid HKJC fixture/calendar shell with no meeting markers for the requested month while exposing a contiguous next-season fixture navigation sequence. The bridge therefore now distinguishes:

```text
meeting markers parsed
valid empty season-gap window
parser failure
```

The empty-window classification remains fail closed. A zero-meeting response is accepted only when the source shell and contiguous navigation evidence satisfy the bounded HKJC-specific rule documented in `hkjc-live-fixture-artifact-bridge.md`.

## Reviewed live run

The repeated shared-Actions live run used:

```text
workflow run: 29102195265
batch: nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001
window: 2026-08-01 <= date < 2026-08-29
runner: github_actions
executor: hkjc-live-fixture-actions
```

Reviewed result:

```text
coverage_claim: source_window_complete
records_discovered: 0
records_updated: 0
source_error_count: 0
valid_empty_months: 2026-08
job_status: success
envelope_review_state: needs_review
publication_effect: none
protected state hash check: pass
repository clean after cleanup: true
```

All C/B/B+/A/A+ rank counts are zero because the reviewed window is a valid empty season gap, not a meeting-bearing source window.

## Registry decision

The schedule path decision is:

```text
accept_evidence_backed_schedule_path_keep_full_profile_provisional
```

The current HKJC Registry profile continues to use:

```text
primary_runner: github_actions
fallback_runner: local
schedule_source_id: hkjc-fixture-list
schedule_adapter_id: hkjc-fixture-artifact-bridge-v1
supported observation ranks: C
date-window support: true
```

The repeated live evidence now supports the current schedule source and adapter route operationally.

The overall profile remains `provisional` because the current Registry contract defines an `active` profile as a complete schedule and detail path. HKJC still intentionally has:

```text
detail_source_id: null
detail_adapter_id: null
```

PILOT-04 does not invent detail capability, does not activate A or A+, and does not raise the public ceiling above A.

## Next unit

The next implementation unit is:

```text
HKJC-PILOT-05
HKJC artifact-only timetable detail adapter migration
```

Goal:

Migrate only the reviewed public-safe parts of the quarantined `fetch-hkjc-racecards.mjs` and `normalize-hkjc-racecards.mjs` logic into a bounded artifact-only detail acquisition path.

The new path must emit current review-boundary artifacts and must not restore the legacy direct source-to-canonical/public chain.

Required outputs before any detail activation decision:

- timetable candidate envelope;
- Coverage Observation;
- Collection Result Manifest;
- review state/artifacts;
- explicit rank classification from observed public-safe fields;
- protected-state immutability proof;
- cleanup and clean-worktree proof.

## Safety boundary

PILOT-04 and PILOT-05 preserve:

- no scheduled acquisition execution;
- no automatic Queue mutation;
- no automatic approval;
- no automatic promotion;
- no automatic publication;
- no canonical write;
- no public write;
- no deployment;
- no participant data;
- no betting or odds data;
- no results or payouts;
- no predictions or tips;
- no raw HTML or source-body persistence;
- no embedded video;
- no direct stream URLs.

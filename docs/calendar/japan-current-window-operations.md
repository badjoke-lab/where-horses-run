# Japan current-window operations audit

Status: read-only operational audit  
Work ID: `WHR-CAL-JAPAN-CURRENT-WINDOW-OPERATIONS`  
Implementation unit: `JAPAN-CURRENT-WINDOW-01`  
Audit window: 2026-07-13 through 2026-08-11 (`end_date_exclusive: 2026-08-12`)  
Timezone: `Asia/Tokyo`

## Purpose

This audit compares JRA, NAR, and Banei in one explicit 30-day window.

It answers four separate questions for each system:

1. how many meetings currently exist in Canonical;
2. what reviewed ranks those meetings have;
3. which meetings are already A+ and which remain below A+;
4. which operating route is available to improve the lower-rank records.

It does not fetch official sources and does not modify data.

## Shared output

The audit produces one machine-readable artifact:

```text
calendar-japan-current-window-audit-v1
```

For each system it includes:

- Canonical meeting count;
- rank counts for C, B, B+, A, and A+;
- A+ target-ready count;
- below-A+ action-required count;
- first and last meeting dates in the window;
- latest source-check date present in Canonical;
- source IDs represented in the window;
- A+ meeting IDs;
- lower-rank meeting IDs;
- primary and fallback runners;
- executor and supported collection modes;
- selected-meeting and retry capability;
- the resulting operating state.

## Operating states

### `current_window_at_target_rank`

Every Canonical meeting in the selected window is reviewed at A+.

### `selected_meeting_retry_required`

At least one meeting is below A+, and the system has an evidence-backed selected-meeting retry route.

This state is valid for NAR and Banei when lower-rank records remain.

### `manual_refresh_required`

At least one meeting is below A+, but the shared control plane does not expose selected-meeting retry for the system.

This state is used for JRA. JRA remains local-primary with reviewed-import fallback.

### `no_canonical_meetings_in_window`

Canonical contains no meetings for the system in the selected window.

This does **not** mean that no official racing exists. It means only that the current Canonical dataset has no records for that system and window.

## System routes

### JRA

```text
primary runner: local
fallback: reviewed_import
executor: jra-refresh-local
entry point: scripts/timetable/refresh-jra.mjs
collection mode: date_window
selected-meeting retry: unavailable through shared control plane
target rank: A+
```

A lower-rank or empty current window requires a bounded local refresh or reviewed import. The audit does not pretend that the NAR/Banei retry route exists for JRA.

### NAR

```text
primary runner: github_actions
fallback: local
executor: nar-incremental-v2-actions
entry point: scripts/timetable/run-nar-incremental-v2-actions.mjs
collection modes: date_window, selected_meetings
rank-upgrade retry: enabled
target rank: A+
```

Canonical C records are valid schedule observations. They remain explicit retry targets until complete A+ detail is reviewed and promoted.

### Banei

```text
primary runner: github_actions
fallback: reviewed_import
executor: banei-schedule-detail-actions
entry point: scripts/timetable/run-banei-actions-job.mjs
collection modes: date_window, selected_meetings
rank-upgrade retry: enabled
target rank: A+
```

The observed source states may be B or A+. B meetings remain selected-meeting retry targets.

## Safety boundary

The audit has no network fetch and no write path.

Disabled:

- official-source fetch;
- automatic approval;
- automatic promotion;
- Canonical write;
- public write;
- automatic publication;
- deployment.

The workflow uploads the audit as a review artifact and proves that Canonical and public files are unchanged.

## Interpretation rule

The audit reports the state of the current repository, not a claim of full official coverage.

Therefore:

```text
no Canonical meeting
!=
no official meeting
```

and:

```text
Canonical C/B record
!=
source can never provide A+
```

Lower reviewed rank means only that higher-detail reviewed data has not yet been promoted for that meeting.

## Next action

The audit artifact determines the next bounded action:

- JRA: bounded local refresh or reviewed import;
- NAR: date-window collection and selected-meeting retry;
- Banei: date-window collection and selected-meeting retry.

Any resulting Candidate, Coverage Observation, Manifest, Review Queue, promotion, and public projection remain separate reviewed operations.

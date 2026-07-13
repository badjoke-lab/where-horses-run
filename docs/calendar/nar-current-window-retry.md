# NAR current-window selected-meeting retry

Status: review-only live campaign  
Work ID: `WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-RETRY`  
Implementation unit: `NAR-CURRENT-WINDOW-RETRY-01`  
Window: 2026-07-13 through 2026-08-11  
Selected Canonical scope: 66 NAR meetings currently reviewed at C

## Why this campaign exists

The Japan current-window audit found:

```text
NAR Canonical meetings: 66
C: 66
A+: 0
selected-meeting retry: available
```

These C records are valid schedule observations. They are not treated as failures and are not deleted. The campaign asks the official NAR detail route whether complete A+ timetable fields are now available.

## Selection rule

The campaign deterministically selects Canonical meetings that satisfy all conditions:

- country: Japan;
- authority: NAR / local government racing;
- date on or after 2026-07-13;
- date before 2026-08-12;
- current reviewed rank: C.

The expected selected scope is:

```text
66 unique meeting IDs
first date: 2026-07-13
last date: 2026-07-31
```

A count, date-boundary, authority, rank, or duplicate mismatch fails closed before any network operation.

## Collection Job

```text
system: japan-nar-system
runner: github_actions
mode: selected_meetings
target rank: A+
reason: rank_upgrade_retry
batch: nar-current-window-selected-retry-2026-07-batch-001
```

The existing evidence-backed NAR incremental v2 Actions operator is reused. No new parser or alternate source is introduced.

## Live review workflow

Workflow:

```text
Calendar NAR current-window retry
```

The workflow:

1. builds the exact 66-meeting scope from Canonical;
2. compiles the standard Collection Job and Runner Execution;
3. records Canonical and public file hashes;
4. queries the official NAR schedule/detail route in selected-meeting mode;
5. produces an immutable NAR incremental v2 batch;
6. validates Candidate, Collection Report, Coverage Observation, and Retry Targets;
7. records A+ candidates, remaining C candidates, blockers, unresolved meetings, and source errors;
8. uploads the complete review artifact;
9. proves Canonical and public files did not change;
10. removes generated workspace files and proves the repository is clean.

## Result interpretation

Every selected meeting must close into one reviewed acquisition state.

### A+ detail candidate

The official detail route exposed all required public-safe fields. The record remains `needs_review`; it is not automatically promoted.

### C schedule candidate

The official schedule identity remains valid, but complete detail is not yet available. The existing Canonical C record remains unchanged.

### Detail blocker / retry target

The workflow records why detail could not be completed and keeps the meeting in the explicit Retry Target set.

The result summary requires:

```text
A+ candidates + C schedule candidates = 66
retry targets = unresolved meetings
```

## Safety boundary

Disabled:

- automatic approval;
- automatic promotion;
- Canonical write;
- public write;
- automatic publication;
- deployment;
- raw HTML storage.

The live workflow may read official NAR pages and write temporary review artifacts in the Actions workspace. It has `contents: read` permission and cannot commit those artifacts.

## After the campaign

The artifact determines the next step:

- review and promote complete A+ candidates through the existing Pipeline v1 path;
- retain unresolved meetings at C;
- schedule another explicit retry only for the remaining unresolved set;
- never infer a downgrade from a lower-detail observation.

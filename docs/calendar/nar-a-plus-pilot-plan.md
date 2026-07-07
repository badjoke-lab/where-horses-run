# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Pilot audit month: 2026-07  
Current phase: July remainder review/promotion and runner transition  
Next Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Subsequent Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-08

## Governing contracts

This pilot follows:

- `docs/calendar/incremental-coverage-contract.md`;
- `docs/calendar/machine-readable-contracts.md`;
- `docs/calendar/acquisition-control-plane-contract.md`;
- `docs/calendar/acquisition-control-plane-implementation-plan.md`;
- `docs/calendar/implementation-roadmap.md`;
- `docs/calendar/nar-monthly-collection-contract.md`.

The NAR pilot must not introduce a NAR-only rule that ordinary updates require a complete calendar month before valid records can be reviewed or promoted.

The current C/A+ shape observed by NAR v2 must not redefine the shared Calendar rank model. The common operating model remains C/B/B+/A/A+.

## Scope

The NAR flat-racing scope is fourteen racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains a separate Banei Work ID.

Reviewed NAR detail through 2026-07-07 is already published. The July 2026 full-month path remains a bounded Completion Audit and pilot benchmark. It is not the normal promotion gate for later incremental batches.

## Shared acquisition model

NAR uses the common model:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

For NAR specifically:

- the official schedule source may establish racecourse/date meeting identity;
- RaceList and DebaTable provide A+ timetable detail when available and complete;
- a valid meeting may be published at C or any higher supported rank;
- future NAR source improvements may emit B, B+, or A and must use shared rank semantics;
- a meeting already supported at a higher rank must not be downgraded merely because a later run observes less detail;
- future or temporarily unavailable detail must not erase known meeting identity;
- ordinary runs may use arbitrary, overlapping, cross-month, or selected-meeting scopes;
- runner choice does not change batch, rank, coverage, review, or promotion semantics.

## Runner transition

Current implemented state:

```text
local v2 runner: available
bounded GitHub Actions acquisition: successful
formal workflow_dispatch normal operation: pending
```

Target profile after the formal workflow-dispatch path is merged and validated:

```text
primary runner: github_actions
fallback runner: local
```

Temporary diagnostic workflows must be closed without merge after their bounded purpose is complete.

The formal Actions workflow must remain review-only and must not approve, promote, write canonical/public data, or publish.

## Completed sequence

1. source architecture — complete;
2. route probe — complete;
3. candidate adapter — complete;
4. all-fourteen compatibility audit — complete;
5. complete fixture coverage 14/14 — complete;
6. first reviewed A+ promotion through 2026-07-04 — complete as valid partial data;
7. July full-month schedule collector and audit path — complete as pilot tooling;
8. generated full-month candidate PR validation — complete;
9. incremental coverage and Coverage Observation foundations — complete;
10. validation responsibility split — complete;
11. arbitrary/cross-month/selected-meeting v1 operator foundation — complete;
12. schedule-aware immutable v2 batch path — complete;
13. reviewed promotion and publication through 2026-07-07 — complete;
14. July 8–31 immutable review batch collection — complete.

## Current July 8–31 batch

The committed batch contains:

```text
schedule-confirmed meetings: 82
A+ detail candidates:         11
C schedule candidates:        71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

This batch is currently awaiting completion of review decision, approved candidate generation, promotion, projection, QA, and publication.

## Current sequence

1. finalize the exact review decision for the 82-meeting batch;
2. generate source-compatible approved promotion envelopes;
3. validate 11 A+ and 71 C promotion paths;
4. perform canonical promotion;
5. rebuild public projection;
6. run rendered bilingual QA and release checks;
7. publish reviewed output;
8. preserve pending meetings as retry work;
9. close temporary diagnostic PRs #430 and #435 without merge;
10. formalize NAR Actions manual dispatch;
11. retain local fallback;
12. hand NAR into the shared Acquisition Registry / Job / Plan / Review Queue / Retry Queue model.

## Source layers

The NAR official source architecture distinguishes:

1. Schedule source evidence for meeting existence;
2. RaceList and DebaTable evidence for timetable detail.

This does not force two physical publication steps. If one acquisition run produces complete higher-rank evidence for a meeting, that meeting may proceed directly through review and promotion at that supported rank.

A future scheduled meeting with unavailable detail may remain `scheduled_pending_details` when existence is known. A missing result from one run is only `not_observed` unless a reviewed complete schedule source establishes a stronger state.

Mizusawa and Himeji have no July 2026 meetings according to the reviewed July schedule audit. That conclusion is specific to that audited scope and must not be generalized to later arbitrary windows.

## Ordinary batch success conditions

An ordinary NAR incremental batch succeeds when:

- its requested and observed scopes are explicit;
- produced records pass Batch Validation;
- every record has stable identity and official source provenance;
- supported rank fields are internally complete;
- prohibited fields are absent;
- unresolved dates and meetings are reported rather than silently converted into no-meeting conclusions;
- partial coverage is labelled honestly;
- review remains required before canonical/public updates;
- unattended publication remains disabled.

The batch does not require the entire calendar month to be complete.

## Retry transition

Current NAR v2 retry artifacts record unresolved dates, meeting IDs, and reason counts.

The shared control-plane phase will convert this into rank-aware retry state containing at least:

```text
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
runner/adapter profile
backoff metadata
attempt history
```

NAR retry behavior must then be compatible with broad date-window retry, selected-meeting retry, and future rank-gap retries.

## July completion audit

The separate July 2026 Completion Audit may claim completion only when:

- exact audit window is 2026-07-01 through 2026-07-31;
- all fourteen racecourses are classified for that audit scope;
- every official July meeting date is represented or explicitly blocked;
- pending and unavailable states are explicit;
- no partial cutoff is misrepresented as month completion;
- public projection, bilingual QA, freshness, and rollback evidence pass.

Failure of the Completion Audit must not roll back or block unrelated valid partial batches already reviewed and promoted.

## Control-plane handoff

After the current NAR publication path:

```text
formal NAR Actions workflow
-> Acquisition Registry
-> Collection Job schema
-> Collection Plan schema
-> five-rank classifier contract
-> Collection Result Manifest
-> Review Queue
-> Rank-aware Retry Queue
-> shared Actions/local job semantics
```

Banei begins after the minimum shared control-plane foundation gate defined in `acquisition-control-plane-implementation-plan.md`.

# Banei A+ incremental plan and July completion audit

Status: queued after minimum control-plane foundation  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Pilot audit month: 2026-07  
Preceding shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Governing contracts

Banei follows:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
docs/calendar/validation-responsibility-contract.md
```

The Banei implementation must support irregular runs, arbitrary and overlapping date windows, selected-meeting retries where supported, partial source horizons, valid partial promotion batches, five-rank result semantics, and shared review/retry operations.

The July full-month check is a Completion Audit, not a gate on ordinary valid updates.

## Shared model

Banei uses the common model:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

A Banei meeting may enter at C or any higher reviewed rank supported by official source evidence.

The implementation must not force an artificial C-only publication step when the source directly supports B, B+, A, or A+.

B and B+ are first-class supported states even if early Banei observations later prove to cluster at other ranks.

## Control-plane handoff gate

Banei begins after the minimum shared foundation exists:

1. Acquisition Registry schema and initial Japan profiles;
2. Collection Job schema;
3. Collection Plan schema;
4. common C/B/B+/A/A+ classifier contract;
5. Review Queue foundation;
6. Rank-aware Retry Queue foundation;
7. runner-neutral batch/result semantics.

Banei does not need to wait for:

- full Actions matrix execution;
- complete local multi-job automation;
- automatic PR generation;
- due-job scheduler completion;
- Operations v2 UI completion.

This gate prevents both extremes:

```text
starting Banei with another isolated source-specific operating model
and
overbuilding the entire future automation stack before Banei begins
```

## Acquisition Registry entry

Before steady-state Banei acquisition, its profile must declare or explicitly mark pending:

```text
system_id
country_id
authority_id
primary_runner
fallback_runner
schedule_source_id
detail_source_id
schedule_adapter_id
detail_adapter_id
technical_capability_rank
collection_target_rank
public_ceiling
supported_observation_ranks
supported collection modes
rank-upgrade retry support
```

Runner choice must be based on actual source testing. Do not copy JRA local or NAR Actions assumptions into Banei without evidence.

## Separation from NAR flat racing

Banei remains a separate Work ID and parser path. Banei detail parsing must not inherit flat-racing assumptions for:

- surface;
- course direction;
- course label construction;
- distance interpretation beyond reviewed Banei semantics;
- terminology and race programme labels.

Only shared pipeline rules are inherited:

- stable identity;
- Collection Job/Plan semantics;
- review boundaries;
- arbitrary windows;
- partial success;
- overlap safety;
- Coverage Observation;
- five-rank classifier semantics;
- no implicit deletion;
- no accidental rank regression;
- Review Queue state;
- Rank-aware Retry Queue state;
- runner-neutral result semantics.

## Ordinary incremental sequence

1. register provisional Banei runner/source/adapter profile;
2. review official Schedule and Detail source responsibilities;
3. create Banei-specific fixture evidence and parser semantics;
4. implement arbitrary-window Schedule acquisition;
5. implement Detail acquisition or combined acquisition according to official source behavior;
6. record requested and observed scopes separately;
7. classify every observed meeting at the highest supported C/B/B+/A/A+ rank;
8. emit a Collection Result Manifest;
9. allow valid partial candidate batches;
10. place validated batches into Review Queue;
11. retain rank-aware retry targets for pending, unavailable, parser-failure, and rank-gap states;
12. review and promote valid records independently of unresolved meetings elsewhere;
13. continue irregular refreshes and overlapping retries through shared runner semantics;
14. complete freshness, rollback, and bilingual QA.

## Ordinary batch conditions

A valid Banei batch may contain:

- one meeting;
- several meetings;
- a partial month;
- a cross-month window;
- an overlapping retry window;
- selected meeting IDs when supported;
- all currently source-visible meetings;
- mixed observed ranks.

The batch succeeds when its produced records are valid and unresolved scope is reported honestly.

It does not require every July meeting to be available.

## Five-rank rules

The common order is:

```text
C < B < B+ < A < A+
```

Banei may emit any evidence-supported rank.

Examples:

```text
Schedule only -> C
Schedule + first race time -> B
Schedule + first and final race times -> B+
complete per-race post times -> A
A plus reviewed Banei-safe programme summary -> A+
```

A later retry may jump directly to the highest newly supported rank.

```text
C -> A
B -> A+
B+ -> A+
```

are valid when evidence supports the target rank.

## Absence and rank rules

Absence from one run is not cancellation or deletion.

A lower-detail later observation must not automatically overwrite a higher reviewed rank.

Examples:

```text
existing A+ + later schedule-only observation -> keep A+
existing A + later B+ observation -> keep A
existing B+ + later B observation -> keep B+
existing C + later reviewed A+ -> promote to A+
missing from one run -> keep prior reviewed record, update coverage/source-health state separately
```

Reviewed correction, cancellation/change evidence, source invalidation, publication-policy change, or rollback may still justify explicit revision through the separate corrective path.

## Rank-aware Retry Queue

Banei retry records should retain:

```text
meeting_id
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
retry_scope
runner profile
adapter profile
next eligible retry time
attempt count
last attempt time
```

Possible retry paths include:

```text
C -> B
C -> B+
C -> A
C -> A+
B -> B+
B -> A
B -> A+
B+ -> A
B+ -> A+
A -> A+
```

The queue must not assume every pending meeting is C waiting for A+.

## July 2026 Completion Audit

The separate July Completion Audit covers:

```text
2026-07-01 through 2026-07-31 inclusive
```

A July completion claim requires:

- every official July Obihiro Banei meeting represented or explicitly blocked;
- future or unavailable detail gaps explicit;
- no silent omissions;
- Banei terminology and course semantics independently validated;
- every available reviewed detail represented at the highest supported rank;
- public projection and bilingual QA pass;
- freshness and rollback evidence pass;
- partial cutoff output never treated as month completion.

An incomplete Completion Audit reports gaps and retry targets. It must not block unrelated valid Banei partial batches from review or promotion.

## Handoff from NAR and control plane

The handoff order is:

```text
NAR July remainder publication
-> NAR formal Actions manual dispatch
-> Acquisition Registry
-> Collection Job schema
-> Collection Plan schema
-> five-rank classifier contract
-> Review Queue foundation
-> Rank-aware Retry Queue foundation
-> shared runner-neutral result semantics
-> Banei implementation begins
```

Banei then becomes the first new source-specific pilot to enter the shared control-plane model from the start rather than being retrofitted later.

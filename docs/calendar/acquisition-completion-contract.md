# Calendar acquisition completion contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-COMPLETION`  
Last reviewed: 2026-09-11

## Purpose

This contract defines when one Calendar meeting acquisition cycle may be considered complete.

It closes a gap left by the five-rank Best Available model: deriving the correct rank from acquired evidence is necessary, but it does not by itself prove that the acquisition process pursued all currently applicable higher-detail evidence.

The core rule is:

```text
valid observed rank != acquisition completion
```

A meeting observed at `C`, `B`, `B+`, or `A` remains a valid Calendar record. It must not be blanked, dropped, or treated as invalid merely because a higher rank exists in the rank model.

However, obtaining one of those ranks must not by itself terminate higher-detail acquisition.

## Governing rank model

Observed evidence rank remains derived from actual normalized evidence:

```text
C < B < B+ < A < A+
```

This contract does not redefine rank requirements and does not authorize fabricated or inferred fields.

`deriveBestAvailableRank()` remains authoritative for the rank supported by evidence actually acquired.

## Completion invariant

For every implemented acquisition route, a meeting acquisition cycle may close only after the system evaluates every registered and currently applicable higher-detail acquisition path for that meeting.

Therefore:

```text
C obtained  -> not sufficient by itself to close acquisition
B obtained  -> not sufficient by itself to close acquisition
B+ obtained -> not sufficient by itself to close acquisition
A obtained  -> not sufficient by itself to close acquisition
A+ obtained -> no higher timetable rank remains to pursue
```

A lower rank may still be the correct final result for the current cycle when richer verified evidence is not currently obtainable.

## Required lower-rank disposition

Every `C`, `B`, `B+`, or `A` observation produced by an implemented route must end the cycle with one explicit disposition:

```text
promoted
complete_current_best_available
pending_publication
retry_required
implementation_gap
not_applicable
```

Meanings:

- `promoted`: a higher-detail path produced stronger evidence in the same acquisition cycle.
- `complete_current_best_available`: all registered applicable higher-detail paths were checked and no stronger verified evidence is currently obtainable.
- `pending_publication`: a known higher-detail source exists but the richer material is not yet published or not yet expected to be available; the meeting remains at its valid current rank and must be eligible for later re-evaluation.
- `retry_required`: a higher-detail path was applicable but could not be completed safely because of source, transport, parsing, validation, or equivalent acquisition failure; the current valid rank is preserved and retry work must remain explicit.
- `implementation_gap`: source capability or reviewed source research establishes a higher-detail acquisition path or attainable evidence level, but the production route does not yet have the required source/adapter/runner connection. This is not acquisition completion.
- `not_applicable`: the registered higher-detail route does not apply to this particular meeting or observation, and that non-applicability is explicitly established.

No implicit or default `success` value may substitute for one of these dispositions.

## Valid lower-rank completion

A cycle may validly close at `C`, `B`, `B+`, or `A`.

Examples:

```text
meeting source proves only date + venue
higher-detail official source checked and not yet published
=> observed rank C
=> disposition pending_publication
=> publish/retain C

first post time is available
no verified source currently exposes the final post time or race rows
all registered applicable routes checked
=> observed rank B
=> disposition complete_current_best_available
=> publish/retain B

complete race rows are available
registered official source does not expose the A+ metadata fields for this meeting
=> observed rank A
=> disposition complete_current_best_available
=> publish/retain A
```

The absence of stronger evidence does not make the current rank invalid.

## Prohibited terminal-success pattern

The following pattern is prohibited for every implemented Calendar route:

```text
some valid rank was emitted
-> job/workflow is green
-> no higher-detail applicability check occurs
-> acquisition is treated as complete
```

This prohibition applies equally to `C`, `B`, `B+`, and `A`.

It is not a C-specific rule.

## Registered-path rule

The Acquisition Registry must describe enough routing state to determine whether a lower-rank observation has unresolved higher-detail work.

If `technical_capability_rank` is above the observed rank, one of the following must be true before the cycle can close:

1. the same adapter/runner has already evaluated the stronger fields in the current cycle;
2. a registered detail source/adapter has been evaluated in the current cycle;
3. the route is explicitly pending publication and scheduled for re-evaluation;
4. the route failed and explicit retry work is recorded;
5. the higher-detail route is explicitly not applicable to this meeting;
6. the registry/source research is corrected because the claimed technical capability was not actually established.

If none is true, the state is `implementation_gap`.

A registry value such as `collection_target_rank: best_available` is not evidence that this completion invariant has been satisfied.

## Same-cycle and later-cycle enrichment

A source may support enrichment in either form:

```text
schedule discovery -> detail acquisition in the same run
```

or

```text
schedule discovery now -> detail publication later -> later refresh/retry
```

Both are valid.

What is not valid is losing the unresolved rank gap merely because the discovery step succeeded.

## Retry and re-evaluation

A lower-rank meeting must remain eligible for re-evaluation when its disposition is `pending_publication` or `retry_required`.

Re-evaluation may use the regular refresh path when that path actually revisits the required higher-detail evidence, or a Rank-aware Retry Queue when a dedicated retry route is required.

The implementation must not require artificial sequential promotion. Valid direct jumps include:

```text
C -> B+
C -> A
C -> A+
B -> A
B -> A+
B+ -> A+
```

## Collection success and coverage

The following are separate facts:

```text
meeting discovered
observed evidence rank
higher-detail evaluation disposition
collection job execution success
coverage completeness
review/promotion/publication state
```

A green workflow or zero parser errors proves execution success only. It does not prove that lower-rank meetings have satisfied this completion contract.

A collection result containing lower-rank meetings may be considered complete for the current cycle only when every such meeting has an explicit valid disposition under this contract.

## Preservation rule

Failure to obtain stronger evidence must not erase valid weaker evidence.

Therefore:

```text
C + detail failure -> retain C + retry_required
B + detail not yet published -> retain B + pending_publication
B+ + no richer applicable source -> retain B+ + complete_current_best_available
A + A+ parse failure -> retain A + retry_required
```

Do not replace these with an empty or "no meeting" state.

## Scope

This contract applies to:

- every currently implemented Calendar acquisition route;
- every future Calendar acquisition route when it becomes implemented;
- regular refreshes, near-date refreshes, selected-meeting retries, manual/reviewed import routes, and equivalent acquisition cycles.

It does not require auditing or implementing a tier that has no Calendar acquisition route yet. Unimplemented tiers must adopt this contract when their acquisition route is added.

## Implementation and CI requirement

Executable validation must reject at least these cases:

- an implemented route can emit `C`, `B`, `B+`, or `A` and mark the cycle complete without a higher-detail disposition;
- Registry claims a higher technical capability than the implemented observation path can pursue, with no registered/inline enrichment path and no explicit implementation-gap state;
- `pending_publication` or `retry_required` is silently dropped from future scheduling/retry eligibility;
- a lower-rank current result is blanked merely because higher-detail acquisition failed;
- a workflow reports acquisition completion solely from rank emission, HTTP success, or parser success.

Regression fixtures must cover at least one valid terminal case for each of `C`, `B`, `B+`, and `A`, plus direct promotion and retry-required cases.

## Relationship to existing contracts

Read this contract together with:

- `docs/calendar/acquisition-control-plane-contract.md`
- `docs/calendar/rank-aware-retry-queue.md`
- `docs/calendar/due-job-planner.md`
- `docs/calendar/collection-result-manifest.md`
- `docs/calendar/incremental-coverage-contract.md`
- `scripts/timetable/best-available-rank.mjs`

Where older wording permits a lower-rank observation to be interpreted as acquisition completion without the disposition required here, this contract controls for acquisition-completion semantics.

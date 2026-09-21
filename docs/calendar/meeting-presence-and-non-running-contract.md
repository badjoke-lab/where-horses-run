# Calendar meeting presence and confirmed non-running contract

Status: active canonical contract  
Work ID: `WHR-CAL-MEETING-PRESENCE`  
Last reviewed: 2026-09-21

## Purpose

This contract defines how Calendar acquisition, canonical acceptance, publication, Calendar lists, and Calendar Map must behave when a previously verified meeting is missing from a later official mother-set observation or is explicitly confirmed not to run.

This contract supersedes any older wording that permits public removal solely because a complete mother-set refresh no longer contains a previously published meeting.

## Core invariant

```text
source absence != confirmed non-running evidence
```

A successfully fetched and parsed mother set proves what the source currently exposes. It does not, by itself, prove that every omitted previously verified meeting will not run.

Therefore a previously accepted meeting must not be removed, downgraded, or have verified fields erased merely because it is absent from the latest mother set.

## Meeting-presence observations

The shared Calendar pipeline uses these semantic observations:

- `present`: current official positive evidence confirms the meeting for that local date.
- `absent_unconfirmed`: a previously accepted meeting is not present in the current successful mother-set observation, but no accepted official evidence confirms that it will not run.
- `confirmed_non_running`: accepted official evidence explicitly establishes that the meeting will not run on that local date.

Transport and parser outcomes remain separate acquisition state. `fetch_failed`, `parse_failed`, timeout, short response, blocked access, or equivalent acquisition failure must never be converted into either absence or non-running evidence.

## Negative-evidence requirement

`confirmed_non_running` requires positive evidence of non-running from an accepted official or reviewed-official route. Examples may include an authority or operator publishing an explicit cancellation, abandonment, postponement, withdrawal, or equivalent statement whose semantics establish that the meeting will not run on the represented date.

Authority-specific adapters own interpretation of their official terminology. The shared publication layer must not infer cancellation from disappearance and must not contain JRA-, HKJC-, or other authority-specific cancellation vocabulary.

Each negative-evidence observation must retain at least:

- `meeting_id`;
- the semantic disposition `confirmed_non_running`;
- `source_id`;
- official source URL or accepted evidence reference;
- observation/check time;
- review provenance when the evidence is reviewed rather than automated.

If an authority has no reliable implemented negative-evidence route, disappearance remains `absent_unconfirmed`.

## Canonical preservation

A meeting is not physically deleted from canonical evidence merely because it becomes `confirmed_non_running`.

Canonical evidence remains the durable record of previously accepted meeting facts and their provenance. Non-running evidence changes whether the meeting is an active/upcoming public occurrence; it is not permission to erase unrelated accepted timetable evidence.

A temporary acquisition failure or `absent_unconfirmed` observation:

- does not erase canonical values;
- does not lower Best Available rank;
- does not replace supporting provenance;
- does not advance successful-verification timestamps;
- does not become an exclusion.

Explicit correction/invalidation remains the only path that may replace accepted evidence under the canonical acceptance contract.

## Public projection

Publication must distinguish retained uncertainty from confirmed non-running:

| Observation | Public behavior |
| --- | --- |
| `present` | Project normally under rank and publication policy. |
| `absent_unconfirmed` | Preserve the existing verified public meeting and fields. |
| `confirmed_non_running` | Do not expose the meeting as an active/upcoming meeting for that date. Preserve canonical evidence. |
| acquisition/parser failure | Preserve the existing verified public meeting and fields. |

A reviewed exclusion for a false/invalid record is not the same semantic operation as `confirmed_non_running` for a real meeting that was scheduled and later will not run.

## Calendar and Map behavior

Calendar lists and Calendar Map must consume the same publication disposition. Neither UI may independently infer cancellation or meeting presence.

- `present`: normal Calendar row and normal meeting Map marker.
- future `absent_unconfirmed`: retain the previously verified Calendar row and meeting Map presence.
- same-day `absent_unconfirmed`: retain the meeting but expose a conservative user-facing confirmation-pending state rather than claiming confirmed current operation.
- `confirmed_non_running`: omit the meeting from active/upcoming Calendar lists and from that date's active meeting markers on the Map.
- past meetings naturally leave upcoming/current surfaces according to the normal date-window rules.

The racecourse entity itself is never removed from the racecourse master or general map merely because one dated meeting is non-running.

## Postponement and replacement dates

Calendar does not require a causal relationship between an old date and a replacement date.

If official evidence establishes that a meeting will not run on its original date, the original dated meeting may become `confirmed_non_running`.

If another date later appears as an official meeting, that date is acquired as a normal independent meeting with its own date-based `meeting_id`.

Do not infer a replacement date. A cancellation with no replacement is valid. A postponement with no announced new date is valid.

A future history feature may record causal relationships, but Calendar publication must not depend on them.

## Partial race cancellation

Cancellation of one or more races is not meeting-level `confirmed_non_running` when the meeting itself still runs.

If a revised official programme is acquired safely, ordinary timetable correction/update semantics apply. If revised detail cannot be acquired safely, existing verified values remain protected until accepted correction evidence is available.

## Authority rollout

Negative-evidence capability is incremental by authority/source family.

A source family may be:

1. automated: official machine-readable or reliably parsed non-running evidence is implemented;
2. reviewed: official non-running evidence can be accepted through the reviewed-evidence path;
3. unsupported: no reliable negative-evidence route is implemented, so disappearance remains `absent_unconfirmed`.

The Calendar must remain safe in state 3. Global rollout must not assume every authority publishes cancellations in the same form.

## Required regression cases

Validation must cover at least:

1. present meeting remains present;
2. complete mother set omits a previously verified meeting without negative evidence -> preserve;
3. omitted meeting later reappears -> normal projection resumes;
4. explicit official non-running evidence -> remove from active/upcoming Calendar and dated Map meeting state;
5. postponement with no replacement date -> original date not active; no invented new meeting;
6. later official new date -> acquire as an independent normal meeting;
7. fetch failure -> preserve;
8. parse failure -> preserve;
9. partial race cancellation -> do not suppress the whole meeting;
10. authority without negative-evidence support -> preserve on absence;
11. canonical evidence survives public non-running disposition;
12. Calendar and Map resolve the same publication disposition.

## Production migration rule

The existing Japan rule that can treat `complete mother set + absent` as reconcilable removal must not be generalized and must be replaced before production removal is enabled.

Until explicit non-running evidence is wired for a source family, the safe fallback is retention, not deletion.

This contract does not by itself activate a new production behavior. Code, fixtures, validators, and a production-equivalent full refresh must prove the implementation before the behavior is considered deployed.

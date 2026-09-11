# Calendar implementation roadmap — 2026-09-11 addendum

Status: active canonical addendum  
Last reviewed: 2026-09-11

This addendum records the current Calendar operating model on `main` after the 2026-09-11 acquisition-completion and field-publication changes. Where older Calendar roadmap/index wording conflicts with this addendum or the canonical contracts named below, this addendum and those contracts control.

## Governing contracts

Read Calendar implementation together with:

- `docs/calendar/acquisition-completion-contract.md`
- `docs/calendar/field-publication-and-diagnostics-contract.md`
- `scripts/timetable/best-available-rank.mjs`
- `scripts/timetable/acquisition-completion.mjs`
- `scripts/timetable/apply-official-rolling-observations.mjs`
- `src/data/publicationDisplayPolicies.json`

## Current rank model

The rank ladder remains exactly:

```text
C < B < B+ < A < A+
```

Rank is derived from normalized observed evidence for each meeting. It is not a fixed country, authority, collector, adapter, or source rank.

- `C`: meeting/date/racecourse evidence only.
- `B`: `C` plus a valid first-race time.
- `B+`: `B` plus a valid final-race time.
- `A`: continuous race rows with valid labels/numbers and post times.
- `A+`: `A` plus race name, distance, surface, and course metadata for every race row.

No `S` rank is introduced.

## Acquisition completion is separate from rank

A valid observed `C`, `B`, `B+`, or `A` is not terminal acquisition success by itself.

Before a lower-rank acquisition cycle can close, every registered and currently applicable higher-detail path for that meeting must be evaluated. The cycle must preserve an explicit disposition:

```text
promoted
complete_current_best_available
pending_publication
retry_required
implementation_gap
not_applicable
```

Consequences:

- a green workflow, successful HTTP request, zero parser errors, or valid rank emission does not prove acquisition completion;
- lower-rank evidence remains valid and must not be blanked merely because richer acquisition fails or is not yet published;
- `pending_publication` and `retry_required` remain eligible for later evaluation;
- a known stronger route that is not connected to production is `implementation_gap`, not successful completion;
- direct promotion such as `C -> A`, `C -> A+`, or `B -> A+` is valid when the evidence supports it.

## Field preservation and publication are independent from rank

Verified richer timetable fields are independent canonical evidence.

For `A` and `A+` details, the following fields must be retained independently when actually acquired:

```text
race_name
distance_m
surface
course_label
```

Missing one richer field must not erase verified sibling fields. A meeting may therefore remain `A` while retaining and publishing verified distance, surface, course, or race-name values.

`A+` remains the completeness classification requiring all governed richer fields on every race row.

The canonical publication-policy key is:

```text
detail_fields
```

with independent permissions for race name, distance, surface, and course. The older `a_plus_fields` concept is deprecated because richer-field visibility is not restricted to `A+` meetings.

## Publication ceiling remains separate

`max_public_rank` and `effective_public_rank` govern publication structure. They do not determine acquisition rank and do not erase stronger canonical evidence.

A canonical field may remain stored while publication policy denies that field. Conversely, an `A` meeting may publish an individually verified richer field when policy permits it.

## Operator diagnostics

Calendar acquisition diagnostics are operator-only and query-gated with:

```text
?diag=calendar
```

Normal public pages must not render the diagnostic block.

Diagnostics distinguish acquisition gaps from publication/projection gaps by exposing safe aggregate state including:

```text
meeting_id
canonical rank
effective public rank
acquisition disposition
row count
T = rows with valid race time
N = rows with race name
D = rows with distance
S = rows with surface
C = rows with course
```

Canonical and public coverage should be compared where available. Diagnostics must not expose unpublished rich values themselves.

## Readiness and historical backfill checks

Calendar Readiness remains source/system operational metadata. It does not determine the rank or acquisition-completion state of an individual meeting.

Historical `check-calendar-readiness-backfill-01-20.mjs`, `check-calendar-readiness-backfill-21-36.mjs`, and `check-calendar-readiness-backfill-37-52.mjs` checks are no longer part of the current validation surface. They must not be recreated as gates that freeze historical readiness-count mixtures or historical blocked/link-only states.

Current validation should protect the live contracts above: evidence-derived rank, explicit acquisition-completion disposition, preservation of valid lower-rank evidence, rank-independent verified-field persistence/publication, publication boundaries, and diagnostic gating.

## Implementation rule for future Calendar work

Every new or modified Calendar acquisition route must:

1. derive rank from the evidence actually observed;
2. evaluate registered applicable higher-detail paths before closing a lower-rank cycle;
3. preserve one explicit acquisition-completion disposition;
4. retain all verified canonical detail fields independently of whether the meeting reaches `A+`;
5. apply publication ceiling and per-field publication policy separately from acquisition;
6. keep pending/retry/gap meetings eligible for appropriate later work;
7. avoid using historical readiness backfill counts as a substitute for current acquisition correctness.

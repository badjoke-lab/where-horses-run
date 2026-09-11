# Calendar field publication and diagnostics contract

Status: active canonical contract  
Work ID: `WHR-CAL-FIELD-PUBLICATION-DIAGNOSTICS`  
Last reviewed: 2026-09-11

## Purpose

This contract separates four facts that must not be conflated:

```text
observed evidence rank
canonical field availability
per-field publication permission
operator diagnostics
```

There is no country-, authority-, source-, adapter-, collector-, or publication-policy rank ceiling.

The Calendar rank ladder remains:

```text
C < B < B+ < A < A+
```

This contract does not add an `S` rank and does not weaken the existing `A+` completeness requirement.

## Rank semantics

Rank is a completeness classification for one meeting observation and is derived from verified evidence actually present for that meeting.

- `C`: meeting/date-level evidence only.
- `B`: valid first race time.
- `B+`: valid first and last race times.
- `A`: continuous race rows with valid labels/numbers and post times.
- `A+`: `A` plus race name, distance, surface, and course metadata for every race row.

A meeting that has complete race rows and times but only partial programme metadata remains `A`.

Example:

```text
Time      12/12
Name       0/12
Distance  12/12
Surface   12/12
Course    12/12
=> observed evidence rank A
```

No source label or authority identity may change that result.

## One evidence-derived rank path

Canonical and public rank must start from the same evidence-derived result.

Prohibited patterns include:

```text
SOREC => max A
Chile => max A
HRI => max A
unknown source => max C
JRA/HKJC/KRA => max A+
```

Those are source/authority classifications, not meeting evidence.

The field `max_public_rank` is prohibited in the Calendar publication policy and generated public projection.

`effective_public_rank` may remain as a compatibility/output field while existing UI code uses it, but it must not encode an authority/source ceiling. It is the evidence-derived public rank after structural validation only. For example, an `A`/`A+` public detail claim may fall back when the required public timetable row structure is absent; it may not fall merely because a policy says the authority is limited to a lower rank.

## Field preservation invariant

Verified canonical fields are independent evidence.

Failure or absence of one richer field must not erase a different verified field from the same row.

Therefore this pattern is prohibited:

```text
race_name missing
-> meeting rank A instead of A+
-> distance/surface/course are deleted merely because the meeting is not A+
```

The correct canonical row may be partial:

```text
label: Race 1
post_time_local: 12:10
race_name: absent
distance_m: 1200
surface: Turf
course_label: Outer
```

The meeting remains rank `A`, while the verified distance, surface, and course values remain canonical evidence.

## Canonical persistence rule

For `A` and `A+` meeting details, canonical persistence must retain every normalized verified field that was actually acquired.

Canonical persistence must not require all richer fields to be complete before retaining any one of them.

The richer fields governed by this rule are:

```text
race_name
distance_m
surface
course_label
```

## Public rank rule

Publication policy does not cap rank.

For a canonical meeting with evidence-derived rank `R`, public projection begins at `R` regardless of country, authority, source, collector, adapter, or policy id.

Examples:

```text
SOREC meeting with complete A+ evidence => public A+
Chile meeting with A evidence           => public A
HRI meeting with B+ evidence            => public B+
JRA meeting with C evidence              => public C
```

A later refresh may promote or normalize the rank whenever the verified evidence changes.

## Per-field publication policy

The publication policy key for richer timetable metadata is:

```text
detail_fields
```

with the booleans:

```text
show_race_name
show_distance
show_surface
show_course
```

These are field-level permissions, not rank permissions.

A field may be denied only for an explicit, documented non-rank publication reason such as a legal, contractual, licensing, or other deliberate publication restriction. A lower historical source capability, an old authority classification, or a prior rank ceiling is not a valid reason to deny the field.

Absent such an explicit restriction, verified canonical timetable detail fields are publishable independently.

The former names/concepts `a_plus_fields` and `max_public_rank` are deprecated/prohibited because they tied field or rank visibility to a completeness/source classification.

## Public row and table behavior

Public timetable rows must preserve each policy-approved verified value independently.

Examples:

```text
Race 1 | 12:10 | —            | 1200m | Turf | Outer
Race 2 | 12:40 | Maiden Plate | 1600m | Turf | Inner
Race 3 | 13:10 | Cup Trial    | —     | Dirt | Main
```

For table presentation:

- show a richer-data column when at least one public row contains a value for that column;
- render an individual missing cell as an em dash or equivalent absent-value marker;
- do not hide sibling values merely because one field or one row is incomplete;
- never fabricate a field value to satisfy a rank.

## Acquisition completion and later enrichment

This contract does not make `A` terminal acquisition success.

Acquisition completion and later enrichment remain governed by `docs/calendar/acquisition-completion-contract.md`.

A future meeting may validly be `A` today and later become `A+` when the official programme publishes richer detail.

Example:

```text
Day 1:
T12/12 N0/12 D12/12 S0/12 C0/12
rank A
acquisition disposition pending_publication

Later refresh:
T12/12 N12/12 D12/12 S12/12 C12/12
rank A+
```

A lower-rank meeting with `pending_publication` or `retry_required` must remain eligible for later evaluation under the acquisition-completion contract.

## Operator diagnostics

Rank badges are temporary operator-facing diagnostics and must not be treated as a user-facing quality rating.

Detailed acquisition diagnostics are query-gated.

The supported diagnostic query is:

```text
?diag=calendar
```

Without that query, Calendar and meeting-detail pages must not render the diagnostic block.

With that query, diagnostics expose enough safe aggregate state to distinguish acquisition gaps from publication-projection gaps.

Minimum diagnostic fields per meeting:

```text
meeting_id
rank
acquisition disposition
row total
T = rows with valid race time
N = rows with race name
D = rows with distance
S = rows with surface
C = rows with course
```

Diagnostics should report both canonical and public coverage where available.

Example:

```text
Rank A · pending_publication
Canonical T12/12 N0/12 D12/12 S12/12 C12/12
Public    T12/12 N0/12 D12/12 S12/12 C12/12
```

A mismatch such as the following indicates a publication/projection problem rather than an acquisition failure:

```text
Canonical T12/12 N0/12 D12/12 S12/12 C12/12
Public    T12/12 N0/12 D0/12  S0/12  C0/12
```

## Diagnostic exposure rule

Diagnostics are operational aids, not ordinary page content.

The default public view must remain visually unchanged by this diagnostic feature.

Diagnostic text should not be permanently rendered as ordinary visible page content and hidden only with styling. The diagnostic data/render path should be activated by the diagnostic query.

The diagnostics endpoint must expose aggregate coverage and state only; it must not become a bypass for an explicit field-level publication restriction by exposing unpublished rich field values.

## Validation requirements

Executable regression validation must cover at least:

1. all richer fields complete on every row -> `A+`, all permitted fields published;
2. race name missing while distance/surface/course are complete -> `A`, those sibling fields remain publishable;
3. distance missing while race name/surface/course are complete -> `A`, those sibling fields remain publishable;
4. one row missing race name -> `A`, names from other rows remain publishable;
5. only `A` timetable structure exists -> race labels/times remain public with no fabricated richer fields;
6. an explicit non-rank field restriction may suppress that field without changing canonical/public rank;
7. query-gated diagnostics distinguish canonical coverage from public coverage;
8. the rank ladder remains exactly `C/B/B+/A/A+` unless a later explicit decision supersedes this contract;
9. `max_public_rank` does not exist in publication policy or generated public projection code;
10. an authority/source identity cannot prevent stronger verified evidence from publishing at its derived rank.

## Relationship to other contracts

Read this contract together with:

- `docs/calendar/acquisition-completion-contract.md`
- `scripts/timetable/best-available-rank.mjs`
- `scripts/timetable/apply-official-rolling-observations.mjs`
- `src/data/publicationDisplayPolicies.json`

`best-available-rank.mjs` remains authoritative for evidence-derived rank.

`acquisition-completion-contract.md` remains authoritative for whether lower-rank acquisition may close, retry, or await later publication.

This contract is authoritative for evidence-derived public rank, preserving richer fields, rank-independent field visibility, and query-gated operator diagnostics.

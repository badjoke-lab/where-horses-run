# HKJC live fixture artifact bridge

Status: active artifact-only acquisition bridge  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Unit: `HKJC-PILOT-02`  
Last reviewed: 2026-07-10

## Purpose

`HKJC-PILOT-02` establishes an artifact-only live fixture acquisition bridge for the HKJC pilot.

The bridge takes official HKJC fixture-window page observations and emits only review-boundary artifacts:

```text
official fixture page result
-> pure fixture parser
-> C-level timetable-candidate-v1
-> Coverage Observation
-> Collection Result Manifest
-> Review Queue
-> collection report
```

It does not write canonical or public timetable state.

## Separation from Registry activation

Registry activation remains separate.

The bridge uses the staged adapter identity:

```text
hong-kong-hkjc-live-fixture-adapter-v1
```

but the Acquisition Registry remains unchanged during this unit:

```text
profile_status: provisional
schedule_adapter_id: hong-kong-hkjc-dry-run-adapter
detail_source_id: null
detail_adapter_id: null
supported_observation_ranks: [C]
```

The runner compatibility mapping also remains on the existing bounded executor until `HKJC-PILOT-03`.

This prevents a fixture-backed bridge proof from silently becoming an active operational route.

## Core contract

The pure core is:

```text
scripts/timetable/hkjc-live-fixture-bridge.mjs
```

Input contract:

```text
calendar-hkjc-live-fixture-bridge-input-v1
```

Output contract:

```text
calendar-hkjc-live-fixture-bridge-v1
```

The input contains:

- generated time;
- campaign ID;
- Job ID;
- batch ID;
- actual runner class;
- requested date window;
- month-scoped page results.

The pure core performs no network fetch.

## Official fixture parser

The parser recognizes HKJC fixture meeting identity from the official fixture-list semantics already used by the historical source path.

Supported racecourse codes are:

```text
ST -> sha-tin-racecourse
HV -> happy-valley-racecourse
```

The output meeting identity is:

```text
hkjc-{racecourse_id}-{YYYY-MM-DD}
```

The schedule bridge emits only C-level meeting identity.

It does not infer:

- first race time;
- last race time;
- race rows;
- race name;
- distance;
- surface;
- course label.

## Coverage semantics

The bridge explicitly supports three bounded coverage outcomes.

### Full requested window

When every required month page succeeds and parses:

```text
coverage_claim: source_window_complete
observed_scope.kind: date_window
```

The observed date window equals the requested date window.

### Partial observed window

When at least one required month succeeds and at least one month is unavailable or fails:

```text
coverage_claim: partial
observed_scope.kind: source_visible_horizon
```

Successful meeting records remain reviewable.

Failed month scopes are recorded as source errors.

### No observed window

When no required month can be observed:

```text
coverage_claim: none
observed_scope.kind: not_observed
```

The batch still emits Manifest and Review Queue state so the failure is visible to operators.

## Source error mapping

Supported page-result states map into shared Coverage Observation source-error codes:

```text
source_unavailable -> source_unavailable
rate_limited -> rate_limited
parser_failure -> parser_failure
unexpected_response -> unexpected_response
```

Missing required month results become `source_unavailable`.

## Candidate boundary

Every emitted candidate record uses:

```text
capability_rank: C
first_race_time_local: null
last_race_time_local: null
timetable_rows: []
review_status: needs_review
```

The candidate envelope uses:

```text
review.status: needs_review
promotion_target: null
```

No B/B+/A/A+ rank is inferred from fixture-list identity alone.

## Review Queue boundary

Every bridge batch produces exactly one Review Queue entry:

```text
review_ready / not_ready
```

The entry is projected from the Result Manifest and therefore preserves:

- campaign identity;
- Job identity;
- batch identity;
- system identity;
- runner used;
- requested scope;
- coverage claim;
- five-rank counts;
- unresolved counts;
- source-error count.

The Queue entry performs no review action.

## Fixture-backed validation scenarios

Permanent scenarios cover:

1. one complete month with an out-of-window meeting filtered;
2. a two-month request with one successful month and one source-unavailable month;
3. a completely unobserved rate-limited month.

Expected claims are:

```text
source_window_complete
partial
none
```

Additional rejection cases cover:

- duplicate month result;
- page month outside requested scope;
- duplicate meeting identity;
- invalid real calendar date.

## Artifact writer CLI

Fixture/page-result artifact writing is provided by:

```text
scripts/timetable/build-hkjc-live-fixture-bridge.mjs
```

Validation-only mode:

```text
node scripts/timetable/build-hkjc-live-fixture-bridge.mjs \
  --input=<bridge-input.json> \
  --check-only
```

Artifact write mode requires the exact batch root:

```text
data/generated/timetable/hkjc-live-fixture-bridge/{batch_id}
```

The output set is:

```text
candidate.json
coverage-observation.json
result-manifest.json
review-queue.json
collection-report.json
```

The writer rejects an output root that differs from the Manifest artifact root.

## Live collector CLI

The official live fixture collector is:

```text
scripts/timetable/collect-hkjc-live-fixture-window.mjs
```

It fetches only official HKJC fixture-list pages required by the requested month range.

The source host is restricted to:

```text
racing.hkjc.com
```

Artifact writing requires explicit:

```text
--write-artifacts
```

and the exact batch root:

```text
data/generated/timetable/hkjc-live-fixture-bridge/{batch_id}
```

The raw page body is not persisted.

The response body exists only in memory long enough for parsing.

## Write boundary

The bridge and live collector have:

```text
canonical write: false
public write: false
approval: false
promotion: false
publication: false
deployment: false
scheduler execution: false
```

Neither file may invoke:

```text
build-canonical-timetable.mjs
merge-hkjc-normalized-into-canonical.mjs
build-public-timetable-view.mjs
```

## Public data boundary

Review artifacts must not contain:

- raw page body;
- raw HTML;
- starter or runner lists;
- horse names;
- jockey names;
- trainer names;
- weights;
- draw or gate positions;
- odds;
- betting rank;
- results;
- payouts;
- predictions or tips;
- embedded video;
- direct stream URLs.

The bridge output is meeting identity only.

## Completion boundary

`HKJC-PILOT-02` is complete when:

- the pure parser recognizes ST and HV fixture identity;
- out-of-window meetings are filtered;
- all output records are C-level;
- timetable rows remain empty;
- full coverage emits `source_window_complete`;
- partial coverage emits `partial` with source errors;
- no observation emits `none` with `not_observed` scope;
- Manifest rank totals close against candidate records;
- Review Queue is `review_ready / not_ready`;
- output artifacts contain no page body;
- fixture/page-result writer output refs match actual batch paths;
- live collector is restricted to official host and explicit artifact writes;
- canonical/public file hashes remain unchanged in fixture validation;
- Registry activation remains separate;
- normal Calendar governance and release gates remain valid.

## Next implementation unit

```text
HKJC-PILOT-03
Registry activation and runner integration
```

The next unit may activate the reviewed live fixture adapter in the Acquisition Registry and runner compatibility contract only after this bridge is stable.

`HKJC-PILOT-03` must preserve:

- C-level schedule identity only;
- review artifacts before promotion;
- honest partial/none coverage;
- no direct canonical/public write;
- human review before promotion/publication;
- unattended publication disabled.

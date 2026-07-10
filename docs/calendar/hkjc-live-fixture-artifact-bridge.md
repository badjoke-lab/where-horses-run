# HKJC live fixture artifact bridge

Status: active bounded acquisition foundation  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-02`  
Last reviewed: 2026-07-10

## Purpose

This unit moves official HKJC fixture-window acquisition into an artifact-only review path.

The bridge is intentionally limited to meeting identity.

```text
official HKJC fixture page
-> public-safe fixture parser
-> timetable-candidate-v1 at Rank C
-> Coverage Observation
-> Collection Result Manifest
-> collection report
-> external artifact directory / GitHub Actions artifact upload
-> human review later
```

The bridge does not write canonical Calendar state or public projection state.

## Scope

The bridge accepts an explicit date window:

```text
start_date inclusive
end_date_exclusive exclusive
timezone Asia/Hong_Kong
```

The bridge enumerates only the HKJC monthly fixture pages needed to cover the requested window.

The official fixture URL form is:

```text
https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=MM&CalYear=YYYY
```

Only meeting identity is extracted:

- meeting date;
- Sha Tin or Happy Valley racecourse identity;
- session type token for diagnostic/reporting context;
- official fixture URL.

The candidate output deliberately does not include race times or programme-summary rows.

## Candidate output

The candidate envelope uses:

```text
schema_version: timetable-candidate-v1
adapter_id: hkjc-fixture-artifact-bridge-v1
country_id: hong-kong
authority_id: hkjc
source_id: hkjc-fixture-list
review.status: needs_review
promotion_target: null
```

Every emitted record is Rank C.

A Rank C record contains:

```text
meeting identity
racecourse identity
date
timezone
official fixture source trace
confidence
needs_review state
```

It contains no:

```text
first race time
last race time
timetable rows
race name
distance
surface
course
participant data
betting data
results
payouts
predictions
raw HTML
source body
stream URL
```

## Coverage semantics

The bridge emits one Coverage Observation for each execution.

### Successful requested window

When every required monthly fixture page is fetched and parsed successfully:

```text
coverage_claim: source_window_complete
```

This means the requested fixture-source window was successfully observed.

It is not a season-completeness claim and not a full HKJC programme-detail claim.

### Partial source observation

When at least one required monthly fixture page succeeds and another fails:

```text
coverage_claim: partial
```

The successful C candidates are retained for review.

Source errors remain explicit in Coverage Observation and Result Manifest.

### No successful observation

When no required monthly fixture page is successfully observed:

```text
coverage_claim: none
observed_scope.kind: not_observed
```

The bridge does not invent fallback meetings in this live artifact path.

Historical route-config meetings remain migration evidence and are not silently substituted into a live acquisition claim.

## Parser-failure boundary

A successful HTTP response that produces no recognized HKJC fixture markers is classified as:

```text
parser_failure
```

It is not treated as an empty but complete month.

This fail-closed behavior prevents source-layout changes from becoming false zero-meeting completeness claims.

## Artifact set

Each execution produces exactly four review artifacts:

```text
candidates.json
coverage-observation.json
result-manifest.json
collection-report.json
```

The Result Manifest uses logical repository-style artifact refs for shared control-plane compatibility.

The live collector itself writes to an external directory only.

GitHub Actions transports the directory with:

```text
actions/upload-artifact@v4
```

No artifact is committed automatically.

## CLI

```text
node scripts/timetable/collect-hkjc-fixture-artifacts.mjs \
  --from=2026-07-10 \
  --to-exclusive=2026-08-01 \
  --output-dir=/tmp/hkjc-fixture-artifacts/example \
  --batch-id=hkjc-live-example \
  --campaign-id=hkjc-stage10-pilot \
  --job-id=hkjc-live-fixture-example
```

The output directory must resolve outside the repository.

Repository output is rejected before any network fetch occurs.

## Manual Actions route

The workflow is:

```text
.github/workflows/calendar-hkjc-live-fixture-artifacts.yml
```

Live acquisition is available only through explicit `workflow_dispatch` inputs:

```text
from_date
to_date_exclusive
```

The workflow has:

```text
contents: read
no schedule trigger
no cron trigger
no repository write permission
```

The live job:

1. validates the bridge and shared contracts;
2. fetches the explicit official fixture window;
3. writes review artifacts under `/tmp`;
4. uploads the bounded artifact directory;
5. proves the repository worktree remains clean.

## Relationship to the quarantined legacy path

The quarantined historical rolling path previously coupled source acquisition and downstream repository writes.

This bridge does not call:

```text
build-canonical-timetable.mjs
merge-hkjc-normalized-into-canonical.mjs
build-public-timetable-view.mjs
```

It also does not rewrite:

```text
data/sources/timetable/hkjc-racecard-route.json
```

The historical fetch and normalization code remains reviewed migration evidence for later detail-adapter work.

The new fixture bridge is a separate review-first path.

## Registry boundary

After this implementation unit, the HKJC Acquisition Registry profile remains provisional.

This PR does not claim reviewed live source evidence merely because a live-capable collector exists.

The current shared Registry state therefore remains conservative until a later unit connects the live bridge to shared Actions Job execution and reviews actual live artifact evidence.

## Validation

The permanent checker is:

```text
node scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs
```

It validates:

- successful source-window-complete C output;
- cross-month partial output;
- rate-limit source error preservation;
- no-observation behavior;
- parser-failure behavior;
- timetable-candidate-v1 field boundaries;
- Coverage Observation validation;
- Collection Result Manifest validation;
- Rank C only;
- needs_review state;
- no forbidden public fields;
- pure core remains write-free;
- collector has no canonical/public/config write target;
- repository output directory is rejected before fetch;
- protected canonical/public/config hashes remain unchanged after rejection;
- no illegal repository artifact directory is created.

## Completion boundary

`HKJC-PILOT-02` is complete when:

- official fixture-window acquisition has a bounded artifact-only core;
- the CLI rejects repository-local output before network access;
- success, partial, none, and parser-failure semantics are deterministic;
- candidate output is timetable-candidate-v1 and Rank C only;
- Coverage Observation and Result Manifest validate;
- live execution is manual workflow_dispatch only;
- live artifacts are uploaded without repository commit;
- canonical/public/config state remains untouched;
- Registry activation is not claimed from implementation alone.

## Next implementation unit

The next unit is:

```text
HKJC-PILOT-03
```

Goal:

```text
Connect the live fixture artifact bridge to shared Actions Job execution,
produce reviewed live fixture evidence,
and then re-evaluate the provisional Registry profile.
```

The next unit must still preserve:

- human review before promotion;
- no automatic approval;
- no automatic promotion;
- no automatic publication;
- no scheduler execution;
- no participant, betting, result, payout, prediction, raw-source, embedded-video, or direct-stream output.

## PILOT-04 empty-window semantics

A successful HTTP response with zero parsed meeting markers is no longer automatically treated as a parser failure. The bridge now applies a fail-closed source-specific empty-window classifier.

A zero-meeting month is accepted as a valid empty season-gap window only when all of the following are observed together:

- the page still exposes HKJC fixture/calendar shell vocabulary;
- at least eight official fixture navigation months are present;
- the navigation month sequence is contiguous;
- the requested month is one or two months immediately before the first visible navigation month.

This bounded rule matches the reviewed 2026-08 and 2026-09 structure evidence, where the official source shell exposed the next fixture navigation season beginning in 2026-10. Any zero-meeting response outside this exact shape remains `parser_failure`.

The classifier does not activate detail acquisition, does not raise the supported observation rank above C, and does not change the review-first or no-publication boundary.

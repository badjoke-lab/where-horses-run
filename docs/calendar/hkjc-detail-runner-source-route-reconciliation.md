# HKJC detail runner and source-route reconciliation

Status: active implementation foundation  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-06`  
Last reviewed: 2026-07-10

## Starting evidence

PILOT-05 accepted the artifact-only detail core and external review-artifact collector, but did not prove the GitHub Actions HTTP detail acquisition path.

The hosted evidence showed:

- one bounded live target remained C with coverage none and one unresolved/source error;
- three reviewed meetings × three official route forms produced nine HTTP 200 shell responses with no target timetable field shapes;
- browser-like headers and two official warmup strategies returned the same shell;
- all candidate/review/protected-state/no-write boundaries held.

Therefore PILOT-06 treats runner choice and source-route choice as explicit evidence questions.

## Registry reconciliation

Before PILOT-06, the HKJC provisional Registry profile declared:

```text
primary_runner: github_actions
fallback_runner: local
```

The schedule path has an evidence-backed GitHub Actions executor.

The declared `local` fallback, however, had no HKJC local executor mapping in the runner compatibility contract. It was therefore not an executable fallback under the common runner model.

PILOT-06 corrects the claim conservatively:

```text
primary_runner: github_actions
fallback_runner: null
pending_fields:
  - fallback_runner
  - detail_source_id
  - detail_adapter_id
```

This does not remove the evidence-backed Actions schedule path. It removes only an unimplemented fallback claim until a runner path is actually implemented and proved.

## Reviewed-import boundary

PILOT-06 adds an external public-safe reviewed-import contract for detail observations.

The reviewed import accepts only:

- explicit official source URL and check time;
- evidence type;
- explicit date window;
- meeting identity and racecourse identity;
- explicit `meeting_complete` review state;
- race number;
- post time;
- race name;
- distance;
- surface;
- course label;
- per-row official source URL;
- human review state and reviewer metadata.

The contract rejects unexpected fields. This makes participant, betting, result, payout, prediction, raw-source, and stream data fail closed instead of being silently ignored.

## Two-stage import semantics

### Pending public-safe review

```text
review.state: pending_human_review
```

The package records the external input filename and SHA-256 digest but produces no normalized candidate/Coverage/Manifest/report artifacts.

### Reviewed public-safe input

```text
review.state: reviewed_public_safe
```

The same public-safe rows are passed through the accepted PILOT-05 rank classifier and produce:

- timetable candidate;
- Coverage Observation;
- Collection Result Manifest;
- reviewed-import report.

The resulting candidate still remains:

```text
review.status: needs_review
promotion_target: null
```

Input review does not equal candidate approval, Promotion Validation, canonical promotion, or publication.

## External path boundary

The package CLI requires both input and output paths to be outside the repository.

The CLI:

1. rejects repository-local input;
2. rejects repository-local output;
3. hashes exact external input bytes with SHA-256;
4. parses and validates public-safe input;
5. builds a deterministic reviewed-import package;
6. writes only the package to the explicit external output path;
7. performs no network fetch.

## Current Registry boundary

PILOT-06 does not yet activate:

```text
fallback_runner
detail_source_id
detail_adapter_id
supported observation ranks above C
selected-meeting support
rank-upgrade retry support
```

The reviewed-import implementation is a candidate operating path. Registry activation requires a separate bounded real reviewed-import evidence decision.

## Next evidence step

The next evidence unit inside PILOT-06 is to create one external public-safe reviewed input from an explicitly reviewed official HKJC source observation and run it through the package CLI.

The evidence must prove:

- exact external input digest;
- official-source URL boundary;
- reviewed public-safe state;
- expected five-rank classification behavior;
- candidate remains needs_review;
- runner identity is reviewed_import;
- no network fetch by the package builder;
- no repository write;
- no canonical/public write;
- no publication effect.

Only after that evidence should `reviewed_import` fallback activation be reconsidered.

## Safety boundary

The following remain disabled:

- scheduled acquisition execution;
- automatic Queue mutation;
- automatic approval;
- automatic promotion;
- automatic publication;
- canonical write;
- public write;
- deployment.

PILOT-06 does not restore the quarantined historical direct source-to-canonical/public chain.

# NAR current-window A+ promotion review

Status: reviewed read-only promotion proposal  
Work ID: `WHR-CAL-JAPAN-NAR-CURRENT-WINDOW-PROMOTION-REVIEW`  
Implementation unit: `NAR-CURRENT-WINDOW-PROMOTION-01`

## Reviewed source

The source is the immutable review artifact produced by workflow run `29233820152`:

```text
artifact ID: 8272633802
artifact name: nar-current-window-retry-29233820152
artifact digest: sha256:304e980b2d011383fae62fc69d3b3708784aa4b49ef02e94c267862300e94421
batch: nar-current-window-selected-retry-2026-07-batch-001
generated_at: 2026-07-13T07:58:52Z
```

The batch, Collection Report, Coverage Observation, and Retry Targets are each pinned by an additional exact SHA-256 digest.

## Approval boundary

The live retry returned:

```text
A+ detail candidates: 15
C schedule candidates: 51
```

This review approves exactly the 15 complete A+ candidates.

It does not approve or promote the 51 C schedule records. They remain explicit retry targets.

Approval scope:

```text
exact_a_plus_subset_only
```

## Reviewed completeness

The approved set contains:

```text
meetings: 15
race rows: 180
```

Every approved meeting passed these checks:

- continuous Race 1 through Race 12 numbering;
- complete post times;
- complete race names;
- complete distances;
- complete surfaces;
- complete course labels;
- official `www.keiba.go.jp` URLs;
- source candidate rank A+;
- no source or schedule errors in the pinned artifact.

The approved public fields are limited to:

- race label;
- post time;
- race name;
- distance;
- surface;
- course label.

Not approved:

- horse, jockey, trainer, draw, weight, or entry data;
- odds or betting data;
- results or payouts;
- predictions or tips;
- raw HTML or source bodies;
- video or stream URLs.

## Proposal workflow

Workflow:

```text
Calendar NAR current-window promotion review
```

The workflow:

1. downloads the exact pinned artifact from workflow run `29233820152`;
2. verifies the artifact identity and all four file SHA-256 values;
3. verifies the exact 15 resolved and 51 unresolved meeting sets;
4. converts only the 15 complete detail candidates into `timetable-candidate-v1`;
5. strips per-race source traces and retains only the six approved public timetable fields;
6. applies the reviewed approval metadata;
7. runs the existing Pipeline v1 promotion core against current Canonical data;
8. produces proposed Canonical meeting and detail files;
9. uploads the proposal artifact;
10. proves Canonical and public files did not change.

## Output

The proposal artifact contains:

- approved Candidate;
- proposed Canonical meetings;
- proposed Canonical meeting details;
- Pipeline promotion summary;
- promotion proposal with exact output SHA-256 values.

The expected closure is:

```text
approved meetings: 15
approved race rows: 180
promoted Canonical meetings: 15
promoted Canonical details: 15
excluded C retry targets: 51
```

## Safety boundary

The proposal workflow has:

```text
contents: read
actions: read
```

It does not:

- commit the approved Candidate;
- write Canonical files;
- write public files;
- regenerate the public projection;
- publish or deploy.

The resulting proposal still requires a separate reviewed merge PR.

## Next step

After the proposal passes:

1. commit the approved Candidate and proposed Canonical files in a separate PR;
2. regenerate public projection;
3. verify Japanese and English rendered output;
4. retain the 51 unresolved meetings at C;
5. keep the 51-meeting Retry Target set for later official-detail availability.

# UAE ERA source-specific pilot plan

Status: UAE-PILOT-01 artifact-only C-level foundation  
Work ID: `WHR-CAL-UAE-ERA`  
Current unit: `UAE-PILOT-01`  
Last reviewed: 2026-07-11

## Starting boundary

The existing Calendar Readiness record is the source of truth for the pilot entry state.

Current reviewed state:

```text
system: uae-national-racing-system
authority: Emirates Racing Authority
source: ERA season calendar
technical rank: C
public ceiling: C
confirmed fields:
  meeting date: true
  racecourse: true
all reusable time and programme-detail fields: false
readiness: manual_ready
implementation status at entry: not_started
automation mode: manual_confirmation
```

The reviewed source-test decision permits manual C-level meeting-date and venue confirmation only. It does not establish reusable first-race, last-race, or per-race post times.

## PILOT-01 goal

Build a pure artifact-only C-level core that converts explicit reviewed ERA season-calendar observations into the shared Calendar review artifacts without network access or repository writes.

Flow:

```text
explicit reviewed date + trusted racecourse identity
-> strict C-level validation
-> timetable-candidate-v1
-> Coverage Observation
-> Collection Result Manifest
-> review-only report
-> HUMAN REVIEW REQUIRED
```

PILOT-01 does not perform live source acquisition.

## Trusted racecourse boundary

The current Readiness record binds the pilot entry state to:

```text
meydan-racecourse
```

The official season material may describe a wider venue network, but PILOT-01 does not invent or activate additional canonical racecourse IDs from venue names.

Venue-network expansion is therefore:

```text
pending_canonical_id_mapping_review
automatic_expansion_allowed: false
```

A later explicit mapping review may expand the trusted ID set. Until then, an input row using any other racecourse ID is rejected.

## C-level candidate contract

Every emitted meeting candidate must remain:

```text
capability_rank: C
first_race_time_local: null
last_race_time_local: null
timetable_rows: []
review_status: needs_review
```

The candidate source records only:

- official ERA source ID;
- official source URL;
- source check timestamp;
- manual-import extraction method.

No time or programme-detail field is accepted as a PILOT-01 meeting input.

## Coverage semantics

The core distinguishes:

### Complete reviewed window

```text
windowComplete: true
source errors: 0
unresolved dates: 0
-> source_window_complete
```

### Partial reviewed window

```text
at least one C candidate
but window not complete or unresolved dates remain
-> partial
```

### No observation

```text
zero candidate records
-> none
```

Source errors remain explicit and are copied consistently into Coverage Observation and Collection Result Manifest.

## Permanent fixture scenarios

PILOT-01 covers:

1. one complete reviewed Meydan day;
2. one partial reviewed window with an unresolved date;
3. no observation with an explicit source error.

Fail-closed invalid cases cover:

- untrusted racecourse ID;
- forbidden time field in C-level input;
- duplicate meeting ID;
- meeting outside requested window;
- non-official source URL.

## Shared artifact boundary

The core emits:

1. `timetable-candidate-v1`;
2. `calendar-coverage-observation-v1`;
3. `calendar-collection-result-manifest-v1`;
4. `calendar-uae-era-season-calendar-report-v1`.

The review report permanently records:

```text
candidate_mode: review_only
network_fetch: false
raw_source_storage: disabled
registry_activation: false
canonical_write: disabled
public_write: disabled
publication_effect: none
automatic_approval: false
automatic_promotion: false
automatic_publication: false
```

## Registry boundary

PILOT-01 does not add a UAE Acquisition Registry profile.

It proves only a pure C-level candidate/artifact boundary derived from reviewed Readiness evidence. Registry activation is a later explicit decision after source-route and parser evidence.

## Next unit

```text
UAE-PILOT-02
UAE ERA bounded source-route and fixture parser evidence
```

Entry condition:

The PILOT-01 artifact-only core and permanent fixtures pass without Registry activation, automatic action, repository write, canonical write, or public write.

PILOT-02 must keep source acquisition evidence separate from Registry activation and must fail closed when the official source structure cannot be mapped to the reviewed C-level contract.

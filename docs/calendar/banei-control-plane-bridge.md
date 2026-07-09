# Banei Control Plane Bridge

Status: active source-specific bridge contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

The Banei Control Plane Bridge connects the existing full-month Banei schedule foundation to the shared Calendar acquisition and review contracts without inventing detail-source capability that has not yet been implemented.

The bridge path is:

```text
Banei full-month schedule candidate/report
-> Banei identity and scope validation
-> evidence-backed C / B / B+ classification
-> shared timetable-candidate-v1
-> Coverage Observation
-> Collection Result Manifest
-> Review Queue
```

A and A+ are not inferred from the schedule layer.

The bridge does not enable Banei detail collection, rank-upgrade retry, promotion, publication, or deployment.

## Existing foundation

The existing Banei full-month foundation already establishes:

```text
2026-07-01 through 2026-07-31 full-calendar-month boundary
12 expected Obihiro meeting dates
review-only candidate/report output
public-safe extracted fields only
no raw HTML storage
no partial-cutoff completion claim
no flat-racing surface assumptions
no flat-racing course-direction assumptions
```

This bridge reuses that foundation and places its reviewed schedule-layer evidence into the shared control-plane semantics.

## Registry boundary

The Banei Acquisition Registry profile remains provisional during this bridge stage.

Current bridge assumptions are intentionally narrow:

```text
primary_runner: reviewed_import
fallback_runner: null
schedule source: banei-official-schedule
schedule adapter: japan-banei-dry-run-adapter
detail source: pending
detail adapter: pending
rank-upgrade retry: disabled
selected-meeting retry support: disabled
```

The bridge does not silently convert Banei to JRA-local or NAR-Actions runner policy.

Runner choice must remain evidence-based.

## Schedule evidence classification

The schedule bridge supports three evidence-backed states:

```text
C   meeting identity only
B   meeting identity + first race time
B+  meeting identity + first and last race times
```

The rule is deterministic:

```text
no first / no last -> C
first only         -> B
first + last       -> B+
last without first -> invalid
```

The schedule layer does not emit A or A+.

A requires complete per-race post-time rows.

A+ requires A plus reviewed Banei-safe programme summary fields.

Those states must wait for actual source-specific Banei detail evidence and parser semantics.

## Shared candidate output

The bridge emits one `timetable-candidate-v1` envelope.

Each record retains:

```text
meeting identity
country / authority / racing-system identity
Obihiro racecourse identity
date and timezone
capability rank
first race time when supported
last race time when supported
empty timetable_rows at schedule-only C/B/B+ stages
official source URL
needs_review state
```

All bridge records remain:

```text
review_status: needs_review
```

No automatic approval or promotion target is assigned.

## Coverage Observation

The bridge emits a `calendar-coverage-observation-v1` document.

Requested and observed scopes remain explicit date windows.

For the full July bridge:

```text
requested_scope: 2026-07-01 .. 2026-08-01 exclusive
observed_scope:  2026-07-01 .. 2026-08-01 exclusive
collection_mode: date_window
```

The schedule-layer bridge compares current observed rank to the Banei collection target of A+.

Meetings still below A+ remain explicit unresolved meeting IDs.

Therefore a schedule-only bridge batch may be valid and reviewable while Coverage remains `partial`.

This does not contradict the separate July Completion Audit. Completion Audit and ordinary reviewable batch validity are separate concepts.

## Collection Result Manifest

The bridge emits one `calendar-collection-result-manifest-v1` summary containing:

```text
campaign ID
Job ID
batch ID
system ID
runner used
requested scope
observed scope
coverage claim
record counts
C / B / B+ / A / A+ rank counts
unresolved meeting IDs
source errors
artifact references
```

The Result Manifest uses:

```text
runner_used: reviewed_import
```

until source-specific runner testing and Registry policy explicitly change that boundary.

Manifest rank totals must equal discovered record count.

Manifest scope and Coverage Observation state must cross-check exactly.

## Review Queue

Each validated bridge batch enters the Review Queue as:

```text
review_state: review_ready
promotion_state: not_ready
```

The Review Queue entry is built from the Result Manifest and must preserve:

```text
campaign / Job / batch identity
system identity
runner identity
requested scope
coverage claim
rank distribution
unresolved counts
source error count
Manifest reference
```

Review Queue entry creation does not mean candidate approval.

## Retry boundary

Retry Queue capability is enabled after the merged retry execution proof and conservative activation review.

The current blocker is explicit:

```text
enabled_evidence_backed
```

The detail source, A+ detail adapter, selected-meeting execution, GitHub Actions runner convergence, and retry execution semantics are evidence-backed and registered. The merged proof validates due/deferred selection, success removal, failure retention, attempt accounting, exponential backoff, max-attempt suppression, Result Manifest behavior, and Review Queue behavior. Registry rank-upgrade retry support is enabled.

The bridge still records unresolved meeting IDs in Coverage Observation and the Result Manifest.

It does not discard unresolved work merely because automatic Retry Queue projection remains disabled.

The bridge still does not write Retry Queue automatically; Queue mutation remains an explicit control-plane operation even though Registry and Due-job planning capability are enabled.

## Separation from flat-racing assumptions

The bridge inherits shared pipeline contracts, not NAR/JRA flat-racing semantics.

Forbidden assumptions include:

```text
surface inference
course-direction inference
flat-racing course-label construction
unreviewed distance semantics
unreviewed programme terminology mapping
```

The bridge candidate deliberately leaves `timetable_rows` empty because schedule-layer evidence does not establish A-level per-race rows.

Any future Banei A/A+ adapter must define Banei-specific programme semantics independently.

## Full-month Completion Audit relationship

The July Completion Audit still requires all twelve official July Obihiro meeting dates to be represented or explicitly blocked.

The bridge does not replace that audit.

The relationship is:

```text
ordinary bridge batch
  may be partial
  may contain mixed C/B/B+
  may enter Review Queue
  may preserve unresolved meeting IDs

July Completion Audit
  checks all 12 official July dates
  rejects silent omissions
  rejects partial-cutoff completion claims
  verifies detail gaps are explicit
  later verifies highest available reviewed detail
```

A partial ordinary batch must not be mislabeled as month completion.

A month audit gap must not invalidate unrelated valid records in an otherwise reviewable batch.

## Side-effect boundary

Every bridge output records or enforces:

```text
approval: false
promotion: false
canonical_write: false
public_write: false
publication: false
deployment: false
```

The bridge is a review preparation layer only.

## Public data boundary

Bridge artifacts contain public-safe meeting and schedule summary fields only.

They must not contain:

- horse names;
- jockey names;
- trainer names;
- draw or gate positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- source bodies;
- credentials, cookies, secrets, or tokens;
- direct stream URLs.

## Bridge completion boundary

This bridge stage is complete when:

- Banei schedule candidates normalize to shared timetable candidate records;
- C / B / B+ classification is deterministic and tested;
- A and A+ are not inferred;
- Coverage Observation validates;
- Collection Result Manifest validates and cross-checks Coverage;
- Review Queue entry validates and cross-checks Manifest;
- unresolved meeting IDs remain visible;
- Retry Queue capability is enabled from merged evidence while automatic bridge Queue writes remain disabled;
- Banei Registry remains provisional and reviewed_import-based;
- full-month July control retains 12 expected dates and no-partial-cutoff rule;
- flat-racing assumptions remain prohibited;
- no approval, promotion, public write, publication, or deployment side effect occurs.

## Next handoff

The detail source, A+ adapter, and bounded date-window capability are now evidence-backed.

The next Banei source-specific step is runner-policy convergence and selected-meeting execution proof. That work must establish actual evidence for:

```text
schedule acquisition runner behavior
detail acquisition runner behavior
selected-meeting execution
retry backoff and attempt accounting
failure isolation
retry-specific Result Manifest semantics
Retry Queue update behavior
```

Only after that evidence exists may selected-meeting and rank-upgrade retry capability be enabled.

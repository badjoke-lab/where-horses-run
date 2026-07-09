# Banei Retry Queue State Apply and Rollback

Status: active explicit operator state-update contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This contract defines the explicit operator step that applies a reviewed Banei retry reconciliation proposal to authoritative Retry Queue state.

The state-update path is:

```text
current authoritative Retry Queue
+ proposal-only reconciliation artifact
+ reviewed approval artifact
+ Acquisition Registry
-> exact source Queue digest check
-> exact proposal digest check
-> exact proposed Queue digest check
-> stale-write guard
-> write rollback backup
-> write rollback evidence before replacement
-> same-directory temporary file
-> fsync temporary file
-> atomic rename over Queue path
-> fsync Queue directory
-> post-apply digest verification
-> write apply result evidence
```

The rollback path is:

```text
current applied Retry Queue
+ original Queue backup
+ rollback evidence
+ Acquisition Registry
-> exact current target digest guard
-> exact backup restore digest guard
-> same-directory temporary file
-> fsync temporary file
-> atomic rename over Queue path
-> fsync Queue directory
-> post-restore digest verification
-> write rollback result evidence
```

## Default mode

Both commands are validation-only by default.

State application requires explicit `--apply`.

Rollback restoration requires explicit `--restore`.

There is no implicit Queue mutation merely because a valid proposal or rollback artifact exists.

## Required reviewed approval artifact

State apply requires a reviewed approval artifact with schema:

```text
calendar-banei-retry-queue-apply-approval-v1
```

Required fields are:

```text
schema_version
decision
reviewed_by
reviewed_at
source_queue_sha256
proposal_sha256
proposed_queue_sha256
```

The contract is closed. Unknown fields are rejected.

The decision must be:

```text
approved
```

The three SHA-256 values bind the human-reviewed decision to:

1. the exact source Queue bytes;
2. the exact proposal artifact bytes;
3. the canonical proposed Queue bytes.

A reviewed approval artifact cannot be reused against changed source Queue state or a changed proposal.

## Exact source Queue digest

The reconciliation proposal records:

```text
source_queue_sha256
proposed_queue_sha256
```

The proposal CLI calculates the source digest from the exact UTF-8 bytes read from the Queue path.

At apply time, the current Queue is read again and hashed again.

The apply command rejects when:

```text
current Queue SHA-256
!= proposal source Queue SHA-256
```

or when:

```text
current Queue SHA-256
!= reviewed approval source Queue SHA-256
```

This is the stale-write guard.

It prevents a reviewed proposal from silently overwriting Queue state that changed after review.

## Proposal digest guard

The exact proposal file bytes are hashed at apply time.

The apply command requires:

```text
actual proposal SHA-256
== reviewed approval proposal SHA-256
```

Changing proposal metadata, transition summary, target Queue content, or any other proposal bytes after review invalidates the approval.

## Proposed Queue digest guard

The proposed Queue embedded in the proposal is serialized with the canonical repository JSON formatting contract.

The apply command requires:

```text
actual proposed Queue SHA-256
== proposal proposed_queue_sha256
== approval proposed_queue_sha256
```

The proposed Queue must also validate structurally and against current Acquisition Registry routing.

## State apply CLI

The state apply CLI is:

```text
scripts/timetable/apply-banei-retry-queue-state.mjs
```

Validation-only example:

```text
node scripts/timetable/apply-banei-retry-queue-state.mjs \
  --queue=<retry-queue.json> \
  --proposal=<reconciliation-proposal.json> \
  --approval=<reviewed-approval.json> \
  --applied-at=<ISO-date-time>
```

Explicit apply example:

```text
node scripts/timetable/apply-banei-retry-queue-state.mjs \
  --queue=<retry-queue.json> \
  --proposal=<reconciliation-proposal.json> \
  --approval=<reviewed-approval.json> \
  --rollback-root=<rollback-evidence-directory> \
  --applied-at=<ISO-date-time> \
  --apply
```

Without `--apply`, the command performs no Queue write and creates no rollback output directory.

## Atomic replacement semantics

The Queue path is replaced only after all digest, approval, schema, Queue, Registry, and transition checks pass.

Replacement uses:

1. a same-directory temporary file;
2. exclusive temporary file creation;
3. complete text write;
4. file `fsync`;
5. atomic rename over the Queue path;
6. directory `fsync`;
7. post-apply Queue digest verification.

The implementation does not truncate and rewrite the authoritative Queue in place.

The same atomic replacement helper is used by explicit rollback.

## Rollback evidence before replacement

Before Queue replacement, apply mode writes:

```text
<stem>.backup.json
<stem>.rollback-evidence.json
```

The backup preserves the exact original Queue bytes.

The rollback evidence records:

```text
source Queue SHA-256
applied target Queue SHA-256
proposal SHA-256
reviewer identity
review time
required current digest before restore
restore Queue digest
```

Rollback evidence before replacement is mandatory.

The apply command then performs atomic replacement and post-apply verification.

After successful replacement it writes:

```text
<stem>.apply-result.json
```

## Rollback CLI

The rollback CLI is:

```text
scripts/timetable/rollback-banei-retry-queue-state.mjs
```

Validation-only example:

```text
node scripts/timetable/rollback-banei-retry-queue-state.mjs \
  --queue=<retry-queue.json> \
  --backup=<backup.json> \
  --evidence=<rollback-evidence.json> \
  --rollback-at=<ISO-date-time>
```

Explicit restore example:

```text
node scripts/timetable/rollback-banei-retry-queue-state.mjs \
  --queue=<retry-queue.json> \
  --backup=<backup.json> \
  --evidence=<rollback-evidence.json> \
  --rollback-at=<ISO-date-time> \
  --restore
```

Without `--restore`, rollback is validation-only by default and performs no Queue write.

## Rollback stale guard

Rollback does not blindly restore an old backup.

It requires:

```text
current Queue SHA-256
== rollback evidence required current Queue SHA-256
== previously applied target Queue SHA-256
```

and:

```text
backup Queue SHA-256
== rollback evidence restore Queue SHA-256
== original source Queue SHA-256
```

If the Queue changed after apply, rollback fails closed instead of erasing later state.

## Repeated apply boundary

A proposal is source-state bound.

After successful apply, the Queue digest changes from the proposal source digest to the target digest.

Attempting to apply the same proposal again therefore fails the stale-write guard.

This is intentional idempotence-by-rejection rather than silent repeated mutation.

## Separation from review and publication

Queue state apply changes only retry control-plane state.

It does not:

- approve timetable candidates;
- promote timetable candidates;
- write canonical timetable meeting data;
- write public timetable projection data;
- publish pages;
- deploy the site;
- run acquisition Jobs.

There is no automatic acquisition execution from Queue apply.

There is no automatic approval or publication from Queue apply.

## Workflow boundary

The validation workflow for this contract is read-only.

It must remain:

```text
contents: read
```

It may validate fixture-backed apply and rollback behavior in temporary directories.

It must not receive:

```text
contents: write
pull-requests: write
```

It must not define:

```text
schedule
cron
```

The workflow does not run explicit `--apply` against repository Queue paths.

Fixture-backed mutation tests occur only under temporary operating-system directories.

## Public data boundary

Queue apply, approval, backup, apply result, rollback evidence, and rollback result artifacts are control-plane state.

They must not contain:

- horse names;
- jockey names;
- trainer names;
- owners or breeders;
- draw, gate, or post positions;
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

Queue apply does not change the public timetable display boundary.

## Completion boundary

This stage is complete when:

- reconciliation proposals bind to exact source Queue SHA-256;
- proposals bind to exact canonical target Queue SHA-256;
- approval schema is closed;
- approval decision must be approved;
- approval binds source Queue, proposal, and target Queue digests;
- current Queue validates structurally and against Registry;
- target Queue validates structurally and against Registry;
- stale source Queue is rejected;
- modified proposal is rejected;
- wrong target approval digest is rejected;
- validation-only apply performs no write;
- explicit apply writes backup and rollback evidence before replacement;
- explicit apply uses durable same-directory atomic replacement;
- post-apply digest verification passes;
- repeated apply of the same source-bound proposal is rejected;
- validation-only rollback performs no write;
- stale rollback current state is rejected;
- explicit rollback restores the original Queue byte-for-byte;
- post-rollback digest verification passes;
- automatic acquisition, approval, promotion, publication, and deployment remain disabled.

## Next handoff

After this guarded state-update path is stable, Banei work moves to operating evidence rather than broader automation.

The next sequence is:

1. exercise freshness and rollback operating evidence against reviewed Banei maintenance scenarios;
2. complete bilingual QA;
3. complete remaining public-display review;
4. keep human review before promotion and publication;
5. decide the Banei handoff boundary explicitly before starting the next source-specific pilot.

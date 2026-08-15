# M5 auto candidate PR generation runbook

Status: adopted runbook for the current roadmap PR-091  
Scope: review-queue PR creation/update contract only. This document does not enable a schedule, source fetch, approval, promotion, public write, merge, or deployment.

## 1. Purpose

M5 needs unattended candidate generation to reach a stable human-review surface without turning candidate generation into publication.

The repository already has that stable surface:

- review branch: `automation/calendar-daily-acquisition-review`
- long-lived draft PR: `#559 Calendar daily acquisition review queue`

PR-091 keeps that model. **Do not create one pull request per scheduled run.** The auto-PR step ensures that the one stable review branch/PR exists and updates only its bounded review evidence.

The stable review PR is an operations/review queue. It is not a promotion PR and must not be merged merely because automation updated it.

## 2. Existing queue is preserved

PR #559 already contains retained acquisition evidence under paths including:

- `data/generated/timetable/daily-acquisition-plans/...`
- `data/generated/timetable/daily-acquisition-status/...`
- `data/generated/timetable/daily-acquisition-summaries/...`
- `data/generated/timetable/actions-multi-job/...`
- `data/generated/timetable/actions-multi-job-status/...`
- `data/candidates/nar-incremental-batches/...`

Those paths belong to the existing daily-acquisition system. M5 scheduled candidate review must not rewrite, rename, delete, compact, or reinterpret them.

M5 uses dedicated, non-overlapping partitions on the same review branch:

```text
data/candidates/m5-scheduled/<country>/<authority>/<window>/<run-id>/candidate.json
data/generated/timetable/m5-scheduled-runs/<run-id>/run-log.json
```

The exact `<window>` token must be deterministic from the resolved PR-088 window. The exact `<run-id>` must be the PR-089 run identity and must be path-safe.

The PR-090 HTML candidate diff remains a GitHub Actions artifact by default. It is not copied into `src/pages`, `public`, `dist`, or another public-site path.

## 3. Stable PR discovery

The write-capable job must discover the review PR by exact head branch, not by assuming that pull request number `559` will exist forever.

Expected head branch:

```text
automation/calendar-daily-acquisition-review
```

Expected base branch:

```text
main
```

Required behavior:

1. Query open pull requests whose head branch exactly matches the review branch.
2. If exactly one matching open PR exists, update that PR/branch.
3. If no matching PR exists, create the review branch from the current `main` head and open **one draft PR** to `main` using the review-only template in this runbook.
4. If more than one matching open PR exists, **fail closed**. Do not guess which PR is canonical and do not close/merge any of them automatically.
5. A normal run must never close and recreate the stable PR just to refresh its base or body.

The implementation may report the current PR number for convenience, but policy decisions must be keyed to the branch identity.

## 4. PR state contract

An automation-created review PR must stay:

- open;
- draft;
- targeted at `main`;
- explicitly review-only.

Automation must not:

- mark it ready for review;
- approve it;
- enable auto-merge;
- merge it;
- close it after a successful run;
- change its base away from `main`;
- force-push the review branch;
- delete the review branch;
- convert it into a Canonical/publication PR.

A human may later make a separate reviewed decision, but PR-091 grants no authority for that decision.

## 5. Which run results update the queue

All PR-089 terminal dispositions are reviewable operational evidence, but they have different write effects.

| Run-log status | Queue update | Candidate file |
| --- | --- | --- |
| `success_candidate_generated` | run log + candidate reference + diff artifact reference | allowed, review-required |
| `success_no_candidates` | run log + explicit valid-empty result | allowed only if the source contract explicitly permits a valid empty candidate artifact |
| `offseason_noop` | run log/summary only | forbidden |
| `blocked_source` | run log/summary only | forbidden |
| `disabled_by_policy` | run log/summary only | forbidden |
| `source_error` | run log/summary only | forbidden |
| `route_or_provenance_error` | run log/summary only | forbidden |
| `parse_error` | run log/summary only | forbidden |
| `candidate_validation_error` | run log/summary only | forbidden |

A failure/no-op state must never be converted into guessed meeting data merely so the review PR has a candidate file.

For SOREC, the current `blocked` source state therefore creates only blocked review evidence. It must not create a Morocco timetable candidate until a separate reviewed source-verification change makes the source eligible.

## 6. Required pre-write validation

Before any M5 artifact is written to the stable review branch, the write-capable job must prove all of the following:

- the PR-089 run log validates;
- `run_mode` is `dry_run`;
- all publication effects remain disabled;
- the run country/source/adapter is compatible with its scheduler eligibility;
- any candidate artifact validates against its candidate schema and existing policy checks;
- any candidate path is inside the M5 candidate partition;
- any run-log path is inside the M5 run partition;
- no raw body/HTML, credentials, racecards, participants, betting/results/payouts, prediction/tip, or stream material is retained;
- the candidate hash referenced by the run log matches the candidate bytes that will be committed;
- the review branch head still equals the SHA read before preparing the update.

If any condition fails, do not commit a partial branch update.

## 7. Compare-and-swap branch update

The stable branch is written by automation and can also be inspected or changed by a human. A writer therefore must use compare-and-swap behavior.

Required sequence:

1. read the current review-branch head SHA;
2. prepare the complete bounded update against that exact SHA;
3. validate the resulting tree before moving the branch ref;
4. move the branch only if its head has not changed;
5. if the head changed, stop and retry from a fresh read in a later bounded attempt;
6. never resolve the race with a force push.

This prevents two unattended runs from silently overwriting one another or overwriting a human edit.

The future write-capable workflow must also use a concurrency group scoped to the stable M5 review branch.

## 8. No automatic rebasing or conflict resolution

The stable review branch is intentionally long-lived. Movement of `main` does not by itself authorize an automated rebase/merge of `main` into the review branch.

If GitHub reports the draft PR as behind or conflicting:

- do not force-push;
- do not automatically merge `main` into the review branch;
- do not recreate the PR;
- record the condition and stop the write-capable step;
- require an explicit reviewed maintenance action before writes resume if the conflict prevents safe updates.

Candidate freshness and branch freshness are different concepts.

## 9. PR body managed block

Automation may update one clearly delimited block in the stable PR body. It must preserve human-written text outside that block.

Recommended markers:

```text
<!-- m5-auto-review:start -->
...
<!-- m5-auto-review:end -->
```

The managed block should contain only review-safe summary fields:

- `REVIEW ONLY — NOT PUBLICATION` warning;
- latest M5 run ID;
- country / authority / adapter;
- resolved candidate window;
- PR-089 terminal status;
- candidate count and candidate SHA-256 when applicable;
- candidate repository path when applicable;
- PR-090 diff artifact name/run link when applicable;
- `human_review_required: true`;
- `candidate_approved: false`;
- `promotion_invoked: false`;
- `canonical_write: false`;
- `public_projection_write: false`;
- `merge: false`;
- `deploy: false`;
- explicit reminder that `baseline_only` on the diff page is **not a deletion instruction**.

Do not paste raw source bodies, large candidate payloads, secrets, or prohibited racing/betting content into the PR body.

## 10. Candidate diff linkage

For `success_candidate_generated`, the review surface must make the PR-090 diff artifact discoverable to the human reviewer.

The queue update must record enough identity to prove that the diff corresponds to the candidate being reviewed:

- workflow run ID;
- artifact name or artifact ID;
- candidate path;
- candidate SHA-256;
- baseline commit SHA used by the diff;
- candidate adapter/source identity.

The diff artifact itself remains read-only and has `approval_effect=none` and `publication_effect=none`.

An expired diff artifact does not turn an old candidate into approved evidence. If the artifact is no longer available when a human reviews the candidate, regenerate the diff from the immutable candidate + baseline identity rather than approving without comparison.

## 11. Commit contract

A routine M5 queue update should be one bounded commit per completed run result. The commit message should include the run identity and disposition, for example:

```text
Record M5 dry-run <run-id> <status>
```

A commit must contain only the paths authorized for that run. It must not include:

- Canonical timetable files;
- public projection files;
- site pages;
- deployment configuration;
- unrelated daily-acquisition history;
- changes made by another concurrent run;
- generated source-body archives.

If candidate generation succeeded but the branch update cannot be committed atomically, the run remains uncommitted review evidence and must not be considered queued/published.

## 12. Permissions boundary

Source acquisition and candidate validation should remain read-only wherever possible.

The future PR-update job is the only M5 step that may need elevated repository permissions:

```text
contents: write
pull-requests: write
```

That job must receive already-validated artifacts and must not fetch arbitrary untrusted code for execution.

Do not expose write-capable review-branch logic to untrusted fork pull-request code. Scheduled/default-branch execution or an equivalently trusted workflow context is required.

No job in this flow receives authority to deploy or approve environments.

## 13. Bootstrap PR template

If the exact stable review branch has no open PR and the trusted workflow is authorized to recreate the review surface, open a **draft** PR with wording equivalent to:

```text
# Calendar candidate acquisition review queue

REVIEW ONLY — NOT PUBLICATION.

This is the stable human-review queue for unattended Calendar acquisition/candidate evidence.
Automation may update bounded run logs, candidates, and diff references here.

Updating this PR does not approve any candidate and does not authorize Canonical promotion, public projection, merge, or deployment.

Human review is required before any separately controlled publication step.
```

The PR title may remain the existing `Calendar daily acquisition review queue` for continuity.

## 14. Failure behavior

Fail closed and leave the last valid stable review state untouched when:

- stable PR discovery is ambiguous;
- review branch identity is unexpected;
- branch head changes during the write attempt;
- artifact/run-log hashes disagree;
- a path escapes the M5 partitions;
- a candidate is attached to a status that forbids candidate output;
- a source/adapter is blocked or disabled but candidate data is present;
- the PR body managed markers are malformed/duplicated;
- a generated diff does not correspond to the candidate hash/baseline identity;
- a prohibited field or credential is detected;
- the update would touch Canonical/public/deploy files;
- GitHub reports a conflict that requires branch-history rewriting.

A failed auto-PR update is an operational failure, not permission to bypass the review queue.

## 15. Relationship to PR-092 and PR-093

PR-091 is a runbook only.

- **PR-092 — GitHub Actions dry-run** implements bounded scheduled/default-branch candidate-generation dry-runs and review artifacts. It must remain non-publishing.
- **PR-093 — Human review workflow** defines the explicit human approval/rejection step and any later controlled handoff. PR-091 does not pre-approve that handoff.

Until those gates exist, this runbook must not be interpreted as permission to add automatic promotion or public writes.

## 16. Acceptance criteria

PR-091 is complete when the repository documents that:

1. the existing stable draft review branch/PR is reused rather than spawning one PR per run;
2. PR discovery is branch-based and ambiguous discovery fails closed;
3. existing #559 daily-acquisition evidence is preserved;
4. M5 uses bounded non-overlapping candidate/run-log partitions;
5. all PR-089 dispositions have explicit queue/candidate behavior;
6. candidate hash and PR-090 diff identity are reviewable;
7. branch updates use compare-and-swap and never force-push;
8. the PR remains draft/review-only and automation cannot approve/merge/close it;
9. Canonical/public/deploy writes remain outside this job;
10. write permissions are isolated to the trusted PR-update step.

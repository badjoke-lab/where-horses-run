# M5 human review workflow

Status: adopted runbook for roadmap PR-093  
Scope: explicit human approval/rejection of a review-only M5 candidate artifact. This workflow does not promote, publish, merge, or deploy data.

## 1. Purpose

PR-092 can now generate scheduled TJK candidate artifacts without modifying Canonical or public data. PR-093 adds the missing explicit human decision boundary.

The reviewer must inspect the candidate diff and official-source links first. The decision is then recorded as a separate immutable review artifact bound to the exact source run and exact candidate SHA-256.

The candidate file itself stays `pending`. Approval in this workflow means only **approved for a separate handoff/review step**. It does not mean approved for Canonical promotion.

## 2. Review inputs

A human review decision is permitted only for a successful trusted M5 source run that:

- ran from `main`;
- used the `Calendar TJK current/future candidates` workflow;
- was triggered by `push`, `schedule`, or `workflow_dispatch`;
- completed successfully;
- produced `success_candidate_generated` in the PR-089 run log;
- produced a `timetable-candidate-v1` candidate that is still `pending`;
- produced a PR-090 review diff;
- kept all publication effects disabled.

The workflow resolves source-run metadata from GitHub itself. The reviewer does not supply the source head SHA or source event manually.

## 3. What the reviewer must inspect

Before choosing `approve`, inspect the source workflow artifact and confirm:

1. `run-log.json` reports `success_candidate_generated` and all publication effects remain false.
2. `candidate.json` contains only the intended country/authority/window and remains pending.
3. The candidate SHA-256 shown in the run log matches the value entered into the review workflow.
4. `candidate-diff.html` is opened and reviewed against the canonical baseline.
5. Official source links are plausible for each candidate meeting.
6. Public display rank does not exceed the approved public boundary.
7. A `baseline_only` diff row is understood as **not a deletion instruction**.
8. No raw HTML/body, racecard, runner/participant, betting, result/payout, prediction/tip, credential, or direct stream material is present.

For the current scheduled TJK adapter, unattended candidates are intentionally limited to Rank C: meeting date plus source-authority venue identity. Race times/details require a separate reviewed evidence path.

## 4. Running the review action

Open GitHub Actions and run `M5 human candidate review` on `main`.

Required inputs:

- `source_run_id`: the successful PR-092 source workflow run ID;
- `expected_candidate_sha256`: the exact SHA-256 from `run-log.json`;
- `decision`: `approve` or `reject`;
- `reason_code`: a short lowercase audit code such as `official-source-reviewed` or `source-needs-manual-recheck`.

The workflow downloads the exact named source artifact from that run and refuses a different workflow, branch, unsuccessful run, unsupported trigger, candidate hash mismatch, bot reviewer, tampered diff, or stale/rebuilt diff mismatch.

## 5. Diff binding

PR-093 does not trust the downloaded HTML diff by filename alone.

The decision builder:

1. reads the downloaded candidate;
2. verifies its SHA-256 against both the run log and the reviewer-supplied expected digest;
3. rebuilds the candidate diff using the Canonical meetings/details at the source run head;
4. requires the downloaded `candidate-diff.html` to be byte-equal to that rebuild;
5. records the source head SHA as the baseline commit SHA;
6. records diff counts and fixes `baseline_only_implies_deletion` to `false`.

A modified candidate or modified diff therefore cannot inherit an earlier review decision.

## 6. Decision artifact

The output uses `timetable-human-review-decision-v1` and records:

- source run ID, workflow, main head SHA, event, artifact name;
- candidate path, SHA-256, country, authority, adapter, record count;
- diff path, baseline commit SHA, and diff counts;
- human GitHub reviewer and timestamp;
- `approved_for_separate_handoff` or `rejected`;
- reason code;
- explicit non-publication effects.

The workflow uploads this as a short review artifact. It does not commit it to `main` or the public site.

## 7. Approval meaning

`approve` means:

- the reviewed candidate may move to a **separate controlled handoff**;
- the candidate remains pending and unmodified;
- no Canonical promotion has occurred;
- no public projection has occurred;
- no merge or deploy has occurred.

The review artifact explicitly keeps `candidate_approved_for_canonical_promotion: false`.

Any later promotion must be implemented and reviewed as a separate operation that consumes an exact candidate + exact human decision and re-validates the publication boundary.

## 8. Rejection meaning

`reject` is non-destructive.

It records that the exact candidate should not proceed from this review. It does not delete Canonical data, change public pages, mutate the candidate, close the stable review queue, or infer removal from missing/baseline-only records.

A later corrected scheduled run may create a new candidate with a different hash and require a new human review.

## 9. Permissions

The review workflow has only:

```text
actions: read
contents: read
```

It has no `contents: write`, no `pull-requests: write`, no deployment permission, and no promotion command.

The workflow has no schedule and no push trigger. Human decisions can be created only through `workflow_dispatch` on `main`.

## 10. Fail-closed cases

Do not create a review-decision artifact when:

- the selected source run is not the expected M5 TJK workflow;
- the source run is not from `main`;
- the source run did not succeed;
- the source event is untrusted;
- the source artifact name does not bind to the run/attempt;
- the run log is not a dry-run success with candidate output;
- the candidate is no longer pending;
- candidate SHA-256 disagrees anywhere;
- candidate country/authority/adapter disagree with the run log;
- the candidate diff does not byte-match a rebuild from the candidate and source-head baseline;
- a bot/automation identity is supplied as reviewer;
- the decision would mutate the candidate or invoke promotion/publication.

A failed review attempt is not permission to bypass the workflow.

## 11. Relationship to PR-094

PR-093 establishes who/what was reviewed and whether the exact candidate may proceed to a later handoff.

PR-094 is separate: it adds stale-data warnings to the public/user-facing experience. A human review decision does not make old data fresh, and freshness UI must remain independently derived from source/candidate timestamps.

# Manual JRA refresh

JRA updates are operator-triggered. There is no schedule, cron job, always-on PC requirement, self-hosted runner, or GitHub-hosted fetch.

## Run

From the repository root:

```bash
sh refresh-jra-manual
```

The current month in `Asia/Tokyo` is selected automatically.

To select another month:

```bash
sh refresh-jra-manual 2026-07
```

## What the command does

1. Requires a clean working tree.
2. Checks that `git`, `gh`, and `npm` are installed and that `gh` is authenticated.
3. Updates the local `main` branch with `origin/main` using fast-forward only.
4. Runs the existing `scripts/timetable/refresh-jra.mjs` Japanese programme-page fetcher for the whole selected month.
5. Rejects the result unless at least one meeting is extracted and every publishable meeting reaches A+.
6. Rejects HTTP, network, parser, runtime-boundary, and build failures.
7. Restores generated timetable files automatically when validation fails.
8. If data changed, commits only the approved generated timetable files to `automation/jra-manual-YYYY-MM`.
9. Pushes the branch and creates or updates a review PR.
10. Leaves production unchanged until the review PR is merged.

## Published fields

The existing JRA parser extracts only the approved public timetable fields:

- race label / number
- scheduled post time
- race name / condition
- distance
- surface
- course label

It does not store raw HTML, runners, horses, jockeys, trainers, odds, results, payouts, predictions, or tips.

## Failure behavior

A failed acquisition, incomplete A+ result, unexpected file change, runtime-boundary failure, or build failure does not push a branch and does not create a PR. The previously merged site data remains in place.

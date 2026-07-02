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

## Isolation behavior

The launcher does not modify or depend on the current local working tree. It creates a temporary partial clone, excludes the `docs/` directory from checkout, runs the refresh there, and removes the temporary clone when finished. This avoids unrelated local edits and antivirus false positives in country-note Markdown files.

## What the command does

1. Reads the repository's `origin` URL.
2. Creates an isolated temporary partial clone without checking out blobs first.
3. Enables sparse checkout and excludes `docs/`.
4. Checks that `git`, `gh`, and `npm` are installed and that `gh` is authenticated.
5. Runs the existing `scripts/timetable/refresh-jra.mjs` Japanese programme-page fetcher for the whole selected month.
6. Rejects the result unless at least one meeting is extracted and every publishable meeting reaches A+.
7. Runs the runtime-boundary check.
8. Regenerates and validates `japan-a-plus-overrides.json` against the new public timetable generation timestamp.
9. Installs the temporary checkout's build dependencies without creating a package lock file.
10. Builds the site with Astro.
11. Restores generated timetable files automatically when validation or build fails.
12. If data changed, commits only the approved generated timetable files to `automation/jra-manual-YYYY-MM`.
13. Pushes the branch and creates or updates a review PR.
14. Leaves production unchanged until the review PR is merged.

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

A failed acquisition, incomplete A+ result, stale Japan A+ override, dependency-install failure, unexpected file change, runtime-boundary failure, or build failure does not push a branch and does not create a PR. The previously merged site data remains in place, and the original working directory is not changed.

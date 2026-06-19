# Deployment and CI policy

Status: active canonical operations policy  
Applies to: all Where Horses Run development, pull requests, merges, previews, and production deployments  
Last reviewed: 2026-06-19

## 1. Purpose

Development speed must not be reduced to accommodate Cloudflare Pages queueing. Instead, development, validation, preview deployment, and production deployment are separated so that only changes requiring a rendered deployment consume Cloudflare build capacity.

This file is the repository-level source of truth for deployment and CI decisions. Every contributor, agent, runbook, and PR sequence must follow it.

## 2. Current Cloudflare constraints

As verified against the official Cloudflare Pages documentation on 2026-06-19:

- the Free plan allows one Pages build at a time per account
- the Free plan allows 500 Pages builds per month
- concurrency is counted per account, not per project
- a Git-connected Pages project normally builds on every pushed commit unless a skip or branch rule applies
- build caching is available on Build System V2 or later

Official references:

- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- https://developers.cloudflare.com/pages/configuration/branch-build-controls/
- https://developers.cloudflare.com/pages/configuration/build-caching/

These numbers may change. Reverify the official limits before changing this policy because of a platform limit.

## 3. Core rule

Cloudflare deployment is not a general CI gate.

Use GitHub Actions for data, schema, reference, route-generation, and production-build validation. Use Cloudflare only when a rendered preview or production deployment is materially required.

## 4. Deployment matrix

| PR type | GitHub validation | Cloudflare preview | Production deployment |
| --- | --- | --- | --- |
| Source test | validators only | no | no |
| Reviewed note | validators only | no | no |
| Profile v2 | validators plus one GitHub production build | no by default | no |
| Documentation or roadmap | targeted validators only | no | no |
| QA and publish | validators plus one GitHub production build | one final preview | one deployment after merge |
| Emergency production fix | targeted validators plus production build | one preview when practical | one deployment after merge |

Normal target per eight-entry wave:

```text
source-test PR:      0 Cloudflare deployments
reviewed-note PR:    0 Cloudflare deployments
profile-v2 PR:       0 Cloudflare deployments
QA/publish PR:       1 preview + 1 production deployment
wave maximum:        2 Cloudflare deployments
```

## 5. Commit-message rules

Every intermediate commit that does not intentionally request a Cloudflare deployment must begin with:

```text
[CF-Pages-Skip]
```

Examples:

```text
[CF-Pages-Skip] Add source-test summaries for entries 21-28
[CF-Pages-Skip] Update country profile validator
[CF-Pages-Skip] Synchronize tracker state
```

Cloudflare also recognizes other skip prefixes, but this repository standardizes on `[CF-Pages-Skip]`.

### Merge commits

Non-publication PRs must use a squash merge title beginning with `[CF-Pages-Skip]`.

```text
[CF-Pages-Skip] Add official source tests for entries 21-28 (#297)
```

QA/publish PRs and emergency production fixes must not use the skip prefix on the final deployment commit.

```text
Publish country pages for entries 21-28 (#300)
```

## 6. Branch rules

Normal development branches do not request previews.

Examples:

```text
country-source-tests-21-28
country-notes-21-28
country-profiles-21-28
```

A branch intended to receive a Cloudflare preview must begin with:

```text
preview-
```

Example:

```text
preview-country-pages-21-28
```

The preferred Cloudflare Pages branch-control configuration is:

```text
production branch: main
automatic production deployments: enabled
preview branch mode: custom
preview include pattern: preview-*
```

Until this dashboard configuration is confirmed, commit-message skip prefixes remain mandatory for all non-deployment commits.

## 7. Cloudflare dashboard baseline

One-time operator configuration:

1. Open Workers & Pages.
2. Open the Where Horses Run Pages project.
3. Open Settings > Build > Branch control.
4. Keep `main` as the production branch.
5. Set preview branches to Custom.
6. Include `preview-*` and exclude normal development branches.
7. Open Settings > Build > Build cache.
8. Enable build caching.

Configuration status:

```text
branch control: pending operator confirmation
build cache: pending operator confirmation
```

Update this status only after the dashboard values have been visually confirmed.

## 8. GitHub Actions rules

### One build per head

A pull-request head should perform at most one full dependency installation and one full production build.

Data and documentation validators should run without `npm install` when they do not require project dependencies.

When several validators require the built site, they should share one build artifact instead of rebuilding independently.

### Cancel obsolete runs

Long-running workflows should use concurrency cancellation.

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

A newer commit makes previous runs for the same PR obsolete.

### No routine self-mutating workflows

Workflows that push commits back to the PR branch are prohibited in normal development because they create extra commits, CI runs, and deployment triggers.

If a one-time migration genuinely requires a self-mutating workflow:

- run it once
- ensure it is idempotent
- remove it before review
- leave no write-permission workflow in the final PR diff

### Build checks

GitHub production-build success is sufficient for source-test, reviewed-note, and profile-v2 PRs. Cloudflare status must not be polled or treated as a merge gate for those PR types.

## 9. QA and publication sequence

For a QA/publish PR:

1. Complete data and code changes on non-preview commits using `[CF-Pages-Skip]`.
2. Pass GitHub validators and the single GitHub production build.
3. Move or copy the final reviewed head to a `preview-*` branch if necessary.
4. Trigger exactly one Cloudflare preview deployment.
5. Perform rendered-page QA.
6. Merge without a skip prefix.
7. Confirm the single production deployment.

Do not trigger repeated previews for minor data or documentation corrections that GitHub validation can resolve.

## 10. Cloudflare polling rule

Do not repeatedly poll Cloudflare deployment status during ordinary development.

Cloudflare status is checked only:

- once for the final QA/publish preview
- once after a production merge
- when diagnosing a confirmed deployment failure

GitHub CI remains the normal progress signal.

## 11. Exception handling

A deployment outside the matrix requires a written reason in the PR body or runbook.

Valid reasons include:

- a rendering defect cannot be reproduced by the GitHub build
- a Cloudflare-specific header, redirect, function, or environment issue is being tested
- an emergency production repair
- a rollback verification

“Check whether it works” is not sufficient when the GitHub production build already covers the change.

## 12. Maintenance rules

Update this policy when any of the following changes:

- Cloudflare plan or account
- production branch
- preview branch convention
- Cloudflare Pages build system
- deployment provider
- GitHub Actions build architecture
- standard PR wave

Every development documentation index must link to this policy. The country-page roadmap CI must watch and validate it together with the roadmap and tracker.

Every non-publication merge report must confirm that Cloudflare deployment was skipped. Every QA/publish merge report must state the preview and production deployment results.

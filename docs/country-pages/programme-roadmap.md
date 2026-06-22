# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-22

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme.

The programme is complete only when all 98 tracker rows and all 196 bilingual routes satisfy the completion contract.

## 2. Current position

```text
Latest confirmed merge: PR #311
Publication gate: PR #311 — merged; entries 21-28 published; production trigger commit active
Second publication gate: PR #304 — stale Draft; entries 29-36; rebuild from latest main required
Third publication gate: PR #308 — stale Draft; entries 37-44; rebuild from latest main required
Next working PR: #314
Next working branch: country-profiles-45-52
Final release gate: #340
```

Current tracker counts after corrected preview approval:

```text
published:       28
profile_ready:   16
note_reviewed:    8
source_tested:    0
not_started:     46
total:           98
```

Current route state:

```text
formally published English routes:   28
formally published Japanese routes:  28
formally published total routes:     56
profile-ready English routes:        16
profile-ready Japanese routes:       16
profile-ready total routes:          32
final target routes:                196
```

PR #311 replaces the closed, superseded PR #300 for entries 21-28. PR #304 and PR #308 remain stale Draft gates and must be rebuilt from the latest main before their own rendered previews. Source-test, reviewed-note, and Profile v2 work continues independently without Cloudflare.

## 3. Operating model

GitHub work is performed directly in the repository whenever possible:

- branch creation
- data and documentation changes
- validators and workflows
- Draft PR creation
- CI diagnosis and repair
- review and merge
- tracker and roadmap updates

Local work is requested only when a required official source cannot be resolved remotely because of access controls, regional restrictions, login requirements, JavaScript-only delivery, or files available only on the user's device.

All country-page branches, PRs, workflows, previews, and merges follow `docs/operations/deployment-and-ci-policy.md`.

- Source-test, reviewed-note, and Profile v2 PRs do not use Cloudflare.
- QA/publish PRs remain Draft until one final rendered preview passes.
- Nondeployment commits and nonpublication squash merges use `[CF-Pages-Skip]`.
- A publication wave uses one final preview and one production deployment after merge.

## 4. Standard four-PR wave

| Stage | Purpose | Typical tracker transition |
| --- | --- | --- |
| Source test | Confirm official routes, source roles, capability, limitations, and public ceiling | `not_started` -> `source_tested` |
| Reviewed note | Convert source findings into reusable editorial decisions | `source_tested` -> `note_reviewed` |
| Profile v2 | Create bilingual profiles and reviewed registry references | `note_reviewed` -> `profile_ready` |
| QA and publish | Validate routes, metadata, layout, accessibility, and publication boundary | `profile_ready` -> `published` |

A source-test limitation does not automatically block a page. It may produce a link-first, pending, explanatory, special, or archive treatment.

## 5. Public display boundary

```text
C   meeting date and racecourse
B   first-race time
B+  first-race and last-race times
A   race label or number plus post time
A+  selected detail-page fields only after a separate review
```

List pages remain one meeting per row at every rank.

Do not publish runners or horses, participants, weights, odds, betting recommendations, results, payouts, predictions, complete racecards, raw official text, embedded video, direct stream URLs, or unofficial mirrors.

## 6. Completed work and open gates

| PR | Status | Result |
| ---: | --- | --- |
| #284 | merged | Created the 98-row tracker, completion contract, states, and baseline validator. |
| #285 | merged | Added public-safe source-test export rules and validation. |
| #286 | merged | Added the country Profile v2 schema and prohibited-field validation. |
| #287 | merged | Added the v2-first country-page runtime. |
| #288 | merged | Canonicalised country, source, and racecourse IDs for entries 01-12. |
| #289 | merged | Added profiles for entries 01-04. |
| #290 | merged | Added profiles for entries 05-08. |
| #291 | merged | Added profiles for entries 09-12. |
| #292 | merged | Published entries 01-12. |
| #293 | merged | Added source tests for entries 13-20. |
| #294 | merged | Added reviewed notes for entries 13-20. |
| #295 | merged | Added Profile v2 records for entries 13-20. |
| #296 | merged | Published entries 13-20. |
| #297 | merged | Added source tests for entries 21-28 and deployment policy. |
| #298 | merged | Added reviewed notes for entries 21-28. |
| #299 | merged | Added Profile v2 records for entries 21-28. |
| #300 | closed, superseded | Replaced by PR #311; retained only as historical reference. |
| #301 | merged | Added source tests for entries 29-36. |
| #302 | merged | Added reviewed notes for entries 29-36. |
| #303 | merged | Added Profile v2 records for entries 29-36. |
| #304 | Draft gate | GitHub QA for entries 29-36 passed; rendered preview remains. |
| #305 | merged | Added source tests and conservative country ceilings for entries 37-44. |
| #306 | merged | Added reviewed country notes for entries 37-44. |
| #307 | merged | Added Profile v2 records for entries 37-44. |
| #308 | Draft gate | GitHub QA for entries 37-44 passed; rendered preview remains. |
| #309 | merged | Added official source tests for entries 45-52. |
| #310 | merged | Added reviewed notes for entries 45-52 and remediated public country-page copy. |
| #311 | merged | Published entries 21-28 after corrected rendered-preview approval. |
| #312 | closed, unmerged | Temporary preview-probe evidence only. |
| #313 | closed, unmerged | Temporary Cloudflare preview trigger only. |

## 7. Publication gates

### PR #311 — entries 21-28

Corrected preview status:

1. Cloudflare deployment `19067203` succeeded from the preview-only branch.
2. Representative Hungary and Malta pages passed rendered English/Japanese HTML checks.
3. Desktop and mobile screenshots passed responsive review with Japanese CJK fonts.
4. Entries 21-28 are recorded as `published`.
5. PR #311 merged as `87eee53b4d6d1cf30f6897012f9dcc8724b53786`.
6. This roadmap update is the dedicated production trigger; confirm one deployment and the two representative production routes after Cloudflare completes.

### PR #304 — entries 29-36

The same final-preview and production sequence applies independently. Until approval, entries 29-36 remain `profile_ready` with no publication date.

## 8. Wave 37-44

Entries:

```text
37 Malaysia
38 Thailand
39 Philippines
40 Mauritius
41 Argentina
42 Germany
43 Italy
44 Spain
```

| PR | Status | Work and completion condition |
| ---: | --- | --- |
| #305 | merged | Added official source tests and advanced all eight entries to `source_tested`. |
| #306 | merged | Added reviewed notes and advanced all eight entries to `note_reviewed`. |
| #307 | merged | Added Profile v2 records and advanced all eight entries to `profile_ready`. |
| #308 | Draft gate | GitHub pre-preview QA passed; rendered preview remains. |

Reviewed country ceilings retained through PR #307:

- Malaysia, Thailand, Philippines, Mauritius, Argentina, Germany, Italy, and Spain remain C.
- Argentina, Germany, and Spain expose A-level detail in reviewed subsystems, but the country ceiling remains C because wider racecourse or horse-racing-code coverage is incomplete.
- Mauritius preserves regulator and organiser roles separately.
- Italy preserves trot and gallop as distinct racing contexts.

## 9. Wave 45-52

Entries: Norway, Finland, Netherlands, Switzerland, Poland, Romania, Serbia, and Slovakia.

| PR | Status | Work and completion condition |
| ---: | --- | --- |
| #309 | merged | Added official source tests and advanced all eight entries to `source_tested`. |
| #310 | merged | Added reviewed notes and advanced all eight entries to `note_reviewed`. |
| #314 | next | Add Profile v2 records and reach `profile_ready`. |
| #315 | planned | QA and publish sixteen routes after one final rendered preview. |

All eight reviewed country ceilings remain C. Detailed capability in Ploiesti, Belgrade, and Slovakia is not generalized beyond the reviewed scope.

## 10. Remaining wave schedule

| Entries | Source test | Reviewed note | Profile v2 | QA and publish |
| --- | ---: | ---: | ---: | ---: |
| 45-52 | #309 | #310 | #314 | #315 |
| 53-60 | #316 | #317 | #318 | #319 |
| 61-68 | #320 | #321 | #322 | #323 |
| 69-76 | #324 | #325 | #326 | #327 |
| 77-84 | #328 | #329 | #330 | #331 |
| 85-92 | #332 | #333 | #334 | #335 |
| 93-98 | #336 | #337 | #338 | #339 |

Each wave preserves separate authorities and racing systems, records incomplete coverage honestly, and publishes only routes satisfying the completion contract.

## 11. Final release gate

### PR #340 — full programme audit

PR #340 adds no new country scope. Required checks:

```text
tracker rows exactly 98
English routes exactly 98
Japanese routes exactly 98
bilingual routes exactly 196
no duplicate slugs
no missing country IDs
no dangling source IDs
no dangling racecourse IDs
all production profiles use v2
page-kind listing rules are correct
archive and explanatory pages are absent from current calendars
published rows have review and publication dates
all pages have explicit coverage and source states
all public ceilings are enforced
one meeting per list row
prohibited fields are absent
private and local source files are absent from the public build
all validators pass
full production build passes
final programme report is generated
```

The programme closes only after PR #340 is merged and the tracker reports 98 published rows.

## 12. Roadmap maintenance rules

Update this roadmap in the same PR whenever the working PR, publication gates, tracker counts, wave boundaries, completion conditions, final release criteria, or local-work requirements change.

Every merge report states the PR number and title, merge SHA, changed behaviour and files, CI result, tracker counts, local-work requirement, remaining schedule position, and next PR.

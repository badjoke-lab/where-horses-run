# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-20

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme.

The programme is complete only when all 98 tracker rows and all 196 bilingual routes satisfy the completion contract.

## 2. Current position

```text
Latest confirmed merge: PR #306
Publication gate: PR #300 — Draft; entries 21-28; Cloudflare preview pending
Second publication gate: PR #304 — Draft; entries 29-36; Cloudflare preview pending
Parallel working PR: #307
Parallel working branch: country-profiles-37-44
Next PR after #307: #308
Final release gate: #337
```

Current tracker counts on the PR #307 head:

```text
published:       20
profile_ready:   24
note_reviewed:    0
source_tested:    0
not_started:     54
total:           98
```

Current route state:

```text
formally published English routes:   20
formally published Japanese routes:  20
formally published total routes:     40
profile-ready English routes:        24
profile-ready Japanese routes:       24
profile-ready total routes:          48
final target routes:                196
```

PR #300 and PR #304 remain independent publication gates. They must not merge or mark their entries published until their respective final rendered Cloudflare previews are reviewed. Source-test, reviewed-note, and Profile v2 work continues independently without Cloudflare.

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
| #300 | Draft gate | GitHub QA for entries 21-28 passed; rendered preview remains. |
| #301 | merged | Added source tests for entries 29-36. |
| #302 | merged | Added reviewed notes for entries 29-36. |
| #303 | merged | Added Profile v2 records for entries 29-36. |
| #304 | Draft gate | GitHub QA for entries 29-36 passed; rendered preview remains. |
| #305 | merged | Added source tests and conservative country ceilings for entries 37-44. |

## 7. Publication gates

### PR #300 — entries 21-28

Remaining work:

1. Create or move one final `preview-*` branch to the reviewed head.
2. Review representative A and C pages in English and Japanese.
3. Check responsive layout, source links, language switching, and empty states.
4. Advance passing rows to `published`.
5. Merge without `[CF-Pages-Skip]` and confirm one production deployment.

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
| #306 | merged | Add reviewed notes and advance all eight entries to `note_reviewed`. |
| #307 | in progress | Add Profile v2 records and reach `profile_ready`. |
| #308 | next | QA and publish sixteen routes after one final rendered preview. |

Reviewed country ceilings retained through PR #307:

- Malaysia, Thailand, Philippines, Mauritius, Argentina, Germany, Italy, and Spain remain C.
- Argentina, Germany, and Spain expose A-level detail in reviewed subsystems, but the country ceiling remains C because wider racecourse or horse-racing-code coverage is incomplete.
- Mauritius preserves regulator and organiser roles separately.
- Italy preserves trot and gallop as distinct racing contexts.

## 9. Remaining wave schedule

| Entries | Source test | Reviewed note | Profile v2 | QA and publish |
| --- | ---: | ---: | ---: | ---: |
| 45-52 | #309 | #310 | #311 | #312 |
| 53-60 | #313 | #314 | #315 | #316 |
| 61-68 | #317 | #318 | #319 | #320 |
| 69-76 | #321 | #322 | #323 | #324 |
| 77-84 | #325 | #326 | #327 | #328 |
| 85-92 | #329 | #330 | #331 | #332 |
| 93-98 | #333 | #334 | #335 | #336 |

Each wave preserves separate authorities and racing systems, records incomplete coverage honestly, and publishes only routes satisfying the completion contract.

## 10. Final release gate

### PR #337 — full programme audit

PR #337 adds no new country scope. Required checks:

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

The programme closes only after PR #337 is merged and the tracker reports 98 published rows.

## 11. Roadmap maintenance rules

Update this roadmap in the same PR whenever the working PR, publication gates, tracker counts, wave boundaries, completion conditions, final release criteria, or local-work requirements change.

Every merge report states the PR number and title, merge SHA, changed behaviour and files, CI result, tracker counts, local-work requirement, remaining schedule position, and next PR.

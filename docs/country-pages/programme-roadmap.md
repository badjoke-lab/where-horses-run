# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-29

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme.

The programme is complete only when all 98 tracker rows and all 196 bilingual routes satisfy the completion contract.

The PR-number assignments in the older schedule sections are historical. Active sequencing is defined by `docs/project-roadmap.md` and the 2026-06-28 addendum.

## 2. Current position

```text
Latest completed Source Test v2 change: PR #326 — entries 53-60
Latest country publication: PR #325 — entries 45-52 approved after rendered preview
Publication gate: PR #325 — entries 45-52 published after approved rendered preview
Current Work ID: WHR-NOTE-53-60
Next working branch: country-notes-53-60
Final release gate: WHR-AUDIT-COUNTRY-CALENDAR-98
```

Current tracker counts after entries 45-52 preview approval:

```text
published:       52
profile_ready:    0
note_reviewed:    0
source_tested:    8
not_started:     38
total:           98
```

Current route state:

```text
formally published English routes:   52
formally published Japanese routes:  52
formally published total routes:    104
profile-ready English routes:         0
profile-ready Japanese routes:        0
profile-ready total routes:           0
final target routes:                196
```

PR #326 closes Source Test v2 and Calendar Readiness decisions for entries 53-60. Reviewed-note work for these entries is now active.

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
| #304 | closed, superseded | Replaced by current-main publication PR #317. |
| #305 | merged | Added source tests and conservative country ceilings for entries 37-44. |
| #306 | merged | Added reviewed country notes for entries 37-44. |
| #307 | merged | Added Profile v2 records for entries 37-44. |
| #308 | closed, superseded | Replaced by current-main publication PR #319. |
| #309 | merged | Added official source tests for entries 45-52. |
| #310 | merged | Added reviewed notes for entries 45-52 and remediated public country-page copy. |
| #311 | merged | Published entries 21-28 after corrected rendered-preview approval. |
| #312 | closed, unmerged | Temporary preview-probe evidence only. |
| #313 | closed, unmerged | Temporary Cloudflare preview trigger only. |
| #316 | merged | Added machine-readable Source Test v2 and Calendar Readiness contracts. |
| #317 | merged | Published entries 29-36 after immutable rendered-preview approval. |
| #319 | merged | Published entries 37-44 after rendered-preview approval. |
| #321 | merged | Closed Calendar Readiness for entries 01-20 with 30 system/source decisions. |
| #322 | merged | Closed entries 21-36 with 21 additional system/source decisions; implementation remains not started. |
| #323 | merged | Completed entries 37-52 with 19 additional system/source decisions; implementation remains not started. |
| #324 | merged | Added reviewed Profile v2 records for entries 45-52. |
| #325 | publication | Published entries 45-52 after rendered-preview approval. |
| #326 | Source Test v2 | Closed official-source and Calendar Readiness decisions for entries 53-60. |

## 7. Publication gates

### PR #311 — entries 21-28

Corrected preview status:

1. Cloudflare deployment `19067203` succeeded from the preview-only branch.
2. Representative Hungary and Malta pages passed rendered English/Japanese HTML checks.
3. Desktop and mobile screenshots passed responsive review with Japanese CJK fonts.
4. Entries 21-28 are recorded as `published`.
5. PR #311 merged as `87eee53b4d6d1cf30f6897012f9dcc8724b53786`.
6. This roadmap update is the dedicated production trigger; confirm one deployment and the two representative production routes after Cloudflare completes.

### PR #317 — entries 29-36

Rendered preview approval:

1. Cloudflare deployment `747c0076` succeeded from `preview-country-pages-29-36`.
2. Ireland (A) and United Kingdom (C) passed live English/Japanese HTML checks.
3. Desktop and Pixel 7 screenshots passed responsive and CJK review.
4. Canonical, hreflang, language switching, official links, empty states, and C-column suppression passed.
5. Entries 29-36 are recorded as `published` on 2026-06-28.
6. PR #317 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.

### PR #319 — entries 37-44

Rendered preview approval:

1. `preview-country-pages-37-44` passed live checks for all 16 English/Japanese routes.
2. Malaysia and Italy passed English/Japanese desktop and Pixel 7 screenshot review.
3. Canonical, hreflang, language switching, official links, empty states, CJK rendering, and C-column suppression passed.
4. Evidence artifact `rendered-preview-37-44` is artifact `7936442604` with digest `sha256:8d1f3c314a36ddaeb821115051f51d758aad103d5854a37e6babc82a921c53e0`.
5. Entries 37-44 are recorded as `published` on 2026-06-28.
6. PR #319 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.

### PR #325 — entries 45-52

Rendered preview approval:

1. `preview-country-pages-45-52` passed live checks for all 16 English/Japanese routes.
2. Norway, Switzerland, Romania, and Slovakia passed English/Japanese desktop and Pixel 7 rendered review.
3. Canonical, hreflang, language switching, official links, empty states, CJK rendering, horizontal overflow, prohibited output, and C-rank column suppression passed.
4. Evidence artifact `rendered-preview-45-52` is artifact `7943936486` with digest `sha256:663817f1622d1d8328f042c6a7305f2202001b2290945407b4518a7078dc0014`.
5. Entries 45-52 are recorded as `published` on 2026-06-29.
6. PR #325 must merge without `[CF-Pages-Skip]`, followed by one production-deployment confirmation.

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
| #308 | closed, superseded | Replaced by PR #319. |
| #319 | publication | Published all sixteen routes after rendered-preview approval. |

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
| #324 | merged | Added eight reviewed Profile v2 records and reached `profile_ready`. |
| #325 | publication | Published all sixteen routes after rendered-preview approval. |

All eight reviewed country ceilings remain C. Detailed capability in Ploiesti, Belgrade, and Slovakia is not generalized beyond the reviewed scope.

## 10. Wave 53-60

Entries: Cyprus, Panama, Kuwait, Kenya, Pakistan, Ecuador, Venezuela, and Belgium.

| Work | Status | Result |
| --- | --- | --- |
| #326 / `WHR-ST2-53-60` | complete | Added eight public-safe Source Test v2 records and eight Calendar Readiness decisions. |
| `WHR-NOTE-53-60` | next | Convert the verified boundaries into reviewed editorial notes. |
| `WHR-PROFILE-53-60` | planned | Add bilingual Profile v2 records. |
| `WHR-PUB-53-60` | planned | QA and publish after one rendered preview. |

Readiness result: 2 prototype-ready, 3 manual-ready, 2 link-only, and 1 blocked. Belgium retains technical rank A behind country public ceiling C; all other country ceilings remain C.

## 11. Remaining wave schedule

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

## 12. Final release gate

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

## 13. Roadmap maintenance rules

Update this roadmap in the same PR whenever the working PR, publication gates, tracker counts, wave boundaries, completion conditions, final release criteria, or local-work requirements change.

Every merge report states the PR number and title, merge SHA, changed behaviour and files, CI result, tracker counts, local-work requirement, remaining schedule position, and next PR.

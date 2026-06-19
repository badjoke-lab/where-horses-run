# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-20

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme.

The roadmap uses actual GitHub PR numbers. Older planning labels such as `PR-065` are historical planning identifiers and are not the current execution sequence.

The programme is complete only when all 98 tracker rows and all 196 bilingual routes satisfy the completion contract.

## 2. Current position

```text
Contiguous publication sequence merged through: PR #299
Latest confirmed merge: PR #301
Publication gate: PR #300 — Draft; GitHub QA passed; Cloudflare preview pending
Publication branch: country-pages-21-28-publication-qa
Parallel working PR: #302
Parallel working branch: country-notes-29-36
Next PR after #302: #303
Final release gate: #337
```

Current tracker counts on the PR #302 head:

```text
published:       20
profile_ready:    8
note_reviewed:    8
source_tested:    0
not_started:     62
total:           98
```

Current route state:

```text
formally published English routes:   20
formally published Japanese routes:  20
formally published total routes:     40
profile-ready English routes:         8
profile-ready Japanese routes:        8
profile-ready total routes:          16
final target routes:                196
```

PR state:

```text
roadmap range: #284-#337
merged foundation and waves: #284-#299, #301
publication gate open:       #300
parallel editorial work:     #302
next planned:                #303
```

PR #300 remains the publication gate for entries 21-28. It must not merge or mark those entries published until one final rendered Cloudflare preview is reviewed. Independent source-test, reviewed-note, and profile work may continue in parallel because those stages do not require Cloudflare.

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

When local work is required, the request must specify the exact country or source, URL or file, required action, allowed output, prohibited content, and expected handoff format.

All country-page branches, PRs, workflows, previews, and merges follow `docs/operations/deployment-and-ci-policy.md`.

- Source-test, reviewed-note, and profile-v2 PRs do not use Cloudflare.
- QA/publish work uses a normal branch until GitHub validation passes.
- A QA/publish wave uses one final `preview-*` deployment and one production deployment after merge.
- Nondeployment commits and nonpublication squash merges use `[CF-Pages-Skip]`.

## 4. Standard four-PR wave

| Stage | Purpose | Typical tracker transition |
| --- | --- | --- |
| Source test | Confirm official routes, source roles, technical capability, limitations, and public ceiling | `not_started` -> `source_tested` |
| Reviewed note | Convert findings into reusable editorial decisions | `source_tested` -> `note_reviewed` |
| Profile v2 | Create bilingual structured profiles and required registry records | `note_reviewed` -> `profile_ready` |
| QA and publish | Validate routes, metadata, links, responsive layout, accessibility, and publication boundary | `profile_ready` -> `published` |

A source-test failure does not automatically block a page. It may produce a link-first, pending, explanatory, special, or archive treatment instead.

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

## 6. Completed work

| PR | Status | Result |
| ---: | --- | --- |
| #284 | merged | Created the 98-row tracker, completion contract, states, and baseline validator. |
| #285 | merged | Added public-safe source-test export rules, schema, fixtures, validator, and workflow. |
| #286 | merged | Added the country profile v2 schema and prohibited-field validation. |
| #287 | merged | Added v2-first country-page runtime. |
| #288 | merged | Canonicalised country, source, and racecourse IDs for entries 01-12. |
| #289 | merged | Added profiles for entries 01-04. |
| #290 | merged | Added profiles for entries 05-08. |
| #291 | merged | Added profiles for entries 09-12. |
| #292 | merged | Published entries 01-12. |
| #293 | merged | Added source tests for entries 13-20. |
| #294 | merged | Added reviewed notes for entries 13-20. |
| #295 | merged | Added profile v2 records for entries 13-20 and removed legacy runtime fallback. |
| #296 | merged | Published entries 13-20. |
| #297 | merged | Added source tests for entries 21-28 and the deployment/CI policy. |
| #298 | merged | Added reviewed notes for entries 21-28. |
| #299 | merged | Added profile v2 records and profile-ready routes for entries 21-28. |
| #301 | merged | Added official source tests and conservative country ceilings for entries 29-36. |

## 7. Publication gate for entries 21-28

### PR #300 — QA and publish entries 21-28

GitHub-side QA has validated all sixteen English and Japanese routes, canonical and hreflang metadata, language switching, official source links, one-h1 structure, empty states, v2-only runtime, and A/C public ceilings.

Remaining gate:

1. Review exactly one final Cloudflare `preview-*` deployment.
2. Check representative A and C pages in English and Japanese.
3. Confirm responsive layout, source links, language switching, and empty states.
4. Advance only passing rows to `published`.
5. Merge without `[CF-Pages-Skip]` and confirm one production deployment.

Until this gate passes, entries 21-28 remain `profile_ready` and PR #300 remains Draft.

## 8. Wave 29-36

Entries:

```text
29 United Kingdom
30 United States
31 Australia
32 Ireland
33 France
34 Canada
35 Saudi Arabia
36 India
```

| PR | Status | Work and completion condition |
| ---: | --- | --- |
| #301 | merged | Added source tests with national completeness separated from subsystem capability. |
| #302 | in progress | Add reviewed notes and advance all eight entries to `note_reviewed`. |
| #303 | next | Add Profile v2 records, reviewed registry references, and reach `profile_ready`. |
| #304 | planned | QA and publish. Validate sixteen routes and use one final preview. |

Reviewed ceilings retained through PR #302:

- A public ceiling: Ireland, France, Saudi Arabia.
- C public ceiling: United Kingdom, United States, Australia, Canada, India.
- United States, Australia, Canada, and India expose A-level detail in reviewed subsystems but remain C at country level because national multi-authority or multi-code completeness is not established.

## 9. Remaining wave schedule

| Entries | Source test | Reviewed note | Profile v2 | QA and publish |
| --- | ---: | ---: | ---: | ---: |
| 37-44 | #305 | #306 | #307 | #308 |
| 45-52 | #309 | #310 | #311 | #312 |
| 53-60 | #313 | #314 | #315 | #316 |
| 61-68 | #317 | #318 | #319 | #320 |
| 69-76 | #321 | #322 | #323 | #324 |
| 77-84 | #325 | #326 | #327 | #328 |
| 85-92 | #329 | #330 | #331 | #332 |
| 93-98 | #333 | #334 | #335 | #336 |

Each wave preserves separate authorities and racing systems, records incomplete coverage honestly, uses only reviewed references, and publishes only routes satisfying the completion contract.

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

Update this roadmap in the same PR whenever the working PR, publication gate, tracker counts, wave boundaries, completion conditions, final release criteria, or local-work requirements change.

Every merge report states the PR number and title, merge SHA, changed behaviour and files, CI result, tracker counts, local-work requirement, remaining schedule position, and next PR.

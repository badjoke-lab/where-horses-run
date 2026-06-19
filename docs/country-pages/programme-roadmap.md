# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-19

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme. The programme closes only when all 98 rows and all 196 bilingual routes satisfy the completion contract.

## 2. Current position

```text
Merged through: PR #299
Latest confirmed merge: PR #299
Working PR: #300
Working branch: country-pages-21-28-publication-qa
Next PR: #301
Final release gate: #337
```

Current tracker counts on the PR #299 head:

```text
published:       20
profile_ready:    8
not_started:     70
total:           98
```

Current route state:

```text
formally published English routes:   20
formally published Japanese routes:  20
formally published total routes:     40
profile-ready routes awaiting QA:    16
final target routes:                196
```

PR count:

```text
roadmap range: #284-#337
merged:        #284-#299 = 16 PRs
in progress:   #300
remaining after #300: #301-#337
```

## 3. Operating model

GitHub work is performed directly in the repository whenever possible: branch creation, data and documentation changes, validators, workflows, Draft PR creation, CI diagnosis, review, merge, tracker updates, and roadmap updates.

Local work is requested only when a required official source cannot be resolved remotely because of access controls, regional restrictions, login requirements, JavaScript-only delivery, or files available only on the user's device. Local requests must identify the exact source, action, allowed output, prohibited content, and handoff format.

All branch, PR, workflow, preview, and merge work follows `docs/operations/deployment-and-ci-policy.md`. Source-test, note, and profile PRs do not use Cloudflare. QA/publish PRs use one final preview and one production deployment only.

## 4. Standard four-PR wave

| Stage | Purpose | Tracker transition |
| --- | --- | --- |
| Source test | Confirm official routes, source roles, capability, limitations, and public ceiling | `not_started` -> `source_tested` |
| Reviewed note | Convert findings into reusable editorial decisions | `source_tested` -> `note_reviewed` |
| Profile v2 | Create bilingual structured profiles and reviewed registry references | `note_reviewed` -> `profile_ready` |
| QA and publish | Validate routes, metadata, links, layout, accessibility, and publication boundary | `profile_ready` -> `published` |

A source-test failure may produce a link-first, pending, explanatory, special, or archive treatment rather than blocking the page.

## 5. Public display boundary

```text
C   meeting date and racecourse
B   first-race time
B+  first-race and last-race times
A   race label or number plus post time
A+  selected detail-page fields only after a separate review
```

List pages remain one meeting per row. Do not publish runners, participants, weights, odds, results, payouts, predictions, complete racecards, raw official text, embedded video, direct stream URLs, or unofficial mirrors.

## 6. Completed work

| PR | Status | Result |
| ---: | --- | --- |
| #284 | merged | Created the 98-row tracker and completion programme. |
| #285 | merged | Added public-safe source-test handoff tooling. |
| #286 | merged | Defined the country profile v2 contract. |
| #287 | merged | Routed country detail pages through profile v2. |
| #288 | merged | Aligned country, source, and racecourse identifiers for entries 01-12. |
| #289 | merged | Added profiles for entries 01-04. |
| #290 | merged | Added profiles for entries 05-08. |
| #291 | merged | Added profiles for entries 09-12. |
| #292 | merged | Published entries 01-12. |
| #293 | merged | Added source tests for entries 13-20. |
| #294 | merged | Added reviewed notes for entries 13-20. |
| #295 | merged | Added profile v2 records for entries 13-20. |
| #296 | merged | Published entries 13-20. |
| #297 | merged | Added source tests for entries 21-28 and the deployment policy. |
| #298 | merged | Added reviewed notes for entries 21-28. |
| #299 | merged | Added eight reviewed profile-v2 records, reviewed country/source references, runtime loading, validation, and profile-ready tracker state for entries 21-28. |

## 7. Current publication gate

### PR #300 — QA and publish entries 21-28

Validate all sixteen English and Japanese routes, canonical and hreflang metadata, language switching, source links, responsive layout, accessibility, empty states, and public ceilings. Complete normal work on `country-pages-21-28-publication-qa`; create or copy to a `preview-*` branch only after GitHub validation passes. Use one final preview deployment and advance only passing rows to `published`.

## 8. Remaining wave schedule

| Entries | Source test | Reviewed note | Profile v2 | QA and publish |
| --- | ---: | ---: | ---: | ---: |
| 29-36 | #301 | #302 | #303 | #304 |
| 37-44 | #305 | #306 | #307 | #308 |
| 45-52 | #309 | #310 | #311 | #312 |
| 53-60 | #313 | #314 | #315 | #316 |
| 61-68 | #317 | #318 | #319 | #320 |
| 69-76 | #321 | #322 | #323 | #324 |
| 77-84 | #325 | #326 | #327 | #328 |
| 85-92 | #329 | #330 | #331 | #332 |
| 93-98 | #333 | #334 | #335 | #336 |

Each wave preserves separate authorities and racing systems, records incomplete coverage honestly, uses only reviewed references, and publishes only routes that satisfy the completion contract.

## 9. Final release gate

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

## 10. Roadmap maintenance rules

Update this roadmap in the same PR whenever the working PR, merged-through PR, tracker counts, wave boundaries, completion conditions, final release criteria, or local-work requirements change.

Every merge report states the PR number and title, merge SHA, changed behaviour and files, CI result, tracker counts, local-work requirement, remaining schedule position, and next PR.

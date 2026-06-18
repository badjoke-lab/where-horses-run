# Country page programme roadmap

Status: active canonical roadmap  
Scope: country and region detail page programme  
Canonical tracker: `docs/country-pages/98-country-tracker.tsv`  
Completion contract: `docs/country-pages/completion-contract.md`  
Last roadmap review: 2026-06-18

## 1. Purpose

This document is the repository-level source of truth for the PR sequence, current position, work boundaries, and completion gates for the 98-country detail-page programme.

The roadmap uses actual GitHub PR numbers. Older planning labels such as `PR-065` are historical planning identifiers and are not the current execution sequence.

The programme is complete only when all 98 tracker rows and all 196 bilingual routes satisfy the completion contract.

## 2. Current position

Current main state:

```text
Merged through: PR #295
Latest confirmed merge: PR #295
Working PR: #296
Working branch: country-pages-13-20-publication-qa
Next PR: #297
Final release gate: #337
```

Current tracker counts on main:

```text
published:       12
profile_ready:    8
note_reviewed:    0
not_started:     78
total:           98
```

Current route count:

```text
formally published English routes:   12
formally published Japanese routes:  12
formally published total routes:     24
final target routes:                196
```

PR count:

```text
roadmap range: #284-#337
merged:        #284-#295 = 12 PRs
in progress:   #296
remaining after #296: #297-#337
```

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

When local work is required, the request must specify:

- exact country or source
- exact URL or file
- exact command or browser action
- allowed output
- prohibited content
- expected handoff format

Local tasks should be batched by wave where practical rather than requested one country at a time.

## 4. Standard four-PR wave

Each normal eight-entry wave uses four PRs.

| Stage | Purpose | Typical tracker transition |
| --- | --- | --- |
| Source test | Confirm official routes, source roles, technical capability, limitations, and public ceiling | `not_started` -> `source_tested` |
| Reviewed note | Convert source findings into reusable editorial decisions | `source_tested` -> `note_reviewed` |
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

Do not publish:

- runners or horses
- jockeys, trainers, owners, or other participants
- weights
- odds or betting recommendations
- results or payouts
- predictions or tips
- complete racecards
- raw official HTML or copied source text
- embedded video
- direct stream URLs
- unofficial mirror links

## 6. Completed foundation and first publication batch

| PR | Status | Purpose and result |
| ---: | --- | --- |
| #284 | merged | Created the 98-row canonical tracker, completion contract, programme states, date semantics, and baseline programme validator. |
| #285 | merged | Added public-safe source-test export rules, schema, fixtures, validator, and workflow. Raw source captures remain outside the public repository. |
| #286 | merged | Added country profile v2 schema and validation for bilingual content, page kind, source roles, public ceiling, and prohibited fields. |
| #287 | merged | Added v2-first country-page runtime with a temporary Japan and Hong Kong legacy fallback. |
| #288 | merged | Canonicalised country, source, and racecourse IDs for entries 01-12 and added dangling-reference validation. |
| #289 | merged | Added reviewed profiles for UAE, South Korea, Turkey, and Morocco. |
| #290 | merged | Added reviewed profiles for Chile, Peru, Mexico, and Brazil. |
| #291 | merged | Added reviewed profiles for Bahrain, Qatar, Oman, and Zimbabwe. |
| #292 | merged | Published entries 01-12 in English and Japanese and added permanent publication QA. |

## 7. Wave 13-20

Entries:

```text
13 Japan
14 Hong Kong
15 New Zealand
16 South Africa
17 Uruguay
18 Sweden
19 Denmark
20 Czech Republic
```

| PR | Status | Work |
| ---: | --- | --- |
| #293 | merged | Added public-safe source-test decisions. Multi-system countries remain separated; technical capability and public ceilings are recorded independently. |
| #294 | merged | Added reviewed country notes and advanced entries 15-20 to `note_reviewed`. Japan and Hong Kong retained seed profiles pending v2 migration. |
| #295 | merged | Migrated Japan and Hong Kong from legacy seed profiles to profile v2. Added profile v2 and source-led registry records for New Zealand, South Africa, Uruguay, Sweden, Denmark, and the Czech Republic. All eight entries are `profile_ready`, and the runtime is v2-only. |
| #296 | in progress | Run bilingual route and publication QA for entries 13-20. Verify canonical, hreflang, language switch, racecourse and source links, responsive layout, accessibility, public ceilings, and empty states. Completion condition: eight entries and sixteen routes are `published`. |

## 8. Wave 21-28

| PR | Work and completion condition |
| ---: | --- |
| #297 | Source tests for entries 21-28. Record official routes, source roles, capability rank, public ceiling, review date, and local requirements. |
| #298 | Reviewed notes for entries 21-28. Separate verified facts, observations, inferences, unresolved claims, and revalidation triggers. |
| #299 | Profile v2 for entries 21-28. Add bilingual profiles and only the country, source, and racecourse records supported by reviewed evidence. |
| #300 | QA and publish entries 21-28. Validate sixteen routes and advance only passing rows to `published`. |

## 9. Wave 29-36

| PR | Work and completion condition |
| ---: | --- |
| #301 | Source tests for entries 29-36. Keep separate racing systems and authorities separate. |
| #302 | Reviewed notes for entries 29-36. Confirm page kind and safe public claims. |
| #303 | Profile v2 for entries 29-36. Resolve schema and ID references and reach `profile_ready`. |
| #304 | QA and publish entries 29-36. Validate routes, metadata, responsive layout, accessibility, and public boundaries. |

## 10. Wave 37-44

| PR | Work and completion condition |
| ---: | --- |
| #305 | Source tests for entries 37-44. Determine official calendar or programme availability and public ceilings. |
| #306 | Reviewed notes for entries 37-44. Document systems, organisers, seasonality, venues, and limitations. |
| #307 | Profile v2 for entries 37-44. Create bilingual profiles and reviewed references. |
| #308 | QA and publish entries 37-44. Publish only routes that satisfy the completion contract. |

## 11. Wave 45-52

| PR | Work and completion condition |
| ---: | --- |
| #309 | Source tests for entries 45-52. Distinguish unreachable sources from absence of racing. |
| #310 | Reviewed notes for entries 45-52. Decide country, special, explanatory, or archive treatment. |
| #311 | Profile v2 for entries 45-52. Implement the correct page kind and bilingual content. |
| #312 | QA and publish entries 45-52. Pay special attention to current-list inclusion and empty-state wording. |

## 12. Wave 53-60

| PR | Work and completion condition |
| ---: | --- |
| #313 | Source tests for entries 53-60. Record organiser and distributor roles separately. |
| #314 | Reviewed notes for entries 53-60. Preserve calendar-source and venue-source distinctions. |
| #315 | Profile v2 for entries 53-60. Add systems, coverage notes, and revalidation triggers. |
| #316 | QA and publish entries 53-60. Validate routes, metadata, links, and display ceilings. |

## 13. Wave 61-68

| PR | Work and completion condition |
| ---: | --- |
| #317 | Source tests for entries 61-68. Prefer accurate rank C or link-first decisions over unsupported detail. |
| #318 | Reviewed notes for entries 61-68. Remove unsupported claims and document limited coverage honestly. |
| #319 | Profile v2 for entries 61-68. Create thin but accurate profiles without invented venues. |
| #320 | QA and publish entries 61-68. Focus on empty states, freshness, and bilingual consistency. |

## 14. Wave 69-76

| PR | Work and completion condition |
| ---: | --- |
| #321 | Source tests for entries 69-76. Identify current, inactive, special, explanatory, and archive candidates. |
| #322 | Reviewed notes for entries 69-76. Confirm page kind and verified status. |
| #323 | Profile v2 for entries 69-76. Implement `country`, `special`, `explanatory`, or `archive` correctly. |
| #324 | QA and publish entries 69-76. Ensure archive and explanatory pages do not enter current calendars. |

## 15. Wave 77-84

| PR | Work and completion condition |
| ---: | --- |
| #325 | Source tests for entries 77-84. Confirm source existence, update status, and current activity. |
| #326 | Reviewed notes for entries 77-84. Distinguish inaccessible information from no current racing. |
| #327 | Profile v2 for entries 77-84. Add current or explanatory profiles as supported. |
| #328 | QA and publish entries 77-84. Validate listing inclusion, empty states, and date fields. |

## 16. Wave 85-92

| PR | Work and completion condition |
| ---: | --- |
| #329 | Source tests for entries 85-92. Do not force incomplete countries into `complete`. |
| #330 | Reviewed notes for entries 85-92. Confirm current, special, explanatory, or archive treatment. |
| #331 | Profile v2 for entries 85-92. Add bilingual profiles and reviewed references. |
| #332 | QA and publish entries 85-92. Validate sixteen routes and advance passing rows. |

## 17. Wave 93-98

This final normal wave contains six entries.

| PR | Work and completion condition |
| ---: | --- |
| #333 | Source tests for entries 93-98. Ensure no tracker row remains without an acquisition decision. |
| #334 | Reviewed notes for entries 93-98. Ensure every row is at least `note_reviewed`. |
| #335 | Profile v2 for entries 93-98. Ensure all 98 rows have reviewed structured profiles. |
| #336 | QA and publish entries 93-98. Complete the final twelve bilingual routes and reach 98 published rows. |

## 18. Final release gate

### PR #337 — full programme audit

PR #337 adds no new country scope. It audits the complete programme.

Required checks:

```text
tracker rows exactly 98
English routes exactly 98
Japanese routes exactly 98
bilingual routes exactly 196

no duplicate slugs
no missing country IDs
no dangling source IDs
no dangling racecourse IDs

no Japan or Hong Kong legacy fallback
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

## 19. Roadmap maintenance rules

This file must be updated in the same PR whenever any of the following changes:

- current working PR
- merged-through PR
- tracker counts
- wave boundaries
- PR purpose or completion condition
- final release criteria
- local-work requirements

After every merge, update:

1. `Merged through`
2. `Latest confirmed merge`
3. `Working PR`
4. `Next PR`
5. tracker counts
6. the status of the merged PR row

The merge report must state:

- PR number and title
- merge SHA
- changed behaviour and files
- CI result
- tracker counts
- local work required or not required
- full remaining schedule position
- next PR

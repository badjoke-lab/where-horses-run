# Where Horses Run project roadmap — 2026-08-09 active addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-08-09  
Current execution state reviewed: 2026-08-11  
Base roadmap: `docs/project-roadmap.md`  
Base main SHA reviewed: `7825ef2c6e20b1738982d4b82399787f90ed07a0`

This addendum updates the active execution position after the reviewed KRA publication and the current TJK source revalidation. Historical milestone, v1-release, audit, and compatibility markers in the base roadmap remain historical evidence and are not rewritten by this addendum.

When current/next Work ID, current counts, or immediate execution order differ from the older base-roadmap text, this active addendum is the current programme state.

## Current position

Completed recent units:

- PR #567 — reviewed Calendar rolling-horizon recovery through 2026-09-06;
- future-season wake-up behavior for HKJC with the 2026-09-06 Sha Tin active-window start;
- reviewed Mizusawa public timetable identity and growth-safe current-page validation;
- PR #568 — reviewed KRA Rank C candidate-generation adapter for South Korea;
- PR #570 — KRA public timetable identity review preparation;
- PR #571 — KRA Rank C promotion review gate preparation;
- PR #572 — reviewed KRA Rank C publication: 32 meetings, Busan-Gyeongnam/Jeju identity-only registration, zero race-detail rows;
- `TJK-SOURCE-REVALIDATION-01` — current TJK source behavior revalidated before adapter work; the daily programme route changed from `Info/Sehir` to `Info/Page` while technical capability A+ and public ceiling A remain unchanged.

Current reviewed public surface after KRA publication:

```text
public Calendar horizon end: 2026-09-06
public Calendar meetings: 369
canonical racecourse identities: 39
bilingual racecourse detail routes: 78
sitemap/public route count: 777
```

The historical v1 release evidence remains 36 racecourses / 72 bilingual racecourse pages / 771 public routes. Those values are historical snapshots, not current-size ceilings.

Calendar daily acquisition remains review-bound. Draft PR #559 is the stable human-review queue and must not be merged merely because automation updates it.

## Current Work ID

```text
Current Work ID: WHR-CAL-TURKEY-TJK
Completed implementation unit: TJK-SOURCE-REVALIDATION-01
Current implementation unit: TJK-BOUNDED-ADAPTER-01
Next Work ID: WHR-CAL-MOROCCO-SOREC-REVALIDATION (conditional)
```

`WHR-GLOSSARY-DICTIONARY-V1` remains a valid product follow-up programme but is not the current execution blocker while Calendar source expansion is active.

## Immediate execution sequence

### 1. South Korea KRA publication — complete

PR #572 completed the reviewed South Korea publication unit:

```text
Seoul:             11 meetings
Busan-Gyeongnam:   10 meetings
Jeju:              11 meetings
Total:             32 meetings
Public rank:        C only
Race-detail rows:   0
```

Busan-Gyeongnam and Jeju are identity-only public timetable racecourse records. Seoul reuses its existing canonical identity. The publication does not expose race times, participants, betting, results, payouts, predictions, full racecards, raw source bodies, or stream URLs.

KRA is complete for this reviewed window and must not be reopened as the current Work ID merely because later source expansion is underway.

### 2. Turkey TJK source implementation — current

The 2026-08-11 source revalidation confirms:

- the official annual programme route remains current;
- the filtered annual-data route remains current;
- the current daily programme route is `https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami`;
- the previously recorded `Info/Sehir/GunlukYarisProgrami` route is superseded;
- `SehirId`, `QueryParameter_Tarih`, and `SehirAdi` remain the reviewed query parameters;
- technical capability remains A+;
- public ceiling remains A;
- the current-day parameterized daily body was not directly captured during revalidation, so no fresh 2026-08-11 Race 1-N body claim is made.

Canonical evidence is recorded in `docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json`, the Turkey source-test README, the Authority Source Inventory, and Calendar Readiness.

Proceed through the shared pipeline without combining source revalidation and publication:

```text
source revalidation — complete
-> bounded adapter — current
-> deterministic public-safe candidates
-> fixture / determinism / NG-boundary validation
-> Batch Validation
-> human review
-> Promotion Validation
-> Canonical/public projection
-> bilingual QA
```

`TJK-BOUNDED-ADAPTER-01` must use the current `Info/Page` daily route, preserve the three reviewed parameters, retain technical A+ / public A boundaries, and generate candidates only. It must not write Canonical/public data, approve itself, merge itself, deploy, or retain prohibited racecard fields.

Completion effect: Turkey becomes an actively maintained Calendar system under the same candidate/review/promotion boundary rather than remaining source-inventory-only.

### 3. Morocco SOREC revalidation — conditional, not assumed implementable

The Authority Source Inventory currently marks SOREC `source_status: not_verified` and `adapter_candidate_status: blocked` because no stable public meeting/timetable route was confirmed.

Therefore the next Morocco unit remains revalidation, not adapter implementation:

```text
revalidate official SOREC meeting sources
-> if stable public route is confirmed: update source/readiness records and define adapter unit
-> if still blocked: retain honest blocked state and select the next source-ready expansion system
```

No Morocco Calendar publication claim may be created from the current blocked inventory record.

### 4. Expansion cohort after Turkey/Morocco decision

Choose the next system from reviewed source/readiness evidence using:

- official-source stability;
- current source status;
- racecourse identity resolvability;
- timetable depth;
- acquisition/maintenance cost;
- publication safety;
- season timing;
- user value.

Source-ready candidates already represented in the inventory include venue/system records in Chile, Peru, Brazil, Bahrain, Qatar, and other reviewed jurisdictions. A new system still requires a current source-specific review; inventory capability is not automatic publication permission.

### 5. Coverage and country presentation

After the next source cohort is stable, reconcile public country/coverage presentation with current Calendar state:

- current reviewed coverage window;
- source/freshness status;
- season state;
- supported public rank;
- explicit partial/blocked states;
- official source fallback.

Completion effect: users can distinguish active reviewed Calendar coverage from source-only, offseason, partial, blocked, or stale states.

### 6. Racecourse-page strengthening

The Racecourse Pages v1 release remains complete. Follow-up work strengthens existing canonical pages without inventing unknown profile facts:

- today/next reviewed meeting state;
- upcoming reviewed meetings;
- official source and freshness;
- reviewed course/distance/profile evidence only where supported;
- country/Calendar/meeting cross-navigation;
- identity-only pages remain valid when city, region, course, surface, direction, or address is unverified.

Completion effect: racecourse pages become durable entry pages for search/navigation while retaining the public timetable boundary.

### 7. Rank upgrades by evidence

After coverage breadth is stable, source-specific reviewed observations may raise individual meetings from C toward B/B+/A/A+ where contracts permit.

```text
C < B < B+ < A < A+
```

A+ detail is limited to the meeting-detail surface. List/calendar/racecourse summary pages remain summary-safe. No rank is inferred from source capability alone.

Completion effect: supported systems gain useful time/race-condition detail without turning Where Horses Run into a racecard, betting, result, or prediction product.

### 8. Steady-state automation hardening

Continue the existing automation model:

```text
official source
-> season/source state
-> Due-job planning
-> authorized acquisition
-> public-safe candidate artifacts
-> Draft PR #559 human-review queue
-> HUMAN REVIEW REQUIRED
-> separate promotion/publication unit
```

Automatic approval, Canonical promotion, public projection, merge, and deployment remain prohibited unless separately reviewed and explicitly authorized by a future contract change.

Completion effect: source checking and candidate preparation are automated where safe while publication remains auditable and human-controlled.

### 9. Product navigation, glossary, search, filters, and SEO

Resume/continue `WHR-GLOSSARY-DICTIONARY-V1` and related product work in parallel when it does not block current Calendar source work. Strengthen internal links among Calendar, countries, racecourses, glossary, sources, methodology/coverage, and meeting-detail routes.

Completion effect: growing Calendar/racecourse data becomes discoverable through durable navigation and search-oriented public pages.

## Required document set for future work

Before every subsequent substantive Calendar/source-expansion PR, review at least:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. this active addendum;
4. `docs/calendar/implementation-roadmap.md`;
5. `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`;
6. `docs/calendar/incremental-coverage-contract.md`;
7. `docs/calendar/validation-responsibility-contract.md`;
8. `docs/calendar/acquisition-control-plane-contract.md`;
9. applicable source-test/readiness/inventory records;
10. applicable public-display, racecourse, and deployment/CI contracts.

For `WHR-CAL-DAILY-ACQUISITION`, also review the active daily acquisition contract, implementation schedule, roadmap addendum, operations document, season-state file, and machine-readable execution policy.

## Maintenance

Update this addendum or replace it with a newer adopted project-roadmap addendum in the same PR whenever any of the following changes materially:

- current/next Work ID;
- source-expansion order or blocker state;
- public Calendar horizon operating model;
- racecourse/current public-size state when used as a current programme metric;
- publication boundary;
- runner/acquisition model;
- human-review boundary;
- deployment model.

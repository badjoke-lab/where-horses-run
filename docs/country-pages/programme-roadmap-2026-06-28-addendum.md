# Country page programme roadmap addendum — 2026-06-28

Status: active canonical addendum  
Amends: `docs/country-pages/programme-roadmap.md`  
Parent roadmap: `docs/project-roadmap.md`  
Work ID: `WHR-GOV-ROADMAP-01`

## Authority

Where this addendum conflicts with the older country roadmap, this addendum controls. Historical PR records in the older roadmap remain valid.

## Programme position

The 98-country programme remains responsible for:

- official-source research;
- reviewed country notes;
- bilingual Profile v2 data;
- English/Japanese route QA and publication;
- exactly 98 tracker rows and 196 published routes.

It is now also required to hand off a Calendar decision for every country and every separately reviewed active racing system/source.

Country-page publication and Calendar Readiness are separate states.

## Current state

```text
published:       28
profile_ready:   16
note_reviewed:    8
not_started:     46
total:           98
```

Current publication debt:

- 29-36: rebuild the stale Draft gate from current `main` under `WHR-CP-PUB-29-36`;
- 37-44: rebuild the stale Draft gate from current `main` under `WHR-CP-PUB-37-44`;
- 45-52: complete Profile v2 and publication under `WHR-CP-PROFILE-45-52` and `WHR-CP-PUB-45-52`.

PR numbers such as the former planned #314-#340 are historical planning references only. Work IDs now define the schedule.

## Revised work order

```text
WHR-GOV-ROADMAP-01
-> WHR-CAL-CONTRACT-02
-> WHR-CP-PUB-29-36
-> WHR-CP-PUB-37-44
-> WHR-CAL-BACKFILL-01-20
-> WHR-CAL-BACKFILL-21-36
-> WHR-CAL-BACKFILL-37-52
-> WHR-CP-PROFILE-45-52
-> WHR-CP-PUB-45-52
-> remaining Source Test v2 / note / profile / publish waves
-> WHR-AUDIT-COUNTRY-CALENDAR-98
```

## Revised source-test rule

Entries 53-98 use `docs/calendar/source-test-v2-contract.md`.

Source Test v2 keeps the existing four-stage page wave but adds:

- system/source-level scope;
- Technical Rank and separate Public Ceiling;
- automation mode;
- refresh and freshness decision;
- fallback;
- closed Calendar Readiness state.

Entries 01-52 are backfilled from reviewed evidence. Backfill must not invent live parsers, automation, or nationwide coverage.

## Revised final gate

The former PR #340 gate is replaced by Work ID:

```text
WHR-AUDIT-COUNTRY-CALENDAR-98
```

Country-page requirements remain:

- 98 tracker rows;
- 98 English routes;
- 98 Japanese routes;
- 196 routes total;
- all country-page completion and public-boundary checks.

Additional handoff requirements:

- every country has a calendar decision;
- each reviewed active system/source has closed Readiness;
- Technical Rank and Public Ceiling remain separate;
- automation mode, fallback, freshness, and revalidation are recorded where applicable;
- priority and blocked/link-only reports are generated.

This gate ends the 98-country research/page programme. It does not end Where Horses Run development. Calendar reconciliation, pipeline activation, pilots, public v1, expansion, and operations continue under `docs/calendar/implementation-roadmap.md`.

## Maintenance

Every country-page PR must read and update, where applicable:

- `docs/project-roadmap.md`;
- the original country roadmap plus this addendum;
- the completion contract plus its Calendar addendum;
- `98-country-tracker.tsv`;
- Source Test v2 and Calendar Readiness contracts;
- deployment/CI policy.

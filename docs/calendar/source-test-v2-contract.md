# Source Test v2 contract

Status: active canonical research contract  
Work ID introduced by: `WHR-GOV-ROADMAP-01`  
Machine-readable enforcement active from: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

A Source Test v2 determines both what reviewed official racing information exists and how that source may be maintained for the public calendar.

A source test is not complete merely because an official URL and country-level rank were found.

## Machine-readable files

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
scripts/check-calendar-contracts.mjs
```

Future Source Test v2 outputs use:

```text
docs/timetable-source-tests/<delivery>-<slug>/source-test-v2.json
```

The machine schema, registry, and validator are documented in `docs/calendar/machine-readable-contracts.md`.

## Unit of review

Review at the smallest meaningful public system scope:

```text
country
-> racing system or code
-> authority or operator
-> racecourse scope
-> official source
-> acquisition route when applicable
```

Do not generalize one racecourse or authority to an entire country without evidence.

## Required summary

Each country summary records:

- tracker `delivery_no` and stable `country_id`;
- country name;
- checked date and evidence-review date;
- country completeness classification;
- one or more reviewed system/source records;
- `public_safe: true`.

## Required system/source record

Each reviewed system/source records:

- stable readiness ID, system ID, authority/source key, and relevant racecourse IDs;
- racing system name and coverage scope;
- meeting-date, racecourse, first-time, last-time, race-by-race, and A+ field availability;
- Technical Rank `C`, `B`, `B+`, `A`, or `A+`;
- separate Public Ceiling and any item-level A+ limitations;
- source format and access mode;
- automation mode and refresh classes;
- Calendar Readiness and separate implementation status;
- source status, fallback, and revalidation trigger;
- blocked reason when applicable;
- limitations and public-safe notes.

## Source and access enums

```text
source_format:
html | json | api | pdf | csv | ics | javascript_rendered |
mobile_app_only | mixed | unknown

access_mode:
direct | date_route | query_parameter | api_call |
javascript_required | login_required | local_required |
unreachable | unknown
```

## Automation decision

```text
automatic
semi_automatic
manual_import
manual_confirmation
link_only
blocked
not_applicable
```

## Rank definitions

```text
C   meeting date and racecourse
B   first-race time
B+  first-race and last-race times
A   race label or number plus post time
A+  selected programme-summary fields on a separate detail page
```

Technical Rank describes verified capability. Public Ceiling controls display. The public result must never exceed either.

## Closed readiness outcome

Every Source Test v2 closes with one of:

```text
ready
prototype_ready
manual_ready
link_only
blocked
not_applicable
```

Do not leave a completed review as an unexplained unknown. Insufficient evidence becomes `blocked` or `link_only` with a revalidation trigger.

## Local and public-safe evidence

Detailed acquisition may require local work because of JavaScript delivery, region controls, login, unstable downloads, PDFs, application traffic, or temporary source availability.

Raw local material remains outside the repository. Public-safe outputs may include derived TSV/JSON summaries, field availability, HTTP metadata, official URLs, tested counts, hashes, decisions, and local-only path references.

Do not commit raw HTML, JavaScript, PDF bodies, API response bodies, complete programme text, participant or betting data, results, payouts, credentials, tokens, restricted access details, or bypass instructions.

## Completion checklist

```text
[ ] official source ownership and role are clear
[ ] country/system/authority/racecourse scope is explicit
[ ] verified fields and Technical Rank are recorded
[ ] Public Ceiling is separate
[ ] automation mode is closed
[ ] refresh and stale/revalidation behaviour are recorded
[ ] fallback is recorded
[ ] Calendar Readiness is closed
[ ] implementation status is not confused with readiness
[ ] public-safe evidence is linked
[ ] raw, internal, and prohibited material is absent
[ ] tracker and readiness registry are updated
[ ] node scripts/check-calendar-contracts.mjs passes
```

## Existing entries

Entries 01-52 predate this contract. Backfill them from existing reviewed evidence through the Work IDs in the project roadmap. Existing `final-summary.json` files may be referenced during backfill. Do not invent live parsers, automation, nationwide coverage, or readiness from old labels alone.

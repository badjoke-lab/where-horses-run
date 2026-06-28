# Source Test v2 contract

Status: active canonical research contract  
Work ID introduced by: `WHR-GOV-ROADMAP-01`  
Machine-readable enforcement planned in: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

A Source Test v2 determines both:

1. what reviewed official racing information exists; and
2. how that source may be maintained for the public calendar.

A country-page source test is not complete merely because an official URL and a country-level rank were found.

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

Do not generalize one racecourse or one authority to an entire country without evidence.

## Required fields

Every reviewed system/source decision records:

### Identity and scope

- stable country ID;
- stable authority/operator ID;
- stable official source ID;
- racing system or code;
- racecourse scope;
- source URL and source role;
- countrywide, authority-wide, subset, or single-racecourse coverage.

### Verified capability

- meeting date available;
- racecourse available;
- first-race time available;
- last-race time available;
- race-by-race post times available;
- A+ fields available: race name, distance, surface, and course;
- Technical Rank: `C`, `B`, `B+`, `A`, or `A+`;
- tested dates, meeting count, and race count when meaningful;
- limitations and unresolved coverage.

### Public decision

- Public Ceiling: `C`, `B`, `B+`, `A`, or `A+`;
- item-level A+ switches when needed;
- official-source fallback;
- public wording for partial, stale, unavailable, archive, or explanatory cases.

### Source and access characteristics

Use reviewed values where known:

```text
source_format:
html | json | api | pdf | csv | ics | javascript_rendered |
mobile_app_only | mixed | unknown

access_mode:
direct | date_route | query_parameter | api_call |
javascript_required | login_required | local_required |
unreachable | unknown
```

### Maintenance decision

```text
automation_mode:
automatic | semi_automatic | manual_import |
manual_confirmation | link_only | blocked | not_applicable
```

Record:

- refresh class;
- expected publication lead time if known;
- future window if known;
- season or event trigger;
- stale threshold or review trigger;
- fallback behaviour;
- Calendar Readiness state.

### Evidence and freshness

- checked date;
- evidence-review date;
- public-safe evidence references;
- local-work requirement;
- revalidation trigger.

## Rank definitions

```text
C   meeting date and racecourse
B   first-race time
B+  first-race and last-race times
A   race label or number plus post time
A+  selected programme-summary fields on a separate detail page
```

Technical Rank describes verified source capability. Public Ceiling controls display. The public result must never exceed either.

## Calendar Readiness outcome

Every Source Test v2 closes with one of:

```text
ready
prototype_ready
manual_ready
link_only
blocked
not_applicable
```

Do not leave a completed review as a vague unknown. When evidence is insufficient, use `blocked` or `link_only` with a revalidation trigger.

## Local and public-safe evidence

Detailed source acquisition may require local terminal work because of JavaScript delivery, region controls, login, unstable downloads, PDFs, application traffic, or source availability.

Raw local material remains outside the repository. Public-safe repository outputs may include derived TSV/JSON summaries, field availability, HTTP metadata, source URLs, tested counts, hashes, decisions, and references to local-only paths.

A public-safe summary must not include:

- raw HTML, JavaScript, PDF body, or API response body;
- complete programme or racecard text;
- horses, runners, jockeys, trainers, weights, gates, or participant lists;
- odds, betting recommendations, results, payouts, or predictions;
- credentials, cookies, tokens, restricted access details, or bypass instructions.

## Completion checklist

A Source Test v2 PR is complete only when:

```text
[ ] official source ownership and role are clear
[ ] country/system/authority/racecourse scope is explicit
[ ] verified fields and Technical Rank are recorded
[ ] Public Ceiling is recorded separately
[ ] automation mode is closed
[ ] refresh and stale/revalidation behaviour are recorded
[ ] fallback is recorded
[ ] Calendar Readiness is closed
[ ] public-safe evidence is linked
[ ] local-only and prohibited material is absent
[ ] tracker and readiness registry are updated
[ ] relevant validators pass
```

## Existing entries

Entries 01-52 were researched before this contract. They must be backfilled from existing reviewed evidence through the three Calendar Readiness backfill Work IDs in the project roadmap. Backfill must not invent unproven live parsers, automation, or coverage.

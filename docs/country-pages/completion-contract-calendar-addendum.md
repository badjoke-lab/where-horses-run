# Country page completion contract — Calendar addendum

Status: active canonical addendum  
Amends: `docs/country-pages/completion-contract.md`  
Last reviewed: 2026-06-28

## Purpose

This addendum defines how country-page completion relates to Calendar Readiness.

## Separate completion states

A tracker row may be `published` when the country-page contract passes. That does not by itself mean that:

- a live adapter exists;
- automatic refresh is active;
- nationwide calendar coverage is complete;
- all racing systems in the country have the same rank;
- race-by-race timetable output is available.

Calendar status is stored separately at system/source scope.

## Source-test requirement

For entries 53-98, the source-test stage must follow `docs/calendar/source-test-v2-contract.md`.

For entries 01-52, reviewed evidence must be backfilled into Calendar Readiness without changing the historical page status unless new page claims or QA are required.

## Country-page requirements retained

The original 12 publication conditions remain unchanged. In particular:

- English and Japanese content must exist;
- time-sensitive claims require review dates and revalidation rules;
- timetable output must not exceed Public Ceiling;
- empty/pending data must not be described as absence of racing;
- prohibited participant, betting, result, payout, prediction, or full-racecard data must be absent.

## Calendar handoff requirement

Before the combined 98-country audit closes, every tracker row must link, directly or through stable IDs, to at least one closed calendar decision:

```text
ready
prototype_ready
manual_ready
link_only
blocked
not_applicable
```

Countries with multiple racing systems require separate decisions when capabilities, authorities, sources, or maintenance methods differ.

## Local evidence

Raw local source material remains outside the public repository. Country-page publication may rely on reviewed public-safe summaries derived from local work, but must not require committing raw HTML, PDF/API bodies, complete programmes, participant/betting data, credentials, or private risk notes.

Follow `docs/governance/internal-source-handling.md`.

## Final programme meaning

`WHR-AUDIT-COUNTRY-CALENDAR-98` confirms both:

1. all 98 bilingual country-page records satisfy the original completion contract; and
2. all 98 countries have a closed Calendar handoff decision.

It does not claim that all 98 countries are automatically updated or that Calendar public v1 is complete.

# Source registry

Status: public specification
Phase: Generated Data Foundation

This document defines the baseline source registry rules for Where Horses Run / 競馬どこ？.

---

## Purpose

The source registry records official and reference links used by the site.

The registry should help users find official source pages without implying that Where Horses Run republishes entries, odds, results, payouts, tips, or full racecards.

---

## File

data/static/sources.json

---

## Required fields

Each source entry should include:

- id
- country_id
- source_type
- url
- data_type
- auto_level
- terms_risk

Optional fields may include:

- notes
- language
- timezone
- update_hint
- official_name
- related_track_ids

---

## source_type values

Baseline values:

- official
- authority
- racecourse
- operator
- archive
- reference

MeaningsMe
- official: official racing body or official race information provider.
- authority: public or regulatory authority.
- racecourse: official racecourse or venue page.
- operator: official operator page.
- archive: historical or inactive reference.
- reference: public reference source.

---

## data_type values

Baseline values:

- link_only
- calendar
- timetable
- racecard_limited
- archive

Meanings:

- link_only: source is used as a user-facing link only.
- calendar: source may help confirm racing days or fixtures.
- timetable: source may include race times or meeting schedules.
- racecard_limited: source may expose racecard-like information, but the project should not republish full racecards.
- archive: source is used for historical or inactive coverage.

---

## auto_level values

Baseline values:

- A
- B
- C
- D
- manual
- none

Meanings:

- A: likely suitable for structured automated collection after review.
- B: possibly suitable, but needs careful parser and policy review.
- C: weak automation candidate.
- D: poor automation candidate.
- manual: manual review or manual update only.
- none: no automation planned.

---

## terms_risk values

Baseline values:

- unknown
- low
- medium
- high

Rules:

- unknown is allowed for early seed data.
- medium or high entries should be treated carefully.
- high risk sources should remain link-first unless reviewed.
- terms_risk is a caution label, not a legal conclusion.

---

## Public display rules

The UI may show:

- source link
- country
- source_type
- data_type
- auto_level
- terms_risk
- short public-safe notes

The UI must not show:

- private operational notes
- credentials
- internal collection methods
- bypass methods
- unpublished source access details

---

## Expansion rules

When adding sources:

- prefer official source links first
- keep ids stable
- connect each source to country_id
- avoid duplicate URLs where possible
- mark uncertain entries as unknown or manual
- do not imply full live coverage from link-only sources

---

## Out of scope

This specification does not implement:

- parsers
- live fetching
- scheduled workflows
- paid feed access
- full racecard redistribution
- legal review automation

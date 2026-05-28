# Parser fixture tests

Status: public specification
Phase: Generated Data Foundation

This document defines the fixture-based parser test policy for Where Horses Run / 競馬どこ？.

---

## Purpose

Parser work should start with fixtures before live fetching.

Fixtures make it possible to test parser behavior safely, repeatedly, and without depending on live websites.

---

## Fixture-first rule

Before live fetching starts, parser behavior should be checked against local fixtures.

Fixtures should be:

- public-safe
- minimal
- source-specific
- small enough for review
- clearly marked as test data
- independent from private or paid feeds

Fixtures should not include:

- credentials
- private access details
- paid feed content
- full racecards
- odds
- results
- payouts
- large copied pages

---

## Suggested directory structure

Future parser fixtures may use this structure:

- fixtures/parser/README.md
- fixtures/parser/[source-id]/input.html
- fixtures/parser/[source-id]/expected.json
- fixtures/parser/[source-id]/notes.md

The exact structure may change when parser code starts.

---

## Input fixture rules

Input fixtures should represent a small public-safe source sample.

Allowed fixture input types:

- small HTML snippet
- small text snippet
- small JSON sample
- manually simplified source example

Input fixtures should preserve only what is needed to test extraction behavior.

---

## Expected output rules

Expected output files should describe normalized parser output.

Expected output should include:

- source_id
- generated_at or fixture_generated_at
- status
- meetings
- warnings
- errors

The meetings field must be an array.

Empty meetings arrays are allowed.

---

## Test behavior

Fixture-based tests should eventually check:

- parser returns valid JSON
- parser status is explicit
- meetings is always an array
- warnings and errors are arrays
- missing data does not crash the parser
- failed parsing produces a safe error result
- placeholder or empty data remains visible to the UI

---

## Public-safe errors

Tested parser errors must be public-safe.

Errors should not reveal:

- credentials
- private access methods
- internal strategy
- sensitive request details
- unpublished source access methods

---

## Connection to generated data

Fixture tests should prepare the parser layer for later generated files:

- data/generated/today.json
- data/generated/tomorrow.json
- data/generated/calendar-30d.json
- data/generated/fetch-status.json

Fixture tests should not require live fetching.

---

## Out of scope

This PR does not implement:

- parser code
- live fetching
- scheduled workflows
- external API calls
- large fixture imports
- source-specific parsers

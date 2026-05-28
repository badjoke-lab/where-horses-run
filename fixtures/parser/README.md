# Parser fixtures

Status: public test fixture directory  
Phase: M2b Generated Pipeline Foundation

This directory is reserved for small, public-safe parser fixtures.

Fixtures are used to test parser behavior without relying on live websites, paid feeds, private data, or runtime network access.

---

## Purpose

Parser fixtures should help verify:

- parser input handling
- parser output shape
- empty-state behavior
- safe failure behavior
- source-specific parsing assumptions
- generated schedule normalization

Fixtures must stay small and reviewable.

---

## Allowed fixture content

Allowed fixture input examples:

- small HTML snippets
- small text snippets
- small JSON snippets
- manually simplified source examples
- artificial examples based on public page structure

Allowed expected output examples:

- normalized parser output JSON
- empty meetings output
- partial parser output
- safe error output
- warning examples

---

## Disallowed fixture content

Do not commit:

- credentials
- tokens
- cookies
- paid feed content
- private feed content
- full racecards
- odds
- results
- payouts
- betting tips
- large copied pages
- bypass methods
- hidden access details

---

## Suggested per-source structure

Future source fixtures may use:

```text
fixtures/parser/[source-id]/input.html
fixtures/parser/[source-id]/expected.json
fixtures/parser/[source-id]/notes.md
````

Example:

```text
fixtures/parser/hong-kong-hkjc-home/input.html
fixtures/parser/hong-kong-hkjc-home/expected.json
fixtures/parser/hong-kong-hkjc-home/notes.md
```

The exact structure may change when parser code starts.

---

## Fixture rules

Each fixture should:

* identify the source_id it belongs to
* be public-safe
* be minimal
* be source-specific
* avoid unnecessary copied text
* include only data needed for parser testing
* include expected output when parser behavior is known

---

## Expected output baseline

Expected parser output should eventually include:

```text
parser_version
source_id
generated_at or fixture_generated_at
status
meetings
warnings
errors
```

The `meetings`, `warnings`, and `errors` fields should be arrays.

Empty `meetings` arrays are valid.

---

## Current state

No parser implementation exists yet.

This directory only defines the safe place for future parser fixtures.

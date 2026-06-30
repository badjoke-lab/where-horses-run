# Calendar pipeline v1 — deterministic public projection

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Purpose

This stage is the only Pipeline v1 writer from canonical timetable data into the committed public meeting-list and meeting-detail JSON files.

```text
canonical meeting/detail data
+ publication display policy
+ Calendar Readiness Public Ceiling
+ reviewed legacy source aliases
-> deterministic public projection
```

It does not read candidates, source snapshots, manual seeds, normalized samples, or raw source bodies.

## Command

Generate the public projection explicitly:

```text
node scripts/timetable/build-public-timetable-view.mjs
```

Review the projected decisions without writing:

```text
node scripts/timetable/build-public-timetable-view.mjs --dry-run
```

Verify that committed public output matches the current canonical inputs and governance:

```text
node scripts/timetable/build-public-timetable-view.mjs --check
```

The writer reads only:

```text
data/generated/timetable/canonical/meetings.json
data/generated/timetable/canonical/meeting-details.json
src/data/publicationDisplayPolicies.json
data/static/calendar-readiness-registry.json
data/static/timetable-source-aliases-v1.json
```

It writes only:

```text
data/generated/timetable/public/meeting-list.json
data/generated/timetable/public/meeting-details.json
```

## Effective public rank

The public rank is the lowest of three independent controls:

```text
canonical capability rank
publication policy maximum
Calendar Readiness Public Ceiling
```

A permissive display policy cannot override a lower reviewed Public Ceiling. For example, the legacy HKJC and JRA policies may allow A+, while their current Calendar Readiness records cap public output at A. The projection therefore retains race labels and post times but removes A+ programme-summary fields.

`max_public_rank` in the public JSON is the effective maximum after intersecting policy and Readiness. `effective_public_rank` additionally applies the canonical record's capability rank.

## Readiness eligibility

Public meeting rows require a closed operating state compatible with maintained timetable data:

- readiness: `ready`, `prototype_ready`, or `manual_ready`;
- automation: automatic, semi-automatic, manual import, or manual confirmation;
- source status: verified, partial, or stale;
- confirmed meeting date and racecourse fields.

`link_only`, `blocked`, and `not_applicable` records are excluded from public meeting rows even when old canonical seed data still exists. This prevents historical implementation artifacts from overriding the current reviewed Calendar Readiness decision.

## A+ field rules

Race name, distance, surface, and course label are projected only when all three conditions are true:

1. effective public rank is A+;
2. publication policy enables the field;
3. Calendar Readiness `confirmed_fields` confirms the field.

A-level detail rows contain only race label and post time.

## Legacy source aliases

Older canonical data contains source IDs created before the canonical Authority/Source and Calendar Readiness registries. The migration file:

```text
data/static/timetable-source-aliases-v1.json
```

maps each reviewed legacy ID to one canonical source ID. Aliases are explicit by country and authority. There is no fuzzy or hostname-only fallback.

New Pipeline v1 promotions use canonical source IDs directly and do not require aliases.

## Determinism

The writer does not use wall-clock time. Public `generated_at` is the later of the canonical meeting and canonical detail `generated_at` timestamps.

The same canonical inputs, policy, readiness registry, and alias map produce byte-equivalent public objects. Output order is stable by date, country, racecourse, and meeting ID.

## Detail integrity

A public detail record is emitted only when:

- the corresponding canonical meeting exists;
- meeting and detail identity fields agree;
- the meeting is eligible for public projection;
- effective public rank is A or A+.

A public list `detail_path` exists only when the projected detail record exists.

## Current release boundary

This implementation PR does not rewrite the committed public JSON. It introduces and validates the new writer only.

Applying the writer changes rendered Calendar/Today/Tomorrow/country/racecourse/meeting surfaces because current legacy public files do not yet enforce the latest Public Ceiling and link-only exclusions. That generated-data change must be reviewed in a separate rendered preview PR before production publication.

## Next Pipeline v1 slice

Generate the reviewed public projection, inspect the exact removed/downgraded rows and fields, run bilingual rendered QA, and merge the public-data release only after preview approval.

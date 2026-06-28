# Authority source inventory addendum — 2026-06-28

Status: active canonical addendum  
Amends: `docs/specs/authority-source-inventory-schema.md`  
Machine-readable migration planned in: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-06-28

## Purpose

This addendum closes gaps between the older authority inventory foundation, current A+ runtime support, Source Test v2, and Calendar Readiness.

## Rank consistency

The next schema version must allow:

```text
C | B | B+ | A | A+
```

A+ remains controlled publication output and does not permit full racecard republication.

## Role separation

Keep three states separate:

- `adapter_candidate_status`: whether a source deserves implementation review;
- `calendar_readiness`: whether and how implementation may begin;
- `implementation_status`: what tooling/operation currently exists.

The existing candidate status must not be interpreted as proof of a parser, scheduler, or live fetch path.

## Required Source Test v2 linkage

The next inventory/readiness model must support or reference:

- racing system/code;
- explicit coverage scope;
- Technical Rank and separate Public Ceiling;
- source format and access mode;
- automation mode;
- refresh class;
- readiness state;
- fallback;
- revalidation trigger;
- checked/evidence dates;
- stable references to country, authority, source, and racecourse IDs.

## Stable keys

Country plus authority plus official source remains useful, but systems with multiple routes or source kinds may also need a stable system/source or route key. The machine-readable contract must avoid merging distinct gallop, trot, harness, Arabian, Quarter Horse, central, local, or racecourse-specific systems merely because they share a country.

## Public-safe boundary

Inventory and readiness records may contain reviewed metadata and summaries only. They must not contain raw bodies, full programmes/racecards, participant or betting data, results/payouts, credentials, access bypass details, or internal publication-risk notes.

Follow `docs/governance/internal-source-handling.md`.

## Migration rule

`WHR-CAL-CONTRACT-02` must migrate or extend schemas and validators without falsely upgrading existing records. Existing source records remain evidence inputs; their parser names, target levels, and cadences require verification before an active implementation status is assigned.

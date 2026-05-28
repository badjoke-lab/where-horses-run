# Source fetch abstraction

Status: public specification  
Phase: M2b Generated Pipeline Foundation

This document defines the first source fetch abstraction for Where Horses Run / 競馬どこ？.

---

## Purpose

The source fetch abstraction prepares the project for future generated schedule updates without enabling live network fetching yet.

This phase defines source fetch plans, dry-run behavior, skipped fetch results, safety boundaries, and future replacement points.

---

## Current boundary

Live network fetching is not enabled in this phase.

The abstraction must not fetch live pages, scrape racecards, store raw live page bodies, bypass access controls, access paid feeds, or republish entries, odds, results, payouts, or tips.

---

## Source fetch plan

A source fetch plan describes what could be fetched later.

Baseline fields:

- source_id
- country_id
- source_type
- data_type
- auto_level
- terms_risk
- url
- method
- mode
- requested_at
- live_network_enabled

`live_network_enabled` must remain `false` in this phase.

---

## Modes

Baseline modes:

- dry_run
- manual
- disabled

Meanings:

- dry_run: build the plan only. Do not fetch.
- manual: reserved for manually supplied content.
- disabled: source is intentionally not fetchable.

---

## Skipped result

When live fetching is not enabled, the fetch abstraction returns a skipped result.

Baseline fields:

- source_id
- country_id
- status
- checked_at
- source_url
- raw_content_ref
- message
- warnings
- errors

`raw_content_ref` must be `null` unless safe raw content handling is explicitly added later.

---

## Future replacement point

A future PR may replace skipped-only behavior with a reviewed source-specific fetcher.

That work must still preserve source registry IDs, public-safe errors, generated data validation, fixture-first testing, and official source fallback.

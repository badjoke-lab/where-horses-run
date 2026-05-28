# First safe source pipeline candidate

Status: public runbook
Phase: M2b Generated Pipeline Foundation

This runbook defines the first safe source pipeline candidate for Where Horses Run / 競馬どこ？.

---

## Candidate

Source id: hong-kong-hkjc-home

This candidate is link-first and dry-run only.

---

## Current boundary

This candidate does not enable live network fetching.

It does not:

- fetch live pages
- scrape racecards
- store raw live page bodies
- access paid feeds
- republish entries
- republish odds
- republish results
- republish payouts
- provide betting tips

---

## What is checked

The candidate check verifies:

- the source exists in data/static/sources.json
- the Hong Kong parser fixture exists
- the simple fixture parser output matches expected.json
- parser output can be normalized
- the source fetch plan can be created
- live_network_enabled remains false
- the fetch result is skipped
- generated files are not written

---

## Why Hong Kong first

Hong Kong is useful as the first candidate because it already has:

- a static source record
- a racecourse record
- a public-safe parser fixture
- an expected parser output
- parser fixture validation
- fixture parser harness coverage
- normalizer coverage
- dry-run source fetch abstraction coverage

---

## Next replacement point

A later PR may replace this dry-run-only candidate with a reviewed, source-specific, public-safe fetcher.

That future work must preserve:

- fixture-first testing
- public-safe errors
- official source fallback
- no racecard redistribution
- no odds or result redistribution
- no paid feed access

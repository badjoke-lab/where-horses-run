# Generated data dry-run workflow

Status: public runbook  
Phase: M2b Generated Pipeline Foundation

This runbook describes the generated data dry-run workflow.

---

## Purpose

The dry-run workflow checks that source fetch planning and skipped fetch results can run in GitHub Actions without enabling live network fetching.

It is a preparation step for future generated schedule automation.

---

## Current boundary

The workflow does not:

- fetch live pages
- scrape racecards
- store raw live page bodies
- commit generated data
- access paid feeds
- republish entries, odds, results, payouts, or tips

---

## What the workflow does

The workflow:

- installs project dependencies
- runs the generated update dry-run script
- builds source fetch plans from `data/static/sources.json`
- verifies every source returns a skipped result
- confirms `live_network_enabled` remains false
- confirms `data/generated` was not modified

---

## Trigger

The workflow can run through:

- manual `workflow_dispatch`
- pull requests that affect source data, scripts, package scripts, or this workflow

---

## Future replacement point

A later PR may add a reviewed source-specific fetcher.

That future work must preserve public-safe errors, fixture-first testing, official source fallback, and no racecard / odds / result redistribution.

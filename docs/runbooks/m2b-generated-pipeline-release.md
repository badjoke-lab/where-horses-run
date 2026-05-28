# M2b Generated Pipeline Foundation release

Status: released generated pipeline foundation baseline  
Phase: M2b Generated Pipeline Foundation

Where Horses Run / 競馬どこ？ has completed the M2b generated pipeline foundation baseline.

---

## Included in this phase

This phase added:

- generated data validator hardening
- parser fixtures directory and README
- first Hong Kong public-safe parser fixture
- parser output fixture validator
- normalizer foundation
- fixture parser test harness
- source fetch abstraction
- generated data dry-run GitHub Actions workflow
- first safe source pipeline candidate

---

## Current generated pipeline position

The generated pipeline now has:

- validated generated data shape
- validated parser fixture expected output
- fixture parser harness
- parser output normalizer
- dry-run source fetch planning
- skipped fetch result model
- GitHub Actions dry-run workflow
- first safe source pipeline candidate based on Hong Kong / HKJC

The pipeline does not yet have:

- live network fetching
- source-specific live parser
- generated data writeback automation
- scheduled automatic updates
- raw live page storage
- racecard redistribution
- odds, results, payouts, or betting tips

---

## Safety boundary

The current pipeline is dry-run only.

It must not:

- fetch live pages
- scrape racecards
- store raw live page bodies
- bypass access controls
- access paid feeds
- republish entries
- republish odds
- republish results
- republish payouts
- provide betting tips

---

## First safe candidate

The first safe source pipeline candidate is:

```text
hong-kong-hkjc-home
````

This candidate currently verifies:

* source record presence
* parser fixture presence
* parser harness output
* expected output matching
* normalizer output
* source fetch plan creation
* skipped result behavior
* no generated file writes

---

## Why this phase matters

M2b turns the earlier generated data specifications into a testable foundation.

The project can now expand toward Alpha timetable coverage without pretending that live fetching is already complete.

---

## Next phase

Next phase:

```text
M3 v0 Alpha timetable coverage
```

M3 should start with link-first / dry-run-safe coverage expansion.

Recommended first M3 target:

```text
Hong Kong
```

The next PR should begin M3 by improving Hong Kong alpha timetable coverage, source notes, and UI verification without enabling unsafe live fetching.

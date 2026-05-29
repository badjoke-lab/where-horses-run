# M3 Hong Kong live fetch probe

Status: M3 live fetch probe
Phase: M3 v0 Alpha timetable coverage

This runbook documents the first live fetch step for Where Horses Run / 競馬どこ？.

---

## Target

Country: Hong Kong
Source id: hong-kong-hkjc-home
Source: official HKJC home source
Mode: live fetch probe only

---

## What this PR adds

This PR introduces a probe-only live fetch path.

The probe checks:

- HTTP reachability
- HTTP status
- content type
- redirect result
- final URL
- duration

---

## Hard boundary

This probe does not:

- read response body text
- save raw HTML
- parse racecards
- write generated schedule files
- republish entries
- republish odds
- republish results
- republish payouts
- provide betting tips

---

## Manual command

Run:

```text
npm run probe:live:hk
````

The command prints a public-safe JSON probe result.

---

## Acceptance

This step is accepted when:

* npm run check passes
* npm run probe:live:hk runs without storing raw content
* probe result has raw_content_saved false
* probe result has body_read false
* probe result has generated_files_written false
  
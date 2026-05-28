# Fetch status model

Status: public specification  
Phase: Generated Data Foundation

This document defines how Where Horses Run / 競馬どこ？ describes generated data status.

---

## Purpose

`fetch-status.json` explains whether generated schedule data is fresh, stale, unavailable, or placeholder-level.

The site must not imply live coverage when no live process exists.

---

## File

```text
data/generated/fetch-status.json
````

---

## Required top-level fields

```text
generated_at
status
sources
notes
```

---

## Top-level status values

Allowed baseline values:

```text
placeholder
ok
partial
stale
failed
unknown
```

Meanings:

```text
placeholder:
  Static placeholder data. No live fetch has run.

ok:
  Generated data is available and current enough for display.

partial:
  Some source data is available, but coverage is incomplete.

stale:
  Generated data exists but is older than the expected freshness window.

failed:
  Fetch or generation failed.

unknown:
  Status cannot be determined.
```

---

## sources array

`sources` must be an array.

Each source item should eventually include:

```text
source_id
country_id
status
checked_at
message
```

Allowed source status values:

```text
not_started
ok
partial
stale
failed
skipped
unknown
```

---

## notes array

`notes` must be an array of short public-safe messages.

Notes may explain:

```text
- placeholder state
- missing source data
- partial coverage
- stale generated data
- manual fallback status
```

Notes must not include:

```text
- private operational details
- credentials
- internal strategy
- unpublished source access methods
```

---

## UI rules

The UI must show status honestly.

```text
- Placeholder data must be labeled as placeholder.
- Failed data must not be hidden.
- Stale data must be visibly marked stale.
- Partial coverage must not be presented as complete.
- Official source links should remain available when generated data is missing.
```

---

## Out of scope

```text
- parser implementation
- live fetching
- scheduled workflows
- historical status storage
- alerting
```


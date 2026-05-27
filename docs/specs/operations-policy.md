# Operations policy

Status: draft  
Scope: v0 static MVP, GitHub Actions updates, generated data, fallback behavior, and no-Cloudflare-Workers operation

This document defines how Where Horses Run / 競馬どこ？ should be operated during v0.

---

## 1. Core principle

Where Horses Run is static-first.

v0 operations should be simple, low-cost, and low-risk:

```text
GitHub Actions for scheduled data generation
static files for rendering
static hosting for delivery
no runtime database in v0
no Cloudflare Workers in v0
```

The site should continue to render even when data fetching fails.

---

## 2. Runtime boundaries

### 2.1 Used in v0

```text
GitHub Actions
Astro static build
static JSON files
static hosting
```

### 2.2 Not used in v0

```text
Cloudflare Workers
Cloudflare Pages Functions
Cloudflare D1
Cloudflare KV
Cloudflare R2
server-side API routes
runtime database queries
```

These may be reconsidered only if static JSON and GitHub Actions become insufficient.

---

## 3. Data ownership split

### 3.1 Static data

Human-maintained data lives in:

```text
data/static/
```

Examples:

```text
countries.json
racecourses.json
sources.json
glossary.json
archive.json
i18n/en.json
i18n/ja.json
```

Rules:

- edited by normal pull requests
- not overwritten by GitHub Actions
- validated in CI

### 3.2 Generated data

GitHub Actions generated data lives in:

```text
data/generated/
```

Examples:

```text
latest.json
today.json
tomorrow.json
calendar-30d.json
fetch-status.json
```

Rules:

- updated only by scheduled/manual workflows
- committed only when changed
- must be safe for static rendering
- failures should update fetch status or leave previous data available

---

## 4. Scheduled update strategy

v0 update frequency should remain low.

### 4.1 Daily morning update

Target time:

```text
05:17 JST
```

Purpose:

- fetch today and tomorrow schedules
- generate timetable files
- update fetch status
- keep official fallback links visible

### 4.2 Daily midday update

Target time:

```text
12:37 JST
```

Purpose:

- refresh active race-day sources
- update fetch status
- avoid forcing changes when no data changed

### 4.3 Weekly update

Purpose:

- update next 30 to 60 days calendar candidates
- detect source layout changes
- refresh source health summary

### 4.4 Monthly update

Purpose:

- check official source links
- review source status
- review country/track metadata
- identify sources needing manual review

---

## 5. GitHub Actions cron notes

GitHub Actions uses UTC cron.

JST to UTC conversion:

```text
05:17 JST = 20:17 UTC previous day
12:37 JST = 03:37 UTC same day
```

Example workflow schedule:

```yaml
on:
  schedule:
    - cron: '17 20 * * *'
    - cron: '37 3 * * *'
  workflow_dispatch:
```

Avoid scheduling at minute `0` to reduce queue/congestion risk.

---

## 6. Update workflow steps

A scheduled update should run in this order:

```text
1. checkout repository
2. install dependencies
3. validate data/static
4. fetch allowed sources
5. normalize data
6. write data/generated
7. validate data/generated
8. compare generated diff
9. commit only if changed
10. no-op if unchanged
```

If fetching fails, the workflow should not automatically break the public site.

---

## 7. Commit policy for generated data

Generated data commits should be conservative.

### 7.1 Commit when changed

Commit if:

- generated schedule changed
- fetch status changed materially
- source health changed
- calendar range changed

### 7.2 No-op when unchanged

Do not commit if:

- generated files are byte-for-byte unchanged
- only transient logs changed
- no public output changed

### 7.3 Commit message format

Suggested message:

```text
data: update generated racing schedule
```

For manual dispatch with a specific source:

```text
data: refresh generated schedule for hong-kong
```

---

## 8. Fetch failure behavior

Fetching failures are expected.

On failure:

1. record `FetchStatus`
2. preserve previous generated data when safe
3. show official fallback link
4. do not guess missing fields
5. do not fail static rendering

Example status:

```json
{
  "source_id": "hong-kong-hkjc-racecard",
  "status": "failed",
  "checked_at": "2026-05-27T03:37:00Z",
  "message": "Could not refresh source during scheduled run.",
  "fallback_url": "https://www.hkjc.com/"
}
```

---

## 9. FetchStatus states

Allowed states:

```text
ok
failed
stale
manual
skipped
```

Meaning:

| State | Meaning |
|---|---|
| ok | source refreshed successfully |
| failed | attempted refresh failed |
| stale | previous data exists but may be outdated |
| manual | source requires manual review |
| skipped | intentionally not fetched |

---

## 10. Local date and timezone handling

Official source times are treated as local track times.

Rules:

- store track timezone as IANA timezone
- store local meeting date
- store local start time when available
- derive UTC timestamp only when date, time, and timezone are known
- do not use JST as source of truth
- do not guess timezones

Required fields for conversion:

```text
start_date_local
start_time_local
start_timezone
```

Derived field:

```text
start_at_utc
```

---

## 11. Manual workflow dispatch

Every scheduled update workflow should support manual execution.

Manual inputs may include:

```text
source_id
country_id
date
force_no_commit
```

Manual mode should be used for:

- source verification
- parser testing
- post-failure refresh
- one-country refresh

---

## 12. Source automation rules

Do not automate a source unless it has:

- source record in `data/static/sources.json`
- Auto Level A or B, or explicit manual approval for C
- fallback URL
- reviewed display fields
- parser test fixture or sample notes

Do not automate:

- login-gated sources
- sources with high unresolved terms risk
- pages where only detailed data is available and minimal fields cannot be safely isolated
- social-only sources in v0

---

## 13. Parser output limits

Parsers must output only v0-safe fields:

```text
country_id
racecourse_id
meeting date
race number
start time
track timezone
official URL
fetch status
```

Optional only when safe:

```text
race name
distance
surface
race type
```

Parsers must not output prohibited detailed fields from the data use policy.

---

## 14. Build behavior

The Astro static build should not depend on live network requests.

Build input:

```text
data/static/
data/generated/
```

Build must pass even when:

- generated files are missing in initial MVP
- a source failed to refresh
- a country has official links only
- a racecourse has no timetable

Pages should render clear fallback states.

---

## 15. Link checking

Link checking should be separate from schedule fetching.

Recommended:

```text
weekly or monthly link-check workflow
```

Link check output should not automatically delete sources. It should report status for review.

---

## 16. Monitoring and review

v0 monitoring is file-based.

Use:

```text
data/generated/fetch-status.json
GitHub Actions logs
source notes under docs/research/source-notes/
```

Later, a static status page may show:

- last generated time
- source status summary
- stale sources
- manual review sources

---

## 17. Emergency stop

If a source becomes risky or problematic:

1. set source Auto Level to D or C
2. stop parser for that source
3. keep official fallback URL if safe
4. remove generated data if necessary
5. record the reason in research notes or a decision record

Emergency changes should favor caution.

---

## 18. Cloudflare policy

Cloudflare may be used for static hosting only.

v0 must not rely on:

```text
Workers
Pages Functions
D1
KV
R2
```

Reason:

- update frequency is low
- static output is sufficient
- GitHub Actions can perform scheduled generation
- Cloudflare free-plan worker capacity should be preserved

---

## 19. v0 acceptance criteria

The operations policy is satisfied when:

- generated data is separated from static data
- GitHub Actions update flow is documented
- cron times are defined
- update workflow supports no-op when unchanged
- fetch failures do not break static rendering
- FetchStatus states are defined
- timezone handling is defined
- Cloudflare Workers / Pages Functions are not required
- emergency stop behavior is defined
- generated data output is limited to v0-safe fields

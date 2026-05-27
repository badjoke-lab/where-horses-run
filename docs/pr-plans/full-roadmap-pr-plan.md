# Full roadmap PR plan

Status: draft

This roadmap estimates the sequence from static MVP to a mature v1.0 site.

---

## 1. Milestones

```text
M0 documentation baseline
M1 static MVP
M2 generated data foundation
M3 v0 Alpha timetable coverage
M4 v0 Public coverage
M5 long-tail country index
M6 glossary and image expansion
M7 v1.0 release preparation
```

---

## 2. M0 documentation baseline

Status: mostly complete.

Includes:

```text
v0 specification
data model
page map
UI/CSS policy
image policy
data use policy
operations policy
alpha source registry
MVP PR plan
```

Remaining docs before app work:

```text
dev-start-checklist.md
```

---

## 3. M1 static MVP

Goal: render the site from static data only.

PR range:

```text
PR-003 to PR-020
```

Core work:

```text
Astro setup
base layout
CSS structure
static data skeleton
validation scripts
CI check
countries pages
tracks pages
glossary pages
archive page
sources page
calendar fallback page
about and disclaimer pages
SEO basics
mobile pass
accessibility pass
static MVP release
```

M1 does not require real scheduled source fetching.

---

## 4. M2 generated data foundation

Goal: support generated schedule files without relying on runtime APIs.

PR range:

```text
PR-021 to PR-026
```

Core work:

```text
fetcher foundation
normalizer foundation
data/generated fixtures
GitHub Actions update workflow
FetchStatus rendering
first parser test
first safe automated source
```

Rules:

```text
commit generated data only when changed
never overwrite data/static from Actions
show official fallback links on failure
```

---

## 5. M3 v0 Alpha coverage

Goal: expand from one tested source to Alpha jurisdictions.

Target jurisdictions:

```text
Japan
Hong Kong
United Arab Emirates
South Korea
Turkey
Morocco
Chile
Peru
Mexico
Bahrain
```

Recommended sequence:

```text
Hong Kong
United Arab Emirates
Japan
Morocco
Bahrain
Turkey
South Korea
Chile
Peru
Mexico
```

Each jurisdiction should get:

```text
source note
static source record
parser or link-only fallback
FetchStatus coverage
UI verification
```

If parser risk is too high, keep that jurisdiction as calendar/link-first until reviewed.

---

## 6. M4 v0 Public coverage

Goal: expand to the broader v0 candidate set.

v0 candidate target:

```text
27 countries and regions from the v0 specification
```

Work should be grouped by region and source difficulty.

Suggested groups:

```text
Asia and Oceania
Middle East
South America
Caribbean
Europe harness/trotting group
Africa group
```

Each group should add:

```text
country records
racecourse records
source records
coverage and auto labels
fallback links
notes for parser readiness
```

---

## 7. M5 long-tail country index

Goal: make the global index useful even where timetable data is weak.

Add and refine:

```text
v0.1 countries
v0.2 countries
under-review countries
special racing categories
excluded or no-confirmed-calendar entries
archive jurisdictions
```

Acceptance:

```text
low-coverage countries are not hidden
status labels are clear
official links are shown where safe
users understand why timetable data is absent
```

---

## 8. M6 glossary and image expansion

Goal: strengthen dictionary value and visual explanation.

Work streams:

```text
expand glossary beyond initial 15 terms
add horse type entries
add racing role entries
add official-site term entries
add explanatory PNGs for priority terms
add planned/approved image states
add selected track illustrative PNGs when safe
```

Initial image priority:

```text
Harness racing
Trotting
Pacing
Banei racing
Racecourse
Racecard
Post time
Jockey
Driver
Trainer
```

Rules:

```text
PNG final assets only
no official venue photos
no copied venue compositions
track images must show illustrative disclaimer
```

---

## 9. M7 v1.0 release preparation

Goal: prepare a stable public v1.0.

Core work:

```text
full data validation pass
mobile verification
accessibility verification
SEO metadata review
sitemap and robots
source status review
known limitations page or section
release notes
operations runbook
```

v1.0 should still avoid:

```text
Cloudflare Workers requirement
runtime database requirement
entries, odds, results, payouts republishing
```

---

## 10. Approximate size

Expected total size if no major redesign occurs:

```text
static MVP: about 20 PRs
generated update foundation: about 6 PRs
v0 Alpha expansion: about 10 to 15 PRs
v0 Public expansion: about 15 to 20 PRs
long-tail and archive work: about 8 to 12 PRs
glossary and image expansion: about 10 to 15 PRs
release preparation: about 5 to 8 PRs
```

Likely total:

```text
70 to 90 PRs
```

Keep 100 PRs as the upper planning buffer, not the target.

---

## 11. Next immediate step

Before app implementation, add:

```text
docs/runbooks/dev-start-checklist.md
```

Then start:

```text
PR-003 app: initialize Astro project
```

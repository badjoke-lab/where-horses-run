# Data use policy

Status: draft  
Scope: v0 static MVP, official-source links, generated timetable data, and public disclaimers

This document defines what Where Horses Run / 競馬どこ？ may display, what it must avoid displaying, and how source risk should be handled.

---

## 1. Core principle

Where Horses Run is an index and guide.

It should help users find:

- racing jurisdictions
- racecourses
- race days
- race times
- official source links
- basic racing context
- glossary explanations

It should not try to become a full racing data provider.

---

## 2. Allowed v0 display data

The site may display these fields in v0 when obtained from official or safe sources:

```text
country
jurisdiction
racecourse
local meeting date
race number
local start time
track timezone
official detail URL
official calendar URL
source name
last checked time
coverage level
auto level
freshness status
fallback URL
```

Optional fields may be displayed when safe and minimal:

```text
race name
distance
surface
race type
meeting name
short track summary
short country racing profile
```

---

## 3. Data not displayed in v0

The site must not republish detailed race data that belongs to official or commercial providers.

Do not display:

```text
entries
full racecards
horse lists
rider lists
trainer lists
draws / stalls / barriers
odds
results
payouts
full past performance data
ratings
prediction marks
commercial site detail data
full official programme reconstruction
```

If users need those details, link to the official source.

---

## 4. Official-link first approach

For detailed information, the UI should route users to official pages.

Allowed link labels:

```text
Official source
Official racecard
Official programme
Official calendar
Official race detail
Open official source
```

Avoid labels that imply the site owns the full data.

---

## 5. Coverage level behavior

Coverage labels are required to avoid overclaiming.

| Level | Public meaning | Behavior |
|---|---|---|
| L1 | official links only | show source links and basic profile |
| L2 | calendar dates | show meeting dates, no full timetable |
| L3 | race-day timetable | show race number/time and official detail link |
| L4 | minimal race details | show name/distance/surface only when safe |
| L5 | detailed race data | reserved; not used in v0 without permission |

L5 should not be used for public display in v0.

---

## 6. Source risk levels

Each source should carry a `terms_risk` value.

```ts
type TermsRisk = "low" | "medium" | "high" | "unknown";
```

### 6.1 Low

Use for official pages with stable public information and no obvious restriction against low-frequency access.

### 6.2 Medium

Use when source structure is public but automation or detail reuse requires caution.

### 6.3 High

Use when source appears sensitive, restricted, login-gated, explicitly disallows automated collection, or mostly provides detailed proprietary data.

### 6.4 Unknown

Default before review.

---

## 7. Source handling rules

### 7.1 Official source

Preferred. Still avoid copying detailed fields beyond v0 scope.

### 7.2 Semi-official source

Allowed only as supporting context or fallback. Prefer official sources where available.

### 7.3 News or media source

Do not use as primary timetable source in v0. May be used for archive or context notes if needed.

### 7.4 Social source

Treat as under review or manual-only unless no other source exists. Do not automate in v0.

### 7.5 Login-gated source

Do not use in v0.

### 7.6 PDF / image programme source

Allowed as official fallback link. Automated extraction requires separate review.

---

## 8. Fetching and generated data

GitHub Actions may generate low-frequency data under:

```text
data/generated/
```

Generated data should be limited to v0-safe fields:

```text
meeting date
racecourse
race number
start time
timezone
official URL
fetch status
```

Generated data must not expand into prohibited detailed data without explicit future review.

---

## 9. Fallback behavior

If parsing fails or a source is not automation-ready, show fallback links instead of hiding the country or track.

Example public message:

```text
Could not refresh this timetable. Please confirm details at the official source.
```

Japanese:

```text
この時刻表は更新できませんでした。詳細は公式ソースで確認してください。
```

---

## 10. Freshness behavior

Every generated schedule block should show or derive a freshness state.

Allowed states:

```text
Fresh
Stale
Manual review
Official links only
Archive
```

Do not present stale data as current.

---

## 11. Public disclaimers

The site must include a visible disclaimer on relevant pages and a full disclaimer page.

English:

```text
This site does not republish entries, odds, results, or payouts.
Race details are linked to official sources whenever available.
Timetables may be delayed, incomplete, or changed. Always confirm with the official source.
```

Japanese:

```text
このサイトは出走表、オッズ、結果、払戻を再掲載しません。
各レースの詳細は公式ソースで確認してください。
表示時刻は遅延・変更・未反映の可能性があります。
```

Image disclaimer:

```text
Images are illustrative unless otherwise stated.
Venue images are not official photos.
```

Japanese:

```text
画像は特記がない限り説明用イメージです。
競馬場画像は公式写真ではありません。
```

---

## 12. Public copy rules

Use cautious wording.

Allowed:

```text
calendar
timetable
official source link
official detail link
coverage level
source status
track guide
glossary
```

Avoid:

```text
complete global racing data
full racecards
live detailed data
all race results
all official data
```

---

## 13. Manual review triggers

Manual review is required when:

- a source changes layout
- a source becomes login-gated
- a source blocks access
- source terms become unclear
- pages contain mostly detailed data outside v0 scope
- automated extraction would require PDF/image parsing
- generated output accidentally includes prohibited fields

---

## 14. Data removal and correction

If a source or rights concern appears:

1. stop automated fetching for that source
2. change source Auto Level to C/D
3. remove generated data if needed
4. keep only official source link if safe
5. document the change in research notes or a decision record

---

## 15. v0 acceptance criteria

The data use policy is satisfied when:

- allowed fields are clearly defined
- prohibited detailed fields are not rendered
- official links are preserved
- Coverage Level labels are shown
- freshness states are shown for generated schedules
- fallback behavior exists
- public disclaimers exist in English and Japanese
- high-risk or unknown sources are not automated without review
- generated data is restricted to v0-safe fields

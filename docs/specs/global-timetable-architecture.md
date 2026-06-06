# Global-first timetable architecture

Status: draft foundation  
Last updated: 2026-06-06

This specification defines the shared timetable foundation for Where Horses Run / 競馬どこ？ before any additional country-specific adapter work.

The architecture is global-first and multi-authority-first. Each country, racing authority, racecourse, meeting, and official source is treated as a peer record in a shared source inventory. A country adapter is only one possible implementation detail after the source inventory, source status, and display contract are stable.

This is not a complete world racing timetable. It is a foundation for partial, source-labelled timetable coverage that can expand jurisdiction by jurisdiction.

---

## 1. Strategy

The timetable layer should answer a narrow public question:

```text
Which official racing meetings are known for a date, where are they, what verified time detail is available, and where can the user confirm the source?
```

The next architecture step is a multi-authority source inventory. That inventory must compare official source candidates across authorities before selecting the first adapters. JRA remains a reusable verified source and adapter candidate, but it is not the center of the timetable architecture.

Same-level initial and future inventory targets include:

- JRA, for Japan central racing.
- NAR, for Japan local government racing.
- HKJC, for Hong Kong racing.
- Overseas national, regional, state, provincial, or racecourse authorities where official calendar or timetable sources are available.

No additional scraper, parser, runtime fetcher, odds, result, payout, tip, or full-entry layer belongs in this foundation. Racecard-derived timetable fields may be used only when they are reduced to public-safe timetable fields under the capability rank contract.

---

## 2. Shared data model

The shared timetable model is meeting-level first. It stores provenance and capability labels before source-specific parsing details.

### 2.1 Country

```ts
type TimetableCountry = {
  id: string;
  slug: string;
  name_en: string;
  name_local?: string;
  region: string;
  timezone_default?: string;
  status: "active" | "under_review" | "archive" | "excluded" | "special";
};
```

### 2.2 Racing authority

```ts
type RacingAuthority = {
  id: string;
  country_id: string;
  name_en: string;
  name_local?: string;
  authority_type: "national" | "regional" | "state" | "provincial" | "racecourse_operator" | "other";
  official_source_ids: string[];
  status: "active" | "under_review" | "archive" | "excluded";
};
```

### 2.3 Racecourse

```ts
type TimetableRacecourse = {
  id: string;
  country_id: string;
  authority_ids: string[];
  name_en: string;
  name_local?: string;
  timezone: string;
  status: "active" | "archive" | "unknown";
};
```

### 2.4 Meeting

```ts
type TimetableMeeting = {
  id: string;
  country_id: string;
  authority_id: string;
  racecourse_id: string;
  date: string;
  timezone: string;
  source_id: string;
  source_status: SourceStatus;
  last_checked_date: string;
  capability_rank: CapabilityRank;
  first_race_time_local?: string;
  last_race_time_local?: string;
  notes?: string;
};
```

Meeting records may summarize a meeting only. They must not include entries, odds, results, payouts, tips, full racecards, or raw official page content.

### 2.5 Official source

```ts
type OfficialSource = {
  id: string;
  country_id: string;
  authority_id: string;
  racecourse_id?: string;
  name_en: string;
  url: string;
  source_kind: "calendar" | "timetable" | "programme" | "racecard" | "link_only";
  source_status: SourceStatus;
  last_checked_date: string;
  capability_rank: CapabilityRank;
  notes?: string;
};
```

### 2.6 Source status

```ts
type SourceStatus = "verified" | "partial" | "not_verified" | "stale" | "unavailable";
```

| Status | Display meaning |
| --- | --- |
| `verified` | The displayed meeting-level fact was checked against the official source. |
| `partial` | Some official information is available, but the displayed fact is incomplete. |
| `not_verified` | A candidate source exists, but the meeting fact has not been verified. |
| `stale` | The source was checked previously, but freshness is no longer acceptable. |
| `unavailable` | The expected official source route was unavailable or unusable at last check. |

Unverified sources must be displayed as `partial` or `not_verified`; they must not be promoted as complete timetable data.

### 2.7 Last checked date

```ts
type LastCheckedDate = string;
```

Use `YYYY-MM-DD` for source inventory and public display freshness. Use date-time fields only in lower-level generated pipeline logs where needed.

---

## 3. Capability rank matrix

```ts
type CapabilityRank = "C" | "B" | "B+" | "A" | "A+";
```

| Rank | Required verified capability | Public display boundary |
| --- | --- | --- |
| C | Meeting date and racecourse only. | Show that a meeting exists. Do not show race times. |
| B | First race time is available. | Show the first race time only. |
| B+ | First and last race time are available. | Show first / last race time only. |
| A | Race-by-race post times are available from the official source. | Show race label and post time on a separate detail page. Do not show race metadata in A. |
| A+ | Race-by-race post times plus minimal race metadata are available from the official source. | On a separate detail page, show race label, post time, race title, distance, and surface/course type only. |

Capability rank describes the official source capability that has been verified for a source or meeting. It is not a permission to republish full source content.

A+ is not a general racecard republication level. It may use racecard-derived fields only after reducing them to the minimum timetable context fields: race title, distance, and surface/course type. A+ must not include starter lists, odds, results, payouts, predictions, tips, copied racecard text, or raw source body/html.

---

## 4. Common display contract

All public timetable views should use the same display boundary:

- Monthly calendar pages show meeting summaries only.
- Day pages show the meeting list, official source, source status, last checked date, and capability rank.
- A-level and A+-level detail is separate from the monthly calendar and day summary views.
- A-level detail pages show race label and post time only.
- A+-level detail pages may additionally show race title, distance, and surface/course type.
- B+ meetings show first and last race time only.
- B meetings show first race time only.
- C meetings show that the meeting exists only.
- Unverified source candidates show `partial` or `not_verified` status and must not appear as complete timetable coverage.

The display contract keeps global timetable coverage comparable across authorities even when each authority exposes different public source detail.

---

## 5. Adapter positioning

Adapters are selected after inventory review. They are not the source of truth by themselves.

JRA should be documented and reused as one verified source / adapter candidate. NAR, HKJC, and overseas authorities should be inventoried with the same fields, source status labels, last checked dates, and capability ranks before additional adapter implementation work begins.

The first adapter selection matrix should consider only these initial adapter candidates:

1. JRA
2. NAR
3. HKJC

Other country or authority candidates remain in the multi-country source inventory until the common calendar display contract and adapter selection matrix are reviewed.

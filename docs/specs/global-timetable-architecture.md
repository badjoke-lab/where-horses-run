# Global-first timetable architecture

Status: active foundation  
Last updated: 2026-07-06

This specification defines the shared timetable foundation for Where Horses Run / 競馬どこ？ before additional source-specific adapter work.

The architecture is global-first and multi-authority-first. Each country, racing authority, racecourse, meeting, and official source is treated as a peer record in a shared source inventory. A country adapter is only one possible implementation detail after the source inventory, source status, display contract, and incremental coverage contract are stable.

This is not a claim of complete world racing coverage. It is a foundation for partial, source-labelled, incrementally maintained timetable coverage that can expand jurisdiction by jurisdiction.

---

## 1. Strategy

The timetable layer should answer a narrow public question:

```text
Which official racing meetings are known for a date, where are they, what verified time detail is available, how fresh is that knowledge, and where can the user confirm the official source?
```

The architecture is built for official sources that expose different horizons and different detail timing. Some sources expose months of meeting dates before race detail. Others expose meeting and A+ detail together. Some expose only a short future window. The common model must support all of these without requiring artificial month-wide completeness before valid partial updates can be reviewed and published.

Same-level initial and future inventory targets include:

- JRA, for Japan central racing;
- NAR, for Japan local government racing;
- Banei Tokachi, under a separate system-specific adapter path;
- HKJC, for Hong Kong racing;
- overseas national, regional, state, provincial, or racecourse authorities where official calendar or timetable sources are available.

No additional odds, result, payout, tip, participant, copied racecard, or raw-source layer belongs in this foundation. Racecard-derived timetable fields may be used only when reduced to public-safe timetable fields under the capability rank and publication contracts.

---

## 2. Shared data model

The shared timetable model is meeting-level first. It separates meeting existence, timetable detail, source provenance, freshness, and coverage observation.

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

### 2.4 Meeting / schedule layer

```ts
type TimetableMeeting = {
  id: string;
  country_id: string;
  authority_id: string;
  racing_system_id: string;
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

Meeting records establish the known meeting identity and the highest reviewed detail rank currently attached to that meeting. They must not include entries, odds, results, payouts, tips, full racecards, or raw official page content.

A meeting may enter the pipeline at C, B, B+, A, or A+. The architecture does not require a source that directly provides A+ detail to publish an artificial C-only intermediate state first.

### 2.5 Timetable detail layer

A meeting detail record may exist for A and A+ meetings. It is separate from meeting existence and list rendering.

The detail layer contains only the fields allowed by the applicable rank and publication policy. A system-level maximum never fills unavailable meeting-level fields.

Later reviewed data may raise the meeting rank. Temporary source failure or a later lower-detail observation does not automatically delete or downgrade a previously reviewed record.

### 2.6 Official source

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

### 2.7 Coverage observation

Coverage is an operational observation, not an implicit completeness claim.

A source run should be able to record:

```ts
type CoverageObservation = {
  run_id: string;
  system_id: string;
  source_id: string;
  checked_at: string;
  requested_scope: unknown;
  observed_scope: unknown;
  collection_mode: "date_window" | "single_date" | "selected_meetings" | "source_visible_horizon";
  records_discovered: number;
  records_updated: number;
  unresolved_dates: string[];
  unresolved_meeting_ids: string[];
  source_errors: string[];
  coverage_claim: "none" | "partial" | "source_window_complete" | "audited_complete";
};
```

`partial` is a valid successful result. Requested scope and observed source scope are separate facts.

### 2.8 Source status

```ts
type SourceStatus = "verified" | "partial" | "not_verified" | "stale" | "unavailable";
```

| Status | Display meaning |
| --- | --- |
| `verified` | The displayed meeting-level fact was checked against the official source. |
| `partial` | Some official information is available, but the displayed fact or source horizon is incomplete. |
| `not_verified` | A candidate source exists, but the meeting fact has not been verified. |
| `stale` | The source was checked previously, but freshness is no longer acceptable. |
| `unavailable` | The expected official source route was unavailable or unusable at last check. |

Unverified sources must not be promoted as complete timetable data.

### 2.9 Last checked date

```ts
type LastCheckedDate = string;
```

Use `YYYY-MM-DD` for source inventory and public display freshness. Use date-time fields in lower-level generated pipeline logs and coverage observations where required.

---

## 3. Incremental acquisition contract

All racing systems follow the cross-system incremental coverage contract in `docs/calendar/incremental-coverage-contract.md`.

The common rules are:

- operator runs may occur at irregular times;
- requested date windows may vary and overlap;
- official sources may expose only part of a requested range;
- valid partial batches may be reviewed and promoted;
- one source may establish meeting dates while another later supplies timetable detail;
- one source may directly provide B, B+, A, or A+ records;
- absence from a later run is not deletion;
- temporary source degradation is not automatic rank regression;
- completeness claims are validated separately from ordinary batch and promotion validation.

The common architecture therefore separates:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

This is a logical responsibility split, not a requirement for three separate physical source fetches.

---

## 4. Capability rank matrix

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

Capability rank describes reviewed source or meeting capability. It is not a permission to republish full source content.

A+ is not a general racecard republication level. It may use racecard-derived fields only after reducing them to minimum timetable context fields. A+ must not include starter lists, odds, results, payouts, predictions, tips, copied racecard text, or raw source body/html.

---

## 5. Validation responsibilities

Validation has four distinct roles.

### Batch validation

Validate only the integrity and safety of records produced by the current run. Incomplete requested windows are not automatically failures.

### Promotion validation

Validate review status, source/readiness gates, stable identity, rank shape, collisions, freshness rules, and deterministic merge behavior. Valid partial promotion batches are allowed.

### Coverage audit

Report what dates or meetings remain unknown, pending, unavailable, or blocked for a defined scope. Incompleteness is reportable without blocking unrelated valid promotions.

### Completion audit

Validate an explicit scope claim such as a complete month, season, or selected meeting set. Only this layer may require every expected meeting in the declared scope to be resolved.

---

## 6. Common display contract

All public timetable views use the same display boundary:

- Calendar pages show meeting summaries only;
- day pages show the meeting list, official source, source status, last checked date, and capability rank;
- A-level and A+-level detail is separate from Calendar and day summary views;
- A-level detail pages show race label and post time only;
- A+-level detail pages may additionally show race title, distance, and surface/course type;
- B+ meetings show first and last race time only;
- B meetings show first race time only;
- C meetings show that the meeting exists only;
- freshness, source health, and coverage state remain distinct from capability rank;
- partial coverage must not be presented as complete coverage.

The display contract keeps global timetable coverage comparable across authorities even when each authority exposes different public source detail and source horizons.

---

## 7. Adapter positioning

Adapters are selected after inventory review. They are not the source of truth by themselves.

A system may use:

- separate schedule and detail sources;
- one combined source that yields meeting identity and full detail;
- manual PDF/import paths;
- semi-automatic adapters;
- selected-meeting retries.

JRA should be documented and reused as one verified source and adapter reference. NAR, Banei, HKJC, UAE, and later authorities use the same shared identity, rank, freshness, incremental coverage, and validation responsibilities while retaining source-specific parsing semantics.

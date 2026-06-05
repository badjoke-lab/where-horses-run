# Authority source inventory schema

Status: draft foundation  
Last updated: 2026-06-05

This specification defines the shared authority source inventory used before selecting timetable adapters. It supports JRA, NAR, HKJC, and overseas authorities under the same public-safe fields so no single authority becomes the center of the timetable architecture.

The inventory is source-review metadata only. It does not add adapters, scrapers, parsers, runtime fetch logic, racecards, odds, results, payouts, tips, full entries, raw source bodies, or private workflow notes.

---

## Files

```text
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
scripts/check-authority-source-inventory-schema.mjs
```

`authority-source-inventory.schema.json` defines the allowed fields and enums. `authority-source-inventory.json` is currently an empty placeholder; follow-up inventory PRs can add real public-safe source records after review.

---

## Record shape

Each record uses this shape:

```ts
type AuthoritySourceInventoryRecord = {
  country_id: string;
  authority_id: string;
  authority_name_en: string;
  authority_name_local: string | null;
  authority_type: AuthorityType;
  racecourse_scope: RacecourseScope;
  official_source_id: string;
  official_source_url: string;
  source_kind: SourceKind;
  source_status: GlobalTimetableSourceStatus;
  last_checked_date: string | null;
  capability_rank: GlobalTimetableCapabilityRank;
  adapter_candidate_status: AdapterCandidateStatus;
  notes: string;
};
```

The stable record key is:

```text
country_id + authority_id + official_source_id
```

---

## Required fields

| Field | Type | Purpose |
| --- | --- | --- |
| `country_id` | string | Stable country identifier shared with country and timetable datasets. |
| `authority_id` | string | Stable racing authority identifier within the country scope. |
| `authority_name_en` | string | English authority name for review and display. |
| `authority_name_local` | string \| null | Local-language authority name when applicable; use `null` when no local variant is needed. |
| `authority_type` | enum | Authority jurisdiction or operator category. |
| `racecourse_scope` | enum | Racecourse coverage scope for the source candidate. |
| `official_source_id` | string | Stable source identifier for the authority source candidate. |
| `official_source_url` | URL string | Official or authority-owned source URL used for confirmation. |
| `source_kind` | enum | Kind of source capability being inventoried. |
| `source_status` | enum | Shared global timetable source status. |
| `last_checked_date` | `YYYY-MM-DD` \| null | Date the source candidate was last checked, or `null` when not checked yet. |
| `capability_rank` | enum | Shared global timetable capability rank. |
| `adapter_candidate_status` | enum | Adapter-selection readiness after source review, without implementing the adapter. |
| `notes` | string | Public-safe reviewer notes. |

---

## Enums

### Authority type

```ts
type AuthorityType =
  | "national"
  | "regional"
  | "state"
  | "provincial"
  | "racecourse_operator"
  | "other";
```

### Racecourse scope

```ts
type RacecourseScope =
  | "all_authority_racecourses"
  | "subset_of_authority_racecourses"
  | "single_racecourse"
  | "countrywide"
  | "unknown";
```

### Source kind

```ts
type SourceKind =
  | "calendar"
  | "timetable"
  | "programme"
  | "racecard"
  | "official_link"
  | "source_index"
  | "other";
```

### Source status

Authority source inventory records reuse the existing global timetable source status exactly:

```ts
type GlobalTimetableSourceStatus =
  | "verified"
  | "partial"
  | "not_verified"
  | "stale"
  | "unavailable";
```

### Capability rank

Authority source inventory records reuse the existing global timetable capability rank exactly:

```ts
type GlobalTimetableCapabilityRank = "C" | "B" | "B+" | "A";
```

### Adapter candidate status

```ts
type AdapterCandidateStatus =
  | "not_reviewed"
  | "candidate"
  | "needs_review"
  | "blocked"
  | "not_applicable";
```

This field records adapter-selection readiness only. It must not imply that an adapter, scraper, parser, or runtime fetch path exists.

---

## Public-safe exclusions

Inventory records must not include:

- entries, odds, results, payouts, predictions, tips, racecards, or full entries;
- raw official page content or source bodies;
- scraper, parser, adapter, or runtime fetch implementation details;
- JRA-only fields that would make Japan central racing the center of the architecture;
- internal strategy, budget, monetization, or private workflow notes.

---

## Validation

Run the schema validator with:

```text
npm run validate:authority-source-inventory-schema
```

The validator checks the schema enums, placeholder data file shape, required record fields, URL/date formats, duplicate source keys, and public-safe exclusion guardrails.

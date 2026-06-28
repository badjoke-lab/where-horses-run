# Authority source inventory schema

Status: active foundation  
Schema version: `authority-source-inventory-schema-v1`  
Last updated: 2026-06-28

This specification defines the shared public-safe authority source inventory used before timetable adapter selection and by Calendar Readiness references. It supports national, regional, state, provincial, racecourse-operator, and other authority structures without making one jurisdiction the center of the architecture.

The inventory records reviewed source metadata only. It does not claim that an adapter, scraper, parser, scheduler, or live fetch path exists.

## Files

```text
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
scripts/check-authority-source-inventory-schema.mjs
```

Calendar Readiness records reference an inventory record using:

```text
country_id/authority_id/official_source_id
```

## Record shape

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

Stable inventory key:

```text
country_id + authority_id + official_source_id
```

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

```ts
type GlobalTimetableSourceStatus =
  | "verified"
  | "partial"
  | "not_verified"
  | "stale"
  | "unavailable";
```

### Capability rank

```ts
type GlobalTimetableCapabilityRank = "C" | "B" | "B+" | "A" | "A+";
```

A+ means that selected programme-summary fields may be technically obtainable. It does not permit complete racecard republication and remains subject to Public Ceiling and item-level publication policy.

### Adapter candidate status

```ts
type AdapterCandidateStatus =
  | "not_reviewed"
  | "candidate"
  | "needs_review"
  | "blocked"
  | "not_applicable";
```

Adapter candidate status is not Calendar Readiness and is not implementation status. A `candidate` record does not prove that a parser or runtime path exists.

## Calendar Readiness relationship

Keep these states separate:

```text
inventory source capability
Calendar Readiness
implementation status
public source status
```

The source inventory answers what official source exists and what it may provide. Calendar Readiness answers whether and how implementation may begin. Implementation status answers what tooling and operations actually exist.

See:

- `docs/calendar/calendar-readiness-contract.md`
- `docs/calendar/machine-readable-contracts.md`
- `data/static/calendar-readiness.schema.json`

## Public-safe exclusions

Inventory records must not contain:

- raw HTML, JavaScript, PDF bodies, or API response bodies;
- complete programmes or racecards;
- horses, runners, jockeys, trainers, weights, gates, or participant lists;
- odds, betting recommendations, results, payouts, predictions, or tips;
- credentials, cookies, tokens, restricted access details, or bypass instructions;
- internal strategy, budget, monetization, private workflow, or private publication-risk notes.

## Validation

Run:

```text
node scripts/check-authority-source-inventory-schema.mjs
node scripts/check-calendar-contracts.mjs
```

The validators check schema versions, enums, required fields, URL/date formats, duplicate source keys, public-safe exclusions, A+ consistency, and Calendar Readiness reference compatibility.

# Timetable acquisition route schema

Status: draft foundation  
Last updated: 2026-06-05

This specification defines the acquisition route inventory that sits between the authority source inventory and any future fetch, manual snapshot, dry run, normalization, calendar projection, or scheduler work.

Canonical spec file: [timetable-acquisition-route-schema.md](timetable-acquisition-route-schema.md).

The inventory is route-review metadata only. It may list initial public-safe route records, but it does not implement adapters, scrapers, parsers, runtime fetch logic, scheduled jobs, live source fetching, raw source body storage, racecards, odds, results, payouts, predictions, tips, full entries, or private/internal notes.

---

## Files

```text
data/static/timetable-acquisition-routes.schema.json
data/static/timetable-acquisition-routes.json
scripts/check-timetable-acquisition-route-schema.mjs
```

`timetable-acquisition-routes.schema.json` defines the allowed route fields and enums. `timetable-acquisition-routes.json` now includes initial public-safe JRA, NAR/local-government-racing, and HKJC dry-run/status-only route records as peer candidates; follow-up route inventory PRs can add more reviewed public-safe records after authority source review.

---

## Data-flow position

Acquisition routes occupy this position in the timetable contract:

```text
Authority Source Inventory
  -> Acquisition Route Inventory
  -> Fetch / Manual Snapshot / Dry Run
  -> Extracted Meeting Candidate
  -> Normalized Timetable Record
  -> Calendar View Model
  -> Monthly / Day Calendar Display
```

A route is not source truth by itself. It must point back to a reviewed authority source inventory record through `authority_id` and `official_source_id`, and future downstream records must preserve `route_id` provenance.

---

## Record shape

Each route record uses this shape:

```ts
type TimetableAcquisitionRoute = {
  route_id: string;
  authority_id: string;
  official_source_id: string;
  source_url: string;
  acquisition_mode: AcquisitionMode;
  output_target: OutputTarget;
  allowed_refresh_scope: AllowedRefreshScope;
  last_checked_date: string | null;
  status: AcquisitionRouteStatus;
  notes: string;
};
```

The stable record key is:

```text
route_id
```

`route_id` values must be globally stable and public-safe. They must not encode private workflow, budget, monetization, or internal strategy details.

---

## Required fields

| Field | Type | Purpose |
| --- | --- | --- |
| `route_id` | string | Stable public-safe identifier for this acquisition route. |
| `authority_id` | string | Authority identifier matching an authority source inventory record. |
| `official_source_id` | string | Official source identifier matching an authority source inventory record. |
| `source_url` | URL string | Official source URL or stable official route URL used for checking. |
| `acquisition_mode` | enum | Whether the route is manual-only, dry-run-only, scheduled-candidate, or disabled. |
| `output_target` | enum | The highest public-safe output this route may produce. |
| `allowed_refresh_scope` | enum | The maximum refresh scope allowed by this route contract. |
| `last_checked_date` | `YYYY-MM-DD` \| null | Date the route was last checked, or `null` when not checked yet. |
| `status` | enum | Route readiness/status label. |
| `notes` | string | Public-safe notes about route limitations or review state. |

---

## Enums

### Acquisition mode

```ts
type AcquisitionMode =
  | "manual_snapshot"
  | "dry_run"
  | "scheduled_candidate"
  | "disabled";
```

### Output target

```ts
type OutputTarget =
  | "extracted_meeting_candidate"
  | "normalized_timetable_record"
  | "calendar_view_model"
  | "status_only";
```

### Allowed refresh scope

```ts
type AllowedRefreshScope =
  | "none"
  | "single_date"
  | "date_range"
  | "month"
  | "source_defined_window";
```

### Acquisition route status

```ts
type AcquisitionRouteStatus =
  | "not_reviewed"
  | "candidate"
  | "verified_manual"
  | "dry_run_only"
  | "scheduled_candidate"
  | "blocked"
  | "disabled"
  | "stale";
```

---

## Acceptance rules for future records

A future route record may be added only when all of the following are true:

- it links to an authority source inventory record;
- it uses an official or authority-owned source URL;
- it declares an acquisition mode and allowed refresh scope;
- it declares the highest public-safe output it may produce;
- it preserves source and route provenance for downstream records;
- it does not require storing raw source body/html as repository data;
- it does not create entries, odds, results, payouts, predictions, tips, full racecards, private feeds, private/internal notes, or paid-feed records.

---

## Validation

Run the schema validator with:

```text
npm run validate:timetable-acquisition-route-schema
```

The validator checks the schema fields and enums, placeholder data file shape, route record URL/date formats, duplicate route keys, authority source inventory linkage when records are present, package-script wiring, and public-safe exclusion guardrails.

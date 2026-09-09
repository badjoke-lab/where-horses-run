# Country + Racecourse publication package runbook

Status: active operational runbook  
Adopted: 2026-09-09  
Canonical product authority: `docs/specs/country-racecourse-integrated-publication-2026-09-09.md`  
Current schedule authority: `docs/project-roadmap-2026-09-09-addendum.md`

## Purpose

This runbook is the repeatable handoff from a newly established Calendar country to its public Country and active Racecourse surfaces. It does not create a second publication truth. The stable Calendar-support registry and canonical racecourse status remain the gates.

## Package boundary

A country package is one product expansion even when implemented through several PRs:

```text
official source / acquisition
-> reviewed Calendar public support
-> Country publication
-> active racecourse reconciliation
-> reviewed map locations where available
-> Racecourse publication
-> Country <-> Racecourse <-> Calendar links
-> search / sitemap / primary navigation projection
```

Do not declare a country package complete after only adding a Calendar collector or only adding a Country page.

## Step 1 — establish Calendar support

Before public Country exposure:

- the official acquisition path must be implemented and reviewed under the Calendar contracts;
- the public Calendar projection must use canonical `country_id`, `authority_id`, and `racecourse_id` values;
- publication rank/timezone/meeting-state behavior must remain the existing Calendar truth;
- the country must have a stable support decision, not a one-day or one-meeting observation.

Only then add or update its record in:

```text
data/static/calendar-public-country-support-v1.json
```

`calendar_supported: true` is publication authority for the normal Country surface. Do not infer this flag from whether a meeting exists today.

## Step 2 — reconcile the active racecourse inventory

For the supported country, reconcile every active venue intended for normal public use to canonical racecourse data.

The active public Racecourse gate is:

```text
racecourse.status in {active, current}
AND
racecourse.country_id is Calendar-supported
```

Required minimum identity:

- canonical `racecourse_id` / `id`;
- stable slug;
- country relation;
- canonical or reviewed English display name;
- canonical status;
- timezone when reviewed/required by Calendar state;
- authority/system relation through reviewed Calendar/source evidence where available.

Do not change a closed/historical venue to `active` merely to make it appear publicly.

## Step 3 — attach reviewed locations

Use only reviewed racecourse locations.

Primary reviewed location registry:

```text
data/static/racecourse-locations-v1.json
```

If a location is not reviewed, leave the map point absent/pending. Do not guess coordinates or copy an unreviewed geocoder result into the public map.

A missing optional location does not change Calendar support, but the package must record the gap before claiming complete map coverage.

## Step 4 — rely on the shared runtime projection

Do not create a new country-specific route allowlist or a separate Racecourse publication list.

The shared runtime derives public surfaces from the canonical gates:

```text
Country directory/routes/search
  <- calendar-public-country-support-v1.json

Racecourse directory/routes/search
  <- calendar_supported country + active/current racecourse status

Country page
  <- CountryHubPage

Racecourse page
  <- RacecourseHubPage
```

Once the canonical gate data is correct, the generic runtime is expected to project the new country and its active racecourses. Country-specific component forks require an explicit specification change.

## Step 5 — verify vertical links

For EN and JA, verify that the same reviewed identities connect:

```text
Country -> Calendar
Country -> active Racecourse
Country -> reviewed Map points
Racecourse -> Country
Racecourse -> Calendar
Racecourse -> official sources
search -> Country / active Racecourse
```

Meeting lists remain one meeting per row and must not reinterpret rank, timezone, lifecycle, or source status.

## Step 6 — preserve the internal master boundary

Unsupported countries and non-active racecourses remain in canonical/internal data unless a separate data-correction task changes them.

When a country loses normal Calendar support:

- change the reviewed Calendar-support state;
- do not delete the country master record;
- do not delete racecourse history merely to remove public routes.

Closed/historical racecourses move through the separate historical publication lane defined by the canonical specification.

## Completion checklist

A future country package is complete only when all applicable items are true:

- [ ] official acquisition path is reviewed and part of the Calendar support system;
- [ ] stable `calendar_supported` state is recorded;
- [ ] Country route/list/search projection is present in EN and JA;
- [ ] active racecourse inventory is reconciled to canonical IDs/statuses;
- [ ] active Racecourse route/list/search projection is present in EN and JA;
- [ ] reviewed map locations are connected where available, with gaps left explicit;
- [ ] Country <-> Racecourse <-> Calendar links use the same canonical identities;
- [ ] official-source links use reviewed source records/links;
- [ ] unsupported/closed/historical canonical records remain preserved;
- [ ] no second route allowlist, meeting truth, or publication-rank interpretation was introduced;
- [ ] the active project roadmap records the package state and the next Work ID/lane.

## Required re-read points

Re-read the canonical specification, this runbook, and the active project-roadmap addendum:

- before starting a new country package;
- after relevant `main` movement;
- whenever the support or publication boundary changes;
- before PR creation/material update;
- before merge;
- after merge before starting the next package.

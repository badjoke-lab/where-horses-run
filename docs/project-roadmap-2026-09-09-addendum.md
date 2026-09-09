# Where Horses Run project roadmap — 2026-09-09 Country/Racecourse integrated expansion addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-09  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-09-08-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Country/Racecourse publication authority: `docs/specs/country-racecourse-integrated-publication-2026-09-09.md`  
Future-country package runbook: `docs/runbooks/country-racecourse-publication-package.md`

## Current product direction

Home and Calendar remain the primary operational surfaces. Countries and Racecourses are expanded together with Calendar coverage rather than as independent broad directories.

The completed historical 98-country publication programme remains evidence of gathered country data; it no longer implies that all 98 countries must remain equally exposed in the primary public Country directory.

## Current UI/product Work IDs

```text
UI-008A — Calendar-supported Country public gate [complete: main a2d8b88802e54f5c67846a165d4f421e76ac44df]
UI-008B — Japan Country reference page [complete: main cf0ff0da47143bd73179403698f8365351ce91e3]
UI-008C — Tokyo Racecourse reference page [complete: main 31be082d2c91c0579d1f33cd18a5b56bd31396ed]
UI-008D — project current Calendar-supported countries and active racecourses into shared layouts [complete: main f29b994bcb8696b8758698a3cf083b5f25e866e7]
UI-008E — make future country expansion a vertical Calendar + Country + Racecourse + Map package [complete: main c7ac07819e22bb2de72e7adedcf8d9d8aa09ca45]
UI-009  — EN/JA responsive and navigation release verification after the supported set is projected [current]
```

Calendar country/authority acquisition expansion and all-tier racecourse inventory research continue in parallel. They must not be serialized behind UI work unless a real schema/shared-file dependency exists.

## Completed public-gating baseline — UI-008A

The public Country gate is implemented from a stable reviewed registry rather than current-day meeting presence.

Canonical runtime registry:

```text
data/static/calendar-public-country-support-v1.json
```

Current supported set at the UI-008A merge boundary:

```text
Japan
Hong Kong
United Arab Emirates
South Korea
Turkey
Morocco
```

The set is grounded in the production systems wired into `.github/workflows/calendar-unified-official-refresh.yml`. The canonical 98-country master remains broader than public exposure.

Implemented behavior:

```text
calendar_supported = true
  -> visible in Countries directory
  -> eligible for Country detail route
  -> included as a Country result in normal search

calendar_supported = false
  -> retained in internal/canonical data
  -> omitted from primary Countries directory
  -> normal Country detail route not generated
  -> omitted as a Country result from normal search
```

Static route generation supplies sitemap exposure, so unsupported Country detail routes are no longer part of the normal generated public route set.

## Reference pages

### Japan Country page — UI-008B complete

The first shared Country hub is merged at `cf0ff0da47143bd73179403698f8365351ce91e3`.

It establishes the shared baseline using existing reviewed data and current Calendar truth:

- identity + Calendar-supported state;
- reviewed overview;
- authority/system, racing types, listed/current public racecourse count, official sources;
- today / near-term meetings from the public Calendar view model;
- reviewed racecourse map using the existing RacecourseMap / reviewed GeoJSON path;
- domestic racecourse list;
- official-source links;
- Country -> Calendar and Country -> Racecourse links.

### Tokyo Racecourse page — UI-008C complete

The first shared Racecourse hub is merged at `31be082d2c91c0579d1f33cd18a5b56bd31396ed`.

It establishes the Racecourse baseline using existing reviewed/runtime data:

- identity and reviewed status/context;
- Country link back to Japan;
- authority/racing type/timezone where reviewed;
- today/next meeting focus plus upcoming reviewed meeting rows;
- reviewed location map and location text using RacecourseLocationMapSection / RacecourseMap;
- reviewed course facts;
- representative race names as plain text only;
- official racecourse/source links;
- Racecourse -> Country and Racecourse -> Calendar links;
- EN and JA routes use the same composition.

The page consumes existing public Calendar meeting state and does not create a second meeting lifecycle, timezone, rank, or source truth.

## Supported-country projection — UI-008D complete

UI-008D is merged at `f29b994bcb8696b8758698a3cf083b5f25e866e7`.

Implemented behavior:

1. all Calendar-supported Country routes use the shared Country hub composition;
2. normal active Racecourse publication derives from `calendar_supported` plus canonical active/current racecourse status;
3. primary Racecourses directory, generated Racecourse routes, global search, Country-hub racecourse lists, and map links use the same active supported-country gate;
4. closed/historical racecourses remain in the canonical/all-tier master and are not silently deleted;
5. active supported-country racecourses use the shared Racecourse hub composition;
6. reviewed locations are shown where available and unreviewed locations remain absent/pending rather than guessed;
7. Calendar rows remain the existing public Calendar truth and one meeting per row;
8. EN/JA routing and Country <-> Racecourse <-> Calendar links derive from the same canonical IDs.

The active Racecourse gate is:

```text
racecourse.status in {active, current}
AND
racecourse.country_id is Calendar-supported
```

This gate is stable and does not depend on whether a meeting happens to be visible today.

Runtime projection:

```text
Countries listing/routes/search
  -> calendar-public-country-support-v1.json gate

Racecourses listing/routes/search/Country-hub links
  -> active supported-country derived gate

Country page
  -> CountryHubPage for every supported country

Racecourse page
  -> RacecourseHubPage for every active racecourse passing the public gate
```

## Future country-expansion package — UI-008E complete

UI-008E is merged at `c7ac07819e22bb2de72e7adedcf8d9d8aa09ca45`.

The repeatable operational authority is:

```text
docs/runbooks/country-racecourse-publication-package.md
```

A future country addition is not complete when only its collector or Calendar rows are added. The package must continue through:

```text
official acquisition source established
+ reviewed Calendar public support established
+ stable Country public eligibility enabled
+ active racecourse inventory reconciled
+ Racecourse pages projected through the shared gate/layout
+ reviewed map locations projected where available
+ Country/Racecourse/Calendar links projected
+ search/sitemap/primary navigation projected
+ EN/JA package checked
```

`AGENTS.md`, `START-HERE.md`, and `docs/governance/document-authority.md` now point future Country/Racecourse work to the integrated specification, this roadmap, and the package runbook. New country work must reuse the generic gates/shared components rather than create a second hard-coded country list, Racecourse allowlist, meeting truth, or publication-rank interpretation.

The runbook also defines rollback/preservation behavior: removing normal public support changes the reviewed support state; it does not delete canonical country or racecourse history.

## UI-009 — EN/JA responsive and navigation release verification [current]

UI-009 is the release-verification pass for the integrated public set. It does not broaden the publication gate or add new racing facts.

Required verification scope:

```text
EN Countries directory
JA Countries directory
representative EN/JA Country hubs
EN Racecourses directory
JA Racecourses directory
representative EN/JA Racecourse hubs
Country <-> Racecourse <-> Calendar links
search projection
sitemap/generated-route projection
reviewed Map presence/fallback behavior
mobile and desktop layout behavior
```

At minimum, verify one representative page from each currently supported country where public racecourse data exists, plus the Japan/Tokyo reference pages. Confirm that unsupported countries and non-active/unsupported-country racecourses are not exposed as normal public routes/search results.

Visible UI acceptance requires actual browser output at representative desktop/mobile widths. Repository/code inspection alone must not be recorded as visual acceptance.

UI-009 completion must record any discovered data gaps separately from layout/runtime defects. Missing reviewed optional data must stay absent/pending rather than being filled with guessed values.

## Historical racecourse lane

The all-tier master continues collecting active and closed racecourses independent of current Calendar support.

Closed racecourses are not forced into the active-country publication gate. They will receive a later historical publication gate based on reviewed identity/location/operating-history evidence.

This lane is also the foundation for future discontinued/renamed/moved graded-race relationships.

## Completion conditions for UI-008

`UI-008` is complete:

- public Countries exposure is derived from stable Calendar support rather than all canonical countries;
- Japan demonstrates the shared Country composition;
- Tokyo demonstrates the shared Racecourse composition;
- current Calendar-supported countries are projected through the shared Country layout;
- active racecourses in those supported countries are projected through the shared Racecourse layout or explicitly blocked by known data gaps;
- primary Racecourses/search/generated routes use the same active supported-country gate;
- the repeatable future-country package runbook is adopted by `AGENTS.md`, `START-HERE.md`, and governance authority;
- future agents are required to use the integrated publication specification, runbook, and this roadmap before continuing Country/Racecourse expansion.

EN/JA visible responsive/navigation acceptance is intentionally carried by UI-009.

## Agent execution rule

For Country, Racecourse, country-publication, racecourse-publication, or new-country site expansion work, agents must read at work start and re-read at the normal checkpoints:

```text
AGENTS.md
START-HERE.md
docs/governance/document-authority.md
docs/project-roadmap.md
docs/project-roadmap-2026-09-09-addendum.md
docs/specs/country-racecourse-integrated-publication-2026-09-09.md
docs/runbooks/country-racecourse-publication-package.md
docs/specs/map-first-site-ui-2026-09-06.md
docs/racecourses/identity-reconciliation.md
docs/racecourses/public-timetable-connection.md
docs/racecourses/profile-evidence.md
docs/racecourses/page-link-architecture.md
```

Calendar acquisition changes additionally follow all Calendar-specific contracts named by `AGENTS.md` and `START-HERE.md`.

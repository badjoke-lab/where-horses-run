# Where Horses Run project roadmap — 2026-09-09 Country/Racecourse integrated expansion addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-09  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-09-08-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Country/Racecourse publication authority: `docs/specs/country-racecourse-integrated-publication-2026-09-09.md`

## Current product direction

Home and Calendar remain the primary operational surfaces. Countries and Racecourses are expanded together with Calendar coverage rather than as independent broad directories.

The completed historical 98-country publication programme remains evidence of gathered country data; it no longer implies that all 98 countries must remain equally exposed in the primary public Country directory.

## Current UI/product Work IDs

```text
UI-008A — Calendar-supported Country public gate [complete: main a2d8b88802e54f5c67846a165d4f421e76ac44df]
UI-008B — Japan Country reference page [complete: main cf0ff0da47143bd73179403698f8365351ce91e3]
UI-008C — Tokyo Racecourse reference page [complete: main 31be082d2c91c0579d1f33cd18a5b56bd31396ed]
UI-008D — project current Calendar-supported countries and active racecourses into shared layouts [current]
UI-008E — make future country expansion a vertical Calendar + Country + Racecourse + Map package [next]
UI-009  — EN/JA responsive and navigation release verification after the supported set is projected
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

## Current supported-country projection — UI-008D current

UI-008D projects the accepted reference layouts across the stable Calendar-supported set.

Required behavior:

1. all Calendar-supported Country routes use the shared Country hub composition;
2. normal active Racecourse publication is derived from `calendar_supported` plus canonical active/current racecourse status;
3. primary Racecourses directory, normal generated Racecourse routes, global search, Country-hub racecourse lists, and map links all use the same active supported-country gate;
4. closed/historical racecourses remain in the canonical/all-tier master and are not silently deleted;
5. active supported-country racecourses use the shared Racecourse hub composition;
6. reviewed locations are shown where available and unreviewed locations remain explicit/pending rather than guessed;
7. Calendar rows remain the existing public Calendar truth and one meeting per row;
8. EN/JA routing and Country <-> Racecourse <-> Calendar links remain aligned.

The active Racecourse gate is:

```text
racecourse.status in {active, current}
AND
racecourse.country_id is Calendar-supported
```

This gate is stable and does not depend on whether a meeting happens to be visible today.

Implementation target for UI-008D:

```text
Countries listing/routes/search
  -> existing calendar-public-country-support-v1.json gate

Racecourses listing/routes/search/Country-hub links
  -> active supported-country derived gate

Country page
  -> CountryHubPage for every supported country

Racecourse page
  -> RacecourseHubPage for every active racecourse passing the public gate
```

## Future country-expansion package — UI-008E

For each new Calendar country, completion is measured as:

```text
official acquisition source established
+ Calendar public support established
+ Country public eligibility enabled
+ active racecourse inventory reconciled
+ racecourse pages projected
+ reviewed map linkage projected
+ Country/Racecourse/Calendar links projected
+ search/sitemap/internal navigation projected
```

These can be separate PRs but are one product-expansion package.

## Historical racecourse lane

The all-tier master continues collecting active and closed racecourses independent of current Calendar support.

Closed racecourses are not forced into the active-country publication gate. They will receive a later historical publication gate based on reviewed identity/location/operating-history evidence.

This lane is also the foundation for future discontinued/renamed/moved graded-race relationships.

## Completion conditions for this addendum

`UI-008` is not complete until:

- public Countries exposure is derived from stable Calendar support rather than all canonical countries;
- Japan demonstrates the shared Country composition;
- Tokyo demonstrates the shared Racecourse composition;
- current Calendar-supported countries are projected through the shared Country layout;
- active racecourses in those supported countries are projected through the shared Racecourse layout or explicitly blocked by known data gaps;
- primary Racecourses/search/generated routes use the same active supported-country gate;
- EN/JA links and reviewed Map/Calendar connections are consistent;
- future agents use the integrated publication specification and this roadmap before continuing Country/Racecourse expansion.

## Agent execution rule

For Country, Racecourse, country-publication, racecourse-publication, or new-country site expansion work, agents must read at work start and re-read at the normal checkpoints:

```text
AGENTS.md
START-HERE.md
docs/governance/document-authority.md
docs/project-roadmap.md
docs/project-roadmap-2026-09-09-addendum.md
docs/specs/country-racecourse-integrated-publication-2026-09-09.md
docs/specs/map-first-site-ui-2026-09-06.md
docs/racecourses/identity-reconciliation.md
docs/racecourses/public-timetable-connection.md
docs/racecourses/profile-evidence.md
docs/racecourses/page-link-architecture.md
```

Calendar acquisition changes additionally follow all Calendar-specific contracts named by `AGENTS.md` and `START-HERE.md`.

# Where Horses Run project roadmap — 2026-09-09 Country/Racecourse integrated expansion addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-09-09  
Supersedes for current product/UI execution state: `docs/project-roadmap-2026-09-08-addendum.md`  
Base roadmap: `docs/project-roadmap.md`  
Parent UI specification: `docs/specs/map-first-site-ui-2026-09-06.md`  
Country/Racecourse publication authority: `docs/specs/country-racecourse-integrated-publication-2026-09-09.md`

## Current product direction

Home and Calendar remain the primary operational surfaces. Countries and Racecourses are now expanded together with Calendar coverage rather than as independent broad directories.

The completed historical 98-country publication programme remains evidence of gathered country data; it no longer implies that all 98 countries must remain equally exposed in the primary public Country directory.

## Current UI/product Work IDs

```text
UI-008A — define and implement Calendar-supported Country public gate [current]
UI-008B — Japan Country reference page [next]
UI-008C — Tokyo Racecourse reference page [next]
UI-008D — project current Calendar-supported countries and active racecourses into shared layouts
UI-008E — make future country expansion a vertical Calendar + Country + Racecourse + Map package
UI-009  — EN/JA responsive and navigation release verification after the supported set is projected
```

Calendar country/authority acquisition expansion and all-tier racecourse inventory research continue in parallel. They must not be serialized behind UI work unless a real schema/shared-file dependency exists.

## Required public-gating work

Country public eligibility must become a stable Calendar-support state. It must not depend on whether there is a meeting today.

Initial runtime target:

```text
calendar_supported = true
  -> visible in Countries directory
  -> eligible for Country detail route
  -> included in normal search/sitemap/internal links

calendar_supported = false
  -> retained in internal/canonical data
  -> omitted from primary Countries directory
  -> omitted from normal search/sitemap/internal links
  -> normal detail route not generated unless separately authorised
```

The implementation may reuse an existing readiness/coverage registry if it provides a reviewed stable support state. Do not create a second conflicting truth merely to satisfy the UI.

## Reference pages

### Japan Country page

Build the first shared Country layout against existing reviewed Japan data and current Calendar meeting data.

Required baseline:

- identity + Calendar-supported state;
- reviewed overview;
- authority/system, racing types, active racecourse count, official sources;
- today / near-term meetings;
- reviewed racecourse map;
- active domestic racecourse list;
- official-source links;
- Country -> Calendar and Country -> Racecourse links.

The visual design should follow the current Home/Calendar visual language: white surface, navy headings, restrained gold accents, simple cards/tables, existing MapLibre/OpenStreetMap stack, no external organisation logos, no decorative asset dependency.

### Tokyo Racecourse page

Use Tokyo Racecourse as the first shared Racecourse-detail reference.

Required baseline:

- identity and reviewed status/context;
- country/authority/racing type/timezone where reviewed;
- current/next meeting context;
- recent/upcoming meeting rows;
- reviewed map location and location text;
- reviewed course facts;
- representative race names as plain text;
- official sources;
- Racecourse -> Country and Racecourse -> Calendar links.

Do not wait for every future enrichment field before shipping the shared baseline. Add later facts only when reviewed data exists.

## Current supported-country projection

After the two reference pages are accepted:

1. derive the current Calendar-supported country set from canonical/reviewed Calendar support state;
2. apply the public gate to Countries listing/routes/search/sitemap/internal links;
3. render each supported Country with the shared Country composition;
4. reconcile the supported country's active racecourses to canonical `racecourse_id` values;
5. render those active racecourses with the shared Racecourse composition;
6. connect reviewed map locations and Calendar rows;
7. repeat until every currently supported country has the same minimum navigation and data structure.

## Future country-expansion package

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
- current Calendar-supported countries have been projected through those layouts or explicitly queued with known data gaps;
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

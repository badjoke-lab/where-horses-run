# Where Horses Run v1 source policy review

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-SOURCE-POLICY-REVIEW-01`  
Reviewed: 2026-07-18

## Decision

The complete public source registry and every rendered source route have been reviewed against the v1 publication boundary.

Where Horses Run uses official links to help visitors find racing calendars, racecourses, country information, and reviewed public timetable context. The source directory is not a statement that every linked page may be copied, automated, or republished, and it is not a substitute for an official racecard, results service, wagering page, or video service.

## Registry inventory

```text
Source registry files: 26
Source records: 171
Unique source IDs: 171
Countries and regions with sources: 98
Unique hosts: 124
Duplicate URL values: 3
Duplicate source IDs: 0
Invalid URLs: 0
Non-HTTPS URLs: 0
Unknown country IDs: 0
Missing public notes: 0
```

All 171 records are `official` and `link_only`.

The retained source-level automation inventory is:

```text
B: 9
C: 162
```

`auto_level` remains in the registry because existing validation and acquisition code uses it. It is not displayed or included in the public directory search projection.

The URL inventory contains 69 host-root links, 99 deeper official-page links, and 3 official PDF links.

## Public and internal source metadata

The previous registry mixed visitor-facing link information with source-specific operational metadata.

The review removed:

```text
terms_risk: 171 fields
m3_status: 163 fields
m3_notes: 163 fields
Total: 497 fields
```

Seven records with empty notes received neutral official-confirmation notes. IDs and URLs were preserved.

The final public-repository source record contains:

- stable source ID;
- country or region ID;
- official source type;
- official URL;
- link-only data role;
- retained internal `auto_level` used by existing code;
- non-empty public coverage or confirmation note.

Source-specific terms-risk assessments and registry-stage labels are not public data. Their absence is not a safety, permission, reachability, or publication approval claim.

## Sources directory

The English and Japanese directories preserve 171 server-rendered records each and 196 bilingual country-source pages.

The public interface now has 2 controls:

```text
q
country
```

The directory no longer displays, searches, stores in URL parameters, or exposes in HTML attributes:

- automation level;
- terms risk;
- registry status;
- `alpha_link_first`;
- `pending_reachability`;
- `not_recorded` operational fallback values.

Each card shows an official link, country or region link, visitor-facing official-source role, and public note. The complete list remains available without JavaScript.

## Duplicate URL policy

Three official URLs are used by more than one record. This is allowed because one official page may support separate reviewed organiser, calendar, racecourse, or membership roles.

Duplicate URLs do not permit duplicate IDs. Each record must retain a distinct role and public note. The permanent gate rejects duplicate source IDs.

## Publication boundary

Allowed public use:

- official source links;
- high-level country, racecourse, organiser, and calendar confirmation context;
- reviewed timetable information within the existing C, B, B+, A, and A+ display boundaries;
- thin public notes explaining coverage or limitations;
- an official source link for final confirmation.

Not published as Where Horses Run content:

- complete racecards or participant datasets;
- horse, jockey, trainer, draw, weight, or field details;
- odds, popularity, results, payouts, predictions, selections, or betting advice;
- copied official page bodies or raw HTML;
- embedded video;
- direct stream URLs;
- unofficial mirrors or redistributed recordings.

Meeting lists remain one meeting per row. A or A+ race-level information, when allowed, remains limited to meeting-detail pages and never becomes a complete official-product substitute.

## Privacy and automation boundary

The source directory performs client-side filtering over static HTML. It adds no external search service, query logging, cookies, client storage, analytics, or visitor identifiers.

This unit performs no automatic terms inference, source acceptance, translation, publication, or deployment.

## Permanent verification

Directory checker:

```text
scripts/check-source-status-filters.mjs
```

Source policy checker:

```text
scripts/check-v1-source-policy-review.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-source-policy-review.yml
```

The gate validates the complete 26-file registry, builds all 771 pages, validates both source directories and all country-source routes, preserves the frozen v1 scope and QA baselines, rejects internal metadata exposure, removes generated output, and proves the repository remains clean.

## Next implementation unit

```text
V1-KNOWN-LIMITATIONS-01
```

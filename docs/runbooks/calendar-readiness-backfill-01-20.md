# Calendar Readiness backfill 01-20

Status: implementation in progress  
Work ID: `WHR-CAL-BACKFILL-01-20`  
Branch: `calendar-readiness-backfill-01-20`  
PR: #321  
Deployment: not required

## Purpose

Close evidence-based Calendar Readiness decisions for tracker entries 01-20 without claiming that a live adapter, scheduler, candidate generator, or public maintained timetable already exists.

## Evidence boundary

This work reuses public-safe reviewed evidence already in the repository:

- existing timetable source-test summaries;
- reviewed country Profile v2 system splits;
- canonical source and racecourse identifiers;
- the machine-readable Calendar contracts from PR #316.

No raw source bodies, complete programmes, participant data, betting data, result data, credentials, or private publication-risk notes are added.

## Expected result

```text
countries_with_closed_decision: 20
readiness_records:               30
authority_source_records:        31
blocked readiness records:        4
link-only readiness records:      2
implementation_status not_started: 30
```

## System separation

The backfill keeps meaningful systems separate instead of assigning one national capability where evidence is narrower.

- Brazil: Gávea, Cidade Jardim, Cristal, and Sorocaba.
- Japan: JRA, NAR/local-government racing, and Banei Tokachi.
- New Zealand: Thoroughbred and harness racing.
- South Africa: 4Racing and Gold Circle.
- Denmark: national guidance and Klampenborg venue scope.
- Czech Republic: national calendar, Chuchle, and Most venue scope.

## Conservative decisions

- Morocco, Mexico, Oman, and Brazil/Sorocaba remain blocked.
- Japan/NAR and Japan/Banei are completed as link-only treatments for this backfill.
- C-level manual decisions do not claim race times.
- A and A+ technical evidence remains subject to the existing public display ceiling.
- Every implementation status remains `not_started`.

## UAE backfill

The earlier numbered source-test batch did not include a UAE directory. This PR adds a public-safe backfill summary derived only from the reviewed UAE profile and official ERA season schedule. It closes a conservative C-level manual decision for meeting dates and venues, not race times.

## Validation

```text
node scripts/check-calendar-contracts.mjs
node scripts/check-calendar-readiness-backfill-01-20.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-country-page-programme-roadmap.mjs
npm install
npm run build
```

## Completion state

After successful validation and merge:

```text
Current Work ID: WHR-CAL-BACKFILL-21-36
Next Work ID:    WHR-CAL-BACKFILL-37-52
```

# UAE ERA PILOT-05 source-boundary reconciliation and venue mapping approval decision

Status: decision complete; implementation remains separate  
Work ID: `WHR-CAL-UAE-ERA`  
Implementation unit: `UAE-PILOT-05`  
Last reviewed: 2026-07-11

## Purpose

PILOT-04 proved a 64-observation coordinate-grid parser but preserved a source-boundary difference:

```text
article opening date: 2026-10-22
PDF first observation: 2026-10-22

article narrative closing date: 2027-03-27
PDF last observation: 2027-04-15
```

The same evidence chain also left four venue mappings in `proposed_unapproved` state.

PILOT-05 decides both questions without writing any Registry or creating any candidate batch.

## Source-boundary reconciliation

### Article summary evidence

The reviewed official article evidence reports:

```text
total meetings: 64
total racecourses: 5
opening date: 2026-10-22
narrative closing date: 2027-03-27

Meydan: 17
Abu Dhabi: 16
Al Ain: 14
Jebel Ali: 11
Sharjah: 6
```

### PDF coordinate-grid evidence

The reviewed coordinate parser reconstructs:

```text
observation count: 64
first observation date: 2026-10-22
last observation date: 2027-04-15

Meydan: 17
Abu Dhabi: 16
Al Ain: 14
Jebel Ali: 11
Sharjah: 6
```

The total and every venue count match the article summary exactly.

The PDF includes five observations after the article narrative closing date:

```text
2027-04-01 — Abu Dhabi Turf Club
2027-04-02 — Al Ain Racecourse
2027-04-08 — Abu Dhabi Turf Club
2027-04-09 — Al Ain Racecourse
2027-04-15 — Abu Dhabi Turf Club
```

Those five observations are required for the PDF rows to close to the article's 64-meeting and venue-count totals.

## Boundary decision

PILOT-05 therefore decides:

```text
article narrative closing date use:
  not_authoritative_for_exhaustive_fixture_window_boundary

accepted fixture window source:
  official_fixture_pdf_coordinate_grid

accepted fixture window:
  2026-10-22 through 2027-04-15 inclusive
  2027-04-16 exclusive end

coverage state:
  count_closed_reviewed_pdf_fixture_window
```

This decision does not declare the article wrong and does not assign a broader semantic meaning to its closing-date language.

It only decides that `2027-03-27` cannot be used as the exhaustive fixture-window boundary because the official PDF contains five additional observations required to close the same official 64-meeting count structure.

`full_season_semantic_claim` remains false. The accepted claim is limited to the reviewed PDF fixture publication window.

## Venue mapping approval evidence

Each venue mapping is reviewed against four evidence classes:

1. official article label;
2. reachable official ERA venue-page route with expected label;
3. official PDF venue-alias structure;
4. coordinate-grid count closure matching the official article venue counts.

The resulting decision is:

```text
Meydan Racecourse
-> meydan-racecourse
retain_approved_existing

Abu Dhabi Turf Club
-> abu-dhabi-turf-club
approve_mapping

Al Ain Racecourse
-> al-ain-racecourse
approve_mapping

Jebel Ali Racecourse
-> jebel-ali-racecourse
approve_mapping

Sharjah Racecourse
-> sharjah-racecourse
approve_mapping
```

All five mappings are approved for canonical identity registration.

The decision count is:

```text
approved mappings: 5
newly approved mappings: 4
mapping decision complete: true
```

## Approval is not implementation

PILOT-05 is a decision unit only.

The following remain false in this unit:

```text
racecourse registry write
Readiness Registry write
Acquisition Registry write
runner activation
candidate batch creation
automatic candidate expansion
automatic approval
automatic promotion
automatic publication
canonical write
public write
deployment
```

The four mappings move from `proposed_unapproved` to approved decision state, but no repository Registry is changed in this unit.

## Candidate boundary

PILOT-05 does not generate 64 candidates.

The coordinate-grid observations remain evidence and review input. Conversion into review-only C-level candidates requires a separate implementation unit after:

- approved racecourse identities are represented;
- Readiness scope is aligned;
- Acquisition Registry schedule route is represented;
- runner compatibility is explicit;
- no-write and review-state boundaries are revalidated.

## Decision summary

```text
source boundary:
  PDF fixture window accepted as count-closed reviewed window
  2026-10-22 through 2027-04-15 inclusive

article narrative closing date:
  not used as exhaustive fixture-window boundary

venue mappings:
  5 approved total
  4 newly approved

Registry writes:
  false

candidate expansion:
  false

publication effect:
  none
```

## Next unit

```text
UAE-PILOT-06
UAE ERA canonical venue and acquisition profile activation foundation
```

The next unit may implement the approved identities and evidence-backed schedule route, but it must keep automatic execution, approval, promotion, publication, canonical write, and public write disabled.

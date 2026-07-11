# UAE ERA PILOT-04 coordinate-aware PDF calendar grid parser

Status: completed coordinate-grid parser evidence review; source boundary difference requires explicit reconciliation  
Work ID: `WHR-CAL-UAE-ERA`  
Implementation unit: `UAE-PILOT-04`  
Last reviewed: 2026-07-11

## Starting evidence

PILOT-03 proved:

```text
official venue pages:
  all five routes evidence-backed

PDF text extraction:
  plain text extraction succeeds
  layout text extraction succeeds
  all five venue aliases observed

linear normalized date candidates:
  0
```

The extracted PDF structure contains month names, weekday tokens, numeric day tokens, and venue aliases, but linear text order did not establish date-to-venue meeting rows.

## Purpose

PILOT-04 tests whether the official one-page fixture PDF can be interpreted as a calendar grid using coordinates rather than raw text order.

The unit uses two evidence stages:

1. coordinate-only structural observation;
2. coordinate-aware label-based row parsing.

No candidate batch is created in this unit.

## Reviewed run

```text
workflow run: 29142374154
artifact: 8245577585
artifact digest: sha256:139343efe9771fd6a3a41cb15741961632bcddf739ab9ba447b3f8081eeee847
```

Protected-state hash verification passed and the repository worktree remained clean.

## Coordinate evidence

The diagnostic probe emitted coordinates only for public-safe structural tokens:

```text
October
November
December
January
February
March
April
MON through SUN weekday labels
numeric day values 1 through 31
Meydan
Abu Dhabi
Al Ain
Jebel Ali
Sharjah
```

Reviewed coordinate totals:

```text
page count: 1
month tokens: 7
weekday tokens: 212
day tokens: 218
venue anchors: 70
```

The day-token and venue-anchor totals include a right-side summary area. The coordinate-aware parser excludes that summary area by month-column proximity rather than treating every number or venue alias as a meeting row.

The coordinate artifact did not store raw PDF or raw text and did not emit unapproved source text.

## Coordinate-aware parser

The parser pairs:

```text
month column
+ calendar day cell
+ weekday cell
+ venue alias anchor
```

using coordinate proximity.

Before accepting an observation, the parser validates:

- the full calendar-day sequence for each month;
- weekday token count for each month;
- computed weekday against the calendar date;
- venue-anchor to day-row y-distance;
- reviewed five-alias membership;
- duplicate date/venue absence.

The output remains label-based C-level observations. It is not a candidate batch.

## Parser evidence

The coordinate parser produced **64 label-based meeting observations**.

Month closure:

```text
2026-10: 4
2026-11: 11
2026-12: 10
2027-01: 13
2027-02: 11
2027-03: 10
2027-04: 5
TOTAL: 64
```

Venue closure:

```text
Meydan: 17
Abu Dhabi: 16
Al Ain: 14
Jebel Ali: 11
Sharjah: 6
TOTAL: 64
```

The venue totals match the official article count structure already reviewed in PILOT-02.

Coordinate pairing evidence:

```text
max day/venue y delta: 0.525
weekday calendar validation: pass
duplicate date/venue observations: 0
```

Date/venue pairing is evidence-backed at the label-observation layer.

## Mapping boundary

Current mapping state remains:

```text
Meydan Racecourse:
  accepted_existing
  canonical id: meydan-racecourse
  parsed observations: 17

Abu Dhabi Turf Club:
  proposed_unapproved

Al Ain Racecourse:
  proposed_unapproved

Jebel Ali Racecourse:
  proposed_unapproved

Sharjah Racecourse:
  proposed_unapproved
```

Parsed mapping-state totals:

```text
accepted_existing observations: 17
proposed_unapproved observations: 47
candidate generation scope: meydan_only
mapping approval remains false
```

A coordinate parser success does not approve the four proposed mappings.

## Source boundary difference

The article and PDF agree on the opening boundary:

```text
article opening date: 2026-10-22
PDF first observation date: 2026-10-22
opening match: true
```

The closing boundary differs:

```text
article narrative closing date: 2027-03-27
PDF last observation date: 2027-04-15
source boundary difference requires explicit reconciliation
```

The PDF parser observed five dates after the article narrative closing date:

```text
2027-04-01
2027-04-02
2027-04-08
2027-04-09
2027-04-15
```

Those five observations are required for the PDF venue counts to close exactly to the same 64-meeting and 17/16/14/11/6 venue totals reported by the article.

PILOT-04 does not silently choose one source boundary over the other. The difference remains explicit for the next decision unit.

## Decision

PILOT-04 accepts:

```text
coordinate parser:
  evidence-backed 64 label-based meeting observations

month count closure:
  pass

venue count closure:
  pass; matches official article venue counts

weekday coordinate validation:
  pass

date/venue pairing:
  evidence-backed
```

PILOT-04 does not accept:

```text
mapping approval
broader candidate generation
Registry activation
season-completeness claim across conflicting source boundaries
```

## Safety boundary

PILOT-04 keeps disabled:

```text
candidate batch creation
automatic canonical ID creation
automatic candidate expansion
mapping approval
racecourse registry write
Readiness Registry write
Acquisition Registry write
automatic approval
automatic promotion
automatic publication
canonical write
public write
deployment
```

The coordinate diagnostic and parser evidence workflows remain review-artifact-only.

## Next unit

```text
UAE-PILOT-05
UAE ERA source-boundary reconciliation and venue mapping approval decision
```

The next unit must:

1. reconcile the article narrative closing date with the PDF's five April observations;
2. review whether official venue pages plus article/PDF identity evidence are sufficient to approve the four proposed canonical mappings;
3. keep any Registry writes or broader candidate generation as a separate implementation decision;
4. preserve the current C-level public boundary and all no-write protections.

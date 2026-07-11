# UAE ERA PILOT-04 coordinate-aware PDF calendar grid parser

Status: coordinate evidence and parser development  
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

The extracted PDF structure contains month names, weekday tokens, numeric day tokens, and venue aliases, but linear text order does not establish date-to-venue meeting rows.

## Purpose

PILOT-04 tests whether the official one-page fixture PDF can be interpreted as a calendar grid using coordinates rather than raw text order.

The unit is divided into two evidence stages:

1. coordinate-only structural observation;
2. coordinate-aware label-based row parser.

No candidate generation is allowed until the second stage proves count and coverage closure.

## Coordinate-only evidence boundary

The diagnostic probe may emit coordinates only for public-safe structural tokens:

```text
October through March month names
MON through SUN weekday labels
numeric day values 1 through 31
Meydan
Abu Dhabi
Al Ain
Jebel Ali
Sharjah
```

The coordinate summary may contain:

- page dimensions;
- token value;
- token kind;
- token rectangle coordinates;
- drawing-cluster rectangles;
- aggregate token counts.

It must not emit:

- raw page text;
- unapproved source text;
- raw PDF bytes;
- participant data;
- betting data;
- result data;
- payout data;
- prediction data;
- direct stream information.

## Parser target

The coordinate-aware parser must pair:

```text
season month context
+ calendar day cell
+ venue alias anchor
```

into label-based reviewed observations such as:

```text
date: YYYY-MM-DD
venue_label: Meydan
mapping_state: accepted_existing
```

or:

```text
date: YYYY-MM-DD
venue_label: Abu Dhabi
mapping_state: proposed_unapproved
```

The first parser output must remain label-based. It must not promote the four proposed IDs into approved canonical mappings.

## Closure conditions

Before broader season candidate generation can be considered, the parser must prove:

1. every emitted date is inside the reviewed 2026-10 through 2027-03 season window;
2. every emitted venue label belongs to the reviewed five-label set;
3. no duplicate date/venue observation is silently created;
4. parser count can be compared with the official 64-meeting season summary;
5. per-venue counts can be compared with the reviewed article counts:
   - Meydan 17;
   - Abu Dhabi 16;
   - Al Ain 14;
   - Jebel Ali 11;
   - Sharjah 6;
6. unresolved or ambiguous cells remain explicit;
7. raw source content remains unpersisted.

## Mapping boundary

Current mapping state remains:

```text
Meydan Racecourse:
  accepted_existing
  canonical id: meydan-racecourse

Abu Dhabi Turf Club:
  proposed_unapproved

Al Ain Racecourse:
  proposed_unapproved

Jebel Ali Racecourse:
  proposed_unapproved

Sharjah Racecourse:
  proposed_unapproved
```

A coordinate parser success does not approve those four mappings.

## Safety boundary

PILOT-04 keeps disabled:

```text
automatic canonical ID creation
automatic candidate expansion
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

The coordinate diagnostic and parser evidence workflows are review-artifact-only.

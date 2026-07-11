# UAE ERA PILOT-03 venue mapping and PDF extraction evidence

Status: implementation and bounded live evidence  
Work ID: `WHR-CAL-UAE-ERA`  
Implementation unit: `UAE-PILOT-03`  
Last reviewed: 2026-07-11

## Purpose

PILOT-02 established two different facts:

```text
official article HTML route:
  evidence-backed C-level partial schedule route

official fixture PDF route:
  reachable secondary source
  PDF parsing not yet evidence-backed
```

PILOT-03 keeps venue mapping review and PDF text extraction evidence separate.

The unit must not convert official venue labels into canonical IDs automatically and must not broaden candidate generation merely because the PDF is reachable.

## Venue mapping audit

The five official ERA labels are reviewed as a fixed set:

```text
Meydan Racecourse
Abu Dhabi Turf Club
Al Ain Racecourse
Jebel Ali Racecourse
Sharjah Racecourse
```

Each venue record contains:

- official article label;
- official ERA page label;
- official ERA page slug;
- official page URL;
- existing trusted canonical ID, when one already exists in the accepted pilot boundary;
- proposed canonical ID;
- mapping status;
- candidate-generation permission;
- activation effect.

## Mapping states

Two states are used.

### accepted_existing

Only the previously trusted PILOT-01 mapping is accepted:

```text
Meydan Racecourse
-> meydan-racecourse
```

This does not create a new racecourse record and does not expand any Registry.

### proposed_unapproved

The other four official labels receive stable proposed IDs only for review bookkeeping:

```text
Abu Dhabi Turf Club -> abu-dhabi-turf-club
Al Ain Racecourse -> al-ain-racecourse
Jebel Ali Racecourse -> jebel-ali-racecourse
Sharjah Racecourse -> sharjah-racecourse
```

These are `proposed_unapproved` values.

A proposed ID is not an approved mapping.

Therefore:

```text
candidate_generation_allowed: false
activation_effect: none
```

for all four proposed mappings.

The accepted candidate scope remains:

```text
meydan_only
```

and broader candidate generation remains blocked pending explicit mapping approval.

## PDF extraction boundary

PILOT-03 adds public-safe in-memory PDF text extraction.

The probe:

1. downloads the official fixture PDF into memory;
2. verifies HTTP success, final host, content type context, byte count, and PDF magic;
3. passes the byte buffer directly to `PdfReader(BytesIO(payload))`;
4. extracts page text only in memory;
5. normalizes text only in memory;
6. emits aggregate structure summary only.

The raw PDF is not stored.

The raw extracted text is not stored.

The summary may contain only:

- page count;
- response byte count;
- extracted text character count;
- normalized-text SHA-256;
- per-page text character counts;
- occurrence counts for the five reviewed venue labels;
- normalized public-safe date candidates;
- date candidate count;
- whether the reviewed season opening and closing boundary dates are observed;
- explicit raw-storage false markers.

The extracted source text itself is never emitted.

## Live evidence interpretation

A successful PDF probe proves only that:

- the official PDF route is reachable;
- a valid PDF byte stream is observed;
- text extraction produces structure usable for further review;
- public-safe dates and venue-label occurrence evidence can be summarized without raw-source persistence.

It does not automatically prove:

- complete 64-meeting extraction;
- correct date-to-venue pairing for every meeting;
- approved canonical mapping for all five venues;
- Registry activation;
- automated recurring acquisition;
- candidate approval or promotion;
- canonical or public write safety.

## Decision boundary

PILOT-03 may accept one or both of the following evidence claims:

```text
venue mapping audit:
  one accepted existing mapping
  four proposed unapproved mappings

PDF text extraction:
  evidence-backed structure extraction
  raw storage disabled
```

Even when PDF extraction succeeds, broader candidate generation remains blocked until explicit mapping approval and row-level date-to-venue extraction evidence exist.

## Safety boundary

PILOT-03 keeps all of the following disabled:

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

The source probe must not retain raw PDF bytes or raw extracted text in repository files or workflow artifacts.

## Expected handoff

After reviewed live evidence, the next decision must determine whether:

1. PDF text extraction is structurally sufficient for a dedicated row parser;
2. date candidate coverage is consistent with the 64-meeting season summary;
3. all five official venue labels are observable in extracted PDF text;
4. the four proposed IDs should remain unapproved or proceed to a separate explicit canonical mapping approval unit;
5. a broader season-calendar parser can be attempted without changing the current C-level public boundary.

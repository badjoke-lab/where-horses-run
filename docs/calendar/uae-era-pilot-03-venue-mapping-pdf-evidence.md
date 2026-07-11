# UAE ERA PILOT-03 venue mapping and PDF extraction evidence

Status: completed bounded live evidence review; mapping expansion and date-to-venue pairing remain blocked  
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

and broader candidate generation remains blocked pending explicit mapping approval and date-to-venue pairing evidence.

## Official venue-page evidence

Reviewed workflow run:

```text
workflow run: 29141771555
artifact: 8245387666
artifact digest: sha256:cf32b5bf6015dd6d30543239a13a402b43db37f3c18f8e2157180525fae00ed3
```

All five official ERA venue-page routes returned HTTP 200, stayed on `emiratesracing.com`, and exposed their expected page labels.

Observed response sizes:

```text
meydan: 100135 bytes
abu-dhabi-turf-club: 116713 bytes
al-ain: 111565 bytes
jebel-ali: 96207 bytes
sharjah: 98849 bytes
```

No raw HTML was stored.

This proves route reachability and label identity. It does not approve four new canonical IDs.

## PDF extraction boundary

PILOT-03 adds public-safe in-memory PDF text extraction.

The probe:

1. downloads the official fixture PDF into memory;
2. verifies HTTP success, final host, content type context, byte count, and PDF magic;
3. passes the byte buffer directly to `PdfReader(BytesIO(payload))`;
4. performs plain text extraction and layout text extraction in memory;
5. normalizes text only in memory;
6. emits aggregate structure summary only.

The raw PDF is not stored.

The raw extracted text is not stored.

The extracted source text itself is never emitted.

## Reviewed PDF structure evidence

The official fixture PDF route produced:

```text
HTTP status: 200
content type: application/pdf
response bytes: 161107
PDF magic: true
page count: 1
plain extracted text chars: 2118
layout extraction available: true
layout extracted text chars: 5427
plain non-empty lines: 33
layout non-empty lines: 33
```

Plain and layout extraction hashes were recorded without emitting source text:

```text
plain SHA-256: f83e9bd8ad66605589eddb15e737503ac1e27863c73f472ec311a3a6b6ff898b
layout SHA-256: dd44cea69767bf9816e73bd832f1bb31896e034b0b1db2669edb081113a6d6a1
```

All five venue aliases were observed.

Combined plain + layout alias occurrence counts:

```text
Meydan: 38
Abu Dhabi: 34
Al Ain: 30
Jebel Ali: 24
Sharjah: 14
```

The full article labels were not present as exact extracted strings, so the evidence claim is based on the official venue aliases, not fabricated full-label reconstruction.

## Calendar-grid evidence

The extracted structure contains:

- October through March month tokens;
- weekday tokens;
- numeric day tokens across 1 through 31;
- all five official venue aliases.

However:

```text
normalized date candidates: 0
opening 2026-10-22 observed as normalized candidate: false
closing 2027-03-27 observed as normalized candidate: false
```

This means text extraction itself is evidence-backed, but linear text parsing does not establish date-to-venue meeting rows.

The current evidence is consistent with a one-page calendar grid whose meaning depends on spatial relationships between month/day cells and venue labels. Therefore a coordinate-aware parser is required before row-level meeting claims can be made.

## Decision

PILOT-03 accepts:

```text
official venue page routes:
  evidence-backed

PDF route:
  evidence-backed in-memory plain/layout structure extraction

PDF venue aliases:
  all five observed

mapping state:
  one accepted existing mapping
  four proposed unapproved mappings
```

PILOT-03 does not accept:

```text
date-to-venue pairing
complete 64-meeting row extraction
four proposed canonical mappings
broader candidate generation
Registry activation
automatic recurring acquisition
```

The candidate scope remains `meydan_only`.

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

The source probes did not retain raw PDF bytes, raw extracted text, or raw HTML in repository files or workflow artifacts.

Protected-state hash verification passed and the repository worktree remained clean after the reviewed run.

## Next unit

```text
UAE-PILOT-04
UAE ERA coordinate-aware PDF calendar grid parser evidence
```

The next unit must use in-memory text coordinates or layout blocks to pair:

```text
season month context
+ calendar day cell
+ venue alias
```

without persisting raw PDF or raw extracted text.

The expected output is label-based reviewed observations only. A successful parser must prove count and coverage closure before any broader canonical mapping approval or candidate generation is considered.

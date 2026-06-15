# Country page notes

Status: public-safe editorial source material

This directory stores structured research notes for future Where Horses
Run country detail pages.

These files are not finished country-page copy. They preserve facts,
observations, limitations and research gaps discovered while testing
official racing calendars, programmes and public information channels.

## Separation of responsibilities

The three layers have different purposes.

- `docs/timetable-source-tests/` records whether timetable fields can be
  obtained and what technical capability rank is supported.
- `docs/country-page-notes/` records reusable country-page facts and
  cautions learned during those investigations.
- `/countries/[slug]/` and `/ja/countries/[slug]/` contain the final
  reader-facing country pages.

Country-page notes must not be treated as finished editorial copy.

## Evidence labels

Every substantive claim must use one of these labels.

### VERIFIED

Directly supported by an official source or by an already reviewed
source-test result.

A VERIFIED statement may be used as a basis for page copy, subject to a
freshness check when the final page is written.

### OBSERVED

Directly seen in one or more tested samples, but not safe to generalise
to all meetings, all seasons or the whole country.

Example:

- one tested meeting contained six races

This must not be rewritten as:

- meetings in this country normally contain six races

### INFERRED

A reasonable interpretation supported by several observations, but not
directly stated by an authoritative source.

INFERRED material requires confirmation before publication as fact.

### NEEDS_RESEARCH

A question or topic that must be investigated when the final country
page is prepared.

Typical examples include:

- racing history
- major races
- annual meeting totals
- attendance
- breeding industry
- cultural significance
- current regulatory structure

## Public-safe boundary

Country-page notes may contain:

- governing or organising bodies
- observed racecourses
- observed racing codes
- confirmed season dates
- public information channels
- programme and racecard formats
- source migrations or inactive websites
- tested meeting counts
- technical source limitations
- revalidation requirements
- references to public-safe source-test documents

Country-page notes must not contain:

- raw HTML
- full racecard text
- horse or runner names
- jockey names
- trainer names
- owner names
- weights
- ratings or form
- odds
- betting suggestions
- results
- payouts
- predictions or tips
- direct stream URLs
- embedded video
- non-public research notes

## Writing rules

1. Separate the organiser from the public distributor.
2. Separate current sources from historical or inactive sources.
3. Do not interpret an unreachable website as proof that racing stopped.
4. Do not generalise from a single tested meeting.
5. Do not describe an unofficial distributor as an official governing
   body or race club.
6. Record the evidence cutoff and revalidation trigger.
7. Keep source capability rank separate from the wider description of
   racing in the country.
8. Use neutral descriptions of limitations.
9. Mark all uncertain material as INFERRED or NEEDS_RESEARCH.
10. Keep raw evidence in its approved local-only location.

## File naming

Country note files use the same initial sequence as the timetable source
tests.

    01-uae.md
    02-south-korea.md
    03-turkey.md
    ...
    12-zimbabwe.md

## Initial batch

The first batch covers:

1. UAE
2. South Korea
3. Turkey
4. Morocco
5. Chile
6. Peru
7. Mexico
8. Brazil
9. Bahrain
10. Qatar
11. Oman
12. Zimbabwe

## Workflow

1. Create the framework and index.
2. Create notes for countries 01-04.
3. Create notes for countries 05-08.
4. Create notes for countries 09-12.
5. Run a cross-country consistency review.
6. Use the reviewed notes when the final country pages are written.
7. Perform fresh research for all NEEDS_RESEARCH items before
   publication.

## Completion criteria for one country note

A country note is complete for this stage when:

- VERIFIED and OBSERVED claims are separated
- no single meeting is presented as a permanent national pattern
- organisers and information distributors are distinguished
- current and inactive sources are distinguished
- known seasonality is bounded by an evidence date
- public information channels are recorded
- limitations and unsafe claims are explicit
- fresh research tasks are listed
- source-test references are included
- prohibited racing data is absent

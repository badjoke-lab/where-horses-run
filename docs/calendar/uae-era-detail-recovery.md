# UAE ERA detail recovery

Status: implementation unit complete; shared retry integration pending  
Work ID: `WHR-CAL-UAE-ERA-DETAIL-RECOVERY`  
Completed implementation unit: `UAE-DETAIL-RECOVERY-01`

## Why this work was reopened

The previous UAE handoff closed the source-specific pilot at C-level meeting date and racecourse identity only. That closure did not mean that ERA lacked public timetable detail. The official ERA racecard pages expose meeting identity, race number, post time, distance, surface, and, where present, race name.

Treating the UAE pilot as generally complete was therefore incorrect. The C-level handoff remains historical evidence for the season-calendar route, but it no longer defines the endpoint of UAE development.

## Official detail route

The bounded public route is:

```text
https://emiratesracing.com/racecard/{date}/{race_number}/declarations
```

Equivalent official tabs may exist for entries and results, but the first recovery unit uses the declarations route because the public meeting header and race timing fields remain visible without retaining participant, betting, result, payout, or raw-source data.

## Implemented recovery foundation

- official-host and route-shape validation;
- meeting date, racecourse, race number, post time, distance, surface, and optional race-name extraction;
- continuous Race 1-N discovery from official race navigation;
- C/B/B+/A/A+ classification using the shared timetable rank model;
- A-level public ceiling for UAE under the internal publication-risk boundary;
- bounded live collector with in-memory response handling only;
- registered `era-racecard-public-timetable` detail source and `uae-era-racecard-detail-artifact-v1` adapter;
- separate Calendar Readiness records for the C-level season schedule and A-level racecard detail route;
- deterministic Operations status and review-package reconciliation;
- no raw HTML retention;
- no canonical or public write;
- human review remains required.

## Accepted live evidence

The dedicated read-only workflow checked the official historical meeting:

```text
Date: 2026-04-10
Racecourse: Al Ain
Races: 10
First race: 17:00
Last race: 21:30
Observed rank: A
```

Evidence references:

- workflow run: `29199123357`;
- artifact: `8261852673`;
- artifact digest: `sha256:7c6cc386a8092d86b2d603fdea3aa9b890558c89b5f8bfb798af69ae1f9dc379`;
- source errors: 0;
- canonical/public writes: none.

This proves that the ERA source can support A-level timetable data. It does not fabricate future details for the 2026-2027 season before ERA publishes the corresponding racecards.

## Current registered state

```text
Schedule route:
  source: era-season-calendar
  rank: C
  fields: meeting date + approved racecourse identity

Detail route:
  source: era-racecard-public-timetable
  adapter: uae-era-racecard-detail-artifact-v1
  technical rank: A
  public ceiling: A
  fields: Race 1-N post times + distance + surface
```

The historical 64-meeting, five-venue season schedule remains intact. The A-level detail capability is represented by a separate Readiness record, so existing schedule records and source aliases continue to resolve correctly.

## Correct future behavior

A future UAE meeting remains C while only the season-calendar date and venue are public. Once its ERA racecard pages become visible, the detail route can produce reviewed A-level timetable evidence from the fields actually available.

The remaining implementation unit is:

```text
UAE-DETAIL-RECOVERY-02
```

It must connect the registered detail route to shared near-meeting retry ownership and reviewed C-to-A promotion. Automatic approval, canonical/public writing, and unattended publication remain disabled.

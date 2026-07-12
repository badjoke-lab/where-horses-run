# UAE ERA detail recovery

Status: active corrective implementation  
Work ID: `WHR-CAL-UAE-ERA-DETAIL-RECOVERY`  
Implementation unit: `UAE-DETAIL-RECOVERY-01`

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
- no raw HTML retention;
- no canonical or public write;
- human review remains required.

## Live evidence target

The dedicated read-only workflow checks the official historical meeting:

```text
Date: 2026-04-10
Racecourse: Al Ain
Expected races: 10
Expected first time: 17:00
Expected last time: 21:30
Expected minimum rank: A
```

This proves that the ERA source can support A-level timetable data. It does not fabricate future details for the 2026-2027 season before ERA publishes the corresponding racecards.

## Correct future behavior

A future UAE meeting remains C while only the season-calendar date and venue are public. Once its ERA racecard pages become visible, the detail route must re-check that meeting and produce B, B+, A, or A+ evidence according to the fields actually available.

The next unit after live evidence acceptance is:

```text
UAE-DETAIL-RECOVERY-02
```

That unit must register the detail source and adapter in Calendar Acquisition, add near-meeting retry ownership, and promote reviewed UAE records from C to the best available rank without enabling unattended publication.

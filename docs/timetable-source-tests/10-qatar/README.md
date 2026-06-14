# Qatar timetable source test

## Result

- Status: Complete
- Technical capability: A+
- Initial public display ceiling: A
- Tested scope: 3 meetings / 22 races

The Qatar Racing and Equestrian Club official race calendar
was tested using three dated meeting samples.

- 2026-01-21: 7 races, 15:00–18:30
- 2026-02-07: 7 races, 14:30–18:00
- 2026-04-04: 8 races, 16:30–20:35

## Confirmed fields

Across all 22 tested races:

- race identity: 22/22
- race sequence: 22/22, derived from the
  official ordered races array
- post time: 22/22
- race name: 22/22
- distance: 22/22

The payload did not expose a separate explicit race-number field.
Race 1..N can be derived from the stable official array order.

Surface and course labels were not counted because they were not
established consistently across every tested race. They are not
required for the A+ determination because race names and distances
already provide additional programme fields beyond rank A.

## Publication boundary

Only meeting and race-programme capability is summarized publicly.
Raw JSON, client configuration, participant records, weights,
results, betting information and payout information are not
published.

The technical source capability is A+. The initial public display
ceiling remains A.

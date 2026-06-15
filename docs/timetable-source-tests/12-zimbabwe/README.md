# Zimbabwe timetable source test

## Result

- Status: Complete
- Technical capability: C
- Fallback capability: C
- Tested meeting: 2026-06-17
- Racecourse: Borrowdale Park
- Tested races: 6

Zimbabwe is confirmed at technical rank C.

The Mashonaland Turf Club race card distributed through Zimracing
confirms the meeting date and Borrowdale Park racecourse.

The card also contains Race 1 through Race 6 and a distance for each
race. These extra programme fields do not raise the technical rank
because official per-race post times were not present in the reviewed
front pages or race-page headers.

## Confirmed fields

- meeting date
- racecourse
- Race 1 through Race 6
- per-race distance

## Confirmed race distances

| Race | Distance |
| ---: | ---: |
| 1 | 1100 m |
| 2 | 1200 m |
| 3 | 1600 m |
| 4 | 1700 m |
| 5 | 2200 m |
| 6 | 1260 m |

## Unconfirmed fields

- first race post time
- last race post time
- per-race scheduled post times

Candidate clock values found by automatic text extraction were rejected
because they did not form a valid increasing race-time sequence and
included historical form data rather than meeting post times.

## Source model

The former Mashonaland Turf Club website domain was not reachable
during testing.

The current race card was publicly distributed through Zimracing.
The PDF itself identifies Mashonaland Turf Club and contains the
official meeting material.

## Rank decision

Rank C is supported because the meeting date and racecourse pairing are
available from the race card.

Ranks B, B+, A and A+ are not supported because no reliable official
scheduled post times were confirmed.

## Publication boundary

The following remain local-only and must not be committed:

- raw race card PDF
- extracted full text
- coordinate or geometry extraction
- visual-review images
- horse, jockey, trainer or owner information
- weights, ratings and form
- odds and betting information
- results and payouts

Local evidence remains under:

    .whr-local-source-tests/12-zimbabwe/

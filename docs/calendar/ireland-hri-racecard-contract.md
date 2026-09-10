# Ireland HRI racecard completion contract

The Ireland Calendar route is a two-source Best Available acquisition path:

1. `hri-fixtures` discovers official meeting date and venue from Horse Racing Ireland's fixture publication.
2. `hri-racecards-month` evaluates the official HRI Racecards monthly feed for richer race-time evidence.

The route's registered technical capability is `A`.

For each discovered meeting:

- complete published race-time rows produce evidence-derived `A`;
- a racecard meeting with no published race rows remains at the lower verified rank with `detail_observation.status = not_published`;
- a monthly racecard retrieval/parser failure keeps the lower verified rank with `detail_observation.status = source_error`;
- absence of A+ metadata never authorizes A+ inference.

The regular unified full and near-date refresh schedules re-evaluate the monthly racecard route. A valid lower-rank observation is therefore not treated as acquisition-complete merely because the fixture collector succeeded.

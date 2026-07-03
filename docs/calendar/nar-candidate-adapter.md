# NAR route-probe candidate adapter

Status: complete  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Completed: 2026-07-03  
Next phase: complete-meeting fixture

## Result

The adapter converts the reviewed Urawa and Funabashi route-probe fixture into two review records.

These records prove that the approved six-field A+ shape can be normalized consistently. They do not prove complete meeting coverage.

Every output record therefore has:

- `evidence_scope: single_race_route_probe`;
- `meeting_completeness: not_established`;
- `promotion_eligible: false`;
- `review_status: needs_review`.

## Files

- input: `data/fixtures/timetable/nar/route-probe-v1.json`
- adapter: `scripts/timetable/build-nar-route-probe-candidates.mjs`
- output: `data/candidates/nar-route-probe-candidates.json`
- audit: `data/audits/nar-candidate-adapter-v1.json`

## Boundary

The adapter writes only the dedicated candidate evidence file. It does not write canonical meetings, public projections, production runtime files, or scheduled jobs.

The six allowed row fields are race label, scheduled post time, race name, distance, surface, and course label.

## Next phase

Capture at least one reviewed complete meeting fixture for each pilot venue. Only complete and continuous meeting evidence may enter the normal promotion review path.

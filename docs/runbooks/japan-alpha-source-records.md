# Japan alpha source records

Status: M3 alpha source-record candidate.

## Source

- `japan-jra-home`
- Japan / JRA official source record
- Official source link only
- Link-first / dry-run mode
- Live fetching disabled
- Official JRA source remains the confirmation point

## Boundary

Japan is added as an alpha source-record candidate only. This PR does not add parser work, live fetching, generated timetable data, racecard or entry content, odds, results, payouts, prediction content, or tip content. It does not store raw HTML or response bodies.

## Validation

- `npm run validate:m3-japan-alpha-source` verifies the Japan country, source record, FetchStatus, link-first / dry-run notes, no-republication boundary, and live-fetching-disabled message.
- `npm run check` includes the Japan alpha source validator.

## Next safe work

- Add generated coverage fallback visibility in the next PR if needed.
- Review whether Japan should stay as one JRA-only source or later split into JRA / NAR / Banei source records.
- Keep official links as the confirmation point until a separate source-specific review approves any live fetching.

## Acceptance

- Source record is M3 alpha link-first.
- FetchStatus is skipped.
- Live fetching remains disabled.
- No parser work or generated timetable data is introduced.
- Validator is included in the project check script.

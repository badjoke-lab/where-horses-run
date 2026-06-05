# v0 live/replay broadcast audit completion note

This note records that the v0 live/replay broadcast coverage audit is complete for future UI planning. It is documentation only. It does not implement a UI, change page rendering, add runtime fetching, or alter the live/replay JSON dataset.

## Completion state

- Dataset audited: `data/static/live-broadcast-coverage.json`.
- Total records: **36**.
- Records with `not_verified` in `live_status` or `replay_status`: **0**.
- The audit is ready to be used as input for future UI work, subject to the display and safety rules below.

## v0 audit scope

The v0 audit covers whether each static jurisdiction or racing-system record has a conservative official live and replay source status suitable for link-first public display planning. The audit is limited to live/replay broadcast availability evidence and neutral provider metadata.

Out of scope for this completion note and for the v0 audit:

- UI implementation or component wiring.
- Runtime fetching of video, schedules, or live state.
- Calendar research, race dates, post times, racecards, odds, entries, results, payouts, predictions, or tips.
- Any claim that the public product has complete live coverage.

## Public-safety rules for future UI

Future UI should treat this audit as a conservative source-link inventory, not as a guarantee that live video or replays are currently available to every user.

- **Official-source-only rule:** show links only to official authorities, racecourses, broadcasters, official partners, or official/official-partner social pages used for racing video.
- **No video embed / no stream URL rule:** do not embed video, mirror video, republish video, or link directly to media files, stream manifests, playlist URLs, unofficial restreams, scraper mirrors, or pirate streams.
- **No complete-coverage public claim:** do not describe the app, country pages, or record set as complete live coverage. Availability can vary by location, account state, race day, broadcast rights, and provider policy.
- Use neutral labels for account, paid-TV, geographic, event-only, archive-only, and none-found cases.

## Country and racing-system caveats

The v0 records are not always one record per sovereign country. Some racing jurisdictions must remain split by racing system, source surface, or public rights context.

- Japan must remain split into **JRA**, **NAR**, and **banei** records. JRA central racing, NAR local-government racing, and banei racing have different official coverage surfaces and racing types. Future UI should not apply JRA links to NAR or banei pages, should not apply NAR or banei links to JRA pages, and should keep Obihiro/banei handling separate.
- Singapore must retain the domestic-racing-ended caveat. Domestic Singapore Turf Club racing ended after the final 2024 meeting, while the Singapore record reflects conservative account/subscription streaming evidence for selected horse-racing meetings or races rather than verified active domestic Singapore replay coverage.
- Country-level grouping should not hide racing-system caveats, racecourse-specific limitations, account requirements, paid-TV requirements, geographic restrictions, or event-only availability.

## Future expansion guidance

Future expansion should add new jurisdictions conservatively. A new record should be added only when an official or clearly official-partner source can be identified, reviewed, and represented without direct stream URLs, video embeds, betting-data content, or complete-coverage claims.

Recommended expansion workflow:

1. Add only official-source evidence URLs.
2. Use conservative statuses when live or replay availability is limited, account-gated, paid-TV-gated, event-only, archived-only, geographically restricted, or not found.
3. Keep country/racing-system splits when a single country has materially different official racing systems or broadcast surfaces.
4. Document caveats in neutral language suitable for public UI.
5. Avoid adding calendar, race-date, post-time, racecard, odds, entries, results, payouts, prediction, or tip content as part of live/replay expansion.

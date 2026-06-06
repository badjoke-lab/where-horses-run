# v0 live/replay broadcast audit completion note

This note records that the v0 live/replay broadcast coverage audit is complete for future UI planning. It is documentation only. It does not implement a UI, change page rendering, add runtime fetching, or alter runtime behavior.

## Completion state

- Dataset audited: `data/static/live-broadcast-coverage.json`.
- Total records: **57**.
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
- India must not be treated as nationally covered by one turf club. The current India additions are limited to RWITC Mumbai/Pune evidence and Bangalore Turf Club evidence.
- Italy is represented through MASAF-linked Grande Ippica Italiana/EQU TV evidence for Italian gallop, jump, and trotting programming; future UI must still link only to landing pages and must not expose direct stream/media URLs.
- Germany must remain split between the Deutscher Galopp thoroughbred/gallop record and the WETTSTAR trotting record, because the audited official/official-partner surfaces are racing-code specific.
- Spain must remain split between the Las Carreras thoroughbred circuit, Hipódromo de la Zarzuela racecourse-specific replay evidence, and Federación Balear de Trot trotting evidence. Zarzuela and Balearic trotting evidence must not be presented as complete Spain-wide coverage.
- Belgium must not be treated as nationally covered by the Hippodrome de Wallonie Mons replay evidence. The current Belgium addition is limited to Mons racecourse trot/galop replay evidence, with no official live landing page verified.
- The Netherlands must not be treated as nationally covered by Victoria Park Wolvega. The current Netherlands addition is limited to Wolvega harness-racing live/replay evidence and must not be applied to Duindigt, grass-track, or other Dutch racing surfaces.
- Switzerland must remain split between Suisse Trot replay evidence and White Turf St. Moritz event-only live plus race-film archive evidence. Neither record verifies complete national Swiss live or replay coverage; White Turf remains event-only and Suisse Trot is replay-focused.
- Norway is represented through the shared Rikstoto Direkte/Rikstoto Play broadcast surface for trotting and gallop; the record carries a paid-TV/account-uncertain caveat and must not be presented as a separate free-access claim for either Norwegian harness or Øvrevoll gallop.
- Finland is represented only for trotting/harness through Suomen Hippos and Veikkaus TotoTV evidence. It requires a Veikkaus game-account login for the primary web access path and does not verify any Finnish thoroughbred source.
- Poland is represented through Tor Służewiec/Służewiec iTV official racecourse-network evidence and PKWK authority context. The Służewiec iTV record must not be treated as complete Poland-wide coverage or as proof that every Polish racing venue has its own official live/replay source.
- Malaysia must remain conservative because no official race live-stream or race replay landing page was confirmed during this pass.
- The Philippines must not be treated as nationally covered by Metro Manila Turf Club evidence. The current Philippines addition is limited to MMTCI official live-racing evidence, with no official replay landing page confirmed.
- Singapore must retain the domestic-racing-ended caveat. Domestic Singapore Turf Club racing ended after the final 2024 meeting, while the Singapore record reflects conservative account/subscription streaming evidence for selected horse-racing meetings or races rather than verified active domestic Singapore replay coverage.
- Macau must retain the inactive-racing caveat. Official Macao SAR Government evidence states the horse-racing concession terminated on 1 April 2024 and horse-racing activities ceased from that date; the Macau record must not be displayed as active live coverage, and no official replay landing page was verified.
- Country-level grouping should not hide racing-system caveats, racecourse-specific limitations, account requirements, paid-TV requirements, geographic restrictions, event-only availability, archive-only availability, or none-found statuses.

## Future expansion guidance

Future expansion should add new jurisdictions conservatively. The PR-LIVE-020 Priority 1 expansion added Italy, Germany, and Spain records with the same conservative source-link rules. The PR-LIVE-021 Macau audit added an inactive-racing record based on official Macao SAR Government closure evidence. The PR-LIVE-022 Priority 2 expansion added Belgium, Netherlands, and Switzerland records with racecourse-specific, replay-only, event-only, or race-film archive caveats, and PR-LIVE-023 added Norway, Finland, and Poland records with paid-TV, betting-account, harness-only, and racecourse-network caveats as applicable. A new record should be added only when an official or clearly official-partner source can be identified, reviewed, and represented without direct stream URLs, video embeds, betting-data content, or complete-coverage claims.

Recommended expansion workflow:

1. Add only official-source evidence URLs.
2. Use conservative statuses when live or replay availability is limited, account-gated, paid-TV-gated, event-only, archived-only, geographically restricted, or not found.
3. Keep country/racing-system splits when a single country has materially different official racing systems or broadcast surfaces.
4. Document caveats in neutral language suitable for public UI.
5. Avoid adding calendar, race-date, post-time, racecard, odds, entries, results, payouts, prediction, or tip content as part of live/replay expansion.

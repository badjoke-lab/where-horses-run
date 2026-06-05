# v0 live/replay broadcast coverage summary

This document summarizes the public-safe v0 audit state for `data/static/live-broadcast-coverage.json`. It is a research/status summary only: it does not add UI behavior, runtime fetching, video embeds, direct stream file URLs, betting odds, entries, results, payouts, or full racecard data.

## Scope and public-safety position

- The project links to official authority, racecourse, broadcaster, official-partner, or official-social landing pages. It does **not** embed, mirror, republish, or directly link to race video stream files.
- Availability can vary by user location, account state, race day, broadcast rights, and provider policy.
- Confidence remains conservative. `not_verified` is retained where a public official live/replay landing page was not confirmed, or where the record remains an intentional v0 placeholder for future jurisdiction expansion.
- Japan is intentionally split into separate records for JRA central racing, NAR local-government racing, and banei racing because their official coverage surfaces and racing types differ.
- Singapore is treated conservatively: domestic Singapore Turf Club racing ended after the final 2024 meeting, while Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races and no official domestic Singapore replay archive is verified.

## Totals

- Total audited/static records: **36**

### Count by `live_status`

| live_status | Count |
| --- | ---: |
| `official_free` | 20 |
| `official_account` | 4 |
| `betting_account` | 2 |
| `tv_pay` | 1 |
| `broadcast_partner` | 2 |
| `event_only` | 4 |
| `none_found` | 3 |

### Count by `replay_status`

| replay_status | Count |
| --- | ---: |
| `replay_available` | 28 |
| `official_account` | 2 |
| `archive_only` | 3 |
| `none_found` | 3 |

## Records by status requiring v0 tracking

The lists below include any record where the named status appears as either `live_status` or `replay_status`.

### `official_free`

- `japan-jra` — Japan — JRA (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-nar` — Japan — NAR (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-banei` — Japan — banei (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `united-arab-emirates` — United Arab Emirates (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `france` — France (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `canada` — Canada (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `new-zealand` — New Zealand (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `turkey` — Turkey (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `morocco` — Morocco (`live_status`: `official_free`, `replay_status`: `official_account`)
- `chile` — Chile (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `peru` — Peru (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `mexico` — Mexico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `uruguay` — Uruguay (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `czechia` — Czechia (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `hungary` — Hungary (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `puerto-rico` — Puerto Rico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `barbados` — Barbados (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `zimbabwe` — Zimbabwe (`live_status`: `official_free`, `replay_status`: `replay_available`)

### `official_account`

- `australia` — Australia (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `south-africa` — South Africa (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `morocco` — Morocco (`live_status`: `official_free`, `replay_status`: `official_account`)
- `sweden` — Sweden (`live_status`: `official_account`, `replay_status`: `official_account`)
- `denmark` — Denmark (`live_status`: `official_account`, `replay_status`: `replay_available`)

### `betting_account`

- `hong-kong` — Hong Kong (`live_status`: `betting_account`, `replay_status`: `replay_available`)
- `singapore` — Singapore (`live_status`: `betting_account`, `replay_status`: `none_found`)

### `tv_pay`

- `ireland` — Ireland (`live_status`: `tv_pay`, `replay_status`: `replay_available`)

### `broadcast_partner`

- `united-kingdom` — United Kingdom (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `united-states` — United States (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)

### `none_found`

- `singapore` — Singapore (`live_status`: `betting_account`, `replay_status`: `none_found`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `trinidad-and-tobago` — Trinidad and Tobago (`live_status`: `none_found`, `replay_status`: `none_found`)
- `martinique` — Martinique (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `oman` — Oman (`live_status`: `none_found`, `replay_status`: `replay_available`)

### `archive_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)

### `event_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `austria` — Austria (`live_status`: `event_only`, `replay_status`: `replay_available`)

## `not_verified` review

`not_verified` intentionally remains in **0** records after the final Peru replay verification pass.

The previous large-jurisdiction placeholder language no longer applies to the United Kingdom, Ireland, France, United States, Canada, Australia, or Singapore. The United Arab Emirates, Chile, Jamaica, Malta, Martinique, and Peru records now also carry more specific statuses for the previously unresolved side. Peru replay status is promoted only from official Monterrico results navigation and race-detail pages that include a Video section; the data still should not infer routine live or replay availability from social clips, event pages, race-day news, JavaScript-only surfaces, or non-official mirrors.

## Singapore wording note

Singapore should not be described as having active domestic Singapore Turf Club racing. The Singapore record should be read as follows:

- Domestic Singapore Turf Club racing ended after the final 2024 meeting.
- Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races; it does not verify a free official domestic Singapore live stream.
- No official domestic Singapore replay archive is verified, so the replay status remains `none_found`.

## Hardening notes from this pass

- The summary counts and status lists were recalculated from the current static dataset after the live/replay hardening pass.
- United Arab Emirates, Chile, Jamaica, and Peru replay statuses were promoted only where official racecourse/authority replay landing pages, official results navigation with race-video sections, or official replay references were found.
- Malta replay and Martinique live statuses were moved to `none_found` where official pages did not provide routine public replay/live landing evidence.
- Peru replay is now `replay_available` because official Monterrico results navigation leads to race-detail pages with a Video section; no direct media URL is stored.
- Singapore wording remains hardened so Singapore Pools account/subscription evidence is not presented as active domestic Singapore Turf Club racing, and so the absence of a verified official domestic Singapore replay archive remains explicit.
- Evidence remains limited to official or clearly official-partner landing pages where possible.

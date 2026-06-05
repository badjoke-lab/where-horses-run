# v0 live/replay broadcast coverage summary

This document summarizes the public-safe v0 audit state for `data/static/live-broadcast-coverage.json`. It is a research/status summary only: it does not add UI behavior, runtime fetching, video embeds, direct stream file URLs, betting odds, entries, results, payouts, predictions, tips, or full racecard data.

## Scope and public-safety position

- The project links to official authority, racecourse, broadcaster, official-partner, or official-social landing pages. It does **not** embed, mirror, republish, or directly link to race video stream files.
- Availability can vary by user location, account state, race day, broadcast rights, and provider policy.
- Confidence remains conservative. `not_verified` is retained only where a public official live/replay landing page has not been audited yet; current v0 audited records use specific conservative statuses instead.
- Japan is intentionally split into separate records for JRA central racing, NAR local-government racing, and banei racing because their official coverage surfaces and racing types differ.
- India is intentionally split in this expansion where official evidence was racecourse-specific. RWITC and Bangalore Turf Club records must not be treated as national India coverage.
- The Philippines expansion is venue-limited to Metro Manila Turf Club evidence and must not be treated as complete Philippines coverage.
- Malaysia is represented conservatively: official racing surfaces were reviewed, but no official race live-stream or race replay landing page was confirmed.
- Singapore is treated conservatively: domestic Singapore Turf Club racing ended after the final 2024 meeting, while Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races and no official domestic Singapore replay archive is verified.

## Totals

- Total audited/static records: **43**

### Count by `live_status`

| Status | Count |
| --- | ---: |
| `official_free` | 24 |
| `official_account` | 5 |
| `betting_account` | 2 |
| `tv_pay` | 1 |
| `broadcast_partner` | 3 |
| `event_only` | 4 |
| `none_found` | 4 |

### Count by `replay_status`

| Status | Count |
| --- | ---: |
| `official_account` | 2 |
| `replay_available` | 33 |
| `none_found` | 5 |
| `archive_only` | 3 |

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
- `argentina` — Argentina (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `panama` — Panama (`live_status`: `official_free`, `replay_status`: `replay_available`)
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
- `india-bangalore-turf-club` — India — Bangalore Turf Club (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `philippines-metroturf` — Philippines — Metro Manila Turf Club (`live_status`: `official_free`, `replay_status`: `none_found`)

### `official_account`

- `australia` — Australia (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `south-africa` — South Africa (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `morocco` — Morocco (`live_status`: `official_free`, `replay_status`: `official_account`)
- `sweden` — Sweden (`live_status`: `official_account`, `replay_status`: `official_account`)
- `denmark` — Denmark (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `india-rwitc` — India — RWITC (`live_status`: `official_account`, `replay_status`: `replay_available`)

### `betting_account`

- `hong-kong` — Hong Kong (`live_status`: `betting_account`, `replay_status`: `replay_available`)
- `singapore` — Singapore (`live_status`: `betting_account`, `replay_status`: `none_found`)

### `tv_pay`

- `ireland` — Ireland (`live_status`: `tv_pay`, `replay_status`: `replay_available`)

### `broadcast_partner`

- `united-kingdom` — United Kingdom (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `united-states` — United States (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `brazil` — Brazil (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)

### `none_found`

- `singapore` — Singapore (`live_status`: `betting_account`, `replay_status`: `none_found`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `trinidad-and-tobago` — Trinidad and Tobago (`live_status`: `none_found`, `replay_status`: `none_found`)
- `martinique` — Martinique (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `oman` — Oman (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `malaysia` — Malaysia (`live_status`: `none_found`, `replay_status`: `none_found`)
- `philippines-metroturf` — Philippines — Metro Manila Turf Club (`live_status`: `official_free`, `replay_status`: `none_found`)

### `archive_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)

### `event_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `austria` — Austria (`live_status`: `event_only`, `replay_status`: `replay_available`)

## Expansion placeholders

`not_verified` remains in **0** records after the India, Malaysia, and Philippines Priority 1 expansion pass.

The previous large-jurisdiction placeholder language no longer applies to the United Kingdom, Ireland, France, United States, Canada, Australia, or Singapore. The United Arab Emirates, Argentina, Brazil, Chile, Jamaica, Malta, Martinique, Panama, Peru, India, Malaysia, and the Philippines records now also carry more specific statuses for audited live/replay sources. Argentina, Brazil, India, and the Philippines remain explicitly venue/provider-limited; the data still should not infer routine live or replay availability from social clips, event pages, race-day news, JavaScript-only surfaces, or non-official mirrors.

## India, Malaysia, and Philippines wording note

- India should not be described as having national live/replay coverage from this pass. RWITC and Bangalore Turf Club were added as separate, official racecourse/provider-limited records.
- Malaysia should not be described as having verified official race live-stream or replay coverage. Official Malaysia racing pages and EQ Sport member-app evidence were reviewed, but no official race live/replay landing page was confirmed.
- The Philippines should not be described as having complete national live/replay coverage. The added record is limited to Metro Manila Turf Club official live-racing evidence, with no official replay landing page confirmed.

## Singapore wording note

Singapore should not be described as having active domestic Singapore Turf Club racing. The Singapore record should be read as follows:

- Domestic Singapore Turf Club racing ended after the final 2024 meeting.
- Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races; it does not verify a free official domestic Singapore live stream.
- No official domestic Singapore replay archive is verified, so the replay status remains `none_found`.

## Hardening notes

- The summary counts and status lists were recalculated from the current static dataset after the India, Malaysia, and Philippines Priority 1 expansion pass.
- India, Malaysia, and Philippines records were added only from official racecourse, official authority, or clearly official-partner evidence, with venue/provider caveats where coverage is not national.
- Carry-forward v0 hardening remains in place for Malta, Martinique, Peru, and Singapore so unresolved, race-detail, and domestic-racing-ended cases stay explicitly caveated.
- Evidence remains limited to official or clearly official-partner landing pages where possible.

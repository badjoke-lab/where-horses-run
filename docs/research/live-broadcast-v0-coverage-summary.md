# v0 live/replay broadcast coverage summary

This document summarizes the public-safe v0 audit state for `data/static/live-broadcast-coverage.json`. It is a research/status summary only: it does not add UI behavior, runtime fetching, video embeds, direct stream file URLs, betting odds, entries, results, payouts, or full racecard data.

## Scope and public-safety position

- The project links to official authority, racecourse, broadcaster, official-partner, or official-social landing pages. It does **not** embed, mirror, republish, or directly link to race video stream files.
- Availability can vary by user location, account state, race day, broadcast rights, and provider policy.
- Confidence remains conservative. `not_verified` is retained where a public official live/replay landing page was not confirmed, or where the record remains an intentional v0 placeholder for future jurisdiction expansion.
- Japan is intentionally split into separate records for JRA central racing, NAR local-government racing, and banei racing because their official coverage surfaces and racing types differ.

## Totals

- Total audited/static records: **36**

### Count by `live_status`

| live_status | Count |
| --- | ---: |
| `official_free` | 18 |
| `official_account` | 3 |
| `betting_account` | 1 |
| `event_only` | 4 |
| `not_verified` | 8 |
| `none_found` | 2 |

### Count by `replay_status`

| replay_status | Count |
| --- | ---: |
| `official_account` | 2 |
| `replay_available` | 18 |
| `not_verified` | 12 |
| `none_found` | 1 |
| `archive_only` | 3 |


## Records with `official_free`

These records currently have `official_free` for live or replay status. In this v0 dataset, all `official_free` occurrences are live-status records.

- `japan-jra` — Japan — JRA (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-nar` — Japan — NAR (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-banei` — Japan — banei (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `united-arab-emirates` — United Arab Emirates (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `new-zealand` — New Zealand (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `turkey` — Turkey (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `morocco` — Morocco (`live_status`: `official_free`, `replay_status`: `official_account`)
- `chile` — Chile (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `peru` — Peru (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `mexico` — Mexico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `uruguay` — Uruguay (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `czechia` — Czechia (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `hungary` — Hungary (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `puerto-rico` — Puerto Rico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `barbados` — Barbados (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `zimbabwe` — Zimbabwe (`live_status`: `official_free`, `replay_status`: `replay_available`)

## Records with `official_account` or `betting_account`

- `hong-kong` — Hong Kong (`live_status`: `betting_account`, `replay_status`: `replay_available`)
- `south-africa` — South Africa (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `morocco` — Morocco (`live_status`: `official_free`, `replay_status`: `official_account`)
- `sweden` — Sweden (`live_status`: `official_account`, `replay_status`: `official_account`)
- `denmark` — Denmark (`live_status`: `official_account`, `replay_status`: `replay_available`)

## Records with `event_only`, `archive_only`, `none_found`, or `not_verified`

- `united-arab-emirates` — United Arab Emirates (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `united-kingdom` — United Kingdom (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `ireland` — Ireland (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `france` — France (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `united-states` — United States (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `canada` — Canada (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `australia` — Australia (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `singapore` — Singapore (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `chile` — Chile (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `peru` — Peru (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `not_verified`)
- `austria` — Austria (`live_status`: `event_only`, `replay_status`: `replay_available`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `trinidad-and-tobago` — Trinidad and Tobago (`live_status`: `none_found`, `replay_status`: `none_found`)
- `martinique` — Martinique (`live_status`: `not_verified`, `replay_status`: `replay_available`)
- `oman` — Oman (`live_status`: `none_found`, `replay_status`: `replay_available`)

## `not_verified` review

`not_verified` intentionally remains in **13** records after the v0 pass:

- `united-arab-emirates` — United Arab Emirates (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `united-kingdom` — United Kingdom (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `ireland` — Ireland (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `france` — France (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `united-states` — United States (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `canada` — Canada (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `australia` — Australia (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `singapore` — Singapore (`live_status`: `not_verified`, `replay_status`: `not_verified`)
- `chile` — Chile (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `peru` — Peru (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `not_verified`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `not_verified`)
- `martinique` — Martinique (`live_status`: `not_verified`, `replay_status`: `replay_available`)

Reasons are conservative and public-safe: either the record is still an explicit v0 placeholder for a large future jurisdiction, or the pass verified one side of coverage while leaving the other side unconfirmed. The data should not infer routine live or replay availability from social clips, event pages, race-day news, JavaScript-only surfaces, or non-official mirrors.

## Hardening notes from this pass

- The dataset description now reflects that the file contains audited v0 records plus conservative unverified placeholders, rather than only initial unaudited placeholders.
- Evidence was kept to official or clearly official-partner landing pages where possible; a specific TJK video URL was normalized to the broader official race-video landing page.
- Notes were tightened so they do not cite evidence absent from `evidence_urls`; Uruguay now references official Maroñas/HRU surfaces rather than an unlisted YouTube channel.
- `source_type` ordering was normalized for Denmark to `authority, official_partner`, matching the dominant ordering used elsewhere.
- Account fields remain conservative: `betting_account` is used only for Hong Kong live access, while `official_account` records keep login requirements explicit and leave uncertain betting-account requirements as `null` rather than inferred.

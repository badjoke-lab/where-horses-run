# v0 live/replay broadcast coverage summary

This document summarizes the public-safe v0 audit state for `data/static/live-broadcast-coverage.json`. It is a research/status summary only: it does not add UI behavior, runtime fetching, video embeds, direct stream file URLs, betting odds, entries, results, payouts, predictions, tips, or full racecard data.

## Scope and public-safety position

- The project links to official authority, racecourse, broadcaster, official-partner, or official-social landing pages. It does **not** embed, mirror, republish, or directly link to race video stream files.
- Availability can vary by user location, account state, race day, broadcast rights, and provider policy.
- Confidence remains conservative. `not_verified` is retained only where a public official live/replay landing page has not been audited yet; current v0 audited records use specific conservative statuses instead.
- Japan is intentionally split into separate records for JRA central racing, NAR local-government racing, and banei racing because their official coverage surfaces and racing types differ.
- India is intentionally split where official evidence was racecourse-specific. RWITC and Bangalore Turf Club records must not be treated as national India coverage.
- The Philippines expansion is venue-limited to Metro Manila Turf Club evidence and must not be treated as complete Philippines coverage.
- Malaysia is represented conservatively: official racing surfaces were reviewed, but no official race live-stream or race replay landing page was confirmed.
- Singapore is treated conservatively: domestic Singapore Turf Club racing ended after the final 2024 meeting, while Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races and no official domestic Singapore replay archive is verified.
- Macau is treated as an inactive-racing jurisdiction: official Macao SAR Government evidence states the horse-racing concession terminated on 1 April 2024 and horse-racing activities ceased from that date, so no active live coverage is implied.
- Italy is represented as a MASAF-linked national gallop/jump/trotting broadcast surface through Grande Ippica Italiana/EQU TV; no direct stream or media URL is recorded.
- Germany is intentionally split into thoroughbred/gallop and trotting records because Deutscher Galopp and WETTSTAR evidence cover different racing-code surfaces.
- Spain is intentionally split into the Las Carreras thoroughbred circuit, Hipódromo de la Zarzuela racecourse replay evidence, and Federación Balear de Trot trotting evidence. Zarzuela and Balearic trotting evidence must not be treated as complete national Spain coverage.
- Priority 2 Belgium, Netherlands, Switzerland, Norway, Finland, Poland, Slovakia, Serbia, and Greece records are intentionally split or caveated by racecourse, racing code, account/paid-TV access, replay-only source, event-only source, broadcast surface, none-found status, or inactive-racing status where the official evidence is not complete active national coverage.
- Saudi Arabia is represented by the JCSA official-social live surface only; no official replay archive landing page was verified in this pass.

## Totals

- Total audited/static records: **63**

### Count by `live_status`

| Status | Count |
| --- | ---: |
| `official_free` | 29 |
| `official_account` | 5 |
| `betting_account` | 3 |
| `tv_pay` | 4 |
| `broadcast_partner` | 3 |
| `racecourse_only` | 1 |
| `event_only` | 6 |
| `none_found` | 12 |

### Count by `replay_status`

| Status | Count |
| --- | ---: |
| `official_account` | 2 |
| `replay_available` | 45 |
| `none_found` | 12 |
| `archive_only` | 4 |

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
- `saudi-arabia-jcsa` — Saudi Arabia — JCSA (`live_status`: `official_free`, `replay_status`: `none_found`)
- `uruguay` — Uruguay (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `czechia` — Czechia (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `hungary` — Hungary (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `puerto-rico` — Puerto Rico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `barbados` — Barbados (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `zimbabwe` — Zimbabwe (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `india-bangalore-turf-club` — India — Bangalore Turf Club (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `philippines-metroturf` — Philippines — Metro Manila Turf Club (`live_status`: `official_free`, `replay_status`: `none_found`)
- `italy` — Italy (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `germany-thoroughbred` — Germany — thoroughbred (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `germany-trotting` — Germany — trotting (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `poland-sluzewiec-itv` — Poland — Służewiec iTV racecourse network (`live_status`: `official_free`, `replay_status`: `replay_available`)

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
- `finland-tototv` — Finland — TotoTV harness racing (`live_status`: `betting_account`, `replay_status`: `replay_available`)

### `tv_pay`

- `ireland` — Ireland (`live_status`: `tv_pay`, `replay_status`: `replay_available`)
- `spain-thoroughbred-las-carreras` — Spain — thoroughbred circuit (`live_status`: `tv_pay`, `replay_status`: `none_found`)
- `spain-zarzuela` — Spain — Hipódromo de la Zarzuela (`live_status`: `tv_pay`, `replay_status`: `replay_available`)
- `norway-rikstoto` — Norway — Rikstoto Direkte (`live_status`: `tv_pay`, `replay_status`: `replay_available`)

### `broadcast_partner`

- `united-kingdom` — United Kingdom (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `united-states` — United States (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `brazil` — Brazil (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)

### `replay_available`

- `japan-jra` — Japan — JRA (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-nar` — Japan — NAR (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `japan-banei` — Japan — banei (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `hong-kong` — Hong Kong (`live_status`: `betting_account`, `replay_status`: `replay_available`)
- `united-arab-emirates` — United Arab Emirates (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `united-kingdom` — United Kingdom (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `ireland` — Ireland (`live_status`: `tv_pay`, `replay_status`: `replay_available`)
- `france` — France (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `united-states` — United States (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `canada` — Canada (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `australia` — Australia (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `new-zealand` — New Zealand (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `south-africa` — South Africa (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `turkey` — Turkey (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `argentina` — Argentina (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `brazil` — Brazil (`live_status`: `broadcast_partner`, `replay_status`: `replay_available`)
- `panama` — Panama (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `chile` — Chile (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `peru` — Peru (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `mexico` — Mexico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `uruguay` — Uruguay (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `denmark` — Denmark (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `czechia` — Czechia (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `hungary` — Hungary (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `austria` — Austria (`live_status`: `event_only`, `replay_status`: `replay_available`)
- `puerto-rico` — Puerto Rico (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `jamaica` — Jamaica (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `barbados` — Barbados (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `martinique` — Martinique (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `oman` — Oman (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `zimbabwe` — Zimbabwe (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `india-rwitc` — India — RWITC (`live_status`: `official_account`, `replay_status`: `replay_available`)
- `india-bangalore-turf-club` — India — Bangalore Turf Club (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `italy` — Italy (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `germany-thoroughbred` — Germany — thoroughbred (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `germany-trotting` — Germany — trotting (`live_status`: `official_free`, `replay_status`: `replay_available`)
- `spain-zarzuela` — Spain — Hipódromo de la Zarzuela (`live_status`: `tv_pay`, `replay_status`: `replay_available`)
- `spain-trotting` — Spain — trotting (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `belgium-mons` — Belgium — Hippodrome de Wallonie Mons (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `netherlands-wolvega` — Netherlands — Victoria Park Wolvega (`live_status`: `racecourse_only`, `replay_status`: `replay_available`)
- `switzerland-suisse-trot-replays` — Switzerland — Suisse Trot replays (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `switzerland-white-turf` — Switzerland — White Turf St. Moritz (`live_status`: `event_only`, `replay_status`: `replay_available`)
- `norway-rikstoto` — Norway — Rikstoto Direkte (`live_status`: `tv_pay`, `replay_status`: `replay_available`)
- `finland-tototv` — Finland — TotoTV harness racing (`live_status`: `betting_account`, `replay_status`: `replay_available`)
- `poland-sluzewiec-itv` — Poland — Służewiec iTV racecourse network (`live_status`: `official_free`, `replay_status`: `replay_available`)

### `racecourse_only`

- `netherlands-wolvega` — Netherlands — Victoria Park Wolvega (`live_status`: `racecourse_only`, `replay_status`: `replay_available`)

### `event_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `austria` — Austria (`live_status`: `event_only`, `replay_status`: `replay_available`)
- `switzerland-white-turf` — Switzerland — White Turf St. Moritz (`live_status`: `event_only`, `replay_status`: `replay_available`)
- `serbia-ljubicevo-games` — Serbia — Ljubičevo Equestrian Games (`live_status`: `event_only`, `replay_status`: `archive_only`)

### `none_found`

- `singapore` — Singapore (`live_status`: `betting_account`, `replay_status`: `none_found`)
- `macau` — Macau (`live_status`: `none_found`, `replay_status`: `none_found`)
- `malta` — Malta (`live_status`: `event_only`, `replay_status`: `none_found`)
- `trinidad-and-tobago` — Trinidad and Tobago (`live_status`: `none_found`, `replay_status`: `none_found`)
- `martinique` — Martinique (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `oman` — Oman (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `malaysia` — Malaysia (`live_status`: `none_found`, `replay_status`: `none_found`)
- `philippines-metroturf` — Philippines — Metro Manila Turf Club (`live_status`: `official_free`, `replay_status`: `none_found`)
- `saudi-arabia-jcsa` — Saudi Arabia — JCSA (`live_status`: `official_free`, `replay_status`: `none_found`)
- `spain-thoroughbred-las-carreras` — Spain — thoroughbred circuit (`live_status`: `tv_pay`, `replay_status`: `none_found`)
- `spain-trotting` — Spain — trotting (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `belgium-mons` — Belgium — Hippodrome de Wallonie Mons (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `switzerland-suisse-trot-replays` — Switzerland — Suisse Trot replays (`live_status`: `none_found`, `replay_status`: `replay_available`)
- `slovakia-zavodisko` — Slovakia — Závodisko Bratislava (`live_status`: `none_found`, `replay_status`: `none_found`)
- `serbia-belgrade-hippodrome` — Serbia — Belgrade Hippodrome gallop (`live_status`: `none_found`, `replay_status`: `none_found`)
- `serbia-trotting-skas` — Serbia — trotting authority (`live_status`: `none_found`, `replay_status`: `none_found`)
- `greece-markopoulo-inactive` — Greece — Markopoulo domestic racing inactive (`live_status`: `none_found`, `replay_status`: `none_found`)

### `archive_only`

- `south-korea` — South Korea (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `bahrain` — Bahrain (`live_status`: `official_free`, `replay_status`: `archive_only`)
- `qatar` — Qatar (`live_status`: `event_only`, `replay_status`: `archive_only`)
- `serbia-ljubicevo-games` — Serbia — Ljubičevo Equestrian Games (`live_status`: `event_only`, `replay_status`: `archive_only`)

## Priority 1 live/replay expansion notes

- The PR-LIVE-020 pass added Italy, Germany, and Spain records only where official or clearly official-partner live/replay evidence was found.
- Italy uses MASAF/Grande Ippica Italiana/EQU TV evidence and covers gallop, jump, and trotting programming conservatively as a national Italian broadcast surface.
- Germany uses separate Deutscher Galopp and WETTSTAR records so gallop/thoroughbred evidence is not applied to trotting without a separate source.
- Spain uses separate Las Carreras, Zarzuela, and Federación Balear de Trot records so racecourse-specific and trotting evidence is not overstated as national coverage.
- No calendar, race-date, post-time, racecard, odds, entry, result, payout, prediction, tip, direct-stream, or embed behavior was added.

## Priority 2 live/replay expansion notes

- The PR-LIVE-022 pass added Belgium, Netherlands, and Switzerland records only where official or clearly official-partner live/replay evidence was found, with racecourse-specific, replay-only, event-only, or race-film archive caveats.
- The PR-LIVE-023 pass added Norway, Finland, and Poland records only where official or clearly official-partner live/replay evidence was found, with paid-TV, betting-account, harness-only, and racecourse-network caveats as applicable.
- The PR-LIVE-024 pass added Slovakia, Serbia, and Greece records after first confirming current racing activity or inactive-racing status; Slovakia and regular Serbian gallop/trotting records use `none_found` where no official live/replay landing page was confirmed, the Ljubičevo record is event-only/archive-only, and Greece is inactive for domestic Markopoulo racing.
- The PR-LIVE-026 pass added the Saudi Arabia JCSA record from official authority and official-social evidence for free live coverage; replay remains `none_found` because no official replay archive landing page was verified.
- Norway uses the shared Rikstoto Direkte/Rikstoto Play broadcast surface for trotting and gallop and does not make separate free-access claims for either Norwegian harness or Øvrevoll gallop.
- Finland uses Suomen Hippos/Veikkaus TotoTV harness-racing evidence only; no Finnish thoroughbred source was verified.
- Poland uses Tor Służewiec/Służewiec iTV official racecourse-network evidence and PKWK authority context; it must not be overstated as complete national Polish coverage.
- No calendar, race-date, post-time, racecard, odds, entry, result, payout, prediction, tip, direct-stream, or embed behavior was added.

## Priority 2 audit progress summary (PR-LIVE-025)

This progress summary covers the Priority 2 live/replay audit state after the Belgium, Netherlands, Switzerland, Norway, Finland, Poland, Slovakia, Serbia, and Greece passes. It is documentation-only and does not change `data/static/live-broadcast-coverage.json`.

### Completed Priority 2 records so far

The completed Priority 2 audit set currently contains **12 audited static records** across **9 jurisdictions**:

| Jurisdiction | Completed records | Split/caveat basis | Current status summary |
| --- | ---: | --- | --- |
| Belgium | 1 | Racecourse-specific Mons evidence covering gallop/trotting pages. | Mons has replay evidence only; live remains `none_found`. |
| Netherlands | 1 | Racecourse-specific Wolvega harness evidence. | Wolvega is `racecourse_only` for live and has replay evidence; no national Netherlands claim. |
| Switzerland | 2 | Code/event split between Suisse Trot replays and White Turf St. Moritz event coverage. | Suisse Trot is replay-only with live `none_found`; White Turf is `event_only` live with replay evidence. |
| Norway | 1 | Shared paid-TV/operator broadcast surface across trotting and gallop. | Rikstoto Direkte/Rikstoto Play is recorded as `tv_pay` live with replay evidence; no free-access claim. |
| Finland | 1 | Harness-only TotoTV evidence. | Finnish harness coverage is `betting_account` live with replay evidence; no Finnish thoroughbred source verified. |
| Poland | 1 | Racecourse-network Służewiec iTV evidence. | Służewiec iTV is `official_free` live with replay evidence, but remains racecourse-network rather than complete national coverage. |
| Slovakia | 1 | Active authority/racecourse record with no confirmed live/replay landing page. | Live and replay are both `none_found`. |
| Serbia | 3 | Split into regular Belgrade gallop, regular SKAS trotting, and Ljubičevo event coverage. | Belgrade gallop and SKAS trotting are `none_found`; Ljubičevo is `event_only` live and `archive_only` replay. |
| Greece | 1 | Inactive domestic Markopoulo racing status. | Live and replay are both `none_found`; record must not be presented as active racing coverage. |

### Remaining Priority 2 target

- **Austria** remains the only original Priority 2 target not yet represented by an audited live/replay static record in this summary. It should stay a future evidence-review target until an official authority, racecourse, broadcaster, official-partner, or official-social landing page is audited.

### Priority 2 country split by status type

- **Code-specific records:** Switzerland (`switzerland-suisse-trot-replays` for trotting replays), Finland (`finland-tototv` for harness), Serbia (`serbia-belgrade-hippodrome` for gallop and `serbia-trotting-skas` for trotting).
- **Racecourse-specific or racecourse-network records:** Belgium (`belgium-mons`), Netherlands (`netherlands-wolvega`), Poland (`poland-sluzewiec-itv`).
- **Event-only records:** Switzerland (`switzerland-white-turf`) and Serbia (`serbia-ljubicevo-games`).
- **Inactive-racing records:** Greece (`greece-markopoulo-inactive`).
- **Shared broadcast-surface records:** Norway (`norway-rikstoto`) is shared across trotting and gallop but remains account/paid-TV/access-caveated; it should not be described as free or complete national coverage.

### Priority 2 records with `none_found`, `event_only`, or `archive_only`

- **`none_found` appears in Priority 2 records for:** Belgium live (`belgium-mons`), Switzerland live (`switzerland-suisse-trot-replays`), Slovakia live/replay (`slovakia-zavodisko`), Serbia live/replay (`serbia-belgrade-hippodrome`, `serbia-trotting-skas`), and Greece live/replay (`greece-markopoulo-inactive`).
- **`event_only` appears in Priority 2 records for:** Switzerland live (`switzerland-white-turf`) and Serbia live (`serbia-ljubicevo-games`).
- **`archive_only` appears in Priority 2 records for:** Serbia replay (`serbia-ljubicevo-games`).

### Wording guardrails

- The current audited Priority 2 records have no `not_verified` live/replay statuses, but that means `not_verified` is **0 only within the audited record set**, not across every country, racing code, racecourse, future target, or potential official source worldwide.
- No complete national coverage claim should be made for any Priority 2 jurisdiction. The safe phrasing is record-specific: racecourse-specific, code-specific, event-only, inactive, account-limited, paid-TV-limited, replay-only, archive-only, or none-found as applicable.

## Macau wording note

Macau should not be described as having active horse racing or active live racing video. The Macau record should be read as follows:

- The Macao SAR Government announced that the horse-racing concession terminated on 1 April 2024 and that horse-racing activities ceased from that date.
- No active official live coverage is recorded; `live_status` remains `none_found`.
- No official replay landing page was verified in this pass; `replay_status` remains `none_found`. Old race videos, if found separately, should be treated as historical material unless a future audit verifies an official archive surface.

## Singapore wording note

Singapore should not be described as having active domestic Singapore Turf Club racing. The Singapore record should be read as follows:

- Domestic Singapore Turf Club racing ended after the final 2024 meeting.
- Singapore Pools evidence relates to account/subscription horse-racing streaming for selected meetings or races; it does not verify a free official domestic Singapore live stream.
- No official domestic Singapore replay archive is verified, so the replay status remains `none_found`.

## Hardening notes

- The summary counts and status lists were recalculated from the current static dataset after the Saudi Arabia JCSA audit expansion.
- India, Malaysia, the Philippines, Italy, Germany, Spain, Macau, Belgium, the Netherlands, Switzerland, Norway, Finland, Poland, Slovakia, Serbia, Greece, and Saudi Arabia records were added only from official racecourse, official authority, broadcaster, official-social, operator, or clearly official-partner evidence, with venue/provider, code-specific, account/paid-TV, event-only, replay-only, racecourse-network, none-found, or inactive-racing caveats where coverage is not national, not active, or not universally free.
- Carry-forward v0 hardening remains in place for Malta, Martinique, Peru, and Singapore so unresolved, race-detail, and domestic-racing-ended cases stay explicitly caveated.
- Evidence remains limited to official or clearly official-partner landing pages where possible.

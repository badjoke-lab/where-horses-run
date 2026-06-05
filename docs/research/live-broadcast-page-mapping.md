# Live/replay broadcast page mapping

Status: v0 mapping policy for future country and racecourse pages

This document defines how future country and racecourse pages should map records
from `data/static/live-broadcast-coverage.json` into display sections. It is
documentation only. It does not implement UI, add runtime fetching, embed video,
add direct stream URLs, or add betting odds, entries, results, payouts, tips,
predictions, or full racecard data.

## Scope and safety rules

Future pages must remain static-data driven. The only source for live/replay
broadcast rows should be the committed static dataset, plus route metadata that
already identifies a country, racecourse, and racecourse racing type. A page must
not discover, scrape, probe, or derive stream URLs at runtime.

Future UI may link to official landing pages from the dataset, but must not:

- embed video players;
- fetch or scrape provider pages at runtime;
- display direct media, playlist, manifest, CDN, or stream-file URLs;
- display unofficial mirrors, clips, social reposts, or inferred streams;
- add betting odds, entries, results, payouts, tips, predictions, or full
  racecard data;
- imply guaranteed availability, free access, or complete replay coverage.

Preferred public wording is neutral, such as **Open official source**,
**Official live**, **Official replay**, **Replay/archive**, **Event only**,
**Account required**, **Geo restrictions may apply**, **Not verified**, or
**None found**. Do not use promotional wording such as "watch here", "free
stream", "guaranteed live", or "full replay library".

## Dataset fields used for mapping

Future pages should use only the following fields from each record for mapping
and display decisions:

| Field | Mapping use |
| --- | --- |
| `jurisdiction_id` | Stable record key used to match country-level and system-level coverage. |
| `country_or_region` | Human-readable row or section label when no better page label exists. |
| `racing_types` | Controls whether a record may apply to a racecourse with a known racing type. |
| `live_status` | Controls live-link eligibility and live status labeling. |
| `replay_status` | Controls replay-link eligibility and replay status labeling. |
| `provider_name` | Provider/source label when a row is displayable. |
| `official_live_url` | Official live landing-page URL, if displayable under the status rules. |
| `official_replay_url` | Official replay/archive landing-page URL, if displayable under the status rules. |
| `requires_login` | Account-access warning. |
| `requires_betting_account` | Betting-account-access warning; do not expand into betting content. |
| `requires_paid_tv` | Paid-TV or subscription warning. |
| `geo_restriction` | Geo/access warning text or a neutral summary of it. |
| `source_type` | Distinguishes country authority, official partner, racecourse, broadcaster, or official social source. |
| `confidence` | Display confidence warning and suppress low-confidence prominence. |
| `notes` | Internal/admin context only unless future UI deliberately exposes a concise public-safe note. |

`evidence_urls` and `last_checked` may be useful for admin review, but public
source rows should prefer `official_live_url` and `official_replay_url`. Do not
render evidence URLs as substitutes for missing official live/replay URLs.

## Country page mapping rules

A country page should render a live/replay section from all static records that
belong to that page's country or country-level racing systems.

1. Match records by the page's known country and configured jurisdiction IDs.
   Do not guess from URL host names or provider text at runtime.
2. If the country has one record, render at most one row for that record.
3. If the country has multiple records, render one row per racing system or
   coverage surface. Do not collapse separate racing systems into a single
   generic country link when their `jurisdiction_id`, `racing_types`, provider,
   or source scope differs.
4. Show live and replay cells independently. A row may have a displayable live
   link, a displayable replay link, both, or neither.
5. If no row has a displayable official link, show a conservative empty state
   using the record status, such as **Not verified** or **None found**.
6. Country pages may include racecourse-level sources only when the record is
   explicitly part of that country page's configured record set. Label those rows
   as racecourse-level or system-specific, not as comprehensive country-wide
   coverage.

### Japan multi-record handling

Japan must remain split into separate rows because the records cover different
racing systems:

| Record | Country page treatment |
| --- | --- |
| `japan-jra` | Show as **Japan — JRA** or **JRA central racing** for central thoroughbred flat and jump racing only. |
| `japan-nar` | Show as **Japan — NAR** or **NAR local-government racing** for NAR thoroughbred flat racing only. |
| `japan-banei` | Show as **Japan — banei** or **Banei racing** for banei racing only. |

Do not borrow a JRA link for NAR or banei pages. Do not borrow a NAR/Chihokeiba
Live link for JRA central racing. Do not borrow a banei official replay link for
non-banei courses. These are separate official coverage systems even when they
share a country.

## Racecourse page mapping rules

A racecourse page should map its country and known racing type to the narrowest
applicable static live/replay record.

1. Determine the racecourse's country and primary racing type from static route
   or inventory data. Do not infer it by scraping racecourse or provider pages.
2. Select candidate records for the racecourse's country.
3. Keep only records whose `racing_types` include the racecourse racing type.
4. Prefer a record whose `source_type` is racecourse-level for that exact
   racecourse or racing system.
5. If no racecourse-level record exists, use a country authority, official
   partner, or broadcaster record only when its `racing_types` match the
   racecourse racing type and the source is intended to cover that system.
6. If more than one matching country-level record remains, show separate rows
   rather than choosing one by assumption.
7. If no matching record remains, show a conservative **Not verified** empty
   state instead of borrowing another racing system's link.

Racecourse pages should present inherited country-level coverage as
country/system coverage, for example **Official source for JRA central racing**,
not as a racecourse-exclusive live stream unless the dataset explicitly says the
source is racecourse-level.

## Matching racing type to records

The `racing_types` array is the main guardrail against unrelated-link borrowing.
Future UI should use exact, normalized racing-type values.

- A racecourse with `thoroughbred-flat` may use records containing
  `thoroughbred-flat` only for that country's matching system.
- A jump-racing page may use records containing `jump-racing`; it must not use a
  flat-only record unless the racecourse is also statically classified for flat
  racing and the section clearly labels the matched type.
- A harness page may use records containing `harness-racing`; it must not borrow
  thoroughbred, trotting, or banei links.
- A trotting page may use records containing `trotting`; it must not borrow
  thoroughbred or harness links unless the static inventory explicitly says the
  racecourse hosts both and the row is clearly scoped.
- A banei page may use records containing `banei-racing`; it must not borrow JRA
  or NAR thoroughbred links.
- An Arabian racing page may use records containing `arabian-racing`; it must
  not borrow thoroughbred-only links.

If a racecourse supports multiple racing types, future UI may show multiple
system rows, but each row must be produced by a matching record and label the
matched racing type or system.

## Country-level versus racecourse-level sources

Use `source_type` to explain scope and avoid overclaiming:

| Source scope | Display rule |
| --- | --- |
| Country authority or regulator | Display as country/system-level coverage, not as a racecourse-owned source. |
| Official partner or broadcaster | Display as official-partner coverage with account, paid-TV, geo, or event warnings as applicable. |
| Racecourse | Display as racecourse-level coverage only for that racecourse or racing system. |
| Official social | Display only if the dataset status is displayable and the link is an official or official-partner landing page. |

A racecourse-level row should not be promoted to country-wide coverage unless the
static dataset and source scope explicitly support that broader use. A
country-level row should not be described as racecourse-exclusive coverage.

## Missing official URLs

Live and replay mapping must be evaluated independently.

- If `official_live_url` is missing, do not render a live link even when
  `live_status` sounds positive.
- If `official_replay_url` is missing, do not render a replay link even when
  `replay_status` sounds positive.
- Do not substitute `evidence_urls`, provider home pages, social profiles, search
  result URLs, race-day article URLs, or direct media URLs for a missing official
  live/replay URL.
- If one URL is present and displayable, render only that side and label the
  other side with a conservative non-link status.
- If both URLs are missing or non-displayable, render a single empty state rather
  than fabricating a combined coverage row.

## Status handling

A URL is displayable only when the corresponding status is displayable and the
URL is an official landing page.

| Status | Mapping rule |
| --- | --- |
| `official_free` | Display as an official live or replay source when the corresponding official URL is present. Do not promise free access beyond the neutral status label. |
| `official_account` | Display with an account-required warning when the corresponding official URL is present. |
| `betting_account` | Display with a betting-account-required warning when the corresponding official URL is present. Do not add odds, account signup encouragement, or wagering content. |
| `tv_pay` | Display only as paid-TV/subscription official coverage when the corresponding official URL is present. |
| `broadcast_partner` | Display only when the URL is an official broadcaster or official partner landing page. |
| `replay_available` | Display as an official replay source when `official_replay_url` is present. |
| `social_stream` | Display only when the linked page is an official or official-partner social landing page. |
| `racecourse_only` | Display only on matching racecourse or clearly scoped country/system rows. |
| `event_only` | Display as event-only coverage. Do not imply routine daily live or replay availability. |
| `geo_restricted` | Display with a geo-restriction warning when the corresponding official URL is present. |
| `archive_only` | Display as replay/archive only. Never display as live coverage. |
| `not_verified` | Do not render as a usable live or replay link. Show **Not verified** only as an explanation or empty state. |
| `none_found` | Do not render as a usable live or replay link. Show **None found** only after the dataset records that no usable official source was found. |
| `unsafe_unofficial` | Never render in public source-link UI. |

## Low-confidence records

Records with `confidence: low` may appear only as conservative, lower-prominence
rows when they otherwise pass the official URL and status rules.

- Add a warning such as **Source details not fully verified**.
- Do not use low-confidence records as the only basis for borrowing a link across
  racing systems or racecourses.
- Do not place low-confidence rows above high- or medium-confidence rows.
- If a low-confidence record has no displayable official URL, treat it as a
  non-link empty state.

Records with `confidence: not_checked` should be treated like unverified
placeholders and should not produce usable source links.

## Display row ordering

Future UI should use deterministic ordering so static pages remain stable.

### Country pages

1. Matching high-confidence rows with displayable official live links.
2. Matching medium-confidence rows with displayable official live links.
3. Matching low-confidence rows with displayable official live links and a
   warning.
4. Matching rows with displayable replay/archive links but no live link.
5. Matching `event_only` rows, unless they already appeared above because they
   have a displayable event-specific link.
6. Matching rows with no displayable links, grouped as **Not verified** or
   **None found**.
7. Within each group, order by configured country/system priority if available;
   otherwise order by `country_or_region`, then `jurisdiction_id`.

For Japan, the default country-page order should be JRA, NAR, then banei unless
a future static page configuration explicitly chooses a different public order.

### Racecourse pages

1. Exact racecourse-level source for the racecourse and racing type.
2. Exact racing-system source for the racecourse racing type.
3. Country authority, official partner, or broadcaster source for the matching
   racing type.
4. Replay/archive-only source for the matching racing type.
5. Unverified or none-found empty state.

Within the same priority tier, sort by confidence (`high`, then `medium`, then
`low`, then `not_checked`), then by provider name, then by `jurisdiction_id`.

## Avoiding unrelated-link borrowing

Future UI must not fill missing links by borrowing from another record unless a
static mapping explicitly says the other record covers the same country,
racecourse, and racing type.

Examples of disallowed borrowing:

- JRA central racing links must not be used for NAR local-government courses.
- NAR links must not be used for JRA central racing pages.
- Banei links must not be used for non-banei Japanese racing.
- Harness links must not be used for thoroughbred pages, and thoroughbred links
  must not be used for harness pages.
- Archive-only links must not be used to imply live coverage.
- Event-only links must not be used to imply routine coverage outside the event
  context.
- A country authority link must not be presented as a specific racecourse stream
  unless the static data explicitly confirms racecourse-level scope.

When a record is close but not exact, prefer showing **Not verified for this
racecourse/racing type** rather than widening the source scope.

## Static-data-driven future UI

Future implementation should treat `data/static/live-broadcast-coverage.json` as
a static allowlist for public live/replay source links.

- Pages should import or otherwise consume the static dataset at build time.
- Route metadata should provide country, racecourse, and racing type keys.
- Display sections should be generated from deterministic filtering rules, not
  from network lookups.
- Updates should happen by editing and reviewing the static dataset, then
  rebuilding the site.
- Runtime code should not perform stream discovery, source probing, scraping,
  provider search, or media URL extraction.

This keeps future pages public-safe, neutral, and auditable while allowing the
static dataset to improve over time.

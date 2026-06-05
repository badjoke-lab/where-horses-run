# Live/replay broadcast display rules

Status: v0 display policy for future country and racecourse pages

This document defines public-safe display rules for using
`data/static/live-broadcast-coverage.json` on future country and racecourse
pages. It is documentation only. It does not implement UI, add runtime fetching,
embed video, add direct stream URLs, or add betting odds, entries, results,
payouts, tips, predictions, or full racecard data.

## Scope

These rules apply when a future page wants to show a public link to live or
replay coverage from the v0 live/replay broadcast coverage dataset.

A future implementation may display:

- jurisdiction or racing-system name;
- provider name;
- official live or replay landing-page links;
- status labels from this document;
- account, betting-account, paid-TV, event-only, replay-only, geo, and
  confidence warnings.

A future implementation must not display:

- embedded video players;
- mirrored, proxied, cached, clipped, or republished video;
- direct stream file URLs, playlist URLs, or media-manifest URLs;
- unofficial video links;
- betting odds, entries, results, payouts, tips, predictions, or full racecard
  data;
- raw fetched HTML, response bodies, or source-page extracts.

## Displayable status values

A status is displayable only when it points users to an official source landing
page and is not presented as a guaranteed stream. Availability can vary by
location, account state, race day, rights window, device, and provider policy.

The following status values may be shown as source links when the corresponding
official URL is present:

| Status value | Display treatment |
| --- | --- |
| `official_free` | Display as an official live or replay source, depending on whether it appears in `live_status` or `replay_status`. |
| `official_account` | Display as an official source with an account-required warning. |
| `betting_account` | Display as an official source with a betting-account-required warning. |
| `tv_pay` | Display only as a paid-TV/subscription official source with a clear access warning. |
| `broadcast_partner` | Display only when the dataset links to an official broadcaster or official partner landing page. |
| `replay_available` | Display as an official replay source. |
| `social_stream` | Display only when the source is an official or official-partner social account/page. |
| `racecourse_only` | Display as a racecourse-level official source, not as country-wide coverage. |
| `event_only` | Display as event-only availability with an event/season warning. |
| `geo_restricted` | Display as an official source with a geo-restriction warning. |
| `archive_only` | Display as replay/archive-only, not as live coverage. |

## Hidden or unverified status values

The following status values must not be shown as usable live or replay links:

| Status value | Display treatment |
| --- | --- |
| `not_verified` | Do not link as a usable source. Show **Not verified** if the page needs to explain the missing coverage state. |
| `none_found` | Do not link as a usable source. Show **None found** only after research found no usable official source. |
| `unsafe_unofficial` | Hide from public source-link UI. Never display as a usable source. |

When both live and replay statuses are non-displayable, the page should show a
single conservative empty-state label rather than a link.

## Public label text

Future UI should use the following public labels. Labels should be short and
factual; explanatory helper text can appear nearby.

| Use case | Label text | Helper text rule |
| --- | --- | --- |
| Official live | **Official live** | Use for `live_status` values that are displayable and have an official live landing-page URL. |
| Official replay | **Official replay** | Use for `replay_status` values that are displayable and have an official replay landing-page URL. |
| Account required | **Account required** | Use when `requires_login` is `true`, or the status is `official_account`. |
| Betting account required | **Betting account required** | Use when `requires_betting_account` is `true`, or the status is `betting_account`. |
| Event only | **Event only** | Use when `live_status` or `replay_status` is `event_only`. |
| Replay only | **Replay only** | Use when replay is displayable but live is non-displayable, `none_found`, `not_verified`, absent, or archive-only. |
| Not verified | **Not verified** | Use when the status is `not_verified`, confidence is `not_checked`, or no official URL has been confirmed. |
| None found | **None found** | Use only when the status is `none_found`. |

Do not use stronger language such as "free stream," "watch here," "guaranteed
live," or "full replay library." The safest call to action is a neutral link
such as "Open official source."

## Live and replay selection rules

1. Treat live and replay independently. A jurisdiction can have displayable live
   coverage and unverified replay coverage, or the reverse.
2. Show **Official live** only when `official_live_url` is present and
   `live_status` is displayable.
3. Show **Official replay** only when `official_replay_url` is present and
   `replay_status` is displayable.
4. Show **Replay only** when a replay link is displayable but no live link is
   displayable.
5. Show **Event only** next to live or replay labels when the relevant status is
   `event_only`; do not imply ordinary daily availability.
6. Show archive sources as replay/archive sources only. `archive_only` must not
   be promoted to live coverage.
7. If a URL is absent, malformed, unofficial, or only a direct media file, do not
   render it even if the status value would otherwise be displayable.

## Geo and account warnings

Future pages must surface access limitations before, or immediately next to, the
source link.

- If `geo_restriction` has text, show a geo warning using the dataset text or a
  concise paraphrase. Do not claim that access works in the user's location.
- If `requires_login` is `true`, show **Account required**.
- If `requires_betting_account` is `true`, show **Betting account required**.
  This warning takes precedence over the generic account-required warning.
- If `requires_paid_tv` is `true`, show a paid-TV/subscription warning. Do not
  imply free access.
- If any of these fields are `null`, avoid definitive access claims. Prefer
  helper text such as "Access requirements may vary."
- Do not collect account details, link to sign-up flows as a primary call to
  action, or frame account creation as recommended betting behavior.

## Confidence display rules

Confidence is an editorial signal for the source-link evidence, not a guarantee
of availability.

- `high`: may be shown as "Source confidence: high" or omitted from compact UI.
  Still include applicable geo/account warnings.
- `medium`: may be shown as "Source confidence: medium" and should not be
  phrased as confirmed availability.
- `low`: show as "Source confidence: low" and consider pairing with **Not
  verified** helper text unless a human review explicitly approves the link.
- `not_checked`: show **Not verified** and do not render a usable source link.
- Unknown confidence values must be treated as `not_checked` until reviewed.

Do not expose internal confidence as a rating of the broadcaster, racecourse, or
jurisdiction. It only describes this project's evidence state.

## Japan split display rules

Japan must not be collapsed into a single generic live/replay row. The dataset
intentionally separates JRA central racing, NAR local-government racing, and
banei racing because their official coverage surfaces and racing types differ.

Future Japan country pages should display separate rows or sections for:

1. **Japan — JRA**: central thoroughbred flat and jump racing.
2. **Japan — NAR**: local-government thoroughbred flat racing.
3. **Japan — banei**: banei racing.

Japan racecourse pages should use the matching split:

- JRA racecourses should use the JRA record only.
- NAR racecourses should use the NAR record only.
- Obihiro/banei pages should use the banei record only.

Do not apply JRA live/replay links to NAR or banei pages. Do not apply NAR or
banei links to JRA pages. If a racecourse cannot be assigned confidently to one
of the three groups, show **Not verified** until the mapping is reviewed.

## Official-source-only link rules

Links must open official sources only. A link is eligible only when it is one of
the following:

- an official racing authority page;
- an official racecourse page;
- an official broadcaster page identified by the authority or racecourse;
- an official partner page identified by the authority or racecourse;
- an official or official-partner social page used for racing video.

Do not display links to unofficial restreams, scraper mirrors, forum posts,
pirate streams, file hosts, shortened URLs with unclear destinations, direct
media files, playlist/manifests, or pages whose official status is uncertain.
All public links should open the provider's landing page in a new browser
context with normal external-link safety attributes.

## No embedding, mirroring, or stream extraction

Video is never embedded or mirrored by this project. Future UI must link out to
official source pages only.

Specifically, future implementations must not:

- embed iframes or video players from official or unofficial providers;
- proxy, cache, mirror, download, clip, or transform video;
- inspect or publish media manifests, HLS/DASH playlist URLs, stream tokens, or
  direct media URLs;
- use runtime fetching to discover currently active streams;
- store source response bodies or raw source markup.

## Racecourse-page inheritance rules

Country-level records can inform racecourse pages only when the record clearly
applies to that racecourse's racing system.

- Country-level official authority links may be shown on racecourse pages when
  the authority covers that racecourse and racing type.
- Racecourse-specific links should be preferred over country-level links when a
  verified racecourse-level official source exists.
- `racecourse_only` status should not be expanded into country-wide coverage.
- If a racecourse has no verified applicable source, show **Not verified** or
  **None found** according to the audited status; do not borrow unrelated links.

## Empty-state rules

Use conservative empty states when a usable official link is not available.

- **Not verified** means the project has not checked enough official evidence.
- **None found** means research found no usable official live or replay source.
- Do not show unofficial alternatives in either state.
- Do not invite users to search for streams elsewhere.

## Implementation boundary for future PRs

Any future implementation using these rules should remain static-data driven
unless a separate approved scope explicitly permits otherwise. This document does
not authorize runtime fetching, source scraping, video embedding, direct stream
linking, or any betting/racecard data expansion.

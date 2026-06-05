# Live/replay source section component spec

Status: static component contract for a future UI implementation

This document defines the static UI contract for a reusable section that displays
official live and replay source rows. It is documentation only. It does not
implement UI, add runtime fetching, embed video, add direct stream URLs, or add
unofficial links.

## Scope and non-goals

The component is a link-first, public-safe presentation layer over static
live/replay coverage records. It may be used on future country, jurisdiction,
racing-system, or racecourse pages after those pages select the matching static
records.

The component must:

- render only official or clearly official-partner landing-page links supplied by
  static data;
- display live and replay availability independently;
- surface account, betting-account, paid-TV, geo, and confidence warnings close
  to the affected row;
- provide conservative empty states when official links are unavailable or
  unverified;
- preserve Japan's split between JRA, NAR, and banei records.

The component must not:

- embed video players;
- fetch live/replay availability at runtime;
- display direct media, playlist, manifest, iframe, mirror, proxy, clip, or
  cached-video URLs;
- infer a stream from evidence URLs, search results, provider home pages, or
  unofficial social/video pages;
- display betting odds, entries, results, payouts, tips, predictions, or full
  racecard data;
- merge live and replay into a single availability claim when only one side is
  verified.

## Component input shape

Future implementation should pass a fully prepared input object. The component
must not query records, scrape source pages, or resolve missing URLs itself.

```ts
type LiveReplaySourceSectionInput = {
  heading?: string;
  context: {
    pageKind: 'country' | 'jurisdiction' | 'racecourse';
    pageTitle: string;
    countryCode?: string;
    racecourseId?: string;
    racingTypes: string[];
  };
  rows: LiveReplaySourceRow[];
  emptyState?: LiveReplayEmptyState;
};

type LiveReplaySourceRow = {
  id: string;
  jurisdictionId: string;
  jurisdictionLabel: string;
  providerName: string | null;
  sourceType: string | null;
  racingTypes: string[];
  scopeLabel?: string;
  live: SourceSide;
  replay: SourceSide;
  warnings: SourceWarning[];
  confidence: 'high' | 'medium' | 'low' | 'not_checked';
  lastChecked: string | null;
  notes?: string;
};

type SourceSide = {
  status: string;
  officialUrl: string | null;
  display: 'link' | 'status_only' | 'hidden';
  label: string;
  helperText?: string;
};

type SourceWarning = {
  kind:
    | 'account_required'
    | 'betting_account_required'
    | 'paid_tv_required'
    | 'geo_restricted'
    | 'event_only'
    | 'replay_only'
    | 'low_confidence'
    | 'not_verified';
  text: string;
  appliesTo: 'live' | 'replay' | 'row';
};

type LiveReplayEmptyState = {
  label: 'Not verified' | 'None found' | 'No official source listed';
  helperText: string;
};
```

The static adapter that prepares this input should copy field values from the
coverage dataset rather than re-interpret source pages. It may filter rows by
page context before rendering, but those filtering decisions are outside this
component.

## Row fields

Each rendered row represents one official source record scoped to one
jurisdiction, racing system, or racecourse.

| Row field | Display rule |
| --- | --- |
| `id` | Stable DOM/key value, preferably the source record `jurisdiction_id`. |
| `jurisdictionLabel` | Human-readable country, region, racing system, or racecourse label. |
| `providerName` | Display as the source name when present; otherwise fall back to `jurisdictionLabel`. |
| `sourceType` | Optional neutral scope text such as `authority`, `racecourse`, `broadcaster`, `official_partner`, or `official_social`. |
| `racingTypes` | Use for filtering and optional scope chips; never use to borrow unrelated records. |
| `scopeLabel` | Optional plain-language scope, for example `Central racing`, `Local government racing`, or `Banei racecourse source`. |
| `live` | Live-side status, URL, label, and helper text. |
| `replay` | Replay-side status, URL, label, and helper text. |
| `warnings` | Access, geo, event, replay-only, and confidence warnings to show near the row or affected side. |
| `confidence` | Research confidence. Low confidence lowers prominence; `not_checked` cannot produce usable links. |
| `lastChecked` | Optional ISO date for a small freshness note; do not use it as a live availability guarantee. |
| `notes` | Optional short public-safe note. Do not display raw evidence extracts or source HTML. |

## Label rendering

The component should render short factual labels. A label is not a guarantee that
video will be available to every user, in every country, on every device, or on
non-race days.

### Side labels

| Condition | Public label | Link behavior |
| --- | --- | --- |
| `live.display === 'link'` | **Official live** | Link to `live.officialUrl`. |
| `replay.display === 'link'` | **Official replay** | Link to `replay.officialUrl`. |
| Replay link is displayable and live is not | **Replay only** | Show as a row or live-side warning, while still linking only the replay side. |
| Side status is `event_only` | **Event only** | Show next to the affected side; link only if an official landing page exists. |
| Side status is `archive_only` | **Official replay archive** | Render only on the replay side. Never render as live. |
| Side status is `not_verified` or confidence is `not_checked` | **Not verified** | Do not link. |
| Side status is `none_found` | **None found** | Do not link. |

### Link text

Use neutral link text such as:

- `Open official live source`
- `Open official replay source`
- `Open official replay archive`

Do not use stronger calls to action such as `Watch free`, `Guaranteed live`,
`Stream now`, or `Full replay library`.

## Live/replay independent rendering

Live and replay must be evaluated independently. The component should never hide
a valid official replay source just because live is unverified, and it should
never imply replay availability just because live is available.

For each row:

1. Evaluate the live side using only `live.status` and `live.officialUrl`.
2. Evaluate the replay side using only `replay.status` and
   `replay.officialUrl`.
3. Render a side as a link only when `display` is `link`, the URL is an official
   landing page, and the status is displayable for that side.
4. Render status-only text when the side is known but not linkable, for example
   `Not verified`, `None found`, or `Replay only`.
5. Hide the side when it is irrelevant to the page context and a clearer row
   empty state exists.
6. If both sides are non-linkable, render a single row-level empty state instead
   of two disabled buttons.

Example mixed row:

```json
{
  "id": "united-arab-emirates",
  "jurisdictionLabel": "United Arab Emirates",
  "providerName": "Emirates Racing Authority",
  "live": {
    "status": "official_free",
    "officialUrl": "https://emiratesracing.com/live-streams/dubai-racing-1",
    "display": "link",
    "label": "Official live"
  },
  "replay": {
    "status": "not_verified",
    "officialUrl": null,
    "display": "status_only",
    "label": "Not verified"
  },
  "warnings": [],
  "confidence": "medium",
  "lastChecked": "2026-06-04"
}
```

The resulting UI should show one official live link and one conservative replay
status, not a combined `live and replay available` claim.

## Account, geo, and confidence warnings

Warnings are part of the component contract, not optional decoration.

| Warning input | Required rendering |
| --- | --- |
| `requires_login === true` or `official_account` | Show **Account required** near the affected live/replay source. |
| `requires_betting_account === true` or `betting_account` | Show **Betting account required** and do not add wagering calls to action. |
| `requires_paid_tv === true` or `tv_pay` | Show **Subscription or paid-TV access may be required**. |
| `geo_restriction` text or `geo_restricted` | Show a geo warning using the neutral dataset text where available. |
| `event_only` | Show **Event only** and explain that ordinary daily availability is not implied. |
| Replay displayable but live non-displayable | Show **Replay only** for the row or affected side. |
| `confidence === 'low'` | Show **Source details not fully verified** and place below high/medium rows. |
| `confidence === 'not_checked'` | Do not render usable links; show **Not verified** if the row is retained. |

Warnings should be visible before or immediately next to the link they qualify.
They must not be hidden only in a tooltip.

## Empty states

Empty states should be conservative and should not invite users to search for
unofficial streams.

### Section-level empty states

Use when no rows are supplied after static filtering.

| State | Label | Helper text |
| --- | --- | --- |
| No audited records | **Not verified** | `No official live or replay source has been verified for this page yet.` |
| Research found no official source | **None found** | `No usable official live or replay landing page is listed in the static coverage data.` |
| Page type unsupported | **No official source listed** | `This page does not currently have a matching official source record.` |

### Row-level empty states

Use when a row is retained for explanatory value but both sides are non-linkable.

- `Not verified` when live and replay are both `not_verified`, the confidence is
  `not_checked`, or official URLs are missing.
- `None found` only when the static record explicitly uses `none_found`.
- `Replay only` only when replay is linkable and live is not.

## Japan split examples

Japan must render separate records because central racing, local government
racing, and banei racing are separate systems with separate source scope.

### Japan country page

A Japan country page may render multiple rows when the page context supports all
Japanese racing systems:

| Row | Scope label | Live | Replay | Warnings |
| --- | --- | --- | --- | --- |
| Japan — JRA | Central racing; thoroughbred flat and jumps | Official live | Official replay | None unless the static row adds access or geo text. |
| Japan — NAR | Local government thoroughbred racing | Official live | Official replay | Geo warning: live video is Japan-only; VOD is available overseas. |
| Japan — banei | Banei racing / Obihiro scope | Official live | Official replay | Geo warning for Chihokeiba live access and banei replay note. |

The component must not collapse these into one `Japan racing` row because that
would hide differences in racing type, source scope, and access rules.

### JRA racecourse page

A racecourse page for a JRA central racecourse such as Tokyo Racecourse may use
only the Japan — JRA row when the page's static racing types include
`thoroughbred-flat` or `jump-racing`. The row should be labeled as a JRA central
racing source, not as a Tokyo-owned stream.

### NAR racecourse page

A racecourse page for an NAR local-government racecourse may use the Japan — NAR
row only when the racecourse is statically classified for the matching NAR
racing type. It must show the geo warning from the NAR row close to the live
source.

### Banei racecourse page

A racecourse page for Obihiro or banei racing may use only the Japan — banei row
when the racecourse is statically classified as `banei-racing`. It must not
borrow the JRA or NAR thoroughbred rows.

## Racecourse page examples

### Country-level source on a racecourse page

For a racecourse page that receives a country- or authority-level row, render the
source with a scope qualifier:

```text
Official live — Japan Racing Association / JRA-VAN
Scope: JRA central racing
Open official live source
Official replay — Japan Racing Association / JRA-VAN
Open official replay source
```

This text says that the source covers the matching racing system. It does not
claim that the racecourse operates a dedicated stream.

### Racecourse-level source on a racecourse page

For a racecourse-owned or racecourse-specific row, show the racecourse scope:

```text
Official live — Banei Tokachi / Chihokeiba Live
Scope: Banei racing source
Open official live source
Official replay — Banei Tokachi / Chihokeiba Live
Open official replay source
Geo: Chihokeiba Live is Japan-only for live video; VOD is available overseas.
```

### Non-matching source withheld

If a racecourse has `banei-racing`, the component input should not include JRA
or NAR thoroughbred rows. If the input accidentally includes non-matching rows,
the component may hide them, but the preferred behavior is for the static adapter
to filter them before rendering.

## Official links only

The component accepts only pre-vetted official URL fields:

- use `official_live_url` for live links;
- use `official_replay_url` for replay links;
- never substitute `evidence_urls` for either side;
- never render direct media files, manifests, playlist URLs, iframes, mirrors,
  clipped videos, or unofficial social/video URLs;
- never turn a provider name into a web search link;
- never add affiliate, tracking, betting, account-signup, or odds links.

If a URL is missing, malformed, unofficial, or not a landing page, render the
side as status-only or fall back to an empty state. The component must remain a
static renderer: no embed, no runtime fetch, and official links only.

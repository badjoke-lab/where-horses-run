# Indonesia / SARGA.CO active-event live/replay recheck plan

Status: recheck plan  
Last updated: 2026-06-07

This document defines how to re-check Indonesia / SARGA.CO on an active racing event day before deciding whether to add a static live/replay record. It does not add UI behavior, runtime fetching, embedded media, direct media URLs, schedules, racecards, entries, results, payouts, predictions, or tips.

## Current state

Indonesia is the strongest post-Priority-3 recheck candidate.

The previous source review found:

- Indonesian Thoroughbred Association is listed as an Asian Racing Federation affiliate member.
- SARGA.CO operates an official horse-racing website with current events, an event gallery, and official social links.
- The SARGA.CO homepage links to the official `Sarga. Co` YouTube channel.
- A stable race-specific live landing page or stable official replay archive page was not verified during the initial pass.

Because the stable landing page threshold was not met, no static record was added.

## Recheck goal

Determine whether Indonesia / SARGA.CO should become a static live/replay record.

Possible outcomes:

| Outcome | Meaning | JSON action |
| --- | --- | --- |
| Verified official live surface | SARGA.CO or a clearly linked official channel provides a stable live-racing landing page. | Add a record with `live_status` set conservatively. |
| Verified official replay/archive surface | SARGA.CO or a clearly linked official channel provides a stable replay/archive surface for completed races. | Add or update `replay_status` conservatively. |
| Only event-specific social uploads found | Official channel exists, but no stable landing page or repeatable archive pattern is confirmed. | Keep hold status; no JSON record. |
| Only schedules/event pages found | Current events exist but no live/replay video surface is confirmed. | Keep hold status; no JSON record. |

## Sources to check

Check only official or clearly official-linked surfaces:

- SARGA.CO official website.
- SARGA.CO event page for the active meeting.
- Official `Sarga. Co` YouTube channel linked from SARGA.CO.
- Official social accounts linked from SARGA.CO.
- Official Indonesian Thoroughbred Association surface only if it links to the SARGA media surface.

Do not use:

- fan uploads;
- betting-affiliate pages;
- search snippets;
- unofficial restreams;
- direct media, playlist, or manifest URLs;
- copied event videos not linked from the official site or official channel.

## Active-event check steps

1. Open SARGA.CO during or near an officially listed event.
2. Confirm whether the event page links to a live page, official channel, or embedded player landing page.
3. Confirm whether the same official surface remains usable outside a single transient post.
4. Check the official `Sarga. Co` channel for live tabs, completed live streams, race videos, playlists, or event archives.
5. Classify live and replay separately.
6. Record access limitations if found, including account, region, age, or platform restrictions.
7. Preserve the scope as SARGA-operated Indonesian racing, not complete national coverage.

## Candidate JSON record if live is verified

Use only after stable official evidence is confirmed.

```json
{
  "jurisdiction_id": "indonesia-sarga",
  "country_or_region": "Indonesia — SARGA.CO",
  "racing_types": ["thoroughbred-flat"],
  "live_status": "official_free",
  "replay_status": "none_found",
  "provider_name": "SARGA.CO / PT Kuda Pacu Indonesia",
  "official_live_url": null,
  "official_replay_url": null,
  "requires_login": false,
  "requires_betting_account": false,
  "requires_paid_tv": false,
  "geo_restriction": null,
  "source_type": "racecourse, official_social",
  "evidence_urls": [],
  "confidence": "medium",
  "last_checked": null,
  "notes": "SARGA.CO official event and media surfaces should be treated as SARGA-operated Indonesian racing only. Do not claim complete national coverage."
}
```

If the verified surface is only an official social live channel rather than a stable website page, use `social_stream` instead of `official_free` if that remains the more accurate status.

If a stable official replay archive is verified, set `replay_status` to `replay_available` and add the stable archive landing page.

## Do-not-add conditions

Do not add a static record if any of the following remains true:

- only schedule/event information is visible;
- the official channel exists but there is no repeatable live or replay surface;
- videos are isolated uploads with no stable archive pattern;
- the source is not official or clearly linked from an official page;
- access terms cannot be classified safely;
- the only available link is a direct stream, playlist, manifest, or embed-only media URL.

## Next action

Wait for an active SARGA event day or a newly published official event/live page, then perform the recheck using this checklist. Do not add the JSON record until the threshold is met.

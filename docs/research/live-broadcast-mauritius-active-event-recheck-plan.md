# Mauritius / MBC + current operator active-event live/replay recheck plan

Status: recheck plan  
Last updated: 2026-06-07

This document defines how to re-check Mauritius on an active racing event day before deciding whether to add a static live/replay record. It does not add UI behavior, runtime fetching, embedded media, direct media URLs, schedules, racecards, entries, results, payouts, predictions, or tips.

## Current state

Mauritius is an active-event recheck candidate.

The previous source review found:

- The Mauritius Broadcasting Corporation official website exposes a generic `MBC Live` area.
- Current horse-racing-related programming was visible, including `Race Again` and Champ-de-Mars content.
- At the time checked, the generic live area displayed `NO LIVE STREAMING`.
- A stable race-specific official live page or official replay archive page was not verified from MBC, Mauritius Turf Club, another current operator, or an official partner.

Because the stable race-specific landing page threshold was not met, no static record was added.

## Recheck goal

Determine whether Mauritius should become a static live/replay record.

Possible outcomes:

| Outcome | Meaning | JSON action |
| --- | --- | --- |
| Verified official broadcaster live surface | MBC or another official broadcaster provides a stable race-specific live landing page. | Add a record with `live_status` set conservatively. |
| Verified official operator live surface | The current race operator provides or clearly links to a stable live-racing page. | Add a record with operator-specific scope. |
| Verified replay/archive surface | MBC, the current operator, or a clearly linked official partner provides a stable replay/archive surface. | Add or update `replay_status` conservatively. |
| Only programme pages found | Horse-racing programmes exist, but no live/replay race-video surface is confirmed. | Keep hold status; no JSON record. |
| Only generic live page found | Generic live page exists but no race-specific event coverage is verified. | Keep hold status; no JSON record. |

## Sources to check

Check only official or clearly official-linked surfaces:

- Mauritius Broadcasting Corporation official website.
- MBC Live / MBC 11 or any current official MBC racing programme page.
- The current official Mauritius race operator.
- Current Champ-de-Mars official operator or venue page if available.
- Official social accounts linked from MBC or the current race operator.
- Any official broadcaster or media partner linked by the current operator.

Do not use:

- fan uploads;
- betting-affiliate pages;
- search snippets;
- unofficial restreams;
- direct media, playlist, or manifest URLs;
- old operator pages unless they are still clearly current;
- copied event videos not linked from an official site or official channel.

## Active-event check steps

1. Confirm the current official racing operator before reviewing video surfaces.
2. Open the official operator site during or near an active Mauritius racing day.
3. Open MBC Live / MBC 11 during or near the same active event window.
4. Confirm whether any page specifically identifies live horse racing rather than generic live programming.
5. Confirm whether the same official surface remains usable outside a single transient notice.
6. Check MBC and operator-linked official channels for completed live streams, race videos, playlists, or event archives.
7. Classify live and replay separately.
8. Record access limitations if found, including account, region, age, platform, or broadcast-window restrictions.
9. Preserve the scope as Mauritius racing via the verified operator or broadcaster, not complete nationwide all-code coverage unless explicitly supported.

## Candidate JSON record if live is verified

Use only after stable official evidence is confirmed.

```json
{
  "jurisdiction_id": "mauritius-mbc-current-operator",
  "country_or_region": "Mauritius — MBC / current racing operator",
  "racing_types": ["thoroughbred-flat"],
  "live_status": "broadcast_partner",
  "replay_status": "none_found",
  "provider_name": "Mauritius Broadcasting Corporation / current racing operator",
  "official_live_url": null,
  "official_replay_url": null,
  "requires_login": false,
  "requires_betting_account": false,
  "requires_paid_tv": false,
  "geo_restriction": null,
  "source_type": "broadcaster, racecourse",
  "evidence_urls": [],
  "confidence": "medium",
  "last_checked": null,
  "notes": "Mauritius racing video evidence must be tied to the current official operator or an official broadcaster page. Do not infer routine live or replay coverage from generic MBC Live or programme pages alone."
}
```

If the verified source is a free official broadcaster page, use `broadcast_partner` or `official_free` according to the exact source relationship.

If the verified surface is only an official social live channel rather than a stable website page, use `social_stream` if that remains the more accurate status.

If a stable official replay archive is verified, set `replay_status` to `replay_available` and add the stable archive landing page.

## Do-not-add conditions

Do not add a static record if any of the following remains true:

- only generic MBC Live or programme information is visible;
- the official operator is unclear;
- only schedule or event information is visible;
- videos are isolated uploads with no stable archive pattern;
- the source is not official or clearly linked from an official page;
- access terms cannot be classified safely;
- the only available link is a direct stream, playlist, manifest, or embed-only media URL.

## Next action

Wait for an active Mauritius racing day or a newly published official race-media page, then perform the recheck using this checklist. Do not add the JSON record until the threshold is met.

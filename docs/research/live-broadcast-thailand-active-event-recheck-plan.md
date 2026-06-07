# Thailand / RBSC active-event live/replay recheck plan

Status: recheck plan  
Last updated: 2026-06-07

This document defines how to re-check Thailand / Royal Bangkok Sports Club (RBSC) on an active racing event day before deciding whether to add a static live/replay record. It does not add UI behavior, runtime fetching, embedded media, direct media URLs, schedules, racecards, entries, results, payouts, predictions, or tips.

## Current state

Thailand is an active-event recheck candidate.

The previous source review found:

- Royal Bangkok Sports Club is listed as a full member of the Asian Racing Federation.
- The official RBSC website contains horse-racing information and current race schedules.
- A stable official live-racing landing page or official replay archive page was not verified during the initial pass.

Because the stable landing page threshold was not met, no static record was added.

## Recheck goal

Determine whether Thailand / RBSC should become a static live/replay record.

Possible outcomes:

| Outcome | Meaning | JSON action |
| --- | --- | --- |
| Verified official live surface | RBSC provides or clearly links to a stable live-racing landing page. | Add a record with `live_status` set conservatively. |
| Verified official replay/archive surface | RBSC provides or clearly links to a stable replay/archive surface. | Add or update `replay_status` conservatively. |
| Only race schedules found | Horse-racing schedules exist but no live/replay video surface is confirmed. | Keep hold status; no JSON record. |
| Only event-specific social posts found | Official social pages exist, but no stable landing page or repeatable archive pattern is confirmed. | Keep hold status; no JSON record. |

## Sources to check

Check only official or clearly official-linked surfaces:

- RBSC official website.
- RBSC horse-racing page.
- RBSC event or race-day page for the active meeting.
- Official RBSC social accounts linked from the RBSC website.
- Any official broadcaster or media partner linked from RBSC.
- Asian Racing Federation profile only for organisation context, not for video evidence.

Do not use:

- fan uploads;
- betting-affiliate pages;
- search snippets;
- unofficial restreams;
- direct media, playlist, or manifest URLs;
- copied event videos not linked from the official site or official channel.

## Active-event check steps

1. Open the official RBSC site during or near an officially listed racing day.
2. Confirm whether the horse-racing or event page links to a live page, official channel, media partner, or embedded-player landing page.
3. Confirm whether the same official surface remains usable outside a single transient post.
4. Check official RBSC-linked social pages for live tabs, completed live streams, race videos, playlists, or event archives.
5. Classify live and replay separately.
6. Record access limitations if found, including account, region, age, or platform restrictions.
7. Preserve the scope as RBSC / Royal Bangkok Sports Club racing, not complete Thailand coverage.

## Candidate JSON record if live is verified

Use only after stable official evidence is confirmed.

```json
{
  "jurisdiction_id": "thailand-rbsc",
  "country_or_region": "Thailand — Royal Bangkok Sports Club",
  "racing_types": ["thoroughbred-flat"],
  "live_status": "official_free",
  "replay_status": "none_found",
  "provider_name": "Royal Bangkok Sports Club",
  "official_live_url": null,
  "official_replay_url": null,
  "requires_login": false,
  "requires_betting_account": false,
  "requires_paid_tv": false,
  "geo_restriction": null,
  "source_type": "racecourse, authority",
  "evidence_urls": [],
  "confidence": "medium",
  "last_checked": null,
  "notes": "RBSC official racing and media surfaces should be treated as RBSC-specific Thailand racing only. Do not claim complete national coverage."
}
```

If the verified surface is an official social live channel rather than a stable website page, use `social_stream` instead of `official_free` if that remains the more accurate status.

If a stable official replay archive is verified, set `replay_status` to `replay_available` and add the stable archive landing page.

## Do-not-add conditions

Do not add a static record if any of the following remains true:

- only schedule or event information is visible;
- the official site exists but does not provide or link to repeatable live/replay video;
- videos are isolated uploads with no stable archive pattern;
- the source is not official or clearly linked from an official page;
- access terms cannot be classified safely;
- the only available link is a direct stream, playlist, manifest, or embed-only media URL.

## Next action

Wait for an active RBSC racing day or a newly published official live/media page, then perform the recheck using this checklist. Do not add the JSON record until the threshold is met.

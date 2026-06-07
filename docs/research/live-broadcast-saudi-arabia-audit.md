# Saudi Arabia live/replay broadcast audit

Status: source-audit note  
Last updated: 2026-06-07

This note records the Priority 3 source audit for Saudi Arabia / Jockey Club of Saudi Arabia (JCSA). It is documentation-only and does not add UI behavior, runtime fetching, video embeds, direct stream URLs, calendar dates, racecards, odds, entries, results, payouts, predictions, or tips.

## Source finding

The JCSA official website includes `Live Racing Stream` links in both the Racing and Media navigation. The JCSA home page also includes a `Watch Live Racing` card described as live streaming of racing from Taif and Riyadh.

## Candidate record

```json
{
  "jurisdiction_id": "saudi-arabia-jcsa",
  "country_or_region": "Saudi Arabia — JCSA",
  "racing_types": ["thoroughbred-flat"],
  "live_status": "official_free",
  "replay_status": "none_found",
  "provider_name": "Jockey Club of Saudi Arabia",
  "official_live_url": "https://www.youtube.com/@Jockeyclubsaudi",
  "official_replay_url": null,
  "requires_login": false,
  "requires_betting_account": false,
  "requires_paid_tv": false,
  "geo_restriction": null,
  "source_type": "authority, official_social",
  "evidence_urls": [
    "https://jcsa.sa/en/",
    "https://www.youtube.com/@Jockeyclubsaudi"
  ],
  "confidence": "high",
  "last_checked": "2026-06-07",
  "notes": "JCSA official navigation links to Live Racing Stream and the home page describes Watch Live Racing as live streaming from Taif and Riyadh. No official replay archive landing page was verified in this pass."
}
```

## Conservative interpretation

- Treat this as JCSA official live evidence for Taif/Riyadh racing coverage.
- Do not treat it as guaranteed access from every location or every meeting.
- Do not record direct media, playlist, manifest, or embed URLs.
- Do not infer official replay availability from the live channel alone.
- Keep replay as `none_found` until a stable official replay/archive landing page is verified.

## Next action

Add the candidate record to `data/static/live-broadcast-coverage.json` and update the live/replay summary counts after a safe JSON edit pass.

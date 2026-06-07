# North Africa live/replay broadcast audit

Status: source-audit note  
Last updated: 2026-06-07

This note records the Priority 3 source audit for Egypt, Tunisia, and Algeria. It is documentation-only and does not add UI behavior, runtime fetching, video embeds, direct stream URLs, calendar dates, racecards, odds, entries, results, payouts, predictions, or tips.

## Summary

No live/replay static record is added from this pass.

The pass did not identify a stable official or clearly official-partner live/replay landing page suitable for `data/static/live-broadcast-coverage.json` for Egypt, Tunisia, or Algeria.

## Egypt

Status: hold / no static record added

Findings:
- Search results surfaced general horse-racing references and club-level material, but no stable official Egypt horse-racing authority, racecourse, broadcaster, or official-partner live/replay landing page was confirmed.
- No official live or replay landing page was verified.

Candidate status if later evidence is found:
- Use `none_found` only after an official authority/racecourse source is confirmed and reviewed.
- Do not add from unofficial clips, social reposts, search snippets, or generic club pages.

## Tunisia

Status: hold / no static record added

Findings:
- Ksar Said is identified as a Tunisian racecourse administered by the Société des courses hippiques de Tunis in external reference material.
- The pass did not verify a stable official live/replay landing page for the racecourse, authority, broadcaster, or official partner.

Candidate status if later evidence is found:
- Treat Ksar Said or any Tunisian evidence as racecourse-specific unless a national authority or official broadcaster page supports broader coverage.
- Do not infer live coverage from racecourse existence or event references.

## Algeria

Status: hold / no static record added

Findings:
- External reference material identifies Hippodrome du Caroubier as a horse-racing venue in Algiers.
- The pass did not verify a stable official live/replay landing page for an Algerian authority, racecourse, broadcaster, or official partner.

Candidate status if later evidence is found:
- Treat evidence as racecourse-specific unless official national evidence supports broader coverage.
- Do not use unofficial videos, restreams, social reposts, or historical venue pages as live/replay evidence.

## Why no JSON record was added

The project requires official or clearly official-partner evidence before a new live/replay record is added. This pass did not meet that threshold for any of the three targets.

## Next action

Continue Priority 3 with Colombia / Ecuador / Dominican Republic, where racecourse-specific official evidence may be easier to verify. Return to Egypt, Tunisia, and Algeria only if official authority, racecourse, broadcaster, or official-social surfaces are found.

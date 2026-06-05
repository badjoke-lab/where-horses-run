# Live/replay broadcast expansion targets

This document is a documentation-only planning list for expanding the live/replay audit beyond the completed v0 dataset. It does not add UI behavior, runtime fetching, video embeds, direct stream links, betting odds, entries, results, payouts, predictions, tips, racecards, or live/replay JSON records.

The jurisdictions below are **targets for future evidence review only**. Inclusion on this page is not evidence that live video, replay video, free access, account access, archive access, or full race coverage exists.

## Expansion rules

- New records require official or clearly official-partner evidence before they can be added to any public dataset.
- Acceptable evidence source types are limited to:
  - **authority**: national, regional, or breed/racing-code governing body;
  - **racecourse**: the official racecourse or racing-club operator;
  - **broadcaster**: a broadcaster named or linked by an authority or racecourse;
  - **official partner**: a platform, wagering operator, media partner, or archive partner clearly identified by an authority or racecourse;
  - **social**: official or official-partner social channels used as video landing pages.
- Do not add a record from an unofficial restream, scraper, forum, fan channel, search result snippet, betting affiliate page, shortened URL with unclear destination, direct media file, or playlist/manifest URL.
- Do not embed video. Do not store or expose direct stream URLs.
- Link only to official landing pages or official-partner landing pages.
- Do not claim complete coverage for a jurisdiction, racing code, racecourse, broadcaster, or archive. Use conservative wording such as "official source identified" or "source candidate under review" until record-level evidence has been audited.
- Treat live and replay separately. Official replay evidence does not prove live coverage, and official live evidence does not prove replay availability.
- Treat account, paid-TV, betting-account, age, location, and geo restrictions as access limitations, not as defects to hide.
- Do not research or record calendar dates, race dates, post times, racecards, odds, entries, results, payouts, predictions, or tips as part of this expansion list.

## Priority 1: likely high-value jurisdiction targets

These jurisdictions should be reviewed first because they are common racing jurisdictions or may fill notable gaps in the global live/replay map. This list is not evidence of video availability. Macau was removed from the Priority 1 target table after the PR-LIVE-021 inactive-racing audit added a conservative `none_found` record based on official Macao SAR Government closure evidence.

| Target jurisdiction | Racing systems to consider | Expected source type to verify | Notes for future audit |
| --- | --- | --- | --- |
| Argentina | Thoroughbred flat; racecourse-operated coverage | authority; racecourse; broadcaster; official partner; social | Verify whether evidence is racecourse-specific rather than national. |
| Brazil | Thoroughbred flat; regional racecourse coverage | authority; racecourse; broadcaster; official partner; social | Avoid treating one club or state as national coverage. |
| Panama | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Confirm whether live and replay surfaces are official and current before adding. |
| India | Thoroughbred flat; turf-club systems | authority; racecourse; broadcaster; official partner; social | Racing is often club-specific; avoid national complete-coverage claims. |
| Malaysia | Thoroughbred flat; turf-club systems | authority; racecourse; broadcaster; official partner; social | Verify club-specific rights and current official channels. |
| Philippines | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Confirm official status of any video platform and distinguish social clips from replay archives. |
| Italy | Thoroughbred flat; jumps where applicable; trotting/harness | authority; racecourse; broadcaster; official partner; social | Separate racing codes if official sources differ. |
| Germany | Thoroughbred flat; jumps where applicable; trotting/harness if separately governed | authority; racecourse; broadcaster; official partner; social | Avoid relying on non-official form, results, or betting portals as video evidence. |
| Spain | Thoroughbred flat; racecourse-operated coverage | authority; racecourse; broadcaster; official partner; social | Verify whether coverage is course-specific or national. |

## Priority 2: regional depth and code-specific targets

These targets may require more careful separation by racing code, region, or operator.

| Target jurisdiction | Racing systems to consider | Expected source type to verify | Notes for future audit |
| --- | --- | --- | --- |
| Austria | Thoroughbred flat; trotting/harness | authority; racecourse; broadcaster; official partner; social | Keep code-specific sources separate if they differ. |
| Belgium | Thoroughbred flat; trotting/harness | authority; racecourse; broadcaster; official partner; social | Verify whether any video evidence is official and not just betting-site redistribution. |
| Netherlands | Thoroughbred flat where applicable; trotting/harness | authority; racecourse; broadcaster; official partner; social | Confirm current official racecourse or authority coverage before adding. |
| Switzerland | Thoroughbred flat; jumps where applicable; snow racing if relevant; trotting/harness | authority; racecourse; broadcaster; official partner; social | Seasonal or event-specific coverage must be labeled event-only if used later. |
| Norway | Thoroughbred flat; trotting/harness | authority; racecourse; broadcaster; official partner; social | Do not infer thoroughbred coverage from harness coverage, or the reverse. |
| Finland | Trotting/harness; any thoroughbred activity if separately documented | authority; racecourse; broadcaster; official partner; social | Likely code-specific; record only what official evidence supports. |
| Poland | Thoroughbred flat; jumps where applicable; trotting/harness | authority; racecourse; broadcaster; official partner; social | Verify whether racecourse social video is official and stable enough for public linking. |
| Slovakia | Thoroughbred flat; jumps where applicable | authority; racecourse; broadcaster; official partner; social | Avoid promoting occasional event streams as routine coverage. |
| Serbia | Thoroughbred flat; trotting/harness if applicable | authority; racecourse; broadcaster; official partner; social | Confirm current official sources and whether evidence is racecourse-specific. |
| Greece | Thoroughbred flat status review | authority; racecourse; broadcaster; official partner; social | Confirm current racing and official video status before adding. |

## Priority 3: emerging, event-only, or high-caution targets

These targets may be valuable for completeness but should remain lower priority because evidence may be sparse, event-only, fragmented, inactive, or difficult to classify safely.

| Target jurisdiction | Racing systems to consider | Expected source type to verify | Notes for future audit |
| --- | --- | --- | --- |
| Saudi Arabia | Thoroughbred flat; event-focused coverage | authority; racecourse; broadcaster; official partner; social | Separate major-event coverage from ordinary domestic coverage. |
| Egypt | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Require clear official evidence before any public record. |
| Tunisia | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Avoid non-official social reposts and aggregator pages. |
| Algeria | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Require official or official-partner evidence at record level. |
| Colombia | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Confirm current official status and whether video is live, replay, or clips only. |
| Ecuador | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Treat social-only evidence cautiously unless clearly official. |
| Dominican Republic | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Verify official status of any racecourse or broadcaster page. |
| Guadeloupe | Thoroughbred flat; local racecourse coverage | authority; racecourse; broadcaster; official partner; social | Avoid assuming coverage from nearby jurisdictions or shared language markets. |
| Réunion | Thoroughbred flat; local racecourse coverage | authority; racecourse; broadcaster; official partner; social | Verify current official racecourse or federation evidence. |
| Mauritius | Thoroughbred flat | authority; racecourse; broadcaster; official partner; social | Confirm operator status, official channels, and whether archived material is current. |

## Racing systems to separate during future audits

Future records should avoid collapsing materially different systems when official sources, governing bodies, access rules, or video surfaces differ.

- Thoroughbred flat racing.
- Jump racing, including steeplechase and hurdle systems where separately organized.
- Trotting or harness racing.
- Racecourse-operated racing where no national video surface is verified.
- Event-only racing or festival coverage.
- Archive-only or historical replay surfaces.
- Official-social video surfaces that provide clips, live broadcasts, or replays without a stable website landing page.

## Known caution cases

- **Course-specific coverage**: One official racecourse stream or replay archive does not prove jurisdiction-wide coverage.
- **Code-specific coverage**: Harness, thoroughbred, jump, banei-style, or other code-specific evidence must not be generalized to other racing systems.
- **Event-only coverage**: Major festivals, international meetings, or one-off live broadcasts must not be described as routine live coverage.
- **Social-only video**: Official social channels can be acceptable only when clearly official or official-partner, but they may be unstable, clip-only, geo-limited, or difficult to classify as live versus replay.
- **Betting-account video**: Wagering-platform video may require account status, balance, age checks, location checks, or betting eligibility. Do not encourage sign-ups or betting behavior.
- **Paid-TV or subscription video**: Subscription access must be labeled conservatively and must not be described as free.
- **Geo-restricted video**: Do not infer access from a single location or preview page. Public copy should say that access may vary.
- **Inactive or changed racing operations**: Confirm current official status before adding records for jurisdictions or racecourses with closures, suspensions, operator changes, or discontinued meetings.
- **Unofficial mirrors and restreams**: Never use them as evidence, even if they appear high in search results or include official-looking race names.
- **Archive ambiguity**: A page containing historical clips, highlights, or news videos is not necessarily an official replay archive.

## Non-goals for this document

- No UI implementation.
- No changes to live/replay JSON data.
- No source research or evidence collection.
- No calendar, race-date, post-time, racecard, odds, entry, result, payout, prediction, or tip content.
- No video embeds.
- No direct stream URLs.
- No complete-coverage claims.

# Racecourse notable and graded-race display contract

Status: active racecourse programme specification  
Adopted: 2026-09-09  
Work ID: `WHR-RACECOURSE-NOTABLE-RACES-001`  
Applies to: `/tracks/[slug]/`, `/ja/tracks/[slug]/`, future race pages, racecourse-to-race navigation  
Parent UI authority: `docs/specs/map-first-site-ui-2026-09-06.md`  
Historical foundation: `docs/specs/racecourse-page-spec.md`  
Racecourse link authority: `docs/racecourses/page-link-architecture.md`

## Purpose

Racecourse pages currently contain `notable_races` entries whose external source URL may be venue-level or authority-level rather than race-specific. Rendering those URLs behind each race name creates misleading navigation and makes page quality depend on external deep-link stability.

This contract separates the visible race name from external evidence and defines the staged path from a simple representative-race list to an internal graded-race dictionary and racecourse history.

## Immediate public display rule

Until an internal race entity/page contract is implemented:

```text
racecourse page -> notable race name = text only
```

The race name must not become an external anchor from any of these legacy fields:

```text
source_url
official_link
url
```

Those fields may remain in reviewed data as evidence/provenance inputs, but they do not authorize a public race-name link.

Venue, authority, schedule, visitor, and other reviewed official links belong in the existing `Official sources / 公式情報源` section.

The immediate correction must preserve the race names themselves. It removes misleading navigation; it does not delete representative-race content.

## Representative-race scope

The initial public list is a concise editorial summary, not a completeness claim.

Target presentation:

```text
Notable races / 主なレース
- representative race A
- representative race B
- representative race C
```

Prefer roughly 3–5 genuinely representative races when the reviewed dataset supports that selection. Existing longer lists may remain temporarily while selection quality is being audited; the display contract does not require deleting names merely to hit a numeric target.

## External-link boundary

Do not link a race name directly to:

- a racecourse home/guide page;
- an authority home page;
- a generic racing calendar;
- a result archive;
- an unstable annual/deep route;
- an unofficial mirror.

A reviewed race-specific external source may be stored as evidence, but the future preferred public navigation remains an internal WHR race page.

## Future canonical model

The racecourse record must eventually stop treating free-form `notable_races` names as the canonical race identity. The target relation is:

```text
racecourse -> race_id[]
race_id -> canonical race record
```

A future race record should support, at minimum where reviewed:

```text
race_id
slug
name_en
name_ja
name_local
country_id
racing_system / authority_id
current_status
current_grade_or_classification
current_racecourse_id
distance
surface / discipline
eligibility / conditions
founded_year
current_official_sources
```

Historical extensions may add:

```text
name_history
grade_history
racecourse_history
status_history
suspension / discontinuation / revival history
```

## Future public navigation

When internal race pages exist:

```text
racecourse page
  -> /races/[race-slug]/
  -> reviewed race record
  -> reviewed official sources
```

The racecourse page should then distinguish:

1. `Notable races / 主な重賞` — a short representative subset;
2. `Graded races at this racecourse / この競馬場で行われる重賞` — current complete set when the applicable system has been researched to a defensible completeness level;
3. `Past graded races / 過去に開催された重賞` — historical racecourse relationships when researched.

Closed racecourses remain eligible for historical race relationships. A race moved from racecourse A to racecourse B may remain visible on A as a past relationship while B carries the current relationship.

## Graded-race programme order

The implementation/research sequence is fixed as:

```text
1. correct current representative-race display
2. audit and improve representative-race selection
3. build active graded-race master by racing system
4. create internal race pages and race_id relations
5. connect complete active graded-race lists to racecourse pages
6. add discontinued / renamed / moved graded races
7. connect closed racecourses to historical graded-race relationships
```

Do not block the immediate text-only correction on completion of the later research programme.

## Data migration rule

Legacy data may keep:

```text
notable_races[].name_en
notable_races[].name_ja
notable_races[].source_url
```

for compatibility while the race master is being built.

Runtime public display must treat legacy external URLs as evidence-only. A later migration may replace or supplement the legacy array with stable `race_id` references.

## Regression requirements

For the immediate correction:

- every visible notable-race name is plain text;
- legacy `source_url`, `official_link`, or `url` values are not used as the race-name href;
- Official Sources remains independently clickable where reviewed;
- EN/JA race names remain localized as before;
- missing `notable_races` continues to omit the subsection rather than render placeholders;
- no participant, betting, result, payout, prediction, raw-source, or stream boundary is weakened.

## Completion condition for WHR-RACECOURSE-NOTABLE-RACES-001

The bounded correction is complete when:

1. this contract and the active racecourse roadmap are present in the repository;
2. agent entry instructions point future racecourse notable/graded-race work to them;
3. `RacecourseDetailPage.astro` renders legacy notable-race names as text only;
4. a permanent read-only regression check prevents legacy external race-name anchors from returning;
5. build/CI and representative EN/JA racecourse-page rendering pass on the exact PR head;
6. the merge preserves current main changes from parallel Calendar and racecourse inventory lanes.

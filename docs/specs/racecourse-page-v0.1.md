# Racecourse Page v0.1 Specification

Status: proposed baseline
Scope: English and Japanese racecourse detail pages

## 1. Purpose

A racecourse page must explain:

- where the racecourse is;
- what kind of racing and course layouts it has;
- how large the venue is when reliable capacity data exists;
- when racing is scheduled or where the official schedule can be checked;
- which notable races are associated with the venue;
- which official and supporting sources were used.

The page is not a replacement for official racecards, odds, results, payouts, predictions, betting services, or video streams.

## 2. Page order

The page order is fixed as follows:

1. Hero
2. Overview
3. Quick facts
4. Schedule gateway
5. Course layout
6. Race distances
7. Notable races
8. Seasonality
9. Venue scale
10. Location and access
11. Official links
12. Related pages
13. Data status

## 3. Hero

Required:

- English and Japanese racecourse names;
- local name when different;
- country, city, and region;
- current schedule state;
- primary official schedule CTA when available.

Allowed schedule states:

- racing today;
- no racing today;
- upcoming meeting found;
- official-link-only;
- not checked yet.

Raw values such as `unknown` or `official-link-only` must not be shown directly to general users. They must be converted into readable English and Japanese labels.

## 4. Overview

Required fields:

- `overview_en`;
- `overview_ja`.

The overview should briefly explain:

- the venue's location and role;
- its operator or racing authority;
- its main racing types;
- one or two defining features;
- notable races when relevant.

The overview must remain descriptive and neutral. It must not include betting advice, course bias claims, predictions, or unsupported statements about favourable running styles or draw positions.

## 5. Quick facts

Display confirmed values only.

Candidate fields:

- country;
- city;
- region;
- timezone;
- operator;
- venue status;
- racing types;
- surfaces;
- direction;
- representative course length;
- inner or outer course availability;
- jump course availability;
- opening year;
- total capacity;
- seating capacity.

Unconfirmed rows should normally be omitted rather than displayed as a large block of empty values.

## 6. Schedule gateway

The schedule section must provide:

- today's meeting state;
- next known meeting date;
- a short list of upcoming meetings when available;
- a link to the site's relevant calendar or timetable route;
- a direct official schedule link when available;
- a clear fallback explanation when schedule data is not verified.

The page may show safe timetable facts such as date, first post, last post, and race count when the project already holds a permitted derived record.

The page must not republish:

- complete racecards;
- runner lists;
- odds;
- selections or predictions;
- payouts;
- full detailed results;
- official video.

## 7. Course layout

Course layout describes the physical layout of the venue. It is separate from race distances.

Supported layout groups:

- turf;
- dirt;
- all-weather;
- jump;
- harness or trotting;
- banei or another special course type.

Candidate data:

- course names or rail configurations;
- circumference;
- home-straight length;
- direction;
- inner or outer layout;
- elevation or gradient notes;
- concise neutral course notes.

The UI must show only relevant course groups. For example, a turf-only venue must not show empty harness and banei rows.

## 8. Race distances

Race distances describe actual configured race distances and must not be inferred from course circumference.

Supported groups:

- turf distances;
- dirt distances;
- all-weather distances;
- jump distances;
- harness or trotting distances;
- special-format distances.

Rules:

- show only distances supported by an acceptable source;
- attach a source or source status;
- hide the section when no race-distance data is verified;
- do not display legacy course-circumference values as race distances.

## 9. Notable races

Each notable race may include:

- `name_en`;
- `name_ja`;
- grade or classification;
- approximate season or month;
- surface;
- distance;
- short neutral summary;
- official or acceptable source URL.

The first view should prioritise a limited set of defining races, with an optional expanded list when many races are stored.

## 10. Seasonality

The seasonality section may explain:

- year-round or seasonal operation;
- typical meeting windows;
- number of meetings when reliably known;
- regional role such as summer, winter, metropolitan, or local-circuit racing.

Specific annual dates must come from current schedule data rather than a static descriptive field.

## 11. Venue scale

Capacity is part of the racecourse profile because it helps users understand venue scale.

Supported fields:

- total capacity;
- seating capacity;
- standing capacity;
- as-of year;
- English and Japanese notes;
- source URL;
- source type;
- status;
- last checked date.

Source priority:

1. official racecourse or operator material;
2. racing authority or public venue documentation;
3. reliable secondary source;
4. unknown or omitted.

Allowed source types:

- `official`;
- `authority`;
- `secondary`;
- `unknown`.

Allowed statuses:

- `verified`;
- `secondary`;
- `partial`;
- `stale`;
- `unknown`.

Rules:

- capacity values must not be negative;
- a capacity figure must carry a source URL, source type, status, and last-checked date;
- older figures must include an as-of year or explanatory note when known;
- capacity must be omitted when it cannot be sourced responsibly;
- the UI may show a neutral scale note such as "one of the country's larger racecourses" only when supported by the recorded data or source.

## 12. Location and access

Display:

- city and region;
- address only when safely sourced;
- official access or visitor link;
- optional short access note.

The site should prefer official access information over independently maintained transport instructions. Frequently changing route details should not be copied into static text.

## 13. Official links

Links should be grouped by purpose:

- official racecourse page;
- official schedule or fixtures;
- official course details;
- official access page;
- official racecard;
- official results;
- operator or authority home page.

Racecard and result links are routing links only. Their full content is not republished.

## 14. Related pages

Provide internal links where available:

- country profile;
- country calendar;
- racing-type page;
- glossary entries;
- country source page;
- relevant timetable route.

## 15. Data status

The final section must identify:

- course-profile status;
- schedule status;
- race-distance status;
- capacity status;
- source-routing status;
- last checked date.

Readable labels must be used in the UI. Raw internal status values may remain in data and validation.

## 16. Proposed content model

The implementation should support these additions while preserving temporary compatibility with existing racecourse records:

```text
overview_en
overview_ja

operator
  name_en
  name_ja
  operator_type
  official_url

history
  opened_year
  current_site_opened_year
  renovation_note_en
  renovation_note_ja

capacity_profile
  total_capacity
  seating_capacity
  standing_capacity
  as_of_year
  note_en
  note_ja
  source_url
  source_type
  status
  last_checked

course_layout
  turf_courses
  dirt_courses
  all_weather_courses
  jump_courses
  harness_courses
  banei_course
  home_straight_m
  elevation_note_en
  elevation_note_ja
  inner_outer_note_en
  inner_outer_note_ja

race_distances
  turf_distances_m
  dirt_distances_m
  all_weather_distances_m
  jump_distances_m
  harness_distances_m
  special_distances_m
  source_url
  status
  last_checked

visitor_links
  official_racecourse
  official_schedule
  official_course_details
  official_access
  official_racecard
  official_results
```

Existing `course_profile`, `distance_profile`, `official_links`, `notable_races`, and `schedule_summary` fields remain available during migration.

## 17. Compatibility rules

During migration:

- prefer `course_layout` when present;
- fall back to `course_profile` for legacy records;
- display `race_distances` only when explicitly present and verified;
- do not reinterpret legacy `distance_profile` as actual race distances;
- preserve existing pages while JRA records are migrated in batches;
- hide optional sections with no usable data.

## 18. Locale parity

English and Japanese pages must use the same section order, data status, and feature coverage.

A shared component or view-model layer should be used so that one locale cannot silently drift behind the other.

## 19. Mobile and accessibility requirements

The page must:

- remain readable at 360 px width;
- use a single-column flow where necessary;
- keep the primary official schedule CTA visible near the top;
- use proper heading order;
- avoid horizontal table overflow;
- expose clear external-link labels;
- avoid relying on colour alone for status;
- support keyboard navigation.

## 20. SEO requirements

Each page should support:

- unique English and Japanese title and description;
- canonical URL;
- hreflang links;
- breadcrumb navigation;
- structured data appropriate to a place or sports venue when technically suitable;
- stable racecourse slug;
- descriptive overview text rather than thin template-only content.

## 21. v0.1 acceptance criteria

Racecourse Page v0.1 is complete when:

- the venue's location and defining features are clear immediately;
- schedule confirmation routes are easy to find;
- racing types, surfaces, and direction are understandable;
- course circumference and actual race distances are not confused;
- notable races include useful structured information when sourced;
- capacity is displayed only with source and freshness status;
- empty irrelevant course types are hidden;
- English and Japanese structures match;
- mobile presentation is readable;
- official schedule, course, and access links are available when recorded;
- the site does not republish prohibited racecard, odds, prediction, payout, or video content.

## 22. Out of scope for v0.1

- original betting advice or course-bias analysis;
- odds and wagering tools;
- complete racecards and runner databases;
- complete result and payout databases;
- venue photography licensing work;
- detailed food, seating, hospitality, and tourism guides;
- copied transport directions that require frequent maintenance;
- generated racecourse illustrations and course diagrams.

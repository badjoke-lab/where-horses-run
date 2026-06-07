# Racecourse Profile Content Model v0.1

Status: adopted for trial implementation
Scope: racecourse detail pages only
Locales: English and Japanese

## 1. Page purpose

A racecourse page explains where the venue is, how large it is, how its course is structured, what racing it hosts, which notable races are associated with it, and where users can confirm current official schedules and venue information.

The page is not a betting, prediction, odds, entries, results, payout, video, or full-racecard replacement.

## 2. Required page sections

1. Hero
2. Overview
3. Quick facts
4. Schedule gateway
5. Course layout
6. Race distance profile
7. Notable races
8. Seasonality
9. Official and visitor links
10. Related learning
11. Data status

## 3. Hero

Display:

- English name
- Japanese name
- local name where different
- country
- city and region
- current schedule state
- primary official schedule CTA when available

## 4. Overview

Fields:

- `overview_en`
- `overview_ja`

The overview should explain:

- where the racecourse is
- its role in the national or regional racing system
- its primary racing types
- one or two defining venue characteristics

Avoid betting advice, unsupported course-bias claims, and promotional language.

## 5. Quick facts

Display, when available:

- country
- city
- region
- timezone
- operating status
- operator name and type
- racing types
- surfaces
- direction
- representative course length
- home straight length
- inner / outer course availability
- total capacity
- seating capacity

Unknown optional values should not be replaced with guesses.

## 6. Operator

Object: `operator`

Fields:

- `name`
- `type`
- `url`

Suggested `type` values:

- `national-authority`
- `regional-authority`
- `race-club`
- `private-operator`
- `public-operator`
- `other`
- `unknown`

## 7. Capacity profile

Object: `capacity_profile`

Fields:

- `total_capacity`
- `seating_capacity`
- `standing_capacity`
- `scale_note_en`
- `scale_note_ja`
- `source_url`
- `source_type`
- `status`
- `last_checked`

Allowed `source_type` values:

- `official`
- `authority`
- `secondary`
- `unknown`

Allowed `status` values:

- `verified`
- `partial`
- `secondary`
- `stale`
- `unknown`

Rules:

- Do not infer total capacity from seating capacity.
- Do not label a secondary-source figure as verified.
- Use `null` where no reliable figure is available.
- Keep the source and last-checked date attached to the figure.
- Capacity figures may change after renovation or operating-policy changes.

## 8. Schedule gateway

Display:

- racing today / no racing today / not verified
- next meeting date
- upcoming meeting rows when verified
- internal calendar link
- official schedule link

When the schedule is not verified, use a clear human-readable message rather than exposing only `unknown`.

## 9. Course layout

Object: `course_layout`

Fields:

- `turf_courses`
- `dirt_courses`
- `jump_courses`
- `all_weather_courses`
- `harness_courses`
- `banei_courses`
- `home_straight_m`
- `elevation_note_en`
- `elevation_note_ja`
- `inner_outer_note_en`
- `inner_outer_note_ja`
- `source_url`
- `status`

Each course array may contain objects such as:

- `label`
- `circumference_m`
- `direction`
- `surface`
- `note_en`
- `note_ja`

Course circumference must not be presented as a race-distance range.

## 10. Race distance profile

Object: `race_distance_profile`

Fields:

- `turf_distances_m`
- `dirt_distances_m`
- `jump_distances_m`
- `all_weather_distances_m`
- `harness_distances_m`
- `source_url`
- `status`
- `last_checked`

This section contains actual race distances used at the venue, not course circumferences. It should only be shown where source-safe values have been confirmed.

## 11. Notable races

Each notable-race record may include:

- `name_en`
- `name_ja`
- `grade`
- `surface`
- `distance_m`
- `season`
- `note_en`
- `note_ja`
- `source_url`

The page may show only fields that are available. A race name alone remains valid for legacy records.

## 12. Seasonality

Display:

- year-round, seasonal, or limited-meeting character where confirmed
- a concise English and Japanese summary
- status and source state

Do not derive precise future meeting dates from a general seasonality statement.

## 13. Official and visitor links

Object: `visitor_links`

Fields:

- `official_racecourse`
- `official_schedule`
- `official_course_details`
- `official_access`
- `official_racecard`
- `official_results`

These are outbound links only. Where Horses Run does not republish full official racecards, odds, results, payouts, or video.

## 14. Related learning

Link to:

- country page
- racing-type pages
- glossary entries
- country source registry

## 15. Data status

Display:

- course profile status
- schedule status
- source-routing status
- capacity status when present
- race-distance status when present
- last checked

## 16. Trial rollout

1. Add the optional model without changing existing records.
2. Apply the model to Tokyo Racecourse only.
3. Update English and Japanese racecourse-detail pages.
4. Review desktop and mobile output.
5. After approval, migrate the remaining JRA racecourses.
6. Add Kokura Racecourse using the approved model.

## 17. Acceptance criteria

- Venue scale is understandable near the top of the page.
- Capacity and seating capacity are not conflated.
- Course circumference and actual race distance are separated.
- Current schedule and official schedule links are easy to find.
- Unknown values are not guessed.
- English and Japanese pages have equivalent structure.
- The page remains useful without images.
- The public page does not expose internal operating notes.

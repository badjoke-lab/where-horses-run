# Calendar Public v1 bilingual navigation QA

Status: active

Work ID: `WHR-CAL-PUBLIC-V1`

Implementation unit: `PUBLIC-V1-NAVIGATION-QA-01`

## Purpose

Calendar Public v1 must keep English and Japanese routes paired across the static site. The language switch, canonical URL, alternate-language metadata, meeting-detail back links, and internal route targets must all resolve to rendered pages.

This QA is intentionally separate from timetable-content validation. It checks navigation and rendered route integrity only.

## Findings corrected

1. English meeting-detail pages did not pass an explicit alternate route. `BaseLayout` therefore sent the language switch to the Japanese home page instead of the matching Japanese meeting detail.
2. Japanese meeting-detail pages linked to `/ja/major-countries/current-timetable/`, but that route was not rendered.

The fix adds route-aware alternate inference in `BaseLayout` for known bilingual route families and adds the Japanese current-timetable page. Pages that already provide an explicit `alternatePath` continue to override inference.

## Deterministic checks

The Actions gate builds the static site and verifies:

- thirteen static English/Japanese route pairs;
- country, racecourse, racing-type, glossary, source, and meeting-detail dynamic route parity;
- reciprocal canonical and `hreflang` metadata;
- English and Japanese language-switch targets;
- `x-default` pointing to the English route;
- meeting-detail links back to Calendar, Today, and Current Timetable;
- all audited internal page links resolve to rendered routes;
- the Japanese current-timetable page uses the localized meeting list;
- no orphan English or Japanese dynamic route remains.

The machine-readable contract is stored at `data/audits/calendar-public-v1-navigation-qa-v1.json`.

## Safety boundary

This implementation performs no network fetch, canonical-data write, public-dataset write, approval, promotion, publication, or deployment. It reads repository source and generated public data, builds the static site, and validates the rendered output.

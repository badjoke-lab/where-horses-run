# Mobile navigation improvement

Status: complete  
Work ID: `WHR-SEARCH-FILTER-SEO-V1`  
Implementation unit: `MOBILE-NAVIGATION-IMPROVEMENT-01`  
Reviewed: 2026-07-17

## Purpose

The shared bilingual site header now provides a compact mobile navigation that does not depend on JavaScript.

The previous header displayed all links as one wrapping row. On narrow screens the header changed to a vertical layout, but the navigation remained an ungrouped collection of wrapped links. The new structure uses the browser-native `details` and `summary` elements to provide an explicit Menu / メニュー control.

## Navigation scope

Each locale preserves eight primary destinations:

```text
Today / 今日
Calendar / カレンダー
Search / 検索
Countries / 国・地域
Racecourses / 競馬場
Racing Types / 競馬種別
Glossary / 用語
Sources / ソース
```

Each locale also preserves one language switch. The complete menu therefore contains nine links per locale.

English routes:

```text
/today/
/calendar/
/search/
/countries/
/tracks/
/types/
/glossary/
/sources/
```

Japanese routes use the corresponding `/ja/` prefix.

## Native mobile behavior

The menu container is a native `details` element and the control is its `summary` element.

On screens at or below 720 pixels:

- the menu starts closed;
- the brand and Menu / メニュー control remain in the header;
- opening the control reveals a vertical list;
- every navigation target has a minimum height of 44 pixels;
- list separators make individual targets distinguishable;
- the active section is marked with `aria-current="page"`;
- the language switch retains `hreflang` metadata;
- keyboard focus receives a visible outline.

No click listener, custom state machine, cookie, local storage value, or server request is needed.

## Desktop preservation

Above 720 pixels the `summary` control is hidden and the navigation remains visible even though the `details` element has no `open` attribute.

The existing wrapped desktop navigation is therefore preserved for PR-118, which owns broader desktop layout changes.

## Static-first and no-JavaScript boundary

The complete navigation HTML is present in every rendered page.

On mobile, the browser's native `details` behavior opens and closes the menu without JavaScript. On desktop, an author stylesheet exposes the navigation independently of the `open` state.

The existing Skip to content / 本文へ移動 link remains before the site shell.

## Public and privacy boundary

The implementation changes only navigation structure and presentation.

It adds no:

- interaction logging;
- analytics;
- cookies;
- client storage;
- external navigation service;
- automatic route generation;
- deployment behavior.

All existing publication, source, glossary, timetable, racecourse, and country boundaries remain unchanged.

## Validation

The permanent checker is:

```text
scripts/check-mobile-navigation-improvement.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/mobile-navigation-improvement.yml
```

The gate builds the complete site, preserves the completed search and filter contracts, checks the shared layout and dedicated stylesheet, verifies the English and Japanese home pages plus representative section pages, confirms all nine links per locale, checks active-page and language metadata, rejects JavaScript and storage dependencies, and proves the repository remains clean.

## Next implementation unit

```text
DESKTOP-LAYOUT-IMPROVEMENT-01
```

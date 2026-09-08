# Where Horses Run — Calendar row rank, live-link, localization, and context-state specification

Status: active canonical Calendar presentation refinement  
Adopted: 2026-09-08  
Last amended: 2026-09-08  
Applies to: Calendar/Today List row state semantics, current-day rank boundary, Today vs Calendar grouping, official-stream presentation, EN/JA labels, country/authority/racecourse display names, List/Month/Map naming and state parity  
Parent Calendar specification: `docs/specs/calendar-meeting-state-stream-and-view-2026-09-08.md`  
Active execution schedule: `docs/calendar/calendar-presentation-state-001-display-correction-schedule.md`

This specification refines public presentation only. It does not alter acquisition, canonical meeting facts, public rank calculation/promotion, reviewed source authority, racecourse coordinates, race-level publication boundaries, or official-stream detector truth.

Where this document is more specific than the parent Calendar presentation specification for the subjects named above, this document controls.

## 1. Public-rank boundary for current-day meeting state

The public rank boundary for precise lifecycle presentation is **B+**.

The public coverage model is:

```text
C  = meeting only
B  = first race time only
B+ = first + last race times
A  = race times
A+ = programme summary
```

Therefore:

### B+ / A / A+

When the focused meeting is on the current Calendar day and reviewed first/last timing is sufficient, the UI may expose precise lifecycle state:

```text
before first race  -> Upcoming / 開催前
within race window -> Racing now / 開催中
after last race    -> Finished / 終了
```

The lifecycle evaluator remains source/venue-local-time authoritative. Display timezone may alter projection/grouping but must not rewrite the underlying lifecycle truth.

### B / C

B and C do **not** have sufficient reviewed evidence to infer the complete race window. On the current Calendar day they must not be presented as precise `upcoming`, `running`, or `finished` merely from partial/no timing evidence.

The public current-day state label is:

```text
EN: Today meeting
JA: 本日開催
```

Do not derive `Racing now` from a B first-race time alone. Do not derive `Finished` for B/C without reviewed last-race evidence.

For non-current dates, presentation may state the date/scheduled meeting context but must not fabricate a precise intraday lifecycle for B/C.

## 2. Presentation-state authority

The public grouping, row-color, Map marker, Map legend, and selected-card state must use one presentation-state model derived from reviewed meeting facts plus the active date context.

The supported public presentation keys are:

```text
running   -> Racing now / 開催中
upcoming  -> Upcoming / 開催前
today     -> Today meeting / 本日開催
future    -> Scheduled / 開催予定
ended     -> Finished / 終了
unknown   -> neutral / no invented status
```

`meeting lifecycle state` remains a separate underlying dimension. The presentation layer must not independently recalculate or reinterpret lifecycle state in Today, Calendar List, Map, summary counts, or selected cards.

In particular:

- `Today meeting / 本日開催` is not an alias of `Upcoming / 開催前`;
- `future / Scheduled` is not a fallback for an unresolved current-day B/C meeting;
- Today and Calendar must not maintain separate ad hoc bucket rules for the same meeting;
- List grouping, summary counts, Map marker status, Map legend, and selected-card status must agree for the same meeting/context.

## 3. Today surface context rules

The Today surface has three user-visible ranges: `Today`, `Tomorrow`, and `7 days`.

### 3.1 Today range

When the active range is **Today**, every visible current-day meeting must appear in exactly one of these public groups when evidence supports a state:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

`Scheduled / 開催予定` is **not a valid Today-range group for a current-day meeting**.

A current-day B/C meeting or another current-day meeting lacking the evidence required for precise lifecycle presentation must not fall through to `Scheduled`. It uses `Today meeting / 本日開催` when its day-level meeting identity is reviewed.

The following combined headings are prohibited:

```text
Upcoming / racing today
開催前・本日開催
```

`Upcoming` and `Today meeting` are distinct groups, counts, colors, markers, and labels.

### 3.2 Tomorrow range

When the active range is **Tomorrow**, visible meetings are future-day schedule items from the current instant. They are presented as:

```text
Scheduled / 開催予定
```

Do not label tomorrow's meetings `Racing now`, `Upcoming`, `Today meeting`, or `Finished` merely because their reviewed source-local times are known.

### 3.3 Seven-day range

When the active range is **7 days**:

- records whose projected Calendar day is the current day use the current-day presentation states from section 3.1;
- records on later days use `Scheduled / 開催予定`;
- future days must not be merged into the current-day `Upcoming` group;
- date grouping remains visible so future scheduled meetings retain their date context.

The surface may show only groups that actually contain visible meetings, but it must never collapse `Upcoming` and `Today meeting` into one heading.

## 4. Calendar date-context rules

Calendar is a date-focused discovery surface. Its List and Map presentation depends on the selected Calendar date.

### 4.1 Calendar with today's date selected

When the selected Calendar date is the current Calendar day, Calendar List and Calendar Map use the same current-day presentation states as Today:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

`Scheduled / 開催予定` must not appear merely because a current-day row lacks precise timing evidence.

### 4.2 Calendar with a future date selected

When a future Calendar date is selected, meetings on that date are presented as:

```text
Scheduled / 開催予定
```

Do not expose current-day labels (`Racing now`, `Upcoming`, `Today meeting`, `Finished`) for a future selected date.

### 4.3 Calendar Month

Month remains an overview/date-navigation surface. It derives counts and date presence from the same filtered public meeting set and does not invent a separate intraday state model.

## 5. Row-background semantics

State color is a presentation of current-day meeting state, not a raw rank color.

For List rows:

```text
running / 開催中                  -> #fff7f6
upcoming / 開催前                 -> #fff9e9
today / 本日開催                  -> #fffcf4
ended / 終了                      -> #f6f7f8, attenuated
future / 開催予定                 -> #ffffff neutral
unknown / unsupported             -> #ffffff neutral
```

The pale `#fffcf4` state exists specifically so day-only B/C evidence does not visually imply the more precise `Upcoming / 開催前` state.

The stronger yellow `#fff9e9` is reserved for precise current-day `Upcoming / 開催前`. A future meeting must not receive that yellow merely because its start instant is in the future.

The rank badge remains visible independently of row state color.

## 6. Map-status semantics

Map uses the same presentation state as List for the same visible meeting/context.

Marker colors are:

```text
running       -> red marker       #c40000
upcoming      -> orange marker    #d18a00
today         -> pale warm marker #fffcf4 with a dark warm outline/ring
future        -> neutral black    #111111
ended         -> gray             #666666
```

Map code must not collapse `today` into `upcoming` and must not independently derive a different state from partial timing fields.

### 6.1 Today Map legend

For the Today range, the Map legend is restricted to current-day semantics:

```text
Racing now / 開催中
Upcoming / 開催前
Today meeting / 本日開催
Finished / 終了
```

Do not show `Scheduled / 開催予定` in the Today-range Map legend.

### 6.2 Calendar Map legend

When today's date is selected, Calendar Map uses the same four current-day legend states as Today.

When a future date is selected, Calendar Map uses only the future schedule meaning:

```text
Scheduled / 開催予定
```

The legend may omit zero-count states, but it must not show state categories that are invalid for the active date context.

### 6.3 Map selected card

The selected-card status must use the exact same presentation state as the corresponding List row. Examples:

```text
B/C current day -> Today meeting / 本日開催
B+/A/A+ current day before first -> Upcoming / 開催前
future selected date -> Scheduled / 開催予定
```

No Map-only reinterpretation is permitted.

## 7. Official-stream presentation

Meeting lifecycle state and official-stream state remain independent.

The separate visible `Official stream live` / `公式配信中` badge is removed from Calendar meeting rows. A verified-live stream is represented only by the official-stream link itself.

Exact verified live:

```text
EN: ● Live now ↗
JA: ● 公式配信中 ↗
```

Official destination known but not verified live now:

```text
EN: Official stream ↗
JA: 公式配信 ↗
```

The verified-live link may use a restrained red live accent, but it must not create another large status pill competing with the meeting-state badge.

Detector binding/fail-closed rules from the parent Calendar specification remain unchanged. Wrong-date, stale, unavailable, ended, offline, upcoming, unknown, or otherwise mismatched detector data must not render as live.

Calendar must not synthesize direct video/watch URLs from detector payloads. Public stream links remain on reviewed official destinations/landing pages allowed by the applicable media-publication contract.

## 8. Official stream and official site are separate actions

The Calendar row keeps stable semantic action slots.

```text
meeting state | official stream | details | official site
```

If the reviewed official-stream destination URL and the reviewed official-site/source URL happen to be identical, **do not deduplicate the visible actions merely because the href values match**.

The labels describe different user intents. URL equality must not make row structure change unpredictably from one meeting to another.

## 9. Japanese UI localization boundary

Known UI/ordinary-language labels must be localized on `/ja/` surfaces.

Required examples include:

```text
Map             -> 地図
Details         -> 詳細
Upcoming        -> 開催前
Racing now      -> 開催中
Finished        -> 終了
Today meeting   -> 本日開催
Scheduled       -> 開催予定
Official stream -> 公式配信
Live now        -> 公式配信中
Official site   -> 公式サイト
Filters         -> 絞り込み
Country         -> 国
Racecourse      -> 競馬場
Authority       -> 主催
```

Latin characters are not themselves an error. Proper nouns and recognized abbreviations may remain Latin where that is the reviewed/appropriate public form.

## 10. Country display names

Country identity remains canonical. Only the presentation label changes by locale.

Examples:

```text
EN                   JA
Japan                日本
Hong Kong            香港
Türkiye              トルコ
France               フランス
United Kingdom       イギリス
United Arab Emirates アラブ首長国連邦
South Korea          韓国
```

List, Filters, Month-derived labels, Map selected content, and other Calendar surfaces must resolve country labels through the same locale-aware presentation layer.

## 11. Authority display names

Calendar rows favor compact reviewed authority labels. Recognized abbreviations remain valid in Japanese:

```text
JRA
NAR
HKJC
KRA
TJK
```

Examples:

```text
日本 · JRA
日本 · NAR
香港 · HKJC
韓国 · KRA
トルコ · TJK
```

Long formal authority names belong in detail/reference surfaces when useful. This presentation rule does not modify canonical authority IDs or source authority.

## 12. Racecourse display-name registry

Racecourse display names must be driven by a shared reviewed presentation registry, not by Calendar-only ad hoc dictionaries and not by runtime machine translation/transliteration.

The registry must support at least:

```text
racecourse_id
name_en
name_local
name_ja
name_ja_status
search_aliases
```

`name_ja_status` must distinguish reviewed Japanese naming from absence, for example:

```text
established
reviewed_transliteration
none
```

Exact enum naming may differ in implementation if the semantics remain explicit and validated.

## 13. Japanese racecourse-name resolution

Japanese display priority is:

1. reviewed established Japanese/common name;
2. reviewed established Chinese-character/Japanese-form name where appropriate;
3. reviewed Japanese transliteration when a Japanese form is genuinely established/accepted;
4. otherwise reviewed official Latin/English form.

Examples of intended outcomes include:

```text
Mizusawa Racecourse  -> 水沢競馬場
Kawasaki Racecourse  -> 川崎競馬場
Sonoda Racecourse    -> 園田競馬場
Monbetsu Racecourse  -> 門別競馬場
Kanazawa Racecourse  -> 金沢競馬場
Kasamatsu Racecourse -> 笠松競馬場
Sha Tin Racecourse   -> 沙田競馬場
Meydan Racecourse    -> メイダン競馬場 (when reviewed)
Ascot Racecourse     -> アスコット競馬場 (when reviewed)
```

Do not mechanically transliterate every foreign racecourse into Katakana.

If a lesser-known foreign venue has no reviewed Japanese name, a Latin/English name such as `Kocaeli Racecourse` is acceptable on the Japanese page.

Do not create hybrids such as `Kocaeli競馬場` by translating only the generic suffix. Do not invent `name_ja` at runtime.

## 14. English racecourse-name resolution

English surfaces use the reviewed `name_en` form, with reviewed official/local fallback only when necessary.

An ID-derived title-case fallback must not be treated as equivalent to a reviewed official display name.

## 15. Search aliases vs visible names

Visible racecourse identity uses one locale-resolved display name. Search may match reviewed aliases across Japanese, English, and local/original names.

For example, the Japanese Calendar may visibly show `水沢競馬場` while allowing search by both `水沢` and `Mizusawa`.

Search aliases are not dumped into the visible row.

## 16. List / Month / Map / Filters parity

The same country, authority, and racecourse display-name resolver must feed all Calendar presentation surfaces that expose those identities, including at minimum:

```text
List
Filters
Month-related selected/date context where names appear
Map selected/popup content
selected-card content
```

The same presentation-state resolver must feed:

```text
Today summary counts
Today/List group headings
Calendar List
Map marker state
Map legend
Map selected card
```

Do not maintain separate naming or state dictionaries that allow these surfaces to disagree for the same reviewed meeting and active date context.

## 17. Responsive behavior

The presentation change must preserve Calendar information density.

At 393×852:

- a meeting row remains visible in the first List viewport when meetings exist;
- removing the redundant stream-live badge must reduce visual clutter rather than create new vertical controls;
- long foreign racecourse names may wrap;
- do not force tiny typography solely to keep one-line rows;
- row actions remain in stable order and do not disappear because stream/site hrefs match;
- Today group headings must not consume the screen with duplicate or semantically overlapping categories.

## 18. Required regression coverage

At minimum lock these cases:

```text
current day + A+ before first -> 開催前 / Upcoming, List #fff9e9, Map upcoming #d18a00
current day + B+ running -> 開催中 / Racing now, List #fff7f6, Map running #c40000
current day + B+ after last -> 終了 / Finished, List #f6f7f8, Map ended #666666
current day + B -> 本日開催 / Today meeting, List #fffcf4, Map today #fffcf4 + dark outline
current day + C -> 本日開催 / Today meeting, List #fffcf4, Map today #fffcf4 + dark outline
Today range -> no Scheduled / 開催予定 group for current-day meetings
Today range -> no `Upcoming / racing today`
Today range -> no `開催前・本日開催`
Tomorrow range -> future meetings are Scheduled / 開催予定
7-day range -> current day uses current-day states, later dates use Scheduled / 開催予定
Calendar selected today -> current-day states, no Scheduled fallback for B/C
Calendar selected future date -> Scheduled / 開催予定 only
future meeting -> not yellow solely because its start time is later
B/C first-time presence does not authorize `running`
Map today presentation state is not collapsed to upcoming
Today Map legend excludes Scheduled / 開催予定
Calendar Map today legend excludes Scheduled / 開催予定
Calendar Map future-date legend does not show current-day states
Map selected card equals List presentation state
verified stream live -> ● Live now / ● 公式配信中
known stream not live -> Official stream / 公式配信
no standalone `Official stream live` badge
wrong-date/stale stream result -> not live
no direct detector-derived watch URL
equal stream/site hrefs -> both semantic actions remain visible
JA known UI strings are localized
JA reviewed racecourse name beats English fallback
JA unreviewed foreign name remains Latin/English rather than invented Katakana
List/Filters/Map naming resolves consistently
```

## 19. Visual acceptance

Representative Visual Audit must include browser/screenshots sufficient to inspect:

```text
EN desktop Today range List
JA desktop Today range List
EN mobile 393×852 Today range List
JA mobile 393×852 Today range List
Today Map EN/JA
Calendar selected-today List + Map
Calendar selected-future List + Map
Month
current-day B/C example with Today meeting / 本日開催 and #fffcf4 treatment
current-day B+ or higher upcoming example with Upcoming / 開催前 and #fff9e9 treatment
running example
future scheduled example
```

The reviewer must explicitly verify:

- `Upcoming / racing today` is absent;
- `開催前・本日開催` is absent;
- current-day B/C appears under `Today meeting / 本日開催`, not `Scheduled`;
- Today-range List and Map do not expose `Scheduled / 開催予定` as a current-day category;
- the two warm current-day states remain visually and semantically distinct;
- Today summary counts, List headings, row badges, Map markers, Map legend, and selected cards agree;
- Calendar future-date presentation uses `Scheduled / 開催予定` instead of current-day state labels;
- EN/JA semantics match;
- no horizontal overflow at 393×852.

A screenshot artifact existing is not acceptance. The semantic content of the screenshots must be inspected.

## 20. Scope boundary

This work must not silently change:

```text
acquisition routes
canonical meeting records
source date/time facts
public-rank evidence or promotion
reviewed source authority
race-level publication permission
racecourse coordinates
rolling 30-day browsing scope
List one-day focus
Month compact overview role
Map shared-meeting truth
stream detector exact-date truth
```

If implementation reveals a defect in those layers, route it to the appropriate data-quality/control-plane work rather than patching it in the presentation layer.

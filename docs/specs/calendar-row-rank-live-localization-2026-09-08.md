# Where Horses Run — Calendar row rank, live-link, and localization specification

Status: active canonical Calendar presentation refinement  
Adopted: 2026-09-08  
Applies to: Calendar List row state semantics, current-day rank boundary, official-stream presentation, EN/JA labels, country/authority/racecourse display names, List/Month/Map naming parity  
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

## 2. Row-background semantics

Row color is a presentation of current-day meeting state, not a raw rank color.

For the current Calendar day:

```text
B+/A/A+ before first race -> yellow/warm upcoming row + Upcoming / 開催前
B/C current-day meeting   -> yellow/warm today row + Today meeting / 本日開催
B+/A/A+ running           -> red/warm live-racing row + Racing now / 開催中
B+/A/A+ finished          -> gray finished row + Finished / 終了
unknown/unsupported       -> neutral row
```

Do not interpret yellow as simply `rank >= B+`. Do not interpret yellow as simply `upcoming`. The text label must disambiguate `開催前` from `本日開催`.

The rank badge remains visible independently of row-state color.

## 3. Official-stream presentation

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

## 4. Official stream and official site are separate actions

The Calendar row keeps stable semantic action slots.

```text
meeting state | official stream | details | official site
```

If the reviewed official-stream destination URL and the reviewed official-site/source URL happen to be identical, **do not deduplicate the visible actions merely because the href values match**.

The labels describe different user intents. URL equality must not make row structure change unpredictably from one meeting to another.

## 5. Japanese UI localization boundary

Known UI/ordinary-language labels must be localized on `/ja/` surfaces.

Required examples include:

```text
Map             -> 地図
Details         -> 詳細
Upcoming        -> 開催前
Racing now      -> 開催中
Finished        -> 終了
Today meeting   -> 本日開催
Official stream -> 公式配信
Live now        -> 公式配信中
Official site   -> 公式サイト
Filters         -> 絞り込み
Country         -> 国
Racecourse      -> 競馬場
Authority       -> 主催
```

Latin characters are not themselves an error. Proper nouns and recognized abbreviations may remain Latin where that is the reviewed/appropriate public form.

## 6. Country display names

Country identity remains canonical. Only the presentation label changes by locale.

Examples:

```text
EN                  JA
Japan               日本
Hong Kong           香港
Türkiye             トルコ
France              フランス
United Kingdom      イギリス
United Arab Emirates アラブ首長国連邦
South Korea         韓国
```

List, Filters, Month-derived labels, Map selected content, and other Calendar surfaces must resolve country labels through the same locale-aware presentation layer.

## 7. Authority display names

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

## 8. Racecourse display-name registry

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

## 9. Japanese racecourse-name resolution

Japanese display priority is:

1. reviewed established Japanese/common name;
2. reviewed established Chinese-character/Japanese-form name where appropriate;
3. reviewed Japanese transliteration when a Japanese form is genuinely established/accepted;
4. otherwise reviewed official Latin/English form.

Examples of intended outcomes include:

```text
Mizusawa Racecourse -> 水沢競馬場
Kawasaki Racecourse -> 川崎競馬場
Sonoda Racecourse   -> 園田競馬場
Monbetsu Racecourse -> 門別競馬場
Kanazawa Racecourse -> 金沢競馬場
Kasamatsu Racecourse -> 笠松競馬場
Sha Tin Racecourse  -> 沙田競馬場
Meydan Racecourse   -> メイダン競馬場 (when reviewed)
Ascot Racecourse    -> アスコット競馬場 (when reviewed)
```

Do not mechanically transliterate every foreign racecourse into Katakana.

If a lesser-known foreign venue has no reviewed Japanese name, a Latin/English name such as `Kocaeli Racecourse` is acceptable on the Japanese page.

Do not create hybrids such as `Kocaeli競馬場` by translating only the generic suffix. Do not invent `name_ja` at runtime.

## 10. English racecourse-name resolution

English surfaces use the reviewed `name_en` form, with reviewed official/local fallback only when necessary.

An ID-derived title-case fallback must not be treated as equivalent to a reviewed official display name.

## 11. Search aliases vs visible names

Visible racecourse identity uses one locale-resolved display name. Search may match reviewed aliases across Japanese, English, and local/original names.

For example, the Japanese Calendar may visibly show `水沢競馬場` while allowing search by both `水沢` and `Mizusawa`.

Search aliases are not dumped into the visible row.

## 12. List / Month / Map / Filters parity

The same country, authority, and racecourse display-name resolver must feed all Calendar presentation surfaces that expose those identities, including at minimum:

```text
List
Filters
Month-related selected/date context where names appear
Map selected/popup content
selected-card content
```

Do not maintain separate naming dictionaries that allow List to show Japanese while Map or Filters fall back to unrelated English labels for the same reviewed entity.

## 13. Responsive behavior

The presentation change must preserve Calendar information density.

At 393×852:

- a meeting row remains visible in the first List viewport when meetings exist;
- removing the redundant stream-live badge must reduce visual clutter rather than create new vertical controls;
- long foreign racecourse names may wrap;
- do not force tiny typography solely to keep one-line rows;
- row actions remain in stable order and do not disappear because stream/site hrefs match.

## 14. Required regression coverage

At minimum lock these cases:

```text
current day + A+ before first -> 開催前 / Upcoming, warm yellow row
current day + B+ running -> 開催中 / Racing now, red row
current day + B+ after last -> 終了 / Finished, gray row
current day + B -> 本日開催 / Today meeting, no precise running/finished inference
current day + C -> 本日開催 / Today meeting, no precise running/finished inference
B/C first-time presence does not authorize `running`
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

## 15. Visual acceptance

Representative Visual Audit must include browser/screenshots sufficient to inspect:

```text
EN desktop List
JA desktop List
EN mobile 393×852 List
JA mobile 393×852 List
Month
Map
current-day B/C example with Today meeting / 本日開催
current-day B+ or higher upcoming example with Upcoming / 開催前
running + verified-live example
future/non-live example
```

The reviewer must verify that the old `Racing now / Official stream live / Live now` triple emphasis no longer appears and that `本日開催` versus `開催前` follows the B+ evidence boundary.

## 16. Scope boundary

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

# Banei Bilingual and Public Display QA

Status: active source-specific QA contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This contract defines the Banei-specific bilingual and public-display QA stage after acquisition, retry, reconciliation, guarded Queue state apply/rollback, and freshness/rollback operating evidence are complete.

The QA stage does not promote the Banei review fixture and does not rewrite committed public timetable JSON.

The review fixture is not promoted or published.

The QA path is:

```text
Banei-specific detail source inventory
+ separate Banei detail-source Readiness
+ Banei A+ publication policy
+ reviewed public-safe Banei candidate fixture
-> pure deterministic public projection
-> list/detail boundary checks
-> field-switch and downgrade checks
-> temporary-worktree public fixture staging
-> English and Japanese static build
-> English and Japanese Calendar checks
-> English and Japanese country-page checks
-> English and Japanese meeting-detail checks
-> no committed public JSON change
```

## Separate Banei detail-source Readiness

The legacy Banei schedule source remains:

```text
source: banei-official-schedule
technical rank: C
public ceiling: C
readiness: link_only
```

The separate Banei detail-source Readiness record is:

```text
source: nar-banei-race-list-deba-table
system: japan-banei-system
authority: banei-tokachi
racecourse: obihiro-racecourse
technical rank: A+
public ceiling: A+
readiness: prototype_ready
automation mode: semi_automatic
```

The detail record confirms:

```text
meeting date
racecourse
first race time
last race time
per-race post times
race name
distance
surface
course
```

The two source records remain independent.

The legacy schedule-source Readiness remains link-only and is not silently upgraded by the detail-source supplement.

## Why a supplement is required

The public projection loader uses the canonical Calendar Readiness registry plus explicit supplements and amendments.

The separate Japan capability matrix is not itself a public-projection input.

Without a Banei detail supplement, a reviewed A+ detail candidate would have no matching A+ Readiness decision in the projection path.

The supplement closes that source-identity gap without rewriting the legacy schedule record.

## Public list boundary

Calendar and other list surfaces retain one meeting per list row.

A Banei A+ list row may show:

```text
racecourse
authority / system
country
public rank
first race time
last race time
meeting detail link
official source link
source status
last checked date
```

The list row must not contain:

```text
timetable_rows
race_name
distance_m
surface
course_label
```

Race-row detail belongs on the meeting detail page only.

## A+ detail boundary

The Banei A+ meeting detail projection may contain only the common public-safe fields:

```text
race label
post time
race name
distance
surface
course label
```

The permanent QA fixture preserves the reviewed Banei-specific normalization semantics:

```text
distance: 200m
surface: Dirt
course: Banei Straight Course
```

These labels are not converted into flat-racing geometry assumptions.

The QA does not invent turns, track circumference, turf-lane semantics, or other flat-racing course properties.

## A downgrade

The QA clones the active Banei publication policy and temporarily sets:

```text
max_public_rank: A
```

The projected detail must then contain only:

```text
label
post_time_local
```

The following fields must disappear:

```text
race_name
distance_m
surface
course_label
```

This proves the emergency A downgrade path remains functional.

## Race-name-only switch

The QA also keeps Banei at A+ while setting:

```text
show_race_name: false
```

The result must:

- remain A+;
- remove only `race_name`;
- preserve 200m distance;
- preserve `Dirt`;
- preserve `Banei Straight Course`.

This proves the race-name-only switch remains independent from other A+ fields.

## English and Japanese meeting detail routes

The public meeting detail routes are:

```text
/timetable/meetings/{meeting_id}/
/ja/timetable/meetings/{meeting_id}/
```

Both routes read only the public timetable view model.

The Japanese route provides localized page chrome and table headings while preserving the exact projected Banei source values.

The Japanese Calendar meeting-detail link is prefixed with `/ja` and must resolve to the Japanese detail route.

## Japanese Banei list labels

Known Banei identifiers are localized on Japanese list routes:

```text
obihiro-racecourse -> 帯広競馬場
banei-tokachi -> ばんえい十勝
japan -> 日本
```

English list routes retain:

```text
Obihiro Racecourse
Banei Tokachi
Japan
```

The localization affects labels only. It does not alter meeting identity, source identity, rank, times, or programme-summary values.

## Rendered fixture QA

The rendered QA creates a detached temporary git worktree.

Inside that temporary worktree only, it writes:

```text
public meeting-list fixture
public meeting-details fixture
empty timestamp-aligned Japan A+ override fixture
```

It then runs the real Astro static build with a fixed Calendar reference date.

The rendered checks cover:

```text
English Calendar
Japanese Calendar
English Japan country page
Japanese Japan country page
English meeting detail
Japanese meeting detail
```

List surfaces must show the meeting once and must not contain Banei race names or `Banei Straight Course` row detail.

Meeting detail surfaces must show all projected A+ fields and the same number of timetable rows in English and Japanese.

The temporary worktree is removed after QA.

Committed public JSON is never rewritten by this QA.

## Country-page boundary

The Japan country pages continue to display one row per meeting.

They may show:

```text
date
racecourse
system
start time
timezone
official source
```

They do not expand race rows, race names, distance arrays, surface arrays, or course arrays.

The Japanese country page uses the localized Banei venue label.

## Forbidden output boundary

Banei QA output must not contain public fields for:

- horse names;
- jockey names;
- trainer names;
- owners or breeders;
- draw, gate, or post positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- source bodies;
- credentials, cookies, secrets, or tokens;
- direct stream URLs.

The checker scans projected output for forbidden key classes.

## Side-effect boundary

This QA performs no:

- network fetch;
- candidate approval;
- canonical promotion;
- canonical meeting write;
- committed public projection write;
- publication;
- deployment;
- automatic Queue mutation;
- scheduler execution.

The static build runs against temporary fixture public data only.

## Completion boundary

This stage is complete when:

- Banei detail-source Readiness is loaded by the public projection path;
- the detail source is A+ / A+ with all common programme-summary fields confirmed;
- the legacy schedule-source Readiness remains C / link_only;
- the Banei publication policy remains source-specific;
- a reviewed Banei A+ fixture projects exactly one visible meeting row;
- list output contains no race-row detail fields;
- A+ detail preserves race label, post time, race name, 200m, Dirt, and Banei Straight Course;
- A downgrade removes all A+ fields;
- the race-name-only switch removes only race name;
- English and Japanese Calendar pages render the meeting once;
- Japanese Calendar uses 帯広競馬場, ばんえい十勝, and 日本;
- Japanese Calendar detail link points to the Japanese meeting-detail route;
- English and Japanese country pages remain row-level only;
- English and Japanese meeting detail pages render matching timetable row counts;
- no forbidden public field is present;
- no committed public timetable JSON is modified;
- normal repository build and runtime import boundaries remain valid.

## Next handoff

After this QA stage is stable:

1. decide whether any remaining Banei public-display concern requires an item-level switch or A downgrade;
2. run July full-month Completion Audit only if making an explicit full-month completeness claim;
3. record the explicit Banei handoff decision;
4. then begin the next source-specific pilot.

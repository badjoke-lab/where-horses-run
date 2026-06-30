# Current timetable data inventory

Status: superseded by `WHR-CAL-BASELINE-RECONCILE`
Last updated: 2026-07-01

> This PR-237 inventory is retained as historical evidence. Its statements about missing canonical/public layers are no longer current. The authoritative component decisions are `docs/calendar/baseline-reconciliation-map.md` and `data/audits/calendar-baseline-migration-map.json`.

This inventory records the current timetable data, scripts, and display surfaces before the project moves to the canonical timetable pipeline.

The target pipeline remains:

```text
source config
↓
fetch / snapshot
↓
normalize / canonical
↓
publication policy
↓
public view model / public JSON
↓
pages
```

Pages should eventually read only the public view. They should not directly mix manual seeds, samples, normalized candidates, source snapshots, and legacy integrated files.

---

## Current conclusion

The project already has several timetable UI pieces ahead of the planned canonical/public-view pipeline:

- normalized timetable preview display exists;
- meeting detail links exist on some list surfaces;
- an A-level meeting detail page exists;
- public display boundary specs exist;
- meeting detail page contract exists;
- JRA section split schema exists.

However, the canonical timetable model, canonical conversion, executable publication policy resolver, public view generation, and final page migration are not complete yet.

Therefore the next work should not pretend this is a clean greenfield pipeline. It must absorb the already-merged preview/detail work and move it behind canonical and public view outputs.

---

## Merged work already affecting the roadmap

| GitHub PR | Status | What it already did | Roadmap impact |
| --- | --- | --- | --- |
| #221 | merged | Wired normalized timetable samples to a preview calendar. | Partial PR-6 / PR-7 behavior exists, but not via final public view JSON. |
| #226 | merged | Added meeting detail links to calendar, tomorrow, and current timetable surfaces. | Partial PR-7 / PR-9 behavior exists, but still before public view unification. |
| #228 | merged | Added an A-level race-by-race meeting detail page. | Partial PR-9 exists, but it is not driven by canonical public detail output. |
| #235 | merged | Added public display boundary policy guard. | Supports PR-5 / safety policy, but not an executable resolver. |
| #236 | merged | Added meeting detail page contract. | Supports PR-9, but does not implement final public detail view. |

---

## Current data and code classification

| Path | Current role | Classification | Keep / move / replace decision |
| --- | --- | --- | --- |
| `data/generated/timetables.json` | Base manual seed containing Japan JRA, Hong Kong, UAE and other meeting-level records. | active display input / manual seed / current but not canonical | Convert to canonical in PR-4. Do not let pages depend on its raw shape after PR-7. |
| `data/generated/japan-active-timetable-records.json` | Japan active-window overlay for NAR and Banei. | active display input / manual reviewed seed | Convert to canonical in PR-4. Rank consistency needs PR-2 review. |
| `data/generated/normalized-timetable.json` | Manually reviewed normalized timetable samples. | normalized candidate / preview display input | Convert to canonical in PR-4. Stop direct page usage by PR-10. |
| `data/generated/timetable/pr-184-public-display-boundary.json` | Machine-readable display boundary policy record. | policy/spec only | Keep as policy evidence. It is not a display data source. |
| `data/generated/timetable/pr-185-jra-section-split-schema.json` | JRA section split schema for summary/detail separation. | schema/policy support | Feed into PR-3 canonical model and PR-12 JRA route. It is not a display data source. |
| `data/generated/timetable/pr-236-meeting-detail-page-contract.json` | Machine-readable meeting detail page contract. | policy/spec only | Keep as contract evidence. It is not a display data source. |
| `src/data/normalizedTimetableCalendarPreview.ts` | Preview reader for normalized timetable samples. | already wired UI / preview display module | Absorb into public view model in PR-6 / PR-7. |
| `src/components/NormalizedTimetableCalendarPreview.astro` | Preview UI for normalized timetable samples. | already wired UI / preview component | Replace or demote after public view list is live. |
| `src/components/NormalizedMeetingDetailLinks.astro` | Adds detail links to list surfaces. | already wired UI / transitional component | Keep temporarily, then feed from public view. |
| `src/data/normalizedTimetableMeetingDetails.ts` | Detail data module for A-level sample meeting. | active detail input / transitional direct data | Convert to canonical meeting-details in PR-4 and stop direct page use in PR-9/PR-10. |
| `src/pages/timetable/meetings/[meeting_id].astro` | Existing meeting detail page. | active UI / partially ahead of roadmap | Keep page route, but change data source to public detail in PR-9. |
| `src/pages/calendar/index.astro` | Calendar page. | active UI / partially ahead of roadmap | Migrate to public meeting-list in PR-7. |
| `src/pages/tomorrow.astro` | Tomorrow page. | active UI / partially ahead of roadmap | Migrate to public meeting-list in PR-7. |
| `src/pages/major-countries/current-timetable.astro` | Current timetable page. | active UI / partially ahead of roadmap | Migrate to public meeting-list in PR-7. |
| `current-integrated.json` family, if present | Older combined display/sample data. | legacy / sample / current but not display-main | Do not delete in PR-1. Isolate in PR-10. |
| `hkjc-normalized-*.sample.json` family, if present | HKJC normalized sample data. | source sample / normalized candidate | Use as canonical input only. Stop direct page imports in PR-10. |

---

## Roadmap status after inventory

| Roadmap item | Current status after inventory | Required next action |
| --- | --- | --- |
| PR-1 current data inventory | This PR. | Merge inventory docs/json/check. |
| PR-2 rank consistency repair | Not complete. | Add rank audit and fix B/B+/A/A+ mismatches. |
| PR-3 canonical timetable model | Not complete. | Define canonical types and spec. Include JRA summary/detail split. |
| PR-4 existing JSON to canonical | Not complete. | Build canonical meetings and meeting-details from current inputs. |
| PR-5 publication display policy resolver | Spec exists, resolver not complete. | Add executable policy resolver. |
| PR-6 public view generation | Not complete. | Build public meeting-list and meeting-details from canonical + policy. |
| PR-7 list pages to public view | Partially done early, not final. | Replace direct/transitional inputs with public meeting-list. |
| PR-8 country and track pages to public list | Not complete. | Filter public meeting-list by country and racecourse. |
| PR-9 meeting detail page to public detail | Partially done early, not final. | Replace direct A sample detail source with public meeting-details. |
| PR-10 legacy input isolation | Not complete. | Block page-level direct imports of legacy/sample/normalized inputs. |
| PR-11 HKJC June refresh | Not complete. | Expand HKJC route config and refresh into canonical/public view. |
| PR-12 JRA A/A+ acquisition path | Not complete. | Add source config, snapshot, normalizer, section split, canonical integration. |
| PR-13 NAR / Banei acquisition path | Not complete. | Add source configs, snapshots, normalizers, canonical integration. |
| PR-14 US A sample reintegration | Not complete. | Convert Equibase / USTA / AQHA samples into canonical/public view. |

---

## Immediate next PR

After this inventory, the next PR should be PR-2 in the roadmap:

```text
rank consistency repair
```

It should not add new source coverage yet. It should first ensure existing C / B / B+ / A / A+ labels match available fields and that transitional A detail data does not make list pages over-display race-level information.

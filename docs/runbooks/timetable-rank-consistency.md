# Timetable rank consistency

Status: PR-238 rank consistency repair  
Last updated: 2026-06-07

This runbook defines the minimum rank consistency rules used before canonical timetable conversion and public view generation.

---

## Rank rules

| Rank | Minimum data requirement |
| --- | --- |
| `C` | Meeting date and racecourse are known. Race times may be missing. |
| `B` | `first_race_time_local` is present. |
| `B+` | `first_race_time_local` and `last_race_time_local` are both present. |
| `A` | Race-by-race public-safe detail rows exist in an approved detail source. Summary first and last times should be present when the record is also used by list/calendar surfaces. |
| `A+` | A fields plus allowed programme summary fields such as race name, distance, surface, and course label. |

The rank must describe the data actually stored in the current record or in a linked approved detail source. It must not describe what the official source might contain if that data is not stored in the project.

---

## Repairs made in this PR

The following normalized summary records were downgraded because their stored fields did not satisfy their previous rank:

| Meeting ID | Before | After | Reason |
| --- | --- | --- | --- |
| `jra-tokyo-racecourse-2026-06-06` | B | C | `first_race_time_local` is null. |
| `nar-obihiro-racecourse-2026-06-06` | B | C | `first_race_time_local` is null. |
| `hkjc-sha-tin-racecourse-2026-06-07` | B+ | C | `first_race_time_local` and `last_race_time_local` are null in the normalized summary record. |

`jra-tokyo-racecourse-2026-06-07` remains A because the normalized summary has first/last times and a transitional public-safe meeting detail module contains race-by-race post-time rows. This still needs canonical/public detail migration later.

---

## Not changed in this PR

This PR does not add:

- canonical conversion
- public view generation
- page input migration
- source fetching
- new source coverage
- legacy input isolation

---

## Next roadmap item

Next roadmap item is PR-3 canonical timetable model.

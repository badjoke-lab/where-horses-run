# Peru timetable source test

Status: Complete
Final technical rank: A+
Primary tested racecourse: Hipódromo de Monterrico
Primary official source: https://hipodromodemonterrico.com.pe/carreras-proximos-programas

## Result

Peru / Monterrico has an official website-backed programme source with machine-readable JSON endpoints.

The tested source provides meeting date, racecourse name, meeting id, race labels, per-race post times, race names, distances, and surface labels.

Course labels were not present in the tested fields, but the common A+ fields required for a lightweight programme summary were available through the race detail endpoint.

## Tested meetings

| Date | Meeting id | Racecourse | Races | First post | Last post | Technical rank |
| --- | ---: | --- | ---: | --- | --- | --- |
| 2026-06-13 | 102025 | Hipódromo de Monterrico | 10 | 13:30 | 17:30 | A+ |
| 2026-06-14 | 102026 | Hipódromo de Monterrico | 10 | 13:30 | 17:30 | A+ |
| 2026-06-15 | 102027 | Hipódromo de Monterrico | 7 | 14:00 | 16:50 | A+ |

## Source model

Observed safe source paths:

- /carreras-proximos-programas
- /api/general/carreras/general/programas/fecha/{YYYY-MM-DD}
- /api/general/carreras/general/programas/{id_reunion}
- /api/general/programa/general/{id_carrera}

The race detail endpoint was required to confirm surface availability.

## Field availability

| Scope | Meetings | Races | Times | Names | Distances | Surfaces | Course labels |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Meeting / programme API | 3 | 27 | 27 | 27 | 27 | 0 | 0 |
| Race detail API | 3 | 27 | 27 | 27 | 27 | 27 | 0 |

## Publication boundary

This test confirms technical source capability. Public display must still follow the Where Horses Run timetable display-boundary policy.

Do not publish horse names, jockey names, trainer names, weights, odds, betting details, full racecard contents, raw API JSON, or raw HTML.

## Local-only raw files

Raw files are stored under .whr-local-source-tests/06-peru/ and must not be committed.

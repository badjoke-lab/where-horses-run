# Mexico timetable source test

Status: Pending  
Final technical rank: Pending  
Primary candidate racecourse: Hipódromo de las Américas  
Primary official candidate source: https://www.hipodromo.com.mx/desktop/

## Result

Mexico could not be completed in this run.

The official Hipódromo de las Américas website candidate could not be resolved from the local source-test environment. All tested official URL candidates returned HTTP 000 with curl exit code 6 or 28.

This is not a C-rank source result. It is a pending obtainability result.

## Tested candidates

Tested candidate host/path family:

- https://www.hipodromo.com.mx/
- http://www.hipodromo.com.mx/
- https://hipodromo.com.mx/
- http://hipodromo.com.mx/
- https://www.hipodromo.com.mx/desktop/
- http://www.hipodromo.com.mx/desktop/
- https://hipodromo.com.mx/desktop/
- http://hipodromo.com.mx/desktop/
- /carreras/
- /programas/
- /programa/
- /calendario/
- /resultados/
- /desktop/carreras/
- /desktop/programas/
- /desktop/programa/
- /desktop/calendario/
- /desktop/resultados/

## Observed issue

DNS lookup failed or timed out during the local test.

Observed curl outcomes:

- curl exit 6: could not resolve host
- curl exit 28: resolving timed out

## Field availability

No meeting or race-level timetable fields were confirmed.

| Field | Status |
| --- | --- |
| Meeting date | Not confirmed |
| Racecourse name | Not confirmed from source payload |
| Race labels | Not confirmed |
| Post times | Not confirmed |
| Race names | Not confirmed |
| Distances | Not confirmed |
| Surfaces | Not confirmed |

## Publication boundary

No public timetable display upgrade should be made from this test.

Do not classify Mexico as C solely from this run. The correct status is pending because the official source candidate was not reachable.

## Local-only raw files

Raw files are stored under .whr-local-source-tests/07-mexico/ and must not be committed.

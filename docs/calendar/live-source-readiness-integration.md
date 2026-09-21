# Live Calendar source readiness integration

Work ID: `WHR-CAL-LIVE-SOURCE-READINESS`
Lane: Calendar refresh regression repair
Reviewed: 2026-09-21

## Incident and boundary

Unified refresh 35545143391 stopped after successful JRA acquisition because
`jra-racing-calendar-programme` was absent from the projection's readiness
registry and alias map. Wave 4 connected Japan and rolling reconciliation to
that older projection registry; the Wave 5 push exposed the missing integration.
Wave 5 runtime consumption is not the cause and remains unchanged.

Source IDs in producer/canonical provenance are retained. An explicit readiness
binding selects an existing reviewed publication profile; it does not assert
that two URLs are identical, synthesize evidence, change canonical rank, or
classify an acquisition cycle as successful. Unknown IDs still throw.

## Reviewed bindings

| Producer identities | Readiness authority | Evidence for binding |
| --- | --- | --- |
| `jra-racing-calendar-programme` | `jra-programme` plus existing amendment | `parseJraProgrammePage()` and JRA official 30-day discovery read the reviewed JRA date/programme family. |
| `nar-monthly-schedule-racelist` | `nar-race-list-deba-table` | `parseNarMonthlySchedule()` and the NAR detail adapter combine monthly discovery with RaceList/DebaTable. |
| The two Banei schedule/NAR-detail composite IDs | `nar-banei-race-list-deba-table` | Banei discovery and inspection combine official schedule evidence with the separately reviewed Banei detail family. |
| Explicit regional NAR discovery/fallback IDs | `nar-race-list-deba-table` | The bounded fourteen-venue production reconciliation uses regional official evidence alongside NAR evidence; see `japan-mother-set-safety.mjs`, the named official discovery modules, `nankan-official-programme-fallback.mjs`, `iwate-official-programme-fallback.mjs`, and `saga-official-start-fallback.mjs` and their checks. These are publication-governance bindings for accepted combined evidence, not claims that regional pages are NAR-hosted or independently contain every A+ field. |
| `hkjc-racecard-public-timetable` | `hkjc-fixture-list` | Live HKJC programme route; retain the existing A public ceiling and confirmed fields. Do not classify hosted acquisition as manual reviewed import. |
| `kra-annual-race-operation-plan` | `kra-2026-racing-operation-overview` | Same registered annual operation-plan source, retaining schedule readiness. |
| `tjk-annual-programme` | `tjk-daily-programme` | Existing TJK readiness explicitly includes annual discovery and daily programme routes; existing A ceiling remains. |
| `hri-racecards-month` | `hri-fixtures` | Registered HRI monthly route documented in `ireland-hri-racecard-route-2026-09-11.md`; existing A ceiling and publication restrictions remain. |

Historical Japan base records and the separate Japan-v2 profile are not rewritten
or globally activated by this repair. Live combined detail identities resolve to
the already-reviewed detail supplements rather than obsolete schedule/link-only
records. Lower-rank accepted evidence still projects at its own lower rank.

SOREC Programme Réunion and Chile Teletrak already have explicit authority/source
inventory records and publication policies but lacked matching readiness records.
`calendar-readiness-live-official-v1.json` supplies those two bounded records.
SOREC's registered A technical ceiling is not a claim that its current schedule
adapter acquires detail: only meeting identity fields are confirmed here. Chile
confirms the four existing domestic venues and programme post times through A.
No richer-field permission is added. Existing reviewed-public supplement IDs are
explicitly bound to these current families (and HRI), avoiding the historical
blocked Morocco record or country-level ambiguity.

## Safety and regression check

`node scripts/check-calendar-live-source-readiness.mjs` projects all current
canonical records in memory, exercises every explicit alias, validates alias
targets against both loaded registries, and reproduces the Hanshin incident.
It proves unknown IDs and missing targets fail closed; readiness blocking, public
ceilings, field permissions, explicit exclusions, correlated snapshot validation,
and scoped retention remain active. It runs before acquisition in the unified
workflow as well as in `npm run check`.

This repair does not regenerate historical public data. A full historical
reprojection would expose pre-existing ceiling differences (legacy Banei and
HKJC) under Wave 4; production's scoped reconciliation preserves unrelated rows.
No publication ceiling is raised to hide those differences. Acquisition failure
retention remains the shared canonical authority's responsibility and is covered
by the Wave 3/acquisition checks, not replaced by readiness resolution.

# Calendar acquisition completion audit — 2026-09-11

Status: active implementation audit  
Work ID: `WHR-CAL-ACQUISITION-COMPLETION`  
Scope: implemented production acquisition routes only

## Audit question

For an implemented Calendar route, does a valid lower-rank observation (`C`, `B`, `B+`, or `A`) prove acquisition completion, or does the route also evaluate and preserve the state of currently applicable higher-detail acquisition?

This audit does not include tiers with no implemented Calendar acquisition route.

## Result summary

Ten implemented Registry profiles are currently in scope.

The shared acquisition-completion contract and canonical classifier are active. Japan JRA/NAR/Banei have been normalized under the shared completion semantics, and the non-Japan rolling apply records `acquisition_completion` independently from observed rank.

The remaining Registry-level route-capability gaps are source-specific acquisition gaps, not rank-model gaps.

## Implemented route audit

| System | Current production behavior | Completion-contract state |
|---|---|---|
| `japan-jra-system` | Japan mother-set discovery followed by adapter `inspect()` | Shared completion normalization active: A+ terminal, pending -> `pending_publication`, failure/conflict -> `retry_required`; lower successful ranks cannot silently prove completion |
| `japan-nar-system` | Japan mother-set discovery followed by adapter `inspect()` | Shared completion normalization active with the same preservation rules |
| `japan-banei-system` | Japan mother-set discovery followed by adapter `inspect()` | Shared completion normalization active with the same preservation rules |
| `hong-kong-hkjc-system` | fixture discovery plus live racecard enrichment in the same Actions job | Route explicitly records evaluation through `A+`; lower observed rank may close only after that evaluation is proven |
| `uae-national-racing-system` | season discovery plus per-fixture racecard detail attempt | Route explicitly records evaluation through its technical ceiling `A`; pending/failure remain separate |
| `kra-national-racing-system` | operation-plan discovery plus publication-gated detail collection | Supported detail route records evaluation through `A+`; not-published/failure remain explicit and unsupported meeting cases are not silently treated as complete |
| `tjk-national-racing-system` | annual/current-future fixture discovery plus per-meeting official daily programme detail fetch | Official programme parser evaluates post time plus race name/condition, distance, and `Çim`/`Kum`/`Sentetik` surface/course fields through `A+`; missing richer fields preserve a lower Best Available rank rather than fabricating A+ |
| `sorec-racing-information-system` | Programme Réunion schedule/index acquisition | Registry technical capability is `A`, but current production route remains schedule-level with no detail source/adapter: implementation gap |
| `chile-teletrak-racing-system` | Teletrak weekly meeting acquisition | Registry technical capability is `A`, but current production route remains schedule-level with no detail source/adapter: implementation gap |
| `ireland-hri-racing-system` | HRI fixture-list acquisition | Registry technical capability is `A`, but current production route remains schedule-level with no detail source/adapter: implementation gap |

## Registry-level implementation gaps

The executable completion check now identifies exactly these three Registry profiles where the registered technical capability is above the maximum implemented observation rank:

```text
sorec-racing-information-system
chile-teletrak-racing-system
ireland-hri-racing-system
```

TJK is no longer in this list because the official daily programme route now evaluates the A+ timetable field surface and can emit `A+` when the evidence actually satisfies the rank contract.

This is a route-capability audit, not a claim that every meeting in those systems must reach the technical ceiling.

A meeting may validly remain at any lower rank when stronger verified evidence is not currently obtainable. The defect is an unimplemented or unevaluated richer route, not the existence of a lower Best Available rank.

## Existing behavior that must be retained

The repair must preserve these valid behaviors:

- lower-rank observations remain valid Calendar records;
- higher-detail failure must not blank or delete the lower-rank meeting;
- later lower-detail observations must not silently downgrade stronger canonical evidence;
- publication ceilings remain separate from acquisition completion;
- direct rank jumps remain valid;
- `pending_publication` is not the same as `retry_required`;
- a route that actually evaluates all applicable higher detail may validly close below its system-level technical ceiling for an individual meeting.

## Remaining implementation work

1. Resolve the SOREC Morocco detail-route gap.
2. Resolve the Chile Teletrak detail-route gap.
3. Resolve the Ireland HRI detail-route gap.
4. Connect unresolved `pending_publication` / `retry_required` states to later refresh/retry execution wherever the current regular refresh does not already revisit the required detail evidence.
5. Keep the executable completion contract rejecting any future implemented route that equates valid rank emission or green workflow execution with acquisition completion.

## Canonical contract

`docs/calendar/acquisition-completion-contract.md`

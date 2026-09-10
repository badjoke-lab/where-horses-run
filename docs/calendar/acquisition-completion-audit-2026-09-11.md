# Calendar acquisition completion audit — 2026-09-11

Status: active implementation audit  
Work ID: `WHR-CAL-ACQUISITION-COMPLETION`  
Scope: implemented production acquisition routes only

## Audit question

For an implemented Calendar route, does a valid lower-rank observation (`C`, `B`, `B+`, or `A`) prove acquisition completion, or does the route also evaluate and preserve the state of currently applicable higher-detail acquisition?

This audit does not include tiers with no implemented Calendar acquisition route.

## Result summary

Ten implemented Registry profiles are currently in scope.

The new completion contract is not yet represented uniformly in their output schemas. Existing routes fall into three groups:

1. routes that already attempt higher detail in the same acquisition cycle but do not expose the new normalized completion disposition;
2. routes that preserve pending/failure detail state but need mapping into the shared completion contract;
3. routes where a stronger registered technical capability exists but the production path cannot currently pursue it, which is an implementation gap rather than acquisition completion.

## Implemented route audit

| System | Current production behavior | Lower-rank handling today | Completion-contract finding |
|---|---|---|---|
| `japan-jra-system` | Japan mother-set discovery followed by adapter `inspect()` | `details_pending` and `acquisition_failed` are explicit; successful lower-rank observations do not yet carry the shared completion disposition | Semantically close; needs normalized completion disposition |
| `japan-nar-system` | Japan mother-set discovery followed by adapter `inspect()` | `details_pending` and `acquisition_failed` are explicit; successful lower-rank observations do not yet carry the shared completion disposition | Semantically close; needs normalized completion disposition |
| `japan-banei-system` | Japan mother-set discovery followed by adapter `inspect()` | `details_pending` and `acquisition_failed` are explicit; successful lower-rank observations do not yet carry the shared completion disposition | Semantically close; needs normalized completion disposition |
| `hong-kong-hkjc-system` | fixture discovery plus live racecard enrichment in the same Actions job | live racecard route is invoked, but schedule records that do not promote do not carry a per-meeting normalized completion disposition | Higher-detail pursuit exists; output contract incomplete |
| `uae-national-racing-system` | season discovery plus per-fixture racecard detail attempt | `detail_observation.status` distinguishes `available`, `source_error`, and `not_published` | Higher-detail pursuit exists; map existing status into shared completion disposition |
| `kra-national-racing-system` | operation-plan discovery plus publication-gated detail collection | successful promoted detail is explicit; skipped/not-published and failed detail are primarily aggregate counters, and unsupported track detail may remain schedule-only | Needs per-meeting completion disposition; unsupported detail is an implementation gap unless explicitly not applicable |
| `tjk-national-racing-system` | annual fixture discovery plus per-meeting daily detail fetch | `detail_observation.status` distinguishes `available`, `not_published`, `conflict`, and `source_error` | Higher-detail pursuit exists, but Registry claims technical `A+` while implemented supported observation ranks stop at `A`; `A -> A+` remains an implementation gap unless the capability claim is corrected |
| `sorec-racing-information-system` | Programme Réunion schedule/index acquisition | current production output is schedule-level `C`; Registry has no detail source/adapter | Registry technical capability is `A`; current production path cannot pursue it: implementation gap |
| `chile-teletrak-racing-system` | Teletrak weekly meeting acquisition | current production output is schedule-level `C`; Registry has no detail source/adapter | Registry technical capability is `A`; current production path cannot pursue it: implementation gap |
| `ireland-hri-racing-system` | HRI fixture-list acquisition | current production output is schedule-level `C`; Registry has no detail source/adapter | Registry technical capability is `A`; current production path cannot pursue it: implementation gap |

## Registry-level implementation gaps

The executable completion check currently identifies exactly these four Registry profiles where the registered technical capability is above the maximum implemented observation rank:

```text
sorec-racing-information-system
chile-teletrak-racing-system
ireland-hri-racing-system
tjk-national-racing-system
```

This is a route-capability audit, not a claim that every meeting in those systems must reach the technical ceiling.

A meeting may validly remain at any lower rank when stronger verified evidence is not currently obtainable. The defect is that the current implementation cannot prove that distinction for the open capability gap.

## Existing behavior that must be retained

The repair must preserve these valid behaviors:

- lower-rank observations remain valid Calendar records;
- higher-detail failure must not blank or delete the lower-rank meeting;
- later lower-detail observations must not silently downgrade stronger canonical evidence;
- publication ceilings remain separate from acquisition completion;
- direct rank jumps remain valid;
- `pending_publication` is not the same as `retry_required`;
- a route that actually evaluates all applicable higher detail may validly close below its system-level technical ceiling for an individual meeting.

## Required implementation work

1. Add one shared acquisition-completion classifier and executable contract tests.
2. Normalize per-meeting completion disposition for every implemented production route.
3. Preserve pending, retry, not-applicable, and implementation-gap states separately.
4. Connect unresolved lower-rank states to later refresh/retry eligibility where the source publishes richer detail later.
5. Do not mark a route complete merely because it emitted a valid rank or because its collector/workflow exited successfully.
6. Resolve the four Registry-level implementation gaps by implementing the stronger acquisition path or correcting an unsupported technical-capability claim with evidence.

## Canonical contract

`docs/calendar/acquisition-completion-contract.md`

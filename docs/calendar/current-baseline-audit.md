# Current Calendar baseline audit

Status: reconciled  
Work ID: `WHR-CAL-BASELINE-RECONCILE`  
Reviewed against main: `d3de6114cb3d9a2dc1b2c625678ec4557c38c595`  
Last reviewed: 2026-07-01

## Conclusion

Where Horses Run already contains substantial Calendar contracts, research evidence, fixtures, adapter interfaces, candidate generators, canonical/public data models, publication policy, list/detail views, and source-specific experiments. It is not a greenfield implementation.

It is also not a maintained public Calendar pipeline yet. Multiple generations of code coexist, normal build/check previously mutated June 2026 generated data, source-specific scripts can write canonical/public files directly, Today/Tomorrow retains a fixed June fallback, and the shared scheduled refresh core reports `skeleton_no_live_fetch`.

The reviewed component-level decision is now recorded in:

- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md)
- [`../../data/audits/calendar-baseline-migration-map.json`](../../data/audits/calendar-baseline-migration-map.json)
- `scripts/check-calendar-baseline-reconciliation.mjs`

## Capabilities retained

- Source Test v2 and Calendar Readiness contracts.
- Canonical authority/source and readiness registries.
- C / B / B+ / A / A+ rank and public-ceiling separation.
- Field-level A+ publication policy.
- Canonical meeting and meeting-detail types.
- Public meeting-list and meeting-detail view models.
- Bounded fixture/parser harness and adapter interfaces.
- Candidate/review/promotion separation as the governing flow.
- Public-safe source tests and manual snapshot contracts.
- Meeting detail and scoped list routes.

## Critical gaps

### Multiple writers

Legacy canonical builders, JRA/HKJC refresh scripts, June seed merging, public projection wrappers, and snapshot application do not yet have one clear write-ownership model. Pipeline v1 must enforce:

```text
adapter -> candidate only
human promotion -> canonical only
public projection -> public JSON only
pages -> public JSON read only
normal build -> repository read only
```

### Fixed dates and historical seeds

June 2026 manual records, hard-coded JRA/HKJC sample meetings, and a fixed runtime fallback remain. These are migration evidence, not a current-date implementation.

### Skeleton operations

The refresh core writes reports and empty current data while explicitly declaring that no live fetch is implemented. The daily cron is therefore paused. Manual review dispatch remains available, but scheduling must not return until `WHR-CAL-OPS-V1`.

### Parallel runtime paths

Public view models exist, but legacy seed imports and normalized preview/detail modules remain. Production pages must converge on public meeting-list and meeting-details only.

### Milestone-specific validation

Many PR-number scripts and workflows preserve useful assertions but obscure active contract coverage. They are archived only after each continuing assertion has a named grouped replacement.

## Immediate safeguards

This reconciliation removes the June merge from normal `build` and `check`, making production build read-only. It also removes the schedule trigger from the incomplete refresh workflow.

No canonical/public data, source capability, Technical Rank, Public Ceiling, or Calendar Readiness decision is changed by these safeguards.

## Next phase

Current Work ID: `WHR-CAL-PIPELINE-V1`

The next phase implements one shared candidate envelope, one human promotion path, one canonical writer, deterministic public projection, import guards, grouped validation, and a fixture-backed reference adapter. Dynamic dates and operations follow as separate Work IDs.

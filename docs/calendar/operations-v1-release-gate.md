# Calendar Operations v1 release gate

Status: complete  
Work ID: `WHR-CAL-OPS-V1`  
Completed: 2026-07-01  
Next Work ID: `WHR-CAL-JAPAN-JRA`

## Completed layers

Operations v1 provides deterministic source-health status, review-package preparation, pause and rollback control, seasonal rollover policy, source-breakage escalation, read-only operator artifacts, and grouped validation.

## Canonical operational state

```text
data/generated/timetable/operations-status.json
data/generated/timetable/operations-review-package.json
data/static/calendar-operations-control.json
data/static/calendar-operations-seasonal-policy.json
```

The committed July 1 baseline evaluates all 116 Calendar Readiness records. It keeps the JRA reference candidate freshness-blocked and reports no automatic data or publication action.

## Boundaries

The following remain disabled:

- scheduled refresh;
- live fetch in the canonical operator workflow;
- automatic candidate approval;
- automatic canonical writes;
- automatic public writes;
- pull-request creation by generated review packages;
- unattended publication.

The review package proposes no changed files and no public release.

## Recovery and seasonal ownership

Operations v1 defines review thresholds, action priority, seasonal review triggers, warning/degraded/blocked source-breakage levels, official fallback use, pause procedure, rollback procedure, and pilot activation prerequisites.

## Validation

```text
scripts/check-calendar-operations-status.mjs
scripts/check-calendar-operations-review-package.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
```

Machine-readable completion record:

```text
data/audits/calendar-operations-v1-release-gate.json
```

## Next phase

`WHR-CAL-JAPAN-JRA` is the first source pilot. It must obtain a fresh reviewed JRA fixture before candidate approval or canonical promotion.

The following pilot is `WHR-CAL-JAPAN-NAR`.

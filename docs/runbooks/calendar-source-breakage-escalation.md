# Calendar source-breakage escalation

Status: active runbook  
Work ID: `WHR-CAL-OPS-V1`

## Levels

### Warning

The official route still responds, but reviewed fields or navigation changed. Keep the last reviewed data only when fallback permits it and queue source review.

### Degraded

The official timetable route is unavailable or incomplete, but an authoritative fallback remains. Downgrade, link-only, or hide according to Calendar Readiness.

### Blocked

No reviewed authoritative source remains or source identity cannot be confirmed. Hide the source from the current Calendar and keep candidate approval and promotion disabled.

## Procedure

1. Record official URL, check date, failure mode, and affected fields.
2. Confirm the failure is not a temporary local or network issue.
3. Apply the existing fallback before inventing any new route.
4. Preserve last reviewed canonical/public data only when allowed by fallback and freshness display.
5. Update Authority/Source and Calendar Readiness together when the official replacement is confirmed.
6. Run candidate, promotion, projection, Dynamic Dates, and rendered checks before restoration.
7. Keep scheduling disabled until the incident is reviewed and closed.

## Prohibited recovery

Do not use unofficial mirrors, bypass restricted access, publish source bodies, expand participant/betting data, increase rank automatically, or write public data directly.

## Closure

Close the incident only when the authoritative route, confirmed fields, fallback, review owner, and rollback point are documented.

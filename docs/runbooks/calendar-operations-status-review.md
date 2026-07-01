# Calendar operations status review

Status: active runbook  
Work ID: `WHR-CAL-OPS-V1`

## Scope

Use this runbook to inspect maintenance state without fetching sources or changing public data.

## Generate a local review

```text
node scripts/timetable/build-operations-status.mjs --reference-date YYYY-MM-DD --dry-run
```

To write the complete local report:

```text
node scripts/timetable/build-operations-status.mjs \
  --reference-date YYYY-MM-DD \
  --output /tmp/calendar-operations-status.json
```

The GitHub Actions workflow `Calendar operations review` performs the same review and uploads an artifact.

## Review order

1. Confirm `network_fetch_performed`, `canonical_written`, `public_projection_written`, and `scheduled_refresh_active` are false.
2. Review `refresh_before_promotion` actions first.
3. Review unavailable and blocked sources.
4. Review automatic and semi-automatic sources past their threshold.
5. Review manual and link-only revalidation queues.
6. Confirm public projection age and current-window meeting count.

## JRA reference candidate

The current JRA reference candidate remains `needs_review` and is blocked by freshness. Do not approve or promote it until a new reviewed source capture has a check date at least as recent as the canonical registry state.

## No-action cases

Do not create an update solely because a source is old when its refresh class is `none` or its readiness is `not_applicable`.

Do not convert an operations action into a readiness, rank, or publication change without source review and the applicable contract update.

## Escalation

- `source_unavailable_review`: confirm the official route, then follow the source-breakage procedure when available.
- `blocked_review`: keep the source blocked unless new evidence resolves the recorded reason.
- `manual_revalidation_due`: prepare a reviewed manual update; do not automate by assumption.
- `link_revalidation_due`: confirm the official link and keep public output link-only.
- `source_revalidation_due`: prepare a source-specific candidate review; do not publish directly.

## Pause rule

The existing timetable refresh schedule remains paused. Do not add a cron trigger or change the manual review workflow to write permissions as part of routine status review.

## Rollback

This report does not modify repository data. Removing the generated artifact is sufficient rollback. A committed baseline change is reverted through a normal reviewed pull request.

# Calendar operations pause and rollback

Status: active foundation  
Work ID: `WHR-CAL-OPS-V1`

## Current mode

The canonical control file is `data/static/calendar-operations-control.json`. Current mode is `paused_review_only`.

Scheduled refresh, live source operation in the canonical review workflow, generated approval, automatic canonical/public writes, and unattended publication remain disabled.

## Pause

1. Confirm Calendar workflows have no cron trigger.
2. Keep the operator workflow at `contents: read`.
3. Keep candidate review states unchanged.
4. Keep the last reviewed public projection available.
5. Use official-source links for incomplete or stale current information.
6. Record evidence before changing readiness or fallback.

## Review package

```text
node scripts/timetable/build-operations-review-package.mjs --dry-run
```

The package contains action priorities, input hashes, required checks, and rollback instructions. It proposes no changed files and does not open a pull request.

## Rollback

For an artifact-only review, delete the artifact.

For a committed baseline:

1. revert through a normal reviewed pull request;
2. restore the previous reviewed candidate or canonical commit when applicable;
3. regenerate public projection from restored canonical data;
4. run Pipeline v1, Dynamic Dates, and bilingual rendered validation;
5. keep source operation paused until the incident is closed.

## Source breakage

- follow the fallback recorded in Calendar Readiness;
- never invent a replacement route;
- do not use mirrors, bypasses, restricted details, or source bodies;
- document the official replacement before changing Authority/Source records.

## Activation

A live pilot requires the Operations v1 release gate, a source-specific pilot contract, a fresh reviewed fixture, verified pause/rollback steps, and an assigned human promotion owner.

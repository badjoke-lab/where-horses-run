# Source Test v2 runbook — entries 77-84

Status: complete for review  
Work ID: `WHR-ST2-77-84`  
Checked: 2026-06-30

## Scope

| Delivery | Country | Calendar Readiness | Acquisition |
| --- | --- | --- | --- |
| 77 | Kazakhstan | `prototype_ready` | `remote_complete` |
| 78 | Egypt | `link_only` | `remote_partial` |
| 79 | Algeria | `link_only` | `remote_partial` |
| 80 | Iran | `link_only` | `remote_partial` |
| 81 | Vietnam | `manual_ready` | `remote_complete` |
| 82 | Bolivia | `blocked` | `remote_partial` |
| 83 | Guatemala | `link_only` | `remote_partial` |
| 84 | Honduras | `blocked` | `remote_partial` |

## Source boundary

Only public-safe derived decisions are committed. No raw HTML, JavaScript, PDF bodies, complete programmes, participants, odds, results, payouts, credentials, restricted access details, or bypass instructions are included.

Every record is capped at C. Confirmed meeting-date and venue capability exists only for the bounded Kazakhstan federation calendar and the Bac Ha provincial festival context. Link-only and blocked records have no approved current meeting fields.

## Overlay model

The canonical authority and readiness registries currently contain 94 records and close 76 countries. This work adds eight reviewed overlay records, producing an effective state of 102 records and 84 closed countries.

The canonical files are not rewritten in this wave because previous-wave validators assert immutable historical counts. The final 98-country audit must compact the overlays into the canonical registry and tracker after all waves are complete.

## Validation

Run:

```text
node scripts/check-source-test-v2-77-84.mjs
node scripts/check-source-test-v2-69-76.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
npm install
npm run build
```

Expected result:

```text
SOURCE_TEST_V2_77_84_VALID countries=8 authority=102 readiness=102
READINESS_MIX prototype_ready=1 manual_ready=1 link_only=4 blocked=2
```

## Next

`WHR-NOTE-77-84`

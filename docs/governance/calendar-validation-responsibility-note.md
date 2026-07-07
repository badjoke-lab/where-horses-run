# Calendar validation responsibility governance note

Status: supporting note

The canonical contract is `docs/calendar/validation-responsibility-contract.md` and the machine-readable map is `data/static/calendar-validation-responsibilities-v1.json`.

Calendar validation separates Batch Validation, Promotion Validation, Coverage Audit, and Completion Audit. Normal promotion is monotonic by reviewed rank. Coverage incompleteness does not block unrelated valid partial promotion. Whole-scope completeness belongs to Completion Audit.

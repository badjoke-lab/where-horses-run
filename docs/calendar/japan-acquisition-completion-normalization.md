# Japan acquisition completion normalization

Status: active implementation note  
Last reviewed: 2026-09-11

The Japan zero-based 30-day acquisition path now records `acquisition_completion` separately from observed Calendar rank.

For JRA, NAR, and Banei meetings:

- `A+` remains a valid terminal Best Available observation because no higher timetable rank exists.
- `details_pending` maps to `pending_publication` while preserving the currently valid rank.
- `acquisition_failed` and reconciliation conflicts map to `retry_required` while preserving stronger existing canonical evidence.
- a successful inspection that yields less than `A+` is not silently treated as acquisition-complete unless the adapter explicitly proves that the A+ field surface was evaluated. Until that proof exists, the state is `implementation_gap`.

This note does not change rank derivation. `C`, `B`, `B+`, `A`, and `A+` remain evidence-derived Best Available ranks. It only normalizes acquisition-cycle completion semantics under `docs/calendar/acquisition-completion-contract.md`.

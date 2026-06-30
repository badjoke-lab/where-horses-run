# Calendar pipeline v1 — public projection preview

Status: preview under review  
Work ID: `WHR-CAL-PIPELINE-V1`  
Preview PR: `#365`  
Projection timestamp: `2026-06-09T15:02:29.605Z`

## Exact change

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| Public meeting rows | 39 | 23 | -16 |
| Public meeting details | 5 | 5 | 0 |
| Detail timetable rows | 57 | 57 | 0 |
| Race-name occurrences | 57 | 0 | -57 |
| Distance occurrences | 57 | 0 | -57 |
| Surface occurrences | 57 | 0 | -57 |
| Course-label occurrences | 57 | 0 | -57 |
| Prohibited-key findings | 0 | 0 | 0 |

The exact comparison is stored in [`../../data/audits/calendar-public-projection-release-v1.json`](../../data/audits/calendar-public-projection-release-v1.json).

## Meeting-row removals

The 16 removed public rows are three Banei records and thirteen NAR records. Their current Calendar Readiness is `link_only`. Canonical records remain unchanged; only public projection is affected.

## Rank changes

Four JRA A+ details and one HKJC A+ detail are publicly capped at A. Race labels and post times remain. Race name, distance, surface, and course-label values are removed from public detail rows.

Older JRA B rows remain B. HKJC C rows remain C. UAE C rows remain C. Their `max_public_rank` metadata now reflects the reviewed Public Ceiling rather than the more permissive display policy.

## Detail routes

All five existing public detail routes remain. No detail route is added or removed. Every detail table is limited to Race and Post time columns.

## Required QA

The preview must confirm:

- English and Japanese Calendar, Today, and Tomorrow pages build;
- all five meeting-detail routes render;
- race labels and post times remain visible;
- A-level detail tables do not render A+ columns;
- removed link-only meeting IDs do not appear in rendered HTML;
- no render error marker appears;
- public JSON has no prohibited-key finding.

The rendered-QA workflow packages the complete `dist/` output for browser inspection.

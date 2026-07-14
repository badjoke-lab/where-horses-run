# Calendar Public v1 release decision

Status: accepted decision record

Work ID: `WHR-CAL-PUBLIC-V1`

Implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`

Decision date: 2026-07-14

Decision: `accepted_for_reviewed_static_public_operation`

Next Work ID: `WHR-RACECOURSE-PAGES-V1`

## Decision

Calendar Public v1 satisfies the reviewed release criteria for static public operation from the reviewed public timetable projection.

The accepted release includes:

- dynamic Calendar, Today, and Tomorrow views;
- explicit reference-date and timezone handling;
- one meeting per public list row;
- reviewed C, B, B+, A, and A+ display boundaries;
- visible official source, source status, freshness, reviewed coverage, and public-gap state;
- honest partial, stale, empty, before-window, after-window, and reviewed source-failure presentation;
- bilingual English/Japanese route parity and meeting navigation;
- reviewed operations ownership for additional detail and source recovery;
- permanent source, rendered, navigation, Pipeline, Dynamic Dates, Operations, governance, and clean-worktree gates.

## Evidence chain

The decision depends on the following completed implementation units:

1. `PUBLIC-V1-SURFACE-AUDIT-01` — Calendar, Today, Tomorrow, Dynamic Dates, one-meeting-per-row, and five-rank field boundaries;
2. `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01` — reviewed pilot records, source, rank, coverage, freshness, and honest public-gap state;
3. `PUBLIC-V1-OPERATIONS-PRESENTATION-01` — current, stale, empty, source-failure, and reviewed retry-ownership presentation;
4. `PUBLIC-V1-NAVIGATION-QA-01` — static and dynamic English/Japanese route parity, canonical/hreflang metadata, language switches, meeting back links, and internal-link integrity;
5. `PUBLIC-V1-RELEASE-DECISION-01` — explicit completion and transition decision.

Machine-readable evidence is recorded in:

- `data/audits/calendar-public-v1-surface-audit-v1.json`;
- `data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json`;
- `data/audits/calendar-public-v1-operations-presentation-v1.json`;
- `data/audits/calendar-public-v1-navigation-qa-v1.json`;
- `data/audits/calendar-public-v1-release-decision-v1.json`.

## Accepted operating model

Calendar Public v1 is a static surface generated from reviewed public projection data.

Ordinary maintenance may be partial, irregular, overlapping, cross-month, source-visible-horizon, or selected-meeting based. A valid partial update is not a failed release. Month-wide or season-wide completeness may be claimed only by the corresponding explicit Completion Audit.

The official source remains the final authority. Public pages expose the reviewed state and do not invent missing meetings, times, programme fields, or source recovery results.

## Publication and automation boundary

This decision does not enable unattended operation.

The following remain disabled:

- scheduled acquisition Job execution;
- automatic Queue mutation;
- automatic candidate approval;
- automatic promotion;
- direct Canonical or public dataset writes from the release gate;
- unattended publication;
- deployment from the release-decision workflow.

Public changes continue through a separate human-reviewed repository merge.

## Public data boundary

Calendar Public v1 does not publish:

- participant or horse entries;
- jockey, trainer, or driver lists;
- odds or betting data;
- results or payouts;
- predictions or tips;
- full racecards;
- raw source bodies;
- embedded video or direct stream URLs;
- internal Review Queue or Rank-aware Retry Queue records;
- attempt history, backoff state, operator notes, or reviewer identity.

## Non-claims

This release decision is not a claim of:

- complete global racing coverage;
- complete detail coverage for every public meeting;
- automatic or real-time source freshness;
- automatic approval or publication;
- full-month or full-season completeness without an explicit Completion Audit.

## Next stage

The programme moves to `WHR-RACECOURSE-PAGES-V1`.

The next stage strengthens one canonical page per reviewed racecourse identity and the surrounding page-link architecture. It will connect reviewed today/upcoming meeting state, official source and freshness information, course and distance profiles without unsupported inference, and country/type/glossary/Calendar/meeting navigation.

The first requirement is to reconcile timetable-only venue IDs with the canonical racecourse registry so public meeting pages never generate links to nonexistent racecourse pages.

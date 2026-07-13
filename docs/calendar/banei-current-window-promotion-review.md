# Banei current-window promotion review

Status: reviewed read-only promotion proposal  
Work ID: `WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-PROMOTION-REVIEW`  
Implementation unit: `BANEI-CURRENT-WINDOW-PROMOTION-01`

## Pinned source

The reviewed source is workflow run `29275669482`, artifact `8289240383`:

```text
artifact digest: sha256:b1021380e6223c8a4dc7c2719a0d4c451a72de14e58784f4264bc7c91de38d3e
campaign result SHA-256: f6161d6269fad0a6d25efb881df317ac5151ea49ef2b3522fef78bb1dc338b67
```

The July and August Candidate, Collection Report, Coverage Observation, Result Manifest, and Review Queue files are individually pinned by SHA-256.

## Reviewed result

```text
meetings: 13
C schedule records: 12
A+ detail records: 1
A+ race rows: 12
```

The approved A+ meeting is:

```text
banei-obihiro-racecourse-2026-07-13
first race: 14:20
last race: 20:35
```

The other twelve meetings remain reviewed C schedule identities because complete RaceList detail was not available at observation time.

## Why two Candidate envelopes are required

Pipeline v1 binds one Candidate envelope to one reviewed official source.

The thirteen records use two sources:

```text
12 C records -> banei-official-schedule
1 A+ record  -> nar-banei-race-list-deba-table
```

They are therefore approved as two separate `timetable-candidate-v1` envelopes.

The proposal applies them sequentially:

```text
current Canonical
-> approve/add 12 C schedule records
-> approve/add 1 A+ detail record
-> combined proposed Canonical meetings/details
```

## Reviewed schedule Readiness activation

The existing `banei-official-schedule` Readiness record still carries its historical `link_only` automation mode. Pipeline v1 correctly refuses Canonical promotion while that mode remains active.

The successful July/August live campaign now provides reviewed evidence for a narrowly scoped transition:

```text
source: japan/banei-tokachi/banei-official-schedule
automation_mode: link_only -> semi_automatic
Canonical scope: Rank C meeting identity only
confirmed fields: meeting date and Obihiro racecourse
```

This transition does not authorize race times or programme rows from the monthly schedule source. It also does not enable automatic approval, publication, or deployment.

The review workflow applies the transition only to an in-memory copy of Calendar Readiness and emits `reviewed-readiness-activation.json`. The actual Registry file remains unchanged until the separate Apply PR is reviewed and merged.

## Review checks

C records:

- official monthly Banei schedule URL only;
- meeting ID, date, racecourse, timezone;
- no first-race time;
- no last-race time;
- no timetable rows.

A+ record:

- official NAR Banei RaceList URL only;
- continuous Race 1 through Race 12;
- complete post times;
- complete race names;
- complete distances;
- complete surfaces;
- complete course labels.

Excluded from both sets:

- horse, jockey, trainer, entry, draw, weight, or participant data;
- odds or betting data;
- results or payouts;
- predictions or tips;
- raw HTML or source bodies;
- video or stream URLs.

## Proposal outputs

The review workflow produces:

- approved C schedule Candidate;
- approved A+ detail Candidate;
- reviewed Readiness activation proposal;
- proposed Canonical meetings;
- proposed Canonical meeting details;
- combined promotion summary;
- SHA-bound promotion proposal.

Expected closure:

```text
Readiness activation: link_only -> semi_automatic
promoted meetings: 13
promoted details: 1
A+ race rows: 12
retained C retry targets: 12
```

## Safety boundary

The workflow has read-only repository and Actions permissions.

It does not:

- write Calendar Readiness;
- commit either approved Candidate;
- write Canonical files;
- regenerate public projection;
- publish or deploy.

A separate reviewed Apply PR remains required.

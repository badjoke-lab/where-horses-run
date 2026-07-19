# Calendar horizon recovery candidate review — through 2026-08-17

Status: candidate review pending  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Candidate boundary: no approval, no Canonical write, no public projection, no deployment

## Purpose

This review package supplies only the meeting identities that can be established safely from the reviewed official schedule evidence needed to extend the current public Calendar horizon.

It contains:

```text
JRA:    18 C-rank meeting identity candidates
Banei:   3 C-rank meeting identity candidates
NAR:     separate authorized hosted acquisition path
```

## JRA candidates

Candidate file:

```text
data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16.json
```

Official advance programmes confirm New Niigata, Chukyo, and Sapporo meetings on:

```text
2026-08-01
2026-08-02
2026-08-08
2026-08-09
2026-08-15
2026-08-16
```

The resulting 18 records intentionally claim only:

- system and authority identity;
- racecourse identity;
- meeting date;
- official programme URL;
- source check time.

They do not claim:

- first or final race time;
- per-race rows;
- race names, surfaces, or distances;
- final race-day confirmation;
- approval or promotion readiness.

The official JRA pages state that these are advance programmes and that race order, surface, distance, post time, cancellation, or postponement may later change. The conservative recovery rank is therefore C even though the source pages expose more detail.

## Banei candidates

Candidate file:

```text
data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17.json
```

The official August schedule confirms Obihiro meetings on:

```text
2026-08-15
2026-08-16
2026-08-17
```

The three records are C-rank meeting identities only. No race times or rows are claimed.

This manual candidate package does not change the daily Banei execution boundary. Regular refresh, coverage-gap execution, and source revalidation remain disabled. Only reviewed selected-meeting rank retries remain eligible in the daily execution policy.

## NAR separation

NAR August recovery is not manually reconstructed in this package.

The accepted path is:

```text
season-aware daily planner
-> authorized NAR Actions Job
-> immutable schedule/detail candidates
-> Coverage Observation and Result Manifest
-> human-review draft PR
```

This preserves the source-specific adapter and avoids combining manually written NAR identities with independently generated hosted acquisition evidence.

## Review checklist

Before any approval:

1. open each JRA official programme URL and verify all three racecourse headings for the date;
2. confirm the six JRA dates remain inside the public recovery window;
3. verify the three Banei dates on the official monthly schedule;
4. confirm every record remains C with null first/final time and an empty timetable row array;
5. confirm all record and top-level review states remain `needs_review`;
6. confirm no candidate meeting already exists in Canonical or the public projection;
7. confirm no participant, betting, result, payout, prediction, or raw-source material is present;
8. review NAR hosted output separately;
9. do not promote until the exact approved envelope is recorded.

## Later publication sequence

```text
human review
-> exact approved candidate envelope
-> Promotion Validation
-> Canonical promotion
-> public projection
-> bilingual rendered QA
-> merge
-> Cloudflare Pages deployment
```

This candidate PR stops before the first step is completed.

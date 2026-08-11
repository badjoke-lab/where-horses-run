# Where Horses Run project roadmap — 2026-08-12 active addendum

Status: active canonical project-roadmap addendum  
Adopted: 2026-08-12  
Supersedes for current execution state: `docs/project-roadmap-2026-08-09-addendum.md`  
Base roadmap: `docs/project-roadmap.md`

This addendum advances the active project execution position after the TJK source revalidation and bounded-adapter implementation. Historical KRA, v1-release, audit, racecourse, SEO, and daily-acquisition evidence remains unchanged unless explicitly superseded here.

## Current position

Completed recent Calendar expansion units now include:

- PR #572 — reviewed KRA Rank C publication: 32 meetings, Busan-Gyeongnam/Jeju identity-only, zero KRA race-detail rows;
- PR #573 — `TJK-SOURCE-REVALIDATION-01`, confirming the current TJK `Info/Page` daily route and preserving technical A+ / public A separation;
- PR #574 — `TJK-BOUNDED-ADAPTER-01`, producing deterministic candidate-only output from reviewed fixture evidence with no Canonical/public writes.

Current public Calendar state is unchanged by PR #574. TJK candidates are review artifacts, not public coverage.

## Current Work ID

```text
Current Work ID: WHR-CAL-TURKEY-TJK
Completed implementation unit: TJK-BOUNDED-ADAPTER-01
Current gate: HUMAN REVIEW REQUIRED for bounded TJK candidates
Candidate meetings: 3
Candidate race rows: 23
Technical capability: A+
Public ceiling: A
Canonical/public publication effect: none
Next source Work ID: WHR-CAL-MOROCCO-SOREC-REVALIDATION (conditional after TJK review decision)
```

Draft PR #559 remains the stable daily acquisition human-review queue and is unrelated to the TJK adapter publication decision.

## Immediate execution sequence

### 1. Turkey TJK bounded adapter — complete

The bounded adapter uses only reviewed deterministic fixture evidence and the current source-route contract.

```text
reviewed fixed-three fixture
-> current Info/Page source-link normalization
-> deterministic TJK candidates
-> dedicated prohibited-data validation
-> candidate-only diff validation
-> repository-clean validation
```

The committed candidate artifact contains 3 historical reviewed fixture meetings and 23 complete Race 1-N rows. The records retain A+ technical evidence while separately enforcing a public ceiling of A. All review states remain pending.

The adapter does not claim that a fresh 2026-08-11 daily body was captured. It does not write current Turkey Canonical/public coverage and does not register public Turkey racecourse identities.

### 2. Turkey TJK human candidate review — current

The next decision is whether the bounded candidate contract is acceptable for a later separately reviewed promotion design. Review must verify at minimum:

- current `Info/Page/GunlukYarisProgrami` route usage;
- preservation of `SehirId`, `QueryParameter_Tarih`, and `SehirAdi`;
- deterministic fixture provenance;
- complete Race 1-N evidence for the bounded fixture;
- technical A+ / public A separation;
- prohibited-data exclusion;
- absence of Canonical/public writes;
- no automatic approval, merge, or deployment of a later promotion.

Passing the adapter CI does not approve publication.

### 3. Separate TJK promotion unit — only if human review approves

Any promotion work must be a new PR and must pass the normal shared pipeline:

```text
HUMAN REVIEW APPROVAL
-> promotion input/decision artifact
-> Batch Validation
-> Promotion Validation
-> Public Ceiling
-> Canonical/public projection
-> rendered/bilingual QA
```

No technical A+ source capability may directly raise public output above A. No source capability may bypass the prohibited-data boundary.

### 4. Morocco SOREC revalidation — conditional

`WHR-CAL-MOROCCO-SOREC-REVALIDATION` remains the conditional next source-expansion Work ID after the current TJK review decision. SOREC is still blocked because no stable official public meeting/timetable route has been verified. Revalidation must remain a source/research gate unless that evidence changes.

## Ongoing boundaries

The project continues to use the established model:

```text
official source
-> source/season state
-> bounded acquisition or deterministic reviewed fixture
-> public-safe candidate artifacts
-> HUMAN REVIEW REQUIRED
-> separate promotion/publication
```

Automatic approval, Canonical promotion, public projection, merge, and deployment remain disabled unless a future contract explicitly changes those rules.

## Authority rule

Where this addendum differs from `docs/project-roadmap-2026-08-09-addendum.md` about the current TJK implementation state or immediate execution order, this 2026-08-12 addendum is authoritative. Unchanged project priorities and historical evidence remain governed by the base roadmap and prior addendum.

# Calendar Public v1 pilot-record reconciliation

Status: implemented for review  
Work ID: `WHR-CAL-PUBLIC-V1`  
Implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`  
Last reviewed: 2026-07-12

## Purpose

Calendar Public v1 must not force users to infer the meaning of a public rank from missing fields.

This unit adds two deterministic public summaries to every Calendar, Today, and Tomorrow meeting row:

```text
reviewed coverage
additional-detail state
```

The summaries are derived only from already-public projection fields:

```text
capability_rank
max_public_rank
effective_public_rank
```

No Review Queue, Retry Queue, reviewer, operator note, source snapshot path, or raw source content is exposed.

## Reviewed coverage

The visible coverage label follows the effective public rank.

| Public rank | Reviewed coverage |
| --- | --- |
| C | Meeting date and racecourse only |
| B | First race time only |
| B+ | First and last race times |
| A | Race-by-race post times |
| A+ | Reviewed programme summary |

This does not claim that an entire month, season, source, or racing system is complete.

## Additional-detail state

The visible detail state distinguishes three cases.

### More detail not reviewed

The current meeting record is below its reviewed public ceiling.

Example:

```text
canonical capability: C
public ceiling: A+
effective public rank: C
```

The row remains public at C and explicitly states that additional detail is not reviewed.

### Public ceiling applied

The canonical record contains more detail than the reviewed public boundary permits.

Example:

```text
canonical capability: A+
public ceiling: A
effective public rank: A
```

The row states that a public ceiling is applied. This is the expected reviewed HKJC behavior for the existing A+ canonical fixture.

### At current public ceiling

The effective public rank equals the current reviewed public ceiling.

This label does not claim that acquisition or product work is permanently complete. It only describes the current approved public boundary.

## Pilot-system reconciliation

### JRA

JRA remains active with an A+ public ceiling. Individual public rows may remain below A+ until meeting-level evidence is reviewed.

### NAR

Mixed C and A+ output is valid. C rows are schedule identities and must state that additional detail is not reviewed. A+ rows may show the reviewed programme summary.

### Banei

The accepted handoff does not itself publish records. Banei rows appear only when canonical records are policy-eligible; otherwise the reviewed exclusion remains valid.

### HKJC

HKJC remains provisional. Existing public rows may remain C. When canonical A+ evidence is capped at public rank A, the row must state that the public ceiling is applied.

### UAE

Existing canonical seed rows remain C at the current C ceiling. The later 64-record UAE handoff evidence remains review-only and is not automatically promoted or published.

## Source and freshness

Every public row retains:

- an HTTPS official-source link;
- source status;
- last checked date;
- the final-confirmation reminder.

Coverage and detail state do not replace the official source or the freshness date.

## Boundaries

This unit does not:

- write canonical records;
- rewrite the public projection;
- publish internal queue state;
- enable automatic acquisition, approval, promotion, or publication;
- expose participant, betting, result, payout, prediction, raw-source, or direct-stream data.

## Next unit

Validate bilingual presentation for:

```text
current
stale
empty
source failure
retry ownership
```

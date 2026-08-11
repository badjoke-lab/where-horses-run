# Calendar implementation roadmap — 2026-08-12 active addendum

Status: active canonical Calendar programme addendum  
Adopted: 2026-08-12  
Supersedes for current execution state: `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`  
Base roadmap: `docs/calendar/implementation-roadmap.md`  
Current Work ID: `WHR-CAL-TURKEY-TJK`

This addendum advances only the current execution position after `TJK-BOUNDED-ADAPTER-01`. Historical stage text, KRA publication evidence, daily acquisition contracts, and release snapshots remain unchanged unless explicitly superseded below.

## Current execution state

```text
KRA reviewed Rank C publication: complete
TJK source revalidation: complete
TJK bounded adapter: implemented
TJK deterministic fixture candidates: 3 meetings / 23 races
TJK technical capability: A+
TJK public ceiling: A
TJK candidate review status: pending
TJK Canonical writes: 0
TJK public projection writes: 0
TJK deployment: none
stable daily review queue: Draft PR #559
unattended publication: disabled
```

## Stage 15 — Turkey / TJK

Work ID: `WHR-CAL-TURKEY-TJK`

### TJK-SOURCE-REVALIDATION-01

Status: complete in PR #573.

The current daily programme route is `https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami`. The historical `Info/Sehir/GunlukYarisProgrami` route remains superseded. The reviewed query parameters remain `SehirId`, `QueryParameter_Tarih`, and `SehirAdi`. Technical capability is A+ and public ceiling remains A. No fresh 2026-08-11 parameterized daily body is claimed by the revalidation artifact.

### TJK-BOUNDED-ADAPTER-01

Status: implemented in PR #574; candidate-only human review is the next gate.

The bounded adapter:

1. reads the reviewed deterministic fixed-three Turkey fixture evidence;
2. preserves the fixture race evidence rather than inventing a current-day body;
3. normalizes historical fixture source links onto the revalidated current `Info/Page/GunlukYarisProgrami` route while preserving all three reviewed query parameters;
4. produces exactly 3 meeting candidates and 23 Race 1-N rows;
5. records technical capability A+ separately from public ceiling A;
6. keeps all candidate review states pending;
7. rejects prohibited participant, betting, result, payout, prediction, raw-source, and stream fields;
8. validates deterministic committed output;
9. rejects Canonical/public timetable file changes in the adapter PR;
10. leaves publication effect as `none`.

Canonical candidate artifact: `data/candidates/tjk-bounded-reviewed-fixture-v1.json`.

Implementation status: `docs/timetable-source-tests/03-turkey/implementation-status-2026-08-11.json`.

### Current TJK gate — human candidate review

The next operation is review, not publication.

```text
bounded adapter — complete
-> deterministic candidate output — complete
-> adapter / prohibited-data / candidate-only validation — complete
-> HUMAN REVIEW REQUIRED — current
-> separate promotion design/review unit, if approved
-> Promotion Validation
-> Canonical/public projection
-> bilingual/rendered QA
```

The pending candidate set must not be treated as current Turkey Calendar coverage. No TJK Canonical meeting, public meeting, racecourse identity, or public timetable detail is authorized by this adapter unit.

Any later TJK promotion must be a separate reviewed PR. Public output must remain at or below A even where the candidate carries A+ technical evidence.

## Conditional next source-expansion work

`WHR-CAL-MOROCCO-SOREC-REVALIDATION` remains conditional after the current TJK review decision. SOREC remains blocked until a stable official public meeting/timetable route is verified. No Morocco adapter or publication may be inferred from the existing blocked inventory state.

## Authority rule

Where this addendum differs from the 2026-08-09 Calendar implementation addendum about the current TJK unit or immediate execution order, this 2026-08-12 addendum is authoritative. All unchanged contracts and historical evidence continue to derive from the base roadmap and prior addendum.

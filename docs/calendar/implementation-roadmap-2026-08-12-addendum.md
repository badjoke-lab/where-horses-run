# Calendar implementation roadmap — 2026-08-12 active addendum

Status: active canonical Calendar programme addendum  
Adopted: 2026-08-12  
Supersedes for current execution state: `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`  
Base roadmap: `docs/calendar/implementation-roadmap.md`  
Current Work ID: `WHR-CAL-TURKEY-TJK`

This addendum records the current execution position after direct TJK current-programme verification and deterministic current bounded-adapter implementation. Historical stage text, KRA publication evidence, daily acquisition contracts, release snapshots, and the 2024 TJK fixed-three adapter fixture remain unchanged unless explicitly superseded below.

## Current execution state

```text
KRA reviewed Rank C publication: complete
TJK historical source revalidation: complete
TJK historical bounded fixture adapter: implemented
TJK historical deterministic fixture candidates: 3 meetings / 23 races
TJK historical fixture candidate review status: pending; not current coverage
TJK current route topology: verified
TJK current direct programme evidence: 2 meetings / 18 races on 2026-08-11
TJK current bounded adapter: implemented
TJK current deterministic candidates: 2 meetings / 18 races
TJK current candidate review status: pending human review
TJK current candidate identity mode: TJK source-authority venue identity only; no WHR public racecourse identity created
TJK technical capability: A+
TJK candidate/public ceiling: A
TJK Canonical writes: 0
TJK public projection writes: 0
TJK public racecourse identity writes: 0
TJK deployment: none
stable daily review queue: Draft PR #559
unattended publication: disabled
```

## Stage 15 — Turkey / TJK

Work ID: `WHR-CAL-TURKEY-TJK`

### TJK-SOURCE-REVALIDATION-01

Status: historical revalidation complete in PR #573.

The 2026-08-11 revalidation established `https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami` as the current daily landing route and correctly preserved the A+ technical capability / A public-ceiling separation. It did not capture a complete parameterized daily body. That record remains retained as historical evidence in `docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json`.

### TJK-BOUNDED-ADAPTER-01

Status: historical fixture adapter implemented in PR #574.

The bounded adapter remains valid as a deterministic adapter-test fixture:

1. reads the reviewed fixed-three Turkey fixture evidence;
2. produces exactly 3 meeting candidates and 23 Race 1-N rows;
3. records technical capability A+ separately from public ceiling A;
4. keeps all candidate review states pending;
5. rejects prohibited participant, betting, result, payout, prediction, raw-source, and stream fields;
6. validates deterministic committed output;
7. rejects Canonical/public timetable file changes;
8. leaves publication effect as `none`.

Canonical candidate artifact: `data/candidates/tjk-bounded-reviewed-fixture-v1.json`.

Historical implementation status: `docs/timetable-source-tests/03-turkey/implementation-status-2026-08-11.json`.

This 2024 fixed-three fixture must not be treated as current Turkey Calendar coverage and must not be promoted merely because the adapter contract passes.

### TJK-CURRENT-PROGRAMME-EVIDENCE-01

Status: complete in PR #576 after read-only current-source verification.

The current implementation topology is now verified more precisely:

1. start from the current `Info/Page/GunlukYarisProgrami` landing route;
2. read only same-day, same-city venue-detail links emitted by that current landing response;
3. follow the emitted `Info/Sehir/GunlukYarisProgrami` detail link for that exact city/date;
4. do not hard-code the historical `Info/Sehir` URL as the adapter entrypoint;
5. do not treat `Info/Data/GunlukYarisProgrami` as complete schedule evidence unless a future probe proves a complete Race 1-N body there.

Direct read-only evidence for 2026-08-11 verifies:

- Ankara (`SehirId=5`): 9 races, 14:00 through 18:00;
- Kocaeli (`SehirId=9`): 9 races, 17:15 through 21:30;
- total: 2 meetings / 18 races.

The exact Race 1-N post-time arrays and passing probe provenance are recorded in `docs/timetable-source-tests/03-turkey/revalidation-2026-08-12.json`.

This evidence corrects the earlier interpretation of annual-observation `race_rows=7/8`: those values are not the current daily programme race counts. The historical 2026-08-11 artifact remains unchanged rather than being rewritten.

No raw programme body was retained or committed. No Canonical/public projection write was performed.

### TJK-CURRENT-BOUNDED-ADAPTER-01

Status: implemented; candidate is pending human review.

The current bounded adapter:

1. consumes only the committed reviewed current-programme evidence from `revalidation-2026-08-12.json`;
2. binds each candidate to the verified `Info/Page` landing route and the rule that venue detail must be discovered from the same-date, same-city landing response;
3. emits exactly 2 current meeting candidates / 18 Race 1-N rows for 2026-08-11;
4. emits A-level candidate schedule fields only: meeting/date identity, first/last post, Race 1-N number and local post time;
5. preserves A+ only as technical source capability metadata and keeps candidate/public ceiling at A;
6. preserves TJK `SehirId` source-authority venue identity and does not create Ankara/Kocaeli WHR public racecourse IDs;
7. rejects participant, betting, result, payout, prediction, raw-source, full-racecard, stream, distance, and surface fields from the current candidate;
8. validates deterministic committed output;
9. rejects Canonical/public timetable and public racecourse-identity changes in the candidate PR;
10. performs no automatic approval or deployment.

Current candidate artifact: `data/candidates/tjk-current-bounded-2026-08-11-v1.json`.

Current implementation status: `docs/timetable-source-tests/03-turkey/implementation-status-2026-08-12.json`.

### Current TJK gate — HUMAN REVIEW REQUIRED

The current operation is **human review of the deterministic 2026-08-11 Ankara/Kocaeli candidate**, not publication and not racecourse identity creation.

```text
historical fixed-three adapter — complete; retained as test evidence
-> current route topology verification — complete
-> current direct Race 1-N programme evidence — complete
-> current bounded adapter — complete
-> deterministic current candidate output — complete
-> prohibited-data / candidate-only validation — complete
-> HUMAN REVIEW REQUIRED — current
-> separate racecourse identity + promotion design/review unit, if approved
-> Promotion Validation
-> Canonical/public projection
-> bilingual/rendered QA
```

Human review must verify the 2 meetings / 18 races against the reviewed evidence and confirm that source-authority venue identity (`SehirId=5` Ankara, `SehirId=9` Kocaeli) is sufficient for the candidate stage. It must not infer or invent WHR public racecourse IDs.

No TJK Canonical meeting, public meeting, racecourse identity, or public timetable detail is authorized by this adapter unit.

Any later TJK racecourse identity registration and promotion must be a separate reviewed PR. Public output must remain at or below A even where current source evidence demonstrates A+ technical capability.

## Conditional next source-expansion work

`WHR-CAL-MOROCCO-SOREC-REVALIDATION` remains conditional after the current TJK bounded-adapter/review decision. SOREC remains blocked until a stable official public meeting/timetable route is verified. No Morocco adapter or publication may be inferred from the existing blocked inventory state.

## Authority rule

Where this addendum differs from the 2026-08-09 Calendar implementation addendum about the current TJK unit or immediate execution order, this 2026-08-12 addendum is authoritative. All unchanged contracts and historical evidence continue to derive from the base roadmap and prior addendum.

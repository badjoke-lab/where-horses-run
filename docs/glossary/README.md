# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing knowledge base** with explicit multilingual, regional, evidence, relationship, register, historical, and search-discovery structure.

The public knowledge resource is for users first. Search/AI discovery is a separate structured layer used to make that knowledge easier to find and understand; it does not replace or distort the knowledge model.

## Current authority

Read these first for new glossary-list work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

Current execution pointer:

```text
Completed: GLOSSARY-MASTER-001 — specification / authority
Completed: GLOSSARY-MASTER-002 — zero-based seed
Completed current pass: GLOSSARY-MASTER-003 — major-jurisdiction + local-language terminology research
Completed current pass: GLOSSARY-MASTER-004 — slang / colloquial / industry / abbreviation / historical evidence
Current:   GLOSSARY-MASTER-005 — P0 closed; supplemental candidate cleanup complete
Next:      P1/base-seed verification wave 1
Later:     GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

## Current master state

- **657 Concepts / 18 categories**
- P0 203 / P1 301 / P2 135 / P3 18
- relationships 20; relation reviews **15/15 resolved**
- register usages 60; effective verified 36; effective candidates 24
- abbreviations 27; historical rows 4
- `public_ready=0`
- public runtime remains disconnected

## Evidence refinement state

P0 verification is complete after five waves:

- Wave 1: 16 P0 — DISC / DIST
- Wave 2: 30 P0 — ENTRY / VENUE / WEIGHT
- Wave 3: 51 P0 — RTYPE / SURF / MEET / RESULT / BET
- Wave 4: 44 P0 — HORSE / BREED / ROLE / RUN / EQUIP / TRAIN / PRIZE / WELF
- Wave 5: 11 P0 — scope-sensitive deferred Concepts; plus `BET-028 SP` merged into `BET-027 Starting Price`

Current P0: **203/203 source-verified (100.0%)**. `SP` is represented as an abbreviation rather than a duplicate Concept.

The three remaining supplemental candidates have also been resolved:

- `ROLE-029 Claiming Professional Jockey` — narrowed to the IHRB licence/status sense.
- `ENTRY-029 Coupled entry` — narrowed to US/Regional regulatory usage.
- `WEIGHT-026 Base rating` — narrowed to the Queensland RBH/programme context.

Current evidence state:

- **314 / 657 source-verified = 47.8%**
- **343 / 657 candidate**
- P0: **203 / 203 source-verified = 100.0%**
- active base seed: **153 / 496 source-verified = 30.8%**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified = 100.0%**

Canonical provenance includes:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/sources/p0-core-sources-v2.tsv
data/glossary-master/sources/p0-core-sources-v3.tsv
data/glossary-master/sources/p0-core-sources-v4.tsv
data/glossary-master/sources/p0-core-sources-v5.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
data/glossary-master/coverage/p0-verification-wave2-v1.tsv
data/glossary-master/coverage/p0-verification-wave3-v1.tsv
data/glossary-master/coverage/p0-verification-wave4-v1.tsv
data/glossary-master/coverage/p0-verification-wave5-v1.tsv
data/glossary-master/coverage/supplemental-candidate-cleanup-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The completion gate remains **HOLD** because the lower-priority active base seed still contains 343 candidates. All current supplemental Concepts are now evidence-backed, so the next lane is exclusively systematic base-seed verification beginning with P1.

Semantic boundaries remain scope-aware: `Group / Grade`, `Going / Track condition`, `Racecourse / Racetrack / Track`, `Post time / Scheduled start time / Off time`, `Stakes race`, `Tote`, and abbreviation-vs-Concept cases are not flattened into global synonym sets.

## Existing public glossary

The current public glossary is a disposable content/runtime baseline, not an input or migration gate. Later reviewed `GLOSSARY-PUBLIC-*` work may delete and regenerate its content from the new master; reusable routing/UI code may be retained only if it satisfies the new public contract.

## Research rule

```text
actual official/specialist material
-> preserve terminology as actually used
-> preserve original script and jurisdiction scope
-> map only when semantically justified
-> create/split Concepts when meanings genuinely differ
-> move abbreviations/orthographic variants out of the Concept layer when appropriate
-> retain register/historical terms separately
-> audit relationships and source evidence
-> verify remaining base Concepts before search/readiness work
```

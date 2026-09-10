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
Current:   GLOSSARY-MASTER-005 — P0 verification closed; lower-priority evidence refinement continues
Next:      P1/base-seed verification + 3 supplemental candidate cleanup
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

## P0 source verification

The first whole-master audit showed the jurisdiction additions were strongly evidenced while the original generic seed was not. Core P0 Concepts were therefore verified with authority evidence before search/readiness work.

- **Wave 1:** 16 P0 — DISC 7, DIST 9
- **Wave 2:** 30 P0 — ENTRY 9, VENUE 16, WEIGHT 5
- **Wave 3:** 51 P0 — RTYPE 8, SURF 7, MEET 19, RESULT 10, BET 7
- **Wave 4:** 44 P0 — HORSE 8, BREED 5, ROLE 5, RUN 12, EQUIP 3, TRAIN 4, PRIZE 2, WELF 5
- **Wave 5:** 11 P0 — RTYPE 1, SURF 3, MEET 5, BET 2; plus one duplicate P0 Concept disposition

Wave 5 closes the current P0 layer at **203/203 source-verified (100.0%)**. `BET-028 SP` was not promoted as a second Concept: The Jockey Club identifies SP as the abbreviation of Starting Price, so it is merged into `BET-027` and represented in the abbreviation layer.

Scope refinement was applied instead of forced universality. `Stakes race` was narrowed from GLOBAL to North America/Regional; `Tote` remains operator/system-sensitive; `Draw`, surface terms, time semantics and notice/state terms retain explicit scope notes.

Current evidence state after wave 5:

- **311 / 657 source-verified = 47.3%**
- **346 / 657 candidate**
- P0: **203 / 203 source-verified = 100.0%**
- P0 candidate: **0**
- active base seed: **153 / 496 source-verified = 30.8%**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified = 98.1%**

Canonical provenance now includes:

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
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The completion gate remains **HOLD** because whole-master/base-seed evidence is still candidate-heavy. P0 closure does not silently authorize MASTER-006 or public publication. The next lane is systematic P1/base-seed verification plus resolution of the three supplemental candidates `ROLE-029`, `ENTRY-029`, and `WEIGHT-026`.

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

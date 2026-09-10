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
Current:   GLOSSARY-MASTER-005 — P0 + supplemental complete; P1 wave 1 complete
Next:      P1/base-seed verification wave 2
Later:     GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

## Current master state

- **655 Concepts / 18 categories**
- P0 203 / P1 299 / P2 135 / P3 18
- relationships 20; relation reviews **15/15 resolved**
- retired/merged Concept rows 7
- register usages 60; effective verified 36; effective candidates 24
- abbreviations 27; historical rows 4
- `public_ready=0`
- public runtime remains disconnected

## Evidence refinement state

P0 verification is complete after five waves. Current P0 is **203/203 source-verified (100.0%)**. The current supplemental research layer is also **161/161 source-verified (100.0%)**.

### P1 base-seed wave 1

Status: **complete current pass**.

Wave 1 verified **27 P1 base-seed Concepts** in DISC, ENTRY, VENUE, DIST and WEIGHT using BHA, IHRB, IFAHR, AQHA, JRA, Racing Australia, Racing Victoria, Equibase and existing authority ledgers.

It also corrected the seed model rather than percentage-promoting bad rows:

- `DIST-013 Dead heat distance` was retired into `RESULT-007 Dead heat`; the malformed seed label is not treated as a valid public synonym.
- `WEIGHT-010 Weight penalty` was merged into `WEIGHT-009 Penalty`; the useful wording is retained only through the Concept disposition layer.
- `DISC-013 Quarter Horse racing` was narrowed from `Americas` to `North America/Regional` because the authority evidence used does not justify the broader scope.
- `ENTRY-009 Maximum field` remains candidate pending canonical review against authority labels such as `Field Limit` / `Field Size Limit`.

Canonical P1 provenance:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
```

Current evidence state:

- **341 / 655 source-verified = 52.1%**
- **314 / 655 candidate**
- P0: **203 / 203 source-verified = 100.0%**
- active base seed: **180 / 494 source-verified = 36.4%**
- supplemental jurisdiction/relationship research: **161 / 161 source-verified = 100.0%**

Canonical audit state includes:

```text
data/glossary-master/coverage/supplemental-candidate-cleanup-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The completion gate remains **HOLD** because 314 lower-priority active base-seed candidates remain. P1 wave 1 does not authorize MASTER-006 or public publication.

Semantic boundaries remain scope-aware: `Group / Grade`, `Going / Track condition`, `Racecourse / Racetrack / Track`, `Post time / Scheduled start time / Off time`, `Stakes race`, `Tote`, abbreviation-vs-Concept cases, and newly reviewed duplicate seed cases are not flattened into global synonym sets.

## Next execution lane

```text
P1/base-seed verification wave 2
-> continue high-utility and high-risk semantic categories
-> review suspicious canonical labels before promotion
-> narrow jurisdiction scope where authority evidence is local
-> merge/split seed Concepts where evidence shows the original model is wrong
-> rerun MASTER-005 coverage and completion gate
-> only after a defensible evidence floor is reached, consider MASTER-006
```

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

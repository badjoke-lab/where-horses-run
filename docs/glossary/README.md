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
Current:   GLOSSARY-MASTER-005 — P0-first source verification; waves 1–2 complete
Next:      P0 wave 3 — remaining high-impact P0 categories
Later:     GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

## Current master state

- **658 Concepts / 18 categories**
- P0 204 / P1 301 / P2 135 / P3 18
- relationships 20; relation reviews **15/15 resolved**
- register usages 60; effective verified 36; effective candidates 24
- abbreviations 26; historical rows 4
- `public_ready=0`
- public runtime remains disconnected

## P0 source verification

The first whole-master audit showed the jurisdiction additions were strongly evidenced while the original generic seed was not. The current lane therefore verifies core P0 Concepts with authority evidence before search/readiness work.

### Wave 1 — complete

Promoted **16 P0 Concepts**:

- DISC: Flat racing, Thoroughbred racing, Jump racing, Harness racing, Trotting, Pacing, Banei racing;
- DIST: Race distance, Metre, Furlong, Mile, Length, Neck, Head, Nose, Sectional time.

### Wave 2 — complete

Promoted **30 P0 Concepts**:

- ENTRY: **9**
- VENUE: **16**
- WEIGHT: **5**

The wave preserves existing semantic boundaries. `Racecourse / Racetrack / Track` remain distinct/polysemous rather than being forced into one synonym set. `Weight-for-age` remains a general Concept rather than absorbing jurisdiction-specific systems. `Declaration`, `Scratch`, `Withdrawal`, and `Non-runner` remain separate procedural/status Concepts.

Current evidence state after wave 2:

- **205 / 658 source-verified = 31.2%**
- **453 / 658 candidate**
- P0: **97 / 204 source-verified = 47.5%**
- P0 candidate: **107**
- active base seed: **47 / 497 source-verified = 9.5%**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified = 98.1%**

Canonical provenance:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/sources/p0-core-sources-v2.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
data/glossary-master/coverage/p0-verification-wave2-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The completion gate remains **HOLD** because 107 P0 Concepts are still candidate. P0 wave 3 now targets the remaining high-impact categories before the gate is rerun again.

## Existing public glossary

The current public glossary is a disposable content/runtime baseline, not an input or migration gate. Later reviewed `GLOSSARY-PUBLIC-*` work may delete and regenerate its content from the new master; reusable routing/UI code may be retained only if it satisfies the new public contract.

## Research rule

```text
actual official/specialist material
-> preserve terminology as actually used
-> preserve original script and jurisdiction scope
-> map only when semantically justified
-> create/split Concepts when meanings genuinely differ
-> retain register/historical terms separately
-> audit relationships and source evidence
-> verify core Concepts before search/readiness work
```

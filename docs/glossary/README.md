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
Current:   GLOSSARY-MASTER-005 — P0-first source verification; wave 1 complete
Next:      P0 wave 2 — ENTRY / VENUE / WEIGHT
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

The first whole-master audit showed the jurisdiction additions were strongly evidenced while the original generic seed was not. P0 verification wave 1 therefore targeted authority-backed base Concepts rather than adding more terminology.

Wave 1 promoted **16 P0 Concepts**:

- DISC: Flat racing, Thoroughbred racing, Jump racing, Harness racing, Trotting, Pacing, Banei racing;
- DIST: Race distance, Metre, Furlong, Mile, Length, Neck, Head, Nose, Sectional time.

Current evidence state:

- **175 / 658 source-verified = 26.6%**
- **483 / 658 candidate**
- P0: **67 / 204 source-verified = 32.8%**
- P0 candidate: **137**
- active base seed: **17 / 497 source-verified**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified = 98.1%**

Canonical wave-1 provenance:

```text
data/glossary-master/sources/p0-core-sources-v1.tsv
data/glossary-master/coverage/p0-verification-wave1-v1.tsv
```

The completion gate remains **HOLD**. The next wave verifies ENTRY / VENUE / WEIGHT P0 Concepts, then evidence coverage is recomputed again. MASTER-006 must not start while the P0 evidence gap remains material.

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

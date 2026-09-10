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
Current:   GLOSSARY-MASTER-005 — P0-first source verification after evidence audit
Next:      GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

## Current master state

- **658 Concepts / 18 categories**
- P0 204 / P1 301 / P2 135 / P3 18
- register usages 60; effective verified 36; effective candidates 24
- abbreviations 26; historical rows 4
- relationships 20
- relationship reviews 15 discovered / 15 resolved / 0 open
- `public_ready=0`
- public runtime remains disconnected

MASTER-005 relation work has resolved the discovered false-synonym, homonym, sense-boundary and register-derived conflicts, including Meeting/Réunion, Group/Grade, Going/Track condition, Track/Racetrack polysemy, Off time vs scheduled time, Mudlark, easy-travelling terminology, and regional betting-support expressions.

## Evidence coverage finding

The first whole-master audit is stored in:

```text
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

It found:

- **159 / 658 source-verified = 24.2%**
- **499 / 658 still candidate**
- P0: **51 / 204 source-verified = 25.0%**
- P0 still candidate: **153**
- active original/base seed: **1 / 497 source-verified**
- supplemental jurisdiction/relationship research: **158 / 161 source-verified = 98.1%**

This means the jurisdiction expansion is strongly evidenced but the original generic seed is not. MASTER-005 therefore remains open. Search-intent work must not start on top of a core inventory where three quarters of P0 Concepts are still candidates.

The immediate sequence is:

```text
verify P0 base Concepts first
-> update evidence and verification status
-> rerun evidence coverage audit
-> rerun MASTER-005 completion gate
-> only if acceptable, advance to MASTER-006
```

## Existing public glossary is disposable content baseline

The existing public glossary and its older bilingual implementation are **not inputs or migration gates** for the new world master. There is no requirement to preserve the current 48-record content set, record IDs, headwords, categories, or EN/JA-only assumptions.

When later `GLOSSARY-PUBLIC-*` implementation is authorized, current glossary content may be deleted wholesale and regenerated from reviewed master data. Reusable routing/UI code may be retained only if it fits the new public contract.

## Current research rule

```text
actual local official/specialist material
-> collect terminology as actually used
-> preserve original script
-> map to a Concept only when justified
-> create a new Concept if the local concept does not fit
-> record regional counterpart / approximate equivalence / no direct equivalent instead of forcing translation
-> collect slang/historical usage separately
-> review Concept identity, polysemy and relationships
-> audit evidence coverage
-> verify core Concepts before search/readiness work
```

WHR-specific interface terms such as `Official live`, `Account required`, and similar access-state labels are site UI vocabulary, not the backbone of the horse-racing knowledge taxonomy.

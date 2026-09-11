# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **654 terms/concepts**.

- **395 are source-verified at the meaning level**.
- **259 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest completed subject pass is **surface / going / track-condition terminology**. Ten terms were verified: Firm, Good to Firm, Good to Soft, Yielding, Yielding to Soft, Fast, Wet Fast, Muddy, Sloppy and dirt-qualified Good.

These are not flattened into one worldwide condition scale. British Going, Irish yielding-based labels, US dirt conditions and Japanese 良/稍重/重/不良 remain separate jurisdictional systems. `Frozen`, `Snow-covered` and `Off turf` remain under review because their seed labels still need canonical-label reconciliation.

The preceding race-type/classification pass verified 15 terms including Maiden Claiming, Novice, National Hunt Flat Race, Allowance/Claiming forms, Pattern, Group/Grade 2-3, Nursery Handicap and Match Race.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **81 additional terms** and removed **3 duplicate or malformed rows**. Current base-dictionary coverage is **234/493 verified (47.5%)**.

Canonical evidence/audit files include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

## What remains

The **259 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

The next practical groups are:

```text
remaining surface/product edge cases
meeting / fixture / schedule terminology
result / inquiry / result-code terminology
prize and betting terminology
welfare / veterinary / safety terminology
remaining ambiguous terms and duplicate cleanup
```

After those groups are reviewed, the evidence/readiness gate will be rerun. Only then should public glossary architecture, search intent, SEO/AI-discovery projection, and rollout be considered.

## Dictionary modeling rule

```text
find the term in actual racing material
-> determine the exact sense
-> preserve country/region and local-language usage
-> add a source that supports that claim
-> split meanings that are genuinely different
-> merge abbreviations, spelling variants, or duplicate identities when appropriate
-> leave uncertain entries under review instead of inventing certainty
```

The existing public glossary remains a disposable runtime baseline and is not the source of truth for this new dictionary.

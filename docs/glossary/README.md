# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **651 terms/concepts**.

- **414 are source-verified at the meaning level**.
- **237 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest completed subject pass is **results / inquiries / decisions / result codes**. It verified thirteen semantic Concepts and retired two duplicate code Concepts. Provisional result, Runner-up, Objection, Protest, Claim of foul, Void race, No contest, Did not finish, Pulled up, Fell, Unseated rider, Brought down and Refused now have meaning-level evidence.

The result-code model was corrected at the same time. `DNF / P / PU / F / U / UR / BD / R` are stored as abbreviations of semantic Concepts. `DQ` and `DISQ` map to Disqualification, and `DH` maps to Dead heat; the former duplicate `DQ` and `DH` Concept rows were retired. `Relegation`, `False start` and `RO / Ran Out` remain under review rather than being forced through the gate.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **100 additional terms** and removed **6 duplicate or malformed rows**. Current base-dictionary coverage is **253/490 verified (51.6%)**.

Canonical evidence/audit files include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/sources/meeting-schedule-sources-v1.tsv
data/glossary-master/sources/result-decision-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/meeting-schedule-verification-v1.tsv
data/glossary-master/coverage/result-decision-verification-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

The abbreviation/code layer now has **38 source-verified rows** after moving result codes out of duplicate Concept positions.

## What remains

The **237 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

The next practical groups are:

```text
prize and betting terminology
welfare / veterinary / safety terminology
remaining result / surface / meeting edge cases when stronger evidence exists
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
-> merge abbreviations, spelling variants, codes, or duplicate identities when appropriate
-> leave uncertain entries under review instead of inventing certainty
```

The existing public glossary remains a disposable runtime baseline and is not the source of truth for this new dictionary.

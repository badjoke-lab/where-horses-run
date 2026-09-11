# Glossary programme

The glossary programme is building a **user-facing worldwide horse-racing dictionary/knowledge base**. Each usable entry should explain what a racing term means, its Japanese equivalent, where that usage applies, important regional differences, and the evidence supporting the definition.

Search/AI discovery is a later structured layer. It must not distort the dictionary itself.

## Current authority

Read these first for glossary work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Working master data](../../data/glossary-master/README.md)

## Current state in plain language

The working dictionary has **653 terms/concepts**.

- **401 are source-verified at the meaning level**.
- **252 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest completed subject pass is **meeting / schedule / official-document terminology**. Six terms were verified: Meeting number, Day number, Condition book, Weights, Barrier draw and First post. Duplicate `MEET-015 Condition book` was retired into `MEET-014`, which now carries the canonical singular NYRA-style label.

Four MEET seed terms remain deliberately unresolved. `Program` conflates spelling and document senses; `Daylight saving time` is a generic civil-time concept whose independent racing-dictionary value is not yet justified; `Season` and `Bulletin` still need sharper racing-specific semantics or authority evidence.

The preceding surface/going pass verified 10 terms without flattening British, Irish, North American dirt and Japanese condition taxonomies into false global equivalents.

## What has been completed

The dictionary was built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

Base-dictionary cleanup has now verified **87 additional terms** and removed **4 duplicate or malformed rows**. Current base-dictionary coverage is **240/492 verified (48.8%)**.

Canonical evidence/audit files include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/sources/meeting-schedule-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/meeting-schedule-verification-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

## What remains

The **252 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or badly named. Review means choosing the correct action rather than chasing a percentage.

The next practical groups are:

```text
result / inquiry / decision / result-code terminology
prize and betting terminology
welfare / veterinary / safety terminology
remaining surface and meeting edge cases when better evidence exists
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

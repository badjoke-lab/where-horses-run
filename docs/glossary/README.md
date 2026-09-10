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

- **370 are source-verified at the meaning level**.
- **284 still require review**: verify, narrow regional scope, rewrite, split, merge, or remove.
- the highest-priority core set is **203/203 verified**;
- jurisdiction-specific research additions are **161/161 verified**;
- publication is still disabled (`public_ready=0`, public runtime disconnected).

The latest completed pass verified **29 terms** in six practical areas:

- horses — Arabian horse, American Quarter Horse, Standardbred, Entire, Juvenile, Maiden;
- breeding — Broodmare, Registration;
- people — Apprentice jockey, Breeder, Groom, Starter, Judge, Handicapper, Clerk of the course, Veterinarian;
- in-race language — Checked, Bumped;
- equipment — Visor, Hood, Cheekpieces, Tongue tie, Shadow roll, Bridle;
- training — Breezing, Handily, Canter, Trackwork, Jump-out.

One duplicate was removed: the second `Breeder` entry under breeding was merged into the participant-role `Breeder` entry. Ambiguous terms such as `Horse` and `Stud`, and race-comment expressions whose precise meaning was not confirmed, remain under review.

## What has been completed

The dictionary was first built from zero rather than copied from the existing public glossary. Major jurisdiction/local-language research and the current slang/abbreviation/historical pass are complete. The core terminology set is fully source-verified, and all current jurisdiction-specific additions are evidence-backed.

The lower-priority base dictionary is now being cleaned systematically. Two completed passes have verified **56 additional base terms** and removed **3 duplicate or malformed rows**. Current base-dictionary coverage is **209/493 verified (42.4%)**.

Canonical evidence/audit files include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

## What remains

The **284 remaining terms** are not all expected to become verified unchanged. Some seed terms are broad, duplicated, polysemous, regional, or simply badly named. Review means choosing the correct action rather than chasing a percentage.

The next practical groups are:

```text
race types / class and eligibility terminology
surface and going terminology
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

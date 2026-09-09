# Glossary programme

The glossary programme is building a user-facing worldwide horse-racing knowledge base with explicit multilingual, regional, evidence, relationship, and search-discovery structure.

## Current authority

Read these first for new glossary-list work:

1. [World racing terminology master specification](world-racing-terminology-master-spec.md)
2. [2026-09-09 glossary roadmap addendum](../project-roadmap-2026-09-09-glossary-addendum.md)
3. [Legacy runtime migration audit](legacy-runtime-audit-2026-09-09.md)
4. [Working master data contract](../../data/glossary-master/README.md)

Current execution pointer:

```text
Completed: GLOSSARY-MASTER-001
Completed: GLOSSARY-MASTER-002
Current glossary Work ID: GLOSSARY-MASTER-003
Next: GLOSSARY-MASTER-004
Current output: core worldwide concept inventory
New public-page expansion/redesign: deferred
```

`GLOSSARY-MASTER-002` recovered the complete legacy public-v1 scope as 48 concepts / nine categories and assigned every legacy concept an explicit migration disposition in `data/glossary-master/legacy-migration-v1.tsv`.

## Relationship to legacy glossary implementation

The files below document the existing glossary v2/bilingual implementation and completed historical expansion units. They remain useful implementation evidence, but they do not define worldwide terminology completeness and do not override the world terminology master specification when the models differ.

Legacy/completed documents include:

- [Schema extension](schema-extension.md)
- [Racing-type expansion](racing-type-expansion.md)
- [Horse-breed expansion](horse-breed-expansion.md)
- [Role expansion](role-expansion.md)
- [Timetable-term expansion](timetable-term-expansion.md)
- [Official-source term expansion](official-source-term-expansion.md)
- [Multilingual field cleanup](multilingual-field-cleanup.md)
- [Related-terms graph](related-terms-graph.md)
- [Beginner explanations](beginner-explanations.md)
- [QA/release](qa-release.md)

Existing public glossary routes may remain while the new master is built. Do not treat their current record count or bilingual field structure as the target model for worldwide terminology coverage.

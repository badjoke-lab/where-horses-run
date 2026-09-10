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
Completed: GLOSSARY-MASTER-002 — zero-based seed: 501 candidate Concepts / 18 categories
Completed current pass: GLOSSARY-MASTER-003 — major-jurisdiction + local-language terminology research
Current:   GLOSSARY-MASTER-004 — slang / colloquial / industry / abbreviation / historical evidence
Next:      GLOSSARY-MASTER-005 — relations / equivalence / source-verification refinement
Then:      GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

The original 501-Concept seed has expanded through jurisdiction research. The current research master contains **654 Concepts / 18 categories**. The count is a research inventory, not a completeness claim, and `public_ready` remains 0.

## Existing public glossary is disposable content baseline

The existing public glossary and its older v2/bilingual documents are **not inputs or migration gates** for the new world master.

There is no requirement to preserve the current glossary's:

- 48-record content set;
- record IDs;
- headwords;
- categories;
- EN/JA-only field assumptions;
- related-term graph.

When the later `GLOSSARY-PUBLIC-*` implementation is authorized, current glossary content may be deleted wholesale and regenerated from the reviewed new master. Reusable routing/UI code may be retained if it still fits the new public contract.

## Relationship to older glossary implementation documents

The files below document the previous glossary implementation and completed historical work. They may be useful as implementation evidence, but they do not define worldwide terminology completeness and do not override the world terminology master specification.

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

Do not spend glossary-master work on one-to-one migration auditing of those records.

## Current research rule

For each jurisdiction/language:

```text
actual local official/specialist material
-> collect terminology as actually used
-> preserve original script
-> map to a Concept only when justified
-> create a new Concept if the local concept does not fit
-> record regional counterpart / approximate equivalence / no direct equivalent instead of forcing translation
-> collect established slang and historical usage separately with appropriate evidence
```

For `GLOSSARY-MASTER-004`, informal and historical usage is normalized separately from Concept identity:

```text
data/glossary-master/register/        colloquial / industry / slang usage and unresolved register candidates
data/glossary-master/abbreviations/   official abbreviations, chart codes, racecard codes, display codes
data/glossary-master/historical/      historical / deprecated / venue-specific retired terminology
```

A slang or legacy label does not create a new Concept automatically. Polysemous terms must remain split/reviewable, and one-off social wording is insufficient evidence.

WHR-specific interface terms such as `Official live`, `Account required`, and similar access-state labels are site UI vocabulary, not the backbone of the horse-racing knowledge taxonomy.

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
Completed current pass: GLOSSARY-MASTER-004 — slang / colloquial / industry / abbreviation / historical evidence
Current:   GLOSSARY-MASTER-005 — relations / equivalence / homonym / source-verification refinement
Next:      GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

The current relationship-refined master contains **653 Concepts / 18 categories**. The count dropped from 654 because MASTER-005 wave 2 merged four duplicate Concept rows while adding three genuinely distinct Concepts. `public_ready` remains 0.

## Current MASTER-005 results

Wave 1 created the scoped relationship and review ledgers. Wave 2 began modifying Concept identity itself rather than merely documenting conflicts.

Merged Concept rows:

```text
MEET-002 Meeting    -> MEET-001 Race meeting (English single-event sense)
MEET-005 Raceday    -> MEET-004 Race day
BET-031 Favourite   -> BET-030 Favorite
RTYPE-005 Bumper    -> RTYPE-006 National Hunt Flat Race
```

Their usable strings remain labels; retired Concept IDs are recorded in `data/glossary-master/concepts/concept-dispositions-v1.tsv` and are not recycled.

New meaning-bearing Concepts:

```text
MEET-042   Racing meeting series (France)
RESULT-030 Race form notation
RUN-046    Tactical pacemaker for another runner
```

This resolves three especially useful regional cases:

- France Galop `Meeting` is a multi-`Réunion` series, while `Réunion` is the one-day meeting;
- France `musique` is a regional implementation of race-form notation and uses a France-specific ordering convention;
- North American `Rabbit` and France Galop tactical `leader` map to one abstract tactical-pacemaker Concept, which is narrower than a generic Pacesetter.

Current relationship state:

- **16** active Concept-to-Concept relations;
- **15** relation review items discovered;
- **7** resolved;
- **8** still open.

Still-open high-priority sets include `Off time / Scheduled start time`, `Racecourse / Racetrack / Track`, `Going / Track condition`, Australasian wet-track aptitude, easy-travelling terminology and cross-language betting-market support terms.

## Existing public glossary is disposable content baseline

The existing public glossary and its older v2/bilingual documents are **not inputs or migration gates** for the new world master. There is no requirement to preserve the current glossary's 48-record content set, record IDs, headwords, categories, EN/JA-only assumptions, or old related-term graph.

When the later `GLOSSARY-PUBLIC-*` implementation is authorized, current glossary content may be deleted wholesale and regenerated from the reviewed master. Reusable routing/UI code may be retained if it still fits the new public contract.

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
-> merge only true duplicates; split real sense differences
```

Current normalized layers include:

```text
data/glossary-master/register/
data/glossary-master/abbreviations/
data/glossary-master/historical/
data/glossary-master/relations/
data/glossary-master/labels/
data/glossary-master/definitions/
data/glossary-master/sources/
```

WHR-specific interface terms such as `Official live`, `Account required`, and similar access-state labels are site UI vocabulary, not the backbone of the horse-racing knowledge taxonomy.

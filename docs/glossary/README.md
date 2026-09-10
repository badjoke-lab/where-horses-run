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
Current:   GLOSSARY-MASTER-005 — source/evidence coverage audit after relation review closure
Next:      GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
New public-page expansion/redesign: deferred
```

The current relationship-refined master contains **658 Concepts / 18 categories**. `public_ready` remains 0.

## Current MASTER-005 results

Waves 1–3 established and refined scoped relationships, Concept identity, time semantics, track polysemy and condition-system boundaries. Wave 4 closes every relation-review item discovered in those waves.

Earlier identity cleanup retained these merges:

```text
MEET-002 Meeting    -> MEET-001 Race meeting (English single-event sense)
MEET-005 Raceday    -> MEET-004 Race day
BET-031 Favourite   -> BET-030 Favorite
RTYPE-005 Bumper    -> RTYPE-006 National Hunt Flat Race
```

Wave 2 added `MEET-042 Racing meeting series (France)`, `RESULT-030 Race form notation`, and `RUN-046 Tactical pacemaker for another runner`.

Wave 3 fixed `Off time` as the actual race-start timestamp, retained `Scheduled start time` as planned time, kept Going/Track condition as separate regional taxonomies, and retained sense-scoped Racetrack/Track polysemy instead of forcing false global synonymy.

Wave 4 adds five meaning-bearing Concepts exposed by the remaining review cases:

```text
HORSE-034 Wet-track aptitude
RUN-047   Travelling easily
RUN-048   Under pressure
BET-043   Strong betting support
BET-044   Dominant betting concentration
```

This resolves:

- regional `Spell / Spelling` as narrower than generic `Layoff`;
- AU/NZ `Mudlark` under Wet-track aptitude, not track condition;
- AU `under double wraps` and NZ `on the bit/bridle` under Travelling easily, contrasted with NZ `off the bit/bridle` under Under pressure;
- AU `backed off the map` under Strong betting support and JRA `一本かぶり` under narrower Dominant betting concentration.

Current relationship state:

- **20** active Concept-to-Concept relations;
- **15** relation review items discovered;
- **15** resolved;
- **0** open.

Register resolution has also advanced to **12** resolved usage rows, leaving **24** effective register candidates from the original 60 usage rows.

The next task is not public implementation and not automatic MASTER-006 promotion. It is a **source/evidence coverage audit of the 658-Concept master**. MASTER-005 remains current until that gate is assessed.

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
-> audit evidence coverage before search/readiness work
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

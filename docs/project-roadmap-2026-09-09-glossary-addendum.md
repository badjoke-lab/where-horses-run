# Where Horses Run project roadmap — 2026-09-09 glossary knowledge-master addendum

Status: active parallel glossary addendum  
Adopted: 2026-09-09  
Base roadmap: `docs/project-roadmap.md`  
Current primary UI roadmap addendum remains: `docs/project-roadmap-2026-09-06-addendum.md`  
Glossary knowledge-model authority: `docs/glossary/world-racing-terminology-master-spec.md`

This addendum creates a parallel glossary knowledge lane. It does not supersede the active map-first UI lane or Calendar quality/coverage lane and does not change Calendar acquisition/publication boundaries.

## Current glossary stage

Plain-language state:

```text
Working dictionary: 654 terms/concepts
Meaning-level source verified: 370
Still under review: 284
Highest-priority core terms: 203/203 verified
Jurisdiction-specific research additions: 161/161 verified
Public glossary publication: disabled
```

Internal execution state:

```text
Completed: GLOSSARY-MASTER-001 — specification / authority
Completed: GLOSSARY-MASTER-002 — zero-based seed
Completed current pass: GLOSSARY-MASTER-003 — major-jurisdiction + local-language terminology research
Completed current pass: GLOSSARY-MASTER-004 — slang / colloquial / industry / abbreviation / historical evidence
Current: GLOSSARY-MASTER-005 — evidence / semantic cleanup
Lower-priority verification pass 1: complete
Lower-priority verification pass 2: complete
Later: GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
```

## Programme objective

The glossary is first a useful user-facing worldwide horse-racing dictionary and knowledge resource. A user should be able to understand a term, its Japanese equivalent, where it is used, how its meaning changes by jurisdiction, and what source supports that explanation. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

## Completed foundation

`GLOSSARY-MASTER-001` through `004` established the specification, a zero-based 18-category seed, major-jurisdiction/local-language research, and the current register/abbreviation/historical layer.

The relationship review currently has 20 scoped relations and 15/15 reviewed conflicts resolved. Abbreviations/codes have 27 source-verified rows and historical terminology has 4 source-verified rows.

## Current evidence and semantic cleanup

The highest-priority core terminology is **203/203 source-verified**. The current jurisdiction/relationship research additions are **161/161 source-verified**.

The remaining task is to clean the lower-priority base dictionary. This does **not** mean automatically marking every seed row as valid. For each term the review may verify it, narrow its regional scope, rewrite its definition, split senses, merge a duplicate, or remove a bad seed row.

### Completed lower-priority pass 1

Verified **27 terms** across:

- racing disciplines;
- entries and declarations;
- racecourse/course terminology;
- distance and timing;
- weights and handicapping.

It also retired `Dead heat distance` into `Dead heat` and `Weight penalty` into `Penalty`.

### Completed lower-priority pass 2

Verified **29 more terms** across:

- horses — Arabian horse, American Quarter Horse, Standardbred, Entire, Juvenile, Maiden;
- breeding — Broodmare, Registration;
- racing people — Apprentice jockey, Breeder, Groom, Starter, Judge, Handicapper, Clerk of the course, Veterinarian;
- in-race expressions — Checked, Bumped;
- horse equipment — Visor, Hood, Cheekpieces, Tongue tie, Shadow roll, Bridle;
- training — Breezing, Handily, Canter, Trackwork, Jump-out.

`BREED-017 Breeder` was retired as a duplicate of the participant-role `ROLE-009 Breeder`. Ambiguous items such as `Horse`, `Stud`, or insufficiently evidenced race-comment synonyms remain under review rather than being forced through the evidence gate.

Authority/audit files:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

Current observed state:

- all Concepts: **370/654 source-verified (56.6%)**, 284 candidate;
- core highest-priority set: **203/203 source-verified (100.0%)**;
- active base seed: **209/493 source-verified (42.4%)**, 284 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**;
- retired/merged Concept rows: **8**.

## What happens next

The remaining **284 terms** will be processed by understandable subject groups rather than by an opaque percentage target:

```text
race types, class and eligibility
-> track surface / going / condition
-> meetings, fixtures and scheduling
-> results, inquiries, decisions and result codes
-> prize money and betting
-> welfare, veterinary and safety
-> unresolved ambiguous terms and duplicate cleanup
```

After those groups are processed, the evidence/readiness gate will be rerun. `GLOSSARY-MASTER-005` remains **HOLD — not complete** today because 284 base terms still require review.

## MASTER-006 — search-intent, coverage, readiness

Status: **queued, not started**.

Only after the current evidence/semantic review reaches a defensible completion floor may this stage add definition/comparison/regional/how-why/translation/abbreviation/racecard-reading search intents and decide whether public implementation planning is justified.

## Public implementation lane

Deferred:

```text
GLOSSARY-PUBLIC-001  information architecture / URL contract
GLOSSARY-PUBLIC-002  concept/category content contract
GLOSSARY-PUBLIC-003  multilingual/local-label presentation
GLOSSARY-PUBLIC-004  comparison/regional presentation
GLOSSARY-PUBLIC-005  structured data / machine-readable projection
GLOSSARY-PUBLIC-006  internal-link integration
GLOSSARY-PUBLIC-007  EN/JA/responsive/accessibility/SEO/AI-discovery QA
GLOSSARY-PUBLIC-008  reviewed rollout
```

The current public glossary remains disposable content. There is no old-record migration gate.

## Current execution pointer

```text
Current Work ID: GLOSSARY-MASTER-005
Working dictionary: 654 terms
Verified: 370
Still under review: 284
Next subject group: race types / class / eligibility, then surfaces and meeting/result terminology
MASTER-006: blocked until the evidence/readiness gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.

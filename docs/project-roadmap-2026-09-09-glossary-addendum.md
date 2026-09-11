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
Working dictionary: 653 terms/concepts
Meaning-level source verified: 401
Still under review: 252
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
Base-dictionary pass 1: complete
Base-dictionary pass 2: complete
Race types / classifications pass: complete current pass
Surface / going / track-condition pass: complete current pass
Meeting / schedule / official-document pass: complete current pass
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

### Completed base-dictionary pass 1

Verified **27 terms** across racing disciplines, entries/declarations, racecourse/course terminology, distance/timing and weights/handicapping. It also retired `Dead heat distance` into `Dead heat` and `Weight penalty` into `Penalty`.

### Completed base-dictionary pass 2

Verified **29 more terms** across horses, breeding, racing people, in-race expressions, horse equipment and training. `BREED-017 Breeder` was retired as a duplicate of participant-role `ROLE-009 Breeder`.

### Completed race types / classifications pass

Verified **15 additional terms**: Maiden Claiming, Novice, Beginners Chase, National Hunt Flat Race, Allowance, Starter Allowance, Claiming, Optional Claiming, Pattern, Group 2 / Group 3, Grade 2 / Grade 3, Nursery Handicap and Match Race.

The pass corrected semantics instead of merely changing status. `Beginners Chase` was normalized to current BHA wording, Allowance was kept separate from a global Conditions Race synonym claim, Optional Claiming was rewritten around its North American claiming/non-claiming eligibility structure, and Match Race was narrowed to the directly supported North American sense. `Selling race` remains under review because current BHA terminology uses `Seller`.

### Completed surface / going / track-condition pass

Verified **10 additional terms**: Firm, Good to Firm, Good to Soft, Yielding, Yielding to Soft, Fast, Wet Fast, Muddy, Sloppy and dirt-qualified Good.

The pass keeps regional systems separate. BHA Going, IHRB yielding-based terminology, US dirt conditions and JRA 良/稍重/重/不良 are not flattened into exact global equivalents. `Frozen`, `Snow-covered` and `Off turf` remain under review because their seed labels still require canonical-label reconciliation.

### Completed meeting / schedule / official-document pass

Verified **6 additional terms**: Meeting number, Day number, Condition book, Weights, Barrier draw and First post.

`MEET-015 Condition book` was retired as a duplicate of `MEET-014`, and the canonical English label for `MEET-014` was normalized from `Conditions book` to current NYRA-style `Condition book`. `Weights` is explicitly modeled as the publication/programme-stage sense rather than a second horse-weight Concept. `Program` remains candidate because the seed conflates an orthographic variant of Programme with possible racecard/document senses. `Season`, `Bulletin` and `Daylight saving time` also remain under review rather than being promoted without stronger racing-specific value or evidence.

Authority/audit files now include:

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

Current observed state:

- all Concepts: **401/653 source-verified (61.4%)**, 252 candidate;
- core highest-priority set: **203/203 source-verified (100.0%)**;
- active base seed: **240/492 source-verified (48.8%)**, 252 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**;
- retired/merged Concept rows: **9**.

## What happens next

The remaining **252 terms** will continue by understandable subject groups:

```text
results, inquiries, decisions and result codes
-> prize money and betting
-> welfare, veterinary and safety
-> remaining surface / meeting edge cases when stronger evidence exists
-> unresolved ambiguous terms and duplicate cleanup
```

After those groups are processed, the evidence/readiness gate will be rerun. `GLOSSARY-MASTER-005` remains **HOLD — not complete** because 252 base terms still require review.

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
Working dictionary: 653 terms
Verified: 401
Still under review: 252
Next subject group: results / inquiries / decisions / result codes
MASTER-006: blocked until the evidence/readiness gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.

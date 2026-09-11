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
Working dictionary: 647 terms/concepts
Meaning-level source verified: 462
Still under review: 185
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
Results / inquiries / decisions / result-code pass: complete current pass
Prize money / betting / odds pass: complete current pass
Welfare / veterinary / safety pass: complete current pass
Residual edge-case pass: complete current pass
Later: GLOSSARY-MASTER-006 — search-intent / coverage / readiness review
```

## Programme objective

The glossary is first a useful user-facing worldwide horse-racing dictionary and knowledge resource. A user should be able to understand a term, its Japanese equivalent, where it is used, how its meaning changes by jurisdiction, and what source supports that explanation. Search/AI discoverability is a separate structured layer and must not distort canonical knowledge truth.

## Completed foundation

`GLOSSARY-MASTER-001` through `004` established the specification, a zero-based 18-category seed, major-jurisdiction/local-language research, and the current register/abbreviation/historical layer.

The relationship review currently has 20 scoped relations and 15/15 reviewed conflicts resolved. The abbreviation/code layer has **38 source-verified rows** and historical terminology has 4 source-verified rows.

## Current evidence and semantic cleanup

The highest-priority core terminology is **203/203 source-verified**. The current jurisdiction/relationship research additions are **161/161 source-verified**.

The remaining task is to clean the lower-priority base dictionary. This does **not** mean automatically marking every seed row as valid. For each term the review may verify it, narrow its regional scope, rewrite its definition, split senses, merge a duplicate, move a code/regional label to the appropriate layer, or remove a bad seed row.

### Completed subject passes

- Base dictionary pass 1: **27 verified**, 2 malformed/duplicate rows retired.
- Base dictionary pass 2: **29 verified**, duplicate `Breeder` consolidated.
- Race types/classifications: **15 verified**.
- Surface/going/track condition: **10 verified**, regional condition systems kept separate.
- Meeting/schedule/official documents: **6 verified**, duplicate `Condition book` consolidated.
- Results/inquiries/decisions/result codes: **13 verified**, duplicate result-code Concepts retired and codes moved to the abbreviation layer.
- Prize money/betting/odds: **28 verified**, duplicate regional wager mechanics consolidated.
- Welfare/veterinary/safety: **13 verified**, bringing WELF to **18/18 source-verified**.
- Residual edge cases: **7 verified**, duplicate `Program` consolidated into `Programme`.

### Residual edge-case pass

The residual pass verified Season, Bulletin, Relegation, False start, Totalisator, Fractional odds and On the board. It also retired `MEET-013 Program` into `MEET-012 Programme`, preserving `Program` as a regional spelling/document label rather than a second Concept.

The pass deliberately did **not** promote five remaining edge cases: `Daylight saving time`, `Ran Out`, generic `Bonus`, polysemous `Stake`, and `American odds`. Their current evidence or Concept boundary is insufficient for a clean worldwide racing-dictionary entry.

Authority/audit files now include:

```text
data/glossary-master/sources/p1-core-sources-v1.tsv
data/glossary-master/sources/p1-core-sources-v2.tsv
data/glossary-master/sources/race-type-condition-sources-v1.tsv
data/glossary-master/sources/surface-going-sources-v1.tsv
data/glossary-master/sources/meeting-schedule-sources-v1.tsv
data/glossary-master/sources/result-decision-sources-v1.tsv
data/glossary-master/sources/prize-betting-sources-v1.tsv
data/glossary-master/sources/welfare-safety-sources-v1.tsv
data/glossary-master/sources/residual-edgecase-sources-v1.tsv
data/glossary-master/coverage/p1-verification-wave1-v1.tsv
data/glossary-master/coverage/p1-verification-wave2-v1.tsv
data/glossary-master/coverage/race-type-condition-verification-v1.tsv
data/glossary-master/coverage/surface-going-verification-v1.tsv
data/glossary-master/coverage/meeting-schedule-verification-v1.tsv
data/glossary-master/coverage/result-decision-verification-v1.tsv
data/glossary-master/coverage/prize-betting-verification-v1.tsv
data/glossary-master/coverage/welfare-safety-verification-v1.tsv
data/glossary-master/coverage/residual-edgecase-verification-v1.tsv
data/glossary-master/coverage/master-005-evidence-coverage-v1.tsv
data/glossary-master/coverage/master-005-completion-gate-v1.tsv
```

Current observed state:

- all Concepts: **462/647 source-verified (71.4%)**, 185 candidate;
- core highest-priority set: **203/203 source-verified (100.0%)**;
- active base seed: **301/486 source-verified (61.9%)**, 185 candidate;
- supplemental jurisdiction/relationship research: **161/161 source-verified (100.0%)**;
- MEET: **37/38 source-verified (97.4%)**;
- RESULT: **27/28 source-verified (96.4%)**;
- BET: **38/39 source-verified (97.4%)**;
- WELF: **18/18 source-verified (100.0%)**;
- retired/merged Concept rows: **15**;
- abbreviations/codes: **38/38 source-verified**.

## What happens next

The broad subject passes and first residual edge-case pass are complete for their current scope. The remaining **185 terms** now move through the categories with the largest unresolved candidate sets:

```text
running / trip / race-comment terminology
-> equipment and training terminology
-> horse / breeding / participant roles
-> venue and entry terminology
-> remaining race type / surface / distance / weight candidates
-> revisit the five residual edge cases only with stronger evidence
-> rerun evidence/readiness gate
```

`GLOSSARY-MASTER-005` remains **HOLD — not complete**. A 71.4% verified master with 185 unresolved seed Concepts is not ready to advance merely because the near-complete categories have been cleaned up.

## MASTER-006 — search-intent, coverage, readiness

Status: **queued, not started**.

Only after the residual semantic review reaches a defensible completion floor may this stage add definition/comparison/regional/how-why/translation/abbreviation/racecard-reading search intents and decide whether public implementation planning is justified.

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
Working dictionary: 647 terms
Verified: 462
Still under review: 185
Next subject group: running / trip / race-comment terminology
MASTER-006: blocked until the evidence/readiness gate passes
Public implementation: deferred
```

Conversation history is not execution authority. Future glossary work should read the terminology specification, `data/glossary-master/README.md`, the coverage/gate files, and this addendum first.

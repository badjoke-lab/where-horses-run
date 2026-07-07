# Where Horses Run project roadmap

Status: active canonical project roadmap  
Country-page programme: complete  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-07

## Purpose

Where Horses Run progresses through:

```text
official-source research
-> capability and publication decisions
-> bilingual country pages
-> Calendar Readiness
-> reviewed acquisition and candidate generation
-> human-approved public timetable data
-> Calendar / Today / Tomorrow / country / racecourse / meeting views
-> recurring maintenance and expansion
```

## Current position

```text
published country pages:       98
published routes:              98 EN + 98 JA = 196
Profile v2 records:            98
Calendar Readiness countries:  98
Calendar Readiness records:   116
Authority/source records:     116
Country-page programme: complete
```

Completed Calendar foundations:

- `WHR-CAL-CONTRACT-02`;
- `WHR-CAL-BASELINE-RECONCILE`;
- `WHR-CAL-PIPELINE-V1`;
- `WHR-CAL-DYNAMIC-DATES`;
- `WHR-CAL-OPS-V1`;
- `WHR-CAL-JAPAN-A-PLUS-RECONCILE`;
- `WHR-CAL-JAPAN-JRA-A-PLUS`.

NAR A+ is current. The first reviewed promotion through 2026-07-04 remains valid partial data. July full-month tooling is a bounded Completion Audit path, not the ordinary update gate.

The following shared prerequisite work discovered during NAR is complete:

- cross-system incremental coverage contract;
- Coverage Observation schema and validator;
- Batch / Promotion / Coverage / Completion responsibility split;
- normal promotion rank-regression guard;
- explicit corrective-downgrade boundary;
- NAR incremental operator foundation for arbitrary and cross-month windows;
- deterministic overlap aggregation;
- selected-meeting scope support;
- Coverage Observation and retry-target artifact generation.

The active next work is NAR ordinary-operator validation and the next explicit source-visible collection window.

## Governing Calendar model

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

Validation roles:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

Rules:

- source capability and individual meeting evidence are separate;
- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- operator runs may be irregular;
- requested windows may vary, overlap, cross months, or target selected meetings;
- shorter source horizons and valid partial batches are normal;
- absence from one run is not deletion or cancellation;
- normal promotion is monotonic by reviewed rank;
- corrective downgrade is a separately controlled reviewed path;
- Completion Audit is the only role that may require every expected meeting in its declared scope.

Completion is an explicit audit claim.

Incremental maintenance is normal.

## Publication pipeline

```text
official source
-> adapter or reviewed import
-> candidate
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical update
-> public projection
-> static build

parallel:
Coverage Observation
-> Coverage Audit
-> retry targets
-> optional Completion Audit
```

Candidate generation is not publication. Scheduled and unattended canonical/public writes remain disabled unless separately approved.

## Phase status

### Governance and contracts

Status: complete with active incremental extensions.

Canonical additions now include:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
```

### Country research and publication

Status: complete.

The 98-country research/page programme, Profile v2 publication, Calendar Readiness backfill, and final combined audit are complete.

### Calendar baseline and Pipeline v1

Status: complete.

Normal build/check is read-only. Dynamic Dates and Operations v1 are complete. Scheduled source refresh and unattended publication remain disabled.

### Japan A+ policy

Status: complete.

| Japan system | Technical Rank | Public Ceiling |
| --- | --- | --- |
| JRA central racing | A+ | A+ |
| NAR and local-government racing | A+ | A+ |
| Banei Tokachi | A+ | A+ |

System A+ is a ceiling, not invented meeting detail.

## Japan pilot activation

Status: current  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

### JRA A+

Status: complete.

The JRA reference implementation remains valid, but it does not create a rule requiring future fixed-month batch completeness.

### NAR A+

Completed:

- source architecture;
- bounded route probe;
- candidate adapter;
- fourteen-racecourse compatibility review;
- 14/14 complete fixture set;
- first reviewed A+ promotion through 2026-07-04;
- July bounded Completion Audit tooling;
- full-month candidate PR validation;
- incremental coverage contract;
- Coverage Observation contract;
- validation responsibility split;
- monotonic normal promotion guard;
- NAR incremental core;
- arbitrary and cross-month date-window support;
- overlap-safe deterministic aggregation;
- selected-meeting scope support;
- Coverage Observation generation;
- explicit retry-target generation;
- local review-only operator;
- dedicated NAR incremental operator CI workflow.

Historical implementation marker retained for compatibility: NAR ordinary-operator refactoring.

Current sequence:

1. validate PR #429 incremental operator core, output, coverage, and runtime boundaries;
2. merge the NAR ordinary incremental operator foundation;
3. collect the next source-visible NAR batch with an explicit requested window;
4. review candidates, observed scope, unresolved dates, unresolved meeting IDs, source errors, and retry targets;
5. promote valid reviewed records independently of unresolved dates elsewhere;
6. run irregular date-window or selected-meeting retries as needed;
7. run July Completion Audit only when claiming July coverage complete;
8. complete freshness, rollback, public projection, and bilingual QA.

### Banei A+

Banei is next. It inherits common incremental and validation contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.

Ordinary Banei updates may be partial and irregular. July full-month completeness remains a separate Completion Audit claim.

### Japan integration

Validate same-day three-system output, Calendar/Today/Tomorrow views, country/racecourse links, source health, freshness, fallback, rollback, overlap safety, and bilingual QA.

## Later pilots

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

Later pilots inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, human review, display boundary, freshness, fallback, rollback, and bilingual QA requirements.

No pilot may require fixed-month completeness before ordinary valid partial promotion.

## Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible source, coverage, and freshness;
- honest partial coverage states;
- safe stale/failure handling;
- bilingual responsive QA;
- operations and recovery ownership;
- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.

## Product follow-up phases

After Calendar Public v1:

1. strengthen racecourse pages and page-link architecture;
2. implement glossary, racing types, search, filters, and SEO;
3. expand by reviewed source/readiness priority;
4. operate steady-state incremental maintenance.

Steady-state maintenance may use arbitrary windows, overlap retries, selected-meeting retries, and source-visible-horizon runs. Nominal daily/weekly/monthly/seasonal rhythms are priorities, not prerequisites for later valid updates.

## Required reading

Every Calendar PR reads:

1. `docs/governance/document-authority.md`;
2. this roadmap;
3. `docs/calendar/implementation-roadmap.md`;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/coverage-observation-schema.md`;
6. `docs/calendar/validation-responsibility-contract.md`;
7. active system-specific plan;
8. deployment/CI policy;
9. applicable machine-readable policies, registries, controls, and public display boundaries.

## Historical transition markers

Completed historical implementation markers retained for release-gate compatibility:

Completed Work ID: `WHR-CAL-PIPELINE-V1`  
Completed Work ID: `WHR-CAL-DYNAMIC-DATES`  
Completed Work ID: `WHR-CAL-OPS-V1`  
Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

Completed JRA A+ transition:

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

Completed Japan A+ reconciliation transition:

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

Superseded compatibility marker:

> Current Work ID: `WHR-CAL-JAPAN-NAR`  
> Next Work ID: `WHR-CAL-JAPAN-BANEI`

## Maintenance

Update this roadmap in the same PR whenever current/next Work ID, phase boundary, completion condition, material tracker/readiness count, deployment model, or active canonical plan changes.

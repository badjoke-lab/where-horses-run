# Calendar implementation roadmap

Status: active canonical programme roadmap  
Last reviewed: 2026-07-06

## Purpose

All Calendar work follows:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
```

The shared architecture is:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

Ordinary updates may be partial, irregular, overlapping, and retried. Completion is an explicit audited claim.

## Foundation stages

### Stage 1 — contracts

Completed Work ID: `WHR-CAL-CONTRACT-02`

Source Test v2, Calendar Readiness, authority/source identity, candidate contract, Coverage Observation, and validation responsibility foundations are implemented.

### Stage 2 — readiness backfill and research

Status: complete.

### Stage 3 — 98-country audit

Completed Work ID: `WHR-AUDIT-COUNTRY-CALENDAR-98`

Status: complete.

### Stage 4 — baseline reconciliation

Completed Work ID: `WHR-CAL-BASELINE-RECONCILE`

Status: complete. Normal build/check is read-only and incomplete scheduled refresh remains paused.

## Stage 5 — reviewed Calendar pipeline

Pipeline v1 status: complete  
Dynamic Dates status: complete  
Operations v1 status: complete  
Completed Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

Standard flow:

```text
official source
-> adapter or reviewed import
-> candidate
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical data
-> public projection
-> static build

parallel:
Coverage Observation
-> Coverage Audit
-> retry targets
-> optional Completion Audit
```

### Dynamic Dates

Dynamic Dates status: complete.

Calendar, Today, Tomorrow, and rolling 30-day views use explicit date/timezone rules and safe current/stale/empty states.

### Operations v1

Operations v1 status: complete.

Source health, review packages, pause/rollback, seasonal rollover, and source-breakage escalation are implemented. Scheduled and unattended publication remain disabled.

## Shared incremental coverage implementation

Completed:

1. cross-system incremental coverage contract;
2. Coverage Observation schema and validator foundation;
3. requested/observed scope separation;
4. partial shorter source horizon validation;
5. selected-meeting retry observation support;
6. audited-complete reference and unresolved-item guards;
7. Batch / Promotion / Coverage / Completion responsibility split;
8. machine-readable validation responsibility map;
9. normal promotion rank-regression rejection;
10. explicit corrective-downgrade boundary and reason set.

The validation responsibility split is complete.

Current shared implementation sequence:

1. refactor NAR ordinary collection away from fixed July Completion Audit gating;
2. support arbitrary windows and overlap-safe retries;
3. support selected-meeting retries;
4. emit Coverage Observation from ordinary operation;
5. emit explicit retry targets;
6. continue NAR reviewed incremental promotion;
7. reuse the common contracts for Banei, HKJC, UAE, and later systems.

## Promotion rule

Normal promotion is monotonic by reviewed rank.

```text
C -> B      allowed
B -> A      allowed
A -> A+     allowed
A+ -> C     rejected in normal promotion
```

A corrective downgrade is a separately controlled reviewed path. Ordinary source refresh must not infer downgrade from lower-detail observation.

## Japan A+ policy

Approved policy:

- JRA central racing: Technical Rank A+ / Public Ceiling A+;
- NAR and local-government racing: Technical Rank A+ / Public Ceiling A+;
- Banei Tokachi: Technical Rank A+ / Public Ceiling A+.

System-level A+ is a ceiling, not invented meeting detail. A meeting may enter at any reviewed supported rank.

## Stage 6 — Japan pilot activation

Status: current  
Completed Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

```text
WHR-CAL-JAPAN-JRA-A-PLUS
WHR-CAL-JAPAN-NAR-A-PLUS
WHR-CAL-JAPAN-BANEI-A-PLUS
WHR-CAL-JAPAN-INTEGRATION
```

### JRA A+ — complete

The JRA A+ reference implementation is complete. It remains a reference, not a rule requiring future fixed-month batch completeness.

### NAR A+ — current

Completed:

- source architecture;
- bounded route probe;
- candidate adapter;
- all-fourteen compatibility review;
- 14/14 complete fixture set;
- first reviewed partial A+ promotion through 2026-07-04;
- July full-month schedule collector and Completion Audit path;
- dedicated generated full-month candidate PR validation;
- cross-system incremental coverage contract;
- Coverage Observation schema and validator foundation;
- validation responsibility split;
- monotonic normal promotion guard.

Current sequence:

1. refactor NAR ordinary operator for arbitrary windows;
2. make overlap-safe retries deterministic;
3. add selected-meeting retries;
4. emit Coverage Observation and retry targets;
5. collect the next source-visible NAR batch;
6. review and promote valid records independently of unresolved dates elsewhere;
7. run July Completion Audit only when claiming July coverage complete;
8. complete freshness, rollback, public projection, and bilingual QA.

Do not flatten local-government racing into a JRA-like feed.

### Banei A+ — next

Banei inherits the common incremental contracts but uses Banei-specific source routes, terminology, distance interpretation, and course semantics.

Banei sequence:

1. implement arbitrary-window schedule/detail acquisition;
2. allow direct higher-rank candidate output when supported;
3. preserve meeting identity while detail is pending;
4. review/promote valid partial batches independently;
5. maintain Coverage Observation and retry targets;
6. use July whole-month validation only for an explicit Completion Audit claim;
7. complete freshness, rollback, and bilingual QA.

## Stage 7 — additional pilots

```text
WHR-CAL-HONG-KONG-HKJC
WHR-CAL-UAE-ERA
```

HKJC and UAE inherit Pipeline v1, incremental coverage, Coverage Observation, validation responsibility, human review, public boundary, freshness, fallback, rollback, and bilingual QA requirements.

No pilot may require fixed-month completeness before ordinary valid partial promotion.

## Stage 8 — Calendar public v1

Work ID: `WHR-CAL-PUBLIC-V1`

Release criteria include:

- dynamic Calendar, Today, and Tomorrow;
- maintained approved-pilot records;
- one meeting per list row;
- C/B/B+/A/A+ boundaries;
- visible source, coverage, and freshness;
- honest partial coverage;
- safe stale/failure handling;
- bilingual responsive QA;
- no participant, betting, result, payout, prediction, full-racecard, raw-source, embedded-video, or direct-stream output.

## Stages 9–12

### Stage 9 — racecourse pages and product navigation

Strengthen canonical racecourse pages, current/next meeting state, recent reviewed meetings, course/distance profile, official sources, freshness, and cross-navigation.

### Stage 10 — glossary, racing types, search, filtering, SEO

Implement reviewed terminology, local names, readings/pronunciation metadata where supported, navigation, search/filtering, metadata, sitemap, canonical/hreflang, structured data, methodology, coverage, and limitations pages.

### Stage 11 — expansion cohorts

Choose systems by source stability, coverage, timetable depth, maintenance cost, publication safety, season timing, and user value. Every system inherits the common incremental and validation contracts.

### Stage 12 — steady-state maintenance

Operator-triggered maintenance may be irregular. Valid operations include arbitrary windows, overlap retries, selected-meeting retries, and source-visible-horizon runs.

Nominal daily, weekly, monthly, and seasonal rhythms are priority targets, not prerequisites for later valid updates.

## Per-PR document review

Calendar PRs review:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap.md`;
3. this roadmap;
4. `docs/calendar/incremental-coverage-contract.md`;
5. `docs/calendar/coverage-observation-schema.md`;
6. `docs/calendar/validation-responsibility-contract.md`;
7. active source-specific plan;
8. deployment/CI policy;
9. applicable machine-readable policies, registries, controls, and display boundaries.

## Deployment rule

Research, contracts, fixtures, candidates, and non-public runtime work use GitHub validation without Cloudflare preview. Rendered releases use preview/production deployment only when materially required by deployment policy.

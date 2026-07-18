# Where Horses Run v1 data audit

Status: complete  
Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-DATA-AUDIT-01`  
Reviewed: 2026-07-18

## Decision

The complete public data input graph used by `src/lib/data.ts` has been audited for the v1 candidate.

The audit covers every imported static and generated JSON file, the two locale dictionaries, the four merged entity collections used by the site, and the generated 771-page sitemap. It preserves the frozen v1 feature and data scope.

## Audited input graph

```text
JSON imports in src/lib/data.ts: 152
Unique JSON imports: 152
Audited JSON files including locale dictionaries: 154
Static JSON files: 148
Generated JSON files: 6
Top-level rows measured: 462
URL values measured: 372
Public sitemap URLs: 771
```

The former `validate:data` command remains required, but by itself it covers only the original required-file set. The v1 audit adds complete import-graph discovery so split country, profile, racecourse, source, evidence, amendment, and generated files cannot escape review.

## Merged entity collections

The same merge boundaries used by the application were reconstructed:

```text
Countries: 98 records / 98 IDs / 98 slugs
Country profiles: 98 records / 98 IDs / 98 slugs
Racecourses: 36 records / 36 IDs / 36 slugs
Sources: 171 records / 171 IDs
```

Results:

```text
Duplicate ID groups inside a file: 0
Duplicate slug groups inside a file: 0
Duplicate ID groups after application merges: 0
Duplicate slug groups after application merges: 0
Invalid HTTP or HTTPS URLs: 0
Forbidden public data keys: 0
```

Forbidden keys include participant and betting-oriented fields such as horse, jockey, trainer, draw, weight, odds, result, payout, prediction, entry, participant, and racecard fields. None occur in the audited public input graph.

## Public text boundary cleanup

The first complete pass found 29 instances of development-phase or internal workflow wording across repository-visible input data. Examples included references to parser work, acquisition, candidate stages, dry runs, internal splitting, M3, PR numbers, and live-fetch implementation status.

The audit replaced those statements with public coverage and official-confirmation language in eight data files:

```text
data/static/countries.json
data/static/sources.json
data/static/country-page-sources-01-04.json
data/static/country-profiles-v2.json
data/static/country-racing-inventory.json
data/generated/latest.json
data/generated/fetch-status.json
data/generated/live-fetch-probe-status.json
```

Final result:

```text
Restricted public text matches: 0
Restricted rendered text matches: 0
Files with restricted findings: 0
```

The audit keeps 339 public-safe note-like metadata values because many of them provide source status, coverage limitations, or review context. Their content is scanned; the existence of a note field is not treated as a defect by itself.

## Placeholder review

The audited input graph contains 41 explicit `placeholder` values:

```text
Static racecourse placeholder values: 36
Generated schedule placeholder values: 5
Other or unclassified placeholder values: 0
```

These values are status markers, not verified meeting data and not coverage claims. A future increase requires review. The v1 candidate does not convert placeholders into factual schedule records.

## ID reconciliation

The initial country-page ID inventory still described four UAE racecourse IDs as reserved even though they are now present in the public registry:

```text
jebel-ali-racecourse
abu-dhabi-turf-club
sharjah-racecourse
al-ain-racecourse
```

A reviewed reconciliation file records the effective `reserved` to `registered` transition:

```text
data/static/country-page-id-inventory-01-12-reconciliation-v1.json
```

The reconciled checker temporarily applies those four reviewed transitions, runs the original ID inventory checker, and restores the original file byte-for-byte. The repository remains clean after validation.

## Data quality contract

The v1 data audit requires:

- the existing schema and reference validator to pass;
- every imported JSON file to parse;
- no duplicate IDs or slugs inside audited row files;
- no duplicate IDs or slugs after application-level entity merges;
- all URL values to be valid HTTP or HTTPS URLs;
- no prohibited participant, complete-racecard, betting, result, payout, or prediction keys;
- no internal workflow, parser-target, acquisition, candidate, PR-number, or dry-run language in public input data;
- all placeholders to remain explicit and classified;
- all note-like metadata to contain only public-safe context;
- the frozen v1 scope and completed Phase 11 release to remain valid;
- a complete static build and repository-clean proof.

## Verification

Permanent checker:

```text
scripts/check-v1-data-audit.mjs
```

Read-only Actions gate:

```text
.github/workflows/v1-data-audit.yml
```

The gate runs `npm run validate:data`, builds the complete static site, preserves the Phase 11 SEO release and v1 scope freeze, validates the reconciled country ID inventory, reruns the complete input-graph audit, and proves the repository remains clean.

## Public and privacy boundary

Allowed data remains limited to reviewed entity identities, official and reference source routes, public coverage status, explicit placeholders, public-safe notes, and the timetable fields permitted by the frozen publication ranks.

The audit does not add participant datasets, complete racecards, odds, results, payouts, predictions, betting advice, raw source bodies, visitor identifiers, interaction logs, analytics, cookies, client storage, automatic correction, automatic translation, automatic publication, scope expansion, or deployment.

## Next implementation unit

```text
V1-MOBILE-QA-01
```

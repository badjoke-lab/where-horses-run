# Country Adapter Template

This template is the reusable post-M3 / M4 entry point for adding a new country to the generated timetable pipeline.

It is documentation/template only. It does not add country data, public coverage, a live fetcher, source page parsing, UI behavior, or overlay replacement.

## Required safety boundary

Every future country adapter must preserve the existing `SafeSourceAdapter` safety policy from `src/lib/timetable/source-adapter.ts`:

```ts
storeSourceBody: false
storeRawMarkup: false
publishWithoutReview: false
allowedOutput: 'meeting_level_only'
```

The policy means:

- no live fetch by default
- no source page parsing by default
- no raw source body storage
- no raw markup storage
- no public publishing without review
- meeting-level candidate output only
- official source links remain final confirmation
- partial coverage must remain clearly labeled

Do not add racecards, odds, results, payouts, predictions, tips, public overlay replacement, or public complete-coverage claims as part of a country adapter PR.

## Standard M4 flow

Use this sequence for every future country addition.

### 1. Source inventory

Create a source inventory before generating any country data. The inventory must identify official source links, racing systems, racecourses, timezone assumptions, season windows, and known exclusions.

The inventory must also state whether coverage is partial coverage and which official source links remain final confirmation for users.

### 2. Safe source adapter / dry-run adapter

Create a safe source adapter or dry-run adapter that uses the shared adapter contract and safety policy. The adapter may accept manually reviewed source facts or fixture inputs, but it must not perform live fetch by default and must not parse source pages by default.

The adapter output must be meeting-level candidate records only.

### 3. Candidate JSON generation

Generate candidate JSON under the country/system file naming pattern below. Candidate files should remain review-oriented and must not be treated as public timetable coverage.

### 4. Candidate validator

Add a candidate validator for the generator. It should validate schema shape, required future country fields, the safety boundary, the candidate window, source metadata, confidence, notes, and review status.

### 5. Approved bundle generation

After candidate review, generate an approved bundle for the active window. Approved bundles still remain bounded by their review metadata and must not imply complete public coverage.

### 6. Cross-country validation

Run the shared cross-country candidate validator after adding or changing country candidate bundles. This protects common fields, active-window rules, country/system identifiers, and no-complete-coverage claims.

### 7. Human review

Human review is mandatory before promotion. Reviewers must compare candidate records against official source links, confirm timezone handling, mark confidence, write notes, and explicitly approve or reject promotion.

### 8. Optional overlay promotion only after review

Overlay promotion is optional and may happen only after human review. A promoted overlay must preserve partial coverage labeling, official source links as final confirmation, and the meeting-level-only boundary.

## Required future country fields

Future candidate records and bundles must carry enough metadata for review. The required fields for future country additions are:

- `country_id`
- `racing_system_id`
- `source_id`
- `source_url`
- `timezone`
- `candidate_window.start_date`
- `candidate_window.end_date_exclusive`
- `candidate_window.timezone`
- `racecourse_id`
- `racecourse_name`
- `racing_type`
- `source_checked_at`
- `confidence`
- `notes`

## Required future file naming pattern

Use lowercase country and system slugs. Prefer stable IDs that match the country inventory.

- `data/candidates/{country}-{system}-candidates.json`
- `scripts/generate-{country}-{system}-candidates.mjs`
- `scripts/check-{country}-{system}-candidate-generator.mjs`
- `data/candidates/{country}-active-window-approved-candidates.json`
- `scripts/generate-{country}-active-window-approved-candidates.mjs`
- `scripts/check-{country}-active-window-approved-candidates.mjs`
- `docs/runbooks/pr-XXX.md`

## Candidate JSON shape

Country adapters should emit `timetable-candidates-v0` files and follow the existing candidate schema. New countries must not invent raw-source, markup, racecard, odds, results, payout, prediction, or tip fields.

A future country candidate file should include:

```json
{
  "schema_version": "timetable-candidates-v0",
  "generated_at": "2026-05-30T00:00:00.000Z",
  "source_adapter_id": "{country}-{system}-adapter",
  "country_id": "{country}",
  "candidate_window": {
    "start_date": "YYYY-MM-DD",
    "end_date_exclusive": "YYYY-MM-DD",
    "timezone": "Area/City"
  },
  "records": [],
  "review": {
    "review_status": "needs_review",
    "reviewed_at": null,
    "reviewer": null,
    "summary": "Not approved for promotion.",
    "promotion_target": null
  }
}
```

Each record must include the required future country fields listed above plus existing candidate schema fields such as date, local start time, extraction method, status, and review status.

## Season-gap handling

Some countries or racing systems may have no safe active-window meetings during a reviewed window.

When no safe active-window meetings exist:

- `records` may be `[]`.
- Empty active-window bundles must clearly state `season gap` and `no active-window meetings` in review metadata or notes.
- Empty bundles must not be displayed or described as active public coverage.
- Empty bundles must preserve partial coverage labeling.
- Official source links remain final confirmation.

A season gap is not a failure. It is a reviewed state that says there are no safe active-window meetings to publish for that bounded window.

## PR checklist for future countries

Before opening a country adapter PR, confirm:

- source inventory exists and links official source links
- generator produces candidate JSON only
- validator checks the candidate JSON and safety boundary
- approved bundle generation is separate from candidate generation
- human review is documented before promotion
- partial coverage is clearly labeled
- season gap handling is present when applicable
- no live fetch by default
- no source page parsing by default
- no raw source body storage
- no raw markup storage
- no public publishing without review

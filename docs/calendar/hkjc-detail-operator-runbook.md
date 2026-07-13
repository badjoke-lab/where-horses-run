# HKJC detail operator runbook

Status: manual operator path  
Work ID: `WHR-CAL-HKJC-DETAIL-RECOVERY`  
Implementation unit: `HKJC-DETAIL-RECOVERY-01`

## What this operator does

This operator converts already reviewed, public-safe HKJC race timetable observations into a review package.

It produces:

- Candidate;
- Coverage Observation;
- Collection Result Manifest;
- Collection Report;
- input evidence digest.

It does not:

- fetch HKJC automatically;
- approve candidates;
- update Canonical data;
- update public data;
- deploy the site.

## Allowed input fields

Meeting fields:

- meeting ID;
- racecourse ID;
- date;
- whether Race 1 through the final race were fully checked.

Race fields:

- race number;
- post time;
- race name or null;
- distance in metres or null;
- surface or null;
- course label or null;
- official `https://racing.hkjc.com/...` source URL.

Do not enter:

- horse names;
- jockey or trainer names;
- draw, weight, rating, or equipment;
- odds or betting data;
- results or payouts;
- predictions or tips;
- raw HTML or source bodies;
- video or stream URLs.

## Input contract

The JSON root must use:

```json
{
  "schema_version": "calendar-hkjc-detail-reviewed-import-v1",
  "work_id": "WHR-CAL-HONG-KONG-HKJC",
  "implementation_unit": "HKJC-PILOT-06",
  "generated_at": "2026-07-13T00:00:00Z",
  "source_evidence": {
    "official_source_url": "https://racing.hkjc.com/en-us/local/information/racecard?racedate=YYYY/MM/DD&Racecourse=HV&RaceNo=1",
    "checked_at": "2026-07-13T00:00:00Z",
    "evidence_type": "official_page_manual_review"
  },
  "window": {
    "start_date": "YYYY-MM-DD",
    "end_date_exclusive": "YYYY-MM-DD",
    "timezone": "Asia/Hong_Kong"
  },
  "meetings": [],
  "review": {
    "state": "reviewed_public_safe",
    "reviewed_at": "2026-07-13T00:00:00Z",
    "reviewer": "operator-name"
  }
}
```

Each meeting must contain one or more race rows. Set `meeting_complete` to true only after the operator has checked that all races in the meeting are represented continuously from Race 1.

## Prepare the workflow input

Save the reviewed JSON outside the repository, for example:

```text
/tmp/hkjc-reviewed-input.json
```

Encode it as one Base64 line.

macOS or Linux:

```bash
base64 < /tmp/hkjc-reviewed-input.json | tr -d '\n'
```

Copy the resulting string.

## Run the GitHub Actions operator

1. Open the repository Actions page.
2. Select **Calendar HKJC detail operator**.
3. Choose **Run workflow**.
4. Paste the Base64 string into `reviewed_input_base64`.
5. Enter stable kebab-case IDs, for example:

```text
batch_id: hkjc-2026-07-15-detail-review
campaign_id: hkjc-manual-detail-operations
job_id: hkjc-2026-07-15-detail-review-job
```

6. Run the workflow.

The workflow has `contents: read`; it cannot commit or alter repository data.

## Review the output

Download the artifact named:

```text
hkjc-detail-review-{batch_id}-{run_id}
```

Check:

- `candidates.json` contains only the intended meeting;
- rank is consistent with the available fields;
- first and last race times are correct;
- A or A+ rows are continuous from Race 1;
- `coverage-observation.json` has honest unresolved state;
- `collection-result-manifest.json` rank totals close;
- `collection-report.json` shows no network, Canonical, public, or publication effect;
- `input-evidence.json` contains the expected official URL and SHA-256-bound input evidence.

## Rank interpretation

- C: no race time;
- B: Race 1 time only;
- B+: first and last time only;
- A: complete Race 1-N labels and post times;
- A+: A plus programme-summary metadata.

HKJC public output remains capped at A even when the technical candidate is A+.

## Failure handling

Do not alter Canonical or public JSON by hand.

When the workflow fails:

1. read the failed step;
2. correct the external input;
3. use a new batch ID;
4. run the operator again;
5. retain the failed run as audit evidence.

Common failures:

- unofficial hostname;
- missing race row;
- duplicate race number;
- meeting date outside the requested window;
- pending review state;
- prohibited field;
- invalid stable ID;
- malformed Base64 or JSON.

## Current stop point

A successful run creates review artifacts only.

The next implementation unit, `HKJC-DETAIL-RECOVERY-02`, connects selected-meeting retry ownership and reviewed promotion. Until then, the operator package must not be copied directly into Canonical or public data.

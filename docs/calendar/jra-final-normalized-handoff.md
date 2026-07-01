# JRA final normalized handoff

Status: implemented foundation  
Work ID: `WHR-CAL-JAPAN-JRA`  
Implemented: 2026-07-01

## Purpose

An approved JRA final-program fixture must not write directly to candidate, canonical, or public datasets.

```text
planned programme
-> final confirmation
-> human approval
-> normalized handoff artifact
-> reviewed normalized-file update
-> existing candidate generator
-> separate promotion
```

## Output

The handoff contains:

- `jra-normalized-timetable-v0` meeting data;
- `jra-normalized-meeting-details-v0` detail data;
- the final-confirmation decision;
- the existing candidate-generator command;
- a required `needs_review` candidate state;
- explicit no-write boundaries.

Technical Rank comes from Calendar Readiness. Official links use the canonical JRA host. Missing reviewed optional fields remain null, are listed in `missing_fields`, and receive `metadata_status: partial`.

## CLI

```text
node scripts/timetable/build-jra-final-normalized-handoff.mjs \
  --final /path/to/reviewed-final.json \
  --output /tmp/jra-final-normalized-handoff.json
```

Use `--dry-run` for a summary. The output must be outside the repository.

## Boundary

The tool does not fetch JRA pages, update committed normalized files, run or approve the candidate generator, write canonical/public data, enable scheduling, or publish.

The handoff artifact is reviewed before the two normalized files are changed in a separate pull request.

## Validation

```text
node scripts/check-jra-final-normalized-handoff.mjs
```

Validation covers complete and partial optional fields, unreviewed and pre-cutoff fixtures, invalid hosts, meeting/detail parity, external output, repository-output rejection, and candidate/public data immutability.

No actual final JRA fixture is committed by this foundation.

# JRA final review package

Status: implemented foundation  
Work ID: `WHR-CAL-JAPAN-JRA`  
Implemented: 2026-07-01

## Purpose

This package is the operator entry point for an external JRA final-program fixture.

```text
external final fixture
-> final-intake validation
-> final confirmation
-> optional normalized handoff
-> external review package
```

It does not commit or publish the fixture.

## CLI

```text
node scripts/timetable/build-jra-final-review-package.mjs \
  --final /tmp/jra-final-program.json \
  --output /tmp/jra-final-review-package.json
```

Use `--dry-run` for a decision summary. Input and output must both be outside the repository.

## Decision states

- Structurally invalid input fails before package creation.
- Valid input awaiting review records `human_review_required` and contains no normalized handoff.
- Valid input with timing or freshness blockers contains no normalized handoff.
- Approved input with no blockers includes the normalized meeting/detail handoff.

Even the approved package does not update committed normalized files or run the candidate generator. The next step is a separate reviewed pull request, and any candidate remains `needs_review`.

## Input digest

The package records the external fixture filename and SHA-256 digest. It does not copy a source body or private capture into the repository.

## Boundary

The package builder does not fetch official pages, write repository files, generate or approve candidates, write canonical/public data, create a pull request, enable scheduling, or publish.

## Validation

```text
node scripts/check-jra-review-package.mjs
```

Validation covers pending, approved, pre-cutoff, and structurally invalid fixtures; external input/output; repository-local path rejection; normalized handoff inclusion; digest recording; and candidate/public data immutability.

## Current state

No actual final JRA fixture or final review package is committed. This foundation is used only after official final-program review.

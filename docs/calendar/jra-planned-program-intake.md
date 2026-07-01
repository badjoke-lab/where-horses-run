# JRA planned-program intake

Status: active pilot stage  
Work ID: `WHR-CAL-JAPAN-JRA`  
Checked: 2026-07-01

## Purpose

This stage records the official JRA advance programme for July 4–5, 2026 without treating it as final.

The six meetings are Fukushima, Kokura, and Hakodate on both days. Each meeting contains 12 race labels and scheduled post times. Optional programme fields remain null.

## Stage

```text
source_stage: planned_program
review_status: needs_final_confirmation
promotion_eligible: false
```

JRA notes that the advance schedule may change and directs users to the later race menu for the latest information. Candidate generation therefore requires a separate final-program review.

## Review result

The July 1 source check is newer than the current registry minimum. Candidate generation remains blocked because the source stage is not final. A separate racecourse-scope review is also required when the current readiness record does not include Fukushima, Kokura, and Hakodate.

## Commands

```text
node scripts/timetable/build-jra-planned-program-intake.mjs
node scripts/timetable/build-jra-planned-program-review.mjs
node scripts/check-jra-planned-intake.mjs
```

## Boundary

The intake stores the meeting date, racecourse, race label, and scheduled post time only. It does not create a candidate, write canonical data, change public projection data, enable scheduling, or publish.

## Next action

After the final JRA programme becomes available, repeat official review, resolve racecourse scope, generate a final-program intake, and only then create a new Pipeline v1 candidate.

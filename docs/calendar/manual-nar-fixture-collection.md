# Manual NAR complete-fixture collection

Status: active operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Purpose

This command collects one reviewed complete meeting fixture for each of the fourteen NAR flat-racing racecourses. It does not publish NAR meetings and does not write candidate, canonical, or public data.

## Run

From the repository root:

```bash
sh ./collect-nar-fixtures-manual
```

The launcher creates an isolated temporary checkout. Local uncommitted work and the original working tree are not used or modified.

## Racecourse scope

The command checks all fourteen flat-racing racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains outside this command and is handled by the separate Banei Work ID.

## What the command does

1. updates an isolated checkout from `origin/main`;
2. reads `data/static/nar-flat-racecourse-compatibility-v1.json`;
3. fetches one completed official RaceList page for every racecourse;
4. independently discovers the complete race-number set from official links and page labels;
5. parses every RaceList row;
6. fetches every corresponding official DebaTable page;
7. retains only public-safe schedule metadata and source trace fields;
8. rejects missing, duplicated, or non-continuous race numbers;
9. rejects any race missing label, post time, race name, distance, surface, or course label;
10. requires exactly fourteen complete fixtures;
11. validates that no candidate, canonical, public, or runtime import changed;
12. builds the static site;
13. pushes only the fourteen fixture files and one diagnostic report to a review PR.

## Output

```text
data/fixtures/timetable/nar/complete-meetings/*.json
data/generated/timetable/nar-complete-fixture-report.json
```

Every fixture remains:

```text
review.status: needs_review
review.promotion_eligible: false
```

## Failure behavior

The command creates no PR unless all fourteen racecourses produce complete fixtures. A source failure, parser gap, non-continuous race sequence, missing A+ field, unexpected changed file, runtime-boundary failure, dependency failure, or build failure stops the run.

The temporary checkout is deleted after the run. Existing production data remains unchanged.

## After the fixture PR

The fixture PR is reviewed for all fourteen racecourses. Only after 14/14 fixture approval does the project proceed to selected-month collection of every actual meeting and later human-reviewed candidate promotion.

# Glossary beginner explanations

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-BEGINNER-EXPLANATIONS-01`

Last reviewed: 2026-07-16

## Purpose

Complete the English and Japanese beginner-explanation layer for every released glossary concept without changing the canonical definitions, concept IDs, routes, categories, evidence status, or public-data boundaries.

## Baseline

Before this unit, 29 of the 48 glossary records had paired English and Japanese beginner explanations. Nineteen records still had both fields unset.

The missing records consisted of:

- ten racing-type concepts;
- one racecourse concept;
- eight surface and course-layout concepts.

The glossary already had 96 bilingual term routes and two bilingual relationship-graph routes.

## Implemented coverage

This unit adds reviewed English and Japanese explanations for:

1. Thoroughbred flat racing;
2. Flat racing;
3. Jump racing;
4. Steeplechase;
5. Harness racing;
6. Trotting;
7. Pacing;
8. Arabian racing;
9. Quarter Horse racing;
10. Banei racing;
11. Racecourse;
12. Turf;
13. Dirt;
14. All-weather;
15. Jump course;
16. Left-handed course;
17. Right-handed course;
18. Both-directions course;
19. Straight course.

After the patch, all 48 glossary records have paired beginner explanations and all 96 bilingual term pages render them.

## Writing policy

A beginner explanation is not a shortened copy of the summary. It should answer the first practical question a new reader is likely to have and preserve important distinctions between related concepts.

Examples of preserved distinctions include:

- a racing type versus a horse breed;
- a racing type versus a surface;
- trotting versus pacing;
- jump racing versus a jump-course layout;
- a racecourse venue versus its operator or authority;
- a straight course versus only the home straight;
- an all-weather surface versus a claim that weather has no effect.

English and Japanese explanations are reviewed as a pair. Silent fallback, automatic translation, and automatic text generation remain disabled.

## User-visible behavior

Every English glossary detail page now always renders a `Beginner explanation` section.

Every Japanese glossary detail page now always renders a `初心者向け説明` section.

Each page also carries the machine-readable marker:

```html
 data-glossary-beginner-explanation="reviewed"
```

No glossary URL changes. The relationship graph, aliases, readings, category labels, source boundaries, and reviewed definitions remain available as before.

## Public boundary

The explanations describe terminology only. They do not provide betting advice, predictions, participant datasets, odds, results, payouts, complete racecards, or copied source bodies.

This unit performs no live fetch, parser execution, source acceptance, automatic publication, or deployment.

## Validation

The permanent gate:

- reconstructs the pre-patch glossary and confirms exactly 19 missing explanation pairs;
- verifies that the patch covers those 19 IDs and no others;
- confirms all 48 final records have non-empty English and Japanese explanations;
- rejects unpaired fields, summary copies, whitespace errors, and HTML markup;
- verifies that no concept ID, route, category, relationship, or public boundary changes;
- builds the 96 bilingual term routes and two relationship-graph routes;
- verifies the reviewed marker and explanation text in every rendered detail page;
- preserves all earlier glossary release contracts;
- proves the repository remains clean.

## Next unit

`GLOSSARY-QA-RELEASE-01` will perform the final glossary release audit and freeze the v1 public contract.
